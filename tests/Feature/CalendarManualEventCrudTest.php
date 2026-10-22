<?php

namespace Tests\Feature;

use App\Models\CalendarEvent;
use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

final class CalendarManualEventCrudTest extends TestCase
{
    use RefreshDatabase;

    private function office(): Department
    {
        return Department::query()->create([
            'code' => 'BETA-'.Str::upper(Str::random(6)),
            'name' => 'Beta Calendar Office',
            'is_active' => true,
            'is_routable' => true,
        ]);
    }

    private function actor(Department $office, string $role = 'department_staff'): User
    {
        $user = User::query()->create([
            'name' => 'Calendar Test '.Str::random(6),
            'email' => Str::lower(Str::random(12)).'@example.test',
            'password' => 'password',
            'role' => $role,
            'is_active' => true,
        ]);
        Employee::query()->create([
            'employee_number' => 'BETA-EMP-'.Str::upper(Str::random(7)),
            'full_name' => $user->name,
            'work_email' => $user->email,
            'user_id' => $user->id,
            'department_id' => $office->id,
            'position_title' => 'Calendar Tester',
            'employment_status' => 'active',
        ]);

        return $user->fresh('employee.department');
    }

    private function payload(string $scope = 'personal'): array
    {
        return [
            'scope' => $scope,
            'title' => 'Synthetic beta meeting',
            'starts_at' => '2026-11-03T09:00:00+08:00',
            'ends_at' => '2026-11-03T10:00:00+08:00',
            'all_day' => false,
            'priority' => 'normal',
        ];
    }

    public function test_guest_cannot_create_calendar_event(): void
    {
        $this->post('/calendar/events', $this->payload())->assertRedirect('/login');
        $this->assertDatabaseCount('calendar_events', 0);
    }

    public function test_staff_can_create_edit_and_cancel_own_personal_event(): void
    {
        $actor = $this->actor($this->office());
        $this->actingAs($actor)->post('/calendar/events', $this->payload())->assertRedirect();
        $event = CalendarEvent::query()->sole();
        $this->assertSame('manual_event', $event->event_type);
        $this->assertSame('calendar_manual', $event->source_domain);
        $this->assertSame('personal', $event->scope);
        $this->assertSame($actor->id, $event->created_by_user_id);
        $this->assertSame($actor->id, $event->user_id);
        $this->assertNull($event->source_id);
        $this->actingAs($actor)->get('/calendar?view=day&date=2026-11-03')
            ->assertOk()->assertSee('Synthetic beta meeting');

        $this->actingAs($actor)->put('/calendar/events/'.$event->id, [
            ...$this->payload(), 'title' => 'Updated beta meeting',
        ])->assertRedirect();
        $this->assertSame('Updated beta meeting', $event->fresh()->title);

        $this->actingAs($actor)->delete('/calendar/events/'.$event->id)->assertRedirect();
        $this->assertSame('cancelled', $event->fresh()->status);
        $this->assertDatabaseCount('calendar_events', 1);
        $this->actingAs($actor)->delete('/calendar/events/'.$event->id)->assertForbidden();
    }

    public function test_staff_cannot_create_office_or_municipal_event(): void
    {
        $actor = $this->actor($this->office());
        $this->actingAs($actor)->post('/calendar/events', $this->payload('office'))->assertForbidden();
        $this->actingAs($actor)->post('/calendar/events', $this->payload('municipality'))->assertSessionHasErrors('scope');
        $this->assertDatabaseCount('calendar_events', 0);
    }

    public function test_head_can_create_own_office_event_but_other_staff_cannot_mutate_it(): void
    {
        $office = $this->office();
        $head = $this->actor($office, 'department_head');
        $staff = $this->actor($office);
        $this->actingAs($head)->post('/calendar/events', $this->payload('office'))->assertRedirect();
        $event = CalendarEvent::query()->sole();
        $this->assertSame('department', $event->scope);
        $this->assertSame($office->id, $event->department_id);
        $this->assertNull($event->user_id);
        $this->actingAs($staff)->put('/calendar/events/'.$event->id, $this->payload('office'))->assertForbidden();
        $this->actingAs($staff)->delete('/calendar/events/'.$event->id)->assertForbidden();
        $this->actingAs($head)->put('/calendar/events/'.$event->id, [
            ...$this->payload('office'), 'title' => 'Head-edited meeting',
        ])->assertRedirect();
        $this->assertSame('Head-edited meeting', $event->fresh()->title);
    }

    public function test_other_user_and_transferred_head_cannot_mutate_calendar_event(): void
    {
        $office = $this->office();
        $head = $this->actor($office, 'department_head');
        $other = $this->actor($office, 'department_head');
        $this->actingAs($head)->post('/calendar/events', $this->payload('office'))->assertRedirect();
        $event = CalendarEvent::query()->sole();
        $this->actingAs($other)->delete('/calendar/events/'.$event->id)->assertForbidden();
        $head->employee->update(['department_id' => $this->office()->id]);
        $this->actingAs($head)->delete('/calendar/events/'.$event->id)->assertForbidden();
        $this->assertSame('scheduled', $event->fresh()->status);
    }

    public function test_system_generated_and_forged_source_events_are_immutable(): void
    {
        $actor = $this->actor($this->office());
        $this->actingAs($actor)->post('/calendar/events', $this->payload())->assertRedirect();
        $manual = CalendarEvent::query()->sole();
        $manual->update([
            'event_type' => 'workflow_deadline',
            'source_domain' => 'transaction',
            'source_type' => \App\Models\WorkflowTransaction::class,
            'source_id' => 42,
        ]);

        $this->actingAs($actor)->put('/calendar/events/'.$manual->id, $this->payload())->assertForbidden();
        $this->actingAs($actor)->delete('/calendar/events/'.$manual->id)->assertForbidden();
        $this->assertSame('scheduled', $manual->fresh()->status);

        // No client-supplied provenance may replace generated source metadata.
        $this->actingAs($actor)->post('/calendar/events', [
            ...$this->payload(),
            'source_domain' => 'transaction', 'source_id' => 42,
            'created_by_user_id' => 999,
        ])->assertRedirect();
        $created = CalendarEvent::query()->latest('id')->firstOrFail();
        $this->assertSame('calendar_manual', $created->source_domain);
        $this->assertNull($created->source_id);
        $this->assertSame($actor->id, $created->created_by_user_id);
    }

    public function test_end_before_start_is_rejected_without_storage(): void
    {
        $actor = $this->actor($this->office());
        $this->actingAs($actor)->post('/calendar/events', [
            ...$this->payload(), 'ends_at' => '2026-11-03T08:00:00+08:00',
        ])->assertStatus(422);
        $this->assertDatabaseCount('calendar_events', 0);
    }
}
