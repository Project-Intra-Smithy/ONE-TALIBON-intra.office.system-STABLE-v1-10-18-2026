<?php

namespace App\Services\CommonReferences;

use App\Domain\Tasks\TaskCoreAccess;
use App\Domain\Tasks\TaskCoreService;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\TransactionVisibilityQuery;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Resolves exactly one supported source for the current authenticated actor.
 *
 * This component is not a source of authority. A reference is passive data;
 * the source's own read scope and (for Work Requests) policy decide access.
 * Callers must not persist these point-in-time targets as permission grants.
 */
final class CommonSourceReferenceResolver
{
    public function __construct(
        private readonly TaskCoreAccess $taskAccess,
        private readonly TaskCoreService $tasks,
        private readonly TransactionVisibilityQuery $transactions,
    ) {
    }

    public function resolve(User $claimedActor, string $reference): ReferenceResolution
    {
        // Even unsupported input must not accept a spoofed or stale actor.
        // This is the existing C1 same-session, active staff/office gate.
        $actor = $this->taskAccess->verifiedActor($claimedActor);

        $segments = explode(':', $reference, 3);
        if (count($segments) !== 2) {
            return ReferenceResolution::invalid();
        }

        $kind = SourceKind::tryFrom($segments[0]);
        if ($kind === null) {
            return ReferenceResolution::unsupported();
        }

        // Canonical positive decimal IDs only; no signs, spaces, zero,
        // leading zeros, overflow, path segments or polymorphic class names.
        if (preg_match('/\A[1-9][0-9]*\z/', $segments[1]) !== 1) {
            return ReferenceResolution::invalid();
        }

        $id = filter_var(
            $segments[1],
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1]],
        );

        if ($id === false) {
            return ReferenceResolution::invalid();
        }

        return match ($kind) {
            SourceKind::IndividualTask => $this->individualTask($actor, $id),
            SourceKind::WorkRequest => $this->workRequest($actor, $id),
        };
    }

    private function individualTask(User $actor, int $id): ReferenceResolution
    {
        try {
            // Enforces creator-owned, unassigned individual Task and rechecks
            // authenticated actor; never read by bare Task::find().
            $task = $this->tasks->findVisibleIndividual($actor, $id);
        } catch (ModelNotFoundException) {
            // Unknown and foreign-owned IDs are intentionally indistinguishable.
            return ReferenceResolution::unavailable();
        }

        return ReferenceResolution::available(new SourceTarget(
            kind: SourceKind::IndividualTask,
            id: (int) $task->getKey(),
            title: (string) $task->title,
            url: route('tasks.show', ['task' => $task->getKey()], false),
            destinationType: 'json_resource',
        ));
    }

    private function workRequest(User $actor, int $id): ReferenceResolution
    {
        // Apply the existing transaction query scope BEFORE selecting the row,
        // and the authoritative TransactionPolicy::view BEFORE presentation.
        // The explicit projection prevents unnecessary record hydration.
        $request = $this->transactions->scope($actor)
            ->whereKey($id)
            ->first([
                'id', 'title', 'status',
                'origin_department_id', 'current_department_id',
                'assigned_employee_id',
            ]);

        if (! $request instanceof WorkflowTransaction || ! $actor->can('view', $request)) {
            return ReferenceResolution::unavailable();
        }

        return ReferenceResolution::available(new SourceTarget(
            kind: SourceKind::WorkRequest,
            id: (int) $request->getKey(),
            title: (string) $request->title,
            url: route('transactions.show', ['transaction' => $request->getKey()], false),
            destinationType: 'detail_page',
        ));
    }
}
