<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\User;
use App\Models\WorkflowTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkRequestBackendValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_invalid_category_type_pair_is_rejected_without_persistence(): void
    {
        $this->seed();

        $employee = User::query()->where('email', 'employee@talibon.demo')->firstOrFail();
        $engineering = Department::query()->where('code', 'ENG')->firstOrFail();

        $this->actingAs($employee)
            ->from('/transactions/create')
            ->post('/transactions', [
                'request_category' => 'Planning & Development',
                'request_type' => 'Purchase Request',
                'action_required' => 'For Review',
                'priority' => 'normal',
                'target_department_id' => $engineering->id,
                'title' => 'Invalid category mapping',
            ])
            ->assertRedirect('/transactions/create')
            ->assertSessionHasErrors('request_type');

        $this->assertDatabaseMissing('transactions', [
            'title' => 'Invalid category mapping',
        ]);
    }

    public function test_receiving_office_priority_and_target_completion_are_required_or_bounded(): void
    {
        $this->seed();

        $employee = User::query()->where('email', 'employee@talibon.demo')->firstOrFail();

        $this->actingAs($employee)
            ->from('/transactions/create')
            ->post('/transactions', [
                'request_category' => 'Planning & Development',
                'request_type' => 'Project Monitoring',
                'action_required' => 'For Appropriate Action',
                'priority' => 'critical',
                'due_at' => now()->subDay()->toDateString(),
                'title' => 'Invalid work request bounds',
            ])
            ->assertRedirect('/transactions/create')
            ->assertSessionHasErrors([
                'priority',
                'target_department_id',
                'due_at',
            ]);

        $this->assertDatabaseMissing('transactions', [
            'title' => 'Invalid work request bounds',
        ]);
    }

    public function test_legacy_payload_defaults_transaction_type_without_weakening_validation(): void
    {
        $this->seed();

        $engineering = User::query()->where('email', 'engineering@talibon.demo')->firstOrFail();
        $budget = Department::query()->where('code', 'BUDGET')->firstOrFail();

        $this->actingAs($engineering)
            ->post('/transactions', [
                'title' => 'Normalized legacy internal request',
                'priority' => 'normal',
                'target_department_id' => $budget->id,
            ])
            ->assertRedirect();

        $transaction = WorkflowTransaction::query()
            ->where('title', 'Normalized legacy internal request')
            ->firstOrFail();

        $this->assertSame('internal_request', $transaction->transaction_type);
        $this->assertSame($budget->id, $transaction->current_department_id);
    }

    public function test_initial_assignment_is_restricted_to_active_receiving_office_personnel(): void
    {
        $this->seed();

        $engineering = User::query()->where('email', 'engineering@talibon.demo')->firstOrFail();
        $budget = Department::query()->where('code', 'BUDGET')->firstOrFail();
        $engineeringEmployee = $engineering->employee;

        $this->actingAs($engineering)
            ->from('/transactions/create')
            ->post('/transactions', [
                'request_category' => 'Planning & Development',
                'request_type' => 'Technical Review',
                'action_required' => 'For Review',
                'priority' => 'high',
                'target_department_id' => $budget->id,
                'assigned_employee_id' => $engineeringEmployee->id,
                'title' => 'Cross office initial assignment',
            ])
            ->assertRedirect('/transactions/create')
            ->assertSessionHasErrors('assigned_employee_id');

        $this->assertDatabaseMissing('transactions', [
            'title' => 'Cross office initial assignment',
        ]);
    }
}
