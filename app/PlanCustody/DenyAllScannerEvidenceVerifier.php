<?php

namespace App\PlanCustody;

use App\PlanCustody\Contracts\ScannerEvidenceVerifier;
use App\PlanCustody\Data\ScanEvidence;

final class DenyAllScannerEvidenceVerifier implements ScannerEvidenceVerifier
{
    public function isTrusted(ScanEvidence $evidence): bool
    {
        return false;
    }
}
