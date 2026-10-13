<?php

namespace Tests\Feature\CommonCoordination;

use App\Models\CalendarEvent;
use App\Models\Department;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\MemoRecipient;
use App\Models\Memorandum;
use App\Models\PlatformNotification;
use App\Models\User;
use App\Services\CommonCoordination\CommonCoordinationReader;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

final class CommonCoordinationReaderTest extends TestCase
{
    use RefreshDatabase;

    public function test_source_metadata_is_rebuilt_for_owner_and_foreign_receipts_are_masked(): void
    {
        $owner = $this->actor($this->department());
        $foreign = $this->actor($this->department());
        $leave = $this->leave($owner);
        $this->notify($owner, $leave, 'poisoned title', 'https://external.example/secret');
        $this->notify($foreign, $leave, 'stolen source', '/secrets');

        $actual = $this->read($owner);
        $this->assertCount(1, $actual['notifications']['leave_updates']);
        $this->assertSame('Leave request update', $actual['notifications']['leave_updates'][0]['title']);
        $this->assertSame('/hris', $actual['notifications']['leave_updates'][0]['url']);
        $this->assertStringNotContainsString('poisoned title', json_encode($actual));
        $this->assertEmpty($this->read($foreign)['notifications']['leave_updates']);
    }

    public function test_revocation_department_deactivation_and_expiry_fail_closed(): void
    {
        $office = $this->department();
        $actor = $this->actor($office);
        $leave = $this->leave($actor);
        $receipt = $this->notify($actor, $leave);
        $this->assertCount(1, $this->read($actor)['notifications']['leave_updates']);

        $receipt->update(['expires_at' => now()->subSecond()]);
        $this->assertEmpty($this->read($actor)['notifications']['leave_updates']);
        $receipt->update(['expires_at' => null]);
        $leave->delete();
        $this->assertEmpty($this->read($actor)['notifications']['leave_updates']);

        $actor->update(['is_active' => false]);
        $this->assertSame([], $this->read($actor)['chats']);
        $actor->update(['is_active' => true]);
        $office->update(['is_active' => false]);
        $this->assertSame([], $this->read($actor)['chats']);
    }

    public function test_moved_or_departed_actor_cannot_reuse_loaded_employee_scope(): void
    {
        $office = $this->department();
        $actor = $this->actor($office);
        $other = $this->department();
        $actor->load('employee.department');
        $actor->employee->update(['employment_status' => 'separated']);
        $this->assertSame([], $this->read($actor)['chats']);
        $actor->employee->update(['employment_status' => 'active', 'department_id' => $other->id]);
        $other->update(['is_active' => false]);
        $this->assertSame([], $this->read($actor)['chats']);
    }

    public function test_only_current_published_unexpired_recipient_memoranda_are_visible(): void
    {
        $actor = $this->actor($this->department());
        $other = $this->actor($this->department());
        $published = $this->memo($actor, 'Visible', 'published');
        $this->memo($actor, 'Draft', 'draft');
        $expired = $this->memo($actor, 'Expired', 'published');
        $expired->update(['expires_at' => now()->subMinute()]);
        $this->memo($other, 'Foreign', 'published');

        $visible = $this->read($actor)['notifications']['memoranda'];
        $this->assertCount(1, $visible);
        $this->assertSame('Visible', $visible[0]['title']);
        $this->assertSame('/memoranda/'.$published->id, $visible[0]['url']);
    }

    public function test_calendar_is_owner_only_overlap_aware_and_uses_canonical_timezone(): void
    {
        $actor = $this->actor($this->department());
        $other = $this->actor($this->department());
        $own = $this->leave($actor, 'approved');
        $foreign = $this->leave($other, 'approved');
        $start = CarbonImmutable::parse('2026-09-24 23:00:00', 'Asia/Manila');
        $this->event($actor, $own, $start, $start->addHours(3), 'private cached title');
        $this->event($other, $foreign, $start, $start->addHours(3), 'foreign confidential');
        $calendar = $this->read($actor, '2026-09-25')['calendar'];

        $this->assertSame('2026-09-25T00:00:00+08:00', $calendar['range_start']);
        $this->assertCount(1, $calendar['events']);
        $this->assertSame('Annual Leave', $calendar['events'][0]['title']);
        $this->assertSame('/hris', $calendar['events'][0]['url']);
        $this->assertSame('2026-09-24', $calendar['events'][0]['start_date']);
        $this->assertStringNotContainsString('private cached title', json_encode($calendar));

        $own->update(['status' => 'rejected']);
        $this->assertSame([], $this->read($actor, '2026-09-25')['calendar']['events']);
    }

    public function test_messages_are_fixed_safe_links_not_chat_membership_grants(): void
    {
        $actor = $this->actor($this->department());
        $reader = app(CommonCoordinationReader::class);
        $this->assertSame(
            '/messages?channel=Department%20Heads',
            $reader->chatLink($actor, 'Department Heads')['url'],
        );
        $this->assertNull($reader->chatLink($actor, 'Secret Group'));
        $this->assertCount(6, $this->read($actor)['chats']);
    }

