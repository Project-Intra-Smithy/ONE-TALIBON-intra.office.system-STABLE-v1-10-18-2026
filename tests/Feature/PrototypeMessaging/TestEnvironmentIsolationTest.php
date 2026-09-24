<?php

namespace Tests\Feature\PrototypeMessaging;

use RuntimeException;
use Tests\TestCase;

final class TestEnvironmentIsolationTest extends TestCase
{
    public function test_phpunit_forces_safe_test_process_environment(): void
    {
        $this->assertSame('testing', getenv('APP_ENV'));
        $this->assertSame('talibon_portal_test', getenv('DB_DATABASE'));
    }

    public function test_pre_boot_guard_rejects_contaminated_process_environment(): void
    {
        $originalEnvironment = getenv('APP_ENV');
        $originalDatabase = getenv('DB_DATABASE');

        try {
            $this->setProcessEnvironment('APP_ENV', 'local');
            $this->setProcessEnvironment('DB_DATABASE', 'talibon_portal_dev_fake');

            $this->expectException(RuntimeException::class);
            $this->expectExceptionMessage('Refusing to run tests against a non-test environment or database.');

            $this->assertSafeTestEnvironment();
        } finally {
            $this->restoreProcessEnvironment('APP_ENV', $originalEnvironment);
            $this->restoreProcessEnvironment('DB_DATABASE', $originalDatabase);
        }
    }

    private function setProcessEnvironment(string $name, string $value): void
    {
        putenv("{$name}={$value}");
        $_ENV[$name] = $value;
        $_SERVER[$name] = $value;
    }

    private function restoreProcessEnvironment(string $name, string|false $value): void
    {
        if ($value === false) {
            putenv($name);
            unset($_ENV[$name], $_SERVER[$name]);

            return;
        }

        $this->setProcessEnvironment($name, $value);
    }
}
