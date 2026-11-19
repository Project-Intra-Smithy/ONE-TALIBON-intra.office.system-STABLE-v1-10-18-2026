<?php

declare(strict_types=1);

namespace App\Services\Custody;

use App\Domain\Custody\CommandOutcome;
use App\Domain\Custody\Exceptions\CustodyFenceClosedException;
use App\Domain\Custody\Exceptions\CustodyIdempotencyMismatchException;
use App\Domain\Custody\Exceptions\CustodyOperationAbortedException;
use App\Domain\Custody\Exceptions\CustodyOperationPendingException;
use App\Domain\Custody\Exceptions\CustodyViolationException;
use Illuminate\Support\Facades\DB;
use Throwable;

final class LegacyCustodyReplayService
{
    private const ALLOWED_READ_ROLES = [
        'n03_command',
        'n03_reconcile',
        'n03_reader',
    ];

    public function __construct(
        private readonly string $connectionName = LegacyCustodyCommandService::CONNECTION_NAME,
    ) {}

    /**
     * Perform a READ ONLY idempotency lookup and full fieldwise verification across
     * the operation tuple and every ordered operation_items row.
     *
     * @param  list<array{ordinal: int, size_bytes: int, sha256: string, mime_type: string}>  $expectedItems
     */
    public function lookupOrVerify(
        string $namespaceId,
        int $actorUserId,
        int $officeId,
        string $serviceIdentity,
        string $commandKind,
        string $idempotencyHash,
        int $expectedEpoch,
        string $expectedCommandAction,
        int $expectedItemCount,
        string $expectedManifestDigest,
        array $expectedItems,
    ): ?CommandOutcome {
        $connection = DB::connection($this->connectionName);

        if ($connection->transactionLevel() > 0) {
            throw new CustodyViolationException('Custody replay lookup refuses nested outer transactions.');
        }

        $connection->beginTransaction();

        try {
            $connection->unprepared('SET TRANSACTION READ ONLY');

            $identity = $connection->selectOne(
                'SELECT session_user AS session_user, current_user AS current_user'
            );

            if ($identity === null
                || ! in_array((string) $identity->session_user, self::ALLOWED_READ_ROLES, true)
                || (string) $identity->session_user !== (string) $identity->current_user) {
                throw new CustodyViolationException('Custody replay lookup requires an authorized N03 custody role.');
            }

            $operation = $connection->table('legacy_custody.operations')
                ->where('namespace_id', $namespaceId)
                ->where('actor_user_id', $actorUserId)
                ->where('office_id', $officeId)
                ->where('service_identity', $serviceIdentity)
                ->where('command_kind', $commandKind)
                ->where('idempotency_hash', $idempotencyHash)
                ->first();

            if ($operation === null) {
                $connection->commit();

                return null;
            }

            $operationId = (string) $operation->operation_id;

            if ((int) $operation->epoch !== $expectedEpoch
                || (string) $operation->command_action !== $expectedCommandAction
                || (int) $operation->item_count !== $expectedItemCount
                || (string) $operation->manifest_digest !== $expectedManifestDigest) {
                throw new CustodyIdempotencyMismatchException(
                    "Idempotency key collision for operation [{$operationId}]: operation metadata mismatch."
                );
            }

            $actualItems = $connection->table('legacy_custody.operation_items')
                ->where('operation_id', $operationId)
                ->orderBy('ordinal')
                ->get()
                ->all();

            $normalizedExpected = $expectedItems;
            usort(
                $normalizedExpected,
                static fn (array $left, array $right): int => $left['ordinal'] <=> $right['ordinal'],
            );

            if (count($actualItems) !== $expectedItemCount || count($normalizedExpected) !== $expectedItemCount) {
                throw new CustodyIdempotencyMismatchException(
                    "Idempotency key collision for operation [{$operationId}]: item count mismatch."
                );
            }

            foreach ($actualItems as $index => $actual) {
                $expected = $normalizedExpected[$index];

                if ((int) $actual->ordinal !== (int) $expected['ordinal']
                    || (int) $actual->size_bytes !== (int) $expected['size_bytes']
                    || (string) $actual->sha256 !== (string) $expected['sha256']
                    || (string) $actual->mime_type !== (string) $expected['mime_type']) {
                    throw new CustodyIdempotencyMismatchException(
                        "Idempotency key collision for operation [{$operationId}] at ordinal {$expected['ordinal']}."
                    );
                }
            }

            $receipt = $connection->table('legacy_custody.terminal_receipts')
                ->where('operation_id', $operationId)
                ->first();

            if ($receipt === null) {
                $gate = $connection->table('legacy_custody.operation_gates')
                    ->where('operation_id', $operationId)
                    ->first();

                if ($gate !== null && (string) $gate->state === 'CLOSED') {
                    throw new CustodyFenceClosedException(
                        "Custody operation [{$operationId}] gate is CLOSED pending abort reconciliation."
                    );
                }

                throw new CustodyOperationPendingException(
                    "Custody operation [{$operationId}] is still pending completion."
                );
            }

            $outcome = (string) $receipt->outcome;
            if ($outcome === 'ABORTED') {
                throw new CustodyOperationAbortedException(
                    "Custody operation [{$operationId}] has already terminated as ABORTED."
                );
            }

            if ($outcome !== 'COMMITTED') {
                throw new CustodyViolationException(
                    "Custody operation [{$operationId}] has unsupported terminal outcome [{$outcome}]."
                );
            }

            $result = $connection->table('legacy_custody.command_results')
                ->where('operation_id', $operationId)
                ->first();

            if ($result === null) {
                throw new CustodyViolationException(
                    "Committed operation [{$operationId}] is missing its command_results record."
                );
            }

            $bindings = $connection->table('legacy_custody.bindings')
                ->where('operation_id', $operationId)
                ->orderBy('ordinal')
                ->get()
                ->all();

            if (count($bindings) !== (int) $operation->item_count) {
                throw new CustodyViolationException(
                    "Committed operation [{$operationId}] binding count does not match item_count."
                );
            }

            $documents = array_map(
                static fn (object $binding): array => [
                    'ordinal' => (int) $binding->ordinal,
                    'document_id' => (int) $binding->document_id,
                    'document_public_id' => (string) $binding->document_public_id,
                    'generation_id' => (string) $binding->generation_id,
                    'upload_audit_id' => (int) $binding->upload_audit_id,
                ],
                $bindings,
            );

            $connection->commit();

            return new CommandOutcome(
                operationId: $operationId,
                receiptUuid: (string) $receipt->receipt_uuid,
                outcome: $outcome,
                sourceKind: (string) $result->source_kind,
                sourceId: (int) $result->source_id,
                eventId: (int) $result->event_id,
                eventAction: (string) $result->event_action,
                correlationId: (string) $result->correlation_id,
                manifestDigest: (string) $receipt->manifest_digest,
                replayed: true,
                documents: $documents,
            );
        } catch (Throwable $exception) {
            if ($connection->transactionLevel() > 0) {
                $connection->rollBack();
            }

            throw $exception;
        }
    }
}
