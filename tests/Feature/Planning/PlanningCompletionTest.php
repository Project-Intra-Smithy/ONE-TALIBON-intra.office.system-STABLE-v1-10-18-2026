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
use App\Services\Planning\PlanningSuiteInitializer;
use Illuminate\Database\QueryException;
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
        $this->assertSame('0.00', $ppa->fresh()->appropriation_amount);
        $this->put('/ppas/'.$ppa->id, $this->proposal(['appropriation_amount' => '0.30']))->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('0.30', $ppa->fresh()->appropriation_amount);
    }

    public function test_partial_components_remain_unknown_in_persistence_presentation_and_csv(): void
    {
        $this->seed();
        foreach ([
            ['ps_amount' => '100000.00'],
            ['ps_amount' => '0.00', 'mooe_amount' => '0.00'],
            ['ps_amount' => '0.10', 'mooe_amount' => '0.20', 'co_amount' => '0.00'],
            ['ps_amount' => '0.00', 'mooe_amount' => '0.00', 'co_amount' => '0.00'],
            ['ps_amount' => '100000.00', 'appropriation_amount' => '0.00'],
            ['ps_amount' => '0.10', 'appropriation_amount' => '12.34'],
            ['ps_amount' => '9999999999999.99', 'mooe_amount' => '0.01'],
            ['ps_amount' => '0.10', 'mooe_amount' => '0.20', 'co_amount' => '0.00', 'appropriation_amount' => null],
        ] as $index => $components) {
            $code = 'SYN-MONEY-'.$index;
            $this->actingAs($this->actor('engineering'))->post('/ppas', $this->proposal($components + ['ppa_code' => $code]))
                ->assertRedirect()->assertSessionHasNoErrors();
            $ppa = PpaRecord::query()->where('ppa_code', $code)->firstOrFail();
            $expected = [null, null, '0.30', '0.00', '0.00', '12.34', null, null][$index];
            $this->assertSame($expected, $ppa->appropriation_amount);
            foreach (['ps_amount', 'mooe_amount', 'co_amount'] as $field) {
                $this->assertSame($components[$field] ?? null, $ppa->{$field});
            }
            $this->get('/ppas')->assertInertia(fn ($page) => $page->component('PPAs/Index')
                ->where('ppaRecords', fn ($records) => collect($records)->contains(fn ($record) => $record['id'] === $code
                    && $record['amounts']['appropriation_amount'] === $expected)));
            $lines = preg_split('/\r?\n/', trim($this->get('/ppas/export/csv')->streamedContent()));
            $rows = array_map(fn ($line) => str_getcsv($line, escape: ''), $lines);
            $row = collect($rows)->first(fn ($row) => $row[0] === $code);
            $this->assertNotNull($row);
            $this->assertSame($expected ?? '', $row[12]);
            $this->assertSame($components['co_amount'] ?? '', $row[11]);
            $this->put('/ppas/'.$ppa->id, $this->proposal(['ps_amount' => '5.00', 'mooe_amount' => '6.00', 'co_amount' => '7.00']))
                ->assertRedirect()->assertSessionHasNoErrors();
            $this->assertSame($expected, $ppa->fresh()->appropriation_amount);
        }
    }

    public function test_invalid_precision_overflow_and_exponents_fail_atomically(): void
    {
        $this->seed();
        $before = AuditLog::count();
        foreach (['0.001', '1e3', '10000000000000.00', '-1.00'] as $amount) {
            $this->actingAs($this->actor('engineering'))->post('/ppas', $this->proposal(['ps_amount' => $amount]))
                ->assertSessionHasErrors('ps_amount');
        }
        $this->post('/ppas', $this->proposal(['ps_amount' => '9999999999999.99', 'mooe_amount' => '0.01', 'co_amount' => '0.00']))
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
        foreach (["UPDATE planning_attachment_reconciliations SET evidence_reference = 'Forged'", 'DELETE FROM planning_attachment_reconciliations', 'TRUNCATE planning_attachment_reconciliations'] as $sql) {
            try {
                DB::transaction(fn () => DB::statement($sql));
                $this->fail('Reconciliation evidence mutation was accepted.');
            } catch (QueryException $exception) {
                $this->assertSame('P0001', $exception->errorInfo[0]);
            }
        }

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

    public function test_typed_links_do_not_require_a_fabricated_legacy_text_reference(): void
    {
        $this->seed();
        $plan = $this->plan();
        $data = $this->proposal(['development_plan_id' => $plan->id]);
        unset($data['related_development_plan']);
        $this->post('/ppas', $data)->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame($plan->code, PpaRecord::query()->firstOrFail()->related_development_plan);
        $this->post('/planning-maps', ['map_code' => 'SYN-TYPED-MAP', 'title' => 'Synthetic typed map',
            'development_plan_id' => $plan->id, 'category' => 'Macro & Spatial', 'status' => 'Draft'])
            ->assertRedirect()->assertSessionHasNoErrors();
        $map = PlanningMap::query()->firstOrFail();
        $this->assertSame($plan->id, $map->development_plan_id);
        $this->assertSame($plan->code, $map->plan_code);
    }

    public function test_new_adoption_metadata_cannot_turn_reference_samples_into_official_evidence(): void
    {
        $this->seed();
        app(PlanningSuiteInitializer::class)->seedReferenceSamples(true);
        $sample = DevelopmentPlan::query()->firstOrFail();
        $before = AuditLog::count();
        $this->actingAs($this->actor())->put('/development-plans/'.$sample->id, [
            'title' => $sample->title, 'horizon' => $sample->horizon, 'lead_office' => $sample->lead_office,
            'coverage_start' => $sample->coverage_start, 'coverage_end' => $sample->coverage_end,
            'status' => 'Draft', 'adoption_reference' => 'Forged legal reference',
        ])->assertForbidden();
        $this->assertNull($sample->fresh()->adoption_reference);
        $this->assertSame($before, AuditLog::count());
    }

    public function test_historical_foreign_or_unknown_custody_cannot_be_claimed_through_an_authorized_parent(): void
    {
        $this->seed();
        Storage::fake('documents');
        $this->actingAs($this->actor('engineering'))->post('/ppas', $this->proposal())->assertRedirect();
        $original = PpaRecord::query()->latest('id')->firstOrFail();
        $attachment = $this->upload('ppa', $original->ppa_code);
        DB::table('planning_attachments')->where('id', $attachment->id)->update(['parent_record_id' => null]);
        $this->actingAs($this->actor('budget'))->post('/ppas', $this->proposal())->assertRedirect();
        $target = PpaRecord::query()->latest('id')->firstOrFail();
        $before = AuditLog::count();
        $this->post('/planning/attachment-custody/'.$attachment->public_id.'/reconcile', [
            'parent_record_id' => $target->id, 'evidence_reference' => 'Arbitrary but long enough explanation',
        ])->assertForbidden();
        $this->assertNull($attachment->fresh()->parent_record_id);
        $this->assertNull($attachment->fresh()->archived_at);
        $this->assertDatabaseCount('planning_attachment_reconciliations', 0);
        $this->assertSame($before, AuditLog::count());
        $this->get(route('planning.attachments.preview', $attachment))->assertOk();
        DB::table('planning_attachments')->where('id', $attachment->id)->update(['owner_department_id' => null]);
        $this->actingAs($this->actor('engineering'))->post('/planning/attachment-custody/'.$attachment->public_id.'/reconcile', [
            'parent_record_id' => $original->id, 'evidence_reference' => 'Unproven historical ownership evidence',
        ])->assertForbidden();
        $this->assertNull($attachment->fresh()->parent_record_id);
        $this->assertDatabaseCount('planning_attachment_reconciliations', 0);
    }

    public function test_explicit_and_generated_identifiers_share_permanent_non_reuse_reservations(): void
    {
        $this->seed();
        $this->actingAs($this->actor('engineering'))->post('/ppas', $this->proposal(['ppa_code' => 'PPA-2027-101']))
            ->assertRedirect()->assertSessionHasNoErrors();
        $ppa = PpaRecord::query()->firstOrFail();
        $this->delete('/ppas/'.$ppa->id)->assertRedirect()->assertSessionHasNoErrors();
        $before = AuditLog::count();
        $this->post('/ppas', $this->proposal(['ppa_code' => 'PPA-2027-101']))->assertSessionHasErrors('ppa_code');
        $this->assertSame(0, PpaRecord::count());
        $this->assertSame($before, AuditLog::count());
        $this->post('/ppas', $this->proposal())->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('PPA-2027-102', PpaRecord::query()->firstOrFail()->ppa_code);
        $this->assertDatabaseHas('planning_ppa_identifiers', ['code' => 'PPA-2027-101']);
        foreach (["UPDATE planning_ppa_identifiers SET code = 'FORGED'", 'DELETE FROM planning_ppa_identifiers', 'TRUNCATE planning_ppa_identifiers'] as $sql) {
            try {
                DB::transaction(fn () => DB::statement($sql));
                $this->fail('Issued identifier reservation was discarded.');
            } catch (QueryException $exception) {
                $this->assertSame('P0001', $exception->errorInfo[0]);
            }
        }
    }

    public function test_partial_schedule_updates_validate_against_the_locked_existing_interval(): void
    {
        $this->seed();
        $this->actingAs($this->actor('engineering'))->post('/ppas', $this->proposal([
            'schedule_start' => '2027-01-01', 'schedule_end' => '2027-12-31', 'barangay' => 'Legacy scalar',
        ]))->assertRedirect()->assertSessionHasNoErrors();
        $ppa = PpaRecord::query()->firstOrFail();
        $before = AuditLog::count();
        $this->put('/ppas/'.$ppa->id, $this->proposal(['schedule_start' => '2028-01-01']))->assertSessionHasErrors('schedule_end');
        $this->assertSame('2027-01-01', $ppa->fresh()->schedule_start->format('Y-m-d'));
        $this->assertSame($before, AuditLog::count());
        $this->put('/ppas/'.$ppa->id, $this->proposal(['schedule_end' => '2027-11-30']))->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('2027-11-30', $ppa->fresh()->schedule_end->format('Y-m-d'));
        $this->assertSame('Legacy scalar', $ppa->fresh()->barangay);
        $this->assertNull($ppa->fresh()->covered_barangays);
        $this->put('/ppas/'.$ppa->id, $this->proposal(['covered_barangays' => ['Independent coverage']]))->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('Legacy scalar', $ppa->fresh()->barangay);
        $this->assertSame(['Independent coverage'], $ppa->fresh()->covered_barangays);
    }
}
