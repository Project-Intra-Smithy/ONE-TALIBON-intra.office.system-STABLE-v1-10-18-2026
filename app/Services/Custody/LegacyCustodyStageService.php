<?php

declare(strict_types=1);

namespace App\Services\Custody;

use App\Domain\Custody\Exceptions\CustodyFenceClosedException;
use App\Domain\Custody\Exceptions\CustodyViolationException;
use App\Domain\Custody\StagingReceipt;
use App\Services\Custody\Broker\LocalImmutableBrokerEngine;
use App\Services\Custody\Contracts\StorageBrokerClient;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

final class LegacyCustodyStageService
{
    public const CONNECTION_NAME = 'n03_stage';

    private const SHA256_PATTERN = '/\A[0-9a-f]{64}\z/';

    private const ALLOWED_COMMAND_PAIRS = [
        'transaction_create' => ['create'],
        'transaction_transition' => [
            'forward',
            'send_to_mayor',
            'return_origin',
            'request_information',
            'assign',
            'mark_review',
            'approve',
            'disapprove',
            'close',
        ],
        'correspondence_register' => ['register'],
        'correspondence_classify' => ['classify'],
        'correspondence_route' => ['route'],
        'correspondence_act' => ['act'],
        'travel_record' => ['record'],
        'travel_status' => ['status'],
    ];

    public function __construct(
        private readonly StorageBrokerClient $broker,
        private readonly string $connectionName = self::CONNECTION_NAME,
    ) {}

