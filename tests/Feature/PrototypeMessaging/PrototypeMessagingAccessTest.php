<?php

namespace Tests\Feature\PrototypeMessaging;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class PrototypeMessagingAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_list_or_send(): void
    {
        $this->getJson(route('messages.prototype.index', ['channel' => 'General']))
            ->assertUnauthorized();
        $this->postJson(route('messages.prototype.store'), [
            'channel' => 'General',
            'body' => 'Should not persist',
        ])->assertUnauthorized();

        $this->assertDatabaseCount('prototype_messages', 0);
    }

    public function test_inactive_authenticated_user_is_forced_out_before_prototype_access(): void
    {
        $user = $this->makeUser(false);

        $this->be($user)
            ->get(route('messages.prototype.index', ['channel' => 'General']))
            ->assertRedirect(route('login'));
    }

    public function test_privileged_user_without_mfa_assurance_cannot_access_prototype_messages(): void
    {
        $user = $this->makeUser(true);

        $this->be($user)
            ->get(route('messages.prototype.index', ['channel' => 'General']))
            ->assertRedirect(route('mfa.enroll'));
    }

    private function makeUser(bool $active): User
    {
        return User::query()->create([
            'name' => $active ? 'MFA Boundary User' : 'Inactive User',
            'email' => $active ? 'mfa-boundary@example.test' : 'inactive@example.test',
            'password' => 'prototype-test-password',
            'role' => 'department_staff',
            'is_active' => $active,
        ]);
    }
}
