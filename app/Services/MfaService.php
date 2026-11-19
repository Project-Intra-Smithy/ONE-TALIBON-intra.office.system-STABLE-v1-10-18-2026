<?php

namespace App\Services;

use App\Domain\Identity\ConfirmedMfaEnrollment;
use App\Models\User;
use DateTimeInterface;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use LogicException;
use PragmaRX\Google2FA\Google2FA;

final class MfaService
{
    public function __construct(private readonly Google2FA $totp, private readonly AccountSessionEligibility $eligibility, private readonly AuthenticationAssurance $assurance, private readonly AuditLogger $audit)
    {
    }

    public function ensureEnrollmentSecret(User $user, ?Request $request = null): string
    {
        return DB::transaction(function () use ($user, $request): string {
            $locked = $this->lockActor($user, $request, false);

            if ($request && $locked->mfa_confirmed_at !== null) {
                throw new AuthorizationException('Account access denied.');
            }
            if (filled($locked->mfa_secret)) {
                return $locked->mfa_secret;
            }

            $secret = $this->totp->generateSecretKey();
            $locked->forceFill([
                'mfa_secret' => $secret,
                'mfa_confirmed_at' => null,
                'mfa_recovery_codes' => null,
                'mfa_recovery_codes_generated_at' => null,
                'mfa_version' => $this->nextVersion($locked),
            ])->save();

            return $secret;
        }, 3);
    }

    public function provisioningUri(User $user, ?string $secret = null): string
    {
        $secret ??= $user->mfa_secret;
        if (! filled($secret)) {
            throw new LogicException('MFA enrollment secret is not initialized.');
        }

        return $this->totp->getQRCodeUrl(
            (string) config('identity.mfa.issuer'),
            $user->email,
            $secret,
        );
    }

    public function verifyTotp(User $user, string $code): bool
    {
        if (! filled($user->mfa_secret) || ! preg_match('/^\d{6}$/', $code)) {
            return false;
        }

        return (bool) $this->totp->verifyKey(
            $user->mfa_secret,
            $code,
            (int) config('identity.mfa.totp_window', 1),
        );
    }

    public function confirmEnrollment(User $user, string $code, ?Request $request = null): ?ConfirmedMfaEnrollment
    {
        return DB::transaction(function () use ($user, $code, $request): ?ConfirmedMfaEnrollment {
            $locked = $this->lockActor($user, $request, false);

            if ($locked->mfa_confirmed_at !== null || ! $this->verifyTotp($locked, $code)) {
                return null;
            }

            $codes = $this->newRecoveryCodes();
            $version = $this->nextVersion($locked);
            $this->persistRecoveryCodes($locked, $codes, now());
            $locked->forceFill([
                'mfa_confirmed_at' => now(),
                'mfa_version' => $version,
            ])->save();

            return new ConfirmedMfaEnrollment((int) $locked->id, $version, $codes);
        }, 3);
    }

    public function verifyChallenge(User $user, ?string $totpCode, ?string $recoveryCode, ?Request $request = null): ?ConfirmedMfaEnrollment
    {
        return DB::transaction(function () use ($user, $totpCode, $recoveryCode, $request): ?ConfirmedMfaEnrollment {
            $locked = $this->lockActor($user, $request, false);

            if ($locked->mfa_confirmed_at === null || ! filled($locked->mfa_secret)) {
                return null;
            }

            $accepted = filled($recoveryCode)
                ? $this->consumeRecoveryCodeFromLockedUser($locked, (string) $recoveryCode)
                : $this->verifyTotp($locked, (string) $totpCode);

            return $accepted
                ? new ConfirmedMfaEnrollment((int) $locked->id, (int) $locked->mfa_version)
                : null;
        }, 3);
    }

