<?php

declare(strict_types=1);

namespace App\Domain\Custody;

final readonly class CommandOutcome
{
    /**
     * @param  list<array{ordinal: int, document_id: int, document_public_id: string, generation_id: string, upload_audit_id: int}>  $documents
     */
    public function __construct(
        public string $operationId,
        public string $receiptUuid,
        public string $outcome,
        public string $sourceKind,
        public int $sourceId,
        public int $eventId,
        public string $eventAction,
        public string $correlationId,
        public string $manifestDigest,
        public bool $replayed,
        public array $documents,
    ) {}
}
