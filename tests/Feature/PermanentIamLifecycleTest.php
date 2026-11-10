<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\StaffActivationInvitation;
use App\Models\User;
use App\Services\StaffActivationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

final class PermanentIamLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD = 'Municipal-Access-2026!';

    public function test_first_admin_bootstrap_is_interactive_single_use_and_forces_normal_mfa_path(): void
    {
        $this->seed(\Database\Seeders\MunicipalityStructureSeeder::class);
        $this->artisan('talibon:bootstrap-first-admin', [
            '--username' => 'owner.admin', '--name' => 'Trusted Owner',
            '--department-code' => 'ADMIN', '--position' => 'System owner',
        ])->expectsQuestion('New administrator password (minimum 16 characters)', self::PASSWORD)
            ->expectsQuestion('Confirm password', self::PASSWORD)
            ->expectsConfirmation('Create the one initial system administrator?', 'yes')
            ->assertSuccessful();

        $owner = User::query()->where('username', 'owner.admin')->firstOrFail();
        $this->assertTrue($owner->isRole('system_admin'));
        $this->assertTrue(Hash::check(self::PASSWORD, $owner->password));
        $this->assertDatabaseCount('initial_admin_bootstraps', 1);
        $this->post('/login', ['login' => 'owner.admin', 'password' => self::PASSWORD])
            ->assertRedirect(route('mfa.enroll'));

        $this->artisan('talibon:bootstrap-first-admin', [
            '--username' => 'second.admin', '--name' => 'Second Owner',
            '--department-code' => 'ADMIN', '--position' => 'System owner',
        ])->expectsQuestion('New administrator password (minimum 16 characters)', self::PASSWORD)
            ->expectsQuestion('Confirm password', self::PASSWORD)
            ->expectsConfirmation('Create the one initial system administrator?', 'yes')
            ->assertFailed();
        $this->assertDatabaseCount('users', 1);
    }

    public function test_system_admin_issues_hash_only_code_and_employee_activates_without_email(): void
    {
        [$admin, $employee] = $this->actors();
        $issued = app(StaffActivationService::class)->issue($admin, [
            'employee_id' => $employee->id,
            'username' => 'new.staff',
            'contact_email' => null,
            'role' => 'department_staff',
        ]);

        $code = $issued['code'];
        $this->assertNotEmpty($code);
        $this->assertDatabaseMissing('staff_activation_invitations', ['code_digest' => str_replace('-', '', $code)]);
        $this->assertStringNotContainsString(str_replace('-', '', $code), (string) StaffActivationInvitation::query()->firstOrFail()->code_digest);

        $this->post('/activate-account', [
            'code' => $code,
            'password' => self::PASSWORD,
            'password_confirmation' => self::PASSWORD,
        ])->assertRedirect(route('mfa.enroll'));

        $user = $employee->fresh()->user;
        $this->assertTrue($user->is_active);
        $this->assertSame('active', $user->account_status);
        $this->assertSame('new.staff', $user->username);
        $this->assertNull($user->email);
        $this->assertTrue(Hash::check(self::PASSWORD, $user->password));
        $this->assertNotNull($issued['invitation']->fresh()->consumed_at);
    }

    public function test_activation_code_is_expiring_revocable_and_single_use(): void
    {
        [$admin, $employee] = $this->actors();
        $issued = $this->issue($admin, $employee, 'one.use');
        app(StaffActivationService::class)->redeem($issued['code'], self::PASSWORD);

        $this->expectException(\Illuminate\Validation\ValidationException::class);
        app(StaffActivationService::class)->redeem($issued['code'], self::PASSWORD);
    }

    public function test_reissue_revokes_prior_code_and_revocation_is_neutral(): void
    {
        [$admin, $employee] = $this->actors();
        $first = $this->issue($admin, $employee, 'reissue.user');
        $second = $this->issue($admin, $employee, 'reissue.user');
        $this->assertNotNull($first['invitation']->fresh()->revoked_at);

        try {
            app(StaffActivationService::class)->redeem($first['code'], self::PASSWORD);
            $this->fail('Revoked code was accepted.');
        } catch (\Illuminate\Validation\ValidationException $exception) {
            $this->assertArrayHasKey('code', $exception->errors());
        }
        $this->assertTrue(app(StaffActivationService::class)->redeem($second['code'], self::PASSWORD)->is_active);
    }

    public function test_ordinary_provisioning_cannot_grant_system_admin_or_approval_role(): void
    {
        [$admin, $employee] = $this->actors();
        foreach (['system_admin', 'mayor_approver'] as $role) {
            try {
                app(StaffActivationService::class)->issue($admin, [
                    'employee_id' => $employee->id, 'username' => 'blocked.'.$role,
                    'contact_email' => null, 'role' => $role,
                ]);
                $this->fail('Elevated role was provisioned.');
            } catch (\Illuminate\Validation\ValidationException $exception) {
                $this->assertArrayHasKey('role', $exception->errors());
            }
        }
    }

    public function test_non_admin_cannot_create_suspend_or_recover_accounts(): void
    {
        [$admin, $employee] = $this->actors();
        $issued = $this->issue($admin, $employee, 'protected.user');
        $subject = app(StaffActivationService::class)->redeem($issued['code'], self::PASSWORD);
        $ordinary = $this->userWithEmployee('employee', 'ordinary');

        $this->actingAs($ordinary)->post('/admin/accounts', [
            'employee_id' => $employee->id, 'username' => 'forged.user', 'role' => 'employee',
        ])->assertForbidden();
        $this->actingAs($ordinary)->post("/admin/accounts/{$subject->id}/suspend", ['reason' => 'not authorized'])->assertForbidden();
        $this->actingAs($ordinary)->post("/admin/accounts/{$subject->id}/recovery")->assertForbidden();
    }

    public function test_suspension_invalidates_existing_session_and_reactivation_rechecks_eligibility(): void
    {
        [$admin, $employee] = $this->actors();
        $subject = app(StaffActivationService::class)->redeem($this->issue($admin, $employee, 'suspend.user')['code'], self::PASSWORD);
        $oldVersion = (int) $subject->session_version;
        app(StaffActivationService::class)->suspend($admin, $subject, 'Access review');
        $this->assertFalse($subject->fresh()->is_active);
        $this->assertGreaterThan($oldVersion, (int) $subject->fresh()->session_version);

        app(StaffActivationService::class)->reactivate($admin, $subject->fresh());
        $this->assertTrue($subject->fresh()->is_active);
        $employee->forceFill(['employment_status' => 'separated', 'separation_date' => now()])->save();
        app(StaffActivationService::class)->suspend($admin, $subject->fresh(), 'Employment ended');
        $this->expectException(\Illuminate\Validation\ValidationException::class);
        app(StaffActivationService::class)->reactivate($admin, $subject->fresh());
    }

    public function test_controlled_recovery_invalidates_password_mfa_and_sessions_then_issues_new_code(): void
    {
        [$admin, $employee] = $this->actors();
        $subject = app(StaffActivationService::class)->redeem($this->issue($admin, $employee, 'recover.user')['code'], self::PASSWORD);
        $subject->forceFill(['mfa_secret' => 'JBSWY3DPEHPK3PXP', 'mfa_confirmed_at' => now(), 'mfa_version' => 4])->save();
        $oldSessionVersion = (int) $subject->session_version;
        $recovery = app(StaffActivationService::class)->recover($admin, $subject->fresh());

        $pending = $subject->fresh();
        $this->assertSame('pending', $pending->account_status);
        $this->assertFalse($pending->is_active);
        $this->assertNull($pending->mfa_secret);
        $this->assertNull($pending->mfa_confirmed_at);
        $this->assertGreaterThan($oldSessionVersion, (int) $pending->session_version);
        $this->assertTrue(app(StaffActivationService::class)->redeem($recovery['code'], 'Recovered-Access-2026!')->is_active);
    }

    public function test_username_and_legacy_email_login_both_remain_supported(): void
    {
        $usernameUser = $this->userWithEmployee('employee', 'portal.user', null, self::PASSWORD);
        $this->post('/login', ['login' => 'portal.user', 'password' => self::PASSWORD])->assertRedirect(route('dashboard'));
        $this->post('/logout');

        $legacy = $this->userWithEmployee('employee', null, 'legacy@example.test', self::PASSWORD);
        $this->post('/login', ['email' => $legacy->email, 'password' => self::PASSWORD])->assertRedirect(route('dashboard'));
    }

    /** @return array{User, Employee} */
    private function actors(): array
    {
        $admin = $this->userWithEmployee('system_admin', 'first.admin');
        $office = Department::query()->where('code', 'ENG')->firstOrFail();
        $employee = Employee::query()->create([
            'employee_number' => null, 'full_name' => 'New Staff Member', 'work_email' => null,
            'user_id' => null, 'department_id' => $office->id, 'position_title' => 'Staff',
            'employment_status' => 'active',
        ]);
        return [$admin, $employee];
    }

    private function issue(User $admin, Employee $employee, string $username): array
    {
        return app(StaffActivationService::class)->issue($admin, [
            'employee_id' => $employee->id, 'username' => $username,
            'contact_email' => null, 'role' => 'department_staff',
        ]);
    }

    private function userWithEmployee(string $role, ?string $username, ?string $email = null, string $password = self::PASSWORD): User
    {
        $office = Department::query()->firstOrCreate(['code' => 'ENG'], [
            'name' => 'Engineering', 'short_name' => 'Engineering', 'branch' => 'executive',
            'office_type' => 'department', 'sort_order' => 1, 'is_active' => true,
        ]);
        $user = User::query()->create([
            'name' => 'Test User', 'username' => $username, 'email' => $email,
            'password' => $password, 'role' => $role, 'is_active' => true, 'account_status' => 'active',
        ]);
        Employee::query()->create([
            'employee_number' => (string) Str::uuid(), 'full_name' => 'Test User', 'work_email' => $email,
            'user_id' => $user->id, 'department_id' => $office->id, 'position_title' => 'Staff',
            'employment_status' => 'active',
        ]);
        return $user;
    }
}
