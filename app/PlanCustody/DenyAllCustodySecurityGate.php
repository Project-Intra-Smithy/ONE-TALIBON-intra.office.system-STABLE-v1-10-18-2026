<?php

namespace App\PlanCustody;

use App\PlanCustody\Contracts\CustodySecurityGate;
use App\PlanCustody\Data\CustodySecurityContext;

final class DenyAllCustodySecurityGate implements CustodySecurityGate
{
    public function allows(CustodySecurityContext $context): bool
    {
        return false;
    }
}
