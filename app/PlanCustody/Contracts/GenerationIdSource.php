<?php

namespace App\PlanCustody\Contracts;

interface GenerationIdSource
{
    public function next(): string;
}
