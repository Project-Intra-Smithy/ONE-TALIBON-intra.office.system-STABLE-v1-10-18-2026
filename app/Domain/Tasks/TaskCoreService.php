<?php

namespace App\Domain\Tasks;

use App\Models\Task;
use App\Models\TaskEvent;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;

/**
 * Service-only W02 core. W03 must supply the authenticated actor rather than
 * accepting a user ID from HTTP. No Task routes or official issuance live here.
 */
final class TaskCoreService
{
    public function __construct(private readonly TaskCoreAccess $access)
    {
    }

    public function visibleIndividualTasks(User $actor): Builder
    {
        return $this->access->visibleIndividualTasks($actor);
    }

    public function findVisibleIndividual(User $actor, int $taskId): Task
    {
        return $this->visibleIndividualTasks($actor)->findOrFail($taskId);
    }

    public function createIndividual(
        User $claimedActor,
        string $title,
        ?string $instructions = null,
        ?CarbonInterface $dueAt = null,
    ): Task {
        $title = trim($title);

        if ($title === '' || mb_strlen($title) > 255) {
            throw ValidationException::withMessages(['title' => 'Task title must contain 1 to 255 characters.']);
        }

        return DB::transaction(function () use ($claimedActor, $title, $instructions, $dueAt): Task {
            $actor = $this->access->verifiedActor($claimedActor);
            $time = now();

            // No official assignment, delegated issuer or inferred manager power.
            // forceFill is private to this validated service: W01 mass assignment stays unchanged.
            $task = new Task();
            $task->forceFill([
                'title' => $title,
                'instructions' => $instructions,
                'state' => TaskLifecycleState::Open->value,
                'task_kind' => 'individual',
                'owning_department_id' => $actor->employee->department_id,
                'created_by_user_id' => $actor->id,
                'assigned_to_user_id' => null,
                'due_at' => $dueAt,
                'completed_at' => null,
            ]);
            $task->save();

            TaskEvent::query()->create([
                'task_id' => $task->id,
                'actor_user_id' => $actor->id,
                'action' => 'created',
                'previous_state' => null,
                'new_state' => TaskLifecycleState::Open->value,
                'created_at' => $time,
            ]);

            return $task->fresh();
        });
    }

    public function transitionIndividual(User $claimedActor, int $taskId, string $action): Task
    {
        return DB::transaction(function () use ($claimedActor, $taskId, $action): Task {
            // Fetch-and-lock first, then recheck authorization against live actor/Task data.
            $task = Task::query()->lockForUpdate()->findOrFail($taskId);
            $actor = $this->access->verifiedActor($claimedActor);
            $this->access->assertMayAct($actor, $task);

            $previous = TaskLifecycleState::tryFrom($task->state);
            $next = $previous?->nextFor($action);

            if ($next === null) {
                throw ValidationException::withMessages([
                    'state' => 'This Task action or state transition is not available.',
                ]);
            }

            $time = now();
            $task->forceFill([
                'state' => $next->value,
                'completed_at' => $next === TaskLifecycleState::Completed ? $time : null,
            ])->save();

            TaskEvent::query()->create([
                'task_id' => $task->id,
                'actor_user_id' => $actor->id,
                'action' => $action,
                'previous_state' => $previous->value,
                'new_state' => $next->value,
                'created_at' => $time,
            ]);

            return $task->fresh();
        });
    }
}
