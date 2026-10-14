<?php

namespace App\Services\CommonEvidence;

use App\Domain\Correspondence\CorrespondenceLifecycleState;
use App\Domain\Identity\VerifiedMunicipalActor;
use App\Models\CorrespondenceRecord;
use App\Models\User;
use App\Services\CorrespondenceAccessDecider;
use Illuminate\Database\Eloquent\Builder;

/**
 * Mirrors CorrespondenceAccessDecider::canViewInWorkspace (canRegister OR canView).
 *
 * The generic scopeVisibleTo is narrower for RECEIVED intake with partially
 * populated receiving/classification fields; document evidence must preserve
 * the existing direct-authorization contract, without inventing a new role.
 */
final readonly class CorrespondenceEvidenceScope
{
    public function __construct(private CorrespondenceAccessDecider $access) {}

    public function visibleTo(User $actor): Builder
    {
        $probe = new CorrespondenceRecord([
            'lifecycle_state' => CorrespondenceLifecycleState::Received->value,
        ]);
        $canRegister = $this->access->canRegister($actor, $probe);

        return CorrespondenceRecord::query()->where(function (Builder $authorized) use ($actor, $canRegister): void {
            $this->access->scopeVisibleTo($authorized, $actor);
            if ($canRegister) {
                $authorized->orWhere('lifecycle_state', CorrespondenceLifecycleState::Received->value);
            }
        });
    }
    /**
     * Exact P0 registrar RECEIVED exception and source scope using one fresh,
     * request-bound authorization proof. This is not the generic list scope.
     */
    public function visibleToVerifiedActor(VerifiedMunicipalActor $verified): Builder
    {
        $probe = new CorrespondenceRecord([
            'lifecycle_state' => CorrespondenceLifecycleState::Received->value,
        ]);
        $canRegister = $this->access->canRegisterVerifiedActor($verified, $probe);

        return CorrespondenceRecord::query()->where(function (Builder $authorized) use ($verified, $canRegister): void {
            $this->access->scopeVisibleToVerifiedActor($authorized, $verified);
            if ($canRegister) {
                $authorized->orWhere('lifecycle_state', CorrespondenceLifecycleState::Received->value);
            }
        });
    }
}
