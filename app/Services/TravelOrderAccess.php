<?php

namespace App\Services;

use App\Domain\Identity\VerifiedMunicipalActor;
use App\Models\TravelOrder;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

final class TravelOrderAccess
{
    public function canAccessIndex(User $actor): bool
    {
        return $this->activeMunicipalActor($actor) !== null;
    }

    public function canRecordApproved(User $actor): bool
    {
        $current = $this->activeMunicipalActor($actor);

        return $current !== null
            && $current->isRole('mayor_approver')
            && $current->employee->department->code === 'MAYOR';
    }

    public function canUpdateState(User $actor): bool
    {
        return $this->canRecordApproved($actor);
    }

    public function canView(User $actor, TravelOrder $travelOrder): bool
    {
        return $this->scopeVisibleTo(
            TravelOrder::query()->whereKey($travelOrder->getKey()),
            $actor,
        )->exists();
    }

    public function scopeVisibleTo(Builder $query, User $actor): Builder
    {
        $current = $this->activeMunicipalActor($actor);

        if ($current === null) {
            return $query->whereRaw('1 = 0');
        }

        return $this->scopeVisibleToActiveActor($query, $current);
    }

    /**
     * Search already checked current-session identity and live office status.
     * Never cache verified identity across separate search operations.
     */
    public function scopeVisibleToVerifiedActor(Builder $query, VerifiedMunicipalActor $verified): Builder
    {
        return $this->scopeVisibleToActiveActor($query, $verified->user());
    }

    private function scopeVisibleToActiveActor(Builder $query, User $current): Builder
    {
        $employee = $current->employee;

        if ($this->hasMunicipalReadAuthority($current)) {
            return $query;
        }

        if ($current->isRole('department_head')) {
            return $query->where(function (Builder $visible) use ($employee): void {
                $visible->where('department_id', $employee->department_id)
                    ->orWhereHas('issuedTo', function (Builder $issued) use ($employee): void {
                        $issued->where('employees.department_id', $employee->department_id);
                    });
            });
        }

        return $query->whereHas('issuedTo', function (Builder $issued) use ($employee): void {
            $issued->where('employees.id', $employee->id);
        });
    }

    /**
     * Reload the user, employment and office for every protected decision.
     * A retained session or previously loaded Eloquent relations cannot
     * continue granting access after employment separation or office closure.
     */
    private function activeMunicipalActor(User $claimed): ?User
    {
        if ($claimed->getKey() === null) {
            return null;
        }

        $current = User::query()->with('employee.department')->find($claimed->getKey());

        if (! $current || ! $current->is_active
            || ! $current->employee || $current->employee->employment_status !== 'active'
            || ! $current->employee->department || ! $current->employee->department->is_active) {
            return null;
        }

        return $current;
    }

    private function hasMunicipalReadAuthority(User $actor): bool
    {
        return $actor->isRole('mayor_approver', 'mayor_staff')
            && $actor->employee?->department?->code === 'MAYOR';
    }
}
