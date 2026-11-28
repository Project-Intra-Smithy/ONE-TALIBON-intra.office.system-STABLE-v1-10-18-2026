<?php

namespace Tests\Feature\WorkRequests;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

final class OriginDeliveryExceptionQueueGuardTest extends TestCase
{
    use RefreshDatabase;

    public function test_technical_admin_and_foreign_staff_cannot_read_or_act_on_held_exception_queue(): void
    {
        $this->seed();

        $admin = User::query()->where('email', 'admin@talibon.demo')->firstOrFail();
        $staff = User::query()->where('email', 'employee@talibon.demo')->firstOrFail();

        // Both users are non-heads under the actual synthetic seeder.
        // The role gate must deny them before any schema/ledger inspection.
        foreach ([$admin, $staff] as $actor) {
            $read = $this->actingAs($actor)
                ->get('/work-requests/origin-delivery-exceptions');
            $read->assertForbidden();
            $this->assertStringNotContainsString('NO_ELIGIBLE_ORIGIN_RECIPIENT', $read->getContent());

            $write = $this->actingAs($actor)
                ->post('/work-requests/origin-delivery-exceptions/1/actions', [
                    'action' => 'resolve',
                    'note' => 'Attempted foreign mutation',
                ]);
            $write->assertForbidden();
            $this->assertStringNotContainsString('NO_ELIGIBLE_ORIGIN_RECIPIENT', $write->getContent());
        }
    }

    public function test_eligible_origin_head_queue_respects_actual_ledger_installation_state(): void
    {
        $this->seed();

        $head = User::query()->where('email', 'planning@talibon.demo')->firstOrFail();
        $ledgerInstalled = Schema::hasTable('ops009_origin_delivery_exceptions')
            && Schema::hasTable('ops009_origin_delivery_exception_actions');

        $read = $this->actingAs($head)
            ->get('/work-requests/origin-delivery-exceptions');

        if ($ledgerInstalled) {
            // The protected PG16 full matrix installs the queue deliberately.
            $read->assertOk();
        } else {
            // Legacy/partially upgraded deployments must still fail closed.
            $read->assertNotFound();
        }

        // A nonexistent exception is never actionable in either schema state.
        $this->actingAs($head)
            ->post('/work-requests/origin-delivery-exceptions/2147483647/actions', [
                'action' => 'acknowledge',
                'note' => 'Synthetic acknowledgement',
            ])
            ->assertNotFound();
    }
}
