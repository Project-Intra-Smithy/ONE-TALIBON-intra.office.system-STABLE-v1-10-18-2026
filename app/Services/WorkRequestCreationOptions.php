<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use App\Models\WorkflowTransaction;
use Illuminate\Support\Facades\Gate;

final class WorkRequestCreationOptions
{
    public function for(User $actor): array
    {
        Gate::forUser($actor)->authorize('create', WorkflowTransaction::class);
        $departmentId = $actor->employee?->department_id;
        $departments = Department::query()->activeRoutable()
            ->when($departmentId, fn ($query) => $query->where('id', '!=', $departmentId))
            ->orderBy('branch')->orderBy('sort_order')->orderBy('name')
            ->get(['id', 'code', 'name', 'short_name', 'branch', 'office_type']);

        return [
            'departments' => $departments,
            'assignableEmployees' => Employee::query()
                ->whereIn('department_id', $departments->pluck('id'))
                ->where('employment_status', 'active')
                ->orderBy('department_id')->orderBy('full_name')
                ->get(['id', 'employee_number', 'full_name', 'department_id', 'position_title']),
            'requestCategories' => config('work_requests.categories', []),
            'actionOptions' => config('work_requests.actions', []),
        ];
    }
}
