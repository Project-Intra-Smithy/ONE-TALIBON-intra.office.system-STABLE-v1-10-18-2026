<?php

namespace App\Data\Correspondence;

use App\Domain\Correspondence\CorrespondenceLifecycleState;
use InvalidArgumentException;

/**
 * No actor, issuer or custodian identity may be trusted from client-supplied fields.
 * Attributes carry evidence *references*, not arbitrary state, user IDs or files.
 */
final readonly class CustodyCommand
{
    /**
     * @param list<CustodyEvidenceRef> $evidence
     * @param array<string, string|int> $attributes
     */
    public function __construct(
        public CustodyOperation $operation,
        public string $correspondencePublicId,
        public string $operationKey,
        public string $correlationId,
        public CorrespondenceLifecycleState $expectedState,
        public int $expectedEventId,
        public array $evidence,
        public array $attributes = [],
    ) {
        foreach ([$correspondencePublicId, $operationKey, $correlationId] as $uuid) {
            if (preg_match('/\A[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\z/iD', $uuid) !== 1) {
                throw new InvalidArgumentException('Correspondence ID, operation key and correlation ID must be UUIDs.');
            }
        }
        if ($expectedEventId < 0) {
            throw new InvalidArgumentException('Event revision must not be negative.');
        }
        foreach ($evidence as $proof) {
            if (! $proof instanceof CustodyEvidenceRef) {
                throw new InvalidArgumentException('Evidence must contain immutable document proofs.');
            }
        }
        foreach ($attributes as $key => $value) {
            if (! is_string($key) || ! is_string($value) && ! is_int($value) || $key === '' || mb_strlen((string) $value) > 2000) {
                throw new InvalidArgumentException('Invalid custody attribute.');
            }
        }
    }

    /** @return array<string,mixed> Deterministic order for idempotency hashing. */
    public function canonicalPayload(): array
    {
        $attributes = $this->attributes;
        ksort($attributes, SORT_STRING);

        return [
            'operation' => $this->operation->value,
            'record' => strtolower($this->correspondencePublicId),
            'state' => $this->expectedState->value,
            'revision' => $this->expectedEventId,
            'evidence' => array_map(static fn (CustodyEvidenceRef $proof): array => $proof->snapshot(), $this->evidence),
            'attributes' => $attributes,
        ];
    }

    public function digest(): string
    {
        return hash('sha256', json_encode($this->canonicalPayload(), JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES));
    }
}
