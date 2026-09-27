<?php

namespace App\Services;

use App\Models\CorrespondenceEvent;
use App\Models\CorrespondenceRecord;
use App\Models\Document;
use App\Models\DocumentLink;
use App\Models\TransactionEvent;
use App\Models\TravelOrder;
use App\Models\TravelOrderEvent;
use App\Models\User;
use App\Models\WorkflowTransaction;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

final class DocumentArchiveQuery
{
    public function __construct(
        private readonly CorrespondenceAccessDecider $correspondenceAccess,
        private readonly TravelOrderAccess $travelOrderAccess,
        private readonly TransactionVisibilityQuery $transactionVisibility,
    ) {}

    /** @param array<string, mixed> $filters */
    public function workspace(User $actor, array $filters): array
    {
        $all = $this->visibleItems($actor);
        $scope = (string) ($filters['archive_scope'] ?? 'all');
        $search = Str::lower(trim((string) ($filters['archive_search'] ?? '')));
        $documentType = (string) ($filters['document_type'] ?? '');
        $classification = (string) ($filters['classification'] ?? '');
        $officeId = isset($filters['archive_office_id']) ? (int) $filters['archive_office_id'] : null;
        $year = (string) ($filters['archive_year'] ?? '');

        $filtered = $all
            ->filter(fn (array $item): bool => $this->matchesScope($item, $scope))
            ->filter(function (array $item) use ($search): bool {
                if ($search === '') {
                    return true;
                }

                $haystack = Str::lower(implode(' ', array_filter([
                    $item['name'],
                    $item['title'],
                    $item['documentType'],
                    $item['classification'],
                    $item['uploadedBy'],
                    $item['ownerOffice']['name'] ?? null,
                    $item['currentOffice']['name'] ?? null,
                    $item['relatedReference'],
                    $item['relatedTitle'],
                    $item['relationship'],
                ])));

                return str_contains($haystack, $search);
            })
            ->filter(fn (array $item): bool => $documentType === '' || $item['documentType'] === $documentType)
            ->filter(fn (array $item): bool => $classification === '' || $item['classification'] === $classification)
            ->filter(fn (array $item): bool => $officeId === null || (int) ($item['ownerOffice']['id'] ?? 0) === $officeId)
            ->filter(fn (array $item): bool => $year === '' || substr((string) $item['uploadedAt'], 0, 4) === $year)
            ->values();

        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = 20;
        $records = new LengthAwarePaginator(
            $filtered->forPage($page, $perPage)->values()->all(),
            $filtered->count(),
            $perPage,
            $page,
            [
                'path' => request()->url(),
                'query' => request()->query(),
            ],
        );

        $selectedId = (string) ($filters['document'] ?? '');
        $selected = $selectedId !== ''
            ? $all->firstWhere('publicId', $selectedId)
            : null;

        return [
            'records' => $records,
            'selected' => $selected,
            'counts' => [
                'all' => $all->count(),
                'my_sent' => $all->where('direction', 'sent')->count(),
                'my_received' => $all->where('direction', 'received')->count(),
                'my_uploads' => $all->where('uploadedByMe', true)->count(),
            ],
            'filters' => [
                'archive_scope' => $scope,
                'archive_search' => (string) ($filters['archive_search'] ?? ''),
                'document_type' => $documentType,
                'classification' => $classification,
                'archive_office_id' => $officeId,
                'archive_year' => $year,
                'document' => $selectedId ?: null,
            ],
            'filterOptions' => [
                'documentTypes' => $all->pluck('documentType')->filter()->unique()->sort()->values()->all(),
                'classifications' => $all->pluck('classification')->filter()->unique()->sort()->values()->all(),
                'years' => $all->pluck('uploadedAt')
                    ->filter()
                    ->map(fn ($value): string => substr((string) $value, 0, 4))
                    ->filter()
                    ->unique()
                    ->sortDesc()
                    ->values()
                    ->all(),
                'offices' => $all->pluck('ownerOffice')
                    ->filter()
                    ->unique('id')
                    ->sortBy('name')
                    ->values()
                    ->all(),
            ],
        ];
    }

    /** @return array<string, mixed> */
    public function activity(User $actor): array
    {
        $all = $this->visibleItems($actor);
        $sent = $all->where('direction', 'sent')->values();
        $received = $all->where('direction', 'received')->values();

        return [
            'sentCount' => $sent->count(),
            'receivedCount' => $received->count(),
            'recentSent' => $sent->take(3)->all(),
            'recentReceived' => $received->take(3)->all(),
        ];
    }

