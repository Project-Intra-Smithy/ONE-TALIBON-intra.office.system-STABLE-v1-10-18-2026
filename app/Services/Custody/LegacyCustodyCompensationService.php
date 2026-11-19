<?php

declare(strict_types=1);

namespace App\Services\Custody;

use App\Domain\Custody\BrokerCloseAck;
use App\Domain\Custody\Exceptions\CustodyOperationUncertainException;
use App\Domain\Custody\Exceptions\CustodyViolationException;
use App\Services\Custody\Broker\LocalImmutableBrokerEngine;
use App\Services\Custody\Contracts\StorageBrokerClient;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

final class LegacyCustodyCompensationService
{
    public const CONNECTION_NAME = 'n03_reconcile';

    public function __construct(
        private readonly StorageBrokerClient $broker,
        private readonly ?string $hmacKey = null,
        private readonly string $connectionName = self::CONNECTION_NAME,
    ) {}

    /**
     * Persist durable compensation tombstones BEFORE broker conditionalDispose,
     * then record immutable compensation outcomes for every staged generation of an
     * authoritatively ABORTED (fence=2) operation with zero command artifacts.
     *
     * @param  ?callable(string, array<string, mixed>): void  $cutPointHook
     * @return list<array{
     *     tombstone_id: string,
     *     outcome_id: string,
     *     generation_id: string,
     *     locator: string,
     *     disposition: string,
     *     broker_receipt_ref: string
     * }>
     */
    public function compensate(
        string $operationId,
        BrokerCloseAck $closeAck,
        ?callable $cutPointHook = null,
    ): array {
        if (! Str::isUuid($operationId)) {
            throw new CustodyViolationException('Custody compensation requires a valid UUID operation_id.');
        }

        $connection = $this->resolveReconcileConnection();
        if ($connection->transactionLevel() > 0) {
            throw new CustodyViolationException('Custody compensation refuses nested outer transactions.');
        }

        $hmacKey = $this->resolveHmacKey();
        if ($closeAck->operationId !== $operationId
            || $closeAck->fenceNo !== 2
            || ! LocalImmutableBrokerEngine::verifyCloseAck($closeAck, $hmacKey)) {
            throw new CustodyViolationException(
                "Custody compensation refused: BrokerCloseAck signature or operation mismatch for [{$operationId}]."
            );
        }

        $this->assertReconcileRoleReadIdentity($connection);

        $operation = $connection->table('legacy_custody.operations')
            ->where('operation_id', $operationId)
            ->first();

        if ($operation === null) {
            throw new CustodyViolationException("Custody operation [{$operationId}] was not found.");
        }

        if ((string) $operation->namespace_id !== $closeAck->namespaceId) {
            throw new CustodyViolationException("BrokerCloseAck namespace mismatch for operation [{$operationId}].");
        }

        $gate = $connection->table('legacy_custody.operation_gates')
            ->where('operation_id', $operationId)
            ->first();

        if ($gate === null || (string) $gate->state !== 'CLOSED' || (int) $gate->fence_no !== 2) {
            throw new CustodyViolationException(
                "Custody compensation refused: operation [{$operationId}] gate is not CLOSED at fence 2."
            );
        }

        $receipt = $connection->table('legacy_custody.terminal_receipts')
            ->where('operation_id', $operationId)
            ->first();

        if ($receipt === null
            || (string) $receipt->outcome !== 'ABORTED'
            || (int) $receipt->fence_no !== 2
            || ! hash_equals((string) $receipt->evidence_ref, $closeAck->closeAckId)) {
            throw new CustodyViolationException(
                "Custody compensation refused: operation [{$operationId}] lacks matching ABORTED/2 terminal receipt."
            );
        }

        $zeroCheck = $connection->selectOne(
            'SELECT legacy_custody.zero_artifacts(?) AS ok',
            [$operationId],
        );

        if ($zeroCheck === null || ! $zeroCheck->ok) {
            throw new CustodyViolationException(
                "Custody compensation refused: operation [{$operationId}] has non-zero command artifacts."
            );
        }

        $generations = $connection->table('legacy_custody.generations')
            ->where('operation_id', $operationId)
            ->orderBy('ordinal')
            ->get()
            ->all();

        $results = [];

        foreach ($generations as $generation) {
            $generationId = (string) $generation->generation_id;
            $namespaceId = (string) $generation->namespace_id;
            $locator = (string) $generation->locator;
            $providerObjectIdentity = (string) $generation->provider_object_identity;

            $existingTombstone = $connection->table('legacy_custody.compensation_tombstones')
                ->where('generation_id', $generationId)
                ->first();

            if ($existingTombstone !== null) {
                $tombstoneId = (string) $existingTombstone->tombstone_id;
                $existingOutcome = $connection->table('legacy_custody.compensation_outcomes')
                    ->where('tombstone_id', $tombstoneId)
                    ->first();

                if ($existingOutcome !== null) {
                    $results[] = [
                        'tombstone_id' => $tombstoneId,
                        'outcome_id' => (string) $existingOutcome->outcome_id,
                        'generation_id' => $generationId,
                        'locator' => $locator,
                        'disposition' => (string) $existingOutcome->disposition,
                        'broker_receipt_ref' => (string) $existingOutcome->broker_receipt_ref,
                    ];

                    continue;
                }
            } else {
                // TX1: Commit durable compensation tombstone strictly BEFORE broker unlink.
                $tombstoneId = strtolower((string) Str::uuid());
                $connection->beginTransaction();

                try {
                    $this->assertReconcileSessionIdentity($connection);

                    $connection->table('legacy_custody.compensation_tombstones')->insert([
                        'tombstone_id' => $tombstoneId,
                        'operation_id' => $operationId,
                        'generation_id' => $generationId,
                        'namespace_id' => $namespaceId,
                        'locator' => $locator,
                        'provider_object_identity' => $providerObjectIdentity,
                        'close_ack_id' => $closeAck->closeAckId,
                    ]);

                    $connection->commit();
                } catch (Throwable $exception) {
                    if ($connection->transactionLevel() > 0) {
                        $connection->rollBack();
                    }

                    throw $exception;
                }
            }

            if ($cutPointHook !== null) {
                $cutPointHook('after_tombstone_committed', [
                    'operation_id' => $operationId,
                    'tombstone_id' => $tombstoneId,
                    'generation_id' => $generationId,
                    'locator' => $locator,
                ]);
            }

            try {
                $disposeReceipt = $this->broker->conditionalDispose(
                    namespaceId: $namespaceId,
                    operationId: $operationId,
                    generationId: $generationId,
                    locator: $locator,
                    providerObjectIdentity: $providerObjectIdentity,
                    closeAckId: $closeAck->closeAckId,
                    tombstoneId: $tombstoneId,
                );
            } catch (Throwable $brokerException) {
                $quarantineRef = 'quarantined:'.substr(
                    hash('sha256', $tombstoneId.':'.$brokerException->getMessage()),
                    0,
                    32,
                );
                $this->recordOutcome($connection, $tombstoneId, 'QUARANTINED', $quarantineRef);

                throw new CustodyOperationUncertainException(
                    "Broker conditionalDispose failed for generation [{$generationId}]; tombstone [{$tombstoneId}] marked QUARANTINED.",
                    previous: $brokerException,
                );
            }

            $outcomeId = $this->recordOutcome(
                connection: $connection,
                tombstoneId: $tombstoneId,
                disposition: $disposeReceipt->disposition,
                brokerReceiptRef: $disposeReceipt->disposeReceiptId,
            );

            $results[] = [
                'tombstone_id' => $tombstoneId,
                'outcome_id' => $outcomeId,
                'generation_id' => $generationId,
                'locator' => $locator,
                'disposition' => $disposeReceipt->disposition,
                'broker_receipt_ref' => $disposeReceipt->disposeReceiptId,
            ];
        }

        return $results;
    }

