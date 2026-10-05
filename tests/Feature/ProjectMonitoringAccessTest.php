<?php

namespace Tests\Feature;

use App\Http\Middleware\RequireMfaAssurance;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProjectMonitoringAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(RequireMfaAssurance::class);
    }

    public function test_department_head_can_open_project_monitoring(): void
    {
        $user = $this->user('department_head');

        $this->actingAs($user)
            ->get('/operations')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('ProjectMonitoring/Index'));
    }

    public function test_employee_remains_denied_project_monitoring(): void
    {
        $user = $this->user('employee');

        $this->actingAs($user)->get('/operations')->assertForbidden();
    }

    private function user(string $role): User
    {
        return User::query()->create([
            'name' => 'Project Monitoring Access User',
            'email' => $role.'-operations@example.test',
            'password' => 'not-used',
            'role' => $role,
            'is_active' => true,
        ]);
    }
}
