<?php

namespace Tests\Feature\Tasks;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

final class TaskJsonContractBoundaryTest extends TestCase
{
    use RefreshDatabase;

    public function test_tasks_are_json_only_even_without_an_accept_header(): void
    {
        $this->get('/tasks')->assertUnauthorized()->assertHeader('Content-Type', 'application/json');
        $this->post('/tasks', ['title' => 'No session'])
            ->assertUnauthorized()->assertHeader('Content-Type', 'application/json');

        $this->get('/tasks/not-a-number')
            ->assertNotFound()->assertHeader('Content-Type', 'application/json');
    }

    public function test_validation_and_missing_ids_are_json_without_fetch_headers(): void
    {
        $actor = $this->staff('browser');
        $this->actingAs($actor);

        $this->post('/tasks', ['title' => ' '])
            ->assertUnprocessable()->assertJsonValidationErrors('title');

        $this->post('/tasks', ['title' => 'Draft'])
            ->assertCreated()->assertJsonPath('data.state', 'open');

        $this->get('/tasks/999999')
            ->assertNotFound()->assertHeader('Content-Type', 'application/json');
    }

    public function test_mfa_pending_and_inactive_sessions_never_redirect_from_tasks(): void
    {
        $actor = $this->staff('privileged');
        $actor->forceFill(['role' => 'department_head'])->save();
        // Bypass TestCase::actingAs() here because it auto-fulfills MFA.
        auth()->guard('web')->login($actor);

        $this->get('/tasks')->assertForbidden()
            ->assertJsonPath('code', 'MFA_REQUIRED')
            ->assertJsonPath('next_url', '/security/mfa/enroll');
        $this->post('/tasks', ['title' => 'Denied'])->assertForbidden()
            ->assertJsonPath('code', 'MFA_REQUIRED');

        // Inactive account middleware precedes the MFA gate.
        $actor->forceFill(['is_active' => false])->save();
        $this->get('/tasks')->assertUnauthorized()
            ->assertJsonPath('code', 'ACCOUNT_INACTIVE');
    }

    public function test_task_post_stays_in_web_middleware_group_for_csrf_enforcement(): void
    {
        $route = app('router')->getRoutes()->match(Request::create('/tasks', 'POST'));
        $this->assertContains('web', $route->gatherMiddleware());
        $this->assertContains('auth', $route->gatherMiddleware());
        $this->assertContains('active', $route->gatherMiddleware());
        $this->assertContains('mfa.assured', $route->gatherMiddleware());
    }

    public function test_mfa_pending_task_get_preserves_browser_intent_after_assurance(): void
    {
        $actor = $this->staff('intended');
        $actor->forceFill([
            'role' => 'department_head',
            'mfa_secret' => 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
            'mfa_confirmed_at' => now(),
            'mfa_version' => 1,
        ])->save();
        // Login without TestCase::actingAs, which deliberately satisfies MFA.
        auth()->guard('web')->login($actor);

        $destination = route('dashboard');
        $this->withSession(['url.intended' => $destination]);

        $this->get('/tasks')->assertForbidden()
            ->assertJsonPath('code', 'MFA_REQUIRED')
            ->assertJsonPath('next_url', '/security/mfa/challenge')
            ->assertSessionHas('url.intended', $destination);

        // Simulate a session whose MFA assurance was completed elsewhere.
        // This checks post-assurance redirection, not OTP verification.
        $this->withSession([
            \\App\\Services\\AuthenticationAssurance::SESSION_USER_KEY => $actor->id,
            \\App\\Services\\AuthenticationAssurance::SESSION_VERSION_KEY => 1,
            \\App\\Services\\AuthenticationAssurance::SESSION_VERIFIED_AT_KEY => now()->getTimestamp(),
        ]);
        $this->get('/security/mfa/challenge')->assertRedirect($destination);
    }

    public function test_first_mfa_pending_task_get_does_not_create_browser_intent(): void
    {
        $actor = $this->staff('no-intent');
        $actor->forceFill(['role' => 'department_head'])->save();
        auth()->guard('web')->login($actor);

        $this->get('/tasks')->assertForbidden()
            ->assertJsonPath('code', 'MFA_REQUIRED')
            ->assertSessionMissing('url.intended');
    }

    public function test_json_accept_boundary_does_not_rewrite_non_task_requests(): void
    {
        $middleware = new \\App\\Http\\Middleware\\EnsureTaskJsonAccept();

        foreach (['/login', '/dashboard', '/api/v1/example', '/tasks-export'] as $path) {
            $request = Request::create($path, 'GET');
            $request->headers->set('Accept', 'text/html');
            $middleware->handle($request, static fn () => response('ok'));
            $this->assertSame('text/html', $request->header('Accept'), $path);
        }

        $request = Request::create('/tasks', 'GET');
        $request->headers->set('Accept', 'text/html');
        $middleware->handle($request, static fn () => response('ok'));
        $this->assertSame('application/json', $request->header('Accept'));
    }

    /** This is not a browser CSRF e2e test; testing env bypasses token checking. */
    private function staff(string $suffix): User
    {
        $user = User::query()->create([
            'name' => 'C1 '.$suffix,
            'email' => 'c1-'.$suffix.'@example.test',
            'password' => 'test-only',
            'is_active' => true,
        ]);
        $office = Department::query()->create([
            'code' => 'C1-'.strtoupper($suffix),
            'name' => 'C1 '.$suffix.' Office',
            'is_active' => true,
        ]);
        Employee::query()->create([
            'employee_number' => 'C1-'.$suffix,
            'full_name' => 'C1 '.$suffix,
            'user_id' => $user->id,
            'department_id' => $office->id,
            'position_title' => 'Staff',
            'employment_status' => 'active',
        ]);

        return $user;
    }
}
