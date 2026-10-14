<?php

namespace App\Services\CommonEvidence;

use App\Domain\Identity\VerifiedMunicipalActor;
use App\Models\CorrespondenceRecord;
use App\Models\User;
use App\Services\CorrespondenceAccessDecider;
use Illuminate\Database\Eloquent\Builder;

/**
 * P3 archive and download use the canonical P0 correspondence read scope.
 * Registration eligibility alone is never a protected-document read grant.
 */
final readonly class CorrespondenceEvidenceScope
{
    public function __construct(private CorrespondenceAccessDecider $access) {}

    public function visibleTo(User $actor): Builder
    {
        return $this->access->scopeVisibleTo(CorrespondenceRecord::query(), $actor);
    }

    public function visibleToVerifiedActor(VerifiedMunicipalActor $verified): Builder
    {
        return $this->access->scopeVisibleToVerifiedActor(CorrespondenceRecord::query(), $verified);
    }
}
