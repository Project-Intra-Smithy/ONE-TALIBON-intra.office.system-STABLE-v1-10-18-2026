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

        return $this->visibleForEligibleActor($actor, $actor->role, (int) $actor->employee->department_id);
    }

    private function visibleForEligibleActor(User $actor, ?string $role, int $departmentId): Builder
    {
        $query = WorkflowTransaction::query();

        if (! $this->allowsAll($role)) {
            $query->where(function (Builder $visible) use ($departmentId): void {
                $visible->where('current_department_id', $departmentId)
                    ->orWhere('origin_department_id', $departmentId);
            });
        }

        // Classed correspondence is the authority for linked Work Request reads.
        // Exclude unlinked document_review records, including the synchronous
        // creation window, and hide legacy links unless their source is visible.
        // This filter protects work queues, Records, reports and notification feeds.
        $allLinked = CorrespondenceRecord::query()
            ->whereNotNull('workflow_transaction_id')
            ->select('workflow_transaction_id');
        $readableLinked = $this->correspondenceAccess
            ->scopeVisibleTo(CorrespondenceRecord::query(), $actor)
            ->whereNotNull('workflow_transaction_id')
            ->select('workflow_transaction_id');

        return $query->where(function (Builder $visible) use ($allLinked, $readableLinked): void {
            $visible->where(function (Builder $standalone) use ($allLinked): void {
                $standalone->where('transactions.transaction_type', '!=', 'document_review')
                    ->whereNotIn('transactions.id', $allLinked);
            })->orWhereIn('transactions.id', $readableLinked);
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
