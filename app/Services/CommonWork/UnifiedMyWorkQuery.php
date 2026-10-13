<?php

namespace App\Services\CommonWork;

use App\Domain\Tasks\TaskCoreAccess;
use App\Domain\Workflow\Authorization\TransactionActorEligibility;
use App\Domain\Tasks\TaskCoreService;
use App\Domain\Tasks\TaskLifecycleState;
use App\Models\User;
use App\Services\TransactionVisibilityQuery;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * A02 PREPARATORY DRAFT. Read-only personal responsibility feed, not a policy,
 * writable WorkItem aggregate, public endpoint or replacement for WorkQueueQuery.
 */
final readonly class UnifiedMyWorkQuery
{
    public function __construct(
        private TaskCoreAccess $taskAccess,
        private TaskCoreService $tasks,
        private TransactionVisibilityQuery $transactions,
        private TransactionActorEligibility $transactionEligibility,
    ) {}

    /**
     * @param ?string $source Exact source discriminator, or null for both sources.
     * @return LengthAwarePaginator<int, CommonWorkItem>
     */
    public function paginate(User $claimedActor, int $page = 1, int $perPage = 20, ?string $source = null): LengthAwarePaginator
    {
        $this->assertPaginationAndSource($page, $perPage, $source);

        // No caller-supplied user can bypass live account/employee verification.
        $actor = $this->taskAccess->verifiedActor($claimedActor);
        $query = $this->sourceRows($this->authorizedRows($actor), $source);

        return $this->paginateRows($query, $page, $perPage);
    }

    /**
     * The explicit, timezone-aware due interval is [fromInclusive, beforeExclusive).
     * Only already-authorized personal rows are eligible; null due dates are excluded.
     * This does not assign urgency, synthesize a municipal SLA or normalize states.
     *
     * @param string $fromInclusive RFC3339 timestamp with a required UTC offset or Z.
     * @param string $beforeExclusive RFC3339 timestamp with a required UTC offset or Z.
     * @param ?string $source individual_task, work_request, or null for both sources.
     * @return LengthAwarePaginator<int, CommonWorkItem>
     */
    public function dueWindow(
        User $claimedActor,
        string $fromInclusive,
        string $beforeExclusive,
        int $page = 1,
        int $perPage = 20,
        ?string $source = null,
    ): LengthAwarePaginator {
        $this->assertPaginationAndSource($page, $perPage, $source);
        $from = $this->utcBoundary($fromInclusive);
        $before = $this->utcBoundary($beforeExclusive);

        if ($from->greaterThanOrEqualTo($before)) {
            throw new InvalidArgumentException('Common Work due window must have an increasing, nonempty interval.');
        }

        $actor = $this->taskAccess->verifiedActor($claimedActor);
        $query = $this->sourceRows($this->authorizedRows($actor), $source)
            ->whereNotNull('due_at')
            ->where('due_at', '>=', $from->format('Y-m-d H:i:s.uP'))
            ->where('due_at', '<', $before->format('Y-m-d H:i:s.uP'));

        return $this->paginateRows($query, $page, $perPage);
    }

    /**
     * Read one source's exact native lifecycle state; never interpret Task and
     * Work Request states as an interchangeable, shared state machine.
     *
     * @param string $source Required: individual_task or work_request.
     * @param string $state Exact state configured for that native source.
     * @return LengthAwarePaginator<int, CommonWorkItem>
     */
    public function nativeState(
        User $claimedActor,
        string $source,
        string $state,
        int $page = 1,
        int $perPage = 20,
    ): LengthAwarePaginator {
        $this->assertPaginationAndSource($page, $perPage, $source);

        // State filtering without a concrete source is prohibited. The Task
        // enum and configured Work Request definitions are independent.
        $allowed = match (CommonWorkSource::from($source)) {
            CommonWorkSource::IndividualTask => TaskLifecycleState::tryFrom($state) !== null,
            CommonWorkSource::WorkRequest => $this->isConfiguredRequestState($state),
        };
        if (! $allowed) {
            throw new InvalidArgumentException('Unknown native state for the specified Common Work source.');
        }

        $actor = $this->taskAccess->verifiedActor($claimedActor);

        // Source + state are bound SQL predicates on the same actor-authorized
        // UNION ALL used by paginate() and dueWindow(). No broader queue scope.
        $query = $this->sourceRows($this->authorizedRows($actor), $source)
            ->where('source_state', '=', $state);

        return $this->paginateRows($query, $page, $perPage);
    }

    /**
     * Derive Work Request state vocabulary from existing workflow configuration.
     * Type overrides may supply their own native states; no A03 status list,
     * universal lifecycle or municipality-specific rule is invented here.
     */
    private function isConfiguredRequestState(string $state): bool
    {
        if ($state === '') {
            return false;
        }

        $definitions = [config('workflow.default', [])];
        foreach (config('workflow.types', []) as $definition) {
            $definitions[] = $definition;
        }

        foreach ($definitions as $definition) {
            if (! is_array($definition)) {
                continue;
            }
            if (($definition['initial_status'] ?? null) === $state) {
                return true;
            }
            $terminal = $definition['terminal_statuses'] ?? [];
            if (is_array($terminal) && in_array($state, $terminal, true)) {
                return true;
            }

            foreach ($definition['transitions'] ?? [] as $rule) {
                if (! is_array($rule)) {
                    continue;
                }
                if (($rule['status'] ?? null) === $state) {
                    return true;
                }
                $from = $rule['allowed_from'] ?? [];
                if (is_array($from) && in_array($state, $from, true)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Enforce explicit instants rather than parsing timezone-ambiguous dates,
     * local wall-clock values or relative expressions such as "tomorrow".
     */
    private function utcBoundary(string $value): CarbonImmutable
    {
        if (! preg_match('/\A\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,6})?(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)\z/D', $value)) {
            throw new InvalidArgumentException('Common Work due boundaries require RFC3339 timestamps with explicit timezones.');
        }

        try {
            $instant = CarbonImmutable::parse($value);
        } catch (\Throwable) {
            throw new InvalidArgumentException('Invalid Common Work due boundary.');
        }

        // Carbon can normalize impossible calendar dates; reject rollover.
        if ($instant->format('Y-m-d\TH:i:s') !== substr($value, 0, 19)) {
            throw new InvalidArgumentException('Invalid Common Work due boundary.');
        }

        return $instant->utc();
    }

    private function assertPaginationAndSource(int $page, int $perPage, ?string $source): void
    {
        if ($page < 1 || $page > 10000 || $perPage < 1 || $perPage > 50) {
            throw new InvalidArgumentException('Common Work pagination is outside the allowed bounds.');
        }
        if ($source !== null && CommonWorkSource::tryFrom($source) === null) {
            throw new InvalidArgumentException('Unknown Common Work source.');
        }
    }

    private function sourceRows(QueryBuilder $query, ?string $source): QueryBuilder
    {
        // A source filter is applied after the original, actor-authorized UNION.
        if ($source !== null) {
            $query->where('source_type', $source);
        }

        return $query;
    }

    /**
     * Share B01's unchanged total ordering, SQL pagination and item mapping.
     *
     * @return LengthAwarePaginator<int, CommonWorkItem>
     */
    private function paginateRows(QueryBuilder $query, int $page, int $perPage): LengthAwarePaginator
    {
        $rows = $query
            ->orderByDesc('updated_at')
            ->orderBy('source_type')
            ->orderByDesc('source_id')
            ->paginate($perPage, ['*'], 'page', $page);

        return $rows->through(fn (object $row): CommonWorkItem => new CommonWorkItem(
            source: CommonWorkSource::from($row->source_type),
            sourceId: (int) $row->source_id,
            sourceKind: (string) $row->source_kind,
            title: (string) $row->title,
            sourceState: (string) $row->source_state,
            responsibility: (string) $row->responsibility,
            reference: $row->reference,
            dueAt: $this->iso($row->due_at),
            updatedAt: $this->iso($row->updated_at),
            isTerminal: $row->source_type === CommonWorkSource::IndividualTask->value
                ? $row->source_state === TaskLifecycleState::Completed->value
                : in_array($row->source_state, config('workflow.default.terminal_statuses', [
                    'approved', 'disapproved', 'closed',
                ]), true),
        ));
    }

    /**
     * Fixed-shape, source-separated counts across all visible personal work.
     * The summary is intentionally unfiltered so it can populate source tabs.
     * No state labels are merged across different source lifecycles.
     *
     * @return array{total: int, by_source: array{individual_task: int, work_request: int}}
     */
    public function summary(User $claimedActor): array
    {
        $actor = $this->taskAccess->verifiedActor($claimedActor);

        // One database aggregate: never hydrate or enumerate every visible row.
        $counts = $this->authorizedRows($actor)
            ->selectRaw(
                'COUNT(*) AS total, '
                .'COUNT(*) FILTER (WHERE source_type = ?) AS individual_task, '
                .'COUNT(*) FILTER (WHERE source_type = ?) AS work_request',
                [CommonWorkSource::IndividualTask->value, CommonWorkSource::WorkRequest->value],
            )
            ->first();

        return [
            'total' => (int) ($counts->total ?? 0),
            'by_source' => [
                CommonWorkSource::IndividualTask->value => (int) ($counts->individual_task ?? 0),
                CommonWorkSource::WorkRequest->value => (int) ($counts->work_request ?? 0),
            ],
        ];
    }

    /**
     * The single authorization boundary for both pagination and aggregation.
     * @return QueryBuilder
     */
    private function authorizedRows(User $actor): QueryBuilder
    {
        // Reuse the accepted owner-only A01 Task scope exactly. Legacy,
        // assigned and official Task rows remain excluded.
        $taskRows = $this->tasks->visibleIndividualTasks($actor)
            ->selectRaw("'individual_task' AS source_type, tasks.id AS source_id, tasks.task_kind AS source_kind, tasks.title, tasks.state AS source_state, NULL AS reference, 'task_owner' AS responsibility, tasks.due_at, tasks.updated_at");

        // Work Request visibility always precedes personal responsibility
        // narrowing. Employee ID and User ID are never interchangeable.
        $employeeId = $this->transactionEligibility->resolve($actor)['employee_id'] ?? 0;
        $requestRows = $this->transactions->scope($actor)
            ->where(function (Builder $query) use ($actor, $employeeId): void {
                $query->where('created_by_user_id', $actor->id)
                    ->orWhere('assigned_employee_id', $employeeId);
            })
            ->selectRaw("'work_request' AS source_type, transactions.id AS source_id, transactions.transaction_type AS source_kind, transactions.title, transactions.status AS source_state, transactions.reference_no AS reference, CASE WHEN transactions.assigned_employee_id = ? THEN 'request_assignee' ELSE 'request_creator' END AS responsibility, transactions.due_at, transactions.updated_at", [$employeeId]);

        // Preserve positional shape, SQL parameter binding and UNION ALL.
        return DB::query()
            ->fromSub($taskRows->toBase()->unionAll($requestRows->toBase()), 'common_work');
    }

    private function iso(?string $timestamp): ?string
    {
        return $timestamp === null ? null : CarbonImmutable::parse($timestamp)->toIso8601String();
    }
}
