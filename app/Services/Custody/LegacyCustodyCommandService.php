<?php

declare(strict_types=1);

namespace App\Services\Custody;

use App\Domain\Custody\CommandOutcome;
use App\Domain\Custody\Exceptions\CustodyFenceClosedException;
use App\Domain\Custody\Exceptions\CustodyViolationException;
use App\Domain\Custody\ProducedSourceEvent;
use App\Domain\Custody\VerifiedCommandActor;
use App\Services\AuditLogger;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

final class LegacyCustodyCommandService
{
    public const CONNECTION_NAME = 'n03_command';

    public function __construct(
        private readonly AuditLogger $audit,
        private readonly string $connectionName = self::CONNECTION_NAME,
    ) {}

    /**
     * Execute a business command and bind its staged registry artifacts inside one
     * ACID transaction on the pinned n03_command connection.
     *
     * @param  callable(ConnectionInterface, VerifiedCommandActor, string): ProducedSourceEvent  $businessCommand
     * @param  array<int, array{title?: string, original_name?: string, classification?: string, retention_code?: ?string, metadata?: array<string, mixed>}>  $itemMetadataByOrdinal
     * @param  ?callable(string, array<string, mixed>): void  $cutPointHook
     */
    public function execute(
        string $operationId,
        callable $businessCommand,
        array $itemMetadataByOrdinal = [],
        ?int $expectedSessionVersion = null,
        ?string $expectedRole = null,
        ?callable $cutPointHook = null,
    ): CommandOutcome {
        if (! Str::isUuid($operationId)) {
            throw new CustodyViolationException('Custody command execution requires a valid UUID operation_id.');
        }

        if ($this->connectionName !== self::CONNECTION_NAME) {
            throw new CustodyViolationException('Custody command execution is strictly pinned to the n03_command connection.');
        }

        $connection = DB::connection($this->connectionName);

        if ($connection->getName() !== self::CONNECTION_NAME) {
            throw new CustodyViolationException('Custody command connection identity drift detected.');
        }

        if ($connection->transactionLevel() > 0) {
            throw new CustodyViolationException('Custody command execution refuses nested outer transactions.');
        }

        $connection->beginTransaction();

        try {
            $this->assertCommandSessionIdentity($connection);
            $this->lockOpenFence($connection, $operationId);

            $operation = $connection->table('legacy_custody.operations')
                ->where('operation_id', $operationId)
                ->first();

            if ($operation === null) {
                throw new CustodyViolationException("Custody operation [{$operationId}] was not found.");
            }

            $itemCount = (int) $operation->item_count;
            $items = $connection->table('legacy_custody.operation_items')
                ->where('operation_id', $operationId)
                ->orderBy('ordinal')
                ->get()
                ->all();

            if (count($items) !== $itemCount) {
                throw new CustodyViolationException('Custody operation items count does not match reservation item_count.');
            }

            $generations = $connection->table('legacy_custody.generations')
                ->where('operation_id', $operationId)
                ->orderBy('ordinal')
                ->get()
                ->all();

            if (count($generations) !== $itemCount) {
                throw new CustodyViolationException('Custody operation is not fully staged for command execution.');
            }

            foreach ($items as $index => $item) {
                $expectedOrdinal = $index + 1;
                $generation = $generations[$index] ?? null;

                if ((int) $item->ordinal !== $expectedOrdinal
                    || $generation === null
                    || (int) $generation->ordinal !== $expectedOrdinal
                    || (string) $generation->generation_id !== (string) $item->generation_id
                    || (int) $generation->size_bytes !== (int) $item->size_bytes
                    || (string) $generation->sha256 !== (string) $item->sha256
                    || (string) $generation->mime_type !== (string) $item->mime_type
                    || (string) $generation->locator !== (string) $item->locator) {
                    throw new CustodyViolationException("Staged generation mismatch at ordinal {$expectedOrdinal}.");
                }
            }

            $actorUserId = (int) $operation->actor_user_id;
            $officeId = (int) $operation->office_id;
            $correlationId = (string) $operation->correlation_id;

            $verifiedActor = VerifiedCommandActor::verifyOnConnection(
                connection: $connection,
                actorUserId: $actorUserId,
                expectedOfficeId: $officeId,
                expectedSessionVersion: $expectedSessionVersion,
                expectedRole: $expectedRole,
            );

            $produced = $businessCommand($connection, $verifiedActor, $correlationId);

            if (! $produced instanceof ProducedSourceEvent) {
                throw new CustodyViolationException('Business command closure must return ProducedSourceEvent.');
            }

            $this->assertProducedMatchesOperation($operation, $produced);

            $this->invokeCutPoint($cutPointHook, 'after_business', [
                'operation_id' => $operationId,
                'source_kind' => $produced->sourceKind,
                'source_id' => $produced->sourceId,
                'event_id' => $produced->eventId,
            ]);

            $connection->table('legacy_custody.command_results')->insert([
                'operation_id' => $operationId,
                'fence_no' => 1,
                'source_kind' => $produced->sourceKind,
                'source_id' => $produced->sourceId,
                'event_id' => $produced->eventId,
                'actor_user_id' => $actorUserId,
                'office_id' => $officeId,
                'correlation_id' => $correlationId,
                'event_action' => $produced->eventAction,
            ]);

            // Bind the previously emitted, unmarked close audit to the exact
            // source event and reserved custody operation on this SAME
            // n03_command transaction. PostgreSQL verifies the terminal
            // receipt and all tuples with a deferred constraint at commit.
            if ($produced->sourceKind === 'transaction' && $produced->eventAction === 'close') {
                if ($produced->auditId === null) {
                    throw new CustodyViolationException('OPS009 close requires an identified source audit.');
                }
                $connection->table('ops009_close_audit_bindings')->insert([
                    'audit_id' => $produced->auditId,
                    'transaction_event_id' => $produced->eventId,
                    'transaction_id' => $produced->sourceId,
                    'operation_id' => $operationId,
                ]);
            }

            $this->invokeCutPoint($cutPointHook, 'after_command_result', [
                'operation_id' => $operationId,
                'source_id' => $produced->sourceId,
                'event_id' => $produced->eventId,
            ]);

            $expectedLinks = $connection->select(
                'SELECT linkable_type, source_id, relationship FROM legacy_custody.expected_links(?)',
                [$operationId],
            );

            if ($expectedLinks === []) {
                throw new CustodyViolationException('Custody expected_links returned no authoritative parent links.');
            }

            $documentType = count($expectedLinks) === 2
                ? 'supporting_document'
                : (string) $expectedLinks[0]->relationship;

            $relationships = array_values(array_unique(array_map(
                static fn (object $link): string => (string) $link->relationship,
                $expectedLinks,
            )));

            $now = now();
            $timestamp = $now->format('Y-m-d H:i:sP');
            $committedDocuments = [];

            $allowedClassifications = ['public', 'internal', 'confidential', 'restricted'];
            if (! in_array($produced->classification, $allowedClassifications, true)) {
                throw new CustodyViolationException('Produced source event carried an unsupported classification.');
            }

            foreach ($items as $item) {
                $ordinal = (int) $item->ordinal;
                $meta = $itemMetadataByOrdinal[$ordinal] ?? [];
                if (array_key_exists('classification', $meta)) {
                    $requestedClassification = is_string($meta['classification']) ? $meta['classification'] : '';
                    if (! in_array($requestedClassification, $allowedClassifications, true)
                        || $requestedClassification !== $produced->classification) {
                        throw new CustodyViolationException(
                            'Custody item classification cannot override or diverge from authoritative source classification.'
                        );
                    }
                }
                $classification = $produced->classification;
                $title = (string) ($meta['title'] ?? ($meta['original_name'] ?? "Evidence #{$ordinal}"));
                $originalName = (string) ($meta['original_name'] ?? $title);
                $documentPublicId = (string) Str::uuid();
                $extraMeta = isset($meta['metadata']) && is_array($meta['metadata']) ? $meta['metadata'] : [];

                $documentId = (int) $connection->table('documents')->insertGetId([
                    'public_id' => $documentPublicId,
                    'title' => $title,
                    'document_type' => $documentType,
                    'classification' => $classification,
                    'original_name' => $originalName,
                    'mime_type' => (string) $item->mime_type,
                    'size_bytes' => (int) $item->size_bytes,
                    'storage_disk' => 'legacy_registry_v1',
                    'storage_path' => null,
                    'checksum_sha256' => (string) $item->sha256,
                    'owner_department_id' => $officeId,
                    'uploaded_by_user_id' => $actorUserId,
                    'retention_code' => isset($meta['retention_code']) && is_string($meta['retention_code'])
                        ? $meta['retention_code']
                        : null,
                    'metadata' => json_encode(
                        array_merge($extraMeta, [
                            'source' => 'legacy_custody_registry_v1',
                            'relationships' => $relationships,
                        ]),
                        JSON_THROW_ON_ERROR,
                    ),
                    'security_domain' => 'LEGACY_CTW',
                    'custody_mode' => 'REGISTRY_V1',
                    'custody_operation_id' => $operationId,
                    'custody_ordinal' => $ordinal,
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ]);

                $this->invokeCutPoint($cutPointHook, 'after_document', [
                    'operation_id' => $operationId,
                    'ordinal' => $ordinal,
                    'document_id' => $documentId,
                    'document_public_id' => $documentPublicId,
                ]);

                $uploadAuditId = $this->audit->recordOnConnection(
                    connection: $connection,
                    actorUserId: $actorUserId,
                    actorDepartmentId: $officeId,
                    action: 'document.uploaded',
                    summary: 'Uploaded protected Core Portal evidence.',
                    correlationId: $correlationId,
                    entityType: 'document',
                    entityId: $documentId,
                    outcome: 'allowed',
                    custodyOperationId: $operationId,
                    createdAt: $now,
                );

                $this->invokeCutPoint($cutPointHook, 'after_audit', [
                    'operation_id' => $operationId,
                    'ordinal' => $ordinal,
                    'document_id' => $documentId,
                    'upload_audit_id' => $uploadAuditId,
                ]);

                $connection->table('legacy_custody.bindings')->insert([
                    'document_id' => $documentId,
                    'document_public_id' => $documentPublicId,
                    'generation_id' => (string) $item->generation_id,
                    'operation_id' => $operationId,
                    'ordinal' => $ordinal,
                    'fence_no' => 1,
                    'upload_audit_id' => $uploadAuditId,
                ]);

                $this->invokeCutPoint($cutPointHook, 'after_binding', [
                    'operation_id' => $operationId,
                    'ordinal' => $ordinal,
                    'document_id' => $documentId,
                    'generation_id' => (string) $item->generation_id,
                ]);

                foreach ($expectedLinks as $link) {
                    $linkableType = (string) $link->linkable_type;
                    $linkableId = (int) $link->source_id;
                    $relationship = (string) $link->relationship;

                    $documentLinkId = (int) $connection->table('document_links')->insertGetId([
                        'document_id' => $documentId,
                        'linkable_type' => $linkableType,
                        'linkable_id' => $linkableId,
                        'relationship' => $relationship,
                        'created_by_user_id' => $actorUserId,
                        'created_at' => $timestamp,
                        'updated_at' => $timestamp,
                    ]);

                    $this->invokeCutPoint($cutPointHook, 'after_link', [
                        'operation_id' => $operationId,
                        'ordinal' => $ordinal,
                        'document_id' => $documentId,
                        'document_link_id' => $documentLinkId,
                        'relationship' => $relationship,
                    ]);

                    $connection->table('legacy_custody.ownership_links')->insert([
                        'binding_document_id' => $documentId,
                        'public_document_link_id' => $documentLinkId,
                        'linkable_type' => $linkableType,
                        'source_id' => $linkableId,
                        'relationship' => $relationship,
                        'created_by_user_id' => $actorUserId,
                    ]);

                    $this->invokeCutPoint($cutPointHook, 'after_ownership_link', [
                        'operation_id' => $operationId,
                        'ordinal' => $ordinal,
                        'document_id' => $documentId,
                        'document_link_id' => $documentLinkId,
                        'relationship' => $relationship,
                    ]);
                }

                $committedDocuments[] = [
                    'ordinal' => $ordinal,
                    'document_id' => $documentId,
                    'document_public_id' => $documentPublicId,
                    'generation_id' => (string) $item->generation_id,
                    'upload_audit_id' => $uploadAuditId,
                ];
            }

            $receiptUuid = (string) Str::uuid();
            $connection->table('legacy_custody.terminal_receipts')->insert([
                'operation_id' => $operationId,
                'outcome' => 'COMMITTED',
                'fence_no' => 1,
                'receipt_uuid' => $receiptUuid,
                'manifest_digest' => (string) $operation->manifest_digest,
                'evidence_ref' => sprintf('n03-g2b:%s:%d:%d', $produced->sourceKind, $produced->sourceId, $produced->eventId),
                'actor_user_id' => $actorUserId,
                'service_identity' => (string) $operation->service_identity,
            ]);

            // R3 spike: create an origin-office notice only from this pinned
            // n03_command transaction, AFTER the terminal receipt exists and
            // BEFORE the injected after_receipt failure cutpoint. PostgreSQL
            // validates recipient, event, audit, command and privacy text.
            // The existing ordinary Eloquent listener remains untouched.
            if ($produced->sourceKind === 'transaction' && $produced->eventAction === 'close') {
                $notified = $connection->affectingStatement(<<<'SQL'
                    INSERT INTO public.platform_notifications
                        (user_id, department_id, event_key, source_domain, source_type,
                         source_id, priority, title, message, action_url,
                         requires_acknowledgement, created_at, updated_at)
                    SELECT usr.id, tx.origin_department_id,
                           'transaction-event-' || CAST(? AS text),
                           'transaction', 'App\Models\WorkflowTransaction',
                           tx.id, 'action_required', 'Transaction completed',
                           tx.reference_no || ' · ' || tx.title,
                           '/transactions/' || CAST(tx.id AS text),
                           FALSE, now(), now()
                    FROM public.transactions tx
                    JOIN public.departments dep ON dep.id=tx.origin_department_id
                    JOIN public.employees emp
                      ON emp.department_id=dep.id
                     AND emp.user_id=tx.created_by_user_id
                    JOIN public.users usr ON usr.id=emp.user_id
                    JOIN public.ops009_close_audit_bindings binding ON binding.transaction_id=tx.id
                    JOIN legacy_custody.command_results cr ON cr.operation_id=binding.operation_id
                    JOIN legacy_custody.terminal_receipts receipt ON receipt.operation_id=binding.operation_id
                    WHERE tx.id=?
                      AND binding.transaction_event_id=?
                      AND binding.operation_id=CAST(? AS uuid)
                      AND cr.source_kind='transaction' AND cr.event_action='close'
                      AND cr.transaction_event_id=binding.transaction_event_id
                      AND receipt.outcome='COMMITTED' AND receipt.fence_no=1
                      AND dep.is_active AND dep.is_routable
                      AND usr.is_active AND usr.account_status='active'
                      AND usr.suspended_at IS NULL
                      AND emp.employment_status='active'
                      AND emp.separation_date IS NULL
                    ON CONFLICT (user_id,event_key) DO NOTHING
                    SQL, [
                    $produced->eventId,
                    $produced->sourceId,
                    $produced->eventId,
                    $operationId,
                ]);

                if ($notified < 1) {
                    // No broad office blast and no fabricated recipient.
                    // Instead record exactly one immutable exception in the
                    // SAME N03 command transaction, only if an actual eligible
                    // origin-office Head can operate the restricted queue.
                    $queued = $connection->affectingStatement(<<<'SQL'
                        INSERT INTO public.ops009_origin_delivery_exceptions
                            (operation_id, transaction_id, transaction_event_id, origin_department_id)
                        SELECT CAST(? AS uuid), tx.id, ev.id, tx.origin_department_id
                          FROM public.transactions tx
                          JOIN public.transaction_events ev
                            ON ev.transaction_id=tx.id AND ev.id=? AND ev.action='close'
                          JOIN public.ops009_close_audit_bindings binding
                            ON binding.transaction_id=tx.id
                           AND binding.transaction_event_id=ev.id
                           AND binding.operation_id=CAST(? AS uuid)
                         WHERE tx.id=? AND tx.status='closed'
                           AND EXISTS (
                             SELECT 1
                               FROM public.users head
                               JOIN public.employees emp ON emp.user_id=head.id
                               JOIN public.departments dep ON dep.id=emp.department_id
                              WHERE emp.department_id=tx.origin_department_id
                                AND head.role='department_head'
                                AND head.is_active
                                AND head.account_status='active'
                                AND head.suspended_at IS NULL
                                AND emp.employment_status='active'
                                AND emp.separation_date IS NULL
                                AND dep.is_active AND dep.is_routable
                           )
                        SQL, [
                        $operationId,
                        $produced->eventId,
                        $operationId,
                        $produced->sourceId,
                    ]);

                    // Without an actionable, verified queue custodian, neither
                    // close, receipt nor exception is allowed to commit.
                    if ($queued !== 1) {
                        throw new CustodyViolationException(
                            'No eligible origin recipient and no active authorized office escalation custodian; closure rolled back.'
                        );
                    }
                }
            }

            $this->invokeCutPoint($cutPointHook, 'after_receipt', [
                'operation_id' => $operationId,
                'receipt_uuid' => $receiptUuid,
            ]);

            $connection->commit();

            return new CommandOutcome(
                operationId: $operationId,
                receiptUuid: $receiptUuid,
                outcome: 'COMMITTED',
                sourceKind: $produced->sourceKind,
                sourceId: $produced->sourceId,
                eventId: $produced->eventId,
                eventAction: $produced->eventAction,
                correlationId: $correlationId,
                manifestDigest: (string) $operation->manifest_digest,
                replayed: false,
                documents: $committedDocuments,
            );
        } catch (Throwable $exception) {
            if ($connection->transactionLevel() > 0) {
                $connection->rollBack();
            }

            throw $exception;
        }
    }