    /** @return Collection<int, array<string, mixed>> */
    private function visibleItems(User $actor): Collection
    {
        $actor->loadMissing('employee.department');

        $documents = Document::query()
            ->with([
                'ownerDepartment:id,code,name,short_name',
                'uploader:id,name',
                'links:id,document_id,linkable_type,linkable_id,relationship,created_by_user_id',
            ])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        if ($documents->isEmpty()) {
            return collect();
        }

        $links = $documents
            ->pluck('links')
            ->flatten(1)
            ->filter(fn ($link): bool => $link instanceof DocumentLink)
            ->values();

        $linkIndex = $this->buildLinkIndex($actor, $links);

        return $documents
            ->filter(fn (Document $document): bool => $this->documentIsVisible($document, $linkIndex))
            ->map(fn (Document $document): array => $this->present($actor, $document, $linkIndex))
            ->values();
    }

    /**
     * Build authorization and presentation context in bounded batches instead of
     * resolving every document link and parent record independently.
     *
     * @param Collection<int, DocumentLink> $links
     * @return array<string, array{family:string,parentId:int,authorized:bool,context:array<string,mixed>}>
     */
    private function buildLinkIndex(User $actor, Collection $links): array
    {
        $index = [];
        $eventLinkIds = [
            'correspondence' => [],
            'transaction' => [],
            'travel_order' => [],
        ];

        foreach ($links as $link) {
            $key = $this->linkKey($link);
            $type = Relation::getMorphedModel($link->linkable_type) ?? $link->linkable_type;
            $id = (int) $link->linkable_id;

            if ($type === CorrespondenceRecord::class) {
                $index[$key] = ['family' => 'correspondence', 'parentId' => $id];
            } elseif ($type === WorkflowTransaction::class) {
                $index[$key] = ['family' => 'transaction', 'parentId' => $id];
            } elseif ($type === TravelOrder::class) {
                $index[$key] = ['family' => 'travel_order', 'parentId' => $id];
            } elseif ($type === CorrespondenceEvent::class) {
                $eventLinkIds['correspondence'][$key] = $id;
            } elseif ($type === TransactionEvent::class) {
                $eventLinkIds['transaction'][$key] = $id;
            } elseif ($type === TravelOrderEvent::class) {
                $eventLinkIds['travel_order'][$key] = $id;
            }
        }

        if ($eventLinkIds['correspondence'] !== []) {
            $parents = CorrespondenceEvent::query()
                ->whereIn('id', array_values($eventLinkIds['correspondence']))
                ->pluck('correspondence_record_id', 'id');

            foreach ($eventLinkIds['correspondence'] as $key => $eventId) {
                $parentId = (int) ($parents[$eventId] ?? 0);
                if ($parentId > 0) {
                    $index[$key] = ['family' => 'correspondence', 'parentId' => $parentId];
                }
            }
        }

        if ($eventLinkIds['transaction'] !== []) {
            $parents = TransactionEvent::query()
                ->whereIn('id', array_values($eventLinkIds['transaction']))
                ->pluck('transaction_id', 'id');

            foreach ($eventLinkIds['transaction'] as $key => $eventId) {
                $parentId = (int) ($parents[$eventId] ?? 0);
                if ($parentId > 0) {
                    $index[$key] = ['family' => 'transaction', 'parentId' => $parentId];
                }
            }
        }

        if ($eventLinkIds['travel_order'] !== []) {
            $parents = TravelOrderEvent::query()
                ->whereIn('id', array_values($eventLinkIds['travel_order']))
                ->pluck('travel_order_id', 'id');

            foreach ($eventLinkIds['travel_order'] as $key => $eventId) {
                $parentId = (int) ($parents[$eventId] ?? 0);
                if ($parentId > 0) {
                    $index[$key] = ['family' => 'travel_order', 'parentId' => $parentId];
                }
            }
        }

        $ids = [
            'correspondence' => [],
            'transaction' => [],
            'travel_order' => [],
        ];

        foreach ($index as $entry) {
            $ids[$entry['family']][] = (int) $entry['parentId'];
        }

        foreach ($ids as $family => $values) {
            $ids[$family] = array_values(array_unique(array_filter($values)));
        }

        $contexts = [
            'correspondence' => [],
            'transaction' => [],
            'travel_order' => [],
        ];

        $correspondenceRecords = collect();
        if ($ids['correspondence'] !== []) {
            $correspondenceRecords = CorrespondenceRecord::query()
                ->with([
                    'receivingDepartment:id,code,name,short_name',
                    'workflowTransaction:id,reference_no,title,origin_department_id,current_department_id,assigned_employee_id',
                    'workflowTransaction.originDepartment:id,code,name,short_name',
                    'workflowTransaction.currentDepartment:id,code,name,short_name',
                ])
                ->whereIn('id', $ids['correspondence'])
                ->get();

            foreach ($correspondenceRecords as $record) {
                $contexts['correspondence'][(int) $record->id] = $this->correspondenceContext($record);
            }
        }

        $transactions = collect();
        if ($ids['transaction'] !== []) {
            $transactions = WorkflowTransaction::query()
                ->with([
                    'originDepartment:id,code,name,short_name',
                    'currentDepartment:id,code,name,short_name',
                ])
                ->whereIn('id', $ids['transaction'])
                ->get();

            foreach ($transactions as $transaction) {
                $contexts['transaction'][(int) $transaction->id] = $this->transactionContext($transaction);
            }
        }

        $travelOrders = collect();
        if ($ids['travel_order'] !== []) {
            $travelOrders = TravelOrder::query()
                ->with('department:id,code,name,short_name')
                ->whereIn('id', $ids['travel_order'])
                ->get();

            foreach ($travelOrders as $travelOrder) {
                $contexts['travel_order'][(int) $travelOrder->id] = $this->travelOrderContext($travelOrder);
            }
        }

        $authorized = [
            'correspondence' => [],
            'transaction' => [],
            'travel_order' => [],
        ];

        foreach ($correspondenceRecords as $record) {
            if ($this->correspondenceAccess->canViewInWorkspace($actor, $record)) {
                $authorized['correspondence'][(int) $record->id] = true;
            }
        }

        foreach ($transactions as $transaction) {
            if ($actor->can('view', $transaction)) {
                $authorized['transaction'][(int) $transaction->id] = true;
            }
        }

        if ($ids['travel_order'] !== []) {
            $authorized['travel_order'] = array_fill_keys(
                $this->travelOrderAccess
                    ->scopeVisibleTo(TravelOrder::query(), $actor)
                    ->whereIn('id', $ids['travel_order'])
                    ->pluck('id')
                    ->map(fn ($id): int => (int) $id)
                    ->all(),
                true,
            );
        }

        foreach ($index as $key => $entry) {
            $family = $entry['family'];
            $parentId = (int) $entry['parentId'];
            $index[$key]['authorized'] = isset($authorized[$family][$parentId]);
            $index[$key]['context'] = $contexts[$family][$parentId] ?? [];
        }

        return $index;
    }

