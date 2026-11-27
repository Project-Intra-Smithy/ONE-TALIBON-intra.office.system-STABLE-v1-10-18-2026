<?php

declare(strict_types=1);

namespace Tests\Feature\Planning;

use App\Models\AuditLog;
use App\Models\DevelopmentPlan;
use App\Models\PlanningAttachment;
use App\Models\PlanningMap;
use App\Models\PpaRecord;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\Planning\PlanningReferences;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

final class PlanningCompletionTest extends TestCase
{
    use RefreshDatabase;

    private function actor(string $office = 'planning'): User
    {
        return User::query()->where('email', $office.'@talibon.demo')->firstOrFail();
    }

    private function proposal(array $extra = []): array
    {
        return $extra + ['title' => 'Synthetic completion proposal', 'sector' => 'Infrastructure',
            'year' => 2027, 'related_development_plan' => 'Unreconciled historical reference',
            'funding_source' => 'Synthetic test funding', 'status' => 'Draft'];
    }

    private function plan(array $extra = []): DevelopmentPlan
    {
        $this->actingAs($this->actor())->post('/development-plans', $extra + [
            'code' => 'SYNTHETIC-COMPLETE', 'title' => 'Synthetic dossier', 'horizon' => 'Annual',
            'lead_office' => $this->actor()->employee->department->name, 'coverage_start' => 2027,
            'coverage_end' => 2027, 'status' => 'Draft',
        ])->assertRedirect()->assertSessionHasNoErrors();

        return DevelopmentPlan::query()->where('code', $extra['code'] ?? 'SYNTHETIC-COMPLETE')->firstOrFail();
    }

    private function upload(string $type, string $code): PlanningAttachment
    {
        $this->post('/planning/attachments', ['parent_type' => $type, 'parent_code' => $code,
            'title' => 'Synthetic retained evidence', 'category' => 'cartographic_plate', 'visibility' => 'lgu_internal',
            'file' => UploadedFile::fake()->createWithContent('evidence.pdf', "%PDF-1.4\n%%EOF"),
        ])->assertRedirect()->assertSessionHasNoErrors();

        return PlanningAttachment::query()->latest('id')->firstOrFail();
    }

    public function test_exact_amounts_zero_total_and_unknown_facts_round_trip_without_float_arithmetic(): void
    {
        $this->seed();
        $this->actingAs($this->actor('engineering'))->post('/ppas', $this->proposal([
            'ps_amount' => '9999999999999.98', 'mooe_amount' => '0.01', 'co_amount' => '0.00',
        ]))->assertRedirect()->assertSessionHasNoErrors();
        $ppa = PpaRecord::query()->firstOrFail();
        $this->assertSame('9999999999999.99', $ppa->appropriation_amount);
        $this->assertSame('9999999999999.98', $ppa->ps_amount);
        $this->assertNull($ppa->barangay);
        $this->assertNull($ppa->location);
        $this->assertNull($ppa->target_quarter);
        $this->assertNull($ppa->development_plan_id);
        $this->assertStringContainsString('9999999999999.99', $this->get('/ppas/export/csv')->streamedContent());
        $this->put('/ppas/'.$ppa->id, $this->proposal(['ps_amount' => '0.10', 'mooe_amount' => '0.20', 'co_amount' => '0.00', 'appropriation_amount' => '0.00']))
            ->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('0.00', $ppa->fresh()->appropriation_amount);
        $this->put('/ppas/'.$ppa->id, $this->proposal(['ps_amount' => '0.10', 'mooe_amount' => '0.20', 'co_amount' => '0.00']))
            ->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('0.30', $ppa->fresh()->appropriation_amount);
    }

    public function test_invalid_precision_overflow_and_exponents_fail_atomically(): void
    {
        $this->seed();
        $before = AuditLog::count();
        foreach (['0.001', '1e3', '10000000000000.00', '-1.00'] as $amount) {
            $this->actingAs($this->actor('engineering'))->post('/ppas', $this->proposal(['ps_amount' => $amount]))
                ->assertSessionHasErrors('ps_amount');
        }
        $this->post('/ppas', $this->proposal(['ps_amount' => '9999999999999.99', 'mooe_amount' => '0.01']))
            ->assertSessionHasErrors('appropriation_amount');
        $this->assertSame(0, PpaRecord::count());
        $this->assertSame($before, AuditLog::count());
    }

