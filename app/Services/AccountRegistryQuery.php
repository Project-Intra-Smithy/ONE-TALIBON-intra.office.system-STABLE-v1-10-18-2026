<?php

namespace App\Services;

use App\Models\Department;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

final class AccountRegistryQuery
{
    /**
     * @param  array{search?: string, department_id?: int|string, role?: string, status?: string}  $filters
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = User::query()
            ->select(['id', 'name', 'username', 'email', 'role', 'is_active', 'account_status', 'mfa_confirmed_at'])
            ->with([
                'employee' => fn ($query) => $query
                    ->select([
                        'id',
                        'user_id',
                        'employee_number',
                        'full_name',
                        'department_id',
                        'position_title',
                        'employment_status',
                    ])
                    ->with('department:id,code,name,short_name'),
            ]);

        $search = trim((string) ($filters['search'] ?? ''));
        if ($search !== '') {
            $pattern = '%'.$search.'%';
            $query->where(function ($query) use ($pattern): void {
                $query->where('email', 'like', $pattern)
                    ->orWhere('username', 'like', $pattern)
                    ->orWhereHas('employee', function ($query) use ($pattern): void {
                        $query->where('full_name', 'like', $pattern)
                            ->orWhere('employee_number', 'like', $pattern);
                    });
            });
        }

        if (! empty($filters['department_id'])) {
            $departmentId = (int) $filters['department_id'];
            $query->whereHas('employee', fn ($query) => $query->where('department_id', $departmentId));
        }

        if (! empty($filters['role'])) {
            $query->where('role', $filters['role']);
        }

        if (($filters['status'] ?? null) === 'active') {
            $query->where('is_active', true);
        } elseif (($filters['status'] ?? null) === 'inactive') {
            $query->where('is_active', false);
        }

        return $query
            ->orderBy('name')
            ->orderBy('id')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (User $user): array => $this->present($user));
    }

    /** @return array<int, array{id: int, code: string, name: string, shortName: ?string}> */
    public function departmentOptions(): array
    {
        return Department::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'short_name'])
            ->map(fn (Department $department): array => [
                'id' => (int) $department->id,
                'code' => $department->code,
                'name' => $department->name,
                'shortName' => $department->short_name,
            ])
            ->all();
    }

    /** @return array<int, string> */
    public function roleOptions(): array
    {
        return User::query()
            ->whereNotNull('role')
            ->distinct()
            ->orderBy('role')
            ->pluck('role')
            ->filter(fn ($role): bool => is_string($role) && $role !== '')
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    public function eligibleEmployees(): array
    {
        return \App\Models\Employee::query()
            ->with('department:id,code,name,short_name,is_active')
            ->where('employment_status', 'active')
            ->whereNull('separation_date')
            ->where(function ($query): void {
                $query->whereNull('user_id')->orWhereHas('user', fn ($user) => $user->where('account_status', 'pending'));
            })
            ->whereHas('department', fn ($query) => $query->where('is_active', true))
            ->orderBy('full_name')->get()
            ->map(fn ($employee): array => [
                'id' => (int) $employee->id,
                'name' => $employee->full_name ?: 'Employee record #'.$employee->id,
                'employeeNumber' => $employee->employee_number,
                'office' => $employee->department?->short_name ?: $employee->department?->name,
                'departmentId' => (int) $employee->department_id,
            ])->all();
    }

    /** @return array<int, array<string, mixed>> */
    public function pendingInvitations(): array
    {
        return \App\Models\StaffActivationInvitation::query()
            ->with(['employee:id,full_name', 'department:id,name,short_name'])
            ->whereNull('consumed_at')->whereNull('revoked_at')
            ->latest()->limit(50)->get()
            ->map(fn ($invitation): array => [
                'id' => (int) $invitation->id,
                'employee' => $invitation->employee?->full_name,
                'username' => $invitation->username,
                'role' => $invitation->role,
                'office' => $invitation->department?->short_name ?: $invitation->department?->name,
                'expiresAt' => $invitation->expires_at->toIso8601String(),
                'expired' => $invitation->expires_at->isPast(),
            ])->all();
    }

    /** @return array<string, mixed> */
    private function present(User $user): array
    {
        $employee = $user->employee;
        $department = $employee?->department;

        return [
            'id' => (int) $user->id,
            'employee' => $employee?->full_name,
            'employeeNumber' => $employee?->employee_number,
            'department' => $department ? [
                'code' => $department->code,
                'name' => $department->name,
                'shortName' => $department->short_name,
            ] : null,
            'position' => $employee?->position_title,
            'role' => $user->role,
            'username' => $user->username,
            'loginEmail' => $user->email,
            'accountStatus' => $user->account_status,
            'active' => (bool) $user->is_active,
            'mfaEnrolled' => $user->mfa_confirmed_at !== null,
        ];
    }
}
