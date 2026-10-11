<?php

namespace App\Services\CommonWork;

use App\Domain\Tasks\TaskCoreAccess;
use App\Domain\Tasks\TaskCoreService;
use App\Domain\Tasks\TaskLifecycleState;
use App\Models\User;
use App\Services\TransactionVisibilityQuery;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
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

    /** @return LengthAwarePaginator<int, CommonWorkItem> */
    public function paginate(User $claimedActor, int $page = 1, int $perPage = 20): LengthAwarePaginator
    {
        if ($page < 1 || $page > 10000 || $perPage < 1 || $perPage > 50) {
            throw new InvalidArgumentException('Common Work pagination is outside the allowed bounds.');
        }

        // Revalidate the live session, account, employment and office. A passed
        // User object, even with a privileged role, cannot select another actor.
        $actor = $this->taskAccess->verifiedActor($claimedActor);

        // Reuse the accepted owner-only A01 Task scope exactly. Legacy, assigned
        // and official Task rows are excluded by the source's own contract.
        $taskRows = $this->tasks->visibleIndividualTasks($actor)
            ->selectRaw("'individual_task' AS source_type, tasks.id AS source_id, tasks.task_kind AS source_kind, tasks.title, tasks.state AS source_state, NULL AS reference, 'task_owner' AS responsibility, tasks.due_at, tasks.updated_at");

        // Visibility always precedes responsibility narrowing. Work Requests
        // retain their office/capability visibility; no inferred Task privilege.
        $requestRows = $this->transactions->scope($actor)
            ->where(function (Builder $query) use ($actor): void {
                $query->where('created_by_user_id', $actor->id)
                    ->orWhere('assigned_employee_id', $actor->employee->id);
            })
            ->selectRaw("'work_request' AS source_type, transactions.id AS source_id, transactions.transaction_type AS source_kind, transactions.title, transactions.status AS source_state, transactions.reference_no AS reference, CASE WHEN transactions.assigned_employee_id = ? THEN 'request_assignee' ELSE 'request_creator' END AS responsibility, transactions.due_at, transactions.updated_at", [$actor->employee->id]);

        // SQL-level UNION ALL avoids full-table hydration, N+1 presentation
        // queries, cross-source ID collision and unbounded in-memory sorting.
        $rows = DB::query()
            ->fromSub($taskRows->toBase()->unionAll($requestRows->toBase()), 'common_work')
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

    private function iso(?string $timestamp): ?string
    {
        return $timestamp === null ? null : CarbonImmutable::parse($timestamp)->toIso8601String();
    }
}
