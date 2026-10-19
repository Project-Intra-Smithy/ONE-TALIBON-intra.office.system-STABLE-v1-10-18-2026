<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * R17 temporary fail-closed server containment. No frontend or role override.
 * Removal/relaxation requires a separately approved policy and negative-test gate.
 */
final class DenyUnapprovedMessaging
{
    public function handle(Request $request, Closure $next): Response
    {
        abort(403, 'Messaging is unavailable pending municipal audience policy and security acceptance.');
    }
}
