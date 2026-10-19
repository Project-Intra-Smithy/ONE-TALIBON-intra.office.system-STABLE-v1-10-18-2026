<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * R17 restricted-UAT fail-closed containment. Missing/invalid/true configuration
 * denies all mutation calls. Literal false is an explicit non-UAT integration
 * opt-in that delegates to existing application authorization (not a G1/G2 fix).
 * No web-request, role, or user override. Never enable false in restricted UAT.
 */
final class DenyUnverifiedCorrespondenceMutations
{
    public function handle(Request $request, Closure $next): Response
    {
        if (config('messaging_release.restricted_uat', true) !== false) {
            abort(403, 'Correspondence changes are withheld pending independent G1/G2 security acceptance.');
        }

        return $next($request);
    }
}
