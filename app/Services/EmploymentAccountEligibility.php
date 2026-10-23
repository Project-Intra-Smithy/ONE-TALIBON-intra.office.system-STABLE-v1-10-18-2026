<?php

namespace App\Services;

use App\Models\StaffActivationInvitation;
use App\Models\User;

/**
 * Protect activated identities if employment or departmental authority changes.
 * Legacy unlinked accounts without a staff invitation keep their prior
 * compatibility behavior pending independent Maintainer reconciliation.
 */
final class EmploymentAccountEligibility
{
    public function allowed(User $user): bool
    {
        if (! $user->is_active) return false;

        $employee = $user->employee()->with('department')->first();
        if (! $employee) {
            return ! StaffActivationInvitation::query()->where('user_id', $user->id)->exists();
        }

        return $employee->employment_status === 'active'
            && $employee->separation_date === null
            && $employee->department !== null
            && (bool) $employee->department->is_active;
    }
}
