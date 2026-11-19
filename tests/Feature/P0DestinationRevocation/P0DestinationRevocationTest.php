<?php

namespace Tests\Feature\P0DestinationRevocation;

use App\Domain\Correspondence\CorrespondenceClassification;
use App\Domain\Correspondence\CorrespondenceLifecycleState;
use App\Domain\TravelOrders\TravelOrderStatus;
use App\Models\CorrespondenceRecord;
use App\Models\Department;
use App\Models\Employee;
use App\Models\TravelOrder;
use App\Models\User;
use App\Models\WorkflowTransaction;
use Illuminate\Foundation\Testing\DatabaseTruncation;
use Illuminate\Foundation\Testing\RefreshDatabaseState;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * Authenticated HTTP regressions require committed synthetic fixtures visible to
 * the independent revoker connection. DatabaseTruncation avoids a transaction
 * and never invokes rollback of forward-only protected custody migrations.
 * Run only against the disposable PostgreSQL test database.
 */
final class P0DestinationRevocationTest extends TestCase
{
    use DatabaseTruncation;

    protected function tearDown(): void
    {
        // Cross-connection tests commit fixtures. Force the next Feature test
        // to rebuild its disposable schema instead of reusing committed rows.
        RefreshDatabaseState::$migrated = false;

        parent::tearDown();
    }

    public function test_travel_order_detail_and_index_reject_separated_employment_with_retained_session(): void
    {
        $office = $this->office();
        $actor = $this->human('department_head', $office);
        $order = $this->makeTravelOrder($office, $actor->employee);

        $this->actingAs($actor);
        $this->get('/travel-orders')->assertOk();
        $this->get('/travel-orders/'.$order->public_id)->assertOk();

        $actor->load('employee.department');
        $this->revoke('employees', $actor->employee->id, ['employment_status' => 'separated']);
        $this->assertTrue($actor->employee->employment_status === 'active', 'Preloaded actor relation must remain stale.');

        $this->assertRevokedTransport($actor, 'employees', $actor->employee->id, ['employment_status' => 'active'], ['employment_status' => 'separated'], [
            fn () => $this->get('/travel-orders'),
            fn () => $this->get('/travel-orders/'.$order->public_id),
        ], [$order->purpose]);

        // Independently exercise the original downstream domain boundary.
        $this->assertDomainBoundary($actor, function () use ($order): void {
            $this->get('/travel-orders')->assertForbidden();
            $denied = $this->get('/travel-orders/'.$order->public_id)->assertForbidden();
            $this->assertStringNotContainsString($order->purpose, $denied->getContent());
        });

        $this->revoke('employees', $actor->employee->id, ['employment_status' => 'active']);
        $this->actingAs($actor->fresh());
        $this->get('/travel-orders/'.$order->public_id)->assertOk();
    }

    public function test_travel_order_privileged_create_store_and_status_are_denied_after_separation(): void
    {
        $mayor = $this->office('MAYOR');
        $actor = $this->human('mayor_approver', $mayor);
        $order = $this->makeTravelOrder($mayor, $actor->employee);

        $this->actingAs($actor);
        $this->get('/travel-orders/create')->assertOk();
        $actor->load('employee.department');
        $this->revoke('employees', $actor->employee->id, ['employment_status' => 'separated']);

        $this->assertRevokedTransport($actor, 'employees', $actor->employee->id, ['employment_status' => 'active'], ['employment_status' => 'separated'], [
            fn () => $this->get('/travel-orders/create'),
            fn () => $this->post('/travel-orders', $this->travelPayload($mayor, $actor->employee)),
            fn () => $this->post('/travel-orders/'.$order->public_id.'/status', ['status' => 'completed']),
        ], [$order->purpose]);

        // Independently exercise the original downstream domain boundary.
        $this->assertDomainBoundary($actor, function () use ($mayor, $actor, $order): void {
            $this->get('/travel-orders/create')->assertForbidden();
            $this->post('/travel-orders', $this->travelPayload($mayor, $actor->employee))->assertForbidden();
            $this->post('/travel-orders/'.$order->public_id.'/status', ['status' => 'completed'])->assertForbidden();
        });

        $this->assertDatabaseCount('travel_orders', 1);
        $this->assertDatabaseCount('travel_order_events', 0);
        $this->assertSame(TravelOrderStatus::Approved, $order->fresh()->status);
    }

