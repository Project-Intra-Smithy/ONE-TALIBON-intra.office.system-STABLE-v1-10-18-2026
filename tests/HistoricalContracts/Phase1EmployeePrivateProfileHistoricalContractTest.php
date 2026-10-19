<?php

namespace Tests\HistoricalContracts;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Historical Full-HRIS contract evidence. These expectations are deliberately
 * outside the active Feature suite while private employee profiles are withdrawn.
 */
class Phase1EmployeePrivateProfileHistoricalContractTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_private_and_employment_profile_contract(): void
    {
        $this->seed();
        $user = User::query()->where('email', 'employee@talibon.demo')->firstOrFail();
        $employee = $user->employee;
        $employee->update([
            'employment_type' => 'regular',
            'employment_start_date' => '2024-01-15',
            'personal_email' => 'employee.private@example.test',
        ]);

        $this->actingAs($user)->get('/employees/'.$employee->id)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Employees/Show')
                ->where('permissions.isSelf', true)
                ->where('permissions.canViewPrivate', true)
                ->where('privateProfile.personal_email', 'employee.private@example.test')
                ->where('employmentProfile.employment_type', 'regular'));
    }

    public function test_department_head_private_profile_denial_contract(): void
    {
        $this->seed();
        $head = User::query()->where('email', 'engineering@talibon.demo')->firstOrFail();
        $target = Employee::query()
            ->where('department_id', $head->employee->department_id)
            ->whereKeyNot($head->employee->id)
            ->firstOrFail();

        $this->actingAs($head)->get('/employees/'.$target->id)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Employees/Show')
                ->where('permissions.canViewPrivate', false)
                ->where('permissions.canViewHrRecord', false)
                ->where('privateProfile', null)
                ->where('employmentProfile', null));
    }

    public function test_hr_private_profile_without_health_vault_contract(): void
    {
        $this->seed();
        $hr = User::query()->where('email', 'hr@talibon.demo')->firstOrFail();
        $target = User::query()->where('email', 'employee@talibon.demo')->firstOrFail()->employee;
        $target->update(['emergency_contact_name' => 'Synthetic Emergency Contact']);

        $this->actingAs($hr)->get('/employees/'.$target->id)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Employees/Show')
                ->where('permissions.canViewPrivate', true)
                ->where('permissions.canViewHrRecord', true)
                ->where('permissions.healthVaultAccess', false)
                ->where('privateProfile.emergency_contact_name', 'Synthetic Emergency Contact'));
    }
}
