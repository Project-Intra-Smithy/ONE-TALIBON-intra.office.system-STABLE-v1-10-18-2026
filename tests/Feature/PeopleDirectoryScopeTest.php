<?php

namespace Tests\Feature;

use App\Models\AttendanceLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PeopleDirectoryScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_hris_redirects_to_the_directory_and_legacy_payroll_and_leave_endpoints_are_not_exposed(): void
    {
        $this->seed();
        $actor = User::query()->where('email', 'employee@talibon.demo')->firstOrFail();

        $this->actingAs($actor)->get('/hris')->assertRedirect(route('employees.index'));
        $this->get('/employees')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Employees/Index')->has('employees.data'));
        foreach (['/hris/payroll', '/hris/admin', '/hris/dtr', '/hris/admin/development',
            '/hris/admin/lifecycle', '/hris/admin/offboarding', '/hris/health/'.$actor->employee->id] as $path) {
            $this->get($path)->assertNotFound();
        }
        $this->post('/hris/leave-requests', [])->assertNotFound();
    }

    public function test_portal_presence_requires_a_real_heartbeat_and_can_only_update_the_signed_in_actor(): void
    {
        $this->seed();
        $actor = User::query()->where('email', 'employee@talibon.demo')->firstOrFail();
        $other = User::query()->where('email', 'engineering@talibon.demo')->firstOrFail();

        $this->actingAs($actor)->get(route('employees.show', $actor->employee))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Employees/DirectoryProfile')
                ->where('employee.presence', 'offline')
                ->missing('employee.user_id')
                ->missing('employee.personal_email')
                ->missing('employee.gsis_number')
                ->missing('employee.philhealth_number')
                ->missing('privateProfile')->missing('performanceRecords')->missing('developmentRecords'));

        $attendanceBefore = AttendanceLog::query()->count();
        $this->postJson(route('employees.presence'), ['user_id' => $other->id])->assertOk();
        $this->assertSame($attendanceBefore, AttendanceLog::query()->count());
        $this->assertNotNull($actor->fresh()->last_seen_at);
        $this->assertNull($other->fresh()->last_seen_at);
        $this->get(route('employees.show', $actor->employee))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Employees/DirectoryProfile')->where('employee.presence', 'online'));

        DB::table('portal_presence_sessions')->where('user_id', $actor->id)
            ->update(['last_seen_at' => now()->subMinutes(10)]);
        DB::table('users')->where('id', $actor->id)->update(['last_seen_at' => now()->subMinutes(10)]);
        $this->get(route('employees.show', $actor->employee))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Employees/DirectoryProfile')->where('employee.presence', 'offline'));

        $this->postJson(route('employees.presence'))->assertOk();
        $this->post(route('logout'))->assertRedirect(route('login'));
        $this->assertNull($actor->fresh()->last_seen_at);
        $this->postJson(route('employees.presence'))->assertUnauthorized();
    }

    public function test_logging_out_one_session_does_not_clear_another_fresh_session_presence(): void
    {
        $this->seed();
        $actor = User::query()->where('email', 'employee@talibon.demo')->firstOrFail();

        // Model two independently active browser sessions for the same account.
        DB::table('portal_presence_sessions')->insert([
            [
                'user_id' => $actor->id,
                'session_hash' => hash('sha256', 'session-a'),
                'last_seen_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => $actor->id,
                'session_hash' => hash('sha256', 'session-b'),
                'last_seen_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $this->actingAs($actor)
            ->withSession(['presence_session_hash' => hash('sha256', 'session-a')])
            ->post(route('logout'))
            ->assertRedirect(route('login'));

        $this->actingAs($actor)->get(route('employees.show', $actor->employee))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Employees/DirectoryProfile')
                ->where('employee.presence', 'online'));

        $this->assertDatabaseMissing('portal_presence_sessions', [
            'user_id' => $actor->id,
            'session_hash' => hash('sha256', 'session-a'),
        ]);
        $this->assertDatabaseHas('portal_presence_sessions', [
            'user_id' => $actor->id,
            'session_hash' => hash('sha256', 'session-b'),
        ]);
    }

    public function test_attendance_is_authenticated_employee_self_only_and_does_not_enumerate_other_staff(): void
    {
        $this->seed();
        $actor = User::query()->where('email', 'employee@talibon.demo')->firstOrFail();
        $other = User::query()->where('email', 'engineering@talibon.demo')->firstOrFail();
        AttendanceLog::query()->where('employee_id', $actor->employee->id)->delete();
        AttendanceLog::query()->create([
            'employee_id' => $other->employee->id,
            'occurred_at' => now(),
            'event_type' => 'in',
            'source' => 'synthetic_test',
        ]);

        $this->actingAs($actor)->get(route('hris.attendance', ['employee_id' => $other->employee->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Hris/Attendance')
                ->where('employee.number', $actor->employee->employee_number)
                ->has('events', 0)
                ->missing('payrollPeriods')
                ->missing('leaveTypes'));
    }
}