    /**
     * TX1: Durably commit operation reservation, 1..5 items, OPEN/1 gate, and RESERVED event
     * strictly BEFORE any storage broker I/O occurs.
     *
     * @param  list<array{ordinal?: int, generation_id?: string, locator?: string, size_bytes: int, sha256: string, mime_type: string}>  $items
     * @return array{
     *     operation_id: string,
     *     namespace_id: string,
     *     epoch: int,
     *     manifest_digest: string,
     *     items: list<array{ordinal: int, generation_id: string, locator: string, size_bytes: int, sha256: string, mime_type: string}>
     * }
     */
    public function reserve(
        string $namespaceId,
        int $epoch,
        int $actorUserId,
        int $officeId,
        string $serviceIdentity,
        string $commandKind,
        string $commandAction,
        string $correlationId,
        string $idempotencyHash,
        array $items,
        ?string $operationId = null,
        ?string $manifestDigest = null,
    ): array {
        $connection = $this->resolveStageConnection();
        if ($connection->transactionLevel() > 0) {
            throw new CustodyViolationException('Custody stage reservation refuses nested outer transactions.');
        }

        $operationId = $operationId !== null ? strtolower(trim($operationId)) : strtolower((string) Str::uuid());
        $namespaceId = strtolower(trim($namespaceId));
        $correlationId = strtolower(trim($correlationId));

        if (! Str::isUuid($operationId) || ! Str::isUuid($namespaceId) || ! Str::isUuid($correlationId)) {
            throw new CustodyViolationException('Custody stage reservation requires valid UUID identifiers.');
        }
        if ($epoch < 1 || $actorUserId < 1 || $officeId < 1 || trim($serviceIdentity) === '') {
            throw new CustodyViolationException('Custody stage reservation requires positive epoch, actor, office, and serviceIdentity.');
        }
        if (preg_match(self::SHA256_PATTERN, $idempotencyHash) !== 1) {
            throw new CustodyViolationException('Custody stage reservation requires 64-hex lowercase idempotencyHash.');
        }
        if (! isset(self::ALLOWED_COMMAND_PAIRS[$commandKind])
            || ! in_array($commandAction, self::ALLOWED_COMMAND_PAIRS[$commandKind], true)) {
            throw new CustodyViolationException("Unsupported custody command pair [{$commandKind}:{$commandAction}].");
        }

        $itemCount = count($items);
        if ($itemCount < 1 || $itemCount > 5) {
            throw new CustodyViolationException('Custody stage reservation requires between 1 and 5 items.');
        }

        $maxUploadBytes = (int) config('legacy_custody.max_upload_bytes', LocalImmutableBrokerEngine::DEFAULT_MAX_UPLOAD_BYTES);
        $allowedMimes = config('legacy_custody.allowed_mimes', LocalImmutableBrokerEngine::DEFAULT_ALLOWED_MIMES);
        if (! is_array($allowedMimes) || $allowedMimes === []) {
            $allowedMimes = LocalImmutableBrokerEngine::DEFAULT_ALLOWED_MIMES;
        }

        $normalizedItems = [];
        $seenGenerations = [];

        foreach (array_values($items) as $index => $rawItem) {
            $ordinal = isset($rawItem['ordinal']) ? (int) $rawItem['ordinal'] : ($index + 1);
            if ($ordinal !== $index + 1) {
                throw new CustodyViolationException('Custody reservation item ordinals must be contiguous starting at 1.');
            }

            $generationId = isset($rawItem['generation_id']) && is_string($rawItem['generation_id'])
                ? strtolower($rawItem['generation_id'])
                : strtolower((string) Str::uuid());

            if (! Str::isUuid($generationId) || isset($seenGenerations[$generationId])) {
                throw new CustodyViolationException("Invalid or duplicate generation_id at ordinal {$ordinal}.");
            }
            $seenGenerations[$generationId] = true;

            $canonicalLocator = 'objects/'.substr($generationId, 0, 2).'/'.$generationId.'.blob';
            $locator = isset($rawItem['locator']) && is_string($rawItem['locator'])
                ? $rawItem['locator']
                : $canonicalLocator;

            if ($locator !== $canonicalLocator) {
                throw new CustodyViolationException(
                    "Item locator [{$locator}] does not match canonical locator [{$canonicalLocator}]."
                );
            }

            $sizeBytes = (int) ($rawItem['size_bytes'] ?? 0);
            if ($sizeBytes < 1 || $sizeBytes > $maxUploadBytes) {
                throw new CustodyViolationException("Item size_bytes [{$sizeBytes}] at ordinal {$ordinal} is outside allowed bounds.");
            }

            $sha256 = (string) ($rawItem['sha256'] ?? '');
            if (preg_match(self::SHA256_PATTERN, $sha256) !== 1) {
                throw new CustodyViolationException("Item sha256 at ordinal {$ordinal} must be 64 lowercase hex characters.");
            }

            $mimeType = (string) ($rawItem['mime_type'] ?? '');
            if (! in_array($mimeType, $allowedMimes, true)) {
                throw new CustodyViolationException("Item mime_type [{$mimeType}] at ordinal {$ordinal} is not permitted.");
            }

            $normalizedItems[] = [
                'ordinal' => $ordinal,
                'generation_id' => $generationId,
                'locator' => $locator,
                'size_bytes' => $sizeBytes,
                'sha256' => $sha256,
                'mime_type' => $mimeType,
            ];
        }

        $computedManifest = self::computeManifestDigest($normalizedItems);
        if ($manifestDigest !== null && ! hash_equals($computedManifest, strtolower(trim($manifestDigest)))) {
            throw new CustodyViolationException(
                'Custody manifest_digest does not match canonical digest computed from reserved items.'
            );
        }
        $finalManifest = $computedManifest;
        if (preg_match(self::SHA256_PATTERN, $finalManifest) !== 1) {
            throw new CustodyViolationException('Custody manifest_digest must be 64 lowercase hex characters.');
        }

        $connection->beginTransaction();

        try {
            $this->assertStageSessionIdentity($connection);

            $connection->table('legacy_custody.operations')->insert([
                'operation_id' => $operationId,
                'namespace_id' => $namespaceId,
                'epoch' => $epoch,
                'actor_user_id' => $actorUserId,
                'office_id' => $officeId,
                'service_identity' => $serviceIdentity,
                'command_kind' => $commandKind,
                'command_action' => $commandAction,
                'correlation_id' => $correlationId,
                'idempotency_hash' => $idempotencyHash,
                'item_count' => $itemCount,
                'manifest_digest' => $finalManifest,
            ]);

            foreach ($normalizedItems as $item) {
                $connection->table('legacy_custody.operation_items')->insert([
                    'operation_id' => $operationId,
                    'ordinal' => $item['ordinal'],
                    'generation_id' => $item['generation_id'],
                    'namespace_id' => $namespaceId,
                    'epoch' => $epoch,
                    'locator' => $item['locator'],
                    'size_bytes' => $item['size_bytes'],
                    'sha256' => $item['sha256'],
                    'mime_type' => $item['mime_type'],
                ]);
            }

            $connection->table('legacy_custody.operation_gates')->insert([
                'operation_id' => $operationId,
                'fence_no' => 1,
                'state' => 'OPEN',
                'lock_stub' => 0,
            ]);

            $connection->table('legacy_custody.operation_events')->insert([
                'event_id' => (string) Str::uuid(),
                'operation_id' => $operationId,
                'fence_no' => 1,
                'kind' => 'RESERVED',
                'evidence_ref' => 'n03-k2:reserved:'.$operationId,
            ]);

            $connection->commit();

            return [
                'operation_id' => $operationId,
                'namespace_id' => $namespaceId,
                'epoch' => $epoch,
                'manifest_digest' => $finalManifest,
                'items' => $normalizedItems,
            ];
        } catch (Throwable $exception) {
            if ($connection->transactionLevel() > 0) {
                $connection->rollBack();
            }

            throw $exception;
        }
    }

