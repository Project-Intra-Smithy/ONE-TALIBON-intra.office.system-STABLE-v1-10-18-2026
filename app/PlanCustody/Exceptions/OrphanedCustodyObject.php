<?php

namespace App\PlanCustody\Exceptions;

use Throwable;

final class OrphanedCustodyObject extends CustodyViolation
{
    public function __construct(
        public readonly string $opaqueLocator,
        Throwable $cause,
        Throwable $cleanupFailure,
    ) {
        parent::__construct(
            'Custody ledger commit failed and the uncommitted object requires isolated reconciliation.',
            0,
            $cleanupFailure,
        );

        $this->cause = $cause;
    }

    public readonly Throwable $cause;
}
