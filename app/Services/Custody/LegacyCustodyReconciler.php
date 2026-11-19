<?php

declare(strict_types=1);

namespace App\Services\Custody;

use App\Domain\Custody\BrokerCloseAck;
use App\Domain\Custody\Exceptions\CustodyOperationUncertainException;
use App\Domain\Custody\Exceptions\CustodyViolationException;
use App\Services\Custody\Broker\LocalImmutableBrokerEngine;
use App\Services\Custody\Contracts\StorageBrokerClient;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

final class LegacyCustodyReconciler
{
    public const CONNECTION_NAME = 'n03_reconcile';

    public function __construct(
        private readonly StorageBrokerClient $broker,
        private readonly ?string $hmacKey = null,
        private readonly string $connectionName = self::CONNECTION_NAME,
    ) {}

    /**
     * Adjudicate authoritative primary DB state for an uncertain/stalled operation.
     *
     * Never deletes bytes on COMMITTED operations, DB errors, or broker timeouts.
     *
     * @param  ?callable(string, array<string, mixed>): void  $cutPointHook
     * @return array{
     *     status: string,
     *     operation_id: string,
     *     receipt_uuid: string,
     *     evidence_ref: ?string,
     *     close_ack: ?BrokerCloseAck
     * }
     */
    public function reconcile(string $operationId, ?callable $cutPointHook = null): array
    {
        $operationId = strtolower(trim($operationId));
        if (! Str::isUuid($operationId)) {
            throw new CustodyViolationException('Custody reconciliation requires a valid UUID operation_id.');
        }

        $connection = $this->resolveReconcileConnection();
        if ($connection->transactionLevel() > 0) {
            throw new CustodyViolationException('Custody reconciliation refuses nested outer transactions.');
        }

        $hmacKey = $this->resolveHmacKey();

        try {
            $this->assertReconcileRoleReadIdentity($connection);

            $operation = $connection->table('legacy_custody.operations')
                ->where('operation_id', $operationId)
                ->first();

            if ($operation === null) {
                throw new CustodyViolationException("Custody operation [{$operationId}] was not found.");
            }

            $existingReceipt = $this->fetchTerminalReceipt($connection, $operationId);
            if ($existingReceipt !== null) {
                return $this->formatExistingTerminalReceipt($operationId, $existingReceipt);
            }

            $gate = $connection->table('legacy_custody.operation_gates')
                ->where('operation_id', $operationId)
                ->first();

            if ($gate === null) {
                throw new CustodyViolationException("Custody operation [{$operationId}] is missing its operation_gates row.");
            }

            if ((string) $gate->state === 'OPEN') {
                $racedOutcome = $this->closeDatabaseGate($connection, $operationId);
                if ($racedOutcome !== null) {
                    return $racedOutcome;
                }
            } elseif ((string) $gate->state === 'CLOSED' && (int) $gate->fence_no === 2) {
                $zeroCheck = $connection->selectOne(
                    'SELECT legacy_custody.zero_artifacts(?) AS ok',
                    [$operationId],
                );
                if ($zeroCheck === null || ! $zeroCheck->ok) {
                    throw new CustodyViolationException(
                        "CLOSED operation [{$operationId}] has non-zero command artifacts; abort refused."
                    );
                }
            } else {
                throw new CustodyViolationException(
                    "Unsupported operation gate state [{$gate->state}:{$gate->fence_no}] for [{$operationId}]."
                );
            }
        } catch (CustodyViolationException|CustodyOperationUncertainException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            throw new CustodyOperationUncertainException(
                "Authoritative primary DB unavailable while reconciling operation [{$operationId}]; bytes retained untouched.",
                previous: $exception,
            );
        }

        if ($cutPointHook !== null) {
            $cutPointHook('after_db_gate_closed', [
                'operation_id' => $operationId,
                'namespace_id' => (string) $operation->namespace_id,
            ]);
        }

        try {
            $closeAck = $this->broker->closeFence(
                namespaceId: (string) $operation->namespace_id,
                operationId: $operationId,
                fenceNo: 2,
            );
        } catch (Throwable $exception) {
            throw new CustodyOperationUncertainException(
                "Broker closeFence failed for operation [{$operationId}]; abort terminal receipt withheld and bytes retained.",
                previous: $exception,
            );
        }

        if ($closeAck->operationId !== $operationId
            || $closeAck->namespaceId !== (string) $operation->namespace_id
            || $closeAck->fenceNo !== 2
            || ! LocalImmutableBrokerEngine::verifyCloseAck($closeAck, $hmacKey)) {
            throw new CustodyViolationException(
                "BrokerCloseAck verification failed for operation [{$operationId}]; abort terminal receipt withheld."
            );
        }

        if ($cutPointHook !== null) {
            $cutPointHook('after_broker_fence_closed', [
                'operation_id' => $operationId,
                'close_ack' => $closeAck,
            ]);
        }

        $receiptUuid = (string) Str::uuid();
        $connection->beginTransaction();

        try {
            $this->assertReconcileSessionIdentity($connection);

            $connection->table('legacy_custody.terminal_receipts')->insert([
                'operation_id' => $operationId,
                'outcome' => 'ABORTED',
                'fence_no' => 2,
                'receipt_uuid' => $receiptUuid,
                'manifest_digest' => (string) $operation->manifest_digest,
                'evidence_ref' => $closeAck->closeAckId,
                'actor_user_id' => (int) $operation->actor_user_id,
                'service_identity' => (string) $operation->service_identity,
            ]);

            $connection->commit();

            return [
                'status' => 'ABORTED',
                'operation_id' => $operationId,
                'receipt_uuid' => $receiptUuid,
                'evidence_ref' => $closeAck->closeAckId,
                'close_ack' => $closeAck,
            ];
        } catch (QueryException $exception) {
            if ($connection->transactionLevel() > 0) {
                try {
                    $connection->rollBack();
                } catch (Throwable) {
                }
            }

            try {
                $racedReceipt = $this->fetchTerminalReceipt($connection, $operationId);
                if ($racedReceipt !== null) {
                    return $this->formatExistingTerminalReceipt($operationId, $racedReceipt);
                }
            } catch (CustodyViolationException $violation) {
                throw $violation;
            } catch (Throwable) {
            }

            throw new CustodyOperationUncertainException(
                "Failed committing ABORTED terminal receipt for [{$operationId}]; bytes retained.",
                previous: $exception,
            );
        } catch (CustodyViolationException|CustodyOperationUncertainException $exception) {
            if ($connection->transactionLevel() > 0) {
                try {
                    $connection->rollBack();
                } catch (Throwable) {
                }
            }

            throw $exception;
        } catch (Throwable $exception) {
            if ($connection->transactionLevel() > 0) {
                try {
                    $connection->rollBack();
                } catch (Throwable) {
                }
            }

            throw new CustodyOperationUncertainException(
                "Failed committing ABORTED terminal receipt for [{$operationId}]; bytes retained.",
                previous: $exception,
            );
        }
    }

