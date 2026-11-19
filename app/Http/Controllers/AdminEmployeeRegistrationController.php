<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Services\AccountSessionEligibility;
use App\Services\AuthenticationAssurance;
use App\Services\AuditLogger;
use Illuminate\Auth\Access\AuthorizationException;
use App\Services\SystemAdministrationAccess;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

final class AdminEmployeeRegistrationController extends Controller
{
    public function store(
        Request $request,
        SystemAdministrationAccess $access,
        AuditLogger $audit,
        AccountSessionEligibility $eligibility,
        AuthenticationAssurance $assurance,
    ): RedirectResponse {
        $actor = $request->user();
        $access->authorize($actor);

        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'department_id' => ['required', 'integer', Rule::exists('departments', 'id')->where('is_active', true)],
            'position_title' => ['required', 'string', 'max:255'],
            'employee_number' => ['nullable', 'string', 'max:64', Rule::unique('employees', 'employee_number')],
            'work_email' => ['nullable', 'email:rfc', 'max:255'],
            'employment_type' => ['nullable', Rule::in(['regular', 'permanent', 'casual', 'contractual', 'coterminous', 'job_order', 'other'])],
        ]);

        try {
            DB::transaction(function () use ($request, $actor, $access, $audit, $eligibility, $assurance, $data): void {
                [$lockedActor, $offices] = $eligibility->lockWithDepartments($actor, [(int) $data['department_id']]);
                $access->authorize($lockedActor);
                $eligibility->requireSession($request, $lockedActor);
                if (! $assurance->isSatisfiedAgainst($request, $lockedActor)) {
                    throw new AuthorizationException('Administrator access denied.');
                }
                $office = $offices->get((int) $data['department_id']);
                if (! $office || ! $office->is_active) {
                    throw ValidationException::withMessages(['department_id' => 'Choose an active office.']);
                }

                // An existing active employee is registered, not hired or given access.
                // Only the separate IAM invitation action may bind a portal identity.
                $employee = Employee::query()->create([
                    'full_name' => $data['full_name'],
                    'department_id' => $office->id,
                    'position_title' => $data['position_title'],
                    'employee_number' => $data['employee_number'] ?? null,
                    'work_email' => $data['work_email'] ?? null,
                    'employment_type' => $data['employment_type'] ?? null,
                    'employment_status' => 'active',
                    'user_id' => null,
                ]);

                $audit->record($lockedActor, 'identity.employee.registered', 'Active personnel record registered without portal credentials.', 'allowed', Employee::class, $employee->id);
            }, 3);
        } catch (UniqueConstraintViolationException $exception) {
            if (filled($data['employee_number'] ?? null) && Employee::query()->where('employee_number', $data['employee_number'])->exists()) {
                throw ValidationException::withMessages(['employee_number' => 'This employee number is already registered.']);
            }

            throw $exception;
        }

        return redirect()->route('admin.index')->with('success', 'Employee registered. Select the employee under Add user to provision portal access.');
    }
}
