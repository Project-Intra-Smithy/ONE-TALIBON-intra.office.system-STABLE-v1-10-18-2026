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
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Relations\Relation;

final class DocumentArchiveQuery
{
    public function __construct(
        private readonly DocumentAccessService $access,
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

        return Document::query()
            ->with([
                'ownerDepartment:id,code,name,short_name',
                'uploader:id,name',
                'links:id,document_id,linkable_type,linkable_id,relationship,created_by_user_id',
            ])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get()
            ->filter(fn (Document $document): bool => $this->access->canDownload($actor, $document))
            ->map(fn (Document $document): array => $this->present($actor, $document))
            ->values();
    }

    /** @return array<string, mixed> */
    private function present(User $actor, Document $document): array
    {
        $link = $document->links->first();
        $context = $link ? $this->contextFor($link) : [];
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
    private function contextFor(DocumentLink $link): array
    {
        $type = Relation::getMorphedModel($link->linkable_type) ?? $link->linkable_type;

        if ($type === WorkflowTransaction::class) {
            return $this->transactionContext(WorkflowTransaction::query()
                ->with(['originDepartment:id,code,name,short_name', 'currentDepartment:id,code,name,short_name'])
                ->find($link->linkable_id));
        }

        if ($type === TransactionEvent::class) {
            $event = TransactionEvent::query()
                ->with(['transaction.originDepartment:id,code,name,short_name', 'transaction.currentDepartment:id,code,name,short_name'])
                ->find($link->linkable_id);

            return $this->transactionContext($event?->transaction);
        }

        if ($type === CorrespondenceRecord::class) {
            return $this->correspondenceContext(CorrespondenceRecord::query()
                ->with([
                    'receivingDepartment:id,code,name,short_name',
                    'workflowTransaction.originDepartment:id,code,name,short_name',
                    'workflowTransaction.currentDepartment:id,code,name,short_name',
                ])
                ->find($link->linkable_id));
        }

        if ($type === CorrespondenceEvent::class) {
            $event = CorrespondenceEvent::query()
                ->with([
                    'correspondence.receivingDepartment:id,code,name,short_name',
                    'correspondence.workflowTransaction.originDepartment:id,code,name,short_name',
                    'correspondence.workflowTransaction.currentDepartment:id,code,name,short_name',
                ])
                ->find($link->linkable_id);

            return $this->correspondenceContext($event?->correspondence);
        }

        if ($type === TravelOrder::class) {
            return $this->travelOrderContext(TravelOrder::query()
                ->with('department:id,code,name,short_name')
                ->find($link->linkable_id));
        }

        if ($type === TravelOrderEvent::class) {
            $event = TravelOrderEvent::query()
                ->with('travelOrder.department:id,code,name,short_name')
                ->find($link->linkable_id);

            return $this->travelOrderContext($event?->travelOrder);
        }

        return [];
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
