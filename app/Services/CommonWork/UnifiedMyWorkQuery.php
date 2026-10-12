<?php

namespace App\Services\CommonWork;

use App\Domain\Tasks\TaskCoreAccess;
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
    ) {}

    /**
     * @param ?string $source Exact source discriminator, or null for both sources.
     * @return LengthAwarePaginator<int, CommonWorkItem>
     */
    public function paginate(User $claimedActor, int $page = 1, int $perPage = 20, ?string $source = null): LengthAwarePaginator
    {
        if ($page < 1 || $page > 10000 || $perPage < 1 || $perPage > 50) {
            throw new InvalidArgumentException('Common Work pagination is outside the allowed bounds.');
        }
        if ($source !== null && CommonWorkSource::tryFrom($source) === null) {
            throw new InvalidArgumentException('Unknown Common Work source.');
        }

        // No caller-supplied user can bypass live account/employee verification.
        $actor = $this->taskAccess->verifiedActor($claimedActor);
        $query = $this->authorizedRows($actor);

        // Restrict only the already-authorized SQL projection. Never substitute
        // an unscoped Task or Work Request query for a single-source request.
        if ($source !== null) {
            $query->where('source_type', $source);
        }

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
        $requestRows = $this->transactions->scope($actor)
            ->where(function (Builder $query) use ($actor): void {
                $query->where('created_by_user_id', $actor->id)
                    ->orWhere('assigned_employee_id', $actor->employee->id);
            })
            ->selectRaw("'work_request' AS source_type, transactions.id AS source_id, transactions.transaction_type AS source_kind, transactions.title, transactions.status AS source_state, transactions.reference_no AS reference, CASE WHEN transactions.assigned_employee_id = ? THEN 'request_assignee' ELSE 'request_creator' END AS responsibility, transactions.due_at, transactions.updated_at", [$actor->employee->id]);

        // Preserve positional shape, SQL parameter binding and UNION ALL.
        return DB::query()
            ->fromSub($taskRows->toBase()->unionAll($requestRows->toBase()), 'common_work');
    }

    private function iso(?string $timestamp): ?string
    {
        return $timestamp === null ? null : CarbonImmutable::parse($timestamp)->toIso8601String();
    }
}
