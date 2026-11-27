<?php

declare(strict_types=1);

namespace App\Domain\Custody;

use App\Domain\Custody\Exceptions\CustodyViolationException;

final readonly class BrokerReadObject
{
    public function __construct(
        public string $bytes,
        public int $sizeBytes,
        public string $sha256,
        public string $providerObjectIdentity,
    ) {
        if ($this->sizeBytes < 1 || strlen($this->bytes) !== $this->sizeBytes) {
            throw new CustodyViolationException('BrokerReadObject byte length does not match sizeBytes.');
        }
        if (preg_match('/\A[0-9a-f]{64}\z/', $this->sha256) !== 1) {
            throw new CustodyViolationException('BrokerReadObject sha256 must be 64 lowercase hex characters.');
        }
        if ($this->providerObjectIdentity === '') {
            throw new CustodyViolationException('BrokerReadObject requires non-empty providerObjectIdentity.');
        }
    }

    /**
     * @return array<string, int|string>
     */
    public function toArray(): array
    {
        return [
            'bytes_base64' => base64_encode($this->bytes),
            'size_bytes' => $this->sizeBytes,
            'sha256' => $this->sha256,
            'provider_object_identity' => $this->providerObjectIdentity,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        $encoded = $data['bytes_base64'] ?? null;
        if (! is_string($encoded)) {
            throw new CustodyViolationException('BrokerReadObject missing base64 byte payload.');
        }

        $decoded = base64_decode($encoded, true);
        if (! is_string($decoded)) {
            throw new CustodyViolationException('BrokerReadObject received invalid base64 byte payload.');
        }

        return new self(
            bytes: $decoded,
            sizeBytes: (int) ($data['size_bytes'] ?? 0),
            sha256: (string) ($data['sha256'] ?? ''),
            providerObjectIdentity: (string) ($data['provider_object_identity'] ?? ''),
        );
    }
}
