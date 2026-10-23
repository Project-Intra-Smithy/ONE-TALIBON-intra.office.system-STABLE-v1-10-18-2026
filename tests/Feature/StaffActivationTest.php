<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\StaffActivationInvitation;
use App\Models\User;
use App\Services\AuthenticationAssurance;
use App\Services\StaffActivationService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

final class StaffActivationTest extends TestCase
{
    use RefreshDatabase;

    private function office(string $suffix = 'A'): Department
    {
        return Department::query()->create([
            'code' => 'TEST-'.$suffix.'-'.Str::upper(Str::random(4)),
            'name' => 'Synthetic Test Office '.$suffix,
            'is_active' => true, 'is_routable' => true,
        ]);
    }

    private function employee(Department $office, ?User $user = null, string $status = 'active'): Employee
    {
        return Employee::query()->create([
            'full_name' => 'Synthetic Employee',
            'work_email' => Str::lower(Str::random(10)).'@example.test',
            'department_id' => $office->id,
            'user_id' => $user?->id,
            'position_title' => 'Synthetic Officer',
            'employment_status' => $status,
        ]);
    }

    private function administrator(Department $office): User
    {
        $user = User::query()->create([
            'name' => 'Synthetic Administrator', 'email' => Str::random(8).'@example.test',
            'password' => 'SyntheticPassword2026Long!', 'is_active' => true, 'role' => 'system_admin',
        ]);
        $this->employee($office, $user);
        return $user;
    }

    private function provision(): array
    {
        $office = $this->office();
        $admin = $this->administrator($office);
        $employee = $this->employee($office);
        $issued = app(StaffActivationService::class)->issue($admin, $employee->id, $office->id, 'department_staff');
        return [$office, $admin, $employee, $issued];
    }

    public function test_administrator_invite_creates_inactive_linked_user_and_hashed_credential(): void
    {
        [$office, $admin, $employee, $issued] = $this->provision();
        $invite = $issued['invitation'];
        $employee->refresh();
        $this->assertNotNull($employee->user_id);
        $this->assertFalse($employee->user->is_active);
        $this->assertSame($office->id, $invite->department_id);
        $this->assertSame($employee->work_email, $employee->user->email);
        $this->assertSame(hash('sha256', $issued['token']), $invite->getRawOriginal('token_hash'));
        $this->assertNotSame($issued['token'], $invite->token_hash);
        $this->assertDatabaseHas('audit_logs', ['action'=>'identity.invitation.created', 'actor_user_id'=>$admin->id]);
    }

    public function test_invitation_creation_is_forbidden_to_nonadministrator_and_anonymous(): void
    {
        $office = $this->office();
        $employee = $this->employee($office);
        $staff = User::query()->create(['name'=>'Synthetic Staff', 'email'=>Str::random(8).'@example.test',
            'password'=>'SyntheticPassword2026Long!', 'role'=>'department_staff', 'is_active'=>true]);
        $this->employee($office, $staff);
        $payload = ['employee_id'=>$employee->id, 'department_id'=>$office->id, 'role'=>'department_staff'];
        $this->post('/admin/invitations', $payload)->assertRedirect();
        $this->actingAs($staff)->post('/admin/invitations', $payload)->assertForbidden();
        $this->assertDatabaseCount('staff_activation_invitations', 0);
    }

    public function test_stale_demoted_or_deactivated_administrator_cannot_issue_invitation(): void
    {
        foreach ([['role' => 'department_staff'], ['is_active' => false]] as $revocation) {
            $office = $this->office('STALE-ISSUE');
            $admin = $this->administrator($office);
            $employee = $this->employee($office);
            User::query()->whereKey($admin->id)->update($revocation);

            try {
                app(StaffActivationService::class)->issue(
                    $admin, $employee->id, $office->id, 'department_staff'
                );
                $this->fail('Stale administrator authority issued an invitation.');
            } catch (AuthorizationException) {
                $this->assertDatabaseCount('staff_activation_invitations', 0);
                $this->assertDatabaseMissing('audit_logs', [
                    'action' => 'identity.invitation.created',
                    'actor_user_id' => $admin->id,
                ]);
            }
        }
    }

