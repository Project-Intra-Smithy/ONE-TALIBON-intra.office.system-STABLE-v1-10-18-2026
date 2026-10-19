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

        // Actor identity and browser session are server-derived; heartbeat never updates attendance.
        $sessionHash = (string) $request->session()->get('presence_session_hash', '');
        if ($sessionHash === '') {
            $sessionHash = hash('sha256', $request->session()->getId());
            $request->session()->put('presence_session_hash', $sessionHash);
        }

        $now = now();
        DB::table('portal_presence_sessions')->upsert([
            [
                'user_id' => $user->id,
                'session_hash' => $sessionHash,
                'last_seen_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ], ['user_id', 'session_hash'], ['last_seen_at', 'updated_at']);
        DB::table('users')->where('id', $user->id)->update(['last_seen_at' => $now]);

        return response()->json(['status' => 'acknowledged']);
    }
}