    public function test_travel_order_mutations_reject_deactivated_mayor_department_and_preserve_other_office_scoping(): void
    {
        $mayor = $this->office('MAYOR');
        $other = $this->office();
        $actor = $this->human('mayor_approver', $mayor);
        $order = $this->makeTravelOrder($other, $this->human('employee', $other)->employee);

        $this->actingAs($actor);
        $this->get('/travel-orders/'.$order->public_id)->assertOk();
        $this->revoke('departments', $mayor->id, ['is_active' => false]);

        $this->assertRevokedTransport($actor, 'departments', $mayor->id, ['is_active' => true], ['is_active' => false], [
            fn () => $this->get('/travel-orders'),
            fn () => $this->get('/travel-orders/'.$order->public_id),
            fn () => $this->post('/travel-orders', $this->travelPayload($other, $actor->employee)),
            fn () => $this->post('/travel-orders/'.$order->public_id.'/status', ['status' => 'completed']),
        ], [$order->purpose]);

        // Independently exercise the original downstream domain boundary.
        $this->assertDomainBoundary($actor, function () use ($order, $other, $actor): void {
            $this->get('/travel-orders')->assertForbidden();
            $this->get('/travel-orders/'.$order->public_id)->assertForbidden();
            $this->post('/travel-orders', $this->travelPayload($other, $actor->employee))->assertForbidden();
            $this->post('/travel-orders/'.$order->public_id.'/status', ['status' => 'completed'])->assertForbidden();
        });

        $this->assertSame(TravelOrderStatus::Approved, $order->fresh()->status);
        $this->assertDatabaseCount('travel_order_events', 0);
    }

    public function test_correspondence_json_workspace_and_index_stop_exposing_records_after_department_deactivation(): void
    {
        $office = $this->office();
        $actor = $this->human('department_head', $office);
        $record = $this->correspondence('Revocation classified secret', CorrespondenceLifecycleState::Classified, $office, CorrespondenceClassification::Internal);

        $this->actingAs($actor);
        $this->getJson('/correspondence/'.$record->public_id)->assertOk();
        $this->get('/correspondence/'.$record->public_id.'/workspace')->assertOk();
        $actor->load('employee.department');
        $this->revoke('departments', $office->id, ['is_active' => false]);

        $this->assertRevokedTransport($actor, 'departments', $office->id, ['is_active' => true], ['is_active' => false], [
            fn () => $this->getJson('/correspondence/'.$record->public_id),
            fn () => $this->get('/correspondence/'.$record->public_id.'/workspace'),
            fn () => $this->get('/correspondence?view=all'),
        ], [$record->subject]);

        // Independently exercise the original downstream domain boundary.
        $this->assertDomainBoundary($actor, function () use ($record): void {
            $this->getJson('/correspondence/'.$record->public_id)->assertForbidden();
            $this->get('/correspondence/'.$record->public_id.'/workspace')->assertForbidden();
            // Index FormRequest only requires login. Canonical scope must return no titles/totals.
            $result = $this->get('/correspondence?view=all')->assertOk();
            $this->assertStringNotContainsString($record->subject, $result->getContent());
            $result->assertInertia(fn (AssertableInertia $page) => $page
                ->where('records.total', 0)
                ->where('overview.counts.all', 0));
        });

        $this->revoke('departments', $office->id, ['is_active' => true]);
        $this->actingAs($actor->fresh());
        $this->getJson('/correspondence/'.$record->public_id)->assertOk();
    }

