<?php

namespace App\Services\CommonEvidence;

use App\Models\CorrespondenceRecord;
use App\Models\User;
use App\Services\CorrespondenceAccessDecider;

/**
 * Archive and download use the same correspondence visibility predicate as
 * list/detail and search. Never add a broader registrar-only RECEIVED OR.
 */
final readonly class CorrespondenceEvidenceScope
{
    public function __construct(private CorrespondenceAccessDecider $access) {}

    public function visibleTo(User $actor): Builder
    {
        return $this->access->scopeVisibleTo(CorrespondenceRecord::query(), $actor);
    }
}
