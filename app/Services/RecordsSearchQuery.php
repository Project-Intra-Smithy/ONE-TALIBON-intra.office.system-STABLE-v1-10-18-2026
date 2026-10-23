<?php

namespace App\Services;

use App\Domain\Identity\VerifiedMunicipalActor;
use App\Models\CorrespondenceRecord;
use App\Models\Department;
use App\Models\TravelOrder;
use App\Models\User;
use App\Models\WorkflowTransaction;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class RecordsSearchQuery
{
    public function __construct(
        private readonly CorrespondenceAccessDecider $correspondenceAccess,
        private readonly TransactionVisibilityQuery $transactionVisibility,
        private readonly TravelOrderAccess $travelOrderAccess,
        private readonly RecordsResultPresenter $presenter,
    ) {
    }

    /** @param array<string, mixed> $filters */
    public function workspace(User $actor, array $filters): array
    {
        // One fresh, request-bound eligibility proof for this read operation.
        // Each source retains its independent SQL visibility predicates.
        // No cross-request caching or mutation authorization is implied.
        $verified = VerifiedMunicipalActor::forProtectedSource($actor);
        $view = (string) ($filters['view'] ?? 'overview');
        $recordType = (string) ($filters['record_type'] ?? 'all');

        $correspondenceBase = $this->authorizedCorrespondence($verified);
        $transactionBase = $this->transactionVisibility->scopeVisibleToVerifiedActor($verified);
        $travelOrderBase = $this->travelOrderAccess->scopeVisibleToVerifiedActor(
            TravelOrder::query(),
            $verified,
        );

        $correspondence = clone $correspondenceBase;
        $transactions = clone $transactionBase;
        $travelOrders = clone $travelOrderBase;
        $this->applyCorrespondenceFilters($correspondence, $filters);
        $this->applyTransactionFilters($transactions, $filters);
        $this->applyTravelOrderFilters($travelOrders, $filters);

        $recordsPage = $this->paginate($recordType, $correspondence, $transactions, $travelOrders, sort: (string) ($filters['sort'] ?? 'newest'));

        // On the unfiltered all-source first page the primary 25-item
        // result is the same authorized, ordered list as overview's first 6.
        // All other requests retain an independently unfiltered overview;
        // filtered lists or later pages must never change overview content.
        $canReuseOverview = ($filters['sort'] ?? 'newest') === 'newest' && $recordType === 'all'
            && (int) ($filters['page'] ?? 1) === 1
            && ! array_filter(
                [
                    $filters['search'] ?? null,
                    $filters['state'] ?? null,
                    $filters['office_id'] ?? null,
                    $filters['date_from'] ?? null,
                    $filters['date_to'] ?? null,
                ],
                static fn ($value): bool => $value !== null && $value !== '',
            );
        $overviewRecent = $canReuseOverview
            ? array_slice($recordsPage->items(), 0, 6)
            : $this->paginate(
                'all',
                clone $correspondenceBase,
                clone $transactionBase,
                clone $travelOrderBase,
                6,
                1,
            )->items();

        return [
            'records' => $recordsPage,
            'overview' => [
                'counts' => $this->overviewCounts(
                    $correspondenceBase,
                    $transactionBase,
                    $travelOrderBase,
                ),
                'recent' => $overviewRecent,
            ],
            'filters' => [
                'view' => $view,
                'sort' => (string) ($filters['sort'] ?? 'newest'),
                'search' => (string) ($filters['search'] ?? ''),
                'record_type' => $recordType,
                'state' => (string) ($filters['state'] ?? ''),
                'office_id' => isset($filters['office_id']) ? (int) $filters['office_id'] : null,
                'date_from' => (string) ($filters['date_from'] ?? ''),
                'date_to' => (string) ($filters['date_to'] ?? ''),
            ],
            'filterOptions' => [
                'recordTypes' => [
                    ['value' => 'all', 'label' => 'All Records'],
                    ['value' => 'correspondence', 'label' => 'Correspondence'],
                    ['value' => 'transaction', 'label' => 'Inter-Office Transactions'],
                    ['value' => 'travel_order', 'label' => 'Approved Travel Orders'],
                ],
                'states' => $this->stateOptions(
                    $recordType,
                    $correspondenceBase,
                    $transactionBase,
                    $travelOrderBase,
                ),
                'offices' => $this->officeOptions(
                    $recordType,
                    $correspondenceBase,
                    $transactionBase,
                    $travelOrderBase,
                ),
            ],
        ];
    }

    private function authorizedCorrespondence(VerifiedMunicipalActor $verified): Builder
    {
        $query = CorrespondenceRecord::query();
        $this->correspondenceAccess->scopeVisibleToVerifiedActor($query, $verified);

        return $query;
    }

    /** @param array<string, mixed> $filters */
    private function applyCorrespondenceFilters(Builder $query, array $filters): void
    {
        $search = Str::lower(trim((string) ($filters['search'] ?? '')));
        if ($search !== '') {
            $like = '%'.$search.'%';
            $query->where(function (Builder $match) use ($like): void {
                foreach ([
                    'municipal_reference_no',
                    'external_reference_no',
                    'subject',
                    'summary',
                    'sender_name',
                    'sender_organization',
                    'source',
                ] as $column) {
                    $match->orWhereRaw("LOWER(COALESCE({$column}, '')) LIKE ?", [$like]);
                }

                $match->orWhere(function (Builder $office) use ($like): void {
                    $office->whereHas(
                        'workflowTransaction.currentDepartment',
                        fn (Builder $department) => $this->matchOffice($department, $like),
                    )->orWhere(function (Builder $unlinked) use ($like): void {
                        $unlinked->whereNull('workflow_transaction_id')
                            ->whereHas(
                                'receivingDepartment',
                                fn (Builder $department) => $this->matchOffice($department, $like),
                            );
                    });
                })->orWhereHas(
                    'workflowTransaction.assignedEmployee',
                    fn (Builder $employee) => $employee->whereRaw("LOWER(COALESCE(full_name, '')) LIKE ?", [$like]),
                );
            });
        }

        if (! empty($filters['state'])) {
            $query->where('lifecycle_state', (string) $filters['state']);
        }

        if (! empty($filters['office_id'])) {
            $this->applyCorrespondenceOffice($query, (int) $filters['office_id']);
        }

        $this->applyDateBounds($query, 'received_at', $filters);
    }

    /** @param array<string, mixed> $filters */
    private function applyTransactionFilters(Builder $query, array $filters): void
    {
        $search = Str::lower(trim((string) ($filters['search'] ?? '')));
        if ($search !== '') {
            $like = '%'.$search.'%';
            $query->where(function (Builder $match) use ($like): void {
                foreach (['reference_no', 'title', 'description', 'transaction_type'] as $column) {
                    $match->orWhereRaw("LOWER(COALESCE({$column}, '')) LIKE ?", [$like]);
                }

                $match->orWhereHas('originDepartment', fn (Builder $department) => $this->matchOffice($department, $like))
                    ->orWhereHas('currentDepartment', fn (Builder $department) => $this->matchOffice($department, $like))
                    ->orWhereHas(
                        'assignedEmployee',
                        fn (Builder $employee) => $employee->whereRaw("LOWER(COALESCE(full_name, '')) LIKE ?", [$like]),
                    );
            });
        }

        if (! empty($filters['state'])) {
            $query->where('status', (string) $filters['state']);
        }

        if (! empty($filters['office_id'])) {
            $query->where('current_department_id', (int) $filters['office_id']);
        }

        $this->applyTransactionDateBounds($query, $filters);
    }

    /** @param array<string, mixed> $filters */
    private function applyTravelOrderFilters(Builder $query, array $filters): void
    {
        $search = Str::lower(trim((string) ($filters['search'] ?? '')));
        if ($search !== '') {
            $like = '%'.$search.'%';
            $query->where(function (Builder $match) use ($like): void {
                foreach (['reference_number', 'purpose', 'destination'] as $column) {
                    $match->orWhereRaw("LOWER(COALESCE({$column}, '')) LIKE ?", [$like]);
                }

                $match->orWhereHas('department', fn (Builder $department) => $this->matchOffice($department, $like))
                    ->orWhereHas('issuedTo', function (Builder $employee) use ($like): void {
                        $employee->whereRaw("LOWER(COALESCE(full_name, '')) LIKE ?", [$like])
                            ->orWhereRaw("LOWER(COALESCE(employee_number, '')) LIKE ?", [$like]);
                    });
            });
        }

        if (! empty($filters['state'])) {
            $query->where('status', (string) $filters['state']);
        }

        if (! empty($filters['office_id'])) {
            $query->where('department_id', (int) $filters['office_id']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('travel_end_date', '>=', (string) $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('travel_start_date', '<=', (string) $filters['date_to']);
        }
    }

    private function matchOffice(Builder $query, string $like): Builder
    {
        return $query->where(function (Builder $office) use ($like): void {
            $office->whereRaw("LOWER(COALESCE(name, '')) LIKE ?", [$like])
                ->orWhereRaw("LOWER(COALESCE(code, '')) LIKE ?", [$like])
                ->orWhereRaw("LOWER(COALESCE(short_name, '')) LIKE ?", [$like]);
        });
    }

    private function applyCorrespondenceOffice(Builder $query, int $officeId): void
    {
        $query->where(function (Builder $office) use ($officeId): void {
            $office->whereHas(
                'workflowTransaction',
                fn (Builder $workflow) => $workflow->where('current_department_id', $officeId),
            )->orWhere(function (Builder $unlinked) use ($officeId): void {
                $unlinked->whereNull('workflow_transaction_id')
                    ->where('receiving_department_id', $officeId);
            });
        });
    }

    /** @param array<string, mixed> $filters */
    private function applyDateBounds(Builder $query, string $column, array $filters): void
    {
        if (! empty($filters['date_from'])) {
            $query->whereDate($column, '>=', (string) $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate($column, '<=', (string) $filters['date_to']);
        }
    }

    /** @param array<string, mixed> $filters */
    private function applyTransactionDateBounds(Builder $query, array $filters): void
    {
        foreach (['date_from' => '>=', 'date_to' => '<='] as $key => $operator) {
            if (empty($filters[$key])) {
                continue;
            }

            $date = (string) $filters[$key];
            $query->where(function (Builder $bounded) use ($operator, $date): void {
                $bounded->whereDate('received_at', $operator, $date)
                    ->orWhere(function (Builder $legacy) use ($operator, $date): void {
                        $legacy->whereNull('received_at')
                            ->whereDate('created_at', $operator, $date);
                    });
            });
        }
    }

    private function paginate(
        string $recordType,
        Builder $correspondence,
        Builder $transactions,
        Builder $travelOrders,
        int $perPage = 25,
        ?int $page = null,
        string $sort = 'newest',
    ): LengthAwarePaginator {
        $sources = [];

        if ($this->includesSource($recordType, 'correspondence')) {
            $sources[] = $correspondence->selectRaw(
                "'correspondence' AS record_type, CAST(public_id AS TEXT) AS record_key, received_at AS record_date, id AS sort_id",
            );
        }

        if ($this->includesSource($recordType, 'transaction')) {
            $sources[] = $transactions->selectRaw(
                "'transaction' AS record_type, CAST(id AS TEXT) AS record_key, COALESCE(received_at, created_at) AS record_date, id AS sort_id",
            );
        }

        if ($this->includesSource($recordType, 'travel_order')) {
            $sources[] = $travelOrders->selectRaw(
                "'travel_order' AS record_type, CAST(public_id AS TEXT) AS record_key, issuance_date AS record_date, id AS sort_id",
            );
        }

        $union = array_shift($sources);
        foreach ($sources as $source) {
            $union->unionAll($source);
        }

        $paginator = DB::query()
            ->fromSub($union->toBase(), 'records_registry')
            ->orderBy('record_date', $sort === 'oldest' ? 'asc' : 'desc')
            ->orderBy('sort_id', $sort === 'oldest' ? 'asc' : 'desc')
            ->orderBy('record_type')
            ->paginate($perPage, ['*'], 'page', $page)
            ->withQueryString();

        return $this->presenter->hydratePage($paginator);
    }

    /**
     * Resolve all unfiltered overview totals in one database round-trip while
     * preserving the exact authorization scope of each record family.
     *
     * @return array{all:int,correspondence:int,transaction:int,travel_order:int}
     */
    private function overviewCounts(
        Builder $correspondence,
        Builder $transactions,
        Builder $travelOrders,
    ): array {
        $sources = [
            (clone $correspondence)->selectRaw("'correspondence' AS record_type, COUNT(*) AS aggregate"),
            (clone $transactions)->selectRaw("'transaction' AS record_type, COUNT(*) AS aggregate"),
            (clone $travelOrders)->selectRaw("'travel_order' AS record_type, COUNT(*) AS aggregate"),
        ];

        $union = array_shift($sources);
        foreach ($sources as $source) {
            $union->unionAll($source);
        }

        $counts = DB::query()
            ->fromSub($union->toBase(), 'record_counts')
            ->pluck('aggregate', 'record_type');

        $correspondenceCount = (int) ($counts['correspondence'] ?? 0);
        $transactionCount = (int) ($counts['transaction'] ?? 0);
        $travelOrderCount = (int) ($counts['travel_order'] ?? 0);

        return [
            'all' => $correspondenceCount + $transactionCount + $travelOrderCount,
            'correspondence' => $correspondenceCount,
            'transaction' => $transactionCount,
            'travel_order' => $travelOrderCount,
        ];
    }

    private function stateOptions(
        string $recordType,
        Builder $correspondence,
        Builder $transactions,
        Builder $travelOrders,
    ): array {
        $sources = [];

        if ($this->includesSource($recordType, 'correspondence')) {
            $sources[] = (clone $correspondence)->selectRaw('lifecycle_state AS value');
        }

        if ($this->includesSource($recordType, 'transaction')) {
            $sources[] = (clone $transactions)->selectRaw('status AS value');
        }

        if ($this->includesSource($recordType, 'travel_order')) {
            $sources[] = (clone $travelOrders)->selectRaw('status AS value');
        }

        $union = array_shift($sources);
        foreach ($sources as $source) {
            $union->unionAll($source);
        }

        return DB::query()
            ->fromSub($union->toBase(), 'record_states')
            ->whereNotNull('value')
            ->distinct()
            ->orderBy('value')
            ->pluck('value')
            ->map(fn ($value): array => [
                'value' => (string) $value,
                'label' => Str::headline((string) $value),
            ])
            ->all();
    }

    private function officeOptions(
        string $recordType,
        Builder $correspondence,
        Builder $transactions,
        Builder $travelOrders,
    ): array {
        $sources = [];

        if ($this->includesSource($recordType, 'correspondence')) {
            $workflowIds = (clone $correspondence)
                ->whereNotNull('workflow_transaction_id')
                ->select('workflow_transaction_id');

            $sources[] = WorkflowTransaction::query()
                ->whereIn('id', $workflowIds)
                ->selectRaw('current_department_id AS department_id');

            $sources[] = (clone $correspondence)
                ->whereNull('workflow_transaction_id')
                ->selectRaw('receiving_department_id AS department_id');
        }

        if ($this->includesSource($recordType, 'transaction')) {
            $sources[] = (clone $transactions)
                ->selectRaw('current_department_id AS department_id');
        }

        if ($this->includesSource($recordType, 'travel_order')) {
            $sources[] = (clone $travelOrders)
                ->selectRaw('department_id AS department_id');
        }

        $union = array_shift($sources);
        foreach ($sources as $source) {
            $union->unionAll($source);
        }

        // Keep the office scope in SQL rather than fetching IDs and then
        // issuing a second round-trip. The department still must be active.
        $ids = DB::query()
            ->fromSub($union->toBase(), 'record_offices')
            ->whereNotNull('department_id')
            ->distinct()
            ->select('department_id');

        return Department::query()
            ->where('is_active', true)
            ->whereIn('id', $ids)
            ->orderBy('branch')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'short_name'])
            ->map(fn (Department $department): array => [
                'id' => (int) $department->id,
                'code' => $department->code,
                'name' => $department->name,
                'shortName' => $department->short_name,
            ])
            ->all();
    }

    private function includesSource(string $recordType, string $source): bool
    {
        return $recordType === 'all' || $recordType === $source;
    }
}
