<?php
namespace App\Http\Controllers;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
final class EmployeePresenceController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user()->loadMissing('employee.department');
        abort_unless($user->is_active
            && $user->employee?->employment_status === 'active'
            && $user->employee?->department?->is_active === true, 403);

        // Actor identity is server-derived; heartbeat never updates attendance.
        DB::table('users')->where('id', $user->id)->update(['last_seen_at' => now()]);
        return response()->json(['status' => 'acknowledged']);
    }
}
