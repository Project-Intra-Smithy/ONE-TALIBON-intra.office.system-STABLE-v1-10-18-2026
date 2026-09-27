<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Validation\ValidationException;

final class MemorandumAuthority
{
    /** @return array<string, mixed> */
    public function describe(User $actor): array
    {
        $actor->loadMissing('employee.department');

        $department = $actor->employee?->department;
        $departmentActive = $department?->is_active === true;
        $mayorAuthority = $departmentActive
            && $department?->code === 'MAYOR'
            && $actor->isRole('mayor_approver', 'mayor_staff');
        $departmentAuthority = $departmentActive && $actor->isRole('department_head');

        $scope = $mayorAuthority
            ? 'municipal'
            : ($departmentAuthority ? 'department' : 'recipient');

        return [
            'canPublish' => $mayorAuthority || $departmentAuthority,
            'scope' => $scope,
            'issuingOffice' => $department ? [
                'id' => (int) $department->id,
                'code' => $department->code,
                'name' => $department->name,
                'shortName' => $department->short_name,
            ] : null,
            'allowedAudienceTypes' => $mayorAuthority
                ? ['all', 'departments', 'employees']
                : ($departmentAuthority ? ['departments', 'employees'] : []),
            'municipalityWide' => $mayorAuthority,
            'memoPrefix' => $mayorAuthority
                ? 'MEMO'
                : ($departmentAuthority ? $department->code.'-MEMO' : null),
            'authorityLabel' => $mayorAuthority
                ? "Mayor's Office issuing authority"
                : ($departmentAuthority ? 'Department Head issuing authority' : 'Recipient access'),
        ];
    }

    /** @return array<string, mixed> */
    public function requirePublisher(User $actor): array
    {
        $authority = $this->describe($actor);

        if (! $authority['canPublish']) {
            throw ValidationException::withMessages([
                'issuer' => 'This account does not have memorandum publishing authority.',
            ]);
        }

        return $authority;
    }

    public function canInspectIssuance(User $actor, int $departmentId): bool
    {
        if ($actor->isRole('system_admin')) {
            return true;
        }

        $authority = $this->describe($actor);

        return $authority['canPublish']
            && (int) ($authority['issuingOffice']['id'] ?? 0) === $departmentId;
    }
}
