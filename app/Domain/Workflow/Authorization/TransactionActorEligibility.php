<?php

namespace App\Domain\Workflow\Authorization;

use App\Models\Employee;
use App\Models\User;

/**
 * Resolve current employment eligibility for Work Request consumers.
 *
 * Caller-supplied models and preloaded relations are never authority: every
 * protected operation must re-read the relevant User, Employee and Department.
 * No privileged-role or service-account exception is implied by this class.
 */
final class TransactionActorEligibility
{
    /**
     * @return array{user_id:int, employee_id:int, office_id:int, office_code:?string, role:?string}|null
     */
    public function resolve(User $claimed): ?array
    {
        if ($claimed->getKey() === null) {
            return null;
        }

        $user = User::query()
            ->whereKey($claimed->getKey())
            ->where('is_active', true)
            ->first(['id', 'role', 'is_active']);

        if (! $user) {
            return null;
        }

        $employee = Employee::query()
            ->with('department:id,code,is_active')
            ->where('user_id', $user->id)
            ->where('employment_status', 'active')
            ->first(['id', 'user_id', 'department_id', 'employment_status']);

        if (! $employee || ! $employee->department || ! $employee->department->is_active) {
            return null;
        }

        return [
            'user_id' => (int) $user->id,
            'employee_id' => (int) $employee->id,
            'office_id' => (int) $employee->department_id,
            'office_code' => $employee->department->code,
            'role' => $user->role,
        ];
    }
}
