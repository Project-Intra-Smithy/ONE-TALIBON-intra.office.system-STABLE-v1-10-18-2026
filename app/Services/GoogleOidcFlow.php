<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * One active Socialite OAuth flow per browser session.
 * Socialite separately generates/validates the OAuth state and consumes it.
 */
final class GoogleOidcFlow
{
    private const SESSION_KEY = 'auth.google_oidc.flow';

    public function begin(Request $request, string $purpose, ?int $linkingUserId = null): void
    {
        if (! in_array($purpose, ['signin', 'link'], true) ||
            ($purpose === 'link' && (! $linkingUserId || $linkingUserId < 1)) ||
            ($purpose === 'signin' && $linkingUserId !== null)) {
            throw new RuntimeException('Invalid Google authentication flow.');
        }

        $request->session()->put(self::SESSION_KEY, [
            'purpose' => $purpose,
            'user_id' => $linkingUserId,
            'issued_at' => now()->getTimestamp(),
            'request_marker' => Str::random(48),
        ]);
    }

    public function cancel(Request $request): void
    {
        $request->session()->forget(self::SESSION_KEY);
    }

    /** @return array{purpose:string,user_id:int|null} */
    public function consume(Request $request): array
    {
        $flow = $request->session()->pull(self::SESSION_KEY);

        if (! is_array($flow) ||
            ! in_array($flow['purpose'] ?? null, ['signin', 'link'], true) ||
            ! is_int($flow['issued_at'] ?? null) ||
            $flow['issued_at'] > now()->getTimestamp() ||
            now()->getTimestamp() - $flow['issued_at'] > (int) config('google_oidc.flow_ttl_seconds', 300) ||
            ! is_string($flow['request_marker'] ?? null) ||
            strlen($flow['request_marker']) !== 48) {
            throw new RuntimeException('Google authentication flow expired or missing.');
        }

        $id = $flow['user_id'] ?? null;
        if ($flow['purpose'] === 'link' && (! is_int($id) || $id < 1) ||
            $flow['purpose'] === 'signin' && $id !== null) {
            throw new RuntimeException('Google authentication flow is invalid.');
        }

        return ['purpose' => $flow['purpose'], 'user_id' => $id];
    }
}
