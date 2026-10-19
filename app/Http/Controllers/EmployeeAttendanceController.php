<?php
namespace App\Http\Controllers;
use App\Models\AttendanceLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
final class EmployeeAttendanceController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user()->loadMissing('employee.department');
        $employee = $user->employee;
        abort_unless($employee?->employment_status === 'active'
            && $employee?->department?->is_active === true, 403);
        $events = AttendanceLog::query()->where('employee_id', $employee->id)
            ->latest('occurred_at')->limit(60)
            ->get(['id', 'occurred_at', 'event_type', 'source']);
        return Inertia::render('Hris/Attendance', [
            'employee' => [
                'name' => $employee->full_name,
                'number' => $employee->employee_number,
                'office' => $employee->department?->name,
            ],
            'events' => $events,
        ]);
    }
}
