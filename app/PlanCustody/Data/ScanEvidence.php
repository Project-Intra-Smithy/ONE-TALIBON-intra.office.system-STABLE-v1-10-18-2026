<?php

namespace App\PlanCustody\Data;

use DateTimeImmutable;

final readonly class ScanEvidence
{
    public function __construct(
        public string $evidenceId,
        public string $decision,
        public string $scannerIdentity,
        public string $engineVersion,
        public string $signatureVersion,
        public string $scannedSha256,
        public int $scannedSizeBytes,
        public string $signature,
        public DateTimeImmutable $scannedAt,
    ) {}
}
