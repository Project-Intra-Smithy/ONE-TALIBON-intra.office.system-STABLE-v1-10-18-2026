<?php

namespace App\Services;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use LogicException;

final class AccountSessionEligibility
{
    public const EPOCH = 'auth_session_version';

    public function eligible(User $user, ?Employee $employee, ?Department $office): bool
    {
        return $user->is_active && $user->account_status === 'active'
            && ($employee === null
                ? blank($user->username)
                : (int) $employee->user_id === (int) $user->id
                    && $employee->employment_status === 'active'
                    && $employee->separation_date === null
                    && (bool) $office?->is_active);
    }

    public function matchesEpoch(Request $request, User $user): bool
    {
        $epoch = $request->session()->get(self::EPOCH);

        return is_int($epoch) && $epoch >= 1 && $epoch === (int) $user->session_version;
    }

    public function current(User $claimed): ?User
    {
        $user = User::query()->with('employee.department')->find($claimed->getKey());

        return $user && $this->eligible($user, $user->employee, $user->employee?->department)
            ? $user : null;
    }

    /**
     * Caller must own a DB transaction. Follow the G1 employee -> user ->
     * department lock order; verify the employee binding after acquiring locks.
     */
    public function lock(User $claimed): User
    {
        if ($claimed->getKey() === null || $claimed->getConnection()->transactionLevel() < 1) {
            throw new LogicException('Account identity lock requires a transaction and persisted actor.');
        }
        $id = (int) $claimed->getKey();
        $employeeId = Employee::query()->where('user_id', $id)->value('id');
        $employee = $employeeId === null ? null : Employee::query()->lockForUpdate()->find($employeeId);
        $user = User::query()->lockForUpdate()->find($id);
        $office = $employee ? Department::query()->lockForUpdate()->find($employee->department_id) : null;

        if (! $user || ($employeeId !== null && ! $employee)
            || (int) Employee::query()->where('user_id', $id)->value('id') !== (int) $employeeId
            || ! $this->eligible($user, $employee, $office)) {
            throw new AuthorizationException('Account access denied.');
        }

        return $user;
    }

    public function requireSession(Request $request, User $locked): void
    {
        if ((int) $request->user()?->getKey() !== (int) $locked->getKey()
            || ! $this->matchesEpoch($request, $locked)) {
            throw new AuthorizationException('Account access denied.');
        }
    }
}
