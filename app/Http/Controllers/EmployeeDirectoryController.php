<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Employee;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeDirectoryController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $search = trim((string) $request->query('q', ''));
        $departmentCode = trim((string) $request->query('department', ''));

        $employees = Employee::query()
            ->select(['id', 'employee_number', 'full_name', 'work_email', 'user_id', 'department_id', 'position_title', 'employment_status'])
            ->with([
                'department:id,code,name,short_name',
                'user' => fn ($query) => $query
                    ->select(['id', 'is_active'])
                    ->addSelect(['presence_last_seen_at' => DB::table('portal_presence_sessions')
                        ->selectRaw('MAX(last_seen_at)')
                        ->whereColumn('user_id', 'users.id')]),
            ])
            ->where('employment_status', 'active')
            ->when($search !== '', function (Builder $query) use ($search): void {
                $needle = '%'.mb_strtolower($search).'%';
                $query->where(function (Builder $nested) use ($needle): void {
                    $nested->whereRaw('LOWER(employee_number) LIKE ?', [$needle])
                        ->orWhereRaw('LOWER(full_name) LIKE ?', [$needle])
                        ->orWhereRaw('LOWER(work_email) LIKE ?', [$needle])
                        ->orWhereRaw('LOWER(position_title) LIKE ?', [$needle]);
                });
            })
            ->when($departmentCode !== '', function (Builder $query) use ($departmentCode): void {
                $query->whereHas('department', fn (Builder $department) => $department->where('code', $departmentCode));
            })
            ->orderBy('full_name')
            ->paginate(40)
            ->withQueryString()
            ->through(fn (Employee $employee): array => [
                'id' => $employee->id,
                'employee_number' => $employee->employee_number,
                'full_name' => $employee->full_name,
                'work_email' => $employee->work_email,
                'position_title' => $employee->position_title,
                'employment_status' => $employee->employment_status,
                'department' => $employee->department?->only(['code', 'name', 'short_name']),
                'presence' => $employee->user?->is_active
                    && filled($employee->user->presence_last_seen_at)
                    && CarbonImmutable::parse($employee->user->presence_last_seen_at)->greaterThan(now()->subMinutes(3))
                        ? 'online' : 'offline',
            ]);

        $activeEmployeeCount = Employee::query()->where('employment_status', 'active')->count();
        $portalAccountCount = Employee::query()
            ->where('employment_status', 'active')
            ->whereNotNull('user_id')
            ->count();

        return Inertia::render('Employees/Index', [
            'employees' => $employees,
            'filters' => [
                'q' => $search,
                'department' => $departmentCode,
            ],
            'departments' => Department::query()
                ->activeRoutable()
                ->orderBy('name')
                ->get(['code', 'name', 'short_name']),
            'summary' => [
                'employees' => $activeEmployeeCount,
                'portalAccounts' => $portalAccountCount,
                'offices' => Department::query()->activeRoutable()->count(),
            ],
        ]);
    }
}
