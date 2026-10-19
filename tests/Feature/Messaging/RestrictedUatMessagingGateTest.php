<?php

namespace Tests\Feature\Messaging;

use App\Http\Middleware\DenyUnapprovedMessaging;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

final class RestrictedUatMessagingGateTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_six_channels_and_cursor_variants_are_denied_without_payload_leakage(): void
    {
        $user = $this->makeStaff();
        $marker = 'R17-SYNTHETIC-SECRET-'.Str::random(12);
        Message::query()->create([
            'public_id' => (string) Str::uuid(),
            'channel' => 'General',
            'sender_user_id' => $user->id,
            'body' => $marker,
        ]);

        $this->actingAs($user)->get('/messages')->assertForbidden();

        foreach (\App\Messaging\MessagingChannels::all() as $channel) {
            foreach ([[], ['after' => 0], ['after' => 999999]] as $cursor) {
                $response = $this->getJson(route('messages.feed.index', array_merge(['channel' => $channel], $cursor)));
                $response->assertForbidden();
                $this->assertStringNotContainsString($marker, $response->getContent());
                $this->assertStringNotContainsString('sender', $response->getContent());
                $this->assertStringNotContainsString('office', $response->getContent());
            }
        }

        $this->getJson('/messages/feed?channel=Unknown')->assertForbidden();
        $this->getJson('/messages/feed?channel=General&after=not-an-integer')->assertForbidden();
        $this->assertDatabaseCount('prototype_messages', 1);
    }

    public function test_even_valid_and_malformed_authenticated_posts_cannot_persist_messages(): void
    {
        $user = $this->makeStaff();
        $this->actingAs($user);
        $initial = Message::query()->count();

        foreach ([...\App\Messaging\MessagingChannels::all(), 'Unknown'] as $channel) {
            $response = $this->postJson(route('messages.feed.store'), [
                'channel' => $channel,
                'body' => 'R17 synthetic test content',
                'sender_user_id' => 999999,
            ]);
            $response->assertForbidden();
            $this->assertStringNotContainsString('R17 synthetic test content', $response->getContent());
        }

        $this->postJson(route('messages.feed.store'), [])->assertForbidden();
        $this->assertSame($initial, Message::query()->count());
    }

    public function test_messaging_routes_keep_all_existing_auth_and_mfa_and_add_hard_denial(): void
    {
        foreach (['messages.index', 'messages.feed.index', 'messages.feed.store'] as $name) {
            $route = \Illuminate\Support\Facades\Route::getRoutes()->getByName($name);
            $this->assertNotNull($route, $name);
            $stack = $route->gatherMiddleware();
            $this->assertContains('auth', $stack, $name);
            $this->assertContains('active', $stack, $name);
            $this->assertContains('mfa.assured', $stack, $name);
            $this->assertContains(DenyUnapprovedMessaging::class, $stack, $name);
        }

        $this->assertContains('throttle:60,1', \Illuminate\Support\Facades\Route::getRoutes()
            ->getByName('messages.feed.store')->gatherMiddleware());
    }

    private function makeStaff(): User
    {
        $department = Department::query()->create([
            'code' => 'R17-SEC-'.Str::upper(Str::random(5)),
            'name' => 'R17 Synthetic Department',
            'short_name' => 'R17-SEC',
            'is_active' => true,
        ]);
        $user = User::query()->create([
            'name' => 'Synthetic R17 Security Tester',
            'email' => Str::lower(Str::random(12)).'@example.test',
            'password' => 'prototype-test-password',
            'role' => 'department_staff',
            'is_active' => true,
        ]);
        Employee::query()->create([
            'employee_number' => 'R17-'.Str::upper(Str::random(8)),
            'full_name' => $user->name,
            'work_email' => $user->email,
            'user_id' => $user->id,
            'department_id' => $department->id,
            'position_title' => 'Synthetic QA',
            'employment_status' => 'active',
        ]);

        return $user->fresh('employee.department');
    }
}
