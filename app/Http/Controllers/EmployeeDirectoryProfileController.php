<?php
namespace App\Http\Controllers;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
final class EmployeeDirectoryProfileController extends Controller
{
    public function __invoke(Request $request, Employee $employee): Response
    {
        abort_unless($employee->employment_status === 'active', 404);
        $employee->loadMissing('department:id,code,name,short_name', 'user:id,is_active,last_seen_at');
        return Inertia::render('Employees/DirectoryProfile', [
            'employee' => [
                'id' => $employee->id,
                'number' => $employee->employee_number,
                'name' => $employee->full_name,
                'email' => $employee->work_email,
                'position' => $employee->position_title,
                'office' => $employee->department?->name,
                'presence' => $employee->user?->is_active
                    && $employee->user->last_seen_at?->greaterThan(now()->subMinutes(3))
                        ? 'online' : 'offline',
            ],
            'isSelf' => (int) ($request->user()->employee?->id ?? 0) === (int) $employee->id,
        ]);
    }
}