    public function test_generated_references_are_not_count_based_or_reused_after_deletion(): void
    {
        $this->seed();
        $this->actingAs($this->actor('engineering'))->post('/ppas', $this->proposal(['ppa_code' => 'PPA-2027-101']))->assertRedirect();
        $this->post('/ppas', $this->proposal())->assertRedirect()->assertSessionHasNoErrors();
        $second = PpaRecord::query()->where('ppa_code', 'PPA-2027-102')->firstOrFail();
        $this->delete('/ppas/'.$second->id)->assertRedirect()->assertSessionHasNoErrors();
        $this->post('/ppas', $this->proposal())->assertRedirect()->assertSessionHasNoErrors();
        $this->assertTrue(PpaRecord::query()->where('ppa_code', 'PPA-2027-103')->exists());
    }

    public function test_dossier_fields_typed_links_and_retention_are_persisted_and_scoped(): void
    {
        $this->seed();
        $plan = $this->plan(['chapters' => ['Synthetic chapter one'], 'adoption_reference' => 'Synthetic reference only', 'adoption_date' => '2027-01-12']);
        $this->assertSame(['Synthetic chapter one'], $plan->chapters);
        $this->assertSame('2027-01-12', $plan->adoption_date->format('Y-m-d'));
        $this->actingAs($this->actor('engineering'))->post('/ppas', $this->proposal([
            'development_plan_id' => $plan->id, 'expected_outputs' => 'Synthetic deliverables',
            'schedule_start' => '2027-02-01', 'schedule_end' => '2027-12-01', 'covered_barangays' => ['Synthetic test coverage'],
        ]))->assertRedirect()->assertSessionHasNoErrors();
        $ppa = PpaRecord::query()->firstOrFail();
        $this->assertSame($plan->id, $ppa->development_plan_id);
        $this->assertSame('Synthetic deliverables', $ppa->expected_outputs);
        $this->assertSame(['Synthetic test coverage'], $ppa->covered_barangays);
        $this->actingAs($this->actor())->delete('/development-plans/'.$plan->id)->assertSessionHasErrors('reference');
        $this->assertNotNull($plan->fresh());
        $this->actingAs($this->actor('employee'))->put('/ppas/'.$ppa->id, $this->proposal(['expected_outputs' => 'Forged']))->assertForbidden();
        $this->assertSame('Synthetic deliverables', $ppa->fresh()->expected_outputs);
        $this->actingAs($this->actor('engineering'))->post('/ppas', $this->proposal(['development_plan_id' => 99999999]))->assertSessionHasErrors('development_plan_id');
    }

    public function test_private_map_plate_cannot_be_taken_from_another_parent(): void
    {
        $this->seed();
        Storage::fake('documents');
        $this->actingAs($this->actor());
        foreach (['SYN-MAP-A', 'SYN-MAP-B'] as $code) {
            $this->post('/planning-maps', ['map_code' => $code, 'title' => $code, 'category' => 'Macro & Spatial', 'plan_code' => 'Unknown reference', 'status' => 'Draft'])
                ->assertRedirect()->assertSessionHasNoErrors();
        }
        $a = PlanningMap::query()->where('map_code', 'SYN-MAP-A')->firstOrFail();
        $b = PlanningMap::query()->where('map_code', 'SYN-MAP-B')->firstOrFail();
        $this->assertNull($a->center_lat);
        $this->assertNull($a->coverage);
        $this->assertNull($a->crs);
        $plate = $this->upload('map', $a->map_code);
        $data = ['title' => 'Synthetic plate binding', 'category' => 'Macro & Spatial', 'plan_code' => 'Unknown reference', 'status' => 'Draft', 'plate_attachment_id' => $plate->id];
        $this->put('/planning-maps/'.$b->id, $data)->assertSessionHasErrors('plate_attachment_id');
        $this->assertNull($b->fresh()->plate_attachment_id);
        $this->put('/planning-maps/'.$a->id, $data)->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame($plate->id, $a->fresh()->plate_attachment_id);
        $this->actingAs($this->actor('employee'))->get(route('planning.attachments.preview', $plate))->assertOk();
    }