    /**
     * Preserve the original access precedence:
     * correspondence links dominate travel-order links, which dominate transaction links.
     *
     * @param array<string, array{family:string,parentId:int,authorized:bool,context:array<string,mixed>}> $linkIndex
     */
    private function documentIsVisible(Document $document, array $linkIndex): bool
    {
        $families = [
            'correspondence' => [],
            'travel_order' => [],
            'transaction' => [],
        ];

        foreach ($document->links as $link) {
            $entry = $linkIndex[$this->linkKey($link)] ?? null;
            if (! $entry || ! array_key_exists($entry['family'], $families)) {
                continue;
            }

            $families[$entry['family']][] = $entry;
        }

        foreach (['correspondence', 'travel_order', 'transaction'] as $family) {
            if ($families[$family] === []) {
                continue;
            }

            foreach ($families[$family] as $entry) {
                if ($entry['authorized']) {
                    return true;
                }
            }

            return false;
        }

        return false;
    }

    /**
     * @param array<string, array{family:string,parentId:int,authorized:bool,context:array<string,mixed>}> $linkIndex
     * @return array<string, mixed>
     */
    private function present(User $actor, Document $document, array $linkIndex): array
    {
        $link = $document->links->first();
        $context = $link
            ? ($linkIndex[$this->linkKey($link)]['context'] ?? [])
            : [];
        $uploadedByMe = (int) $document->uploaded_by_user_id === (int) $actor->id;
        $departmentId = (int) ($actor->employee?->department_id ?? 0);
        $employeeId = (int) ($actor->employee?->id ?? 0);
        $currentDepartmentId = (int) ($context['currentOffice']['id'] ?? 0);
        $assignedEmployeeId = (int) ($context['assignedEmployeeId'] ?? 0);

        $direction = 'visible';
        if ($uploadedByMe && $currentDepartmentId > 0 && $currentDepartmentId !== $departmentId) {
            $direction = 'sent';
        } elseif (! $uploadedByMe && (
            ($assignedEmployeeId > 0 && $assignedEmployeeId === $employeeId)
            || ($currentDepartmentId > 0 && $currentDepartmentId === $departmentId)
        )) {
            $direction = 'received';
        } elseif ($uploadedByMe) {
            $direction = 'upload';
        }

        return [
            'publicId' => $document->public_id,
            'name' => $document->original_name ?: $document->title,
            'title' => $document->title,
            'documentType' => Str::headline((string) $document->document_type),
            'documentTypeValue' => (string) $document->document_type,
            'classification' => Str::headline((string) $document->classification),
            'classificationValue' => (string) $document->classification,
            'sizeBytes' => $document->size_bytes,
            'ownerOffice' => $this->office($document->ownerDepartment),
            'uploadedBy' => $document->uploader?->name,
            'uploadedByMe' => $uploadedByMe,
            'uploadedAt' => $document->created_at?->toIso8601String(),
            'relationship' => $link ? Str::headline((string) $link->relationship) : 'Document',
            'relationshipValue' => $link?->relationship,
            'direction' => $direction,
            'relatedType' => $context['relatedType'] ?? null,
            'relatedReference' => $context['relatedReference'] ?? null,
            'relatedTitle' => $context['relatedTitle'] ?? null,
            'relatedUrl' => $context['relatedUrl'] ?? null,
            'originOffice' => $context['originOffice'] ?? null,
            'currentOffice' => $context['currentOffice'] ?? null,
            'downloadUrl' => route('documents.download', $document, false),
        ];
    }

