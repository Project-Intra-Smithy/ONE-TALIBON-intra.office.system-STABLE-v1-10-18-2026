<?php

namespace App\Services\CommonReferences;

use App\Domain\Tasks\TaskCoreAccess;
use App\Domain\Tasks\TaskCoreService;
use App\Models\Task;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\TransactionVisibilityQuery;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use InvalidArgumentException;

/**
 * Resolves supported source references for the current authenticated actor.
 *
 * Source references are passive data, not grants. Both single and bulk reads
 * enforce the original source's visibility; destinations must reauthorize.
 */
final class CommonSourceReferenceResolver
{
    private const MAX_BULK_REFERENCES = 50;

    public function __construct(
        private readonly TaskCoreAccess $taskAccess,
        private readonly TaskCoreService $tasks,
        private readonly TransactionVisibilityQuery $transactions,
    ) {
    }

    public function resolve(User $claimedActor, string $reference): ReferenceResolution
    {
        // Verify the session even for invalid and unsupported references.
        $actor = $this->taskAccess->verifiedActor($claimedActor);
        $parsed = $this->parseReference($reference);

        if ($parsed instanceof ReferenceResolution) {
            return $parsed;
        }

        return match ($parsed['kind']) {
            SourceKind::IndividualTask => $this->individualTask($actor, $parsed['id']),
            SourceKind::WorkRequest => $this->workRequest($actor, $parsed['id']),
        };
    }

    /**
     * Resolve up to 50 references with a bounded number of source queries.
     * One result per input entry is returned in the original input order.
     * Repeated references share a lookup, not a permission grant or cache.
     *
     * @param array<int, string> $references
     * @return array<int, ReferenceResolution>
     */
    public function resolveMany(User $claimedActor, array $references): array
    {
        $actor = $this->taskAccess->verifiedActor($claimedActor);

        if (count($references) > self::MAX_BULK_REFERENCES) {
            throw new InvalidArgumentException('A source-reference batch may contain at most 50 entries.');
        }

        $idsByKind = [
            SourceKind::IndividualTask->value => [],
            SourceKind::WorkRequest->value => [],
        ];
        $ordered = [];

        foreach ($references as $reference) {
            if (! is_string($reference)) {
                throw new InvalidArgumentException('Every source reference must be a string.');
            }

            $parsed = $this->parseReference($reference);

            if ($parsed instanceof ReferenceResolution) {
                $ordered[] = $parsed;

                continue;
            }

            $kind = $parsed['kind']->value;
            $id = $parsed['id'];
            $key = $kind.':'.$id;

            // ID-keyed sets deduplicate within each source namespace.
            $idsByKind[$kind][$id] = $id;
            $ordered[] = $key;
        }

        /** @var array<string, ReferenceResolution> $resolved */
        $resolved = [];

        if ($idsByKind[SourceKind::IndividualTask->value] !== []) {
            // Existing C1 scope re-verifies the actor and requires an
            // unassigned individual Task created by this user.
            $tasks = $this->tasks->visibleIndividualTasks($actor)
                ->whereKey(array_values($idsByKind[SourceKind::IndividualTask->value]))
                ->get(['id', 'title']);

            foreach ($tasks as $task) {
                $key = SourceKind::IndividualTask->value.':'.$task->getKey();
                $resolved[$key] = $this->resolvedTask($task);
            }
        }

        if ($idsByKind[SourceKind::WorkRequest->value] !== []) {
            // SQL visibility comes first. The policy context needs the
            // current office code, so eager-load it once for the batch.
            $requests = $this->transactions->scope($actor)
                ->whereKey(array_values($idsByKind[SourceKind::WorkRequest->value]))
                ->with('currentDepartment:id,code')
                ->get([
                    'id', 'title', 'status',
                    'origin_department_id', 'current_department_id',
                    'assigned_employee_id',
                ]);

            foreach ($requests as $request) {
                // Query scope alone is not a substitute for view policy.
                if (! $actor->can('view', $request)) {
                    continue;
                }

                $key = SourceKind::WorkRequest->value.':'.$request->getKey();
                $resolved[$key] = $this->resolvedWorkRequest($request);
            }
        }

        $results = [];

        foreach ($ordered as $entry) {
            $results[] = $entry instanceof ReferenceResolution
                ? $entry
                : ($resolved[$entry] ?? ReferenceResolution::unavailable());
        }

        return $results;
    }

    /**
     * Single/bulk parser with identical canonical ID and namespace semantics.
     *
     * @return array{kind: SourceKind, id: int}|ReferenceResolution
     */
    private function parseReference(string $reference): array|ReferenceResolution
    {
        $segments = explode(':', $reference, 3);
        if (count($segments) !== 2) {
            return ReferenceResolution::invalid();
        }

        $kind = SourceKind::tryFrom($segments[0]);
        if ($kind === null) {
            return ReferenceResolution::unsupported();
        }

        // Reject signs, whitespace, leading zeros, zero and overflow.
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

        return ['kind' => $kind, 'id' => $id];
    }

    private function individualTask(User $actor, int $id): ReferenceResolution
    {
        try {
            $task = $this->tasks->findVisibleIndividual($actor, $id);
        } catch (ModelNotFoundException) {
            return ReferenceResolution::unavailable();
        }

        return $this->resolvedTask($task);
    }

    private function workRequest(User $actor, int $id): ReferenceResolution
    {
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

        return $this->resolvedWorkRequest($request);
    }

    private function resolvedTask(Task $task): ReferenceResolution
    {
        return ReferenceResolution::available(new SourceTarget(
            kind: SourceKind::IndividualTask,
            id: (int) $task->getKey(),
            title: (string) $task->title,
            url: route('tasks.show', ['task' => $task->getKey()], false),
            destinationType: 'json_resource',
        ));
    }

    private function resolvedWorkRequest(WorkflowTransaction $request): ReferenceResolution
    {
        return ReferenceResolution::available(new SourceTarget(
            kind: SourceKind::WorkRequest,
            id: (int) $request->getKey(),
            title: (string) $request->title,
            url: route('transactions.show', ['transaction' => $request->getKey()], false),
            destinationType: 'detail_page',
        ));
    }
}