    /**
     * @return array<int, string>
     */
    public function regenerateRecoveryCodes(User $user, ?Request $request = null): array
    {
        return DB::transaction(function () use ($user, $request): array {
            $locked = $this->lockActor($user, $request, true);

            if ($locked->mfa_confirmed_at === null) {
                throw new LogicException('MFA must be confirmed before recovery codes can be regenerated.');
            }

            $codes = $this->newRecoveryCodes();
            $this->persistRecoveryCodes($locked, $codes, now());
            $this->audit->record($locked, 'auth.mfa.recovery_codes.regenerated', 'MFA recovery codes were regenerated.');

            return $codes;
        }, 3);
    }

    public function resetEnrollment(User $user, ?Request $request = null): string
    {
        return DB::transaction(function () use ($user, $request): string {
            $locked = $this->lockActor($user, $request, true);
            $secret = $this->totp->generateSecretKey();
            $locked->forceFill([
                'mfa_secret' => $secret,
                'mfa_confirmed_at' => null,
                'mfa_recovery_codes' => null,
                'mfa_recovery_codes_generated_at' => null,
                'mfa_version' => $this->nextVersion($locked),
            ])->save();
            $this->audit->record($locked, 'auth.mfa.reset', 'Privileged MFA enrollment was reset.');

            return $secret;
        }, 3);
    }

    public function disable(User $user, ?Request $request = null): void
    {
        DB::transaction(function () use ($user, $request): void {
            $locked = $this->lockActor($user, $request, true);
            $locked->forceFill([
                'mfa_secret' => null,
                'mfa_confirmed_at' => null,
                'mfa_recovery_codes' => null,
                'mfa_recovery_codes_generated_at' => null,
                'mfa_version' => $this->nextVersion($locked),
            ])->save();
            $this->audit->record($locked, 'auth.mfa.disabled', 'Privileged MFA enrollment was disabled.');
        }, 3);
    }

    /**
     * @return array<int, string>
     */
    private function newRecoveryCodes(): array
    {
        $count = (int) config('identity.mfa.recovery_code_count', 10);

        return collect(range(1, $count))
            ->map(fn (): string => Str::upper(Str::random(6)).'-'.Str::upper(Str::random(6)))
            ->all();
    }

    private function consumeRecoveryCodeFromLockedUser(User $user, string $code): bool
    {
        $hashes = array_values($user->mfa_recovery_codes ?? []);
        $needle = $this->normalizeRecoveryCode($code);

        foreach ($hashes as $index => $hash) {
            if (! Hash::check($needle, $hash)) {
                continue;
            }

            unset($hashes[$index]);
            $user->forceFill(['mfa_recovery_codes' => array_values($hashes)])->save();

            return true;
        }

        return false;
    }

    /**
     * @param  array<int, string>  $codes
     */
    private function persistRecoveryCodes(User $user, array $codes, DateTimeInterface $generatedAt): void
    {
        $hashes = array_map(
            fn (string $code): string => Hash::make($this->normalizeRecoveryCode($code)),
            $codes,
        );

        $user->forceFill([
            'mfa_recovery_codes' => $hashes,
            'mfa_recovery_codes_generated_at' => $generatedAt,
        ])->save();
    }

    private function normalizeRecoveryCode(string $code): string
    {
        return Str::upper(str_replace(' ', '', trim($code)));
    }

    private function lockActor(User $claimed, ?Request $request, bool $assured): User
    {
        $locked = $this->eligibility->lock($claimed);
        if (! $this->assurance->requiresMfa($locked)
            || $locked->role !== $claimed->role
            || (int) $locked->mfa_version !== (int) $claimed->mfa_version) {
            throw new AuthorizationException('Account access denied.');
        }
        if ($request) {
            $this->eligibility->requireSession($request, $locked);
            if ($assured && ! $this->assurance->isSatisfiedAgainst($request, $locked)) {
                throw new AuthorizationException('Account access denied.');
            }
        } elseif ((int) $locked->session_version !== (int) $claimed->session_version) {
            // Existing trusted non-HTTP service callers cannot mutate stale epochs.
            throw new AuthorizationException('Account access denied.');
        }

        return $locked;
    }

    private function nextVersion(User $user): int
    {
        return ((int) $user->mfa_version) + 1;
    }
}
