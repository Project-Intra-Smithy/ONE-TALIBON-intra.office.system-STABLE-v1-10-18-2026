<?php

namespace Tests\Feature;

use App\Domain\Workflow\Events\WorkflowTransactionTransitioned;
use App\Models\Department;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\TransactionWorkflowService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Tests\TestCase;

class WorkflowHardeningTest extends TestCase
{
    use RefreshDatabase;

    public function test_direct_service_transition_enforces_actor_authorization(): void
    {
        $this->seed();

        $engineering = $this->user('engineering@talibon.demo');
        $employee = $this->user('employee@talibon.demo');
        $budget = $this->department('BUDGET');
        $transaction = $this->transaction($engineering, $budget, 'submitted');

        try {
            app(TransactionWorkflowService::class)->transition(
                $employee,
                $transaction,
                'mark_review',
            );
            $this->fail('Expected service-level workflow authorization to reject the actor.');
        } catch (AuthorizationException) {
            $this->assertSame('submitted', $transaction->fresh()->status);
            $this->assertSame(0, $transaction->events()->count());
        }
    }

    public function test_executive_decision_cannot_skip_required_approval_state(): void
    {
        $this->seed();

        $admin = $this->user('admin@talibon.demo');
        $engineering = $this->user('engineering@talibon.demo');
        $mayor = $this->department('MAYOR');
        $transaction = $this->transaction($engineering, $mayor, 'submitted');

        try {
            app(TransactionWorkflowService::class)->transition(
                $admin,
                $transaction,
                'approve',
            );
            $this->fail('Expected approve from submitted to be rejected.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('action', $exception->errors());
            $this->assertSame('submitted', $transaction->fresh()->status);
            $this->assertNull($transaction->fresh()->completed_at);
        }
    }

    public function test_duplicate_review_transition_is_rejected_without_second_event(): void
    {
        $this->seed();

        $engineering = $this->user('engineering@talibon.demo');
        $budgetUser = $this->user('budget@talibon.demo');
        $budget = $this->department('BUDGET');
        $transaction = $this->transaction($engineering, $budget, 'submitted');
        $workflow = app(TransactionWorkflowService::class);

        $reviewing = $workflow->transition(
            $budgetUser,
            $transaction,
            'mark_review',
            remarks: 'Review started.',
        );

        $this->assertSame('for_review', $reviewing->status);
        $this->assertSame(1, $reviewing->events()->count());

        try {
            $workflow->transition(
                $budgetUser,
                $reviewing,
                'mark_review',
                remarks: 'Duplicate review attempt.',
            );
            $this->fail('Expected duplicate review transition to be rejected.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('action', $exception->errors());
        }

        $this->assertSame('for_review', $transaction->fresh()->status);
        $this->assertSame(1, $transaction->events()->count());
    }

    public function test_assignment_event_records_before_and_after_employee_ids(): void
    {
        $this->seed();

        $engineering = $this->user('engineering@talibon.demo');
        $budgetUser = $this->user('budget@talibon.demo');
        $budget = $this->department('BUDGET');
        $transaction = $this->transaction($engineering, $budget, 'submitted');

        app(TransactionWorkflowService::class)->transition(
            $budgetUser,
            $transaction,
            'assign',
            assignedEmployeeId: $budgetUser->employee->id,
            remarks: 'Assign accountable owner.',
        );

        $event = $transaction->events()->where('action', 'assign')->sole();

        $this->assertNull($event->from_assigned_employee_id);
        $this->assertSame(
            (int) $budgetUser->employee->id,
            (int) $event->to_assigned_employee_id,
        );
        $this->assertSame(
            (int) $budgetUser->employee->id,
            (int) $transaction->fresh()->assigned_employee_id,
        );
    }

    public function test_listener_failure_rolls_back_status_and_history_atomically(): void
    {
        $this->seed();

        $engineering = $this->user('engineering@talibon.demo');
        $budgetUser = $this->user('budget@talibon.demo');
        $budget = $this->department('BUDGET');
        $transaction = $this->transaction($engineering, $budget, 'submitted');

        Event::listen(
            WorkflowTransactionTransitioned::class,
            static fn (): never => throw new RuntimeException('forced workflow rollback'),
        );

        try {
            app(TransactionWorkflowService::class)->transition(
                $budgetUser,
                $transaction,
                'mark_review',
                remarks: 'This transition must roll back.',
            );
            $this->fail('Expected forced workflow rollback.');
        } catch (RuntimeException $exception) {
            $this->assertSame('forced workflow rollback', $exception->getMessage());
        }

        $transaction->refresh();
        $this->assertSame('submitted', $transaction->status);
        $this->assertSame(0, $transaction->events()->count());
        $this->assertDatabaseMissing('audit_logs', [
            'action' => 'transaction.mark_review',
            'entity_id' => $transaction->id,
        ]);
    }

    public function test_model_scopes_and_predicates_match_work_request_state(): void
    {
        $this->seed();

        $engineering = $this->user('engineering@talibon.demo');
        $budgetUser = $this->user('budget@talibon.demo');
        $budget = $this->department('BUDGET');

        $pending = $this->transaction($engineering, $budget, 'submitted');
        $pending->update(['assigned_employee_id' => $budgetUser->employee->id]);
        $completed = $this->transaction($engineering, $budget, 'approved');
        $completed->update(['completed_at' => now()]);

        $this->assertTrue($pending->fresh()->isAssigned());
        $this->assertFalse($pending->fresh()->isTerminal());
        $this->assertTrue($completed->fresh()->isTerminal());

        $this->assertTrue(WorkflowTransaction::query()->pending()->whereKey($pending->id)->exists());
        $this->assertFalse(WorkflowTransaction::query()->pending()->whereKey($completed->id)->exists());
        $this->assertTrue(WorkflowTransaction::query()->completed()->whereKey($completed->id)->exists());
        $this->assertTrue(WorkflowTransaction::query()->forOffice($budget->id)->whereKey($pending->id)->exists());
        $this->assertTrue(WorkflowTransaction::query()
            ->assignedTo($budgetUser->employee->id)
            ->whereKey($pending->id)
            ->exists());
    }

    private function user(string $email): User
    {
        return User::query()
            ->where('email', $email)
            ->with('employee.department')
            ->firstOrFail();
    }

    private function department(string $code): Department
    {
        return Department::query()->where('code', $code)->firstOrFail();
    }

    private function transaction(
        User $creator,
        Department $currentDepartment,
        string $status,
    ): WorkflowTransaction {
        return WorkflowTransaction::query()->create([
            'reference_no' => 'HARDEN-'.uniqid(),
            'transaction_type' => 'internal_request',
            'title' => 'Backend hardening fixture '.uniqid(),
            'priority' => 'normal',
            'origin_department_id' => $creator->employee->department_id,
            'current_department_id' => $currentDepartment->id,
            'created_by_user_id' => $creator->id,
            'status' => $status,
            'received_at' => now(),
            'due_at' => now()->addDays(3),
            'completed_at' => in_array($status, ['approved', 'disapproved', 'closed'], true)
                ? now()
                : null,
        ]);
    }
}