    private function assertCommandSessionIdentity(ConnectionInterface $connection): void
    {
        $identity = $connection->selectOne(
            "SELECT session_user AS session_user, current_user AS current_user, current_setting('transaction_isolation') AS isolation"
        );

        if ($identity === null
            || (string) $identity->session_user !== self::CONNECTION_NAME
            || (string) $identity->current_user !== self::CONNECTION_NAME) {
            throw new CustodyViolationException('Custody command must execute exclusively as PostgreSQL role n03_command.');
        }

        if ((string) $identity->isolation !== 'read committed') {
            throw new CustodyViolationException('Custody command requires PostgreSQL READ COMMITTED transaction isolation.');
        }
    }

    private function lockOpenFence(ConnectionInterface $connection, string $operationId): void
    {
        try {
            $connection->select('SELECT legacy_custody.lock_pending(?, 1, ?)', [$operationId, 'OPEN']);
        } catch (QueryException $exception) {
            $sqlState = (string) ($exception->errorInfo[0] ?? $exception->getCode());
            if ($sqlState === '23514' && str_contains($exception->getMessage(), 'custody fence unavailable')) {
                throw new CustodyFenceClosedException(
                    "Custody operation [{$operationId}] fence is unavailable or already terminal.",
                    previous: $exception,
                );
            }

            throw $exception;
        }
    }

