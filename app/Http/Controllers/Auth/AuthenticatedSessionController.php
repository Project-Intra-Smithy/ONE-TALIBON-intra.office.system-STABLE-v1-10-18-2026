<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AccountSessionEligibility;
use App\Services\AuditLogger;
use App\Services\AuthenticationAssurance;
use App\Services\AuthenticationAttemptLimiter;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    public function __construct(
        private readonly AuthenticationAssurance $assurance,
        private readonly AuthenticationAttemptLimiter $limiter,
        private readonly AuditLogger $audit,
        private readonly AccountSessionEligibility $eligibility,
    ) {}

    public function create(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function store(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'login' => ['nullable', 'string', 'max:255', 'required_without:email'],
            'email' => ['nullable', 'email', 'required_without:login'],
            'password' => ['required', 'string'],
        ]);

        $this->rejectLimitedLogin($request);

        $login = mb_strtolower(trim((string) ($credentials['login'] ?? $credentials['email'])));
        $field = filter_var($login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        // Field is selected above from two fixed identifiers, never request SQL.
        // Deny ambiguous legacy data even before deployment of the DB backstop.
        $matches = User::query()->whereRaw("lower(btrim({$field})) = ?", [$login])->limit(2)->get();
        $candidate = $matches->count() === 1 ? $matches->first() : null;
        $user = null;
        if ($candidate) {
            try {
                $user = DB::transaction(function () use ($candidate, $field, $login, $credentials): ?User {
                    $locked = $this->eligibility->lock($candidate);
                    if (mb_strtolower(trim((string) $locked->{$field})) !== $login || ! Hash::check($credentials['password'], $locked->password)) {
                        return null;
                    }
                    // Retire previously issued recall tokens even on successful
                    // password login. No recaller can establish an auth epoch.
                    $locked->forceFill(['remember_token' => null]);
                    if (Hash::needsRehash($locked->password)) {
                        $locked->password = $credentials['password'];
                    }
                    if ($locked->isDirty()) {
                        $locked->save();
                    }

                    return $locked;
                }, 3);
            } catch (AuthorizationException) {
                // Do not distinguish inactive or ineligible identities.
            }
        }
        if (! $user) {
            $this->recordFailedLogin($request);
        }

        $this->limiter->clearLogin($request);
        Auth::guard('web')->login($user, false);
        $request->session()->regenerate();
        $this->assurance->clear($request);
        $request->session()->put(AccountSessionEligibility::EPOCH, (int) $user->session_version);

        if (! $this->assurance->requiresMfa($user)) {
            return redirect()->intended(route('dashboard'));
        }

        $this->audit->record(
            $user,
            'auth.password.succeeded',
            'Privileged password authentication succeeded; MFA assurance is still required.',
        );

        return redirect()->route($this->assurance->requiredRoute($user));
    }

    public function destroy(Request $request): RedirectResponse
    {
        if ($request->user() && ! Auth::guard('web')->viaRemember()
            && $this->eligibility->matchesEpoch($request, $request->user())) {
            $userId = $request->user()->id;
            $sessionHash = (string) $request->session()->get(
                'presence_session_hash',
                hash('sha256', $request->session()->getId()),
            );
            DB::table('portal_presence_sessions')
                ->where('user_id', $userId)
                ->where('session_hash', $sessionHash)
                ->delete();
            DB::table('users')->where('id', $userId)->update([
                'last_seen_at' => DB::table('portal_presence_sessions')
                    ->where('user_id', $userId)
                    ->max('last_seen_at'),
            ]);
        }
        Auth::guard('web')->logoutCurrentDevice();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }

    private function rejectLimitedLogin(Request $request): void
    {
        if (! $this->limiter->loginLimited($request)) {
            return;
        }

        $this->audit->recordAnonymous(
            'auth.login.rate_limited',
            'Password authentication was rate limited.',
            'denied',
        );

        throw ValidationException::withMessages([
            $request->has('login') ? 'login' : 'email' => 'Sign in could not be completed. Please wait and try again.',
        ]);
    }

    private function recordFailedLogin(Request $request): never
    {
        $this->limiter->hitLogin($request);
        $this->audit->recordAnonymous(
            'auth.login.failed',
            'Password authentication failed.',
            'denied',
        );

        throw ValidationException::withMessages([
            $request->has('login') ? 'login' : 'email' => 'The provided credentials are invalid or the account is inactive.',
        ]);
    }
}
