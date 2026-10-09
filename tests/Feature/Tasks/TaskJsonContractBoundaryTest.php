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