    /**
     * Stage each reserved item through the isolated K3 storage broker, then commit TX2
     * recording verified generations + STAGED event on n03_stage.
     *
     * @param  array<int, string>  $sourcePathsByOrdinal
     * @param  ?callable(string, array<string, mixed>): void  $cutPointHook
     * @return list<StagingReceipt>
     */
    public function stageAll(
        string $operationId,
        array $sourcePathsByOrdinal,
        ?callable $cutPointHook = null,
        ?string $faultInjection = null,
    ): array {
        $connection = $this->resolveStageConnection();
        if ($connection->transactionLevel() > 0) {
            throw new CustodyViolationException('Custody staging refuses nested outer transactions.');
        }

        $operationId = strtolower(trim($operationId));
        if (! Str::isUuid($operationId)) {
            throw new CustodyViolationException('Custody staging requires a valid UUID operation_id.');
        }

        $this->assertStageRoleReadIdentity($connection);

        $operation = $connection->table('legacy_custody.operations')
            ->where('operation_id', $operationId)
            ->first();

        if ($operation === null) {
            throw new CustodyViolationException("Reserved custody operation [{$operationId}] was not found.");
        }

        $gate = $connection->table('legacy_custody.operation_gates')
            ->where('operation_id', $operationId)
            ->first();

        $terminalCount = $connection->table('legacy_custody.terminal_receipts')
            ->where('operation_id', $operationId)
            ->count();

        if ($gate === null
            || (string) $gate->state !== 'OPEN'
            || (int) $gate->fence_no !== 1
            || $terminalCount > 0) {
            throw new CustodyFenceClosedException(
                "Database fence is already CLOSED or terminal before broker staging for [{$operationId}]."
            );
        }

        $items = $connection->table('legacy_custody.operation_items')
            ->where('operation_id', $operationId)
            ->orderBy('ordinal')
            ->get()
            ->all();

        $expectedCount = (int) $operation->item_count;
        if (count($items) !== $expectedCount) {
            throw new CustodyViolationException('Reserved custody operation items do not match item_count.');
        }

        if (count($sourcePathsByOrdinal) !== $expectedCount) {
            throw new CustodyViolationException('Source file paths count does not match reserved item_count.');
        }

        foreach ($items as $item) {
            $ordinal = (int) $item->ordinal;
            $path = $sourcePathsByOrdinal[$ordinal] ?? null;
            if (! is_string($path) || $path === '' || ! is_file($path)) {
                throw new CustodyViolationException("Missing staging source file for ordinal {$ordinal}.");
            }
        }

        if ($cutPointHook !== null) {
            $cutPointHook('before_broker_stage', [
                'operation_id' => $operationId,
                'namespace_id' => (string) $operation->namespace_id,
                'item_count' => $expectedCount,
            ]);
        }

        $receipts = [];
        foreach ($items as $item) {
            $ordinal = (int) $item->ordinal;
            $receipt = $this->broker->stageWrite(
                namespaceId: (string) $item->namespace_id,
                operationId: $operationId,
                ordinal: $ordinal,
                generationId: (string) $item->generation_id,
                locator: (string) $item->locator,
                sourceTempPath: $sourcePathsByOrdinal[$ordinal],
                expectedSize: (int) $item->size_bytes,
                expectedSha256: (string) $item->sha256,
                mimeType: (string) $item->mime_type,
                fenceNo: 1,
                faultInjection: $faultInjection,
            );

            $receipts[] = $receipt;
        }

        if ($cutPointHook !== null) {
            $cutPointHook('after_broker_stage', [
                'operation_id' => $operationId,
                'receipts' => $receipts,
            ]);
        }

        $connection->beginTransaction();

        try {
            $this->assertStageSessionIdentity($connection);

            foreach ($receipts as $receipt) {
                $connection->table('legacy_custody.generations')->insert([
                    'generation_id' => $receipt->generationId,
                    'operation_id' => $receipt->operationId,
                    'ordinal' => $receipt->ordinal,
                    'namespace_id' => $receipt->namespaceId,
                    'epoch' => (int) $operation->epoch,
                    'locator' => $receipt->locator,
                    'size_bytes' => $receipt->sizeBytes,
                    'sha256' => $receipt->sha256,
                    'mime_type' => $receipt->mimeType,
                    'provider_object_identity' => $receipt->providerObjectIdentity,
                    'staged_fence' => $receipt->stagedFence,
                    'staging_receipt_id' => $receipt->stagingReceiptId,
                ]);
            }

            $connection->table('legacy_custody.operation_events')->insert([
                'event_id' => (string) Str::uuid(),
                'operation_id' => $operationId,
                'fence_no' => 1,
                'kind' => 'STAGED',
                'evidence_ref' => 'n03-k2:staged:'.count($receipts),
            ]);

            $connection->commit();

            return $receipts;
        } catch (QueryException $exception) {
            if ($connection->transactionLevel() > 0) {
                $connection->rollBack();
            }

            $sqlState = (string) ($exception->errorInfo[0] ?? $exception->getCode());
            if ($sqlState === '23514' && str_contains($exception->getMessage(), 'custody fence unavailable')) {
                throw new CustodyFenceClosedException(
                    "Database fence is already CLOSED or terminal while recording staged generations for [{$operationId}].",
                    previous: $exception,
                );
            }

            throw $exception;
        } catch (Throwable $exception) {
            if ($connection->transactionLevel() > 0) {
                $connection->rollBack();
            }

            throw $exception;
        }
    }

