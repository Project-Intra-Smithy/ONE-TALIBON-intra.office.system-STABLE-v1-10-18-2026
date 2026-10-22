<?php

namespace Tests\Feature;

use App\Domain\Identity\GoogleOidcProfile;
use App\Models\Department;
use App\Models\Employee;
use App\Models\GoogleIdentityBinding;
use App\Models\User;
use App\Services\AuthenticationAssurance;
use App\Services\GoogleOidcAccountService;
use App\Services\GoogleOidcFlow;
use App\Http\Controllers\Auth\GoogleOidcController;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;
use Mockery;
use Tests\TestCase;

final class GoogleOidcIdentityContractTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config()->set('google_oidc.enabled', true);
        config()->set('services.google', [
            'client_id' => 'synthetic.apps.googleusercontent.com',
            'client_secret' => 'synthetic-only',
            'redirect' => 'https://example.test/auth/google/callback',
        ]);
    }

    public function test_unbound_subject_is_denied_even_if_approved_user_email_matches(): void
    {
        $this->employeeUser('employee', 'staff@example.test');
        $this->expectException(AuthorizationException::class);

        app(GoogleOidcAccountService::class)->signIn(
            $this->requestWithSession(), new GoogleOidcProfile('never-linked', 'staff@example.test'),
        );
    }

    public function test_link_without_recent_real_mfa_is_denied(): void
    {
        $user = $this->employeeUser('employee', 'staff@example.test');
        Auth::guard('web')->login($user);
        $this->expectException(AuthorizationException::class);

        app(GoogleOidcAccountService::class)->link(
            $this->requestWithSession(), (int) $user->id,
            new GoogleOidcProfile('provider-sub-1', 'staff@example.test'),
        );
    }

    public function test_subject_bound_to_another_user_cannot_be_stolen(): void
    {
        $owner = $this->employeeUser('employee', 'owner@example.test');
        $actor = $this->employeeUser('system_admin', 'other@example.test');
        $this->binding($owner, 'subject-collision', 'owner@example.test');
        $request = $this->assuredRequest($actor);

        $this->expectException(AuthorizationException::class);
        app(GoogleOidcAccountService::class)->link(
            $request, (int) $actor->id,
            new GoogleOidcProfile('subject-collision', 'other@example.test'),
        );
    }

    public function test_existing_binding_cannot_be_overwritten_by_another_subject(): void
    {
        $actor = $this->employeeUser('system_admin', 'staff@example.test');
        $this->binding($actor, 'original-sub', 'staff@example.test');
        $request = $this->assuredRequest($actor);
        $this->expectException(AuthorizationException::class);

        app(GoogleOidcAccountService::class)->link(
            $request, (int) $actor->id,
            new GoogleOidcProfile('different-sub', 'staff@example.test'),
        );
    }

    public function test_inactive_user_is_denied_even_with_preapproved_subject(): void
    {
        $user = $this->employeeUser('employee', 'staff@example.test');
        $this->binding($user, 'subject-inactive', 'staff@example.test');
        $user->forceFill(['is_active' => false])->save();

        $this->expectException(AuthorizationException::class);
        app(GoogleOidcAccountService::class)->signIn(
            $this->requestWithSession(), new GoogleOidcProfile('subject-inactive', 'staff@example.test'),
        );
    }

    public function test_revoked_employee_is_denied(): void
    {
        $user = $this->employeeUser('employee', 'staff@example.test');
        $this->binding($user, 'subject-revoked', 'staff@example.test');
        $user->employee->forceFill(['employment_status' => 'separated'])->save();

        $this->expectException(AuthorizationException::class);
        app(GoogleOidcAccountService::class)->signIn(
            $this->requestWithSession(), new GoogleOidcProfile('subject-revoked', 'staff@example.test'),
        );
    }

    public function test_inactive_department_is_denied(): void
    {
        $user = $this->employeeUser('employee', 'staff@example.test');
        $this->binding($user, 'subject-department', 'staff@example.test');
        $user->employee->department->forceFill(['is_active' => false])->save();

        $this->expectException(AuthorizationException::class);
        app(GoogleOidcAccountService::class)->signIn(
            $this->requestWithSession(), new GoogleOidcProfile('subject-department', 'staff@example.test'),
        );
    }

    public function test_revoked_google_binding_is_denied(): void
    {
        $user = $this->employeeUser('employee', 'staff@example.test');
        $binding = $this->binding($user, 'subject-revoked-binding', 'staff@example.test');
        $binding->forceFill(['revoked_at' => now()])->save();

        $this->expectException(AuthorizationException::class);
        app(GoogleOidcAccountService::class)->signIn(
            $this->requestWithSession(), new GoogleOidcProfile('subject-revoked-binding', 'staff@example.test'),
        );
    }

    public function test_mismatched_provider_email_cannot_retarget_bound_subject(): void
    {
        $user = $this->employeeUser('employee', 'staff@example.test');
        $this->binding($user, 'subject-email', 'staff@example.test');

        $this->expectException(AuthorizationException::class);
        app(GoogleOidcAccountService::class)->signIn(
            $this->requestWithSession(), new GoogleOidcProfile('subject-email', 'attacker@example.test'),
        );
    }

    public function test_preauthorized_sign_in_preserves_role_and_requires_new_privileged_mfa(): void
    {
        $user = $this->employeeUser('system_admin', 'admin@example.test');
        $this->binding($user, 'subject-approved', 'admin@example.test');
        $request = $this->requestWithSession();
        $request->session()->put([
            AuthenticationAssurance::SESSION_USER_KEY => $user->id,
            AuthenticationAssurance::SESSION_VERIFIED_AT_KEY => now()->getTimestamp(),
            AuthenticationAssurance::SESSION_VERSION_KEY => 1,
        ]);

        $signedIn = app(GoogleOidcAccountService::class)->signIn(
            $request, new GoogleOidcProfile('subject-approved', 'admin@example.test'),
        );

        $this->assertSame($user->id, $signedIn->id);
        $this->assertSame($user->id, Auth::guard('web')->id());
        $this->assertSame('system_admin', $signedIn->role);
        $this->assertSame(1, User::query()->count());
        $this->assertFalse($request->session()->has(AuthenticationAssurance::SESSION_VERIFIED_AT_KEY));
        $this->assertTrue(app(AuthenticationAssurance::class)->requiresMfa($signedIn));
    }

    public function test_socialite_invalid_oauth_state_cannot_authenticate(): void
    {
        $request = $this->requestWithSession();
        $request = Request::create('/auth/google/callback?code=synthetic', 'GET');
        $session = app('session')->driver();
        $session->start();
        $request->setLaravelSession($session);
        app(GoogleOidcFlow::class)->begin($request, 'signin');

        $driver = Mockery::mock();
        $driver->shouldReceive('user')->once()->andThrow(new InvalidStateException());
        Socialite::shouldReceive('driver')->with('google')->once()->andReturn($driver);

        $response = app(GoogleOidcController::class)->callback($request);

        $this->assertSame(302, $response->getStatusCode());
        $this->assertFalse(Auth::guard('web')->check());
    }

    private function employeeUser(string $role, string $email): User
    {
        $index = User::query()->count() + 1;
        $department = Department::query()->create([
            'code' => 'SYN-'.$index, 'name' => 'Synthetic department '.$index,
            'is_active' => true,
        ]);
        $user = User::query()->create([
            'name' => 'Synthetic employee '.$index,
            'email' => $email,
            'password' => 'synthetic-only-password',
            'role' => $role,
            'is_active' => true,
        ]);
        $user->forceFill(['email_verified_at' => now()])->save();
        Employee::query()->create([
            'employee_number' => 'SYN-'.$index,
            'full_name' => $user->name,
            'work_email' => $user->email,
            'user_id' => $user->id,
            'department_id' => $department->id,
            'position_title' => 'Synthetic officer',
            'employment_status' => 'active',
        ]);

        return $user->fresh('employee.department');
    }

    private function binding(User $user, string $subject, string $email): GoogleIdentityBinding
    {
        $binding = new GoogleIdentityBinding();
        $binding->forceFill([
            'user_id' => $user->id,
            'google_subject' => $subject,
            'verified_email_at_link' => $email,
            'linked_by_user_id' => $user->id,
            'linked_at' => now(),
        ])->save();

        return $binding;
    }

    private function requestWithSession(): Request
    {
        $request = Request::create('/synthetic/google', 'GET');
        $session = app('session')->driver();
        $session->start();
        $request->setLaravelSession($session);
        $request->setUserResolver(static fn (): ?User => Auth::guard('web')->user());

        return $request;
    }

    private function assuredRequest(User $user): Request
    {
        $request = $this->requestWithSession();
        $user->forceFill([
            'mfa_secret' => 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
            'mfa_confirmed_at' => now(),
            'mfa_version' => 1,
        ])->save();
        Auth::guard('web')->login($user);
        $request->session()->put([
            AuthenticationAssurance::SESSION_USER_KEY => $user->id,
            AuthenticationAssurance::SESSION_VERIFIED_AT_KEY => now()->getTimestamp(),
            AuthenticationAssurance::SESSION_VERSION_KEY => 1,
        ]);

        return $request;
    }
}
