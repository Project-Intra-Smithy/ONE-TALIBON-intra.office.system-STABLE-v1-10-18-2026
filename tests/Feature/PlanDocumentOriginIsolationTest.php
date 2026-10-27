<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\PlanEdition;
use App\Models\PlanFamily;
use App\Services\PlanDocumentOriginGuard;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/** Synthetic PG negative tests; NOT_RUN until disposable PG lease is approved. */
final class PlanDocumentOriginIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_existing_legacy_document_does_not_inherit_plan_provenance(): void
    {
        $document = Document::query()->create(['title' => 'Synthetic legacy']);
        $this->assertNull($document->fresh()->getAttribute('security_domain'));
        $this->assertDatabaseMissing('plan_document_origin_receipts', ['document_id' => $document->id]);
        $this->assertFalse(PlanDocumentOriginGuard::isProtected($document));
    }

    public function test_plan_origin_is_sealed_and_generic_links_and_downgrade_are_rejected(): void
    {
        $document = Document::query()->create(['title' => 'Synthetic Plan']);
        DB::table('documents')->where('id', $document->id)->update(['security_domain' => 'EVER_PLAN']);
        $this->assertTrue(PlanDocumentOriginGuard::isProtected($document->fresh()));
        $this->assertDatabaseHas('plan_document_origin_receipts', ['document_id' => $document->id]);

        $this->assertRejected(static function () use ($document): void {
            DB::table('document_links')->insert([
                'document_id' => $document->id,
                'linkable_type' => 'synthetic',
                'linkable_id' => 1,
                'relationship' => 'attachment',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });
        $this->assertRejected(static function () use ($document): void {
            DB::table('documents')->where('id', $document->id)->update(['security_domain' => 'LEGACY_CTW']);
        });
        $this->assertRejected(static function () use ($document): void {
            DB::table('documents')->where('id', $document->id)->delete();
        });
    }

    public function test_generic_link_prevents_future_plan_promotion(): void
    {
        $document = Document::query()->create(['title' => 'Linked legacy']);
        DB::table('document_links')->insert([
            'document_id' => $document->id,
            'linkable_type' => 'synthetic',
            'linkable_id' => 1,
            'relationship' => 'attachment',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->assertRejected(static function () use ($document): void {
            DB::table('documents')->where('id', $document->id)->update(['security_domain' => 'EVER_PLAN']);
        });
        $this->assertDatabaseMissing('plan_document_origin_receipts', ['document_id' => $document->id]);
    }

    public function test_generic_plan_morph_links_reject_even_without_plan_origin(): void
    {
        $document = Document::query()->create(['title' => 'Synthetic unrelated']);
        $this->assertRejected(static function () use ($document): void {
            DB::table('document_links')->insert([
                'document_id' => $document->id,
                'linkable_type' => PlanEdition::class,
                'linkable_id' => 1,
                'relationship' => 'attachment',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });
    }

    public function test_typed_binding_requires_sealed_plan_and_remains_quarantined(): void
    {
        $family = PlanFamily::query()->create(['title' => 'Synthetic']);
        $edition = $family->editions()->create(['edition_label' => 'Unapproved fixture']);
        $document = Document::query()->create(['title' => 'Synthetic file']);
        $this->assertRejected(static fn () => self::insertBinding($edition, $document));

        DB::table('documents')->where('id', $document->id)->update(['security_domain' => 'EVER_PLAN']);
        self::insertBinding($edition, $document);
        $this->assertDatabaseHas('plan_document_bindings', [
            'plan_edition_id' => $edition->id,
            'document_id' => $document->id,
            'binding_state' => 'QUARANTINED',
        ]);
        $this->assertRejected(static function () use ($document): void {
            DB::table('plan_document_bindings')->where('document_id', $document->id)->delete();
        });
    }

    private static function insertBinding(PlanEdition $edition, Document $document): void
    {
        DB::table('plan_document_bindings')->insert([
            'plan_edition_id' => $edition->id,
            'document_id' => $document->id,
            'role' => 'master',
            'revision_no' => 1,
            'binding_state' => 'QUARANTINED',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function assertRejected(callable $operation): void
    {
        $thrown = false;
        try {
            DB::transaction($operation);
        } catch (QueryException $e) {
            $thrown = true;
            $this->assertSame('23514', (string) ($e->errorInfo[0] ?? ''));
        }
        $this->assertTrue($thrown, 'PostgreSQL must reject this ordinary mutation.');
    }
}
