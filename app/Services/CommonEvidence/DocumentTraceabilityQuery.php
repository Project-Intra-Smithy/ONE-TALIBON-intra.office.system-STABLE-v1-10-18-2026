<?php

declare(strict_types=1);

namespace App\Services\CommonEvidence;

use App\Domain\Identity\VerifiedMunicipalActor;
use App\Models\CorrespondenceEvent;
use App\Models\CorrespondenceRecord;
use App\Models\Document;
use App\Models\DocumentLink;
use App\Models\TransactionEvent;
use App\Models\TravelOrder;
use App\Models\TravelOrderEvent;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\DocumentAccessService;
use App\Services\PlanDocumentOriginGuard;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Authorized per-document lifecycle traceability projection (Stage 4 G5 / Issue #169).
 *
 * Returns actor, office, timestamp, action, outcome, correlation_id, linked source
 * records/events, effective classification (honoring append-only classification_events
 * for immutable REGISTRY_V1 documents), and opaque custody status — with ZERO
 * physical paths, storage locators, raw keys, or secrets.
 */
final class DocumentTraceabilityQuery
{
    public function __construct(
        private readonly DocumentAccessService $documentAccess,
    ) {}

    /**
     * @return array<string, mixed>|null
     */
    public function forAuthorizedDocument(User $actor, Document $document): ?array
    {
        try {
            $verified = VerifiedMunicipalActor::forProtectedSource($actor);
        } catch (AuthorizationException) {
            return null;
        }

        if (PlanDocumentOriginGuard::isProtected($document)) {
            return null;
        }

        $custodyMode = (string) ($document->getAttribute('custody_mode') ?? 'LEGACY_PATH');
        if (! in_array($custodyMode, ['LEGACY_PATH', 'REGISTRY_V1'], true)) {
            return null;
        }
        if ($custodyMode === 'LEGACY_PATH' && $document->getAttribute('custody_operation_id') !== null) {
            return null;
        }

        if (! $this->documentAccess->allLinkedParentsAuthorized($verified, $document)) {
            return null;
        }

        [$linkedSources, $parentIdsByFamily] = $this->collectAuthorizedSources($document);

        $custody = [
            'mode' => $custodyMode,
            'status' => $custodyMode === 'LEGACY_PATH' ? 'legacy_path' : 'unverified',
            'receiptUuid' => null,
        ];
        $effectiveClassification = (string) $document->classification;
        $classificationHistory = [];

        if ($custodyMode === 'REGISTRY_V1') {
            $custodyConnection = $this->resolveCustodyReadConnection();
            if ($custodyConnection !== null) {
                $receiptUuid = $this->findCommittedReceiptUuid($custodyConnection, (int) $document->getKey());
                if ($receiptUuid !== null) {
                    $custody['status'] = 'committed';
                    $custody['receiptUuid'] = $receiptUuid;
                }

                $classificationHistory = $this->loadClassificationHistory($custodyConnection, (int) $document->getKey());
                if ($classificationHistory !== []) {
                    $latest = end($classificationHistory);
                    $effectiveClassification = (string) $latest['newClassification'];
                }
            }
        }

        $timeline = $this->collectAuditTimeline((int) $document->getKey(), $parentIdsByFamily);

        return [
            'documentPublicId' => (string) $document->public_id,
            'title' => (string) $document->title,
            'documentType' => (string) $document->document_type,
            'recordedClassification' => (string) $document->classification,
            'effectiveClassification' => $effectiveClassification,
            'custody' => $custody,
            'linkedSources' => $linkedSources,
            'classificationHistory' => $classificationHistory,
            'timeline' => $timeline,
        ];
    }

    /**
     * @return array{0: list<array<string, mixed>>, 1: array{correspondence: list<int>, travel_order: list<int>, transaction: list<int>}}
     */
    private function collectAuthorizedSources(Document $document): array
    {
        $links = DocumentLink::query()
            ->where('document_id', $document->getKey())
            ->orderBy('id')
            ->get(['id', 'linkable_type', 'linkable_id', 'relationship', 'created_at']);

        $parentIds = [
            'correspondence' => [],
            'travel_order' => [],
            'transaction' => [],
        ];
        $sources = [];

        foreach ($links as $link) {
            $model = Relation::getMorphedModel($link->linkable_type) ?? $link->linkable_type;
            $id = (int) $link->linkable_id;

            if ($model === CorrespondenceRecord::class) {
                $record = CorrespondenceRecord::query()
                    ->select(['id', 'public_id', 'municipal_reference_no', 'external_reference_no', 'subject', 'lifecycle_state', 'created_at'])
                    ->find($id);
                if ($record !== null) {
                    $parentIds['correspondence'][] = (int) $record->id;
                    $sources[] = [
                        'family' => 'correspondence',
                        'kind' => 'record',
                        'sourceId' => (int) $record->id,
                        'reference' => (string) ($record->municipal_reference_no ?: $record->external_reference_no ?: $record->public_id),
                        'title' => (string) $record->subject,
                        'relationship' => (string) $link->relationship,
                        'eventAction' => null,
                        'occurredAt' => $record->created_at?->toIso8601String(),
                    ];
                }
            } elseif ($model === CorrespondenceEvent::class) {
                $event = CorrespondenceEvent::query()
                    ->select(['id', 'correspondence_record_id', 'event', 'occurred_at', 'correlation_id'])
                    ->find($id);
                if ($event !== null) {
                    $parentIds['correspondence'][] = (int) $event->correspondence_record_id;
                    $parent = CorrespondenceRecord::query()
                        ->select(['id', 'public_id', 'municipal_reference_no', 'external_reference_no', 'subject'])
                        ->find((int) $event->correspondence_record_id);
                    $sources[] = [
                        'family' => 'correspondence',
                        'kind' => 'event',
                        'sourceId' => (int) $event->correspondence_record_id,
                        'eventId' => (int) $event->id,
                        'reference' => $parent !== null
                            ? (string) ($parent->municipal_reference_no ?: $parent->external_reference_no ?: $parent->public_id)
                            : (string) $event->correspondence_record_id,
                        'title' => $parent !== null ? (string) $parent->subject : '',
                        'relationship' => (string) $link->relationship,
                        'eventAction' => (string) $event->event,
                        'occurredAt' => $event->occurred_at !== null
                            ? CarbonImmutable::parse($event->occurred_at)->toIso8601String()
                            : null,
                    ];
                }
            } elseif ($model === TravelOrder::class) {
                $order = TravelOrder::query()
                    ->select(['id', 'public_id', 'reference_number', 'purpose', 'status', 'created_at'])
                    ->find($id);
                if ($order !== null) {
                    $parentIds['travel_order'][] = (int) $order->id;
                    $sources[] = [
                        'family' => 'travel_order',
                        'kind' => 'record',
                        'sourceId' => (int) $order->id,
                        'reference' => (string) ($order->reference_number ?: $order->public_id),
                        'title' => (string) $order->purpose,
                        'relationship' => (string) $link->relationship,
                        'eventAction' => null,
                        'occurredAt' => $order->created_at?->toIso8601String(),
                    ];
                }
            } elseif ($model === TravelOrderEvent::class) {
                $event = TravelOrderEvent::query()
                    ->select(['id', 'travel_order_id', 'event', 'occurred_at'])
                    ->find($id);
                if ($event !== null) {
                    $parentIds['travel_order'][] = (int) $event->travel_order_id;
                    $parent = TravelOrder::query()
                        ->select(['id', 'public_id', 'reference_number', 'purpose'])
                        ->find((int) $event->travel_order_id);
                    $sources[] = [
                        'family' => 'travel_order',
                        'kind' => 'event',
                        'sourceId' => (int) $event->travel_order_id,
                        'eventId' => (int) $event->id,
                        'reference' => $parent !== null
                            ? (string) ($parent->reference_number ?: $parent->public_id)
                            : (string) $event->travel_order_id,
                        'title' => $parent !== null ? (string) $parent->purpose : '',
                        'relationship' => (string) $link->relationship,
                        'eventAction' => (string) $event->event,
                        'occurredAt' => $event->occurred_at !== null
                            ? CarbonImmutable::parse($event->occurred_at)->toIso8601String()
                            : null,
                    ];
                }
            } elseif ($model === WorkflowTransaction::class) {
                $txn = WorkflowTransaction::query()
                    ->select(['id', 'reference_no', 'title', 'status', 'created_at'])
                    ->find($id);
                if ($txn !== null) {
                    $parentIds['transaction'][] = (int) $txn->id;
                    $sources[] = [
                        'family' => 'transaction',
                        'kind' => 'record',
                        'sourceId' => (int) $txn->id,
                        'reference' => (string) $txn->reference_no,
                        'title' => (string) $txn->title,
                        'relationship' => (string) $link->relationship,
                        'eventAction' => null,
                        'occurredAt' => $txn->created_at?->toIso8601String(),
                    ];
                }
            } elseif ($model === TransactionEvent::class) {
                $event = TransactionEvent::query()
                    ->select(['id', 'transaction_id', 'action', 'created_at'])
                    ->find($id);
                if ($event !== null) {
                    $parentIds['transaction'][] = (int) $event->transaction_id;
                    $parent = WorkflowTransaction::query()
                        ->select(['id', 'reference_no', 'title'])
                        ->find((int) $event->transaction_id);
                    $sources[] = [
                        'family' => 'transaction',
                        'kind' => 'event',
                        'sourceId' => (int) $event->transaction_id,
                        'eventId' => (int) $event->id,
                        'reference' => $parent !== null ? (string) $parent->reference_no : (string) $event->transaction_id,
                        'title' => $parent !== null ? (string) $parent->title : '',
                        'relationship' => (string) $link->relationship,
                        'eventAction' => (string) $event->action,
                        'occurredAt' => $event->created_at !== null
                            ? CarbonImmutable::parse($event->created_at)->toIso8601String()
                            : null,
                    ];
                }
            }
        }

        foreach ($parentIds as $family => $ids) {
            $parentIds[$family] = array_values(array_unique($ids));
        }

        return [$sources, $parentIds];
    }

    /**
     * @param  array{correspondence: list<int>, travel_order: list<int>, transaction: list<int>}  $parentIdsByFamily
     * @return list<array<string, mixed>>
     */
    private function collectAuditTimeline(int $documentId, array $parentIdsByFamily): array
    {
        $query = DB::table('audit_logs as a')
            ->leftJoin('users as u', 'u.id', '=', 'a.actor_user_id')
            ->leftJoin('departments as d', 'd.id', '=', 'a.actor_department_id')
            ->whereNotNull('a.entity_id')
            ->where(function ($scope) use ($documentId, $parentIdsByFamily): void {
                $scope->where(function ($docScope) use ($documentId): void {
                    $docScope->where('a.entity_type', 'document')
                        ->where('a.entity_id', $documentId);
                });

                if ($parentIdsByFamily['correspondence'] !== []) {
                    $scope->orWhere(function ($corrScope) use ($parentIdsByFamily): void {
                        $corrScope->whereIn('a.entity_type', ['correspondence_record', CorrespondenceRecord::class])
                            ->whereIn('a.entity_id', $parentIdsByFamily['correspondence']);
                    });
                }

                if ($parentIdsByFamily['travel_order'] !== []) {
                    $scope->orWhere(function ($travelScope) use ($parentIdsByFamily): void {
                        $travelScope->whereIn('a.entity_type', ['travel_order', TravelOrder::class])
                            ->whereIn('a.entity_id', $parentIdsByFamily['travel_order']);
                    });
                }

                if ($parentIdsByFamily['transaction'] !== []) {
                    $scope->orWhere(function ($txnScope) use ($parentIdsByFamily): void {
                        $txnScope->whereIn('a.entity_type', ['transaction', WorkflowTransaction::class])
                            ->whereIn('a.entity_id', $parentIdsByFamily['transaction']);
                    });
                }
            })
            ->select([
                'a.id',
                'a.action',
                'a.outcome',
                'a.entity_type',
                'a.entity_id',
                'a.summary',
                'a.correlation_id',
                'a.actor_user_id',
                'u.name as actor_name',
                'a.actor_department_id',
                'd.code as office_code',
                'd.name as office_name',
                'a.created_at',
            ])
            ->orderBy('a.created_at')
            ->orderBy('a.id')
            ->limit(200)
            ->get();

        return $query->map(static fn (object $row): array => [
            'id' => (int) $row->id,
            'action' => (string) $row->action,
            'outcome' => (string) $row->outcome,
            'entityType' => (string) $row->entity_type,
            'entityId' => (int) $row->entity_id,
            'summary' => (string) $row->summary,
            'correlationId' => $row->correlation_id !== null ? (string) $row->correlation_id : null,
            'actorUserId' => $row->actor_user_id !== null ? (int) $row->actor_user_id : null,
            'actorName' => $row->actor_name !== null ? (string) $row->actor_name : null,
            'officeId' => $row->actor_department_id !== null ? (int) $row->actor_department_id : null,
            'officeCode' => $row->office_code !== null ? (string) $row->office_code : null,
            'officeName' => $row->office_name !== null ? (string) $row->office_name : null,
            'timestamp' => $row->created_at !== null
                ? CarbonImmutable::parse($row->created_at)->toIso8601String()
                : null,
        ])->values()->all();
    }

    private function resolveCustodyReadConnection(): ?ConnectionInterface
    {
        $readerPassword = config('database.connections.n03_reader.password');
        if (is_string($readerPassword) && $readerPassword !== '') {
            try {
                $reader = DB::connection('n03_reader');
                $reader->selectOne('SELECT 1');

                return $reader;
            } catch (Throwable) {
                return null;
            }
        }

        try {
            $default = DB::connection();
            $hasPriv = $default->selectOne(
                "SELECT to_regclass('legacy_custody.bindings') IS NOT NULL "
                ."AND has_table_privilege('legacy_custody.bindings', 'SELECT') AS readable"
            );

            return $hasPriv !== null && (bool) $hasPriv->readable ? $default : null;
        } catch (Throwable) {
            return null;
        }
    }

    private function findCommittedReceiptUuid(ConnectionInterface $connection, int $documentId): ?string
    {
        try {
            $row = $connection->selectOne(<<<'SQL'
                SELECT tr.receipt_uuid
                FROM legacy_custody.bindings b
                JOIN legacy_custody.terminal_receipts tr
                  ON tr.operation_id = b.operation_id
                 AND tr.outcome = 'COMMITTED'
                 AND tr.fence_no = 1
                WHERE b.document_id = ?
                SQL, [$documentId]);

            return $row !== null && is_string($row->receipt_uuid) ? $row->receipt_uuid : null;
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function loadClassificationHistory(ConnectionInterface $connection, int $documentId): array
    {
        try {
            $exists = $connection->selectOne(
                "SELECT to_regclass('legacy_custody.classification_events') IS NOT NULL "
                ."AND has_table_privilege('legacy_custody.classification_events', 'SELECT') AS readable"
            );
            if ($exists === null || ! (bool) $exists->readable) {
                return [];
            }

            $rows = $connection->select(<<<'SQL'
                SELECT
                    ce.classification_event_id,
                    ce.correspondence_record_id,
                    ce.correspondence_event_id,
                    ce.prior_classification,
                    ce.new_classification,
                    ce.actor_user_id,
                    u.name AS actor_name,
                    ce.office_id,
                    d.code AS office_code,
                    d.name AS office_name,
                    ce.correlation_id,
                    ce.occurred_at
                FROM legacy_custody.classification_events ce
                LEFT JOIN public.users u ON u.id = ce.actor_user_id
                LEFT JOIN public.departments d ON d.id = ce.office_id
                WHERE ce.document_id = ?
                ORDER BY ce.occurred_at ASC, ce.classification_event_id ASC
                SQL, [$documentId]);

            return array_map(static fn (object $row): array => [
                'eventId' => (string) $row->classification_event_id,
                'correspondenceRecordId' => (int) $row->correspondence_record_id,
                'correspondenceEventId' => (int) $row->correspondence_event_id,
                'priorClassification' => (string) $row->prior_classification,
                'newClassification' => (string) $row->new_classification,
                'actorUserId' => (int) $row->actor_user_id,
                'actorName' => $row->actor_name !== null ? (string) $row->actor_name : null,
                'officeId' => (int) $row->office_id,
                'officeCode' => $row->office_code !== null ? (string) $row->office_code : null,
                'officeName' => $row->office_name !== null ? (string) $row->office_name : null,
                'correlationId' => (string) $row->correlation_id,
                'occurredAt' => $row->occurred_at !== null
                    ? CarbonImmutable::parse($row->occurred_at)->toIso8601String()
                    : null,
            ], $rows);
        } catch (Throwable) {
            return [];
        }
    }
}
