<?php

namespace App\Http\Middleware;

use App\Domain\Integration\IntegrationErrorCode;
use App\Services\IntegrationErrorResponse;
use Closure;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class ThrottleIntegrationIngress
{
    public function handle(Request $request, Closure $next): Response
    {
        $key = 'integration:ingress:'.hash('sha256', (string) $request->ip());
        $limit = max(1, (int) config('app.integration_ingress_per_minute', 12000));
        try {
            $allowed = Cache::lock($key.':lock', 10)->block(3, function () use ($key, $limit): bool {
                if (RateLimiter::tooManyAttempts($key, $limit)) {
                    return false;
                }

                RateLimiter::hit($key, 60);

                return true;
            });
        } catch (LockTimeoutException) {
            $allowed = false;
        }

        if (! $allowed) {
            return app(IntegrationErrorResponse::class)->make(
                $request,
                IntegrationErrorCode::RateLimited,
                429,
                ['Retry-After' => max(1, RateLimiter::availableIn($key))],
            );
        }

        return $next($request);
    }
}