    public function test_pagination_is_bounded_with_one_thousand_source_receipts(): void
    {
        $actor = $this->actor($this->department());
        $leave = $this->leave($actor);
        $now = now();
        $records = [];
        for ($i = 0; $i < 1000; $i++) {
            $records[] = [
                'user_id' => $actor->id, 'event_key' => 'p2-test-'.$i,
                'source_domain' => 'leave', 'source_type' => LeaveRequest::class,
                'source_id' => $leave->id, 'priority' => 'info',
                'title' => 'stale', 'message' => 'stale', 'action_url' => '/stale',
                'requires_acknowledgement' => false,
                'created_at' => $now, 'updated_at' => $now,
            ];
        }
        foreach (array_chunk($records, 200) as $chunk) {
            PlatformNotification::query()->insert($chunk);
        }

        DB::flushQueryLog();
        DB::enableQueryLog();
        try {
            $first = $this->read($actor);
            $count = count(DB::getQueryLog());
        } finally {
            DB::disableQueryLog();
            DB::flushQueryLog();
        }
        $this->assertCount(10, $first['notifications']['leave_updates']);
        $this->assertNotNull($first['notifications']['next_cursor']);
        $this->assertLessThanOrEqual(12, $count);
        $second = app(CommonCoordinationReader::class)->snapshot(
            $actor, '2026-09-25', 10, $first['notifications']['next_cursor']
        );
        $this->assertCount(10, $second['notifications']['leave_updates']);
        $this->assertLessThan(
            $first['notifications']['leave_updates'][9]['id'],
            $second['notifications']['leave_updates'][0]['id'],
        );
    }

    private function read(User $actor, ?string $date = '2026-09-25'): array
    {
        return app(CommonCoordinationReader::class)->snapshot($actor, $date);
    }

    private function department(): Department
    {
        return Department::query()->create([
            'code' => 'P2-'.Str::upper(Str::random(7)), 'name' => 'P2 Test Office',
            'short_name' => 'P2', 'branch' => 'executive', 'office_type' => 'department',
            'sort_order' => 1, 'is_routable' => true, 'is_active' => true,
        ]);
    }

    private function actor(Department $office): User
    {
        $user = User::query()->create([
            'name' => 'Coordination Tester',
            'email' => Str::lower(Str::random(12)).'@example.test',
            'password' => 'password', 'role' => 'department_staff', 'is_active' => true,
        ]);
        Employee::query()->create([
            'employee_number' => 'P2-'.Str::upper(Str::random(10)),
            'full_name' => $user->name, 'work_email' => $user->email,
            'user_id' => $user->id, 'department_id' => $office->id,
            'position_title' => 'Staff', 'employment_status' => 'active',
        ]);
        return $user->fresh('employee.department');
    }

    private function leave(User $owner, string $status = 'pending'): LeaveRequest
    {
        $type = LeaveType::query()->firstOrCreate(
            ['code' => 'AL'], ['name' => 'Annual Leave', 'tracks_balance' => false, 'is_active' => true]
        );
        return LeaveRequest::query()->create([
            'employee_id' => $owner->employee->id,
            'leave_type_id' => $type->id,
            'start_date' => '2026-09-24',
            'end_date' => '2026-09-26',
            'units' => 1, 'status' => $status,
        ]);
    }

    private function notify(User $user, LeaveRequest $leave, string $title = 'Cached title', string $url = '/stale'): PlatformNotification
    {
        return PlatformNotification::query()->create([
            'user_id' => $user->id, 'event_key' => Str::random(16),
            'source_domain' => 'leave', 'source_type' => LeaveRequest::class,
            'source_id' => $leave->id, 'priority' => 'info',
            'title' => $title, 'message' => 'Sensitive cached body',
            'action_url' => $url,
        ]);
    }

    private function memo(User $recipient, string $title, string $status): Memorandum
    {
        $office = $recipient->employee->department;
        $memo = Memorandum::query()->create([
            'memo_number' => 'P2-MEMO-'.Str::upper(Str::random(9)),
            'title' => $title, 'body' => 'Body',
            'issued_by_user_id' => $recipient->id,
            'issued_by_department_id' => $office->id,
            'audience_type' => 'selected', 'status' => $status,
            'published_at' => now(),
        ]);
        MemoRecipient::query()->create([
            'memorandum_id' => $memo->id, 'user_id' => $recipient->id,
            'delivered_at' => now(),
        ]);
        return $memo;
    }

    private function event(User $owner, LeaveRequest $leave, CarbonImmutable $start, CarbonImmutable $end, string $title): void
    {
        CalendarEvent::query()->create([
            'event_key' => 'p2-leave-'.$leave->id,
            'event_type' => 'approved_leave',
            'title' => $title, 'scope' => 'department',
            'department_id' => $owner->employee->department_id,
            'user_id' => $owner->id, 'source_domain' => 'leave',
            'source_type' => LeaveRequest::class, 'source_id' => $leave->id,
            'priority' => 'normal', 'starts_at' => $start, 'ends_at' => $end,
            'all_day' => false, 'action_url' => '/poisoned',
            'status' => 'scheduled',
        ]);
    }
}
