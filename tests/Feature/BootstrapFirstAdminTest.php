<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

final class BootstrapFirstAdminTest extends TestCase
{
    use RefreshDatabase;

    private function office(): Department
    {
        return Department::query()->create([
            'code' => 'FIRST-'.Str::upper(Str::random(6)),
            'name' => 'First Administrator Office',
            'is_active' => true,
            'is_routable' => true,
        ]);
    }

    private function args(Department $office): array
    {
        return [
            '--email' => 'first-administrator@example.test',
            '--name' => 'First Authorized Tester',
            '--department-code' => $office->code,
            '--position' => 'Synthetic Administrator',
        ];
    }

    public function test_zero_user_initial_admin_is_created_once_and_password_is_hashed(): void
    {
        $office = $this->office();
        $args = $this->args($office);
        $secret = 'LongSyntheticOnlyPassphrase-2026!';

        $this->artisan('talibon:bootstrap-first-admin', $args)
            ->expectsQuestion('New administrator password (minimum 16 characters)', $secret)
            ->expectsQuestion('Confirm the password', $secret)
            ->expectsConfirmation('Create ONE initial system administrator in '.$office->code.'?', 'yes')
            ->assertExitCode(0);

        $this->assertDatabaseCount('users', 1);
        $user = User::query()->sole();
        $this->assertSame('system_admin', $user->role);
        $this->assertTrue($user->is_active);
        $this->assertNotSame($secret, $user->getRawOriginal('password'));
        $this->assertTrue(password_verify($secret, $user->getRawOriginal('password')));
        $this->assertSame($office->id, Employee::query()->sole()->department_id);
        $this->assertNull(Employee::query()->sole()->employee_number);
        $this->assertGreaterThan(0, Employee::query()->sole()->id);

        // A second invocation must not mint another privileged principal.
        $this->artisan('talibon:bootstrap-first-admin', $args)->assertExitCode(1);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_existing_user_blocks_first_admin_bootstrap_even_if_not_system_admin(): void
    {
        $office = $this->office();
        User::query()->create([
            'name' => 'Existing User', 'email' => 'existing@example.test',
            'password' => 'existing-password', 'role' => 'department_staff', 'is_active' => true,
        ]);

        $this->artisan('talibon:bootstrap-first-admin', $this->args($office))->assertExitCode(1);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_unknown_office_does_not_create_admin(): void
    {
        $this->office();
        $args = [
            '--email' => 'first-administrator@example.test',
            '--name' => 'First Authorized Tester',
            '--department-code' => 'MISSING-OFFICE',
            '--position' => 'Synthetic Administrator',
        ];
        $this->artisan('talibon:bootstrap-first-admin', $args)->assertExitCode(1);
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('employees', 0);
    }
}
