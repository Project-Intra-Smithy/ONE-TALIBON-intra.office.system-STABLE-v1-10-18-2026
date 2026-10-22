<?php

namespace App\Data\Correspondence;

use InvalidArgumentException;

/** Non-HTTP, immutable municipal intake request. No trusted actor or classification. */
final readonly class StaffReceiptData
{
    /** @param list<CustodyEvidenceRef> $receiptEvidence */
    public function __construct(
        public string $clientRequestKey,
        public string $source,
        public string $channel,
        public string $senderName,
        public string $subject,
        public int $receivingOfficeId,
        public string $receivedOn,
        public array $receiptEvidence,
        public ?string $externalReference = null,
        public ?string $summary = null,
    ) {
        if ($receivingOfficeId < 1 || trim($source) === '' || trim($channel) === '' ||
            trim($senderName) === '' || trim($subject) === '' || $receiptEvidence === []) {
            throw new InvalidArgumentException('Complete staff receipt provenance is required.');
        }
        foreach ($receiptEvidence as $proof) {
            if (! $proof instanceof CustodyEvidenceRef) {
                throw new InvalidArgumentException('Receipt evidence must be immutable document references.');
            }
        }
    }
}
