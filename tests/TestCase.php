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
        $appEnvironment = $this->processEnvironmentValue('APP_ENV');
        $database = $this->processEnvironmentValue('DB_DATABASE');

        if ($appEnvironment !== 'testing' || $database !== 'talibon_portal_test') {
            throw new RuntimeException(sprintf(
                'Refusing to run tests against a non-test environment or database. APP_ENV=%s; DB_DATABASE=%s',
                $appEnvironment ?? '[unset]',
                $database ?? '[unset]',
            ));
        }
    }

    private function processEnvironmentValue(string $name): ?string
    {
        $value = getenv($name);
        if ($value !== false) {
            return (string) $value;
        }

        $fallback = $_ENV[$name] ?? $_SERVER[$name] ?? null;

        return is_scalar($fallback) ? (string) $fallback : null;
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
}