    public function test_inactive_office_cannot_register_classify_route_or_act_using_stale_session_relations(): void
    {
        $office = $this->office();
        $target = $this->office();
        $actor = $this->human('department_head', $office);
        $received = $this->correspondence('Retained received intake', CorrespondenceLifecycleState::Received);
        $registered = $this->correspondence('Retained registered item', CorrespondenceLifecycleState::Registered, $office);
        $classified = $this->correspondence('Retained classified item', CorrespondenceLifecycleState::Classified, $office, CorrespondenceClassification::Internal);
        $workflow = WorkflowTransaction::query()->create([
            'reference_no' => 'P0-'.Str::upper(Str::random(12)),
            'transaction_type' => 'document_review',
            'title' => 'P0 held routed item',
            'priority' => 'normal',
            'origin_department_id' => $office->id,
            'current_department_id' => $office->id,
            'created_by_user_id' => $actor->id,
            'assigned_employee_id' => $actor->employee->id,
            'status' => 'submitted',
            'received_at' => now(),
        ]);
        $routed = $this->correspondence('Retained routed item', CorrespondenceLifecycleState::Routed, $office, CorrespondenceClassification::Internal, $workflow);

        $this->actingAs($actor);
        $this->get('/correspondence/'.$received->public_id.'/workspace')->assertOk();
        $actor->load('employee.department');
        $this->revoke('departments', $office->id, ['is_active' => false]);

        $this->assertRevokedTransport($actor, 'departments', $office->id, ['is_active' => true], ['is_active' => false], [
            fn () => $this->postJson('/correspondence/'.$received->public_id.'/register', []),
            fn () => $this->post('/correspondence/'.$received->public_id.'/workspace/register', []),
            fn () => $this->postJson('/correspondence/'.$registered->public_id.'/classify', ['classification' => 'internal']),
            fn () => $this->post('/correspondence/'.$registered->public_id.'/workspace/classify', ['classification' => 'internal']),
            fn () => $this->postJson('/correspondence/'.$classified->public_id.'/route', ['target_department_id' => $target->id, 'priority' => 'normal']),
            fn () => $this->post('/correspondence/'.$classified->public_id.'/workspace/route', ['target_department_id' => $target->id, 'priority' => 'normal']),
            fn () => $this->postJson('/correspondence/'.$routed->public_id.'/act', []),
            fn () => $this->post('/correspondence/'.$routed->public_id.'/workspace/act', []),
        ], [$received->subject, $registered->subject, $classified->subject, $routed->subject]);

        // Independently exercise the original downstream domain boundary.
        $this->assertDomainBoundary($actor, function () use ($received, $registered, $classified, $target, $routed): void {
            $this->postJson('/correspondence/'.$received->public_id.'/register')->assertForbidden();
            $this->postJson('/correspondence/'.$registered->public_id.'/classify', ['classification' => 'internal'])->assertForbidden();
            $this->postJson('/correspondence/'.$classified->public_id.'/route', ['target_department_id' => $target->id, 'priority' => 'normal'])->assertForbidden();
            $this->postJson('/correspondence/'.$routed->public_id.'/act')->assertForbidden();

            foreach ([$received, $registered, $classified, $routed] as $record) {
                $this->post('/correspondence/'.$record->public_id.'/workspace/'.match ($record->id) {
                    $received->id => 'register',
                    $registered->id => 'classify',
                    $classified->id => 'route',
                    default => 'act',
                }, match ($record->id) {
                    $registered->id => ['classification' => 'internal'],
                    $classified->id => ['target_department_id' => $target->id, 'priority' => 'normal'],
                    default => [],
                })->assertForbidden();
            }
        });

        $this->assertSame(CorrespondenceLifecycleState::Received, $received->fresh()->lifecycle_state);
        $this->assertSame(CorrespondenceLifecycleState::Registered, $registered->fresh()->lifecycle_state);
        $this->assertSame(CorrespondenceLifecycleState::Classified, $classified->fresh()->lifecycle_state);
        $this->assertSame(CorrespondenceLifecycleState::Routed, $routed->fresh()->lifecycle_state);
        $this->assertDatabaseCount('correspondence_events', 0);
        $this->assertDatabaseCount('outbox_messages', 0);
    }

    public function test_eligible_registrar_keeps_received_intake_and_wrong_office_or_classification_stays_denied(): void
    {
        $own = $this->office();
        $foreignOffice = $this->office();
        $registrar = $this->human('department_staff', $own);
        $received = $this->correspondence('Legitimate unassigned intake', CorrespondenceLifecycleState::Received);
        $foreign = $this->correspondence('Other department classified', CorrespondenceLifecycleState::Classified, $foreignOffice, CorrespondenceClassification::Internal);
        $restricted = $this->correspondence('Own restricted case', CorrespondenceLifecycleState::Classified, $own, CorrespondenceClassification::Restricted);

        $this->actingAs($registrar);
        $this->get('/correspondence/'.$received->public_id.'/workspace')->assertOk();
        $this->get('/correspondence/'.$foreign->public_id.'/workspace')->assertForbidden();
        $this->get('/correspondence/'.$restricted->public_id.'/workspace')->assertForbidden();

        $this->revoke('departments', $own->id, ['is_active' => false]);
        $this->assertRevokedTransport($registrar, 'departments', $own->id, ['is_active' => true], ['is_active' => false], [
            fn () => $this->get('/correspondence/'.$received->public_id.'/workspace'),
        ], [$received->subject]);

        // Independently exercise the original downstream domain boundary.
        $this->assertDomainBoundary($registrar, function () use ($received): void {
            $this->get('/correspondence/'.$received->public_id.'/workspace')->assertForbidden();
        });

        $this->revoke('departments', $own->id, ['is_active' => true]);
        $this->actingAs($registrar->fresh());
        $this->get('/correspondence/'.$received->public_id.'/workspace')->assertOk();
    }

