<?php

namespace Tests\Feature\WorkRequests;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class OriginDeliveryExceptionQueueGuardTest extends TestCase
{
    use RefreshDatabase;

    public function test_technical_admin_and_foreign_staff_cannot_read_or_act_on_held_exception_queue(): void
    {
        $this->seed();

        $admin = User::query()->where('email', 'admin@talibon.demo')->firstOrFail();
        $staff = User::query()->where('email', 'engineering@talibon.demo')->firstOrFail();

        // On an environment without the lease-guarded queue schema the
        // route is deliberately not exposed (404), even to technical admin.
        foreach ([$admin, $staff] as $actor) {
            $this->actingAs($actor)
                ->get('/work-requests/origin-delivery-exceptions')
                ->assertNotFound();
            $this->actingAs($actor)
                ->post('/work-requests/origin-delivery-exceptions/1/actions', [
                    'action' => 'resolve',
                    'note' => 'Attempted foreign mutation',
                ])
                ->assertNotFound();
        }
    }

    public function test_uninstalled_disposable_queue_is_not_exposed_as_a_live_municipal_workflow(): void
    {
        $this->seed();

        $head = User::query()->where('email', 'planning@talibon.demo')->firstOrFail();
        $this->actingAs($head)
            ->get('/work-requests/origin-delivery-exceptions')
            ->assertNotFound();
        $this->actingAs($head)
            ->post('/work-requests/origin-delivery-exceptions/1/actions', [
                'action' => 'acknowledge',
                'note' => 'Synthetic acknowledgement',
            ])
            ->assertNotFound();
    }
}
