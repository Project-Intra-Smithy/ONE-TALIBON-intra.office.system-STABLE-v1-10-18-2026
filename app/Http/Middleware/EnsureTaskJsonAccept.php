<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * W03/C1 Task JSON boundary, installed before the web middleware stack.
 *
 * This does not exempt the routes from session auth, MFA or CSRF. It makes
 * framework-generated 401/403/404/419/422 responses negotiate JSON before
 * the router or ValidateCsrfToken can reject the request.
 */
final class EnsureTaskJsonAccept
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->is('tasks', 'tasks/*')) {
            // The Task URL namespace is JSON-only; HTML/Inertia pages live
            // elsewhere. Ignore a missing/wrong Accept header in this lane.
            $request->headers->set('Accept', 'application/json');
        }

        return $next($request);
    }
}
