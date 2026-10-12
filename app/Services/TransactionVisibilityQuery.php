<?php

namespace App\Services;

use App\Domain\Workflow\Authorization\TransactionActorEligibility;
use App\Domain\Workflow\Authorization\TransactionCapabilities;
use App\Models\User;
use App\Models\WorkflowTransaction;
use Illuminate\Database\Eloquent\Builder;

final class TransactionVisibilityQuery
{
    public function __construct(
        private readonly TransactionCapabilities $capabilities,
        private readonly TransactionActorEligibility $eligibility,
    ) {
    }

    public function scope(User $actor): Builder
    {
        $query = WorkflowTransaction::query();
        $current = $this->eligibility->resolve($actor);

        // Never expose Work Request rows or aggregates for revoked actors.
        if ($current === null) {
            return $query->whereRaw('1 = 0');
        }

        if ($this->allowsAll($current['role'])) {
            return $query;
        }

        $departmentId = $current['office_id'];

        return $query->where(function (Builder $visible) use ($departmentId): void {
            $visible->where('current_department_id', $departmentId)
                ->orWhere('origin_department_id', $departmentId);
        });
    }

    public function canViewAll(User $actor): bool
    {
        $current = $this->eligibility->resolve($actor);

        return $current !== null && $this->allowsAll($current['role']);
    }

    private function allowsAll(?string $role): bool
    {
        $roles = $role ? [$role] : [];

        return $this->capabilities
            ->resolve($roles)
            ->allows(TransactionCapabilities::VIEW_ALL);
    }
}