    /**
     * @return ?array{
     *     status: string,
     *     operation_id: string,
     *     receipt_uuid: string,
     *     evidence_ref: ?string,
     *     close_ack: ?BrokerCloseAck
     * }
     */
    private function closeDatabaseGate(ConnectionInterface $connection, string $operationId): ?array
    {
        $connection->beginTransaction();

        try {
            $this->assertReconcileSessionIdentity($connection);

            $affected = $connection->table('legacy_custody.operation_gates')
                ->where('operation_id', $operationId)
                ->where('state', 'OPEN')
                ->where('fence_no', 1)
                ->update([
                    'state' => 'CLOSED',
                    'fence_no' => 2,
                ]);

            if ($affected !== 1) {
                $connection->rollBack();

                $racedReceipt = $this->fetchTerminalReceipt($connection, $operationId);
                if ($racedReceipt !== null) {
                    return $this->formatExistingTerminalReceipt($operationId, $racedReceipt);
                }

                $gateAfter = $connection->table('legacy_custody.operation_gates')
                    ->where('operation_id', $operationId)
                    ->first();

                if ($gateAfter !== null && (string) $gateAfter->state === 'CLOSED' && (int) $gateAfter->fence_no === 2) {
                    return null;
                }

                throw new CustodyOperationUncertainException(
                    "Unable to close operation gate for [{$operationId}]; outcome uncertain."
                );
            }

            $connection->table('legacy_custody.operation_events')->insert([
                'event_id' => (string) Str::uuid(),
                'operation_id' => $operationId,
                'fence_no' => 2,
                'kind' => 'CLOSED_WITNESS',
                'evidence_ref' => 'n03-k2:gate-closed:'.$operationId,
            ]);

            $connection->commit();

            return null;
        } catch (QueryException $exception) {
            if ($connection->transactionLevel() > 0) {
                try {
                    $connection->rollBack();
                } catch (Throwable) {
                }
            }

            try {
                $racedReceipt = $this->fetchTerminalReceipt($connection, $operationId);
                if ($racedReceipt !== null) {
                    return $this->formatExistingTerminalReceipt($operationId, $racedReceipt);
                }
            } catch (CustodyViolationException $violation) {
                throw $violation;
            } catch (Throwable) {
            }

            throw new CustodyOperationUncertainException(
                "Database gate close failed for operation [{$operationId}]; bytes retained untouched.",
                previous: $exception,
            );
        } catch (CustodyViolationException|CustodyOperationUncertainException $exception) {
            if ($connection->transactionLevel() > 0) {
                try {
                    $connection->rollBack();
                } catch (Throwable) {
                }
            }

            throw $exception;
        } catch (Throwable $exception) {
            if ($connection->transactionLevel() > 0) {
                try {
                    $connection->rollBack();
                } catch (Throwable) {
                }
            }

            throw new CustodyOperationUncertainException(
                "Database gate close failed for operation [{$operationId}]; bytes retained untouched.",
                previous: $exception,
            );
        }
    }

