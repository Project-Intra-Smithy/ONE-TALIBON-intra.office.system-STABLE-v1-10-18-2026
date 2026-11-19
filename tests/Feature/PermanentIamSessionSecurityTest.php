<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

final class PermanentIamSessionSecurityTest extends TestCase
{
    use RefreshDatabase;

    private const OLD = 'Synthetic-Session-2026!';
    private const NEW = 'Synthetic-Changed-2026!';

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_real_ordinary_login_rejects_absent_malformed_and_stale_session_epochs(): void
    {
        $user = $this->account('employee');
        $this->login($user);
        $this->get('/security/account')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Auth/AccountSecurity')->where('requiresMfa', false));
        foreach ([null, '1', true, [], 0, 999] as $epoch) {
            if ($epoch === null) {
                session()->forget('auth_session_version');
            } else {
                $this->withSession(['auth_session_version' => $epoch]);
            }
            $this->get('/security/account')->assertRedirect(route('login'));
            $this->assertGuest();
            $this->login($user);
        }
        $this->post('/logout')->assertRedirect(route('login'));
        $this->put('/security/password', $this->passwordData())->assertRedirect(route('login'));
    }

    public function test_linked_legacy_eligibility_and_unlinked_email_compatibility(): void
    {
        $office = Department::query()->create(['code' => 'G2-LOGIN', 'name' => 'G2 login office', 'is_active' => true]);
        $user = $this->account('employee');
        $employee = Employee::query()->create([
            'full_name' => 'Synthetic employee', 'department_id' => $office->id, 'user_id' => $user->id,
            'position_title' => 'Staff', 'employment_status' => 'active',
        ]);
        $this->login($user);
        $office->update(['is_active' => false]);
        $this->get('/security/account')->assertRedirect(route('login'));
        $this->assertGuest();
        $this->post('/login', $this->credentials($user))->assertSessionHasErrors('email');
        $office->update(['is_active' => true]);
        $employee->update(['separation_date' => now()->toDateString()]);
        $this->post('/login', $this->credentials($user))->assertSessionHasErrors('email');
        $employee->update(['separation_date' => null]);
        $this->login($user);
        $this->post('/logout');
        $this->login($this->account('employee'));
    }

    public function test_password_change_is_self_only_atomic_and_requires_current_password_and_epoch(): void
    {
        $user = $this->account('employee');
        $other = $this->account('employee');
        $this->login($user);
        $old = (int) $user->session_version;
        $user->forceFill(['remember_token' => Str::random(60)])->save();
        $before = $user->fresh()->getAttributes();
        $this->put('/security/password', $this->passwordData('incorrect'))
            ->assertSessionHasErrors('current_password');
        $this->assertSame($before, $user->fresh()->getAttributes());
        $this->assertDatabaseMissing('audit_logs', ['action' => 'identity.password.changed', 'actor_user_id' => $user->id]);
        $otherBefore = $other->fresh()->getAttributes();
        $this->from('/security/account')->put('/security/password', $this->passwordData() + ['user_id' => $other->id])
            ->assertRedirect('/security/account')->assertSessionHasNoErrors();
        $current = $user->fresh();
        $this->assertTrue(Hash::check(self::NEW, $current->password));
        $this->assertFalse(Hash::check(self::OLD, $current->password));
        $this->assertNull($current->remember_token);
        $this->assertSame($old + 1, $current->session_version);
        $this->assertSame($old + 1, session()->get('auth_session_version'));
        $this->assertSame($otherBefore, $other->fresh()->getAttributes());
        $this->assertDatabaseHas('audit_logs', ['action' => 'identity.password.changed', 'actor_user_id' => $user->id, 'outcome' => 'allowed']);
        $this->get('/security/account')->assertOk();
        $this->withSession(['auth_session_version' => $old])->get('/security/account')->assertRedirect(route('login'));
        $this->post('/login', $this->credentials($user))->assertSessionHasErrors('email');
        $this->post('/login', $this->credentials($user, self::NEW))->assertRedirect(route('dashboard'));
    }

    public function test_legacy_remember_cookie_cannot_establish_an_epoch_before_or_after_password_change(): void
    {
        $user = $this->account('employee');
        $token = Str::random(60);
        $user->forceFill(['remember_token' => $token])->save();
        $guard = Auth::guard('web');
        $cookieName = $guard->getRecallerName();
        $cookie = $user->id.'|'.$token.'|'.$guard->hashPasswordForCookie($user->password);
        Auth::forgetGuards();
        $this->withCookie($cookieName, $cookie)->get('/security/account')->assertRedirect(route('login'))->assertCookieExpired($cookieName);
        $this->assertGuest();
        $this->assertDatabaseHas('audit_logs', ['actor_user_id' => $user->id, 'action' => 'auth.account.deactivated_forced_logout']);
        Auth::forgetGuards();
        // Clear the test cookie to prove a fresh password login works.
        $this->withCookie($cookieName, '')->post('/login', $this->credentials($user) + ['remember' => true])
            ->assertRedirect(route('dashboard'));
        $this->assertNull($user->fresh()->remember_token);
        // Simulate a token previously issued to a second device before the change.
        $user->forceFill(['remember_token' => $token])->save();
        $this->put('/security/password', $this->passwordData())->assertSessionHasNoErrors();
        $this->assertNull($user->fresh()->remember_token);
        $this->post('/logout')->assertRedirect(route('login'));
        Auth::forgetGuards();
        $this->withCookie($cookieName, $cookie)->get('/security/account')->assertRedirect(route('login'));
        $this->assertGuest();
        $this->assertSame(1, AuditLog::query()->where('action', 'identity.password.changed')->where('actor_user_id', $user->id)->count());
    }

