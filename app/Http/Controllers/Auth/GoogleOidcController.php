<?php

namespace App\Http\Controllers\Auth;

use App\Domain\Identity\GoogleOidcProfile;
use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Services\AuthenticationAssurance;
use App\Services\GoogleOidcAccountService;
use App\Services\GoogleOidcFlow;
use App\Services\GoogleOidcProvider;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use RuntimeException;
use Throwable;

/**
 * UNMOUNTED: integration owner must add guarded web routes only after
 * invitation/linking acceptance and dependency lock regeneration.
 */
final class GoogleOidcController extends Controller
{
    public function __construct(
        private readonly GoogleOidcProvider $provider,
        private readonly GoogleOidcFlow $flow,
        private readonly GoogleOidcAccountService $accounts,
        private readonly AuthenticationAssurance $assurance,
        private readonly AuditLogger $audit,
    ) {
    }

    /** Intended integration route: GET /auth/google/redirect [guest, throttle]. */
    public function redirect(Request $request): RedirectResponse
    {
        if (! $this->ready() || Auth::guard('web')->check() || $this->limited($request)) {
            return $this->denied($request);
        }

        try {
            $this->flow->begin($request, 'signin');

            return $this->provider->redirect();
        } catch (Throwable) {
            $this->flow->cancel($request);

            return $this->denied($request);
        }
    }

    /** Intended integration route: POST /auth/google/link [web CSRF, auth, active, mfa.assured, throttle]. */
    public function link(Request $request): RedirectResponse
    {
        if (! $this->ready() || $this->limited($request)) {
            return $this->denied($request);
        }

        try {
            $actor = $this->accounts->assertLinkInitiator($request);
            $this->flow->begin($request, 'link', (int) $actor->id);

            return $this->provider->redirect();
        } catch (Throwable) {
            $this->flow->cancel($request);

            return $this->denied($request);
        }
    }

    /** Intended integration route: GET /auth/google/callback [web session, throttle]. */
    public function callback(Request $request): RedirectResponse
    {
        if (! $this->ready() || $this->limited($request)) {
            $this->flow->cancel($request);

            return $this->denied($request);
        }

        $purpose = null;
        try {
            // Own flow marker is single-use; Socialite::user() separately
            // consumes and verifies OAuth state. NEVER use stateless().
            $flow = $this->flow->consume($request);
            $purpose = $flow['purpose'];

            if ($request->query('error') !== null ||
                ! is_string($request->query('code')) ||
                $request->query('code') === '') {
                throw new RuntimeException('Incomplete Google callback.');
            }

            $google = $this->provider->user();
            $profile = GoogleOidcProfile::fromSocialite($google);

            if ($purpose === 'link') {
                $this->accounts->link($request, (int) $flow['user_id'], $profile);
                $request->session()->regenerate();
                RateLimiter::clear($this->rateKey($request));

                return redirect()->route('mfa.settings');
            }

            $user = $this->accounts->signIn($request, $profile);
            RateLimiter::clear($this->rateKey($request));

            return $this->assurance->requiresMfa($user)
                ? redirect()->route($this->assurance->requiredRoute($user))
                : redirect()->intended(route('dashboard'));
        } catch (Throwable) {
            // If sign-in failed after changing the guard, never leave a
            // partially authenticated Google session in the browser.
            if ($purpose === 'signin' && Auth::guard('web')->check()) {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            return $this->denied($request);
        }
    }

    private function ready(): bool
    {
        $credentials = config('services.google', []);
        $redirect = $credentials['redirect'] ?? null;

        return config('google_oidc.enabled', false) === true &&
            is_string($credentials['client_id'] ?? null) &&
            trim($credentials['client_id']) !== '' &&
            is_string($credentials['client_secret'] ?? null) &&
            trim($credentials['client_secret']) !== '' &&
            is_string($redirect) &&
            str_starts_with($redirect, 'https://');
    }

    private function limited(Request $request): bool
    {
        return RateLimiter::tooManyAttempts(
            $this->rateKey($request),
            (int) config('google_oidc.rate_limit_attempts', 10),
        );
    }

    private function rateKey(Request $request): string
    {
        return 'auth:google:'.hash('sha256', (string) $request->ip());
    }

    private function denied(Request $request): RedirectResponse
    {
        RateLimiter::hit(
            $this->rateKey($request),
            (int) config('google_oidc.rate_limit_decay_seconds', 60),
        );

        // Do not log raw OAuth error, code, access token, ID token, or profile.
        $this->audit->recordAnonymous(
            'auth.google.callback.denied',
            'Google authentication was refused or could not be verified.',
            'denied',
        );

        // Existing password sign-in remains available during provider failure.
        $destination = Auth::guard('web')->check() ? 'dashboard' : 'login';

        return redirect()->route($destination)->withErrors([
            'email' => 'Google sign-in could not be completed. Use password sign-in or contact an administrator.',
        ]);
    }
}
