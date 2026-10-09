<?php

namespace App\Http\Middleware;

use App\Services\AuditLogger;
use App\Services\AuthenticationAssurance;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class RequireMfaAssurance
{
    public function __construct(
        private readonly AuthenticationAssurance $assurance,
        private readonly AuditLogger $audit,
    ) {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->guest(route('login'));
        }

        if ($this->assurance->isSatisfied($request, $user)) {
            return $next($request);
        }

        // Task URLs are JSON-only. A pending MFA Task fetch must not
        // overwrite the user's last intended browser/Inertia destination.
        if ($request->isMethodSafe() && ! $request->routeIs('tasks.*')) {
            $request->session()->put('url.intended', $request->fullUrl());
        }

        $route = $this->assurance->requiredRoute($user);
        $this->audit->record(
            $user,
            'auth.assurance.denied',
            'Privileged application access was denied pending required MFA assurance.',
            'denied',
            'AuthenticationAssurance',
        );

        // Task routes are an HTTP JSON contract, even for an MFA-pending
        // browser session. Other Inertia flows retain their redirects.
        if ($request->routeIs('tasks.*')) {
            return response()->json([
                'message' => 'Multi-factor authentication is required.',
                'code' => 'MFA_REQUIRED',
                'next_url' => route($route, absolute: false),
            ], 403);
        }

        return redirect()->route($route);
    }
}
