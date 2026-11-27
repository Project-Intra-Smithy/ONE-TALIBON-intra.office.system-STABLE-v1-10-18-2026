<?php

declare(strict_types=1);

namespace App\Domain\Custody;

use App\Domain\Custody\Exceptions\CustodyViolationException;

final readonly class StagingReceipt
{
    public function __construct(
        public string $operationId,
        public int $ordinal,
        public string $generationId,
        public string $namespaceId,
        public string $locator,
        public int $sizeBytes,
        public string $sha256,
        public string $mimeType,
        public string $providerObjectIdentity,
        public string $stagingReceiptId,
        public int $stagedFence,
    ) {
        if ($this->ordinal < 1 || $this->ordinal > 5) {
            throw new CustodyViolationException('StagingReceipt ordinal must be between 1 and 5.');
        }
        if ($this->sizeBytes < 1) {
            throw new CustodyViolationException('StagingReceipt sizeBytes must be positive.');
        }
        if (preg_match('/\A[0-9a-f]{64}\z/', $this->sha256) !== 1) {
            throw new CustodyViolationException('StagingReceipt sha256 must be 64 lowercase hex characters.');
        }
        if ($this->providerObjectIdentity === '' || $this->stagingReceiptId === '') {
            throw new CustodyViolationException('StagingReceipt requires non-empty providerObjectIdentity and stagingReceiptId.');
        }
        if ($this->stagedFence !== 1) {
            throw new CustodyViolationException('StagingReceipt stagedFence must equal 1.');
        }
    }

    /**
     * @return array<string, int|string>
     */
    public function toArray(): array
    {
        return [
            'operation_id' => $this->operationId,
            'ordinal' => $this->ordinal,
            'generation_id' => $this->generationId,
            'namespace_id' => $this->namespaceId,
            'locator' => $this->locator,
            'size_bytes' => $this->sizeBytes,
            'sha256' => $this->sha256,
            'mime_type' => $this->mimeType,
            'provider_object_identity' => $this->providerObjectIdentity,
            'staging_receipt_id' => $this->stagingReceiptId,
            'staged_fence' => $this->stagedFence,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            operationId: (string) ($data['operation_id'] ?? ''),
            ordinal: (int) ($data['ordinal'] ?? 0),
            generationId: (string) ($data['generation_id'] ?? ''),
            namespaceId: (string) ($data['namespace_id'] ?? ''),
            locator: (string) ($data['locator'] ?? ''),
            sizeBytes: (int) ($data['size_bytes'] ?? 0),
            sha256: (string) ($data['sha256'] ?? ''),
            mimeType: (string) ($data['mime_type'] ?? ''),
            providerObjectIdentity: (string) ($data['provider_object_identity'] ?? ''),
            stagingReceiptId: (string) ($data['staging_receipt_id'] ?? ''),
            stagedFence: (int) ($data['staged_fence'] ?? 0),
        );
    }
}
