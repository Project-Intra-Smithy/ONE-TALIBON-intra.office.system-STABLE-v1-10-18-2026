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

    public function test_admin_registers_employee_without_account_then_provisions_using_existing_iam(): void
    {
        $admin = $this->userWithEmployee('system_admin', 'register.admin');
        $office = Department::query()->where('code', 'ENG')->firstOrFail();
        $data = [
            'full_name' => 'Registered QA Employee',
            'department_id' => $office->id,
            'position_title' => 'Engineering Staff',
            'employee_number' => 'QA-REG-001',
            'employment_type' => 'permanent',
            'user_id' => $admin->id,
            'role' => 'system_admin',
        ];

        $this->actingAs($admin)->post('/admin/employees', $data)->assertRedirect(route('admin.index'));
        $employee = Employee::query()->where('employee_number', 'QA-REG-001')->firstOrFail();
        $this->assertNull($employee->user_id);
        $this->assertSame('active', $employee->employment_status);
        $this->assertSame('permanent', $employee->employment_type);
        $this->assertSame($office->id, $employee->department_id);
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('staff_activation_invitations', 0);
        $this->assertDatabaseHas('audit_logs', [
            'actor_user_id' => $admin->id,
            'action' => 'identity.employee.registered',
            'entity_id' => $employee->id,
        ]);

        $this->get('/admin')->assertOk()->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
            ->where('eligibleEmployees.0.id', $employee->id));
        $this->get('/employees?q=QA-REG-001')->assertOk()->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
            ->where('employees.data.0.id', $employee->id));

        $this->post('/admin/accounts', [
            'employee_id' => $employee->id, 'username' => 'registered.staff', 'role' => 'department_head',
        ])->assertRedirect(route('admin.index'));
        $this->assertDatabaseCount('users', 2);
        $this->assertDatabaseCount('staff_activation_invitations', 1);
        $this->assertSame('pending', $employee->fresh()->user->account_status);
    }

    public function test_employee_registration_rejects_invalid_office_and_duplicate_number_and_accepts_no_number(): void
    {
        $admin = $this->userWithEmployee('system_admin', 'validate.admin');
        // Keep the acting administrator's own office active. Only the target
        // office is deactivated, so this exercises registration validation.
        $office = Department::query()->create([
            'code' => 'QA-TARGET', 'name' => 'QA Target Office',
            'short_name' => 'Target', 'branch' => 'executive',
            'office_type' => 'department', 'sort_order' => 2, 'is_active' => true,
        ]);
        $data = ['full_name' => 'New Employee', 'department_id' => $office->id, 'position_title' => 'Staff'];
        $this->actingAs($admin);
        $this->from('/admin')->post('/admin/employees', array_replace($data, ['department_id' => 99999999]))
            ->assertSessionHasErrors('department_id');
        $this->from('/admin')->post('/admin/employees', array_replace($data, ['employee_number' => $admin->employee->employee_number]))
            ->assertSessionHasErrors('employee_number');
        $office->update(['is_active' => false]);
        $this->from('/admin')->post('/admin/employees', $data)->assertSessionHasErrors('department_id');
        $this->assertDatabaseCount('employees', 1);
        $office->update(['is_active' => true]);
        $this->post('/admin/employees', $data)->assertRedirect(route('admin.index'));
        $employee = Employee::query()->where('full_name', 'New Employee')->firstOrFail();
        $this->assertNull($employee->employee_number);
        $this->assertNull($employee->user_id);
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('staff_activation_invitations', 0);
    }

    public function test_employee_registration_requires_system_admin_and_mfa(): void
    {
        $ordinary = $this->userWithEmployee('employee', 'ordinary.register');
        $office = Department::query()->where('code', 'ENG')->firstOrFail();
        $data = ['full_name' => 'Denied Person', 'department_id' => $office->id, 'position_title' => 'Staff'];
        $this->post('/admin/employees', $data)->assertRedirect(route('login'));
        $this->actingAs($ordinary)->post('/admin/employees', $data)->assertForbidden();
        $this->post('/logout');
        $admin = $this->userWithEmployee('system_admin', 'mfa.register');
        $this->post('/login', ['login' => $admin->username, 'password' => self::PASSWORD])->assertRedirect(route('mfa.enroll'));
        $this->post('/admin/employees', $data)->assertRedirect(route('mfa.enroll'));
        $this->assertDatabaseMissing('employees', ['full_name' => 'Denied Person']);
        $this->assertDatabaseCount('staff_activation_invitations', 0);
    }

    public function test_activation_expiration_and_binding_mismatch_fail_without_mutation(): void
    {
        [$admin, $employee] = $this->actors();
        $service = app(StaffActivationService::class);
        $issued = $this->issue($admin, $employee, 'expiry.staff');
        $user = $employee->fresh()->user;
        $this->travel(25)->hours();
        $this->assertDeniedUnchanged($user, fn () => $service->redeem($issued['code'], self::PASSWORD), 'code');
        $this->travelBack();

        $issued = $this->issue($admin, $employee, 'expiry.staff');
        $invitation = $issued['invitation'];
        $this->assertDeniedUnchanged($user, fn () => $service->redeem('INVALID'.$issued['code'], self::PASSWORD), 'code');
        foreach ([
            ['role' => 'employee'], ['username' => 'other.staff'], ['email' => 'changed@example.test'],
            ['is_active' => true], ['role' => 'system_admin'],
        ] as $change) {
            $original = array_intersect_key($user->fresh()->getAttributes(), $change);
            $user->fresh()->forceFill($change)->save();
            $this->assertDeniedUnchanged($user, fn () => $service->redeem($issued['code'], self::PASSWORD), 'code');
            $user->fresh()->forceFill($original)->save();
        }
        $employee->refresh()->update(['separation_date' => now()]);
        $this->assertDeniedUnchanged($user, fn () => $service->redeem($issued['code'], self::PASSWORD), 'code');
        $employee->update(['separation_date' => null]);
        $other = Department::query()->create(['code' => 'IAM-OTHER', 'name' => 'Other office', 'is_active' => true]);
        $officeId = $employee->department_id;
        $employee->update(['department_id' => $other->id]);
        $this->assertDeniedUnchanged($user, fn () => $service->redeem($issued['code'], self::PASSWORD), 'code');
        $employee->update(['department_id' => $officeId]);
        $employee->update(['user_id' => null]);
        $this->assertDeniedUnchanged($user, fn () => $service->redeem($issued['code'], self::PASSWORD), 'code');
        $employee->update(['user_id' => $user->id]);
        $employee->department()->update(['is_active' => false]);
        $this->assertDeniedUnchanged($user, fn () => $service->redeem($issued['code'], self::PASSWORD), 'code');
        $employee->department()->update(['is_active' => true]);
        $service->revoke($admin, $invitation);
        $this->assertNotNull($invitation->fresh()->revoked_at);
        $this->assertDeniedUnchanged($user, fn () => $service->redeem($issued['code'], self::PASSWORD), 'code');
    }

    public function test_http_and_service_lifecycle_matrix_rejects_invalid_states_and_protected_targets(): void
    {
        [$admin, $employee] = $this->actors();
        $service = app(StaffActivationService::class);
        $issued = $this->issue($admin, $employee, 'matrix.staff');
        $user = $employee->fresh()->user;
        $this->actingAs($admin);
        foreach (['reactivate', 'suspend', 'recovery'] as $action) {
            $before = $this->lifecycleSnapshot($user);
            $this->from('/admin')->post("/admin/accounts/{$user->id}/{$action}", ['reason' => 'State test'])
                ->assertSessionHasErrors('account');
            $this->assertSame($before, $this->lifecycleSnapshot($user));
        }
        $this->assertDeniedUnchanged($user, fn () => $this->issue($admin, $employee, 'renamed.staff'), 'account');
        $service->redeem($issued['code'], self::PASSWORD);
        $this->assertDeniedUnchanged($user, fn () => $service->reactivate($admin, $user), 'account');
        $service->suspend($admin, $user, 'State test');
        $this->assertDeniedUnchanged($user, fn () => $service->suspend($admin, $user, 'Repeat'), 'account');
        $this->assertDeniedUnchanged($user, fn () => $service->recover($admin, $user), 'account');
        $employee->refresh()->update(['separation_date' => now()]);
        $this->assertDeniedUnchanged($user, fn () => $service->reactivate($admin, $user), 'employee_id');
        $employee->update(['separation_date' => null]);
        $service->reactivate($admin, $user);
        foreach (['deactivated', 'unknown'] as $state) {
            $user->fresh()->forceFill(['account_status' => $state, 'is_active' => false])->save();
            $this->assertDeniedUnchanged($user, fn () => $service->reactivate($admin, $user), 'account');
        }
        foreach (['system_admin', 'mayor_approver', 'unknown_role'] as $role) {
            $user->fresh()->forceFill(['role' => $role, 'account_status' => 'pending', 'is_active' => false])->save();
            $before = $this->lifecycleSnapshot($user);
            foreach (['reactivate', 'suspend', 'recovery'] as $action) {
                $this->post("/admin/accounts/{$user->id}/{$action}", ['reason' => 'Protected target'])->assertForbidden();
            }
            $this->post('/admin/accounts', ['employee_id' => $employee->id, 'username' => $user->username, 'role' => 'employee'])->assertForbidden();
            $this->post("/admin/invitations/{$issued['invitation']->id}/revoke")->assertForbidden();
            $this->assertSame($before, $this->lifecycleSnapshot($user));
        }
        $before = $this->lifecycleSnapshot($admin);
        $this->post("/admin/accounts/{$admin->id}/suspend", ['reason' => 'Self target'])->assertForbidden();
        $this->assertSame($before, $this->lifecycleSnapshot($admin));
    }

    public function test_stale_actor_authority_is_rechecked_under_lock(): void
    {
        [$admin, $employee] = $this->actors();
        $service = app(StaffActivationService::class);
        $user = $service->redeem($this->issue($admin, $employee, 'stale.staff')['code'], self::PASSWORD);
        foreach ([['role' => 'employee'], ['account_status' => 'pending'], ['is_active' => false]] as $change) {
            $original = array_intersect_key($admin->fresh()->getAttributes(), $change);
            $admin->fresh()->forceFill($change)->save();
            $before = $this->lifecycleSnapshot($user);
            try {
                $service->suspend($admin, $user, 'Stale actor');
                $this->fail('Stale actor was accepted.');
            } catch (\Illuminate\Auth\Access\AuthorizationException|\Symfony\Component\HttpKernel\Exception\HttpException $exception) {
                $this->assertSame($before, $this->lifecycleSnapshot($user));
            }
            $admin->fresh()->forceFill($original)->save();
        }
        $admin->employee()->update(['separation_date' => now()]);
        $before = $this->lifecycleSnapshot($user);
        try {
            $service->recover($admin, $user);
            $this->fail('Separated actor was accepted.');
        } catch (\Illuminate\Auth\Access\AuthorizationException $exception) {
            $this->assertSame($before, $this->lifecycleSnapshot($user));
        }
    }

    public function test_v01_stale_administrator_office_denies_recovery_without_mutation(): void
    {
        [$admin, $employee] = $this->actors();
        $adminOffice = Department::query()->create([
            'code' => 'IAM-V01-ADMIN', 'name' => 'V01 Administrator Office',
            'is_active' => true,
        ]);
        $admin->employee()->update(['department_id' => $adminOffice->id]);
        $admin = $admin->fresh();
        $subjectOffice = $employee->department()->firstOrFail();
        $this->assertNotSame($adminOffice->id, $subjectOffice->id);
        $this->assertTrue((bool) $subjectOffice->is_active);

        $service = app(StaffActivationService::class);
        $issued = $this->issue($admin, $employee, 'v01.staff');
        $user = $service->redeem($issued['code'], self::PASSWORD);
        $user->forceFill([
            'remember_token' => 'v01-synthetic-remember',
            'mfa_secret' => 'JBSWY3DPEHPK3PXP', 'mfa_confirmed_at' => now(),
            'mfa_version' => 4, 'mfa_recovery_codes' => ['synthetic-hash'],
            'mfa_recovery_codes_generated_at' => now(),
        ])->save();
        $this->actingAs($admin)->withSession(['auth_session_version' => (int) $admin->session_version]);
        $admin->load('employee.department');
        $this->assertTrue((bool) $admin->employee->department->is_active);

        // Change only the administrator's persisted office; leave the actor's
        // loaded employee/department relation stale and the subject eligible.
        $adminOffice->update(['is_active' => false]);
        $this->assertTrue((bool) $admin->employee->department->is_active);
        $this->assertFalse((bool) $adminOffice->fresh()->is_active);
        $this->assertTrue($admin->fresh()->is_active);
        $this->assertSame('active', $admin->fresh()->account_status);
        $this->assertSame('system_admin', $admin->fresh()->role);
        $this->assertSame('active', $admin->employee->employment_status);
        $this->assertNull($admin->employee->separation_date);
        $this->assertTrue((bool) $subjectOffice->fresh()->is_active);
        $this->assertSame('active', $employee->fresh()->employment_status);
        $this->assertNull($employee->fresh()->separation_date);

        $snapshot = fn () => [
            $this->lifecycleSnapshot($user),
            $employee->fresh()->getAttributes(),
            $admin->employee()->firstOrFail()->getAttributes(),
            $subjectOffice->fresh()->getAttributes(),
            Employee::query()->where('user_id', $user->id)->count(),
        ];
        $before = $snapshot();
        try {
            $service->recover($admin, $user);
            $this->fail('Recovery accepted a stale administrator from an inactive office.');
        } catch (\Illuminate\Auth\Access\AuthorizationException $exception) {
            $this->assertSame('Administrator access denied.', $exception->getMessage());
        }
        $this->assertSame($before, $snapshot(), 'Direct denial must preserve all persisted lifecycle state.');

        $route = route('admin.accounts.recovery', $user);
        $this->post($route)->assertRedirect(route('login'))
            ->assertSessionHasErrors('login')->assertSessionMissing('activationCredential');
        $this->assertGuest('web');
        $this->assertSame($before, $snapshot(), 'HTTP denial must preserve all persisted lifecycle state.');
        $this->assertDatabaseHas('audit_logs', [
            'actor_user_id' => $admin->id,
            'action' => 'auth.account.deactivated_forced_logout', 'outcome' => 'denied',
        ]);

        // Restore the same actor's office, reauthenticate and repeat the same
        // recovery operation as a positive control, without changing the target.
        $adminOffice->update(['is_active' => true]);
        $this->actingAs($admin->fresh())->withSession(['auth_session_version' => (int) $admin->session_version]);
        $this->post($route)->assertRedirect(route('admin.index'))
            ->assertSessionHas('activationCredential');
        $recovered = $user->fresh();
        $this->assertSame('pending', $recovered->account_status);
        $this->assertFalse($recovered->is_active);
        $this->assertFalse(Hash::check(self::PASSWORD, $recovered->password));
        $this->assertSame((int) $user->session_version + 1, (int) $recovered->session_version);
        $this->assertSame((int) $user->mfa_version + 1, (int) $recovered->mfa_version);
        $this->assertNull($recovered->remember_token);
        $this->assertNull($recovered->mfa_secret);
        $this->assertNull($recovered->mfa_confirmed_at);
        $this->assertNull($recovered->mfa_recovery_codes);
        $this->assertNull($recovered->mfa_recovery_codes_generated_at);
        $this->assertSame($before[1], $employee->fresh()->getAttributes());
        $this->assertSame(1, Employee::query()->where('user_id', $user->id)->count());
        $this->assertNotNull($issued['invitation']->fresh()->consumed_at);
        $replacement = StaffActivationInvitation::query()->where('user_id', $user->id)
            ->whereNull('consumed_at')->whereNull('revoked_at')->sole();
        $this->assertSame($subjectOffice->id, $replacement->department_id);
        $this->assertSame($employee->id, $replacement->employee_id);
        $this->assertSame(1, \App\Models\AuditLog::query()->where([
            'actor_user_id' => $admin->id, 'action' => 'identity.account.recovery_started',
            'entity_id' => $user->id, 'outcome' => 'allowed',
        ])->count());
        $this->assertDatabaseHas('audit_logs', [
            'actor_user_id' => $admin->id, 'action' => 'identity.invitation.issued',
            'entity_id' => $replacement->id, 'outcome' => 'allowed',
        ]);
    }

    public function test_recovery_rolls_back_credentials_invitation_and_audit_on_issuance_audit_failure(): void
    {
        [$admin, $employee] = $this->actors();
        $service = app(StaffActivationService::class);
        $user = $service->redeem($this->issue($admin, $employee, 'rollback.staff')['code'], self::PASSWORD);
        $user->forceFill([
            'remember_token' => 'synthetic-remember-token', 'mfa_secret' => 'JBSWY3DPEHPK3PXP',
            'mfa_confirmed_at' => now(), 'mfa_version' => 4,
            'mfa_recovery_codes' => ['synthetic-hash'], 'mfa_recovery_codes_generated_at' => now(),
        ])->save();
        // Synthetic pre-existing outstanding invite tests rollback of the revocation ledger.
        $old = StaffActivationInvitation::query()->where('user_id', $user->id)->firstOrFail();
        $old->forceFill(['consumed_at' => null])->save();
        $before = $this->lifecycleSnapshot($user);
        $audit = \Mockery::mock(\App\Services\AuditLogger::class)->makePartial();
        $audit->shouldReceive('record')->withArgs(fn ($actor, $action) => $action === 'identity.invitation.issued')
            ->once()->andThrow(new \RuntimeException('Synthetic audit failure'));
        $this->app->instance(\App\Services\AuditLogger::class, $audit);
        try {
            app(StaffActivationService::class)->recover($admin, $user);
            $this->fail('Recovery returned despite injected failure.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('Synthetic audit failure', $exception->getMessage());
        }
        $this->assertSame($before, $this->lifecycleSnapshot($user), 'Recovery must roll back the entire persisted operation.');
    }

    private function assertDeniedUnchanged(User $user, callable $operation, string $field): void
    {
        $before = $this->lifecycleSnapshot($user);
        try {
            $operation();
            $this->fail('Invalid lifecycle operation was accepted.');
        } catch (\Illuminate\Validation\ValidationException $exception) {
            $this->assertArrayHasKey($field, $exception->errors());
        }
        $this->assertSame($before, $this->lifecycleSnapshot($user));
    }

    private function lifecycleSnapshot(User $user): array
    {
        return [
            $user->fresh()->getAttributes(),
            StaffActivationInvitation::query()->where('user_id', $user->id)->orderBy('id')->get()->map(fn ($row) => $row->getAttributes())->all(),
            \App\Models\AuditLog::query()->where('action', 'like', 'identity.%')->orderBy('id')->get()->map(fn ($row) => $row->getAttributes())->all(),
        ];
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
