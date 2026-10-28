<?php

namespace App\PlanCustody;

use App\PlanCustody\Contracts\GenerationIdSource;
use Illuminate\Support\Str;

final class RandomGenerationIdSource implements GenerationIdSource
{
    public function next(): string
    {
        return (string) Str::uuid();
    }
}
