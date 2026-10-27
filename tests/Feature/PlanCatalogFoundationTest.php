<?php

namespace Tests\Feature;

use App\Models\PlanEdition;
use App\Models\PlanFamily;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Synthetic fixtures only; requires the approved disposable PostgreSQL test DB.
 */
final class PlanCatalogFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_family_has_public_identifier_and_distinct_editions(): void
    {
        $family = PlanFamily::query()->create(['title' => 'Synthetic family']);
        $first = $family->editions()->create(['edition_label' => 'Fixture A']);
        $second = $family->editions()->create(['edition_label' => 'Fixture B']);

        $this->assertNotSame($first->public_id, $second->public_id);
        $this->assertNotSame($family->public_id, $first->public_id);
        $this->assertSame($family->id, $first->family->id);
        $this->assertSame(2, $family->editions()->count());
        $this->assertSame(
            $first->id,
            PlanEdition::query()->where('public_id', $first->public_id)->firstOrFail()->id,
        );
    }

    public function test_catalog_metadata_does_not_create_legacy_document_links(): void
    {
        $documentsBefore = DB::table('documents')->count();
        $linksBefore = DB::table('document_links')->count();

        $family = PlanFamily::query()->create(['title' => 'Synthetic metadata']);
        $family->editions()->create(['edition_label' => 'Unverified fixture']);

        $this->assertSame($documentsBefore, DB::table('documents')->count());
        $this->assertSame($linksBefore, DB::table('document_links')->count());
        $this->assertFalse(Schema::hasColumn('plan_editions', 'document_id'));
    }

    public function test_same_edition_label_can_exist_in_distinct_families(): void
    {
        $first = PlanFamily::query()->create(['title' => 'Synthetic one']);
        $second = PlanFamily::query()->create(['title' => 'Synthetic two']);

        $this->assertNotSame(
            $first->editions()->create(['edition_label' => 'Draft 2026'])->public_id,
            $second->editions()->create(['edition_label' => 'Draft 2026'])->public_id,
        );
    }
}