    /**
     * Convenience wrapper running TX1 reservation, broker staging, and TX2 generation recording.
     *
     * @param  list<array{ordinal?: int, generation_id?: string, locator?: string, size_bytes: int, sha256: string, mime_type: string, source_path: string}>  $items
     * @param  ?callable(string, array<string, mixed>): void  $cutPointHook
     * @return array{reservation: array<string, mixed>, receipts: list<StagingReceipt>}
     */
    public function reserveAndStage(
        string $namespaceId,
        int $epoch,
        int $actorUserId,
        int $officeId,
        string $serviceIdentity,
        string $commandKind,
        string $commandAction,
        string $correlationId,
        string $idempotencyHash,
        array $items,
        ?string $operationId = null,
        ?callable $cutPointHook = null,
        ?string $faultInjection = null,
    ): array {
        $sourcePathsByOrdinal = [];
        $reservationItems = [];

        foreach (array_values($items) as $index => $item) {
            $ordinal = isset($item['ordinal']) ? (int) $item['ordinal'] : ($index + 1);
            $sourcePathsByOrdinal[$ordinal] = (string) ($item['source_path'] ?? '');
            $reservationItems[] = [
                'ordinal' => $ordinal,
                'generation_id' => $item['generation_id'] ?? null,
                'locator' => $item['locator'] ?? null,
                'size_bytes' => (int) ($item['size_bytes'] ?? 0),
                'sha256' => (string) ($item['sha256'] ?? ''),
                'mime_type' => (string) ($item['mime_type'] ?? ''),
            ];
        }

        $reservation = $this->reserve(
            namespaceId: $namespaceId,
            epoch: $epoch,
            actorUserId: $actorUserId,
            officeId: $officeId,
            serviceIdentity: $serviceIdentity,
            commandKind: $commandKind,
            commandAction: $commandAction,
            correlationId: $correlationId,
            idempotencyHash: $idempotencyHash,
            items: array_map(
                static fn (array $row): array => array_filter($row, static fn (mixed $v): bool => $v !== null),
                $reservationItems,
            ),
            operationId: $operationId,
        );

        $receipts = $this->stageAll(
            operationId: $reservation['operation_id'],
            sourcePathsByOrdinal: $sourcePathsByOrdinal,
            cutPointHook: $cutPointHook,
            faultInjection: $faultInjection,
        );

        return [
            'reservation' => $reservation,
            'receipts' => $receipts,
        ];
    }

