<?php

namespace App\Http\Controllers\Tasks;

use App\Domain\Tasks\TaskCoreService;
use App\Http\Controllers\Controller;
use App\Models\Task;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Same-origin, session-authenticated JSON adapter for W02's individual Task core.
 * No Model::create/update/save operation belongs in this HTTP controller.
 */
final class IndividualTaskController extends Controller
{
    public function __construct(private readonly TaskCoreService $tasks)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->allowOnly($request->query(), ['page', 'per_page', 'state']);

        $filters = Validator::make($request->query(), [
            'page' => ['sometimes', 'integer', 'min:1', 'max:10000'],
            'per_page' => ['sometimes', 'integer', 'between:1,50'],
            'state' => ['sometimes', 'string', Rule::in(['open', 'in_progress', 'completed'])],
        ])->validate();

        $query = $this->tasks->visibleIndividualTasks($request->user());
        if (array_key_exists('state', $filters)) {
            $query->where('state', $filters['state']);
        }

        $perPage = (int) ($filters['per_page'] ?? 20);
        $page = (int) ($filters['page'] ?? 1);
        $result = $query->orderByDesc('id')->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $result->getCollection()->map(fn (Task $task): array => $this->present($task))->values(),
            'meta' => [
                'page' => $result->currentPage(),
                'per_page' => $result->perPage(),
                'total' => $result->total(),
                'last_page' => $result->lastPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->allowOnly($request->all(), ['title', 'instructions', 'due_at']);

        $data = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:255'],
            'instructions' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'due_at' => ['sometimes', 'nullable', 'date_format:Y-m-d\TH:i:sP'],
        ])->validate();

        $task = $this->tasks->createIndividual(
            $request->user(),
            $data['title'],
            $data['instructions'] ?? null,
            isset($data['due_at']) ? CarbonImmutable::parse($data['due_at']) : null,
        );

        return response()->json(['data' => $this->present($task)], 201);
    }

    public function show(Request $request, int $task): JsonResponse
    {
        $this->allowOnly($request->query(), []);
        $model = $this->tasks->findVisibleIndividual($request->user(), $task);

        return response()->json(['data' => $this->present($model)]);
    }

    public function start(Request $request, int $task): JsonResponse
    {
        return $this->transition($request, $task, 'start');
    }

    public function complete(Request $request, int $task): JsonResponse
    {
        return $this->transition($request, $task, 'complete');
    }

    private function transition(Request $request, int $task, string $action): JsonResponse
    {
        // Route supplies the action; no client-supplied actor, state or timestamp.
        $this->allowOnly($request->all(), []);
        $model = $this->tasks->transitionIndividual($request->user(), $task, $action);

        return response()->json(['data' => $this->present($model)]);
    }

    /**
     * Explicitly refuse privileged or unknown fields rather than just dropping
     * them from validated input (silent dropping conceals integration mistakes).
     *
     * @param array<string, mixed> $provided
     * @param list<string> $allowed
     */
    private function allowOnly(array $provided, array $allowed): void
    {
        if (array_diff(array_keys($provided), $allowed) !== []) {
            throw ValidationException::withMessages([
                'request' => 'Unsupported Task input fields.',
            ]);
        }
    }

    /** @return array<string, int|string|null> */
    private function present(Task $task): array
    {
        return [
            'id' => (int) $task->id,
            'kind' => 'individual',
            'title' => $task->title,
            'instructions' => $task->instructions,
            'state' => $task->state,
            // Creation-time snapshot; not an authorization grant.
            'owning_department_id' => $task->owning_department_id,
            'due_at' => $task->due_at?->toIso8601String(),
            'completed_at' => $task->completed_at?->toIso8601String(),
            'created_at' => $task->created_at?->toIso8601String(),
            'updated_at' => $task->updated_at?->toIso8601String(),
        ];
    }
}
