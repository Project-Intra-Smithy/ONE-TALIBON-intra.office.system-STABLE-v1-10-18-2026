<?php

namespace Tests\Feature;

use App\Models\CalendarEvent;
use App\Models\User;
use App\Services\CalendarWorkspaceQueryService;
use Database\Seeders\MunicipalityStructureSeeder;
use Database\Seeders\MunicipalMeetingCalendarSeeder;
use Database\Seeders\WorkforceDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MeetingCalendarProjectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_canonical_meetings_are_projected_into_shared_calendar(): void
    {
        $this->seed(MunicipalityStructureSeeder::class);
        $this->seed(WorkforceDemoSeeder::class);
        $this->seed(MunicipalMeetingCalendarSeeder::class);

        $meetings = json_decode(
            file_get_contents(resource_path('js/data/municipal/meetings.json')),
            true,
            flags: JSON_THROW_ON_ERROR,
        );

        $this->assertCount(24, $meetings);
        $this->assertSame(
            count($meetings),
            CalendarEvent::query()->where('source_domain', 'meeting')->count(),
        );

        $this->assertDatabaseHas('calendar_events', [
            'event_key' => 'municipal-meeting-MTG-26-001',
            'event_type' => 'meeting',
            'title' => 'Department Heads Coordination Meeting',
            'scope' => 'municipality',
            'source_domain' => 'meeting',
            'source_type' => 'municipal_meeting_reference',
            'location' => 'Mayor’s Conference Room',
            'action_url' => '/meetings',
            'status' => 'completed',
        ]);

        $mayor = User::query()->where('email', 'mayor@talibon.demo')->firstOrFail();
        $workspace = app(CalendarWorkspaceQueryService::class)->workspace(
            $mayor,
            'month',
            '2026-09-17',
        );

        $projected = collect($workspace['events'])
            ->firstWhere('event_key', 'municipal-meeting-MTG-26-001');

        $this->assertNotNull($projected);
        $this->assertSame('Department Heads Coordination Meeting', $projected['title']);
        $this->assertSame('meeting', $projected['event_type']);
        $this->assertSame('2026-09-17', $projected['start_date']);
        $this->assertSame('09:00', $projected['start_time']);
        $this->assertSame('Mayor’s Conference Room', $projected['location']);
        $this->assertSame('/meetings', $projected['action_url']);
        $this->assertSame('municipality', $projected['calendar_bucket']);
    }

    public function test_meeting_calendar_projection_is_idempotent(): void
    {
        $this->seed(MunicipalityStructureSeeder::class);
        $this->seed(WorkforceDemoSeeder::class);

        $this->seed(MunicipalMeetingCalendarSeeder::class);
        $this->seed(MunicipalMeetingCalendarSeeder::class);

        $this->assertSame(
            24,
            CalendarEvent::query()->where('source_domain', 'meeting')->count(),
        );
    }
}
