<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AuthenticationRuntimeContractTest extends TestCase
{
    use RefreshDatabase;

    public function test_normal_login_routes_remain_and_showcase_routes_are_retired(): void
    {
        $this->assertTrue(Route::has('login'));
        $this->assertTrue(Route::has('login.store'));
        $this->assertFalse(Route::has('showcase.session.store'));
        $this->assertFalse(Route::has('showcase.session.switch'));

        $this->post('/showcase/session')->assertNotFound();
        $this->post('/showcase/switch')->assertNotFound();
    }

    public function test_privileged_session_requires_mfa_even_with_legacy_showcase_markers(): void
    {
        $user = User::query()->create([
            'name' => 'Retirement Security User',
            'email' => 'retirement-security@example.test',
            'password' => 'not-used',
            'role' => 'system_admin',
            'is_active' => true,
        ]);

        Auth::guard('web')->login($user);

        $this->withSession([
            'showcase.session' => true,
            'showcase.persona' => 'system_admin',
        ])->get('/dashboard')->assertRedirect(route('mfa.enroll'));
    }

    public function test_login_page_no_longer_receives_showcase_contract(): void
    {
        $this->get('/login')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Auth/Login')
                ->missing('showcase')
                ->missing('showcaseSession'));
    }
}