    public function test_historical_reconciliation_is_explicit_atomic_and_cannot_reassign_a_binding(): void
    {
        $this->seed();
        Storage::fake('documents');
        $plan = $this->plan();
        $attachment = $this->upload('plan', $plan->code);
        DB::table('planning_attachments')->where('id', $attachment->id)->update(['parent_record_id' => null]);
        $data = ['parent_record_id' => $plan->id, 'evidence_reference' => 'Synthetic custody evidence reference'];
        $this->actingAs($this->actor('employee'))->get('/planning/attachment-custody')->assertOk();
        $this->post('/planning/attachment-custody/'.$attachment->public_id.'/reconcile', $data)->assertForbidden();
        $this->assertDatabaseCount('planning_attachment_reconciliations', 0);
        $this->actingAs($this->actor())->post('/planning/attachment-custody/'.$attachment->public_id.'/reconcile', $data)->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame($plan->id, $attachment->fresh()->parent_record_id);
        $this->assertSame($plan->code, $attachment->fresh()->parent_code);
        $this->post('/planning/attachment-custody/'.$attachment->public_id.'/reconcile', $data)->assertSessionHasErrors('parent_record_id');
        $this->assertDatabaseCount('planning_attachment_reconciliations', 1);
        $this->delete('/planning/attachments/'.$attachment->public_id)->assertRedirect()->assertSessionHasNoErrors();
        $this->assertNotNull($attachment->fresh()->archived_at);
    }

    public function test_orphan_discovery_survives_empty_parent_register_and_audit_failure_rolls_back_binding(): void
    {
        $this->seed();
        Storage::fake('documents');
        $plan = $this->plan();
        $attachment = $this->upload('plan', $plan->code);
        DB::table('planning_attachments')->where('id', $attachment->id)->update(['parent_record_id' => null]);
        $plan->delete();
        $this->actingAs($this->actor('employee'))->get('/planning/attachment-custody')->assertInertia(fn ($page) => $page->component('PlanningCustody/Index')->where('records.data.0.publicId', $attachment->public_id)->where('records.data.0.parentExists', false));
        $replacement = $this->plan(['code' => 'SYN-RECONCILED']);
        $this->mock(AuditLogger::class)->shouldReceive('record')->once()->andThrow(new \RuntimeException('Synthetic audit failure'));
        $this->post('/planning/attachment-custody/'.$attachment->public_id.'/reconcile', ['parent_record_id' => $replacement->id, 'evidence_reference' => 'Synthetic verified evidence'])->assertServerError();
        $this->assertNull($attachment->fresh()->parent_record_id);
        $this->assertDatabaseCount('planning_attachment_reconciliations', 0);
        Storage::disk('documents')->assertExists($attachment->storage_path);
    }

    public function test_reference_allocator_holds_the_cross_connection_identity_lock(): void
    {
        $this->seed();
        $code = DB::transaction(fn () => app(PlanningReferences::class)->nextPpa(2027));
        $this->assertSame('PPA-2027-101', $code);
        // RefreshDatabase retains the surrounding transaction and its allocator lock.
        $config = config('database.connections.pgsql');
        $second = new \PDO('pgsql:host='.$config['host'].';port='.$config['port'].';dbname='.$config['database'], $config['username'], $config['password'], [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]);
        $second->beginTransaction();
        try {
            $second->exec("SET LOCAL lock_timeout = '150ms'");
            $second->query('SELECT pg_advisory_xact_lock(741002)');
            $this->fail('A competing allocation bypassed the transaction lock.');
        } catch (\PDOException $exception) {
            $this->assertSame('55P03', $exception->getCode());
        } finally {
            $second->rollBack();
        }
    }
}
