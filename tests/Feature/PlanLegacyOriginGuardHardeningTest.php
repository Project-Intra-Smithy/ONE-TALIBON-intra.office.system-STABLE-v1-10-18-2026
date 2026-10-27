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

    public function test_genuine_preplan_schema_can_still_classify_ordinary_legacy_record(): void
    {
        $document = Document::query()->create(['title' => 'Synthetic old baseline']);

        Schema::shouldReceive('hasColumn')->once()
            ->with('documents', 'security_domain')->andReturn(false);
        Schema::shouldReceive('hasTable')->once()
            ->with('plan_document_origin_receipts')->andReturn(false);

        $this->assertFalse(PlanDocumentOriginGuard::isProtected($document));
    }
}
