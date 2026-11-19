<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\AuditLogger;
use App\Services\AccountSessionEligibility;
use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

final class RequireActiveAccount
{
    public function __construct(private readonly AuditLogger $audit, private readonly AccountSessionEligibility $eligibility)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        $current = $this->eligibility->current($user);
        if ($current && ! Auth::guard('web')->viaRemember()
            && $this->eligibility->matchesEpoch($request, $current)) {
            // Downstream authorization must not see cached role or account data.
            Auth::guard('web')->setUser($current);

            return $next($request);
        }

        $this->audit->record(
            $user,
            'auth.account.deactivated_forced_logout',
            'Authenticated session was terminated because the account is inactive.',
            'denied',
            User::class,
            $user->id,
        );

        $this->logout($request);

        // The global Task JSON boundary already normalized Accept, and
        // a deactivated session must not turn into an HTML login redirect.
        if ($request->routeIs('tasks.*')) {
            return response()->json([
                'message' => 'The account is inactive. Sign in again or contact an administrator.',
                'code' => 'ACCOUNT_INACTIVE',
            ], 401);
        }

        return $this->inactiveResponse();
    }

    private function logout(Request $request): void
    {
        Auth::guard('web')->logoutCurrentDevice();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }

    private function inactiveResponse(): RedirectResponse
    {
        return redirect()->route('login')->withErrors([
            'login' => 'This session is no longer active. Please sign in again or contact an administrator.',
        ]);
    }
}