    private function matchesScope(array $item, string $scope): bool
    {
        return match ($scope) {
            'my_sent' => $item['direction'] === 'sent',
            'my_received' => $item['direction'] === 'received',
            'my_uploads' => $item['uploadedByMe'] === true,
            default => true,
        };
    }

    /** @return array<string, mixed> */
    private function transactionContext(?WorkflowTransaction $transaction): array
    {
        if (! $transaction) {
            return [];
        }

        return [
            'relatedType' => 'transaction',
            'relatedReference' => $transaction->reference_no,
            'relatedTitle' => $transaction->title,
            'relatedUrl' => route('transactions.show', $transaction, false),
            'originOffice' => $this->office($transaction->originDepartment),
            'currentOffice' => $this->office($transaction->currentDepartment),
            'assignedEmployeeId' => $transaction->assigned_employee_id,
        ];
    }

    /** @return array<string, mixed> */
    private function correspondenceContext(?CorrespondenceRecord $record): array
    {
        if (! $record) {
            return [];
        }

        $workflow = $record->workflowTransaction;
        $currentOffice = $workflow?->currentDepartment ?? $record->receivingDepartment;

        return [
            'relatedType' => 'correspondence',
            'relatedReference' => $record->municipal_reference_no ?? $record->external_reference_no,
            'relatedTitle' => $record->subject,
            'relatedUrl' => route('correspondence.workspace.show', $record, false),
            'originOffice' => $this->office($workflow?->originDepartment),
            'currentOffice' => $this->office($currentOffice),
            'assignedEmployeeId' => $workflow?->assigned_employee_id,
        ];
    }

    /** @return array<string, mixed> */
    private function travelOrderContext(?TravelOrder $travelOrder): array
    {
        if (! $travelOrder) {
            return [];
        }

        return [
            'relatedType' => 'travel_order',
            'relatedReference' => $travelOrder->reference_number,
            'relatedTitle' => $travelOrder->purpose,
            'relatedUrl' => route('travel-orders.show', $travelOrder, false),
            'originOffice' => null,
            'currentOffice' => $this->office($travelOrder->department),
            'assignedEmployeeId' => null,
        ];
    }

    private function linkKey(DocumentLink $link): string
    {
        return $link->linkable_type.':'.(int) $link->linkable_id;
    }

    private function office($department): ?array
    {
        return $department ? [
            'id' => (int) $department->id,
            'code' => $department->code,
            'name' => $department->name,
            'shortName' => $department->short_name,
        ] : null;
    }
}
