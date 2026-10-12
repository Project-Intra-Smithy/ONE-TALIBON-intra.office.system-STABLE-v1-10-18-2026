<?php

namespace App\Services\TaskActivity;

use App\Domain\Tasks\TaskCoreService;
use App\Models\TaskEvent;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Validation\ValidationException;

/**
 * Read-only activity across the authenticated employee's eligible personal Tasks.
 *
 * The authorized Task query is joined inside SQL before events are selected.
 * This service adds no cross-office permission or public HTTP contract.
 */
final class TaskActivityFeed
{
    private const DEFAULT_PER_PAGE = 20;

    private const MAX_PER_PAGE = 50;

    public function __construct(private readonly TaskCoreService $tasks)
    {
    }

    /**
     * @return array{
     *     data: list<array{
     *         id: int,
     *         task: array{
     *             id: int,
     *             title: string,
     *             source: array{domain: string|null, type: string|null, id: int|null}|null
     *         },
     *         action: string,
     *         actor_user_id: int,
     *         previous_state: string|null,
     *         new_state: string,
     *         created_at: string|null
     *     }>,
     *     meta: array{
     *         per_page: int,
     *         has_more: bool,
     *         next_before_event_id: int|null
     *     }
     * }
     */
    public function page(
        User $claimedActor,
        int $perPage = self::DEFAULT_PER_PAGE,
        ?int $beforeEventId = null,
    ): array {
        // Reuse the C1 session, employment, department and owner-only scope.
        // The caller cannot broaden visibility by supplying a different User.
        $personalTasks = $this->tasks->visibleIndividualTasks($claimedActor)
            ->select([
                'tasks.id',
                'tasks.title',
                'tasks.source_domain',
                'tasks.source_type',
                'tasks.source_id',
            ]);

        if ($perPage < 1 || $perPage > self::MAX_PER_PAGE) {
            throw ValidationException::withMessages([
                'per_page' => 'Task activity page size must be between 1 and 50.',
            ]);
        }

        if ($beforeEventId !== null && $beforeEventId < 1) {
            throw ValidationException::withMessages([
                'before_event_id' => 'Task activity cursor must be a positive event ID.',
            ]);
        }

        // Joining the authorized Tasks in the database prevents an event from
        // another owner or office entering the result set, even transiently.
        // Source columns are passive Task references, never joined records.
        $events = TaskEvent::query()
            ->joinSub($personalTasks, 'personal_tasks', static function (JoinClause $join): void {
                $join->on('personal_tasks.id', '=', 'task_events.task_id');
            })
            ->select([
                'task_events.id',
                'task_events.task_id',
                'task_events.actor_user_id',
                'task_events.action',
                'task_events.previous_state',
                'task_events.new_state',
                'task_events.created_at',
                'personal_tasks.title as activity_task_title',
                'personal_tasks.source_domain as activity_source_domain',
                'personal_tasks.source_type as activity_source_type',
                'personal_tasks.source_id as activity_source_id',
            ]);

        if ($beforeEventId !== null) {
            // The anchor must be visible through the same authorized SQL join.
            // Foreign/missing event IDs share a concealed 404 outcome.
            $anchor = (clone $events)
                ->select(['task_events.id', 'task_events.created_at'])
                ->where('task_events.id', $beforeEventId)
                ->firstOrFail();

            $events->where(static function (Builder $query) use ($anchor): void {
                $query->where('task_events.created_at', '<', $anchor->created_at)
                    ->orWhere(static function (Builder $tied) use ($anchor): void {
                        $tied->where('task_events.created_at', '=', $anchor->created_at)
                            ->where('task_events.id', '<', $anchor->id);
                    });
            });
        }

        $rows = $events
            ->orderByDesc('task_events.created_at')
            ->orderByDesc('task_events.id')
            ->limit($perPage + 1)
            ->get();

        $hasMore = $rows->count() > $perPage;
        $page = $rows->take($perPage);

        return [
            'data' => $page->map(static function (TaskEvent $event): array {
                $domain = $event->getAttribute('activity_source_domain');
                $type = $event->getAttribute('activity_source_type');
                $sourceId = $event->getAttribute('activity_source_id');

                return [
                    'id' => (int) $event->id,
                    'task' => [
                        'id' => (int) $event->task_id,
                        'title' => (string) $event->getAttribute('activity_task_title'),
                        'source' => $domain === null && $type === null && $sourceId === null
                            ? null
                            : [
                                'domain' => $domain,
                                'type' => $type,
                                'id' => $sourceId === null ? null : (int) $sourceId,
                            ],
                    ],
                    'action' => $event->action,
                    // Historical actor attribution is an ID, not a profile lookup.
                    'actor_user_id' => (int) $event->actor_user_id,
                    'previous_state' => $event->previous_state,
                    'new_state' => $event->new_state,
                    'created_at' => $event->created_at?->toIso8601String(),
                ];
            })->values()->all(),
            'meta' => [
                'per_page' => $perPage,
                'has_more' => $hasMore,
                'next_before_event_id' => $hasMore
                    ? (int) $page->last()->id
                    : null,
            ],
        ];
    }
}
