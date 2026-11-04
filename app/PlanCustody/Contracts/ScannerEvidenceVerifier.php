<?php

namespace App\PlanCustody\Contracts;

use App\PlanCustody\Data\ScanEvidence;

interface ScannerEvidenceVerifier
{
    public function isTrusted(ScanEvidence $evidence): bool;
}
