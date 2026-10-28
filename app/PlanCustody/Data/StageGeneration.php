<?php

namespace App\PlanCustody\Data;

final readonly class StageGeneration
{
    public function __construct(
        public string $sourcePath,
        public string $declaredMediaType,
        public int $declaredSizeBytes,
        public string $declaredSha256,
        public string $idempotencyKey,
        public string $serviceIdentity,
        public CustodySecurityContext $security,
    ) {}
}
