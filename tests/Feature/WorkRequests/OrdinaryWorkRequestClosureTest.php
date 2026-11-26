<?php

namespace Tests\Feature\WorkRequests;

use App\Models\User;
use App\Services\Custody\WorkRequestCloseDocumentPdf;
use App\Services\TransactionLiveQuery;
use App\Services\TransactionWorkflowService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

final class OrdinaryWorkRequestClosureTest extends TestCase
{
    use RefreshDatabase;

    public function test_live_close_fails_closed_when_n03_is_not_authorized(): void
    {
        $this->seed();
        config(['work_requests.n03_namespace_id' => null, 'work_requests.n03_epoch' => 0]);

        $origin = User::query()->where('email', 'engineering@talibon.demo')->firstOrFail();
        $head = User::query()->where('email', 'planning@talibon.demo')->firstOrFail();
        $admin = User::query()->where('email', 'admin@talibon.demo')->firstOrFail();
        $workflow = app(TransactionWorkflowService::class);
        $transaction = $workflow->create($origin, [
            'transaction_type' => 'internal_request',
            'title' => 'Synthetic custody-gated closure',
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

        $this->actingAs($head)->post($path, ['action' => 'close', 'remarks' => '  '])
            ->assertSessionHasErrors('remarks');

        // Role permission is not an operational capability until actual N03
        // custody is configured and verified; do not advertise an active action.
        $this->assertFalse(app(TransactionLiveQuery::class)->snapshot($head, $transaction)['permissions']['canClose']);
        $this->post($path, $outcome)->assertSessionHasErrors('action');

        $transaction->refresh();
        $this->assertSame('for_review', $transaction->status);
        $this->assertNull($transaction->completed_at);
        $this->assertSame(0, $transaction->events()->where('action', 'close')->count());
        $this->assertDatabaseMissing('audit_logs', [
            'entity_id' => $transaction->id,
            'action' => 'transaction.close',
        ]);
        $this->assertDatabaseMissing('platform_notifications', [
            'source_id' => $transaction->id,
            'title' => 'Transaction completed',
        ]);

        // Non-HTTP legacy code must also be incapable of a successful close.
        try {
            $workflow->transition($head, $transaction, 'close', remarks: $outcome['remarks']);
            $this->fail('Legacy Eloquent close unexpectedly succeeded.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('action', $e->errors());
        }
        $this->assertSame(0, $transaction->events()->where('action', 'close')->count());
    }

    public function test_nonordinary_labels_remain_ineligible_for_closure(): void
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

    public function test_generated_custody_statement_is_real_pdf_not_fabricated_municipal_approval(): void
    {
        $path = app(WorkRequestCloseDocumentPdf::class)->write(
            'TAL-2026-SYNTHETIC',
            'Closed after checking supporting material.',
            42,
        );

        try {
            $body = file_get_contents($path);
            $this->assertIsString($body);
            $this->assertStringStartsWith('%PDF-1.4', $body);
            $this->assertStringContainsString('%%EOF', $body);
            $this->assertStringContainsString('NOT a municipal signing authority', $body);
            $this->assertStringContainsString('TAL-2026-SYNTHETIC', $body);
        } finally {
            @unlink($path);
        }
    }
}
