<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\TransactionWorkflowService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

/**
 * R3 Slot02 source candidate, with synthetic-only evidence bypass.
 * Never construe these core tests as policy or uploaded-evidence acceptance.
 */
class WorkRequestOrdinaryCompletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_normal_completion_is_disabled_without_municipal_authority(): void
    {
        [$workflow, $request, $receiver] = $this->reviewedRequest();

        $this->assertValidation(
            fn () => $workflow->transition($receiver, $request, 'complete', remarks: 'Reviewed and fulfilled.'),
            'action',
        );

        $this->assertSame('for_review', $request->fresh()->status);
        $this->assertNull($request->fresh()->completed_at);
        $this->assertNull($request->fresh()->closed_at);
        $this->assertSame(2, $request->events()->count());
    }

    public function test_evidence_adapter_hold_survives_explicit_role_configuration(): void
    {
        [$workflow, $request, $receiver] = $this->reviewedRequest();
        $this->permitSyntheticCompletion(false);

        $this->assertValidation(
            fn () => $workflow->transition($receiver, $request, 'complete', remarks: 'Reviewed and fulfilled.'),
            'evidence',
        );

        $this->assertSame('for_review', $request->fresh()->status);
        $this->assertNull($request->fresh()->completed_at);
    }

    public function test_synthetic_core_completion_persists_terminal_event_and_origin_notification(): void
    {
        [$workflow, $request, $receiver, $origin, $destination] = $this->reviewedRequest();
        $this->permitSyntheticCompletion();

        $result = 'Completed the requested interoffice processing with documented result.';
        $completed = $workflow->transition($receiver, $request, 'complete', remarks: $result);

        $this->assertSame('closed', $completed->status);
        $this->assertNotNull($completed->completed_at);
        $this->assertNotNull($completed->closed_at);
        $this->assertSame(
            $completed->completed_at->format('Y-m-d H:i:s.u'),
            $completed->closed_at->format('Y-m-d H:i:s.u'),
        );
        $this->assertSame((int) $destination->id, (int) $completed->current_department_id);
        $this->assertSame((int) $origin->id, (int) $completed->origin_department_id);
        $this->assertFalse(WorkflowTransaction::query()->pending()->whereKey($request->id)->exists());
        $this->assertTrue(WorkflowTransaction::query()->completed()->whereKey($request->id)->exists());

        $event = $request->events()->where('action', 'complete')->sole();
        $this->assertSame((int) $receiver->id, (int) $event->actor_user_id);
        $this->assertSame((int) $destination->id, (int) $event->from_department_id);
        $this->assertSame((int) $destination->id, (int) $event->to_department_id);
        $this->assertSame('for_review', $event->previous_status);
        $this->assertSame('closed', $event->new_status);
        $this->assertSame($result, $event->remarks);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'transaction.complete',
            'entity_id' => $request->id,
        ]);
        $this->assertDatabaseHas('platform_notifications', [
            'event_key' => 'transaction-event-'.$event->id,
            'department_id' => $origin->id,
        ]);
    }

    public function test_originating_office_and_unlisted_receiver_role_cannot_close(): void
    {
        [$workflow, $request, $receiver, $origin, $destination, $creator] = $this->reviewedRequest();
        $this->permitSyntheticCompletion();

        $this->assertAuthorization(
            fn () => $workflow->transition($creator, $request, 'complete', remarks: 'Attempted from origin office.'),
        );

        $receiver->forceFill(['role' => 'department_staff'])->save();
        $this->assertAuthorization(
            fn () => $workflow->transition($receiver->fresh(), $request, 'complete', remarks: 'Attempted by unlisted staff.'),
        );

        $this->assertSame('for_review', $request->fresh()->status);
        $this->assertSame(2, $request->events()->count());
    }

    public function test_system_administrator_does_not_inherit_ordinary_closure_authority(): void
    {
        [$workflow, $request, $receiver] = $this->reviewedRequest();
        $this->permitSyntheticCompletion();
        config()->set('workflow.ordinary_completion.allowed_roles', ['department_head', 'system_admin']);

        $receiver->forceFill(['role' => 'system_admin'])->save();
        $this->assertAuthorization(
            fn () => $workflow->transition($receiver->fresh(), $request, 'complete', remarks: 'An administrator cannot infer this power.'),
        );
        $this->assertSame('for_review', $request->fresh()->status);
    }

    public function test_missing_result_and_unexpected_routing_fields_are_rejected(): void
    {
        [$workflow, $request, $receiver, $origin, $destination] = $this->reviewedRequest();
        $this->permitSyntheticCompletion();

        $this->assertValidation(
            fn () => $workflow->transition($receiver, $request, 'complete', remarks: ' '),
            'remarks',
        );
        $this->assertValidation(
            fn () => $workflow->transition($receiver, $request, 'complete', targetDepartmentId: (int) $origin->id, remarks: 'Documented result present.'),
            'action',
        );
        $this->assertSame('for_review', $request->fresh()->status);
    }

    public function test_invalid_state_and_duplicate_completion_do_not_record_another_terminal_event(): void
    {
        [$workflow, $request, $receiver] = $this->submittedRequest();
        $this->permitSyntheticCompletion();

        $this->assertValidation(
            fn () => $workflow->transition($receiver, $request, 'complete', remarks: 'Cannot close a submitted request.'),
            'action',
        );

        $workflow->transition($receiver, $request, 'mark_review', remarks: 'Office work reviewed.');
        $workflow->transition($receiver, $request, 'complete', remarks: 'Office processing completed.');
        $events = $request->events()->count();

        $this->assertValidation(
            fn () => $workflow->transition($receiver, $request, 'complete', remarks: 'Duplicate completion replay.'),
            'action',
        );
        $this->assertSame($events, $request->events()->count());
        $this->assertSame('closed', $request->fresh()->status);
    }

    public function test_stale_completion_after_forwarding_is_denied_without_a_close_event(): void
    {
        [$workflow, $request, $receiver] = $this->reviewedRequest();
        $this->permitSyntheticCompletion();
        $mayor = Department::query()->where('code', 'MAYOR')->firstOrFail();

        $workflow->transition(
            $receiver,
            $request,
            'forward',
            targetDepartmentId: (int) $mayor->id,
            remarks: 'Routing to another office before any final result.',
        );

        // Keep the old for_review model intentionally: the persisted row has
        // already moved to the other receiving office.
        $this->assertAuthorization(
            fn () => $workflow->transition($receiver, $request, 'complete', remarks: 'Obsolete stale completion attempt.'),
        );
        $this->assertSame('submitted', $request->fresh()->status);
        $this->assertFalse($request->events()->where('action', 'complete')->exists());
    }

    public function test_terminal_closure_rejects_unrelated_mutations(): void
    {
        [$workflow, $request, $receiver] = $this->reviewedRequest();
        $this->permitSyntheticCompletion();
        $workflow->transition($receiver, $request, 'complete', remarks: 'Completed synthetic ordinary work.');
        $count = $request->events()->count();

        $this->assertValidation(
            fn () => $workflow->transition($receiver, $request, 'mark_review', remarks: 'Attempted reopening through review.'),
            'action',
        );
        $this->assertSame('closed', $request->fresh()->status);
        $this->assertSame($count, $request->events()->count());
    }

    public function test_inactive_receiver_is_denied_even_after_prior_review(): void
    {
        [$workflow, $request, $receiver] = $this->reviewedRequest();
        $this->permitSyntheticCompletion();

        $receiver->forceFill(['is_active' => false])->save();
        $this->assertAuthorization(
            fn () => $workflow->transition($receiver->fresh(), $request, 'complete', remarks: 'Invalid deactivated actor completion.'),
        );
        $this->assertSame('for_review', $request->fresh()->status);
    }

    /**
     * @return array{TransactionWorkflowService, WorkflowTransaction, User, Department, Department, User}
     */
    private function submittedRequest(): array
    {
        $this->seed();

        $creator = User::query()->where('email', 'engineering@talibon.demo')->with('employee.department')->firstOrFail();
        $receiver = User::query()->where('email', 'budget@talibon.demo')->with('employee.department')->firstOrFail();
        $receiver->forceFill(['role' => 'department_head'])->save();
        $origin = $creator->employee->department;
        $destination = Department::query()->where('code', 'BUDGET')->firstOrFail();

        $workflow = app(TransactionWorkflowService::class);
        $request = $workflow->create($creator, [
            'transaction_type' => 'internal_request',
            'title' => 'R3 synthetic interoffice completion '.uniqid('', true),
            'description' => 'Synthetic technical contract only, no municipal approval.',
            'priority' => 'normal',
            'target_department_id' => $destination->id,
            'remarks' => 'New interoffice request.',
        ]);

        return [$workflow, $request, $receiver->fresh(['employee.department']), $origin, $destination, $creator];
    }

    /**
     * @return array{TransactionWorkflowService, WorkflowTransaction, User, Department, Department, User}
     */
    private function reviewedRequest(): array
    {
        [$workflow, $request, $receiver, $origin, $destination, $creator] = $this->submittedRequest();
        $workflow->transition($receiver, $request, 'mark_review', remarks: 'Review of work has started.');

        return [$workflow, $request->fresh(), $receiver, $origin, $destination, $creator];
    }

    private function permitSyntheticCompletion(bool $evidenceBypass = true): void
    {
        config()->set('workflow.ordinary_completion.enabled', true);
        config()->set('workflow.ordinary_completion.allowed_roles', ['department_head']);
        config()->set('workflow.ordinary_completion.synthetic_without_evidence', $evidenceBypass);
    }

    private function assertAuthorization(callable $mutation): void
    {
        try {
            $mutation();
            $this->fail('Expected ordinary completion authorization denial.');
        } catch (AuthorizationException) {
            $this->assertTrue(true);
        }
    }

    private function assertValidation(callable $mutation, string $field): void
    {
        try {
            $mutation();
            $this->fail('Expected ordinary completion validation denial.');
        } catch (ValidationException $error) {
            $this->assertArrayHasKey($field, $error->errors());
        }
    }
}
