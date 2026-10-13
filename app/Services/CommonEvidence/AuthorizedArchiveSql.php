<?php

namespace App\Services\CommonEvidence;

use App\Models\CorrespondenceEvent;
use App\Models\CorrespondenceRecord;
use App\Models\DocumentLink;
use App\Models\TransactionEvent;
use App\Models\TravelOrder;
use App\Models\TravelOrderEvent;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\CorrespondenceAccessDecider;
use App\Services\TransactionVisibilityQuery;
use App\Services\TravelOrderAccess;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * PostgreSQL archive projection. Only authorized links reach the catalog.
 *
 * A higher-priority link FAMILY blocks lower-priority families even if its
 * parent was deleted or is inaccessible. Within one family the first
 * authorized link by link ID supplies presentation context.
 */
final readonly class AuthorizedArchiveSql
{
    public function __construct(
        private CorrespondenceAccessDecider $correspondenceAccess,
        private TravelOrderAccess $travelOrderAccess,
        private TransactionVisibilityQuery $transactionVisibility,
    ) {}

    /** @param array<string, mixed> $filters */
    public function workspace(User $claimedActor, array $filters): array
    {
        $actor = $this->activeActor($claimedActor);
        $all = $this->catalog($actor);
        $scope = (string) ($filters['archive_scope'] ?? 'all');
        $search = Str::lower(trim((string) ($filters['archive_search'] ?? '')));
        $type = (string) ($filters['document_type'] ?? '');
        $classification = (string) ($filters['classification'] ?? '');
        $officeId = isset($filters['archive_office_id']) ? (int) $filters['archive_office_id'] : null;
        $year = (string) ($filters['archive_year'] ?? '');
        $page = max(1, (int) ($filters['page'] ?? 1));

        $filtered = DB::query()->fromSub(clone $all, 'archive');
        if (in_array($scope, ['my_sent', 'my_received'], true)) {
            $filtered->where('direction', $scope === 'my_sent' ? 'sent' : 'received');
        } elseif ($scope === 'my_uploads') {
            $filtered->where('uploaded_by_me', 1);
        }
        if ($search !== '') {
            // Match the same visible fields as the former in-memory archive.
            // strpos uses a bound literal, rather than a wildcard-bearing LIKE.
            $filtered->whereRaw(
                "STRPOS(LOWER(CONCAT_WS(' ', NULLIF(name, ''), NULLIF(title, ''), "
                ."NULLIF(document_type_label, ''), NULLIF(classification_label, ''), "
                ."NULLIF(uploaded_by, ''), NULLIF(owner_office_name, ''), "
                ."NULLIF(current_office_name, ''), NULLIF(related_reference, ''), "
                ."NULLIF(related_title, ''), NULLIF(relationship_label, ''))), ?) > 0",
                [$search],
            );
        }
        if ($type !== '') {
            $filtered->where('document_type_label', $type);
        }
        if ($classification !== '') {
            $filtered->where('classification_label', $classification);
        }
        if ($officeId !== null) {
            $filtered->where('owner_office_id', $officeId);
        }
        if ($year !== '') {
            $filtered->whereRaw('SUBSTRING(CAST(uploaded_at AS TEXT), 1, 4) = ?', [$year]);
        }

        $paginator = (clone $filtered)
            ->orderByDesc('uploaded_at')
            ->orderByDesc('doc_id')
            ->paginate(20, ['*'], 'page', $page);

        $records = new LengthAwarePaginator(
            array_map(fn (object $row): array => $this->present($row), $paginator->items()),
            $paginator->total(),
            20,
            $page,
            ['path' => request()->url(), 'query' => request()->query()],
        );

        $selectedId = (string) ($filters['document'] ?? '');
        $selectedRow = $selectedId === '' ? null
            : DB::query()->fromSub(clone $all, 'selected_archive')
                ->where('public_id', $selectedId)->first();

        $counts = DB::query()->fromSub(clone $all, 'all_archive')
            ->selectRaw(
                "COUNT(*) AS total, "
                ."COUNT(*) FILTER (WHERE direction = 'sent') AS sent, "
                ."COUNT(*) FILTER (WHERE direction = 'received') AS received, "
                ."COUNT(*) FILTER (WHERE uploaded_by_me = 1) AS uploads"
            )->first();

        $documentTypes = DB::query()->fromSub(clone $all, 'archive_types')
            ->whereNotNull('document_type')->distinct()->orderBy('document_type')
            ->pluck('document_type')->map(fn ($value): string => Str::headline((string) $value))
            ->unique()->sort()->values()->all();
        $classifications = DB::query()->fromSub(clone $all, 'archive_classifications')
            ->whereNotNull('classification')->distinct()->orderBy('classification')
            ->pluck('classification')->map(fn ($value): string => Str::headline((string) $value))
            ->unique()->sort()->values()->all();
        $years = DB::query()->fromSub(clone $all, 'archive_years')
            ->whereNotNull('uploaded_at')
            ->selectRaw('DISTINCT SUBSTRING(CAST(uploaded_at AS TEXT), 1, 4) AS year')
            ->orderByDesc('year')->pluck('year')->all();
        $offices = DB::query()->fromSub(clone $all, 'archive_offices')
            ->whereNotNull('owner_office_id')
            ->select(['owner_office_id','owner_office_code','owner_office_name','owner_office_short_name'])
            ->distinct()->orderBy('owner_office_name')->get()
            ->map(fn (object $row): array => [
                'id' => (int) $row->owner_office_id,
                'code' => $row->owner_office_code,
                'name' => $row->owner_office_name,
                'shortName' => $row->owner_office_short_name,
            ])->all();

        return [
            'records' => $records,
            'selected' => $selectedRow ? $this->present($selectedRow) : null,
            'counts' => [
                'all' => (int) ($counts->total ?? 0),
                'my_sent' => (int) ($counts->sent ?? 0),
                'my_received' => (int) ($counts->received ?? 0),
                'my_uploads' => (int) ($counts->uploads ?? 0),
            ],
            'filters' => [
                'archive_scope' => $scope,
                'archive_search' => (string) ($filters['archive_search'] ?? ''),
                'document_type' => $type,
                'classification' => $classification,
                'archive_office_id' => $officeId,
                'archive_year' => $year,
                'document' => $selectedId ?: null,
            ],
            'filterOptions' => [
                'documentTypes' => $documentTypes,
                'classifications' => $classifications,
                'years' => $years,
                'offices' => $offices,
            ],
        ];
    }

    /** @return array<string, mixed> */
    public function activity(User $claimedActor): array
    {
        $all = $this->catalog($this->activeActor($claimedActor));
        $counts = DB::query()->fromSub(clone $all, 'activity_counts')
            ->selectRaw(
                "COUNT(*) FILTER (WHERE direction = 'sent') AS sent, "
                ."COUNT(*) FILTER (WHERE direction = 'received') AS received"
            )->first();
        $recent = function (string $direction) use ($all): array {
            return DB::query()->fromSub(clone $all, 'activity_archive')
                ->where('direction', $direction)
                ->orderByDesc('uploaded_at')->orderByDesc('doc_id')->limit(3)->get()
                ->map(fn (object $row): array => $this->present($row))->all();
        };
        return [
            'sentCount' => (int) ($counts->sent ?? 0),
            'receivedCount' => (int) ($counts->received ?? 0),
            'recentSent' => $recent('sent'),
            'recentReceived' => $recent('received'),
        ];
    }

    private function activeActor(User $claimed): User
    {
        // Always bypass stale Eloquent relations from a retained session.
        $actor = User::query()->with('employee.department')->find($claimed->getKey());
        if (! $actor || ! $actor->is_active || ! $actor->employee
            || $actor->employee->employment_status !== 'active'
            || ! $actor->employee->department || ! $actor->employee->department->is_active) {
            abort(403);
        }
        return $actor;
    }

    private function catalog(User $actor): Builder
    {
        $links = $this->authorizedLinks($actor);
        $ranked = DB::query()->fromSub($links, 'authorized_links')
            ->selectRaw(
                'authorized_links.*, ROW_NUMBER() OVER '
                .'(PARTITION BY document_id ORDER BY family_priority ASC, link_id ASC) AS source_position'
            );

        $actorId = (int) $actor->id;
        $officeId = (int) $actor->employee->department_id;
        $employeeId = (int) $actor->employee->id;
        return DB::table('documents as d')
            ->joinSub($ranked, 'source', function (JoinClause $join): void {
                $join->on('source.document_id', '=', 'd.id')->where('source.source_position', '=', 1);
            })
            ->leftJoin('users as u', 'u.id', '=', 'd.uploaded_by_user_id')
            ->leftJoin('departments as own', 'own.id', '=', 'd.owner_department_id')
            ->leftJoin('departments as cur', 'cur.id', '=', 'source.current_office_id')
            ->leftJoin('departments as orig', 'orig.id', '=', 'source.origin_office_id')
            ->selectRaw(
                "d.id AS doc_id, CAST(d.public_id AS TEXT) AS public_id, "
                ."COALESCE(NULLIF(d.original_name, ''), d.title) AS name, d.title AS title, "
                ."d.document_type, INITCAP(REPLACE(COALESCE(d.document_type, ''), '_', ' ')) AS document_type_label, "
                ."d.classification, INITCAP(REPLACE(COALESCE(d.classification, ''), '_', ' ')) AS classification_label, "
                ."d.size_bytes, d.created_at AS uploaded_at, "
                ."d.uploaded_by_user_id, u.name AS uploaded_by, "
                ."own.id AS owner_office_id, own.code AS owner_office_code, "
                ."own.name AS owner_office_name, own.short_name AS owner_office_short_name, "
                ."cur.id AS current_office_id, cur.code AS current_office_code, "
                ."cur.name AS current_office_name, cur.short_name AS current_office_short_name, "
                ."orig.id AS origin_office_id, orig.code AS origin_office_code, "
                ."orig.name AS origin_office_name, orig.short_name AS origin_office_short_name, "
                ."source.related_type, source.related_key, source.related_reference, source.related_title, "
                ."source.relationship, INITCAP(REPLACE(COALESCE(source.relationship, ''), '_', ' ')) AS relationship_label, "
                ."CASE WHEN d.uploaded_by_user_id = {$actorId} THEN 1 ELSE 0 END AS uploaded_by_me, "
                ."CASE "
                ."WHEN d.uploaded_by_user_id = {$actorId} "
                ."AND source.current_office_id > 0 AND source.current_office_id <> {$officeId} THEN 'sent' "
                ."WHEN (d.uploaded_by_user_id IS NULL OR d.uploaded_by_user_id <> {$actorId}) "
                ."AND (source.assigned_employee_id = {$employeeId} OR source.current_office_id = {$officeId}) THEN 'received' "
                ."WHEN d.uploaded_by_user_id = {$actorId} THEN 'upload' ELSE 'visible' END AS direction"
            );
    }

    private function authorizedLinks(User $actor): Builder
    {
        $correspondence = $this->correspondenceAccess
            ->scopeVisibleTo(CorrespondenceRecord::query(), $actor)
            ->select(['id','public_id','municipal_reference_no','external_reference_no','subject',
                'receiving_department_id','workflow_transaction_id']);
        $travel = $this->travelOrderAccess
            ->scopeVisibleTo(TravelOrder::query(), $actor)
            ->select(['id','public_id','reference_number','purpose','department_id']);
        // Existing transaction SQL scope corresponds to TransactionPolicy::view:
        // VIEW_ALL or the actor's origin/current office. Recheck on download.
        $transactions = $this->transactionVisibility->scope($actor)
            ->select(['id','reference_no','title','origin_department_id',
                'current_department_id','assigned_employee_id']);

        $corrTypes = $this->morphTypes(CorrespondenceRecord::class, CorrespondenceEvent::class);
        $travelTypes = $this->morphTypes(TravelOrder::class, TravelOrderEvent::class);

        $sources = [
            $this->links($correspondence, CorrespondenceRecord::class, 'correspondence', 1, null, null, []),
            $this->links($correspondence, CorrespondenceEvent::class, 'correspondence', 1, 'correspondence_events', 'correspondence_record_id', []),
            $this->links($travel, TravelOrder::class, 'travel_order', 2, null, null, $corrTypes),
            $this->links($travel, TravelOrderEvent::class, 'travel_order', 2, 'travel_order_events', 'travel_order_id', $corrTypes),
            $this->links($transactions, WorkflowTransaction::class, 'transaction', 3, null, null, array_merge($corrTypes, $travelTypes)),
            $this->links($transactions, TransactionEvent::class, 'transaction', 3, 'transaction_events', 'transaction_id', array_merge($corrTypes, $travelTypes)),
        ];

        $union = array_shift($sources);
        foreach ($sources as $source) {
            $union->unionAll($source);
        }
        return $union;
    }

    /**
     * @param EloquentBuilder $authorized Source-policy-filtered parent SELECT
     * @param list<string> $higherPriorityTypes Types that block lower precedence
     */
    private function links(
        EloquentBuilder $authorized,
        string $modelClass,
        string $family,
        int $priority,
        ?string $eventTable,
        ?string $eventParentColumn,
        array $higherPriorityTypes,
    ): Builder {
        $links = DB::table('document_links as l')
            ->whereIn('l.linkable_type', array_unique([$modelClass, (new $modelClass)->getMorphClass()]));

        $parentKey = 'l.linkable_id';
        if ($eventTable !== null) {
            $links->join($eventTable.' as e', 'e.id', '=', 'l.linkable_id');
            $parentKey = 'e.'.$eventParentColumn;
        }

        $links->joinSub(clone $authorized, 'r', fn (JoinClause $join) => $join->on('r.id', '=', $parentKey));

        if ($family === 'correspondence') {
            $links->leftJoin('transactions as w', 'w.id', '=', 'r.workflow_transaction_id');
            $context = "CAST(r.public_id AS TEXT) AS related_key, "
                ."COALESCE(r.municipal_reference_no, r.external_reference_no) AS related_reference, "
                ."r.subject AS related_title, w.origin_department_id AS origin_office_id, "
                ."COALESCE(w.current_department_id, r.receiving_department_id) AS current_office_id, "
                ."w.assigned_employee_id AS assigned_employee_id";
        } elseif ($family === 'travel_order') {
            $context = "CAST(r.public_id AS TEXT) AS related_key, "
                ."r.reference_number AS related_reference, r.purpose AS related_title, "
                ."NULL::BIGINT AS origin_office_id, r.department_id AS current_office_id, "
                ."NULL::BIGINT AS assigned_employee_id";
        } else {
            $context = "CAST(r.id AS TEXT) AS related_key, "
                ."r.reference_no AS related_reference, r.title AS related_title, "
                ."r.origin_department_id AS origin_office_id, r.current_department_id AS current_office_id, "
                ."r.assigned_employee_id AS assigned_employee_id";
        }

        if ($higherPriorityTypes !== []) {
            $links->whereNotExists(function (Builder $blocked) use ($higherPriorityTypes): void {
                $blocked->selectRaw('1')
                    ->from('document_links as higher')
                    ->whereColumn('higher.document_id', 'l.document_id')
                    ->whereIn('higher.linkable_type', array_values(array_unique($higherPriorityTypes)));
            });
        }

        return $links->selectRaw(
            "l.document_id, l.id AS link_id, l.relationship, {$priority} AS family_priority, "
            ."'{$family}' AS related_type, ".$context
        );
    }

    /** @return list<string> */
    private function morphTypes(string ...$classes): array
    {
        $types = [];
        foreach ($classes as $class) {
            $types[] = $class;
            $types[] = (new $class)->getMorphClass();
        }
        return array_values(array_unique($types));
    }

    /** @return array<string, mixed> */
    private function present(object $row): array
    {
        $relatedUrl = match ($row->related_type) {
            'correspondence' => route('correspondence.workspace.show', ['correspondence' => $row->related_key], false),
            'travel_order' => route('travel-orders.show', ['travelOrder' => $row->related_key], false),
            'transaction' => route('transactions.show', ['transaction' => $row->related_key], false),
            default => null,
        };
        return [
            'publicId' => $row->public_id,
            'name' => $row->name,
            'title' => $row->title,
            'documentType' => Str::headline((string) $row->document_type),
            'documentTypeValue' => (string) $row->document_type,
            'classification' => Str::headline((string) $row->classification),
            'classificationValue' => (string) $row->classification,
            'sizeBytes' => $row->size_bytes,
            'ownerOffice' => $this->office($row, 'owner'),
            'uploadedBy' => $row->uploaded_by,
            'uploadedByMe' => (int) $row->uploaded_by_me === 1,
            'uploadedAt' => $row->uploaded_at === null ? null
                : CarbonImmutable::parse($row->uploaded_at)->toIso8601String(),
            'relationship' => Str::headline((string) $row->relationship),
            'relationshipValue' => $row->relationship,
            'direction' => $row->direction,
            'relatedType' => $row->related_type,
            'relatedReference' => $row->related_reference,
            'relatedTitle' => $row->related_title,
            'relatedUrl' => $relatedUrl,
            'originOffice' => $this->office($row, 'origin'),
            'currentOffice' => $this->office($row, 'current'),
            'downloadUrl' => route('documents.download', ['document' => $row->public_id], false),
        ];
    }

    private function office(object $row, string $prefix): ?array
    {
        $id = $row->{$prefix.'_office_id'};
        if ($id === null) {
            return null;
        }
        return [
            'id' => (int) $id,
            'code' => $row->{$prefix.'_office_code'},
            'name' => $row->{$prefix.'_office_name'},
            'shortName' => $row->{$prefix.'_office_short_name'},
        ];
    }
}
