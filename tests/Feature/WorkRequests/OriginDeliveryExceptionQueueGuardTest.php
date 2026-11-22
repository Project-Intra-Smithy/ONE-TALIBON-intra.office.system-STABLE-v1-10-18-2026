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

        // Without the lease-guarded queue schema, both routes must refuse
        // every non-head user. The authorization gate can return 403 before
        // schema lookup; a missing queue can independently return 404.
        foreach ([$admin, $staff] as $actor) {
            $read = $this->actingAs($actor)
                ->get('/work-requests/origin-delivery-exceptions');
            $this->assertContains($read->status(), [403, 404]);
            $this->assertStringNotContainsString('NO_ELIGIBLE_ORIGIN_RECIPIENT', $read->getContent());

            $write = $this->actingAs($actor)
                ->post('/work-requests/origin-delivery-exceptions/1/actions', [
                    'action' => 'resolve',
                    'note' => 'Attempted foreign mutation',
                ]);
            $this->assertContains($write->status(), [403, 404]);
            $this->assertStringNotContainsString('NO_ELIGIBLE_ORIGIN_RECIPIENT', $write->getContent());
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
