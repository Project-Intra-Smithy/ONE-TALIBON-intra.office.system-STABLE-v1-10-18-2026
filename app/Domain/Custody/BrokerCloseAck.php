<?php

declare(strict_types=1);

namespace App\Domain\Custody;

use App\Domain\Custody\Exceptions\CustodyViolationException;

final readonly class BrokerCloseAck
{
    /**
     * @param  list<string>  $sealedGenerations
     */
    public function __construct(
        public string $closeAckId,
        public string $namespaceId,
        public string $operationId,
        public int $fenceNo,
        public array $sealedGenerations,
        public string $acknowledgedAt,
        public string $signature,
    ) {
        if ($this->closeAckId === '' || $this->namespaceId === '' || $this->operationId === '') {
            throw new CustodyViolationException('BrokerCloseAck requires non-empty closeAckId, namespaceId, and operationId.');
        }
        if ($this->fenceNo < 2) {
            throw new CustodyViolationException('BrokerCloseAck fenceNo must be >= 2.');
        }
        if ($this->acknowledgedAt === '' || $this->signature === '') {
            throw new CustodyViolationException('BrokerCloseAck requires non-empty acknowledgedAt and signature.');
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'close_ack_id' => $this->closeAckId,
            'namespace_id' => $this->namespaceId,
            'operation_id' => $this->operationId,
            'fence_no' => $this->fenceNo,
            'sealed_generations' => $this->sealedGenerations,
            'acknowledged_at' => $this->acknowledgedAt,
            'signature' => $this->signature,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        $sealed = $data['sealed_generations'] ?? [];
        if (! is_array($sealed)) {
            throw new CustodyViolationException('BrokerCloseAck sealed_generations must be a list.');
        }

        return new self(
            closeAckId: (string) ($data['close_ack_id'] ?? ''),
            namespaceId: (string) ($data['namespace_id'] ?? ''),
            operationId: (string) ($data['operation_id'] ?? ''),
            fenceNo: (int) ($data['fence_no'] ?? 0),
            sealedGenerations: array_values(array_map(static fn (mixed $v): string => (string) $v, $sealed)),
            acknowledgedAt: (string) ($data['acknowledged_at'] ?? ''),
            signature: (string) ($data['signature'] ?? ''),
        );
    }
}