    public function test_stale_demoted_administrator_cannot_revoke_invitation(): void
    {
        [$office, $admin, $employee, $issued] = $this->provision();
        User::query()->whereKey($admin->id)->update(['role' => 'department_staff']);

        try {
            app(StaffActivationService::class)->revoke($admin, $issued['invitation']->id);
            $this->fail('Stale administrator authority revoked an invitation.');
        } catch (AuthorizationException) {
            $this->assertNull($issued['invitation']->fresh()->revoked_at);
            $this->assertDatabaseMissing('audit_logs', [
                'action' => 'identity.invitation.revoked',
                'actor_user_id' => $admin->id,
            ]);
        }
    }

    public function test_current_administrator_can_issue_and_revoke_invitation(): void
    {
        [$office, $admin, $employee, $issued] = $this->provision();

        app(StaffActivationService::class)->revoke($admin, $issued['invitation']->id);

        $this->assertNotNull($issued['invitation']->fresh()->revoked_at);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'identity.invitation.created',
            'actor_user_id' => $admin->id,
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'identity.invitation.revoked',
            'actor_user_id' => $admin->id,
        ]);
    }

    public function test_office_and_role_escalation_are_denied(): void
    {
        [$office, $admin, $employee] = $this->provision();
        $other = $this->office('B');
        $this->expectException(ValidationException::class);
        app(StaffActivationService::class)->issue($admin, $employee->id, $other->id, 'system_admin');
    }

    public function test_invalid_office_binding_and_inactive_employment_fail_without_mutation(): void
    {
        $office = $this->office();
        $other = $this->office('OTHER');
        $admin = $this->administrator($office);
        $employee = $this->employee($office);
        try {
            app(StaffActivationService::class)->issue($admin, $employee->id, $other->id, 'department_staff');
            $this->fail('Cross-office assignment should be refused.');
        } catch (ValidationException) {
            $this->assertNull($employee->fresh()->user_id);
        }
        $employee->update(['employment_status'=>'inactive']);
        $this->expectException(ValidationException::class);
        app(StaffActivationService::class)->issue($admin, $employee->id, $office->id, 'department_staff');
    }

    public function test_activation_without_employee_number_uses_one_time_invitation_identity(): void
    {
        [$office, $admin, $employee, $issued] = $this->provision();
        $service = app(StaffActivationService::class);
        $this->assertNull($employee->employee_number);
        $this->assertSame($employee->id, $issued['invitation']->employee_id);
        $this->assertSame('valid', $service->status($issued['token']));
        $user = $service->redeem($issued['token'], 'SecureLongPassword2026!');
        $this->assertTrue($user->fresh()->is_active);
        $this->assertTrue(Hash::check('SecureLongPassword2026!', $user->fresh()->password));
        $this->assertNotSame('SecureLongPassword2026!', $user->fresh()->getRawOriginal('password'));
        $this->assertNotNull($issued['invitation']->fresh()->consumed_at);
        $this->assertSame('consumed', $service->status($issued['token']));
        $this->assertDatabaseHas('audit_logs', ['action'=>'identity.activation.completed', 'actor_user_id'=>$user->id]);
    }

    public function test_legacy_employee_number_is_retained_but_not_required_for_activation(): void
    {
        [$office, $admin, $employee, $issued] = $this->provision();
        $employee->update(['employee_number' => 'LEGACY-0042']);
        $user = app(StaffActivationService::class)->redeem($issued['token'], 'SecureLongPassword2026!');
        $this->assertTrue($user->fresh()->is_active);
        $this->assertSame('LEGACY-0042', $employee->fresh()->employee_number);
    }

    public function test_forged_and_replayed_tokens_are_denied(): void
    {
        [$office, $admin, $employee, $issued] = $this->provision();
        $service = app(StaffActivationService::class);
        $this->assertSame('invalid', $service->status(str_repeat('a', 64)));
        try {
            $service->redeem(str_repeat('a', 64), 'SecureLongPassword2026!');
            $this->fail('Forged token accepted.');
        } catch (ValidationException) {
            $this->assertFalse($employee->fresh()->user->is_active);
        }
        $service->redeem($issued['token'], 'SecureLongPassword2026!');
        $this->expectException(ValidationException::class);
        $service->redeem($issued['token'], 'AnotherSecurePassword2026!');
    }

    public function test_expired_and_revoked_tokens_are_denied(): void
    {
        [$office, $admin, $employee, $issued] = $this->provision();
        $service = app(StaffActivationService::class);
        $issued['invitation']->update(['expires_at'=>now()->subMinute()]);
        $this->assertSame('expired', $service->status($issued['token']));
        try {
            $service->redeem($issued['token'], 'SecureLongPassword2026!');
            $this->fail('Expired token accepted.');
        } catch (ValidationException) {
            $this->assertFalse($employee->fresh()->user->is_active);
        }
        $replacement = $service->issue($admin, $employee->id, $office->id, 'department_staff');
        $service->revoke($admin, $replacement['invitation']->id);
        $this->assertSame('revoked', $service->status($replacement['token']));
        $this->expectException(ValidationException::class);
        $service->redeem($replacement['token'], 'SecureLongPassword2026!');
    }

    public function test_invitation_rotation_invalidates_previous_token_and_preserves_one_user_link(): void
    {
        [$office, $admin, $employee, $issued] = $this->provision();
        $service = app(StaffActivationService::class);
        $rotated = $service->issue($admin, $employee->id, $office->id, 'department_head');
        $this->assertSame('revoked', $service->status($issued['token']));
        $this->assertSame('valid', $service->status($rotated['token']));
        $this->assertDatabaseCount('users', 2);
        $this->assertSame('department_head', $employee->fresh()->user->role);
    }

    public function test_activation_rechecks_department_and_employment_before_commit(): void
    {
        [$office, $admin, $employee, $issued] = $this->provision();
        $office->update(['is_active'=>false]);
        $this->assertSame('revoked', app(StaffActivationService::class)->status($issued['token']));
        $this->expectException(ValidationException::class);
        app(StaffActivationService::class)->redeem($issued['token'], 'SecureLongPassword2026!');
    }

    public function test_activation_http_handoff_preserves_privileged_mfa_requirement(): void
    {
        [$office, $admin, $employee, $issued] = $this->provision();
        $this->post('/activate-account/'.$issued['token'], [
            'password'=>'SecureLongPassword2026!',
            'password_confirmation'=>'SecureLongPassword2026!',
        ])->assertRedirect(route('mfa.enroll'));
        $user = $employee->fresh()->user;
        $this->assertAuthenticatedAs($user);
        $this->assertTrue(app(AuthenticationAssurance::class)->requiresMfa($user));
        $this->assertNull($user->mfa_confirmed_at);
    }

    public function test_only_zero_users_can_bootstrap_even_after_initial_account_is_removed(): void
    {
        $office = $this->office();
        $admin = $this->administrator($office);
        DB::table('initial_admin_bootstraps')->insert(['id'=>1,'user_id'=>$admin->id,'created_at'=>now()]);
        $admin->delete(); // Marker stays, and no privileged reinitialization is permitted.
        $this->artisan('talibon:bootstrap-first-admin', [
            '--email'=>'reinit@example.test', '--name'=>'Reinitializer',
            '--department-code'=>$office->code, '--position'=>'Synthetic',
        ])->assertExitCode(1);
    }

    public function test_administrator_http_issues_single_private_link_and_rejects_role_escalation(): void
    {
        $office = $this->office();
        $admin = $this->administrator($office);
        $employee = $this->employee($office);
        $this->actingAs($admin)->post('/admin/invitations', [
            'employee_id'=>$employee->id, 'department_id'=>$office->id, 'role'=>'department_staff',
        ])->assertRedirect(route('admin.invitations.index'))->assertSessionHas('staff_activation_link');
        $this->assertDatabaseCount('staff_activation_invitations', 1);
        $this->actingAs($admin)->post('/admin/invitations', [
            'employee_id'=>$employee->id, 'department_id'=>$office->id, 'role'=>'system_admin',
        ])->assertSessionHasErrors('role');
        $this->assertDatabaseCount('staff_activation_invitations', 1);
    }

    public function test_employee_deactivation_after_redemption_blocks_password_login(): void
    {
        [$office, $admin, $employee, $issued] = $this->provision();
        $user = app(StaffActivationService::class)->redeem(
            $issued['token'], 'SecureLongPassword2026!'
        );
        $employee->update(['employment_status'=>'inactive']);
        $this->post('/login', [
            'email'=>$user->email, 'password'=>'SecureLongPassword2026!',
        ])->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_employee_email_change_blocks_token_redemption(): void
    {
        [$office, $admin, $employee, $issued] = $this->provision();
        $employee->update(['work_email'=>'reassigned@example.test']);
        $this->assertSame('revoked', app(StaffActivationService::class)->status($issued['token']));
        $this->expectException(ValidationException::class);
        app(StaffActivationService::class)->redeem(
            $issued['token'], 'SecureLongPassword2026!'
        );
    }

}
