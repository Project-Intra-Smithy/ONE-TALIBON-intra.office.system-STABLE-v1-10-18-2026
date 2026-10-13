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
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * Authenticated HTTP regressions. DatabaseMigrations is intentional: RefreshDatabase
 * wraps tests in a transaction, hiding fixtures from a second PG connection.
 * The revoker uses a separately committed connection while the web session remains.
 */
final class P0DestinationRevocationTest extends TestCase
{
    use DatabaseMigrations;

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

        $this->get('/travel-orders')->assertForbidden();
        $denied = $this->get('/travel-orders/'.$order->public_id)->assertForbidden();
        $this->assertStringNotContainsString($order->purpose, $denied->getContent());

        $this->revoke('employees', $actor->employee->id, ['employment_status' => 'active']);
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

        $this->get('/travel-orders/create')->assertForbidden();
        $this->post('/travel-orders', $this->travelPayload($mayor, $actor->employee))->assertForbidden();
        $this->post('/travel-orders/'.$order->public_id.'/status', ['status' => 'completed'])->assertForbidden();

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

        $this->get('/travel-orders')->assertForbidden();
        $this->get('/travel-orders/'.$order->public_id)->assertForbidden();
        $this->post('/travel-orders', $this->travelPayload($other, $actor->employee))->assertForbidden();
        $this->post('/travel-orders/'.$order->public_id.'/status', ['status' => 'completed'])->assertForbidden();
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

        $this->getJson('/correspondence/'.$record->public_id)->assertForbidden();
        $this->get('/correspondence/'.$record->public_id.'/workspace')->assertForbidden();
        // Index FormRequest only requires login. Canonical scope must return no titles/totals.
        $result = $this->get('/correspondence?view=all')->assertOk();
        $this->assertStringNotContainsString($record->subject, $result->getContent());
        $result->assertInertia(fn (AssertableInertia $page) => $page
            ->where('records.total', 0)
            ->where('overview.counts.all', 0));
        $this->revoke('departments', $office->id, ['is_active' => true]);
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
        $this->get('/correspondence/'.$received->public_id.'/workspace')->assertForbidden();
        $this->revoke('departments', $own->id, ['is_active' => true]);
        $this->get('/correspondence/'.$received->public_id.'/workspace')->assertOk();
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
