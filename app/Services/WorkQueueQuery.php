<?php

namespace App\Services;

use App\Models\Department;
use App\Models\User;
use App\Models\WorkflowTransaction;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

final class WorkQueueQuery
{
    public function __construct(
        private readonly TransactionVisibilityQuery $visibility,
        private readonly WorkQueueExperienceResolver $experiences,
        private readonly WorkQueueItemPresenter $presenter,
        private readonly DashboardOfficeQuery $officeDashboard,
    ) {}

    /** @param array<string, mixed> $filters */
    public function workspace(User $actor, array $filters): array
    {
        $actor->loadMissing('employee.department');
        $experience = $this->experiences->resolve($actor);
        $view = (string) ($filters['view'] ?? 'overview');
        abort_unless(in_array($view, $experience['allowedViews'], true), 403);

        $authorized = $this->visibility->scope($actor);
        $filtered = $this->applyCommonFilters(clone $authorized, $filters);
        $personal = $this->personalScope(clone $authorized, $actor);
        $municipalScope = in_array($experience['profile'], ['executive_oversight', 'system_administration'], true);
        $optionsBase = $experience['profile'] === 'department_head' || $municipalScope
            ? $authorized
            : $personal;

        return [
            'records' => in_array($view, ['overview', 'staff_workload'], true)
                ? $this->emptyRecords()
                : $this->records($filtered, $actor, $view, $experience['profile']),
            'filters' => [
                'view' => $view,
                'search' => (string) ($filters['search'] ?? ''),
                'status' => (string) ($filters['status'] ?? ''),
                'priority' => (string) ($filters['priority'] ?? ''),
                'office_id' => isset($filters['office_id']) ? (int) $filters['office_id'] : null,
            ],
            'scopeGroups' => $this->scopeGroups(
                $filtered,
                $actor,
                $experience['scopeGroups'],
                $experience['profile'],
            ),
            'filterOptions' => [
                'statuses' => $this->statusOptions($optionsBase),
                'priorities' => ['normal', 'high', 'urgent'],
                'offices' => $this->officeOptions($optionsBase, $actor),
            ],
            'experience' => [
                'profile' => $experience['profile'],
                'department' => $experience['department'],
                'hasOfficeScope' => $experience['profile'] === 'department_head',
                'hasMunicipalScope' => $municipalScope,
            ],
            'overview' => $view === 'overview'
                ? $this->overview($authorized, $actor, $experience['profile'])
                : ['previews' => []],
            'staffWorkload' => $view === 'staff_workload'
                ? $this->officeDashboard->staffWorkloadFor($actor, clone $filtered)
                : [],
        ];
    }

