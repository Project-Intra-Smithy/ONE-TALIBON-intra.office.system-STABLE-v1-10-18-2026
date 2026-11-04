<?php

namespace App\PlanCustody\Contracts;

use App\PlanCustody\Data\CustodySecurityContext;

interface CustodySecurityGate
{
    public function allows(CustodySecurityContext $context): bool;
}
