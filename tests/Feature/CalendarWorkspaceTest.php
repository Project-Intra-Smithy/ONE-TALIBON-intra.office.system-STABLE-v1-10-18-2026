<?php

namespace Tests\Feature;

use App\Models\CalendarEvent;
use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\CalendarWorkspaceQueryService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

final class CalendarWorkspaceTest extends TestCase
{
    use RefreshDatabase;

    public function test_authorized_events_are_visible_with_server_derived_buckets(): void
    {
        $own = $this->department('OWN'); $other = $this->department('OTHER'); $actor = $this->human($own); $otherUser = $this->human($other);
        $at = CarbonImmutable::parse('2026-09-25 09:00', 'Asia/Manila');
        $this->event('municipal-visible', $at, scope: 'municipality');
        $this->event('office-visible', $at->addHour(), department: $own);
        $this->event('personal-visible', $at->addHours(2), user: $actor);
        $this->event('other-office-hidden', $at->addHours(3), department: $other);
        $this->event('other-person-hidden', $at->addHours(4), user: $otherUser);
        $events = collect(app(CalendarWorkspaceQueryService::class)->workspace($actor, 'day', '2026-09-25')['events'])->keyBy('event_key');
        $this->assertSame(['municipal-visible', 'office-visible', 'personal-visible'], $events->keys()->all());
        $this->assertSame('municipality', $events['municipal-visible']['calendar_bucket']); $this->assertSame('office', $events['office-visible']['calendar_bucket']); $this->assertSame('personal', $events['personal-visible']['calendar_bucket']);
    }

    public function test_calendar_windows_are_deterministic_and_bounded(): void
    {
        $actor = $this->human($this->department('RANGE')); $service = app(CalendarWorkspaceQueryService::class);
        $expected = ['month' => ['2026-08-30T00:00:00+08:00', '2026-10-10T23:59:59+08:00'], 'week' => ['2026-09-20T00:00:00+08:00', '2026-09-26T23:59:59+08:00'], 'day' => ['2026-09-25T00:00:00+08:00', '2026-09-25T23:59:59+08:00'], 'schedule' => ['2026-09-25T00:00:00+08:00', '2026-10-25T23:59:59+08:00']];
        foreach ($expected as $view => [$start, $end]) { $calendar = $service->workspace($actor, $view, '2026-09-25')['calendar']; $this->assertSame($start, $calendar['range_start']); $this->assertSame($end, $calendar['range_end']); }
    }

    public function test_invalid_view_and_date_fall_back_safely(): void
    {
        $actor = $this->human($this->department('FALLBACK')); $calendar = app(CalendarWorkspaceQueryService::class)->workspace($actor, 'year', '2026-02-31')['calendar'];
        $this->assertSame('month', $calendar['view']); $this->assertSame(CarbonImmutable::now('Asia/Manila')->toDateString(), $calendar['anchor_date']); $this->assertSame('Asia/Manila', $calendar['timezone']);
        $this->actingAs($actor)->get('/calendar?view%5B0%5D=week&date%5B0%5D=2026-09-25')->assertOk();
    }

    public function test_overlap_query_keeps_spanning_events_and_excludes_events_outside_range(): void
    {
        $actor = $this->human($this->department('OVERLAP'));
        $this->event('starts-before-ends-inside', CarbonImmutable::parse('2026-09-24 20:00', 'Asia/Manila'), CarbonImmutable::parse('2026-09-25 02:00', 'Asia/Manila'), scope: 'municipality');
        $this->event('spans-entire-day', CarbonImmutable::parse('2026-09-20 09:00', 'Asia/Manila'), CarbonImmutable::parse('2026-09-30 17:00', 'Asia/Manila'), scope: 'municipality');
        $this->event('outside-before', CarbonImmutable::parse('2026-09-23 09:00', 'Asia/Manila'), CarbonImmutable::parse('2026-09-24 17:00', 'Asia/Manila'), scope: 'municipality');
        $this->event('open-ended-before', CarbonImmutable::parse('2026-09-24 09:00', 'Asia/Manila'), scope: 'municipality');
        $this->event('outside-after', CarbonImmutable::parse('2026-09-26 09:00', 'Asia/Manila'), scope: 'municipality');
        $keys = collect(app(CalendarWorkspaceQueryService::class)->workspace($actor, 'day', '2026-09-25')['events'])->pluck('event_key')->all();
        $this->assertSame(['spans-entire-day', 'starts-before-ends-inside'], $keys);
    }

