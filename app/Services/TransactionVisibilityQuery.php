<?php

namespace App\Services;

use App\Domain\Identity\VerifiedMunicipalActor;
use App\Domain\Workflow\Authorization\TransactionActorEligibility;
use App\Domain\Workflow\Authorization\TransactionCapabilities;
use App\Models\CorrespondenceRecord;
use App\Models\User;
use App\Models\WorkflowTransaction;
use Illuminate\Database\Eloquent\Builder;

final class TransactionVisibilityQuery
{
    public function __construct(
        private readonly TransactionCapabilities $capabilities,
        private readonly TransactionActorEligibility $eligibility,
        private readonly CorrespondenceAccessDecider $correspondenceAccess,
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

        return $this->visibleForEligibleActor($actor, $current['role'], (int) $current['office_id']);
    }

    /**
     * A source read already verified by the operation-scoped P0 actor context.
     * The ordinary scope(User) still performs its own live eligibility read.
     */
    public function scopeVisibleToVerifiedActor(VerifiedMunicipalActor $verified): Builder
    {
        $actor = $verified->user();

        return $this->visibleForEligibleActor(
            $actor,
            $actor->role,
            (int) $actor->employee->department_id,
            $verified,
        );
    }

    private function visibleForEligibleActor(
        User $actor,
        ?string $role,
        int $departmentId,
        ?VerifiedMunicipalActor $verified = null,
    ): Builder
    {
        $query = WorkflowTransaction::query();

        if (! $this->allowsAll($role)) {
            $query->where(function (Builder $visible) use ($departmentId): void {
                $visible->where('current_department_id', $departmentId)
                    ->orWhere('origin_department_id', $departmentId);
            });
        }

        // Preserve legitimate standalone document_review Work Requests.
        // A linked transaction is excluded if ANY originating Correspondence
        // record is outside the actor's source-specific authorization scope.
        // This also prevents one visible child from overriding a restricted one.
        $readableSourceIds = ($verified === null
            ? $this->correspondenceAccess->scopeVisibleTo(CorrespondenceRecord::query(), $actor)
            : $this->correspondenceAccess->scopeVisibleToVerifiedActor(
                CorrespondenceRecord::query(),
                $verified,
            ))->select('id');
        $deniedTransactions = CorrespondenceRecord::query()
            ->whereNotNull('workflow_transaction_id')
            ->whereNotIn('id', $readableSourceIds)
            ->select('workflow_transaction_id');

        return $query->whereNotIn('transactions.id', $deniedTransactions);
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
