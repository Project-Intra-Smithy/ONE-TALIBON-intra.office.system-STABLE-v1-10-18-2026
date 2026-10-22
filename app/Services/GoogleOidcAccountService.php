<?php

namespace App\Services;

use App\Domain\Identity\GoogleOidcProfile;
use App\Models\GoogleIdentityBinding;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Only existing approved Users may sign in.
 * Initial binding requires a currently authenticated, recently MFA-verified
 * account; email/domain never selects a User or grants an application role.
 *
 * Do not call this from an HTTP route without the stateful callback handler.
 */
final class GoogleOidcAccountService
{
    public function __construct(
        private readonly AuthenticationAssurance $assurance,
        private readonly AuditLogger $audit,
    ) {
    }

    public function assertLinkInitiator(Request $request): User
    {
        $actor = $request->user();
        if (! $actor instanceof User || $actor->getKey() === null ||
            ! Auth::guard('web')->check() ||
            (int) Auth::guard('web')->id() !== (int) $actor->getKey()) {
            $this->deny(null);
        }

        $user = User::query()->with('employee.department')->find($actor->getKey());
        if (! $user instanceof User || ! $this->active($user)) {
            $this->deny($actor);
        }

        // Require a real, recent MFA challenge even for roles that ordinarily
        // do not need MFA; "isSatisfied" alone allows nonprivileged roles.
        $session = $request->session();
        $verifiedAt = $session->get(AuthenticationAssurance::SESSION_VERIFIED_AT_KEY);
        if (! $this->assurance->enrollmentExists($user) ||
            ! $this->assurance->isSatisfied($request, $user) ||
            ! is_int($verifiedAt) ||
            $verifiedAt > now()->getTimestamp() ||
            $verifiedAt < now()->getTimestamp() - (int) config('google_oidc.link_mfa_max_age_seconds', 600) ||
            (int) $session->get(AuthenticationAssurance::SESSION_USER_KEY, 0) !== (int) $user->id ||
            (int) $session->get(AuthenticationAssurance::SESSION_VERSION_KEY, -1) !== (int) $user->mfa_version) {
            $this->deny($user);
        }

        return $user;
    }

    public function link(Request $request, int $expectedUserId, GoogleOidcProfile $profile): User
    {
        $actor = $this->assertLinkInitiator($request);
        if ((int) $actor->id !== $expectedUserId) {
            $this->deny($actor);
        }

        return DB::transaction(function () use ($actor, $profile): User {
            $user = User::query()->with('employee.department')
                ->whereKey($actor->id)->lockForUpdate()->first();

            if (! $user instanceof User || ! $this->active($user) ||
                ! $this->emailsEqual($profile->verifiedEmail, $user->email)) {
                $this->deny($actor);
            }

            // Same-email alone is never sufficient: we already proved the
            // local account and its recently MFA-assured session above.
            $existing = GoogleIdentityBinding::query()
                ->where('google_subject', $profile->subject)
                ->orWhere('user_id', $user->id)
                ->lockForUpdate()->first();
            if ($existing !== null) {
                // Including revoked rows: no implicit relink or transfer.
                $this->deny($actor);
            }

            $binding = new GoogleIdentityBinding();
            $binding->forceFill([
                'user_id' => $user->id,
                'google_subject' => $profile->subject,
                'verified_email_at_link' => $profile->verifiedEmail,
                'linked_by_user_id' => $user->id,
                'linked_at' => now(),
            ]);
            // DB unique(user_id), unique(google_subject) enforce races.
            $binding->save();

            $this->audit->record(
                $user, 'auth.google.link.succeeded',
                'MFA-assured Google identity binding was recorded.',
            );

            return $user;
        }, 3);
    }

    public function signIn(Request $request, GoogleOidcProfile $profile): User
    {
        if (Auth::guard('web')->check()) {
            $this->deny($request->user());
        }

        $user = DB::transaction(function () use ($profile): User {
            // NEVER query users by Google email. Only stable subject mappings.
            $binding = GoogleIdentityBinding::query()
                ->where('google_subject', $profile->subject)
                ->whereNull('revoked_at')
                ->lockForUpdate()->first();

            if ($binding === null ||
                ! $this->emailsEqual($binding->verified_email_at_link, $profile->verifiedEmail)) {
                $this->deny(null);
            }

            $candidate = User::query()->with('employee.department')
                ->whereKey($binding->user_id)->lockForUpdate()->first();
            if (! $candidate instanceof User || ! $this->active($candidate) ||
                ! $this->emailsEqual($candidate->email, $profile->verifiedEmail)) {
                $this->deny(null);
            }

            return $candidate;
        }, 3);

        // Never inherit any prior browser session's privileged MFA proof.
        Auth::guard('web')->login($user, false);
        $request->session()->regenerate();
        $this->assurance->clear($request);
        $this->audit->record(
            $user, 'auth.google.signin.succeeded',
            'Preauthorized Google identity authenticated; application MFA remains separate.',
        );

        return $user;
    }

    private function active(User $user): bool
    {
        return $user->is_active === true &&
            $user->email_verified_at !== null &&
            $user->employee !== null &&
            (int) $user->employee->user_id === (int) $user->id &&
            $user->employee->employment_status === 'active' &&
            $user->employee->department !== null &&
            $user->employee->department->is_active === true;
    }

    private function emailsEqual(string $left, string $right): bool
    {
        return hash_equals(strtolower(trim($left)), strtolower(trim($right)));
    }

    private function deny(?User $actor): never
    {
        // No Google subject, email, token, verifier, or provider error in logs.
        $this->audit->record(
            $actor,
            'auth.google.identity.denied',
            'Google identity binding or employment authorization was denied.',
            'denied',
        );

        throw new AuthorizationException('Google authentication cannot be completed.');
    }
}
