<?php

declare(strict_types=1);

namespace App\Services\Custody\Broker;

use App\Domain\Custody\BrokerCloseAck;
use App\Domain\Custody\BrokerDisposeReceipt;
use App\Domain\Custody\BrokerReadObject;
use App\Domain\Custody\Exceptions\CustodyFenceClosedException;
use App\Domain\Custody\Exceptions\CustodyViolationException;
use App\Domain\Custody\StagingReceipt;
use App\Services\Custody\Contracts\StorageBrokerClient;
use Throwable;

final class LocalImmutableBrokerEngine implements StorageBrokerClient
{
    public const DEFAULT_MAX_UPLOAD_BYTES = 15728640;

    public const DEFAULT_ALLOWED_MIMES = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/webp',
    ];

    private const UUID_PATTERN = '/\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/';

    private const SHA256_PATTERN = '/\A[0-9a-f]{64}\z/';

    private const LOCATOR_PATTERN = '/\Aobjects\/([0-9a-f]{2})\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.blob\z/';

    private const STREAM_CHUNK_BYTES = 65536;

    private readonly BrokerRootAttestation $attestation;

    /**
     * @param  ?list<string>  $disallowedRoots
     * @param  list<string>  $allowedMimes
     */
    public function __construct(
        private readonly string $brokerRoot,
        private readonly string $hmacKey,
        private readonly ?array $disallowedRoots = null,
        private readonly int $maxUploadBytes = self::DEFAULT_MAX_UPLOAD_BYTES,
        private readonly array $allowedMimes = self::DEFAULT_ALLOWED_MIMES,
    ) {
        if (strlen($this->hmacKey) < 32) {
            throw new CustodyViolationException('Broker HMAC key must be at least 32 bytes.');
        }

        if ($this->maxUploadBytes < 1) {
            throw new CustodyViolationException('Broker maxUploadBytes must be positive.');
        }

        $this->attestation = new BrokerRootAttestation;
    }

    /**
     * @param  list<string>  $sealedGenerations
     */
    public static function signCloseAckPayload(
        string $closeAckId,
        string $namespaceId,
        string $operationId,
        int $fenceNo,
        array $sealedGenerations,
        string $acknowledgedAt,
        string $hmacKey,
    ): string {
        if (strlen($hmacKey) < 32) {
            throw new CustodyViolationException('CloseAck signing requires an HMAC key of at least 32 bytes.');
        }

        $canonical = json_encode([
            'close_ack_id' => $closeAckId,
            'namespace_id' => $namespaceId,
            'operation_id' => $operationId,
            'fence_no' => $fenceNo,
            'sealed_generations' => array_values($sealedGenerations),
            'acknowledged_at' => $acknowledgedAt,
        ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);

        return hash_hmac('sha256', $canonical, $hmacKey);
    }

    public static function verifyCloseAck(BrokerCloseAck $ack, string $hmacKey): bool
    {
        if (strlen($hmacKey) < 32) {
            return false;
        }

        $expected = self::signCloseAckPayload(
            closeAckId: $ack->closeAckId,
            namespaceId: $ack->namespaceId,
            operationId: $ack->operationId,
            fenceNo: $ack->fenceNo,
            sealedGenerations: $ack->sealedGenerations,
            acknowledgedAt: $ack->acknowledgedAt,
            hmacKey: $hmacKey,
        );

        return hash_equals($expected, $ack->signature);
    }

    public function attestRoot(string $namespaceId, string $expectedBackendKind = BrokerRootAttestation::BACKEND_KIND): array
    {
        return $this->attestation->attest(
            brokerRoot: $this->brokerRoot,
            namespaceId: $namespaceId,
            expectedBackendKind: $expectedBackendKind,
            disallowedRoots: $this->disallowedRoots,
        );
    }

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
    ): StagingReceipt {
        $attested = $this->attestRoot($namespaceId);
        $root = $attested['canonical_root'];

        $this->assertUuid($operationId, 'operation_id');
        $this->assertUuid($generationId, 'generation_id');
        if ($ordinal < 1 || $ordinal > 5) {
            throw new CustodyViolationException('Staging ordinal must be between 1 and 5.');
        }
        if ($fenceNo !== 1) {
            throw new CustodyViolationException('Staging fence_no must equal 1.');
        }
        if ($expectedSize < 1 || $expectedSize > $this->maxUploadBytes) {
            throw new CustodyViolationException("Staging expectedSize [{$expectedSize}] exceeds bounded policy.");
        }
        if (preg_match(self::SHA256_PATTERN, $expectedSha256) !== 1) {
            throw new CustodyViolationException('Staging expectedSha256 must be 64 lowercase hex characters.');
        }
        if (! in_array($mimeType, $this->allowedMimes, true)) {
            throw new CustodyViolationException("Staging mimeType [{$mimeType}] is not allowed.");
        }
        if ($faultInjection !== null && $faultInjection !== '') {
            if (getenv('APP_ENV') !== 'testing' && getenv('LEGACY_CUSTODY_ALLOW_FAULT_INJECTION') !== '1') {
                throw new CustodyViolationException('Broker fault_injection is disabled outside testing environments.');
            }
        }

        $shard = $this->validateLocatorAndExtractShard($locator, $generationId);
        $this->validateSourcePath($sourceTempPath, $root);

        $opLockHandle = $this->acquireOperationLock($root, $operationId);

        try {
            $fenceState = $this->readFenceState($root, $operationId);
            if ($fenceState !== null && (int) ($fenceState['fence_no'] ?? 1) >= 2) {
                throw new CustodyFenceClosedException(
                    "Broker fence is already CLOSED for operation [{$operationId}]."
                );
            }
            if ($fenceState !== null && (string) ($fenceState['namespace_id'] ?? '') !== $namespaceId) {
                throw new CustodyViolationException("Broker operation [{$operationId}] namespace mismatch.");
            }

            $genLockHandle = $this->acquireGenerationLock($root, $generationId);

            try {
                $sealedPath = $this->sealedRecordPath($root, $generationId);
                clearstatcache(true, $sealedPath);
                if (file_exists($sealedPath) || is_link($sealedPath)) {
                    throw new CustodyViolationException(
                        "Generation [{$generationId}] or locator [{$locator}] is already sealed or permanently burned."
                    );
                }

                $objectsDir = $this->ensureSafeSubdir($root, ['objects']);
                $shardDir = $this->ensureSafeSubdir($root, ['objects', $shard]);
                $finalPath = $shardDir.DIRECTORY_SEPARATOR.$generationId.'.blob';

                clearstatcache(true, $finalPath);
                if (file_exists($finalPath) || is_link($finalPath)) {
                    throw new CustodyViolationException(
                        "Exclusive create refused: target locator [{$locator}] already exists."
                    );
                }

                $stagingShardDir = $this->ensureSafeSubdir($root, ['.staging', $shard]);
                $tmpPath = $stagingShardDir.DIRECTORY_SEPARATOR.$generationId.'.'.bin2hex(random_bytes(8)).'.tmp';

                $this->streamAndFsyncTempFile(
                    sourceTempPath: $sourceTempPath,
                    tmpPath: $tmpPath,
                    expectedSize: $expectedSize,
                    expectedSha256: $expectedSha256,
                    faultInjection: $faultInjection,
                );

                $this->publishAtomicallyAndSeal(
                    tmpPath: $tmpPath,
                    finalPath: $finalPath,
                    shardDir: $shardDir,
                );

                try {
                    $verified = $this->verifySealedObjectSingleFd(
                        finalPath: $finalPath,
                        generationId: $generationId,
                        expectedSize: $expectedSize,
                        expectedSha256: $expectedSha256,
                    );

                    $stagingReceiptId = $this->generateUuidV4();
                    $sealedRecord = [
                        'namespace_id' => $namespaceId,
                        'operation_id' => $operationId,
                        'ordinal' => $ordinal,
                        'generation_id' => $generationId,
                        'locator' => $locator,
                        'size_bytes' => $expectedSize,
                        'sha256' => $expectedSha256,
                        'mime_type' => $mimeType,
                        'provider_object_identity' => $verified['provider_object_identity'],
                        'staging_receipt_id' => $stagingReceiptId,
                        'staged_fence' => 1,
                        'sealed' => true,
                        'sealed_at' => gmdate('Y-m-d\TH:i:s\Z'),
                        'disposed' => false,
                        'disposed_at' => null,
                        'tombstone_id' => null,
                        'close_ack_id' => null,
                        'disposition' => null,
                    ];

                    $this->writeJsonExclusive($sealedPath, $sealedRecord);
                } catch (Throwable $postPublishException) {
                    @chmod($finalPath, 0600);
                    @unlink($finalPath);

                    throw $postPublishException;
                }

                $sealedGenerations = [];
                if ($fenceState !== null && isset($fenceState['sealed_generations']) && is_array($fenceState['sealed_generations'])) {
                    $sealedGenerations = array_values(array_map(static fn (mixed $v): string => (string) $v, $fenceState['sealed_generations']));
                }
                if (! in_array($generationId, $sealedGenerations, true)) {
                    $sealedGenerations[] = $generationId;
                }

                $updatedFence = [
                    'namespace_id' => $namespaceId,
                    'operation_id' => $operationId,
                    'fence_no' => 1,
                    'state' => 'OPEN',
                    'sealed_generations' => $sealedGenerations,
                    'close_ack_id' => null,
                    'acknowledged_at' => null,
                    'signature' => null,
                ];
                $this->persistFenceState($root, $operationId, $updatedFence);

                return new StagingReceipt(
                    operationId: $operationId,
                    ordinal: $ordinal,
                    generationId: $generationId,
                    namespaceId: $namespaceId,
                    locator: $locator,
                    sizeBytes: $expectedSize,
                    sha256: $expectedSha256,
                    mimeType: $mimeType,
                    providerObjectIdentity: $verified['provider_object_identity'],
                    stagingReceiptId: $stagingReceiptId,
                    stagedFence: 1,
                );
            } finally {
                $this->releaseLock($genLockHandle);
            }
        } finally {
            $this->releaseLock($opLockHandle);
        }
    }

    public function closeFence(
        string $namespaceId,
        string $operationId,
        int $fenceNo = 2,
    ): BrokerCloseAck {
        $attested = $this->attestRoot($namespaceId);
        $root = $attested['canonical_root'];

        $this->assertUuid($operationId, 'operation_id');
        if ($fenceNo !== 2) {
            throw new CustodyViolationException('Broker closeFence requires fence_no = 2.');
        }

        $opLockHandle = $this->acquireOperationLock($root, $operationId);

        try {
            $existing = $this->readFenceState($root, $operationId);
            if ($existing !== null && (string) ($existing['namespace_id'] ?? '') !== $namespaceId) {
                throw new CustodyViolationException("Broker closeFence namespace mismatch for operation [{$operationId}].");
            }

            if ($existing !== null && (int) ($existing['fence_no'] ?? 1) >= 2) {
                $ack = new BrokerCloseAck(
                    closeAckId: (string) ($existing['close_ack_id'] ?? ''),
                    namespaceId: $namespaceId,
                    operationId: $operationId,
                    fenceNo: (int) $existing['fence_no'],
                    sealedGenerations: array_values(array_map(
                        static fn (mixed $v): string => (string) $v,
                        is_array($existing['sealed_generations'] ?? null) ? $existing['sealed_generations'] : [],
                    )),
                    acknowledgedAt: (string) ($existing['acknowledged_at'] ?? ''),
                    signature: (string) ($existing['signature'] ?? ''),
                );

                if (! self::verifyCloseAck($ack, $this->hmacKey)) {
                    throw new CustodyViolationException("Persisted BrokerCloseAck signature corrupted for [{$operationId}].");
                }

                return $ack;
            }

            $sealedGenerations = [];
            if ($existing !== null && isset($existing['sealed_generations']) && is_array($existing['sealed_generations'])) {
                $sealedGenerations = array_values(array_map(static fn (mixed $v): string => (string) $v, $existing['sealed_generations']));
            }

            $closeAckId = 'ack:'.$this->generateUuidV4();
            $acknowledgedAt = gmdate('Y-m-d\TH:i:s\Z');
            $signature = self::signCloseAckPayload(
                closeAckId: $closeAckId,
                namespaceId: $namespaceId,
                operationId: $operationId,
                fenceNo: $fenceNo,
                sealedGenerations: $sealedGenerations,
                acknowledgedAt: $acknowledgedAt,
                hmacKey: $this->hmacKey,
            );

            $closedState = [
                'namespace_id' => $namespaceId,
                'operation_id' => $operationId,
                'fence_no' => $fenceNo,
                'state' => 'CLOSED',
                'sealed_generations' => $sealedGenerations,
                'close_ack_id' => $closeAckId,
                'acknowledged_at' => $acknowledgedAt,
                'signature' => $signature,
            ];

            $this->persistFenceState($root, $operationId, $closedState);

            return new BrokerCloseAck(
                closeAckId: $closeAckId,
                namespaceId: $namespaceId,
                operationId: $operationId,
                fenceNo: $fenceNo,
                sealedGenerations: $sealedGenerations,
                acknowledgedAt: $acknowledgedAt,
                signature: $signature,
            );
        } finally {
            $this->releaseLock($opLockHandle);
        }
    }

    public function conditionalDispose(
        string $namespaceId,
        string $operationId,
        string $generationId,
        string $locator,
        string $providerObjectIdentity,
        string $closeAckId,
        string $tombstoneId,
    ): BrokerDisposeReceipt {
        $attested = $this->attestRoot($namespaceId);
        $root = $attested['canonical_root'];

        $this->assertUuid($operationId, 'operation_id');
        $this->assertUuid($generationId, 'generation_id');
        $this->assertUuid($tombstoneId, 'tombstone_id');
        if ($providerObjectIdentity === '' || $closeAckId === '') {
            throw new CustodyViolationException('conditionalDispose requires non-empty providerObjectIdentity and closeAckId.');
        }

        $shard = $this->validateLocatorAndExtractShard($locator, $generationId);

        $opLockHandle = $this->acquireOperationLock($root, $operationId);

        try {
            $fenceState = $this->readFenceState($root, $operationId);
            if ($fenceState === null
                || (string) ($fenceState['namespace_id'] ?? '') !== $namespaceId
                || (int) ($fenceState['fence_no'] ?? 0) < 2
                || (string) ($fenceState['state'] ?? '') !== 'CLOSED') {
                throw new CustodyViolationException(
                    "conditionalDispose denied: operation [{$operationId}] fence is not CLOSED."
                );
            }

            $persistedAckId = (string) ($fenceState['close_ack_id'] ?? '');
            if ($persistedAckId === '' || ! hash_equals($persistedAckId, $closeAckId)) {
                throw new CustodyViolationException(
                    "conditionalDispose denied: closeAckId mismatch for operation [{$operationId}]."
                );
            }

            $persistedAck = new BrokerCloseAck(
                closeAckId: $persistedAckId,
                namespaceId: $namespaceId,
                operationId: $operationId,
                fenceNo: (int) $fenceState['fence_no'],
                sealedGenerations: array_values(array_map(
                    static fn (mixed $v): string => (string) $v,
                    is_array($fenceState['sealed_generations'] ?? null) ? $fenceState['sealed_generations'] : [],
                )),
                acknowledgedAt: (string) ($fenceState['acknowledged_at'] ?? ''),
                signature: (string) ($fenceState['signature'] ?? ''),
            );

            if (! self::verifyCloseAck($persistedAck, $this->hmacKey)) {
                throw new CustodyViolationException("conditionalDispose denied: invalid HMAC close-ack signature for [{$operationId}].");
            }

            $genLockHandle = $this->acquireGenerationLock($root, $generationId);

            try {
                $sealedPath = $this->sealedRecordPath($root, $generationId);
                $record = $this->readJsonFile($sealedPath);
                if ($record === null) {
                    throw new CustodyViolationException(
                        "conditionalDispose denied: sealed index record missing for generation [{$generationId}]."
                    );
                }

                if (($record['disposed'] ?? false) === true) {
                    if (($record['sealed'] ?? false) !== true
                        || (string) ($record['namespace_id'] ?? '') !== $namespaceId
                        || (string) ($record['operation_id'] ?? '') !== $operationId
                        || (string) ($record['locator'] ?? '') !== $locator
                        || ! hash_equals((string) ($record['provider_object_identity'] ?? ''), $providerObjectIdentity)
                        || ! hash_equals((string) ($record['close_ack_id'] ?? ''), $closeAckId)
                        || (string) ($record['tombstone_id'] ?? '') !== $tombstoneId) {
                        throw new CustodyViolationException(
                            "conditionalDispose denied: generation [{$generationId}] is already disposed with conflicting parameters."
                        );
                    }

                    $persistedReceiptId = (string) ($record['dispose_receipt_id'] ?? '');
                    if ($persistedReceiptId === '') {
                        $persistedReceiptId = 'disp:'.$this->generateUuidV4();
                    }
                    $persistedAt = (string) ($record['disposed_at'] ?? gmdate('Y-m-d\TH:i:s\Z'));

                    $shardDir = $this->resolveExistingSafeSubdir($root, ['objects', $shard]);
                    $finalPath = $shardDir.DIRECTORY_SEPARATOR.$generationId.'.blob';

                    clearstatcache(true, $finalPath);
                    if (is_link($finalPath)) {
                        throw new CustodyViolationException(
                            "conditionalDispose denied: physical object at [{$locator}] is a symlink."
                        );
                    }

                    if (file_exists($finalPath)) {
                        $verified = $this->verifySealedObjectSingleFd(
                            finalPath: $finalPath,
                            generationId: $generationId,
                            expectedSize: (int) $record['size_bytes'],
                            expectedSha256: (string) $record['sha256'],
                        );

                        if (! hash_equals($providerObjectIdentity, $verified['provider_object_identity'])) {
                            throw new CustodyViolationException(
                                "conditionalDispose denied: live object identity mismatch for generation [{$generationId}]."
                            );
                        }

                        @chmod($finalPath, 0600);
                        if (! @unlink($finalPath)) {
                            throw new CustodyViolationException(
                                "conditionalDispose failed to unlink physical object at [{$locator}]."
                            );
                        }

                        clearstatcache(true, $finalPath);
                        if (file_exists($finalPath) || is_link($finalPath)) {
                            throw new CustodyViolationException(
                                "conditionalDispose post-unlink check failed: [{$locator}] still exists."
                            );
                        }

                        return new BrokerDisposeReceipt(
                            disposeReceiptId: $persistedReceiptId,
                            tombstoneId: $tombstoneId,
                            disposition: 'DISPOSED',
                            providerObjectIdentity: $providerObjectIdentity,
                            recordedAt: $persistedAt,
                        );
                    }

                    return new BrokerDisposeReceipt(
                        disposeReceiptId: $persistedReceiptId,
                        tombstoneId: $tombstoneId,
                        disposition: 'ABSENT_VERIFIED',
                        providerObjectIdentity: $providerObjectIdentity,
                        recordedAt: $persistedAt,
                    );
                }

                if (($record['sealed'] ?? false) !== true
                    || (string) ($record['namespace_id'] ?? '') !== $namespaceId
                    || (string) ($record['operation_id'] ?? '') !== $operationId
                    || (string) ($record['locator'] ?? '') !== $locator
                    || ! hash_equals((string) ($record['provider_object_identity'] ?? ''), $providerObjectIdentity)) {
                    throw new CustodyViolationException(
                        "conditionalDispose denied: sealed metadata mismatch for generation [{$generationId}]."
                    );
                }

                $shardDir = $this->resolveExistingSafeSubdir($root, ['objects', $shard]);
                $finalPath = $shardDir.DIRECTORY_SEPARATOR.$generationId.'.blob';

                clearstatcache(true, $finalPath);
                if (is_link($finalPath) || ! file_exists($finalPath)) {
                    throw new CustodyViolationException(
                        "conditionalDispose denied: physical object at [{$locator}] is missing or a symlink."
                    );
                }

                $verified = $this->verifySealedObjectSingleFd(
                    finalPath: $finalPath,
                    generationId: $generationId,
                    expectedSize: (int) $record['size_bytes'],
                    expectedSha256: (string) $record['sha256'],
                );

                if (! hash_equals($providerObjectIdentity, $verified['provider_object_identity'])) {
                    throw new CustodyViolationException(
                        "conditionalDispose denied: live object identity mismatch for generation [{$generationId}]."
                    );
                }

                @chmod($finalPath, 0600);
                if (! @unlink($finalPath)) {
                    throw new CustodyViolationException(
                        "conditionalDispose failed to unlink physical object at [{$locator}]."
                    );
                }

                clearstatcache(true, $finalPath);
                if (file_exists($finalPath) || is_link($finalPath)) {
                    throw new CustodyViolationException(
                        "conditionalDispose post-unlink check failed: [{$locator}] still exists."
                    );
                }

                $disposeReceiptId = 'disp:'.$this->generateUuidV4();
                $recordedAt = gmdate('Y-m-d\TH:i:s\Z');

                $record['disposed'] = true;
                $record['disposed_at'] = $recordedAt;
                $record['tombstone_id'] = $tombstoneId;
                $record['close_ack_id'] = $closeAckId;
                $record['dispose_receipt_id'] = $disposeReceiptId;
                $record['disposition'] = 'DISPOSED';

                $this->persistJsonReplace($sealedPath, $record);

                return new BrokerDisposeReceipt(
                    disposeReceiptId: $disposeReceiptId,
                    tombstoneId: $tombstoneId,
                    disposition: 'DISPOSED',
                    providerObjectIdentity: $providerObjectIdentity,
                    recordedAt: $recordedAt,
                );
            } finally {
                $this->releaseLock($genLockHandle);
            }
        } finally {
            $this->releaseLock($opLockHandle);
        }
    }

    public function readGeneration(
        string $namespaceId,
        string $generationId,
        string $locator,
        string $expectedProviderObjectIdentity,
        int $expectedSize,
        string $expectedSha256,
    ): BrokerReadObject {
        $attested = $this->attestRoot($namespaceId);
        $root = $attested['canonical_root'];

        $this->assertUuid($generationId, 'generation_id');
        if ($expectedProviderObjectIdentity === '') {
            throw new CustodyViolationException('readGeneration requires non-empty expectedProviderObjectIdentity.');
        }
        if ($expectedSize < 1 || $expectedSize > $this->maxUploadBytes) {
            throw new CustodyViolationException('readGeneration expectedSize is outside allowed bounds.');
        }
        if (preg_match(self::SHA256_PATTERN, $expectedSha256) !== 1) {
            throw new CustodyViolationException('readGeneration expectedSha256 must be 64 lowercase hex characters.');
        }

        $shard = $this->validateLocatorAndExtractShard($locator, $generationId);

        $genLockHandle = $this->acquireGenerationSharedLock($root, $generationId);

        try {
            $sealedPath = $this->existingSealedRecordPath($root, $generationId);
            $record = $this->readJsonFile($sealedPath);
            if ($record === null
                || ($record['sealed'] ?? false) !== true
                || ($record['disposed'] ?? false) === true
                || (string) ($record['namespace_id'] ?? '') !== $namespaceId
                || (string) ($record['locator'] ?? '') !== $locator
                || (int) ($record['size_bytes'] ?? 0) !== $expectedSize
                || ! hash_equals((string) ($record['sha256'] ?? ''), $expectedSha256)
                || ! hash_equals((string) ($record['provider_object_identity'] ?? ''), $expectedProviderObjectIdentity)) {
                throw new CustodyViolationException(
                    "readGeneration denied: sealed index verification failed for generation [{$generationId}]."
                );
            }

            $shardDir = $this->resolveExistingSafeSubdir($root, ['objects', $shard]);
            $finalPath = $shardDir.DIRECTORY_SEPARATOR.$generationId.'.blob';

            clearstatcache(true, $finalPath);
            if (is_link($finalPath) || ! file_exists($finalPath)) {
                throw new CustodyViolationException("readGeneration denied: object missing or symlink at [{$locator}].");
            }

            $verified = $this->verifySealedObjectSingleFd(
                finalPath: $finalPath,
                generationId: $generationId,
                expectedSize: $expectedSize,
                expectedSha256: $expectedSha256,
                returnBytes: true,
            );

            if (! hash_equals($expectedProviderObjectIdentity, $verified['provider_object_identity'])) {
                throw new CustodyViolationException(
                    "readGeneration denied: live provider_object_identity mismatch for [{$generationId}]."
                );
            }

            return new BrokerReadObject(
                bytes: $verified['bytes'],
                sizeBytes: $expectedSize,
                sha256: $expectedSha256,
                providerObjectIdentity: $verified['provider_object_identity'],
            );
        } finally {
            $this->releaseLock($genLockHandle);
        }
    }

    private function assertUuid(string $value, string $field): void
    {
        if (preg_match(self::UUID_PATTERN, $value) !== 1) {
            throw new CustodyViolationException("Invalid lowercase UUID for {$field}.");
        }
    }

    private function validateLocatorAndExtractShard(string $locator, string $generationId): string
    {
        if (str_contains($locator, "\0") || str_contains($locator, '..') || str_contains($locator, '\\')) {
            throw new CustodyViolationException('Locator contains illegal traversal or path characters.');
        }

        if (preg_match(self::LOCATOR_PATTERN, $locator, $matches) !== 1) {
            throw new CustodyViolationException("Locator [{$locator}] violates canonical K3 grammar.");
        }

        $shard = $matches[1];
        $locatorGen = $matches[2];
        $expectedShard = substr($generationId, 0, 2);

        if ($locatorGen !== $generationId || $shard !== $expectedShard) {
            throw new CustodyViolationException(
                "Locator [{$locator}] does not match generation_id [{$generationId}] shard [{$expectedShard}]."
            );
        }

        return $shard;
    }

    private function validateSourcePath(string $sourceTempPath, string $canonicalBrokerRoot): void
    {
        if ($sourceTempPath === '' || preg_match('/[\x00-\x1F\x7F]/', $sourceTempPath) === 1) {
            throw new CustodyViolationException('Invalid source staging path.');
        }

        $isWindows = DIRECTORY_SEPARATOR === '\\';
        if ($isWindows) {
            if (preg_match('/\A[A-Za-z]:[\\\\\/]/', $sourceTempPath) !== 1) {
                throw new CustodyViolationException('Source staging path must be an absolute path.');
            }
        } elseif (! str_starts_with($sourceTempPath, '/')) {
            throw new CustodyViolationException('Source staging path must be an absolute path.');
        }

        $normalized = str_replace('\\', '/', $sourceTempPath);
        $segments = explode('/', $normalized);
        foreach ($segments as $segment) {
            if ($segment === '..' || $segment === '.') {
                throw new CustodyViolationException('Source staging path must not contain dot or traversal segments.');
            }
        }

        if ($isWindows) {
            preg_match('/\A([A-Za-z]:)\/(.*)\z/', $normalized, $m);
            $current = strtoupper($m[1] ?? '');
            $walkSegments = isset($m[2]) && $m[2] !== '' ? explode('/', $m[2]) : [];
        } else {
            $current = '';
            $walkSegments = explode('/', ltrim($normalized, '/'));
        }

        foreach ($walkSegments as $seg) {
            if ($seg === '') {
                continue;
            }
            $current .= '/'.$seg;
            $probe = $isWindows ? str_replace('/', '\\', $current) : $current;
            clearstatcache(true, $probe);
            if (is_link($probe)) {
                throw new CustodyViolationException("Source staging path component [{$probe}] is a symlink.");
            }
        }

        clearstatcache(true, $sourceTempPath);
        if (is_link($sourceTempPath) || ! file_exists($sourceTempPath) || ! is_file($sourceTempPath)) {
            throw new CustodyViolationException('Source staging path is missing, a symlink, or not a regular file.');
        }

        $realSource = @realpath($sourceTempPath);
        if (! is_string($realSource) || $realSource === '') {
            throw new CustodyViolationException('Failed resolving canonical source staging path.');
        }

        $compSource = $isWindows
            ? strtolower(rtrim(str_replace('\\', '/', $realSource), '/'))
            : rtrim(str_replace('\\', '/', $realSource), '/');
        $compRoot = $isWindows
            ? strtolower(rtrim(str_replace('\\', '/', $canonicalBrokerRoot), '/'))
            : rtrim(str_replace('\\', '/', $canonicalBrokerRoot), '/');

        if ($compSource === $compRoot
            || str_starts_with($compSource.'/', $compRoot.'/')
            || str_starts_with($compRoot.'/', $compSource.'/')) {
            throw new CustodyViolationException('Source staging path must be strictly disjoint from the isolated broker root.');
        }
    }

    private function streamAndFsyncTempFile(
        string $sourceTempPath,
        string $tmpPath,
        int $expectedSize,
        string $expectedSha256,
        ?string $faultInjection,
    ): void {
        $srcHandle = @fopen($sourceTempPath, 'rb');
        if ($srcHandle === false) {
            throw new CustodyViolationException('Unable to open staging source file.');
        }

        $tmpHandle = @fopen($tmpPath, 'xb');
        if ($tmpHandle === false) {
            fclose($srcHandle);
            throw new CustodyViolationException('Exclusive creation of broker temporary staging file failed.');
        }

        try {
            $srcStat = fstat($srcHandle);
            if ($srcStat === false || (($srcStat['mode'] & 0170000) !== 0100000)) {
                throw new CustodyViolationException('Staging source file is not a regular file.');
            }

            $hashCtx = hash_init('sha256');
            $totalBytes = 0;

            while (! feof($srcHandle)) {
                $chunk = fread($srcHandle, self::STREAM_CHUNK_BYTES);
                if ($chunk === false) {
                    throw new CustodyViolationException('Failed reading bytes from staging source.');
                }
                $chunkLen = strlen($chunk);
                if ($chunkLen === 0) {
                    continue;
                }

                if ($totalBytes + $chunkLen > $this->maxUploadBytes) {
                    throw new CustodyViolationException('Staging payload exceeds maximum allowed size.');
                }

                $toWrite = $chunk;
                if ($faultInjection === 'short_write' && $chunkLen > 1) {
                    $toWrite = substr($chunk, 0, $chunkLen - 1);
                }

                $written = fwrite($tmpHandle, $toWrite);
                if ($written === false || $written !== $chunkLen) {
                    throw new CustodyViolationException('Short write detected during broker staging.');
                }

                hash_update($hashCtx, $chunk);
                $totalBytes += $chunkLen;
            }

            if ($totalBytes !== $expectedSize) {
                throw new CustodyViolationException(
                    "Staged byte count [{$totalBytes}] does not match expected size [{$expectedSize}]."
                );
            }

            $actualSha256 = hash_final($hashCtx);
            if (! hash_equals($expectedSha256, $actualSha256)) {
                throw new CustodyViolationException('Staged SHA-256 digest does not match expected checksum.');
            }

            if ($faultInjection === 'fsync_failure') {
                throw new CustodyViolationException('Injected fsync failure during broker staging.');
            }

            if (! fflush($tmpHandle) || ! fsync($tmpHandle)) {
                throw new CustodyViolationException('Broker fsync failed during staging.');
            }

            fclose($tmpHandle);
            $tmpHandle = null;
            fclose($srcHandle);
            $srcHandle = null;
        } catch (Throwable $exception) {
            if (is_resource($tmpHandle)) {
                fclose($tmpHandle);
            }
            if (is_resource($srcHandle)) {
                fclose($srcHandle);
            }
            @chmod($tmpPath, 0600);
            @unlink($tmpPath);

            throw $exception;
        }
    }

    private function publishAtomicallyAndSeal(string $tmpPath, string $finalPath, string $shardDir): void
    {
        $isWindows = DIRECTORY_SEPARATOR === '\\';

        clearstatcache(true, $shardDir);
        clearstatcache(true, $finalPath);
        if (is_link($shardDir) || is_link($finalPath) || file_exists($finalPath)) {
            @chmod($tmpPath, 0600);
            @unlink($tmpPath);
            throw new CustodyViolationException('Atomic publish refused: target path exists or symlink detected.');
        }

        if (! $isWindows) {
            if (! @chmod($tmpPath, 0440)) {
                @chmod($tmpPath, 0600);
                @unlink($tmpPath);
                throw new CustodyViolationException('Failed to seal staging file read-only before publication.');
            }
        }

        if (! @link($tmpPath, $finalPath)) {
            @chmod($tmpPath, 0600);
            @unlink($tmpPath);
            throw new CustodyViolationException('Non-overwriting atomic publication collided with existing locator.');
        }

        if (! @unlink($tmpPath)) {
            @chmod($finalPath, 0600);
            @unlink($finalPath);
            @chmod($tmpPath, 0600);
            @unlink($tmpPath);
            throw new CustodyViolationException('Failed to unlink staging temp file after hard-link publication.');
        }

        if ($isWindows) {
            if (! @chmod($finalPath, 0440)) {
                @chmod($finalPath, 0600);
                @unlink($finalPath);
                throw new CustodyViolationException('Failed to apply read-only seal on published Windows generation.');
            }
        } else {
            $dirHandle = @fopen($shardDir, 'rb');
            if (is_resource($dirHandle)) {
                @fsync($dirHandle);
                fclose($dirHandle);
            }
        }
    }

    /**
     * @return array{provider_object_identity: string, sha256: string, size_bytes: int, bytes: string}
     */
    private function verifySealedObjectSingleFd(
        string $finalPath,
        string $generationId,
        int $expectedSize,
        string $expectedSha256,
        bool $returnBytes = false,
    ): array {
        $isWindows = DIRECTORY_SEPARATOR === '\\';

        clearstatcache(true, $finalPath);
        $lstatBefore = @lstat($finalPath);
        if ($lstatBefore === false
            || is_link($finalPath)
            || ! file_exists($finalPath)
            || (($lstatBefore['mode'] & 0170000) !== 0100000)) {
            throw new CustodyViolationException('Post-seal verification failed: target missing, symlink, or non-regular file.');
        }

        $fd = @fopen($finalPath, 'rb');
        if ($fd === false) {
            throw new CustodyViolationException('Post-seal verification failed: unable to open generation descriptor.');
        }

        try {
            $statBefore = fstat($fd);
            if ($statBefore === false) {
                throw new CustodyViolationException('Post-seal fstat failed.');
            }

            if (($statBefore['mode'] & 0170000) !== 0100000) {
                throw new CustodyViolationException('Post-seal verification rejected non-regular file.');
            }

            if (! $isWindows
                && ((int) $lstatBefore['dev'] !== (int) $statBefore['dev']
                    || (int) $lstatBefore['ino'] !== (int) $statBefore['ino'])) {
                throw new CustodyViolationException('Post-seal verification detected pre-open TOCTOU inode substitution.');
            }

            if ((int) $statBefore['nlink'] !== 1) {
                throw new CustodyViolationException('Post-seal verification rejected hardlink alias (nlink !== 1).');
            }

            if ((int) $statBefore['size'] !== $expectedSize) {
                throw new CustodyViolationException('Post-seal verification rejected file size mismatch.');
            }

            if ($isWindows) {
                if (is_writable($finalPath)) {
                    throw new CustodyViolationException('Post-seal verification rejected writable sealed object.');
                }
            } else {
                if (($statBefore['mode'] & 0222) !== 0) {
                    throw new CustodyViolationException('Post-seal verification rejected writable POSIX mode.');
                }
            }

            $hashCtx = hash_init('sha256');
            $totalRead = 0;
            $buffer = '';

            while (! feof($fd)) {
                $chunk = fread($fd, self::STREAM_CHUNK_BYTES);
                if ($chunk === false) {
                    throw new CustodyViolationException('Post-seal verification failed while reading object.');
                }
                $len = strlen($chunk);
                if ($len === 0) {
                    continue;
                }
                $totalRead += $len;
                if ($totalRead > $this->maxUploadBytes || $totalRead > $expectedSize) {
                    throw new CustodyViolationException('Post-seal verification rejected oversized object stream.');
                }
                hash_update($hashCtx, $chunk);
                if ($returnBytes) {
                    $buffer .= $chunk;
                }
            }

            if ($totalRead !== $expectedSize) {
                throw new CustodyViolationException('Post-seal verification byte stream length mismatch.');
            }

            $actualSha256 = hash_final($hashCtx);
            if (! hash_equals($expectedSha256, $actualSha256)) {
                throw new CustodyViolationException('Post-seal verification detected SHA-256 content tampering.');
            }

            $statAfter = fstat($fd);
            if ($statAfter === false
                || (int) $statAfter['dev'] !== (int) $statBefore['dev']
                || (int) $statAfter['ino'] !== (int) $statBefore['ino']
                || (int) $statAfter['size'] !== (int) $statBefore['size']
                || (int) $statAfter['nlink'] !== 1
                || (int) $statAfter['mtime'] !== (int) $statBefore['mtime']
                || (int) $statAfter['ctime'] !== (int) $statBefore['ctime']) {
                throw new CustodyViolationException('Post-seal verification detected concurrent descriptor mutation.');
            }

            $providerObjectIdentity = $isWindows
                ? sprintf('local_v1:win:%d:%s:%s', (int) $statBefore['dev'], substr($actualSha256, 0, 16), $generationId)
                : sprintf('local_v1:%d:%d:%s', (int) $statBefore['dev'], (int) $statBefore['ino'], $generationId);

            return [
                'provider_object_identity' => $providerObjectIdentity,
                'sha256' => $actualSha256,
                'size_bytes' => $totalRead,
                'bytes' => $buffer,
            ];
        } finally {
            fclose($fd);
        }
    }

    /**
     * @param  list<string>  $segments
     */
    private function ensureSafeSubdir(string $root, array $segments): string
    {
        $current = str_replace('/', DIRECTORY_SEPARATOR, $root);
        clearstatcache(true, $current);
        if (is_link($current) || ! is_dir($current)) {
            throw new CustodyViolationException('Broker root is missing or compromised.');
        }

        foreach ($segments as $segment) {
            if ($segment === '' || $segment === '.' || $segment === '..' || str_contains($segment, '/') || str_contains($segment, '\\')) {
                throw new CustodyViolationException('Unsafe broker internal directory segment.');
            }
            $current .= DIRECTORY_SEPARATOR.$segment;
            clearstatcache(true, $current);
            if (is_link($current)) {
                throw new CustodyViolationException("Broker internal path [{$current}] is a symlink.");
            }
            if (! is_dir($current)) {
                if (file_exists($current)) {
                    throw new CustodyViolationException("Broker internal path [{$current}] exists and is not a directory.");
                }
                if (! @mkdir($current, 0750, false) && ! is_dir($current)) {
                    throw new CustodyViolationException("Failed to create broker internal directory [{$current}].");
                }
                clearstatcache(true, $current);
                if (is_link($current) || ! is_dir($current)) {
                    throw new CustodyViolationException("Broker internal directory [{$current}] failed post-create check.");
                }
            }
        }

        return $current;
    }

    /**
     * @param  list<string>  $segments
     */
    private function resolveExistingSafeSubdir(string $root, array $segments): string
    {
        $current = str_replace('/', DIRECTORY_SEPARATOR, $root);
        clearstatcache(true, $current);
        if (is_link($current) || ! is_dir($current)) {
            throw new CustodyViolationException('Broker root is missing or compromised.');
        }

        foreach ($segments as $segment) {
            $current .= DIRECTORY_SEPARATOR.$segment;
            clearstatcache(true, $current);
            if (is_link($current) || ! is_dir($current)) {
                throw new CustodyViolationException("Broker internal directory [{$current}] is missing or a symlink.");
            }
        }

        return $current;
    }

    /**
     * @return resource
     */
    private function acquireOperationLock(string $root, string $operationId)
    {
        $shard = substr($operationId, 0, 2);
        $dir = $this->ensureSafeSubdir($root, ['.fence-journal', $shard]);
        $lockPath = $dir.DIRECTORY_SEPARATOR.$operationId.'.lock';

        return $this->acquireFileLock($lockPath);
    }

    /**
     * @return resource
     */
    private function acquireGenerationLock(string $root, string $generationId)
    {
        $shard = substr($generationId, 0, 2);
        $dir = $this->ensureSafeSubdir($root, ['.fence-journal', 'gen-locks', $shard]);
        $lockPath = $dir.DIRECTORY_SEPARATOR.$generationId.'.lock';

        return $this->acquireFileLock($lockPath, LOCK_EX);
    }

    /**
     * @return resource
     */
    private function acquireGenerationSharedLock(string $root, string $generationId)
    {
        $shard = substr($generationId, 0, 2);
        $dir = $this->resolveExistingSafeSubdir($root, ['.fence-journal', 'gen-locks', $shard]);
        $lockPath = $dir.DIRECTORY_SEPARATOR.$generationId.'.lock';

        clearstatcache(true, $lockPath);
        if (is_link($lockPath) || ! is_file($lockPath)) {
            throw new CustodyViolationException("readGeneration denied: generation lockfile missing for [{$generationId}].");
        }

        $handle = @fopen($lockPath, 'rb');
        if ($handle === false) {
            throw new CustodyViolationException("Unable to open broker generation lockfile [{$lockPath}].");
        }

        if (! flock($handle, LOCK_SH)) {
            fclose($handle);
            throw new CustodyViolationException("Unable to acquire shared broker lock [{$lockPath}].");
        }

        return $handle;
    }

    /**
     * @return resource
     */
    private function acquireFileLock(string $lockPath, int $operation = LOCK_EX)
    {
        clearstatcache(true, $lockPath);
        if (is_link($lockPath)) {
            throw new CustodyViolationException('Broker lockfile path is a symlink.');
        }

        $handle = @fopen($lockPath, 'c+b');
        if ($handle === false) {
            throw new CustodyViolationException("Unable to open broker lockfile [{$lockPath}].");
        }

        if (! flock($handle, $operation)) {
            fclose($handle);
            throw new CustodyViolationException("Unable to acquire exclusive broker lock [{$lockPath}].");
        }

        return $handle;
    }

    /**
     * @param  resource  $handle
     */
    private function releaseLock($handle): void
    {
        if (is_resource($handle)) {
            @flock($handle, LOCK_UN);
            fclose($handle);
        }
    }

    private function fenceStatePath(string $root, string $operationId): string
    {
        $shard = substr($operationId, 0, 2);
        $dir = $this->ensureSafeSubdir($root, ['.fence-journal', $shard]);

        return $dir.DIRECTORY_SEPARATOR.$operationId.'.fence.json';
    }

    private function sealedRecordPath(string $root, string $generationId): string
    {
        $shard = substr($generationId, 0, 2);
        $dir = $this->ensureSafeSubdir($root, ['.fence-journal', 'sealed', $shard]);

        return $dir.DIRECTORY_SEPARATOR.$generationId.'.json';
    }

    private function existingSealedRecordPath(string $root, string $generationId): string
    {
        $shard = substr($generationId, 0, 2);
        $dir = $this->resolveExistingSafeSubdir($root, ['.fence-journal', 'sealed', $shard]);

        return $dir.DIRECTORY_SEPARATOR.$generationId.'.json';
    }

    /**
     * @return ?array<string, mixed>
     */
    private function readFenceState(string $root, string $operationId): ?array
    {
        $path = $this->fenceStatePath($root, $operationId);

        return $this->readJsonFile($path);
    }

    /**
     * @param  array<string, mixed>  $state
     */
    private function persistFenceState(string $root, string $operationId, array $state): void
    {
        $path = $this->fenceStatePath($root, $operationId);
        $this->persistJsonReplace($path, $state);
    }

    /**
     * @return ?array<string, mixed>
     */
    private function readJsonFile(string $path): ?array
    {
        clearstatcache(true, $path);
        if (is_link($path)) {
            throw new CustodyViolationException("Broker metadata path [{$path}] is a symlink.");
        }
        if (! file_exists($path)) {
            return null;
        }

        $raw = @file_get_contents($path);
        if (! is_string($raw) || $raw === '') {
            throw new CustodyViolationException("Failed reading broker metadata file [{$path}].");
        }

        $decoded = json_decode($raw, true, 16, JSON_THROW_ON_ERROR);
        if (! is_array($decoded)) {
            throw new CustodyViolationException("Corrupted broker metadata JSON in [{$path}].");
        }

        return $decoded;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function writeJsonExclusive(string $targetPath, array $payload): void
    {
        $tmpPath = $targetPath.'.'.bin2hex(random_bytes(8)).'.tmp';
        $encoded = json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);

        $h = @fopen($tmpPath, 'xb');
        if ($h === false) {
            throw new CustodyViolationException('Failed creating temporary broker metadata file.');
        }

        try {
            $written = fwrite($h, $encoded);
            if ($written === false || $written !== strlen($encoded) || ! fflush($h) || ! fsync($h)) {
                throw new CustodyViolationException('Failed fsyncing broker metadata file.');
            }
            fclose($h);
            $h = null;

            if (! @link($tmpPath, $targetPath)) {
                throw new CustodyViolationException('Exclusive broker metadata record already exists.');
            }
            @unlink($tmpPath);
            $this->fsyncDir(dirname($targetPath));
        } catch (Throwable $exception) {
            if (is_resource($h)) {
                fclose($h);
            }
            @unlink($tmpPath);

            throw $exception;
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function persistJsonReplace(string $targetPath, array $payload): void
    {
        clearstatcache(true, $targetPath);
        if (is_link($targetPath)) {
            throw new CustodyViolationException("Broker metadata path [{$targetPath}] is a symlink.");
        }

        $tmpPath = $targetPath.'.'.bin2hex(random_bytes(8)).'.tmp';
        $encoded = json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);

        $h = @fopen($tmpPath, 'xb');
        if ($h === false) {
            throw new CustodyViolationException('Failed creating temporary broker state file.');
        }

        try {
            $written = fwrite($h, $encoded);
            if ($written === false || $written !== strlen($encoded) || ! fflush($h) || ! fsync($h)) {
                throw new CustodyViolationException('Failed fsyncing broker state file.');
            }
            fclose($h);
            $h = null;

            if (! @rename($tmpPath, $targetPath)) {
                throw new CustodyViolationException('Failed atomically replacing broker state file.');
            }
            $this->fsyncDir(dirname($targetPath));
        } catch (Throwable $exception) {
            if (is_resource($h)) {
                fclose($h);
            }
            @unlink($tmpPath);

            throw $exception;
        }
    }

    private function fsyncDir(string $dirPath): void
    {
        if (DIRECTORY_SEPARATOR === '\\') {
            return;
        }

        $dirHandle = @fopen($dirPath, 'rb');
        if (is_resource($dirHandle)) {
            @fsync($dirHandle);
            fclose($dirHandle);
        }
    }

    private function generateUuidV4(): string
    {
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0F) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3F) | 0x80);

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
    }
}
