<?php

namespace Tests\Feature\Messaging;

use App\Http\Middleware\DenyUnapprovedMessaging;
use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

final class MessageStoreTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(DenyUnapprovedMessaging::class);
    }

    public function test_assured_user_can_send_with_real_identity_and_persistence(): void
    {
        $user = $this->makeUser('Sender User', 'sender@example.test', 'MPDO');

        $response = $this->actingAs($user)->postJson(route('messages.feed.store'), [
            'channel' => 'Department Heads',
            'body' => '  Budget files are ready for review.  ',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.body', 'Budget files are ready for review.')
            ->assertJsonPath('data.channel', 'Department Heads')
            ->assertJsonPath('data.sender.name', 'Sender User')
            ->assertJsonPath('data.sender.office', 'MPDO')
            ->assertJsonPath('data.isMine', true)
            ->assertJsonMissingPath('data.sender_user_id');

        $publicId = $response->json('data.publicId');
        $this->assertTrue(Str::isUuid($publicId));
        $this->assertDatabaseHas('prototype_messages', [
            'public_id' => $publicId,
            'channel' => 'Department Heads',
            'sender_user_id' => $user->id,
            'body' => 'Budget files are ready for review.',
        ]);
    }

    public function test_client_cannot_spoof_sender_and_public_ids_are_unique(): void
    {
        $sender = $this->makeUser('Actual Sender', 'actual@example.test', 'MBO');
        $other = $this->makeUser('Spoof Target', 'spoof@example.test', 'MEO');

        $first = $this->actingAs($sender)->postJson(route('messages.feed.store'), [
            'channel' => 'General',
            'body' => 'First prototype message',
            'sender_user_id' => $other->id,
        ])->assertCreated();
        $second = $this->actingAs($sender)->postJson(route('messages.feed.store'), [
            'channel' => 'General',
            'body' => 'Second prototype message',
        ])->assertCreated();

        $this->assertDatabaseHas('prototype_messages', [
            'public_id' => $first->json('data.publicId'),
            'sender_user_id' => $sender->id,
        ]);
        $this->assertNotSame($first->json('data.publicId'), $second->json('data.publicId'));
    }

    public function test_store_rejects_invalid_empty_whitespace_and_over_limit_input(): void
    {
        $user = $this->makeUser('Validation User', 'validation@example.test', 'MPDO');
        $this->actingAs($user);

        $this->postJson(route('messages.feed.store'), [
            'channel' => 'Unknown Channel',
            'body' => 'Hello',
        ])->assertUnprocessable()->assertJsonValidationErrors('channel');

        foreach (['', '   ', "\u{00A0}\u{2003}"] as $body) {
            $this->postJson(route('messages.feed.store'), [
                'channel' => 'General',
                'body' => $body,
            ])->assertUnprocessable()->assertJsonValidationErrors('body');
        }

        $this->postJson(route('messages.feed.store'), [
            'channel' => 'General',
            'body' => str_repeat('a', 2001),
        ])->assertUnprocessable()->assertJsonValidationErrors('body');
    }

    public function test_html_like_body_is_returned_as_plain_text_data(): void
    {
        $user = $this->makeUser('Text User', 'text@example.test', 'MPDO');
        $body = '<script>alert("prototype")</script>';

        $this->actingAs($user)->postJson(route('messages.feed.store'), [
            'channel' => 'General',
            'body' => $body,
        ])->assertCreated()->assertJsonPath('data.body', $body);

        $this->assertDatabaseHas('prototype_messages', ['body' => $body]);
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
