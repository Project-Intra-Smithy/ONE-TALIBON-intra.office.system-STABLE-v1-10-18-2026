<?php

declare(strict_types=1);

namespace App\Services\Custody\Contracts;

use App\Domain\Custody\BrokerCloseAck;
use App\Domain\Custody\BrokerDisposeReceipt;
use App\Domain\Custody\BrokerReadObject;
use App\Domain\Custody\StagingReceipt;

interface StorageBrokerClient
{
    /**
     * Attest and return the deterministic root identity for the isolated broker root.
     *
     * @return array{backend_kind: string, provider_identity: string, root_claim: string, namespace_id: string, canonical_root: string}
     */
    public function attestRoot(string $namespaceId, string $expectedBackendKind = 'local_broker_v1'): array;

    public function stageWrite(
        string $namespaceId,
        string $operationId,
        int $ordinal,
        string $generationId,
        string $locator,
        string $sourceTempPath,
        int $expectedSize,
        string $expectedSha256,
        string $mimeType,
        int $fenceNo = 1,
        ?string $faultInjection = null,
    ): StagingReceipt;

    public function closeFence(
        string $namespaceId,
        string $operationId,
        int $fenceNo = 2,
    ): BrokerCloseAck;

    public function conditionalDispose(
        string $namespaceId,
        string $operationId,
        string $generationId,
        string $locator,
        string $providerObjectIdentity,
        string $closeAckId,
        string $tombstoneId,
    ): BrokerDisposeReceipt;

    public function readGeneration(
        string $namespaceId,
        string $generationId,
        string $locator,
        string $expectedProviderObjectIdentity,
        int $expectedSize,
        string $expectedSha256,
    ): BrokerReadObject;
}
