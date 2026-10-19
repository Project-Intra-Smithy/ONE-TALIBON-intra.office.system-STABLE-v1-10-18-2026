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

final class MessageListTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(DenyUnapprovedMessaging::class);
    }

    public function test_initial_list_is_bounded_chronological_and_channel_isolated(): void
    {
        $user = $this->makeUser('List User', 'list@example.test', 'MPDO');
        $generalCursors = [];
        for ($index = 1; $index <= 55; $index++) {
            $generalCursors[] = $this->makeMessage($user, 'General', "General {$index}")->id;
        }
        $this->makeMessage($user, 'MPDO Planning', 'Other channel');

        $response = $this->actingAs($user)->getJson(route('messages.feed.index', [
            'channel' => 'General',
        ]));

        $response->assertOk()->assertJsonCount(50, 'data');
        $data = $response->json('data');
        $this->assertSame('General 6', $data[0]['body']);
        $this->assertSame('General 55', $data[49]['body']);
        $this->assertSame(array_slice($generalCursors, 5), array_column($data, 'cursor'));
        $this->assertNotContains('Other channel', array_column($data, 'body'));
    }

    public function test_after_cursor_returns_only_newer_messages_in_order(): void
    {
        $user = $this->makeUser('Cursor User', 'cursor@example.test', 'MBO');
        $first = $this->makeMessage($user, 'Department Heads', 'First');
        $second = $this->makeMessage($user, 'Department Heads', 'Second');
        $third = $this->makeMessage($user, 'Department Heads', 'Third');

        $response = $this->actingAs($user)->getJson(route('messages.feed.index', [
            'channel' => 'Department Heads',
            'after' => $first->id,
        ]));

        $response->assertOk()->assertJsonCount(2, 'data');
        $this->assertSame([$second->id, $third->id], array_column($response->json('data'), 'cursor'));
    }

    public function test_list_exposes_real_sender_identity_and_mine_state_without_private_ids(): void
    {
        $viewer = $this->makeUser('Viewer User', 'viewer@example.test', 'MPDO');
        $other = $this->makeUser('Other Employee', 'other@example.test', 'MEO');
        $this->makeMessage($other, 'General', 'Incoming message');

        $response = $this->actingAs($viewer)->getJson(route('messages.feed.index', [
            'channel' => 'General',
        ]));

        $response->assertOk()
            ->assertJsonPath('data.0.sender.name', 'Other Employee')
            ->assertJsonPath('data.0.sender.office', 'MEO')
            ->assertJsonPath('data.0.isMine', false)
            ->assertJsonMissingPath('data.0.sender_user_id');
    }

    private function makeMessage(User $sender, string $channel, string $body): Message
    {
        return Message::query()->create([
            'public_id' => Str::uuid()->toString(),
            'channel' => $channel,
            'sender_user_id' => $sender->id,
            'body' => $body,
        ]);
    }

    private function makeUser(string $name, string $email, string $office): User
    {
        $department = Department::query()->create([
            'code' => $office.'-'.Str::lower(Str::random(5)),
            'name' => $office.' Office',
            'short_name' => $office,
            'is_active' => true,
        ]);
        $user = User::query()->create([
            'name' => $name,
            'email' => $email,
            'password' => 'prototype-test-password',
            'role' => 'department_staff',
            'is_active' => true,
        ]);
        Employee::query()->create([
            'employee_number' => 'EMP-'.Str::upper(Str::random(8)),
            'full_name' => $name,
            'work_email' => $email,
            'user_id' => $user->id,
            'department_id' => $department->id,
            'position_title' => 'Prototype Tester',
            'employment_status' => 'active',
        ]);

        return $user;
    }
}
