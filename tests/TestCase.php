<?php

namespace Tests;

use App\Domain\Identity\PrivilegedRolePolicy;
use App\Models\User;
use App\Services\AuthenticationAssurance;
use Illuminate\Contracts\Auth\Authenticatable as UserContract;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        $this->assertSafeTestEnvironment();

        parent::setUp();
        $this->withoutVite();
    }

    protected function assertSafeTestEnvironment(): void
    {
        $this->assertSafeEnvironmentVariable('APP_ENV', 'testing');
        $this->assertSafeEnvironmentVariable('DB_DATABASE', 'talibon_portal_test');
    }

    private function assertSafeEnvironmentVariable(string $name, string $expected): void
    {
        $sources = [
            'getenv' => $this->getenvValue($name),
            '$_ENV' => $this->superglobalValue($_ENV, $name),
            '$_SERVER' => $this->superglobalValue($_SERVER, $name),
        ];

        foreach ($sources as $source => $value) {
            if ($value !== $expected) {
                throw new RuntimeException(sprintf(
                    'Refusing to run tests against a non-test environment or database. %s[%s]=%s; expected %s',
                    $source,
                    $name,
                    $value ?? '[unset]',
                    $expected,
                ));
            }
        }
    }

    private function getenvValue(string $name): ?string
    {
        $value = getenv($name);

        return $value === false ? null : (string) $value;
    }

    /** @param array<string, mixed> $source */
    private function superglobalValue(array $source, string $name): ?string
    {
        $value = $source[$name] ?? null;

        return is_scalar($value) ? (string) $value : null;
    }

    /**
     * Existing domain Feature tests use actingAs() to mean a fully authenticated
     * application request. Preserve that contract by adding test-only privileged
     * MFA enrollment/assurance. Identity-assurance tests use HTTP login or the
     * guard directly when they need a password-only session.
     *
     * @return $this
     */
    public function actingAs(UserContract $user, $guard = null)
    {
        parent::actingAs($user, $guard);

        if ($user instanceof User) {
            $this->withSession(['auth_session_version' => (int) $user->session_version]);
        }

        if ($user instanceof User && app(PrivilegedRolePolicy::class)->requiresMfa($user)) {
            if (blank($user->mfa_secret) || $user->mfa_confirmed_at === null) {
                $user->forceFill([
                    'mfa_secret' => 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
                    'mfa_confirmed_at' => now(),
                    'mfa_recovery_codes' => [],
                    'mfa_recovery_codes_generated_at' => null,
                    'mfa_version' => max(1, (int) $user->mfa_version),
                ])->save();
            }

            $fresh = $user->fresh();
            $this->withSession([
                AuthenticationAssurance::SESSION_USER_KEY => $fresh->id,
                AuthenticationAssurance::SESSION_VERSION_KEY => (int) $fresh->mfa_version,
                AuthenticationAssurance::SESSION_VERIFIED_AT_KEY => now()->getTimestamp(),
            ]);
        }

        return $this;
    }

    /** Explicitly prepare a synthetic, fully enrolled IAM administrator fixture. */
    protected function configureIamAdministrator(User $admin): void
    {
        $admin->forceFill([
            'mfa_secret' => app(\PragmaRX\Google2FA\Google2FA::class)->generateSecretKey(),
            'mfa_confirmed_at' => now(),
            'mfa_recovery_codes' => [],
            'mfa_version' => max(1, (int) $admin->mfa_version),
        ])->save();
    }

    /** Capture the claimed session; do not refresh or grant authority on each call. */
    protected function iamActorRequest(User $admin): \Illuminate\Http\Request
    {
        $request = \Illuminate\Http\Request::create('/admin/accounts', 'POST');
        $session = new \Illuminate\Session\Store('iam-synthetic', new \Illuminate\Session\ArraySessionHandler(120));
        $session->start();
        $session->put([
            'auth_session_version' => (int) $admin->session_version,
            AuthenticationAssurance::SESSION_USER_KEY => (int) $admin->id,
            AuthenticationAssurance::SESSION_VERSION_KEY => (int) $admin->mfa_version,
            AuthenticationAssurance::SESSION_VERIFIED_AT_KEY => now()->getTimestamp(),
        ]);
        $request->setLaravelSession($session);
        $request->setUserResolver(fn () => $admin);

        return $request;
    }
}
