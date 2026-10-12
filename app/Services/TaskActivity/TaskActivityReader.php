<?php

namespace App\Services\TaskActivity;

use App\Domain\Tasks\TaskCoreService;
use App\Models\TaskEvent;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

/**
 * Read-only history for a session-authorized, owner-created individual Task.
 *
 * This is an internal service, not a route or an authorization policy. Callers
 * must supply the authenticated session User; TaskCoreService verifies that
 * identity and the live employee/department state before any event lookup.
 *
 * Pagination is newest-first and keyset-based. The continuation token is an
 * event ID belonging to this same visible Task, never an arbitrary event ID
 * queried outside the Task boundary.
 */
final class TaskActivityReader
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
        int $taskId,
        int $perPage = self::DEFAULT_PER_PAGE,
        ?int $beforeEventId = null,
    ): array {
        // Preserve the C1 read boundary: mismatched session, inactive actor or
        // inactive office is denied; missing, foreign, legacy and assigned
        // Tasks remain indistinguishable through the owner-filtered 404.
        $task = $this->tasks->findVisibleIndividual($claimedActor, $taskId);

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

        // The relationship always constrains task_id. Do not load TaskEvent
        // globally, or load actor User records (names, roles or emails).
        $events = $task->events()->select([
            'id',
            'task_id',
            'actor_user_id',
            'action',
            'previous_state',
            'new_state',
            'created_at',
        ]);

        if ($beforeEventId !== null) {
            // Resolve the cursor *within the already-authorized Task*. A
            // cursor from another Task is concealed with the same 404.
            $anchor = $task->events()
                ->whereKey($beforeEventId)
                ->firstOrFail(['id', 'created_at']);

            // A timestamp alone is not unique. Event ID breaks ties, while
            // the keyset boundary avoids offset drift as new events arrive.
            $events->where(function (Builder $query) use ($anchor): void {
                $query->where('created_at', '<', $anchor->created_at)
                    ->orWhere(function (Builder $tied) use ($anchor): void {
                        $tied->where('created_at', '=', $anchor->created_at)
                            ->where('id', '<', $anchor->id);
                    });
            });
        }

        // Fetch exactly one extra row to determine whether another page
        // exists, without an unbounded event load or a COUNT(*) query.
        $rows = $events
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit($perPage + 1)
            ->get();

        $hasMore = $rows->count() > $perPage;
        $page = $rows->take($perPage);

        return [
            'data' => $page
                ->map(static fn (TaskEvent $event): array => [
                    'id' => (int) $event->id,
                    'action' => $event->action,
                    // Historical attribution is the stored identifier only.
                    // No user-profile lookup or fabricated display identity.
                    'actor_user_id' => (int) $event->actor_user_id,
                    'previous_state' => $event->previous_state,
                    'new_state' => $event->new_state,
                    'created_at' => $event->created_at?->toIso8601String(),
                ])
                ->values()
                ->all(),
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
