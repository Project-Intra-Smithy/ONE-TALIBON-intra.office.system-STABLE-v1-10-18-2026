<?php

namespace Tests\Feature\WorkRequests;

use App\Models\User;
use App\Services\Reports\TransactionOperationalReportQuery;
use App\Services\TransactionLiveQuery;
use App\Services\TransactionWorkflowService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class OrdinaryWorkRequestClosureTest extends TestCase
{
    use RefreshDatabase;

    public function test_receiving_head_can_close_once_with_an_outcome_and_notify_origin(): void
    {
        $this->seed();

        $origin = User::query()->where('email', 'engineering@talibon.demo')->firstOrFail();
        $head = User::query()->where('email', 'planning@talibon.demo')->firstOrFail();
        $admin = User::query()->where('email', 'admin@talibon.demo')->firstOrFail();
        $workflow = app(TransactionWorkflowService::class);
        $transaction = $workflow->create($origin, [
            'transaction_type' => 'internal_request',
            'title' => 'Synthetic ordinary closure',
            'priority' => 'normal',
            'target_department_id' => $head->employee->department_id,
            'action_required' => 'For Information',
        ]);
        $path = "/transactions/{$transaction->id}/transition";
        $outcome = ['action' => 'close', 'remarks' => 'Information reviewed and filed.'];

        $this->actingAs($head)->post($path, $outcome)->assertForbidden();
        $transaction = $workflow->transition($head, $transaction, 'mark_review');
        $this->actingAs($admin)->post($path, $outcome)->assertForbidden();
        $this->actingAs($origin)->post($path, $outcome)->assertForbidden();

        foreach (['employee', 'budget', 'mayor'] as $identity) {
            $actor = User::query()->where('email', $identity.'@talibon.demo')->firstOrFail();
            $this->actingAs($actor)->post($path, $outcome)->assertForbidden();
        }

        $this->actingAs($head);
        $head->increment('session_version');
        $this->post($path, $outcome)->assertRedirect(route('login'));
        $head->refresh();

        $this->actingAs($head)->post($path, ['action' => 'close', 'remarks' => '  '])
            ->assertSessionHasErrors('remarks');
        $this->assertTrue(app(TransactionLiveQuery::class)->snapshot($head, $transaction)['permissions']['canClose']);
        $this->post($path, $outcome)->assertRedirect();

        $transaction->refresh();
        $this->assertSame('closed', $transaction->status);
        $this->assertNotNull($transaction->completed_at);
        $event = $transaction->events()->where('action', 'close')->sole();
        $this->assertSame($head->id, $event->actor_user_id);
        $this->assertSame($outcome['remarks'], $event->remarks);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'transaction.close',
            'entity_id' => $transaction->id,
            'actor_user_id' => $head->id,
        ]);
        $this->assertDatabaseHas('platform_notifications', [
            'event_key' => 'transaction-event-'.$event->id,
            'user_id' => $origin->id,
            'source_id' => $transaction->id,
        ]);
        $completed = app(TransactionOperationalReportQuery::class)->rows('completed-work', $origin, [], false);
        $this->assertTrue($completed->contains(fn (array $row): bool => $row['reference'] === $transaction->reference_no));
        $this->assertFalse(app(TransactionLiveQuery::class)->snapshot($head, $transaction)['permissions']['canClose']);
        $this->post($path, $outcome)->assertForbidden();
        $this->assertSame(1, $transaction->events()->where('action', 'close')->count());
    }

    public function test_nonordinary_labels_cannot_use_the_close_action(): void
    {
        $this->seed();

        $origin = User::query()->where('email', 'engineering@talibon.demo')->firstOrFail();
        $head = User::query()->where('email', 'planning@talibon.demo')->firstOrFail();
        $workflow = app(TransactionWorkflowService::class);
        foreach (['For Approval', 'For Signature', 'For Review', 'for information', null] as $label) {
            $transaction = $workflow->create($origin, [
                'transaction_type' => 'internal_request',
                'title' => 'Synthetic ineligible closure',
                'priority' => 'normal',
                'target_department_id' => $head->employee->department_id,
                'action_required' => $label,
            ]);
            $transaction = $workflow->transition($head, $transaction, 'mark_review');
            $this->actingAs($head)->post("/transactions/{$transaction->id}/transition", [
                'action' => 'close',
                'remarks' => 'Cannot close this classification.',
            ])->assertForbidden();
            $this->assertSame('for_review', $transaction->fresh()->status);
            $this->assertFalse($transaction->events()->where('action', 'close')->exists());
        }
    }
}
