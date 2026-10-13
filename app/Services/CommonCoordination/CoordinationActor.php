<?php

namespace App\Services\CommonCoordination;

use App\Models\User;

/**
 * Fresh, active employee identity for P0-only read projections.
 * This is not a replacement for domain policies or HTTP MFA middleware.
 */
final readonly class CoordinationActor
{
    private function __construct(
        public int $userId,
        public int $employeeId,
    ) {}

    public static function from(User $actor): ?self
    {
        if (! $actor->exists) {
            return null;
        }

        // Never use an already-loaded employee/office relationship after transfer.
        $fresh = User::query()->with('employee.department')->find($actor->getKey());
        $employee = $fresh?->employee;

        if (! $fresh?->is_active
            || ! $employee
            || $employee->employment_status !== 'active'
            || ! $employee->department?->is_active) {
            return null;
        }

        return new self((int) $fresh->id, (int) $employee->id);
    }
}
