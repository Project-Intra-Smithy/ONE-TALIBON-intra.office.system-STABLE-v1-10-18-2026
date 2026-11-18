<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Services\PlanDocumentOriginGuard;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/** Synthetic defense-in-depth regressions; requires disposable PostgreSQL. */
final class PlanLegacyOriginGuardHardeningTest extends TestCase
{
    use RefreshDatabase;

    public function test_stale_legacy_model_cannot_hide_a_newly_sealed_plan_origin(): void
    {
        $document = Document::query()->create(['title' => 'Synthetic stale legacy']);
        $this->assertNull($document->getAttribute('security_domain'));

        DB::table('documents')->where('id', $document->id)
            ->update(['security_domain' => 'EVER_PLAN']);

        $this->assertTrue(PlanDocumentOriginGuard::isProtected($document));
        $this->assertDatabaseHas('plan_document_origin_receipts', ['document_id' => $document->id]);
    }

    public function test_deleted_legacy_document_model_is_not_safe_for_byte_cleanup(): void
    {
        $document = Document::query()->create(['title' => 'Synthetic deleted record']);
        DB::table('documents')->where('id', $document->id)->delete();

        $this->assertTrue(PlanDocumentOriginGuard::isProtected($document));
    }

    public function test_unsaved_document_is_never_safe_for_legacy_cleanup(): void
    {
        $document = new Document(['title' => 'Synthetic unsaved']);
        $this->assertTrue(PlanDocumentOriginGuard::isProtected($document));
    }

    public function test_missing_receipt_table_in_partially_upgraded_schema_denies_legacy_access(): void
    {
        $document = Document::query()->create(['title' => 'Synthetic partial schema']);

        Schema::shouldReceive('hasColumn')->once()
            ->with('documents', 'security_domain')->andReturn(true);
        Schema::shouldReceive('hasTable')->once()
            ->with('plan_document_origin_receipts')->andReturn(false);

        $this->assertTrue(PlanDocumentOriginGuard::isProtected($document));
    }

    public function test_missing_domain_column_with_receipts_denies_legacy_access(): void
    {
        $document = Document::query()->create(['title' => 'Synthetic inverse partial schema']);

        Schema::shouldReceive('hasColumn')->once()
            ->with('documents', 'security_domain')->andReturn(false);
        Schema::shouldReceive('hasTable')->once()
            ->with('plan_document_origin_receipts')->andReturn(true);

        $this->assertTrue(PlanDocumentOriginGuard::isProtected($document));
    }

    public function test_current_candidate_denies_dual_absent_provenance(): void
    {
        $document = Document::query()->create(['title' => 'Synthetic old baseline']);

        Schema::shouldReceive('hasColumn')->once()
            ->with('documents', 'security_domain')->andReturn(false);
        Schema::shouldReceive('hasTable')->once()
            ->with('plan_document_origin_receipts')->andReturn(false);

        $this->assertTrue(PlanDocumentOriginGuard::isProtected($document));
    }

    public function test_ordinary_generic_plan_link_insert_update_delete_remain_denied(): void
    {
        $document = Document::query()->create(['title' => 'Synthetic Plan link guard']);
        DB::table('documents')->where('id', $document->id)->update(['security_domain' => 'EVER_PLAN']);
        $link = [
            'document_id' => $document->id, 'linkable_type' => 'synthetic',
            'linkable_id' => 1, 'relationship' => 'attachment',
            'created_at' => now(), 'updated_at' => now(),
        ];
        $assertRejected = function (callable $operation): void {
            try {
                DB::transaction($operation);
                $this->fail('Expected ordinary generic mutation to be denied.');
            } catch (\Illuminate\Database\QueryException $e) {
                $this->assertSame('23514', (string) ($e->errorInfo[0] ?? ''));
            }
        };
        $assertRejected(fn () => DB::table('document_links')->insert($link));
        // Existing impossible graph, synthetic only. Restore named guard before reads/writes.
        DB::statement('ALTER TABLE document_links DISABLE TRIGGER kirion_plan_generic_link_guard_trigger');
        try {
            $id = DB::table('document_links')->insertGetId($link);
        } finally {
            DB::statement('ALTER TABLE document_links ENABLE TRIGGER kirion_plan_generic_link_guard_trigger');
        }
        $assertRejected(fn () => DB::table('document_links')->where('id', $id)->update(['relationship' => 'changed']));
        $assertRejected(fn () => DB::table('document_links')->where('id', $id)->delete());
        $this->assertDatabaseHas('document_links', ['id' => $id, 'relationship' => 'attachment']);
    }

    public function test_new_preview_fails_closed_when_provenance_discovery_throws(): void
    {
        $document = Document::query()->create(['title' => 'Synthetic new preview']);
        Schema::shouldReceive('hasColumn')->once()
            ->with('documents', 'security_domain')->andThrow(new \RuntimeException('Synthetic schema failure'));

        $this->assertFalse(PlanDocumentOriginGuard::isEligibleForLegacyPreview($document));
    }

    public function test_persisted_decision_query_exception_is_protected(): void
    {
        $document = Document::query()->create(['title' => 'Synthetic R4 database failure']);
        // Make the two schema prerequisites explicit so the injected failure
        // is reached at the persisted-read operation, not swallowed earlier.
        Schema::partialMock();
        Schema::shouldReceive('hasColumn')->once()->with('documents', 'security_domain')->andReturn(true);
        Schema::shouldReceive('hasTable')->once()->with('plan_document_origin_receipts')->andReturn(true);
        DB::partialMock();
        DB::shouldReceive('table')->once()->with('documents as d')
            ->andThrow(new \RuntimeException('Synthetic persisted read failure'));

        $this->assertTrue(PlanDocumentOriginGuard::isProtected($document));
    }

    public function test_loaded_sealed_model_remains_protected_even_when_current_row_is_legacy(): void
    {
        $document = Document::query()->create(['title' => 'Synthetic stale protected model']);
        $document->setAttribute('security_domain', 'EVER_PLAN');
        $this->assertTrue(PlanDocumentOriginGuard::isProtected($document));
    }

    public function test_persisted_legacy_check_reads_domain_receipt_and_binding_in_one_bounded_decision(): void
    {
        $document = Document::query()->create(['title' => 'Synthetic ordinary legacy']);

        DB::connection()->enableQueryLog();
        DB::connection()->flushQueryLog();
        try {
            $this->assertFalse(PlanDocumentOriginGuard::isProtected($document));
            $queries = DB::connection()->getQueryLog();
        } finally {
            DB::connection()->disableQueryLog();
            DB::connection()->flushQueryLog();
        }

        // Two schema checks, one readiness probe, one persisted set-based
        // decision. No positive cache, no per-link or per-binding iteration.
        $this->assertCount(4, $queries);
        $this->assertCount(1, array_filter(
            $queries,
            static fn (array $query): bool => str_contains(strtolower($query['query']), 'not exists')
                && str_contains($query['query'], 'plan_document_origin_receipts')
                && str_contains($query['query'], 'plan_document_bindings'),
        ));
        DB::table('documents')->where('id', $document->id)->update(['security_domain' => 'EVER_PLAN']);
        $this->assertTrue(PlanDocumentOriginGuard::isProtected($document));
    }
}
