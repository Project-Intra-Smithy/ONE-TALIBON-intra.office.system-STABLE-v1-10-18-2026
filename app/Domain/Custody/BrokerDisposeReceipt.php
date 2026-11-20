<?php

declare(strict_types=1);

namespace App\Domain\Custody;

use App\Domain\Custody\Exceptions\CustodyViolationException;

final readonly class BrokerDisposeReceipt
{
    public const ALLOWED_DISPOSITIONS = [
        'DISPOSED',
        'ABSENT_VERIFIED',
    ];

    public function __construct(
        public string $disposeReceiptId,
        public string $tombstoneId,
        public string $disposition,
        public string $providerObjectIdentity,
        public string $recordedAt,
    ) {
        if ($this->disposeReceiptId === '' || $this->tombstoneId === '' || $this->providerObjectIdentity === '' || $this->recordedAt === '') {
            throw new CustodyViolationException('BrokerDisposeReceipt requires non-empty receipt identifiers and timestamp.');
        }
        if (! in_array($this->disposition, self::ALLOWED_DISPOSITIONS, true)) {
            throw new CustodyViolationException("Unsupported BrokerDisposeReceipt disposition [{$this->disposition}].");
        }
    }

    /**
     * @return array<string, string>
     */
    public function toArray(): array
    {
        return [
            'dispose_receipt_id' => $this->disposeReceiptId,
            'tombstone_id' => $this->tombstoneId,
            'disposition' => $this->disposition,
            'provider_object_identity' => $this->providerObjectIdentity,
            'recorded_at' => $this->recordedAt,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            disposeReceiptId: (string) ($data['dispose_receipt_id'] ?? ''),
            tombstoneId: (string) ($data['tombstone_id'] ?? ''),
            disposition: (string) ($data['disposition'] ?? ''),
            providerObjectIdentity: (string) ($data['provider_object_identity'] ?? ''),
            recordedAt: (string) ($data['recorded_at'] ?? ''),
        );
    }
}