    private function recordOutcome(
        ConnectionInterface $connection,
        string $tombstoneId,
        string $disposition,
        string $brokerReceiptRef,
    ): string {
        $outcomeId = strtolower((string) Str::uuid());
        $connection->beginTransaction();

        try {
            $this->assertReconcileSessionIdentity($connection);

            $connection->table('legacy_custody.compensation_outcomes')->insert([
                'outcome_id' => $outcomeId,
                'tombstone_id' => $tombstoneId,
                'disposition' => $disposition,
                'broker_receipt_ref' => $brokerReceiptRef,
            ]);

            $connection->commit();

            return $outcomeId;
        } catch (Throwable $exception) {
            if ($connection->transactionLevel() > 0) {
                $connection->rollBack();
            }

            throw $exception;
        }
    }

    private function resolveReconcileConnection(): ConnectionInterface
    {
        if ($this->connectionName !== self::CONNECTION_NAME) {
            throw new CustodyViolationException('Custody compensation is strictly pinned to the n03_reconcile connection.');
        }

        $connection = DB::connection($this->connectionName);
        if ($connection->getName() !== self::CONNECTION_NAME) {
            throw new CustodyViolationException('Custody reconcile connection identity drift detected.');
        }

        return $connection;
    }

    private function assertReconcileRoleReadIdentity(ConnectionInterface $connection): void
    {
        $identity = $connection->selectOne('SELECT session_user AS session_user, current_user AS current_user');
        if ($identity === null
            || (string) $identity->session_user !== self::CONNECTION_NAME
            || (string) $identity->current_user !== self::CONNECTION_NAME) {
            throw new CustodyViolationException('Custody compensation must execute exclusively as PostgreSQL role n03_reconcile.');
        }
    }

    private function assertReconcileSessionIdentity(ConnectionInterface $connection): void
    {
        $identity = $connection->selectOne(
            "SELECT session_user AS session_user, current_user AS current_user, current_setting('transaction_isolation') AS isolation"
        );

        if ($identity === null
            || (string) $identity->session_user !== self::CONNECTION_NAME
            || (string) $identity->current_user !== self::CONNECTION_NAME) {
            throw new CustodyViolationException('Custody compensation must execute exclusively as PostgreSQL role n03_reconcile.');
        }

        if ((string) $identity->isolation !== 'read committed') {
            throw new CustodyViolationException('Custody compensation requires PostgreSQL READ COMMITTED transaction isolation.');
        }
    }

    private function resolveHmacKey(): string
    {
        $key = $this->hmacKey ?? config('legacy_custody.broker_hmac_key');
        if (! is_string($key) || strlen($key) < 32) {
            throw new CustodyViolationException('Custody compensation requires a valid >= 32 byte broker HMAC key.');
        }

        return $key;
    }
}