    /** @param array<string, mixed> $filters */
    private function applyCommonFilters(Builder $query, array $filters): Builder
    {
        $search = Str::lower(trim((string) ($filters['search'] ?? '')));
        if ($search !== '') {
            $like = '%'.$search.'%';
            $query->where(function (Builder $match) use ($like): void {
                $match->whereRaw('LOWER(reference_no) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(title) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(transaction_type) LIKE ?', [$like])
                    ->orWhereRaw("LOWER(COALESCE(description, '')) LIKE ?", [$like])
                    ->orWhereHas('originDepartment', fn (Builder $office) => $office->whereRaw('LOWER(name) LIKE ?', [$like]))
                    ->orWhereHas('currentDepartment', fn (Builder $office) => $office->whereRaw('LOWER(name) LIKE ?', [$like]))
                    ->orWhereHas('assignedEmployee', fn (Builder $employee) => $employee->whereRaw('LOWER(full_name) LIKE ?', [$like]));
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', (string) $filters['status']);
        }

        if (! empty($filters['priority'])) {
            $query->where('priority', (string) $filters['priority']);
        }

        if (! empty($filters['office_id'])) {
            $query->where('current_department_id', (int) $filters['office_id']);
        }

        return $query;
    }

    private function personalScope(Builder $query, User $actor): Builder
    {
        $employeeId = $actor->employee?->id;

        return $query->where(function (Builder $personal) use ($actor, $employeeId): void {
            $personal->where('created_by_user_id', $actor->id)
                ->when($employeeId, fn (Builder $item) => $item->orWhere('assigned_employee_id', $employeeId));
        });
    }

    /**
     * @param  array<int, array<string, mixed>>  $groups
     * @return array<int, array<string, mixed>>
     */
    private function scopeGroups(
        Builder $filtered,
        User $actor,
        array $groups,
        string $profile,
    ): array {
        $counts = $this->scopeCounts($filtered, $actor, $profile);

        return collect($groups)->map(function (array $group) use ($counts): array {
            $group['views'] = collect($group['views'])->map(function (array $view) use ($counts): array {
                $view['count'] = (int) ($counts[$view['key']] ?? 0);

                return $view;
            })->all();

            return $group;
        })->all();
    }

    /** @return array<string, int> */
    private function scopeCounts(Builder $filtered, User $actor, string $profile): array
    {
        $terminal = $this->terminalStatuses();
        $terminalPlaceholders = implode(', ', array_fill(0, count($terminal), '?'));
        $personal = '(created_by_user_id = ? OR assigned_employee_id = ?)';
        $active = "status NOT IN ({$terminalPlaceholders})";
        $employeeId = (int) ($actor->employee?->id ?? 0);
        $departmentId = (int) ($actor->employee?->department_id ?? 0);
        $actorId = (int) $actor->id;
        $now = now();
        $dueSoonEnd = $now->copy()->addDay();
        $recentlyUpdatedStart = $now->copy()->subDays(7);
        $recentlyCompletedStart = $now->copy()->subDays(30);
        $municipalScope = in_array($profile, ['executive_oversight', 'system_administration'], true);

        $definitions = [
            'all' => $municipalScope
                ? [$active, $terminal]
                : ["{$personal} AND {$active}", [$actorId, $employeeId, ...$terminal]],
            'needs_my_action' => $profile === 'executive_oversight'
                ? ["{$active} AND status = ?", [...$terminal, 'for_approval']]
                : ["{$personal} AND {$active} AND assigned_employee_id = ?", [$actorId, $employeeId, ...$terminal, $employeeId]],
            'assigned_to_me' => [
                "{$personal} AND {$active} AND assigned_employee_id = ?",
                [$actorId, $employeeId, ...$terminal, $employeeId],
            ],
            'my_requests' => [
                "{$active} AND created_by_user_id = ?",
                [...$terminal, $actorId],
            ],
            'due_soon' => $municipalScope
                ? ["{$active} AND due_at BETWEEN ? AND ?", [...$terminal, $now, $dueSoonEnd]]
                : ["{$personal} AND {$active} AND assigned_employee_id = ? AND due_at BETWEEN ? AND ?", [$actorId, $employeeId, ...$terminal, $employeeId, $now, $dueSoonEnd]],
            'overdue' => $municipalScope
                ? ["{$active} AND due_at IS NOT NULL AND due_at < ?", [...$terminal, $now]]
                : ["{$personal} AND {$active} AND assigned_employee_id = ? AND due_at IS NOT NULL AND due_at < ?", [$actorId, $employeeId, ...$terminal, $employeeId, $now]],
            'recently_updated' => $municipalScope
                ? ["{$active} AND updated_at >= ?", [...$terminal, $recentlyUpdatedStart]]
                : ["{$personal} AND {$active} AND updated_at >= ?", [$actorId, $employeeId, ...$terminal, $recentlyUpdatedStart]],
            'waiting_on_others' => [
                "{$active} AND created_by_user_id = ? AND origin_department_id = ? AND current_department_id != ?",
                [...$terminal, $actorId, $departmentId, $departmentId],
            ],
            'recently_completed' => $municipalScope
                ? ["status IN ({$terminalPlaceholders}) AND completed_at IS NOT NULL AND completed_at >= ?", [...$terminal, $recentlyCompletedStart]]
                : ["{$personal} AND status IN ({$terminalPlaceholders}) AND completed_at IS NOT NULL AND completed_at >= ?", [$actorId, $employeeId, ...$terminal, $recentlyCompletedStart]],
            'office_queue' => [
                "{$active} AND current_department_id = ?",
                [...$terminal, $departmentId],
            ],
            'staff_workload' => [
                "{$active} AND current_department_id = ?",
                [...$terminal, $departmentId],
            ],
            'unassigned' => [
                "{$active} AND current_department_id = ? AND assigned_employee_id IS NULL",
                [...$terminal, $departmentId],
            ],
            'escalations' => [
                "{$active} AND current_department_id = ? AND (priority = ? OR (due_at IS NOT NULL AND due_at < ?))",
                [...$terminal, $departmentId, 'urgent', $now],
            ],
        ];

        $query = clone $filtered;
        foreach ($definitions as $key => [$condition, $bindings]) {
            $query->selectRaw(
                "SUM(CASE WHEN {$condition} THEN 1 ELSE 0 END) AS count_{$key}",
                $bindings,
            );
        }

        $row = $query->first();

        return collect(array_keys($definitions))
            ->mapWithKeys(fn (string $key): array => [
                $key => (int) ($row?->{"count_{$key}"} ?? 0),
            ])
            ->all();
    }

    private function records(
        Builder $filtered,
        User $actor,
        string $view,
        string $profile,
    ): LengthAwarePaginator {
        $query = $this->recordQuery(
            $this->applyView(clone $filtered, $actor, $view, $profile),
        );

        $this->orderForQueue($query, $view);

        return $query->paginate(25)
            ->withQueryString()
            ->through(fn (WorkflowTransaction $transaction): array => $this->presenter->present($transaction, $actor));
    }

    /** @return array{previews:array<string,array<int,array<string,mixed>>>} */
    private function overview(Builder $authorized, User $actor, string $profile): array
    {
        $views = match ($profile) {
            'executive_oversight' => ['needs_my_action', 'overdue', 'due_soon', 'recently_updated'],
            'system_administration' => ['all', 'overdue', 'recently_updated', 'recently_completed'],
            'department_head' => ['needs_my_action', 'office_queue', 'my_requests', 'waiting_on_others'],
            default => ['needs_my_action', 'assigned_to_me', 'my_requests', 'waiting_on_others'],
        };

        $previews = [];
        foreach ($views as $view) {
            $query = $this->recordQuery(
                $this->applyView(clone $authorized, $actor, $view, $profile),
            );
            $this->orderForQueue($query, $view);

            $previews[$view] = $query
                ->limit(4)
                ->get()
                ->map(fn (WorkflowTransaction $transaction): array => $this->presenter->present($transaction, $actor))
                ->all();
        }

        return ['previews' => $previews];
    }

    private function recordQuery(Builder $query): Builder
    {
        return $query
            ->select([
                'id', 'reference_no', 'transaction_type', 'title', 'priority',
                'origin_department_id', 'current_department_id',
                'assigned_employee_id', 'status', 'received_at', 'due_at', 'completed_at',
                'updated_at',
            ])
            ->with([
                'originDepartment:id,code,name,short_name',
                'currentDepartment:id,code,name,short_name',
                'assignedEmployee:id,employee_number,full_name,department_id,position_title',
            ]);
    }

    private function applyView(
        Builder $query,
        User $actor,
        string $view,
        string $profile,
    ): Builder {
        $terminal = $this->terminalStatuses();
        $departmentId = $actor->employee?->department_id;
        $employeeId = $actor->employee?->id;
        $municipalScope = in_array($profile, ['executive_oversight', 'system_administration'], true);

        if (! $municipalScope && in_array($view, [
            'all', 'needs_my_action', 'assigned_to_me', 'due_soon', 'overdue',
            'recently_updated', 'waiting_on_others', 'recently_completed',
        ], true)) {
            $query = $this->personalScope($query, $actor);
        }

        return match ($view) {
            'overview' => $query->whereRaw('1 = 0'),
            'all' => $this->active($query, $terminal),
            'needs_my_action' => $profile === 'executive_oversight'
                ? $this->active($query, $terminal)->where('status', 'for_approval')
                : $this->active($query, $terminal)->where('assigned_employee_id', $employeeId),
            'assigned_to_me' => $this->active($query, $terminal)
                ->where('assigned_employee_id', $employeeId),
            'my_requests' => $this->active($query, $terminal)
                ->where('created_by_user_id', $actor->id),
            'due_soon' => $this->active($query, $terminal)
                ->when(! $municipalScope, fn (Builder $scope) => $scope->where('assigned_employee_id', $employeeId))
                ->whereBetween('due_at', [now(), now()->addDay()]),
            'overdue' => $this->active($query, $terminal)
                ->when(! $municipalScope, fn (Builder $scope) => $scope->where('assigned_employee_id', $employeeId))
                ->whereNotNull('due_at')
                ->where('due_at', '<', now()),
            'recently_updated' => $this->active($query, $terminal)
                ->where('updated_at', '>=', now()->subDays(7)),
            'waiting_on_others' => $this->active($query, $terminal)
                ->where('created_by_user_id', $actor->id)
                ->where('origin_department_id', $departmentId)
                ->where('current_department_id', '!=', $departmentId),
            'recently_completed' => $this->recentlyCompleted($query, $terminal),
            'office_queue' => $this->active($query, $terminal)
                ->where('current_department_id', $departmentId),
            'staff_workload' => $this->active($query, $terminal)
                ->where('current_department_id', $departmentId),
            'unassigned' => $this->active($query, $terminal)
                ->where('current_department_id', $departmentId)
                ->whereNull('assigned_employee_id'),
            'escalations' => $this->active($query, $terminal)
                ->where('current_department_id', $departmentId)
                ->where(function (Builder $attention): void {
                    $attention->where('priority', 'urgent')
                        ->orWhere(fn (Builder $overdue) => $overdue
                            ->whereNotNull('due_at')
                            ->where('due_at', '<', now()));
                }),
            default => $query->whereRaw('1 = 0'),
        };
    }

    /** @param array<int, string> $terminal */
    private function active(Builder $query, array $terminal): Builder
    {
        return $query->whereNotIn('status', $terminal);
    }

    /** @param array<int, string> $terminal */
    private function recentlyCompleted(Builder $query, array $terminal): Builder
    {
        return $query->whereIn('status', $terminal)
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', now()->subDays(30));
    }

    private function orderForQueue(Builder $query, string $view): void
    {
        if ($view === 'recently_completed') {
            $query->orderByDesc('completed_at')->orderByDesc('id');

            return;
        }

        if ($view === 'recently_updated') {
            $query->orderByDesc('updated_at')->orderByDesc('id');

            return;
        }

        $query->orderByRaw('CASE WHEN due_at IS NOT NULL AND due_at < ? THEN 0 ELSE 1 END', [now()])
            ->orderByRaw("CASE WHEN priority = 'urgent' THEN 0 WHEN priority = 'high' THEN 1 ELSE 2 END")
            ->orderByRaw('CASE WHEN due_at IS NULL THEN 1 ELSE 0 END')
            ->orderBy('due_at')
            ->orderByDesc('updated_at');
    }

    private function emptyRecords(): LengthAwarePaginator
    {
        return new LengthAwarePaginator([], 0, 25, 1, [
            'path' => request()->url(),
            'query' => request()->query(),
        ]);
    }

    /** @return array<int, string> */
    private function statusOptions(Builder $base): array
    {
        return (clone $base)->whereNotNull('status')
            ->distinct()
            ->orderBy('status')
            ->pluck('status')
            ->values()
            ->all();
    }

    /** @return array<int, array{id:int,code:string,name:string,shortName:?string}> */
    private function officeOptions(Builder $base, User $actor): array
    {
        $ids = (clone $base)->distinct()->pluck('current_department_id')->filter()->all();
        if ($actor->employee?->department_id) {
            $ids[] = $actor->employee->department_id;
        }

        return Department::query()
            ->where('is_active', true)
            ->whereIn('id', array_values(array_unique($ids)))
            ->orderBy('branch')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'short_name'])
            ->map(fn (Department $department): array => [
                'id' => (int) $department->id,
                'code' => $department->code,
                'name' => $department->name,
                'shortName' => $department->short_name,
            ])
            ->all();
    }

    /** @return array<int, string> */
    private function terminalStatuses(): array
    {
        return array_values(config('workflow.default.terminal_statuses', [
            'approved', 'disapproved', 'closed',
        ]));
    }
}
