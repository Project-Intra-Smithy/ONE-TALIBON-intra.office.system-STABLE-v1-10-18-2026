<?php

namespace App\Domain\Tasks;

use App\Models\Task;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

/**
 * W02 individual Task policy. Never infer office, executive or delegated
 * privileges from User.role, Employee.position_title or a Drive folder.
 */
final class TaskCoreAccess
{
    public function verifiedActor(User $claimedActor): User
    {
        // No caller may choose another acting user; W03 must use the same
        // authenticated session identity. Never accept actor IDs from input.
        $authenticated = Auth::user();
        if (
            ! $authenticated instanceof User ||
            $claimedActor->getKey() === null ||
            (int) $authenticated->getAuthIdentifier() !== (int) $claimedActor->getKey()
        ) {
            throw new AuthorizationException('Task access denied.');
        }

        // Re-query: stale in-memory user/employee data cannot authorize a write.
        $actor = User::query()
            ->with('employee.department')
            ->whereKey($claimedActor->getKey())
            ->where('is_active', true)
            ->first();

        if (
            ! $actor ||
            ! $actor->employee ||
            $actor->employee->employment_status !== 'active' ||
            ! $actor->employee->department ||
            ! $actor->employee->department->is_active
        ) {
            throw new AuthorizationException('Task access denied.');
        }

        return $actor;
    }

    /**
     * @return Builder<Task>
     */
    public function visibleIndividualTasks(User $claimedActor): Builder
    {
        return $this->individualTasksForActor($this->verifiedActor($claimedActor));
    }

    /**
     * Verify once and return both the fresh actor and its owner-only Task scope.
     * Common Work can reuse this proof for its UNION within this operation;
     * ordinary Task entrypoints keep independent live verification.
     *
     * @return array{User, Builder<Task>}
     */
    public function verifiedIndividualTasks(User $claimedActor): array
    {
        $actor = $this->verifiedActor($claimedActor);

        return [$actor, $this->individualTasksForActor($actor)];
    }

    /** @return Builder<Task> */
    private function individualTasksForActor(User $actor): Builder
    {
        return Task::query()
            ->where('task_kind', 'individual')
            ->whereNull('assigned_to_user_id')
            ->where('created_by_user_id', $actor->id);
    }

    public function assertMayAct(User $actor, Task $task): void
    {
        if (
            $task->task_kind !== 'individual' ||
            $task->assigned_to_user_id !== null ||
            (int) $task->created_by_user_id !== (int) $actor->id
        ) {
            throw new AuthorizationException('Task access denied.');
        }
    }
}
