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
        // A single fresh identity query also evaluates the two employee
        // predicates. Do not load a second copy of the employee/office graph
        // for each protected read, or retain eligibility flags on the actor.
        $user = User::query()->withExists([
            'employee as has_eligibility_employee',
            'employee as has_eligible_employee' => fn ($query) => $query
                ->where('employment_status', 'active')
                ->whereNull('separation_date')
                ->whereHas('department', fn ($office) => $office->where('is_active', true)),
        ])->find($claimed->getKey());

        if (! $user || ! $user->is_active || $user->account_status !== 'active'
            || ($user->has_eligibility_employee
                ? ! $user->has_eligible_employee
                : ! blank($user->username))) {
            return null;
        }
        $attributes = $user->getAttributes();
        unset($attributes['has_eligibility_employee'], $attributes['has_eligible_employee']);
        $user->setRawAttributes($attributes, true);

        return $user;
    }

    /**
     * Caller must own a DB transaction. Follow the G1 employee -> user ->
     * department lock order; verify the employee binding after acquiring locks.
     */
    public function lock(User $claimed): User
    {
        return $this->lockWithDepartments($claimed, [])[0];
    }

    /**
     * Lock the actor office and any operation destination offices together, in
     * ascending order. Never acquire a second lower-ID office after the first.
     * @param list<int> $additionalDepartmentIds
     * @return array{User, \Illuminate\Database\Eloquent\Collection}
     */
    public function lockWithDepartments(User $claimed, array $additionalDepartmentIds): array
    {
        if ($claimed->getKey() === null || $claimed->getConnection()->transactionLevel() < 1) {
            throw new LogicException('Account identity lock requires a transaction and persisted actor.');
        }
        $id = (int) $claimed->getKey();
        $employeeId = Employee::query()->where('user_id', $id)->value('id');
        $employee = $employeeId === null ? null : Employee::query()->lockForUpdate()->find($employeeId);
        $user = User::query()->lockForUpdate()->find($id);
        $departmentIds = array_unique(array_filter([...$additionalDepartmentIds, $employee?->department_id]));
        $offices = Department::query()->whereIn('id', $departmentIds)->orderBy('id')->lockForUpdate()->get()->keyBy('id');
        $office = $employee ? $offices->get($employee->department_id) : null;

        if (! $user || ($employeeId !== null && ! $employee)
            || (int) Employee::query()->where('user_id', $id)->value('id') !== (int) $employeeId
            || ! $this->eligible($user, $employee, $office)) {
            throw new AuthorizationException('Account access denied.');
        }

        return [$user, $offices];
    }

    public function requireSession(Request $request, User $locked): void
    {
        if ((int) $request->user()?->getKey() !== (int) $locked->getKey()
            || ! $this->matchesEpoch($request, $locked)) {
            throw new AuthorizationException('Account access denied.');
        }
    }
}
