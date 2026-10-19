<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

final class EmployeeDirectoryProfileController extends Controller
{
    public function __invoke(Request $request, Employee $employee): Response
    {
        // Inactive directory subjects are deliberately concealed as absent.
        abort_unless($employee->employment_status === 'active', 404);

        // Re-read operational identity so a retained session cannot rely on a
        // stale authenticated-model relation after separation or office closure.
        $actor = Employee::query()
            ->with('department:id,is_active')
            ->where('user_id', $request->user()->id)
            ->first();
        abort_unless(
            $actor?->employment_status === 'active' && $actor->department?->is_active === true,
            403,
        );
        $employee->loadMissing([
            'department:id,code,name,short_name',
            'user' => fn ($query) => $query
                ->select(['id', 'is_active'])
                ->addSelect(['presence_last_seen_at' => DB::table('portal_presence_sessions')
                    ->selectRaw('MAX(last_seen_at)')
                    ->whereColumn('user_id', 'users.id')]),
        ]);

        return Inertia::render('Employees/DirectoryProfile', [
            'employee' => [
                'id' => $employee->id,
                'number' => $employee->employee_number,
                'name' => $employee->full_name,
                'email' => $employee->work_email,
                'position' => $employee->position_title,
                'office' => $employee->department?->name,
                'presence' => $employee->user?->is_active
                    && filled($employee->user->presence_last_seen_at)
                    && CarbonImmutable::parse($employee->user->presence_last_seen_at)->greaterThan(now()->subMinutes(3))
                        ? 'online' : 'offline',
            ],
            'isSelf' => (int) ($request->user()->employee?->id ?? 0) === (int) $employee->id,
        ]);
    }
}
