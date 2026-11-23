<?php

namespace Tests\Feature\WorkRequests;

use App\Models\User;
use App\Services\TransactionLiveQuery;
use App\Services\TransactionWorkflowService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class WorkRequestAllowedActionsAndInformationRoundtripTest extends TestCase
{
    use RefreshDatabase;

    public function test_allowed_actions_matrix_reflects_exact_workflow_state_and_actor_authority(): void
    {
        $this->seed();

        $originHead = User::query()->where('email', 'engineering@talibon.demo')->firstOrFail();
        $receivingHead = User::query()->where('email', 'planning@talibon.demo')->firstOrFail();
        $mayor = User::query()->where('email', 'mayor@talibon.demo')->firstOrFail();
        $admin = User::query()->where('email', 'admin@talibon.demo')->firstOrFail();

        $workflow = app(TransactionWorkflowService::class);
        $query = app(TransactionLiveQuery::class);

        $transaction = $workflow->create($originHead, [
            'transaction_type' => 'internal_request',
            'title' => 'Action matrix verification work request',
            'priority' => 'normal',
            'target_department_id' => $receivingHead->employee->department_id,
            'action_required' => 'For Information',
        ]);

        // 1. In 'submitted' state: receiving head can mark_review, assign, forward, return_origin, request_information; cannot close or send_to_mayor yet
        $submittedSnapshot = $query->snapshot($receivingHead, $transaction);
        $this->assertTrue($submittedSnapshot['allowedActions']['mark_review']['allowed']);
        $this->assertFalse($submittedSnapshot['allowedActions']['close']['allowed']);
        $this->assertFalse($submittedSnapshot['allowedActions']['send_to_mayor']['allowed']);
        $this->assertTrue($submittedSnapshot['allowedActions']['request_information']['allowed']);
        $this->assertTrue($submittedSnapshot['allowedActions']['return_origin']['allowed']);
        $this->assertFalse($submittedSnapshot['allowedActions']['approve']['allowed']);

        // Technical admin has zero workflow transition actions (#185)
        $adminSnapshot = $query->snapshot($admin, $transaction);
        foreach ($adminSnapshot['allowedActions'] as $actionKey => $rule) {
            $this->assertFalse($rule['allowed'], "system_admin must not be allowed [{$actionKey}]");
        }

        // 2. Transition to 'for_review': mark_review becomes disallowed (preventing OT-QA-R1-001 repeat self-transition), send_to_mayor becomes allowed
        $transaction = $workflow->transition($receivingHead, $transaction, 'mark_review');
        $reviewSnapshot = $query->snapshot($receivingHead, $transaction);
        $this->assertFalse($reviewSnapshot['allowedActions']['mark_review']['allowed']);
        $this->assertTrue($reviewSnapshot['allowedActions']['send_to_mayor']['allowed']);

        // 3. Request information routes back to origin with status 'information_requested'
        $transaction = $workflow->transition(
            $receivingHead,
            $transaction,
            'request_information',
            remarks: 'Please attach the updated drainage cross-section estimate.',
        );
        $this->assertSame('information_requested', $transaction->status);
        $this->assertSame($originHead->employee->department_id, $transaction->current_department_id);

        // Origin head now holds current custody and can mark_review or forward back to receiving office with response remarks
        $originSnapshot = $query->snapshot($originHead, $transaction);
        $this->assertTrue($originSnapshot['allowedActions']['mark_review']['allowed']);
        $this->assertTrue($originSnapshot['allowedActions']['forward']['allowed']);

        // Origin responds by forwarding back to receiving office
        $transaction = $workflow->transition(
            $originHead,
            $transaction,
            'forward',
            targetDepartmentId: $receivingHead->employee->department_id,
            remarks: 'Attached updated drainage cross-section estimate as requested.',
        );
        $this->assertSame('submitted', $transaction->status);
        $this->assertSame($receivingHead->employee->department_id, $transaction->current_department_id);

        // Receiving office marks for review and sends to Mayor
        $transaction = $workflow->transition($receivingHead, $transaction, 'mark_review');
        $transaction = $workflow->transition($receivingHead, $transaction, 'send_to_mayor');
        $this->assertSame('for_approval', $transaction->status);

        $mayorSnapshot = $query->snapshot($mayor, $transaction);
        $this->assertTrue($mayorSnapshot['allowedActions']['approve']['allowed']);
        $this->assertTrue($mayorSnapshot['allowedActions']['disapprove']['allowed']);
        $this->assertTrue($mayorSnapshot['allowedActions']['request_information']['allowed']);
        $this->assertFalse($mayorSnapshot['allowedActions']['mark_review']['allowed']);
    }
}