    /**
     * @param  list<array{ordinal: int, size_bytes: int, sha256: string, mime_type: string}>  $items
     */
    public static function computeManifestDigest(array $items): string
    {
        $canonical = array_map(
            static fn (array $item): array => [
                'ordinal' => (int) $item['ordinal'],
                'size_bytes' => (int) $item['size_bytes'],
                'sha256' => (string) $item['sha256'],
                'mime_type' => (string) $item['mime_type'],
            ],
            $items,
        );

        usort($canonical, static fn (array $a, array $b): int => $a['ordinal'] <=> $b['ordinal']);

        return hash('sha256', json_encode($canonical, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES));
    }

    private function resolveStageConnection(): ConnectionInterface
    {
        if ($this->connectionName !== self::CONNECTION_NAME) {
            throw new CustodyViolationException('Custody stage service is strictly pinned to the n03_stage connection.');
        }

        $connection = DB::connection($this->connectionName);
        if ($connection->getName() !== self::CONNECTION_NAME) {
            throw new CustodyViolationException('Custody stage connection identity drift detected.');
        }

        return $connection;
    }

    private function assertStageRoleReadIdentity(ConnectionInterface $connection): void
    {
        $identity = $connection->selectOne('SELECT session_user AS session_user, current_user AS current_user');
        if ($identity === null
            || (string) $identity->session_user !== self::CONNECTION_NAME
            || (string) $identity->current_user !== self::CONNECTION_NAME) {
            throw new CustodyViolationException('Custody staging must execute exclusively as PostgreSQL role n03_stage.');
        }
    }

    private function assertStageSessionIdentity(ConnectionInterface $connection): void
    {
        $identity = $connection->selectOne(
            "SELECT session_user AS session_user, current_user AS current_user, current_setting('transaction_isolation') AS isolation"
        );

        if ($identity === null
            || (string) $identity->session_user !== self::CONNECTION_NAME
            || (string) $identity->current_user !== self::CONNECTION_NAME) {
            throw new CustodyViolationException('Custody staging must execute exclusively as PostgreSQL role n03_stage.');
        }

        if ((string) $identity->isolation !== 'read committed') {
            throw new CustodyViolationException('Custody staging requires PostgreSQL READ COMMITTED transaction isolation.');
        }
    }
}