    private function fetchTerminalReceipt(ConnectionInterface $connection, string $operationId): ?object
    {
        return $connection->table('legacy_custody.terminal_receipts')
            ->where('operation_id', $operationId)
            ->first();
    }

    /**
     * @return array{
     *     status: string,
     *     operation_id: string,
     *     receipt_uuid: string,
     *     evidence_ref: ?string,
     *     close_ack: ?BrokerCloseAck
     * }
     */
    private function formatExistingTerminalReceipt(string $operationId, object $receipt): array
    {
        $outcome = (string) $receipt->outcome;
        if ($outcome === 'COMMITTED') {
            return [
                'status' => 'ALREADY_COMMITTED',
                'operation_id' => $operationId,
                'receipt_uuid' => (string) $receipt->receipt_uuid,
                'evidence_ref' => (string) $receipt->evidence_ref,
                'close_ack' => null,
            ];
        }

        if ($outcome === 'ABORTED') {
            return [
                'status' => 'ALREADY_ABORTED',
                'operation_id' => $operationId,
                'receipt_uuid' => (string) $receipt->receipt_uuid,
                'evidence_ref' => (string) $receipt->evidence_ref,
                'close_ack' => null,
            ];
        }

        throw new CustodyViolationException("Unsupported terminal receipt outcome [{$outcome}] for [{$operationId}].");
    }

    private function resolveReconcileConnection(): ConnectionInterface
    {
        if ($this->connectionName !== self::CONNECTION_NAME) {
            throw new CustodyViolationException('Custody reconciler is strictly pinned to the n03_reconcile connection.');
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
            throw new CustodyViolationException('Custody reconciliation must execute exclusively as PostgreSQL role n03_reconcile.');
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
            throw new CustodyViolationException('Custody reconciliation must execute exclusively as PostgreSQL role n03_reconcile.');
        }

        if ((string) $identity->isolation !== 'read committed') {
            throw new CustodyViolationException('Custody reconciliation requires PostgreSQL READ COMMITTED transaction isolation.');
        }
    }

    private function resolveHmacKey(): string
    {
        $key = $this->hmacKey ?? config('legacy_custody.broker_hmac_key');
        if (! is_string($key) || strlen($key) < 32) {
            throw new CustodyViolationException('Custody reconciliation requires a valid >= 32 byte broker HMAC key.');
        }

        return $key;
    }
}