    public function test_all_day_and_timed_projection_use_calendar_local_values(): void
    {
        $office = $this->department('PROJECTION'); $actor = $this->human($office);
        $this->event('all-day', CarbonImmutable::parse('2026-09-25 00:00', 'Asia/Manila'), CarbonImmutable::parse('2026-09-27 23:59', 'Asia/Manila'), true, department: $office);
        $this->event('timed', CarbonImmutable::parse('2026-09-25 09:30', 'Asia/Manila'), CarbonImmutable::parse('2026-09-25 11:00', 'Asia/Manila'), department: $office);
        $events = collect(app(CalendarWorkspaceQueryService::class)->workspace($actor, 'month', '2026-09-25')['events'])->keyBy('event_key');
        $this->assertTrue($events['all-day']['all_day']); $this->assertSame('2026-09-25', $events['all-day']['start_date']); $this->assertSame('2026-09-27', $events['all-day']['end_date']); $this->assertNull($events['all-day']['start_time']); $this->assertSame('09:30', $events['timed']['start_time']); $this->assertSame('11:00', $events['timed']['end_time']);
    }

    public function test_calendar_route_returns_normalized_workspace_contract(): void
    {
        $actor = $this->human($this->department('ROUTE'));
        $this->actingAs($actor)->get('/calendar?view=week&date=2026-09-25')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Calendar/Index')->where('calendar.view', 'week')->where('calendar.anchor_date', '2026-09-25')->where('calendar.timezone', 'Asia/Manila')->has('events'));
    }

    public function test_malformed_workflow_deadline_never_uses_general_calendar_visibility(): void
    {
        $office = $this->department('LEGACY');
        $staff = $this->human($office);
        $at = CarbonImmutable::parse('2026-09-25 09:00', 'Asia/Manila');
        $legacy = $this->event('legacy-restricted-deadline', $at, department: $office);
        $legacy->update([
            'event_type' => 'workflow_deadline',
            'title' => 'RESTRICTED-LEGACY-CANARY',
            'source_domain' => null,
            'source_type' => null,
            'source_id' => null,
            'action_url' => null,
        ]);

        $this->actingAs($staff);
        $query = app(CalendarWorkspaceQueryService::class);
        $keys = collect($query->workspace($staff, 'day', '2026-09-25')['events'])
            ->pluck('event_key')->all();
        $this->assertNotContains('legacy-restricted-deadline', $keys);
        $this->get('/calendar?view=day&date=2026-09-25')
            ->assertOk()
            ->assertDontSee('RESTRICTED-LEGACY-CANARY');

        $ordinary = $this->event('ordinary-calendar-visible', $at->addHour(), department: $office);
        $transaction = WorkflowTransaction::query()->create([
            'reference_no' => 'CAL-TX-'.Str::upper(Str::random(10)),
            'transaction_type' => 'internal_request',
            'title' => 'Authorized Work Request',
            'priority' => 'normal',
            'origin_department_id' => $office->id,
            'current_department_id' => $office->id,
            'created_by_user_id' => $staff->id,
            'status' => 'submitted',
        ]);
        $deadline = $this->event('authorized-deadline', $at->addHours(2), department: $office);
        $deadline->update([
            'event_type' => 'workflow_deadline',
            'source_domain' => 'transaction',
            'source_type' => WorkflowTransaction::class,
            'source_id' => $transaction->id,
            'action_url' => '/transactions/'.$transaction->id,
        ]);

        $keys = collect($query->workspace($staff, 'day', '2026-09-25')['events'])
            ->pluck('event_key')->all();
        $this->assertContains($ordinary->event_key, $keys);
        $this->assertContains($deadline->event_key, $keys);
        $this->assertNotContains($legacy->event_key, $keys);
    }

    private function event(string $key, CarbonImmutable $start, ?CarbonImmutable $end = null, bool $allDay = false, string $scope = 'department', ?Department $department = null, ?User $user = null): CalendarEvent
    {
        return CalendarEvent::query()->create(['event_key' => $key, 'event_type' => 'calendar_test', 'title' => Str::headline($key), 'description' => 'Calendar workspace test event.', 'scope' => $scope, 'department_id' => $department?->id, 'user_id' => $user?->id, 'source_domain' => 'calendar_test', 'source_type' => self::class, 'source_id' => random_int(1, 1000000), 'priority' => 'normal', 'starts_at' => $start, 'ends_at' => $end, 'all_day' => $allDay, 'location' => 'Municipal Hall', 'action_url' => '/calendar-test/'.$key, 'status' => 'scheduled']);
    }
    private function department(string $suffix): Department
    {
        return Department::query()->create(['code' => 'CAL-'.Str::upper(Str::random(6)), 'name' => 'Calendar '.$suffix, 'short_name' => 'CAL-'.$suffix, 'branch' => 'executive', 'office_type' => 'department', 'sort_order' => 10, 'is_routable' => true, 'is_active' => true]);
    }
    private function human(Department $department): User
    {
        $user = User::query()->create(['name' => 'Calendar User '.Str::random(5), 'email' => Str::lower(Str::random(10)).'@example.test', 'password' => 'password', 'role' => 'department_staff', 'is_active' => true]);
        Employee::query()->create(['employee_number' => 'CAL-EMP-'.Str::upper(Str::random(10)), 'full_name' => $user->name, 'work_email' => $user->email, 'user_id' => $user->id, 'department_id' => $department->id, 'position_title' => 'Calendar Officer', 'employment_status' => 'active']);
        return $user->fresh('employee.department');
    }
}
