<?php

namespace Tests\Feature;

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\AuditLog;
use App\Models\Department;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class Phase1ReportingAuditSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_report_and_audit_surfaces_remain_role_scoped(): void
    {
        $this->seed();
        $engineering = User::query()->where('email', 'engineering@talibon.demo')->firstOrFail();
        $hr = User::query()->where('email', 'hr@talibon.demo')->firstOrFail();
        $admin = User::query()->where('email', 'admin@talibon.demo')->firstOrFail();

        $this->actingAs($engineering)->get('/reports')->assertOk();
        $this->actingAs($engineering)->get('/audit')->assertForbidden();
        $this->actingAs($hr)->get('/reports')->assertOk();
        $this->actingAs($hr)->get('/audit')->assertForbidden();
        $this->actingAs($admin)->get('/audit')->assertOk();
    }

    public function test_parked_payroll_export_is_not_part_of_the_core_reports_surface(): void
    {
        $this->seed();
        $engineering = User::query()->where('email', 'engineering@talibon.demo')->firstOrFail();
        $mayor = User::query()->where('email', 'mayor@talibon.demo')->firstOrFail();
        $hr = User::query()->where('email', 'hr@talibon.demo')->firstOrFail();

        $this->actingAs($engineering)->get('/reports/export/payroll-summary')->assertNotFound();
        $this->actingAs($mayor)->get('/reports/export/payroll-summary')->assertNotFound();
        $this->actingAs($hr)->get('/reports/export/payroll-summary')->assertNotFound();
    }

    public function test_audit_filters_can_isolate_denied_events_by_department(): void
    {
        $this->seed();
        $admin = User::query()->where('email', 'admin@talibon.demo')->firstOrFail();
        $engineering = Department::query()->where('code', 'ENG')->firstOrFail();

        AuditLog::query()->create([
            'actor_user_id' => $admin->id,
            'actor_department_id' => $engineering->id,
            'action' => 'security.test.denied',
            'outcome' => 'denied',
            'summary' => 'Synthetic denied security event for filter verification.',
            'created_at' => now(),
        ]);

        $this->actingAs($admin)
            ->get('/audit?outcome=denied&department_id='.$engineering->id.'&action=security.test')
            ->assertOk();
    }

    public function test_audit_payload_uses_only_recorded_actor_and_office_fields(): void
    {
        $this->seed();
        $actor = User::query()->where('email', 'engineering@talibon.demo')->firstOrFail();
        $office = Department::query()->where('id', '!=', $actor->employee->department_id)->firstOrFail();
        $actor->employee()->firstOrFail()->update([
            'home_address' => 'SEC01-SYNTHETIC-ADDRESS-CANARY',
            'personal_email' => 'sec01-canary@example.invalid',
        ]);
        $event = AuditLog::query()->create([
            'actor_user_id' => $actor->id,
            'actor_department_id' => $office->id,
            'action' => 'security.payload.canary',
            'outcome' => 'allowed',
            'summary' => 'Synthetic event.',
            'created_at' => now(),
        ]);

        foreach (['admin@talibon.demo', 'mayor@talibon.demo'] as $email) {
            $viewer = User::query()->where('email', $email)->firstOrFail();
            $url = '/audit?action=security.payload.canary';
            $this->actingAs($viewer)->get($url)->assertOk()
                ->assertInertia(fn (Assert $page) => $page->component('Audit/Index')
                    ->where('events.0.id', $event->id)
                    ->where('events.0.actor_department.id', $office->id)
                    ->missing('events.0.actor.employee'))
                ->assertDontSee('SEC01-SYNTHETIC-ADDRESS-CANARY')
                ->assertDontSee('sec01-canary@example.invalid');
            $headers = [
                'X-Inertia' => 'true',
                'X-Inertia-Version' => (string) app(HandleInertiaRequests::class)->version(Request::create($url)),
            ];
            foreach ([$headers, $headers + ['X-Inertia-Partial-Component' => 'Audit/Index', 'X-Inertia-Partial-Data' => 'events']] as $requestHeaders) {
                $response = $this->get($url, $requestHeaders);
                $response->assertOk()->assertJsonPath('props.events.0.id', $event->id)
                    ->assertJsonPath('props.events.0.actor.name', $actor->name)
                    ->assertJsonPath('props.events.0.actor_department.id', $office->id)
                    ->assertJsonMissingPath('props.events.0.actor.employee')
                    ->assertJsonMissingPath('props.events.0.ip_address')
                    ->assertDontSee('SEC01-SYNTHETIC-ADDRESS-CANARY')
                    ->assertDontSee('sec01-canary@example.invalid');
                $this->assertSame(['id', 'action', 'outcome', 'summary', 'created_at', 'actor', 'actor_department'], array_keys($response->json('props.events.0')));
                $this->assertSame(['name'], array_keys($response->json('props.events.0.actor')));
            }
        }
    }
}
