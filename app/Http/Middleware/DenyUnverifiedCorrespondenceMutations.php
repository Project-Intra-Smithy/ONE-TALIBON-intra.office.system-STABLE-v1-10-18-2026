<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * R17 temporary fail-closed server containment. No frontend or role override.
 * Removal/relaxation requires a separately approved policy and negative-test gate.
 */
final class DenyUnverifiedCorrespondenceMutations
{
    public function handle(Request $request, Closure $next): Response
    {
        abort(403, 'Correspondence changes are withheld pending independent G1/G2 security acceptance.');
    }
}
