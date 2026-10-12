<?php

namespace App\Services\TaskActivity;

use App\Domain\Tasks\TaskCoreService;
use App\Models\Task;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Bounded, read-only per-Task history overview; not an office audit or KPI.
 *
 * All requested IDs must be visible through the existing C1 personal Task
 * policy. A mixed authorized/inaccessible request fails as a whole so it
 * cannot be used to enumerate the existence or activity of other Tasks.
 */
final class TaskActivityOverview
{
    private const MAX_TASKS = 50;

    public function __construct(private readonly TaskCoreService $tasks)
    {
    }

    /**
     * @param list<int> $taskIds Up to 50 positive Task IDs; duplicates collapse.
     * @return array{
     *     data: list<array{
     *         task: array{source: 'task', kind: 'individual', id: int},
     *         event_count: int,
     *         latest_action: string|null,
     *         latest_event_at: string|null
     *     }>,
     *     meta: array{task_count: int}
     * }
     */
    public function summarize(User $claimedActor, array $taskIds): array
    {
        // Authenticate and recheck active account, employment and office
        // even when the request contains no Task IDs.
        $personalTasks = $this->tasks->visibleIndividualTasks($claimedActor);

        if (count($taskIds) > self::MAX_TASKS) {
            throw ValidationException::withMessages([
                'task_ids' => 'Task activity overview accepts at most 50 Task IDs.',
            ]);
        }

        foreach ($taskIds as $taskId) {
            if (! is_int($taskId) || $taskId < 1) {
                throw ValidationException::withMessages([
                    'task_ids' => 'Task activity overview requires positive integer Task IDs.',
                ]);
            }
        }

        // A duplicate does not amplify work or produce duplicate summaries.
        // Preserve the first-occurrence order in the response.
        $ids = array_values(array_unique($taskIds));

        if ($ids === []) {
            return ['data' => [], 'meta' => ['task_count' => 0]];
        }

        // Each correlated count runs only for an already-authorized Task row.
        // The existing task_events(task_id, id) index supports this lookup;
        // COUNT(*) is an exact historical count, not an inferred KPI.
        $eventCount = DB::table('task_events as counted')
            ->selectRaw('COUNT(*)')
            ->whereColumn('counted.task_id', 'tasks.id');

        // A lateral LIMIT 1 fetches only the most recent event for each
        // visible Task. Equal timestamps are resolved by the event's ID.
        // LEFT preserves authorized Tasks that have no event rows.
        $latestEvent = DB::table('task_events as recent')
            ->select([
                'recent.action',
                'recent.created_at',
            ])
            ->whereColumn('recent.task_id', 'tasks.id')
            ->orderByDesc('recent.created_at')
            ->orderByDesc('recent.id')
            ->limit(1);

        // One bounded, statement-consistent SQL read. No global event scan,
        // N+1 ORM loading, actor-profile lookup, or in-PHP history filtering.
        $rows = $personalTasks
            ->whereIn('tasks.id', $ids)
            ->select(['tasks.id'])
            ->selectSub($eventCount, 'activity_event_count')
            ->leftJoinLateral($latestEvent, 'activity_latest')
            ->addSelect([
                'activity_latest.action as activity_latest_action',
                'activity_latest.created_at as activity_latest_at',
            ])
            ->get()
            ->keyBy('id');

        // No partial success, missing-ID list, title, count or existence flag
        // is disclosed when any requested Task is foreign/off-kind/missing.
        if ($rows->count() !== count($ids)) {
            throw (new ModelNotFoundException())->setModel(Task::class);
        }

        $data = [];

        foreach ($ids as $id) {
            /** @var Task $row */
            $row = $rows->get($id);
            $storedTime = $row->getAttribute('activity_latest_at');

            $data[] = [
                'task' => [
                    'source' => 'task',
                    'kind' => 'individual',
                    'id' => (int) $row->id,
                ],
                'event_count' => (int) $row->getAttribute('activity_event_count'),
                'latest_action' => $row->getAttribute('activity_latest_action'),
                'latest_event_at' => $storedTime === null
                    ? null
                    : CarbonImmutable::parse((string) $storedTime)->toIso8601String(),
            ];
        }

        return [
            'data' => $data,
            'meta' => ['task_count' => count($data)],
        ];
    }
}
