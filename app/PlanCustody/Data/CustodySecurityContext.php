<?php

namespace App\PlanCustody\Data;

final readonly class CustodySecurityContext
{
    public function __construct(
        public string $actorId,
        public string $officeId,
        public int $mfaEpoch,
        public int $sessionEpoch,
        public string $restoreFenceToken,
    ) {}
}
