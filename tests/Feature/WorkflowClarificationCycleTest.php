<?php

namespace Tests\Feature;

use App\Domain\Workflow\ClarificationContract;
use App\Models\TransactionEvent;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\WorkflowClarificationService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

/**
 * Isolated contract tests only; they do not assert that any HTTP action,
 * database mutation, notification, or municipality policy is live.
 */
class WorkflowClarificationCycleTest extends TestCase
{
    private function transaction(string $status = 'for_review', int $current = 2): WorkflowTransaction
    {
        $transaction = new WorkflowTransaction([
            'origin_department_id' => 1,
            'current_department_id' => $current,
            'status' => $status,
        ]);
        $transaction->id = 20;

        return $transaction;
    }

    private function event(int $id = 9, string $action = 'mark_review'): TransactionEvent
    {
        $event = new TransactionEvent([
            'transaction_id' => 20,
            'action' => $action,
            'from_department_id' => 2,
            'to_department_id' => 1,
        ]);
        $event->id = $id;

        return $event;
    }

    public function test_request_requires_reason_and_rejects_same_origin_no_op(): void
    {
        $contract = new ClarificationContract();

        try {
            $contract->assertRequest($this->transaction(), 'request_information', null, 9, $this->event());
            $this->fail('Expected a missing-information reason to be rejected.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('remarks', $exception->errors());
        }

        try {
            $contract->assertRequest($this->transaction(current: 1), 'return_origin', 'Correction needed', 9, $this->event());
            $this->fail('Expected an origin-to-origin return to be rejected.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('action', $exception->errors());
        }
    }

    public function test_request_disallows_repeated_pending_cycle_and_stale_history(): void
    {
        $contract = new ClarificationContract();

        foreach (['returned', 'information_requested', 'for_approval'] as $status) {
            try {
                $contract->assertRequest($this->transaction($status), 'request_information', 'Missing annex', 9, $this->event());
                $this->fail('Expected repeated/pending/approval action to be rejected.');
            } catch (ValidationException $exception) {
                $this->assertArrayHasKey('action', $exception->errors());
            }
        }

        try {
            $contract->assertRequest($this->transaction(), 'return_origin', 'Fix annex', 8, $this->event());
            $this->fail('Expected stale event version to be rejected.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('expected_event_id', $exception->errors());
        }

        $contract->assertRequest($this->transaction(), 'request_information', 'Specify missing annex', 9, $this->event());
        $this->assertTrue(true);
    }

    public function test_response_requires_correlated_pending_event_and_actual_response(): void
    {
        $contract = new ClarificationContract();
        $pending = $this->transaction('information_requested', current: 1);
        $request = $this->event(action: 'request_information');

        try {
            $contract->assertResponse($pending, $request, $request, 9, ' ');
            $this->fail('Expected an empty response to be rejected.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('response_text', $exception->errors());
        }

        try {
            $contract->assertResponse($pending, $request, $this->event(10), 9, 'Updated figures');
            $this->fail('Expected stale/superseded request to be rejected.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('expected_event_id', $exception->errors());
        }

        try {
            $contract->assertResponse($pending, $request, $request, 9, 'Corrected figures', hasEvidence: true);
            $this->fail('Expected a documentary version to be identified.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('document_version', $exception->errors());
        }

        $contract->assertResponse($pending, $request, $request, 9, 'Corrected figures', 'revision-2', true);
        $this->assertTrue(true);
    }

    public function test_response_and_review_resume_remain_disabled_without_municipal_authority(): void
    {
        $service = app(WorkflowClarificationService::class);
        $user = new User();
        $transaction = $this->transaction('information_requested', current: 1);

        try {
            $service->submitResponse($user, $transaction, ['response_text' => 'Synthetic correction']);
            $this->fail('A response must remain disabled.');
        } catch (AuthorizationException) {
            $this->assertTrue(true);
        }

        try {
            $service->resumeReview($user, $transaction, 9);
            $this->fail('Review resumption must remain disabled.');
        } catch (AuthorizationException) {
            $this->assertTrue(true);
        }
    }
}
