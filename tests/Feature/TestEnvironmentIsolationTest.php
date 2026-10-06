<?php

namespace Tests\Feature;

use RuntimeException;
use Tests\TestCase;

final class TestEnvironmentIsolationTest extends TestCase
{
    public function test_phpunit_forces_safe_test_runtime_environment(): void
    {
        $this->assertSame('testing', getenv('APP_ENV'));
        $this->assertSame('testing', $_ENV['APP_ENV'] ?? null);
        $this->assertSame('testing', $_SERVER['APP_ENV'] ?? null);
        $this->assertSame('testing', env('APP_ENV'));
        $this->assertSame('testing', config('app.env'));
        $this->assertSame('testing', app()->environment());
        $this->assertTrue(app()->runningInConsole());
        $this->assertTrue(app()->runningUnitTests());

        $this->assertSame('talibon_portal_test', getenv('DB_DATABASE'));
        $this->assertSame('talibon_portal_test', $_ENV['DB_DATABASE'] ?? null);
        $this->assertSame('talibon_portal_test', $_SERVER['DB_DATABASE'] ?? null);
        $this->assertSame('talibon_portal_test', config('database.connections.pgsql.database'));
    }

    public function test_pre_boot_guard_rejects_contaminated_process_environment(): void
    {
        $originalEnvironment = getenv('APP_ENV');
        $originalDatabase = getenv('DB_DATABASE');
        $originalEnvEnvironment = $_ENV['APP_ENV'] ?? null;
        $originalEnvDatabase = $_ENV['DB_DATABASE'] ?? null;
        $originalServerEnvironment = $_SERVER['APP_ENV'] ?? null;
        $originalServerDatabase = $_SERVER['DB_DATABASE'] ?? null;

        try {
            $this->setEnvironmentSources('APP_ENV', 'local');
            $this->setEnvironmentSources('DB_DATABASE', 'talibon_portal_dev_fake');

            $this->expectException(RuntimeException::class);
            $this->expectExceptionMessage('Refusing to run tests against a non-test environment or database.');

            $this->assertSafeTestEnvironment();
        } finally {
            $this->restoreEnvironmentSources('APP_ENV', $originalEnvironment, $originalEnvEnvironment, $originalServerEnvironment);
            $this->restoreEnvironmentSources('DB_DATABASE', $originalDatabase, $originalEnvDatabase, $originalServerDatabase);
        }
    }

    private function setEnvironmentSources(string $name, string $value): void
    {
        putenv("{$name}={$value}");
        $_ENV[$name] = $value;
        $_SERVER[$name] = $value;
    }

    private function restoreEnvironmentSources(string $name, string|false $processValue, mixed $envValue, mixed $serverValue): void
    {
        if ($processValue === false) {
            putenv($name);
        } else {
            putenv("{$name}={$processValue}");
        }

        $this->restoreSuperglobalValue($_ENV, $name, $envValue);
        $this->restoreSuperglobalValue($_SERVER, $name, $serverValue);
    }

    /** @param array<string, mixed> $target */
    private function restoreSuperglobalValue(array &$target, string $name, mixed $value): void
    {
        if ($value === null) {
            unset($target[$name]);
            return;
        }

        $target[$name] = $value;
    }
}