    /** Each transport request starts with its own eligible pre-revocation session. */
    private function assertRevokedTransport(User $actor, string $table, int $id, array $eligible, array $revoked, array $requests, array $secrets): void
    {
        foreach ($requests as $request) {
            $this->revoke($table, $id, $eligible);
            $this->actingAs($actor->fresh());
            $this->revoke($table, $id, $revoked);
            $response = $request()->assertRedirect(route('login'))->assertSessionMissing('auth_session_version');
            $this->assertGuest();
            foreach ($secrets as $secret) {
                $this->assertStringNotContainsString($secret, $response->getContent());
            }
        }
    }

    /**
     * Test-only isolated dispatch to the original domain controllers/policies.
     * The outer account gate has already been asserted with real middleware.
     * Keep routing, authentication, MFA, FormRequests and domain guards intact.
     */
    private function assertDomainBoundary(User $actor, \Closure $assertions): void
    {
        $this->withoutMiddleware(\App\Http\Middleware\RequireActiveAccount::class);
        try {
            $this->actingAs($actor);
            $assertions();
        } finally {
            $this->withMiddleware(\App\Http\Middleware\RequireActiveAccount::class);
            auth()->guard('web')->logoutCurrentDevice();
            session()->invalidate();
        }
    }

    private function revoke(string $table, int $id, array $values): void
    {
        // New PDO connection, not a second Eloquent relation or transaction-bound read.
        config()->set('database.connections.p0_revoker', config('database.connections.pgsql'));
        DB::purge('p0_revoker');
        $affected = DB::connection('p0_revoker')->table($table)->where('id', $id)->update($values);
        DB::disconnect('p0_revoker');
        $this->assertSame(1, $affected);
    }

    private function office(?string $code = null): Department
    {
        return Department::query()->create([
            'code' => $code ?? 'P0-'.Str::upper(Str::random(10)),
            'name' => 'P0 municipal test office',
            'short_name' => 'P0',
            'branch' => 'executive',
            'office_type' => 'department',
            'sort_order' => 1,
            'is_routable' => true,
            'is_active' => true,
        ]);
    }

    private function human(string $role, Department $office): User
    {
        $user = User::query()->create([
            'name' => 'P0 eligible tester',
            'email' => Str::lower(Str::random(14)).'@example.test',
            'password' => 'synthetic-only',
            'role' => $role,
            'is_active' => true,
        ]);
        Employee::query()->create([
            'employee_number' => 'P0-EMP-'.Str::upper(Str::random(12)),
            'full_name' => $user->name,
            'work_email' => $user->email,
            'user_id' => $user->id,
            'department_id' => $office->id,
            'position_title' => 'P0 test operator',
            'employment_status' => 'active',
        ]);

        return $user->fresh('employee.department');
    }

    private function makeTravelOrder(Department $office, Employee $issuedTo): TravelOrder
    {
        $order = TravelOrder::query()->create([
            'reference_number' => 'P0-TR-'.Str::upper(Str::random(12)),
            'issuance_date' => '2026-10-13',
            'purpose' => 'P0 municipal authorized trip',
            'destination' => 'Synthetic destination',
            'department_id' => $office->id,
            'travel_start_date' => '2026-10-15',
            'travel_end_date' => '2026-10-16',
            'status' => TravelOrderStatus::Approved,
        ]);
        $order->issuedTo()->sync([$issuedTo->id]);

        return $order;
    }

    private function travelPayload(Department $office, Employee $employee): array
    {
        return [
            'reference_number' => 'P0-CREATE-'.Str::upper(Str::random(10)),
            'issuance_date' => '2026-10-13',
            'purpose' => 'Attempted unapproved mutation',
            'destination' => 'Synthetic destination',
            'department_id' => $office->id,
            'travel_start_date' => '2026-10-15',
            'travel_end_date' => '2026-10-16',
            'employee_numbers' => [$employee->employee_number],
        ];
    }

    private function correspondence(string $subject, CorrespondenceLifecycleState $state, ?Department $office = null, ?CorrespondenceClassification $classification = null, ?WorkflowTransaction $workflow = null): CorrespondenceRecord
    {
        return CorrespondenceRecord::query()->create([
            'public_id' => (string) Str::uuid(),
            'external_reference_no' => 'P0-COR-'.Str::upper(Str::random(14)),
            'source' => 'portal',
            'channel' => 'test',
            'sender_name' => 'P0 synthetic source',
            'subject' => $subject,
            'received_at' => now(),
            'receiving_department_id' => $office?->id,
            'municipal_reference_no' => $state === CorrespondenceLifecycleState::Received ? null : 'P0-MUN-'.Str::upper(Str::random(12)),
            'classification' => $classification?->value,
            'lifecycle_state' => $state->value,
            'workflow_transaction_id' => $workflow?->id,
        ]);
    }
}
