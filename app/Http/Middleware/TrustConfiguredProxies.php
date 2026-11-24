<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TrustConfiguredProxies
{
    public function handle(Request $request, Closure $next): Response
    {
        $proxies = array_values(array_filter(array_map('trim', explode(',', (string) config('app.trusted_proxies', ''))), static function (string $proxy): bool {
            $parts = explode('/', $proxy, 2);
            $ip = $parts[0];
            if (! filter_var($ip, FILTER_VALIDATE_IP)) {
                return false;
            }

            return count($parts) === 1 || (ctype_digit($parts[1])
                && (int) $parts[1] > 0
                && (int) $parts[1] <= (str_contains($ip, ':') ? 128 : 32));
        }));

        $request::setTrustedProxies($proxies, Request::HEADER_X_FORWARDED_FOR | Request::HEADER_X_FORWARDED_PROTO | Request::HEADER_X_FORWARDED_PORT);

        return $next($request);
    }
}