    private function assertProducedMatchesOperation(object $operation, ProducedSourceEvent $produced): void
    {
        $commandKind = (string) $operation->command_kind;
        $commandAction = (string) $operation->command_action;
        $expectedFamily = explode('_', $commandKind, 2)[0];
        $expectedAction = match ($commandKind) {
            'transaction_create' => 'submitted',
            'transaction_transition' => $commandAction,
            'correspondence_register' => 'registered',
            'correspondence_classify' => 'classified',
            'correspondence_route' => 'routed',
            'correspondence_act' => 'in_action',
            'travel_record' => 'recorded_approved',
            'travel_status' => 'status_changed',
            default => throw new CustodyViolationException("Unsupported custody command_kind [{$commandKind}]."),
        };

        if ($produced->sourceKind !== $expectedFamily
            || $produced->eventAction !== $expectedAction
            || $produced->actorUserId !== (int) $operation->actor_user_id
            || $produced->officeId !== (int) $operation->office_id
            || $produced->correlationId !== (string) $operation->correlation_id) {
            throw new CustodyViolationException('Produced source event tuple does not match reserved custody operation.');
        }
    }

    /**
     * @param  ?callable(string, array<string, mixed>): void  $cutPointHook
     * @param  array<string, mixed>  $context
     */
    private function invokeCutPoint(?callable $cutPointHook, string $point, array $context): void
    {
        if ($cutPointHook !== null) {
            $cutPointHook($point, $context);
        }
    }
}
