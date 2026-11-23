<?php

declare(strict_types=1);

namespace App\Domain\Custody;

use App\Domain\Custody\Exceptions\CustodyViolationException;
use Illuminate\Support\Str;

final readonly class ProducedSourceEvent
{
    private const SOURCE_KINDS = [
        'transaction',
        'correspondence',
        'travel',
    ];

    private const CLASSIFICATIONS = [
        'public',
        'internal',
        'confidential',
        'restricted',
    ];

    public function __construct(
        public string $sourceKind,
        public int $sourceId,
        public int $eventId,
        public string $eventAction,
        public int $actorUserId,
        public int $officeId,
        public string $correlationId,
        public string $classification = 'internal',
    ) {
        if (! in_array($this->sourceKind, self::SOURCE_KINDS, true)) {
            throw new CustodyViolationException("Unsupported custody source kind [{$this->sourceKind}].");
        }

        if ($this->sourceId <= 0 || $this->eventId <= 0 || $this->actorUserId <= 0 || $this->officeId <= 0) {
            throw new CustodyViolationException('ProducedSourceEvent requires positive integer identifiers.');
        }

        if ($this->eventAction === '') {
            throw new CustodyViolationException('ProducedSourceEvent requires a non-empty event action.');
        }

        if (! Str::isUuid($this->correlationId)) {
            throw new CustodyViolationException('ProducedSourceEvent requires a valid UUID correlation_id.');
        }

        if (! in_array($this->classification, self::CLASSIFICATIONS, true)) {
            throw new CustodyViolationException("Unsupported evidence classification [{$this->classification}].");
        }
    }
}
