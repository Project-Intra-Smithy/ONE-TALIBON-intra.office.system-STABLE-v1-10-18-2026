<?php

namespace App\Domain\Tasks;

use App\Models\Task;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Builder;

/**
 * W02 individual Task policy. Never infer office, executive or delegated
 * privileges from User.role, Employee.position_title or a Drive folder.
 */
final class TaskCoreAccess
{
    public function verifiedActor(User $claimedActor): User
    {
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
        $actor = $this->verifiedActor($claimedActor);

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