    public function test_real_privileged_totp_is_required_for_password_and_settings(): void
    {
        $user = $this->account('system_admin');
        $secret = app(Google2FA::class)->generateSecretKey();
        $user->forceFill(['mfa_secret' => $secret, 'mfa_confirmed_at' => now(), 'mfa_version' => 1])->save();
        $this->post('/login', $this->credentials($user))->assertRedirect(route('mfa.challenge'));
        $before = $user->fresh()->getAttributes();
        $this->get('/security/account')->assertRedirect(route('mfa.challenge'));
        $this->put('/security/password', $this->passwordData())->assertRedirect(route('mfa.challenge'));
        $this->assertSame($before, $user->fresh()->getAttributes());
        $this->post('/security/mfa/challenge', ['code' => app(Google2FA::class)->getCurrentOtp($secret)])
            ->assertRedirect(route('account.security'));
        $this->get('/security/account')->assertOk();
        $this->from('/security/account')->put('/security/password', $this->passwordData())->assertSessionHasNoErrors();
        $this->get('/security/mfa')->assertOk();
        $this->assertSame(1, $user->fresh()->mfa_version);
        $this->assertTrue(Hash::check(self::NEW, $user->fresh()->password));
    }

    public function test_direct_protected_actor_guards_deny_inconsistent_status_and_separation(): void
    {
        $office = Department::query()->create(['code' => 'G2-DIRECT', 'name' => 'G2 direct office', 'is_active' => true]);
        $user = $this->account('department_staff');
        $employee = Employee::query()->create([
            'full_name' => 'Synthetic direct actor', 'department_id' => $office->id, 'user_id' => $user->id,
            'position_title' => 'Staff', 'employment_status' => 'active',
        ]);
        // These domain services are called directly to bypass route middleware.
        Auth::guard('web')->login($user);
        $verified = fn () => \App\Domain\Identity\VerifiedMunicipalActor::forProtectedSource($user);
        $search = fn () => \App\Domain\Identity\VerifiedMunicipalActor::forCurrentSession($user);
        $task = fn () => app(\App\Domain\Tasks\TaskCoreAccess::class)->verifiedActor($user);
        $transaction = app(\App\Domain\Workflow\Authorization\TransactionActorEligibility::class);
        $this->assertSame($user->id, $verified()->user()->id);
        $this->assertSame($user->id, $search()->user()->id);
        $this->assertSame($user->id, $task()->id);
        $this->assertNotNull($transaction->resolve($user));
        foreach (['status', 'separation'] as $condition) {
            if ($condition === 'status') {
                User::query()->whereKey($user->id)->update(['account_status' => 'suspended']);
            } else {
                User::query()->whereKey($user->id)->update(['account_status' => 'active']);
                $employee->update(['separation_date' => now()->toDateString()]);
            }
            foreach ([$verified, $search, $task] as $operation) {
                try {
                    $operation();
                    $this->fail('Direct actor eligibility unexpectedly granted.');
                } catch (\Illuminate\Auth\Access\AuthorizationException) {
                    $this->assertTrue(true);
                }
            }
            $this->assertNull($transaction->resolve($user));
        }
    }

    public function test_recovery_invalidates_existing_recall_token_and_password(): void
    {
        $admin = $this->account('system_admin');
        $office = Department::query()->create(['code' => 'G2-RECOVERY', 'name' => 'G2 recovery office', 'is_active' => true]);
        $employee = Employee::query()->create([
            'full_name' => 'Synthetic recovery employee', 'department_id' => $office->id,
            'position_title' => 'Staff', 'employment_status' => 'active',
        ]);
        $service = app(\App\Services\StaffActivationService::class);
        $issued = $service->issue($admin, ['employee_id' => $employee->id, 'username' => 'g2.recover', 'role' => 'department_staff']);
        $user = $service->redeem($issued['code'], self::OLD);
        $token = Str::random(60);
        $user->forceFill(['remember_token' => $token])->save();
        $guard = Auth::guard('web');
        $name = $guard->getRecallerName();
        $cookie = $user->id.'|'.$token.'|'.$guard->hashPasswordForCookie($user->password);
        $epoch = $user->session_version;
        $service->recover($admin, $user);
        $fresh = $user->fresh();
        $this->assertSame('pending', $fresh->account_status);
        $this->assertSame($epoch + 1, $fresh->session_version);
        $this->assertNull($fresh->remember_token);
        $this->assertFalse(Hash::check(self::OLD, $fresh->password));
        Auth::forgetGuards();
        $this->withCookie($name, $cookie)->get('/security/account')->assertRedirect(route('login'));
        $this->assertGuest();
        $this->withCookie($name, '')->post('/login', ['login' => $user->username, 'password' => self::OLD])->assertSessionHasErrors('login');
    }

    private function account(string $role): User
    {
        return User::query()->create([
            'name' => 'Synthetic session user', 'email' => Str::uuid().'@example.test',
            'password' => self::OLD, 'role' => $role, 'is_active' => true,
        ]);
    }

    private function credentials(User $user, string $password = self::OLD): array
    {
        return ['email' => $user->email, 'password' => $password];
    }

    private function login(User $user): void
    {
        $this->post('/login', $this->credentials($user))->assertRedirect(route('dashboard'))
            ->assertSessionHas('auth_session_version', (int) $user->fresh()->session_version);
        $this->assertAuthenticatedAs($user);
    }

    private function passwordData(string $current = self::OLD): array
    {
        return ['current_password' => $current, 'password' => self::NEW, 'password_confirmation' => self::NEW];
    }
}
