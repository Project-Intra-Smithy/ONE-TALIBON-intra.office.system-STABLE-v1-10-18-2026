<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentLink;
use App\Models\Employee;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\DocumentAccessService;
use App\Services\DocumentAttachmentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

/**
 * Synthetic-only, side-effect boundary tests for existing legacy callers.
 * Does not establish protected Plan preview/download or cross-request TOCTOU safety.
 */
final class PlanLegacyCallerBoundaryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['documents.disk' => 'documents']);
        Storage::fake('documents');
    }

    public function test_sealed_plan_download_is_masked_and_the_blob_remains_private(): void
    {
        $actor = $this->actor();
        $document = $this->storedDocument($actor, 'PLAN-BYTES-NEVER-SERVE');
        DB::table('documents')->where('id', $document->id)
            ->update(['security_domain' => 'EVER_PLAN']);

        $this->actingAs($actor)
            ->get('/documents/'.$document->public_id.'/download')
            ->assertNotFound()
            ->assertDontSee('PLAN-BYTES-NEVER-SERVE');

        Storage::disk('documents')->assertExists($document->storage_path);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'document.download',
            'outcome' => 'denied',
        ]);
    }

    public function test_partial_provenance_schema_masks_an_otherwise_authorized_legacy_download(): void
    {
        $actor = $this->actor();
        $document = $this->authorizedLegacyDocument($actor);
        $this->actingAs($actor);
        $this->assertTrue(app(DocumentAccessService::class)->canDownload($actor, $document));

        Schema::partialMock();
        Schema::shouldReceive('hasColumn')->once()
            ->with('documents', 'security_domain')->andReturn(true);
        Schema::shouldReceive('hasTable')->once()
            ->with('plan_document_origin_receipts')->andReturn(false);

        $this->get('/documents/'.$document->public_id.'/download')
            ->assertNotFound()
            ->assertDontSee('SYNTHETIC-LEGACY-DOCUMENT');

        Storage::disk('documents')->assertExists($document->storage_path);
    }

    public function test_database_schema_probe_failure_denies_an_otherwise_authorized_service_download(): void
    {
        $actor = $this->actor();
        $document = $this->authorizedLegacyDocument($actor);
        $this->actingAs($actor);
        $this->assertTrue(app(DocumentAccessService::class)->canDownload($actor, $document));

        Schema::partialMock();
        Schema::shouldReceive('hasColumn')->once()
            ->with('documents', 'security_domain')
            ->andThrow(new RuntimeException('Synthetic schema connection failure'));

        $this->assertFalse(app(DocumentAccessService::class)->canDownload($actor, $document));
        Storage::disk('documents')->assertExists($document->storage_path);
    }

    public function test_stale_loaded_document_sealed_after_load_cannot_be_deleted_by_generic_cleanup(): void
    {
        $actor = $this->actor();
        $document = $this->storedDocument($actor, 'PLAN-CLEANUP-PROTECTED');
        $this->assertNull($document->getAttribute('security_domain'));
        DB::table('documents')->where('id', $document->id)
            ->update(['security_domain' => 'EVER_PLAN']);

        $this->assertCleanupDenied($document);
        $this->assertDatabaseHas('plan_document_origin_receipts', ['document_id' => $document->id]);
    }

    public function test_missing_persisted_document_cannot_delete_orphaned_private_blob(): void
    {
        $actor = $this->actor();
        $document = $this->storedDocument($actor, 'ORPHAN-DO-NOT-DELETE');
        DB::table('documents')->where('id', $document->id)->delete();

        $this->assertCleanupDenied($document);
    }

    public function test_partial_provenance_schema_prevents_generic_cleanup_blob_deletion(): void
    {
        $actor = $this->actor();
        $document = $this->storedDocument($actor, 'PARTIAL-DO-NOT-DELETE');

        Schema::partialMock();
        Schema::shouldReceive('hasColumn')->once()
            ->with('documents', 'security_domain')->andReturn(true);
        Schema::shouldReceive('hasTable')->once()
            ->with('plan_document_origin_receipts')->andReturn(false);

        $this->assertCleanupDenied($document);
    }

    public function test_unprotected_legacy_cleanup_still_deletes_ordinary_blob(): void
    {
        $actor = $this->actor();
        $document = $this->storedDocument($actor, 'LEGACY-SAFE-DELETE');
        Storage::disk('documents')->assertExists($document->storage_path);

        app(DocumentAttachmentService::class)->cleanupDocuments([$document]);

        Storage::disk('documents')->assertMissing($document->storage_path);
    }

    public static function invalidProvenance(): array
    {
        return [
            'sealed' => ['sealed'],
            'receipt-only' => ['receipt-only'],
            'typed-only' => ['typed'],
            'unknown non-null' => ['unknown'],
            'both absent' => ['both'],
            'domain absent' => ['domain'],
            'receipt absent' => ['receipt'],
            'binding table absent' => ['binding'],
            'binding column absent' => ['binding-column'],
            'receipt column absent' => ['receipt-column'],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('invalidProvenance')]
    public function test_invalid_provenance_denies_direct_download(string $state): void
    {
        $actor = $this->actor();
        $document = $this->authorizedLegacyDocument($actor);
        $this->actingAs($actor);
        $url = '/documents/'.$document->public_id.'/download';
        $missing = $this->get('/documents/'.Str::uuid().'/download')->assertNotFound();
        $undo = $this->corruptProvenance($document, $state);
        try {
            $response = $this->get($url);
            $response->assertNotFound()->assertHeaderMissing('Content-Disposition')
                ->assertHeaderMissing('Content-Range')->assertDontSee('SYNTHETIC-LEGACY-DOCUMENT')
                ->assertDontSee($document->original_name);
            $this->assertSame($missing->headers->get('Content-Length'), $response->headers->get('Content-Length'));
            $range = $this->get($url, ['Range' => 'bytes=0-15']);
            $range->assertNotFound()->assertHeaderMissing('Content-Disposition')->assertHeaderMissing('Content-Range');
            $this->assertSame($missing->headers->get('Content-Length'), $range->headers->get('Content-Length'));
            $head = $this->head($url);
            $head->assertNotFound()->assertContent('')->assertHeaderMissing('Content-Disposition')
                ->assertHeaderMissing('Content-Range');
            $this->assertSame($missing->headers->get('Content-Length'), $head->headers->get('Content-Length'));
            $this->assertDatabaseMissing('audit_logs', [
                'action' => 'document.download', 'entity_id' => $document->id, 'outcome' => 'allowed',
            ]);
            $this->assertDatabaseHas('audit_logs', [
                'action' => 'document.download', 'actor_user_id' => $actor->id,
                'entity_id' => null, 'outcome' => 'denied',
            ]);
            $this->assertDatabaseMissing('audit_logs', [
                'action' => 'document.download', 'entity_id' => $document->id, 'outcome' => 'denied',
            ]);
        } finally {
            $undo();
        }
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('invalidProvenance')]
    public function test_invalid_provenance_denies_download_service(string $state): void
    {
        $actor = $this->actor();
        $document = $this->authorizedLegacyDocument($actor);
        $this->actingAs($actor);
        $this->assertTrue(app(DocumentAccessService::class)->canDownload($actor, $document));
        $undo = $this->corruptProvenance($document, $state);
        try {
            $this->assertFalse(app(DocumentAccessService::class)->canDownload($actor, $document), $state);
        } finally {
            $undo();
        }
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('invalidProvenance')]
    public function test_invalid_provenance_cleanup_retains_exact_blob(string $state): void
    {
        $actor = $this->actor();
        $document = $this->authorizedLegacyDocument($actor);
        $bytes = Storage::disk('documents')->get($document->storage_path);
        $undo = $this->corruptProvenance($document, $state);
        try {
            $denied = false;
            try {
                app(DocumentAttachmentService::class)->cleanupDocuments([$document]);
            } catch (RuntimeException $exception) {
                $this->assertSame('Protected Plan files require dedicated retention custody.', $exception->getMessage());
                $denied = true;
            }
            $this->assertTrue(Storage::disk('documents')->exists($document->storage_path), 'Unexpected synthetic blob deletion: '.$state);
            $this->assertSame($bytes, Storage::disk('documents')->get($document->storage_path));
            $this->assertTrue($denied, $state);
        } finally {
            $undo();
        }
    }

    /** Synthetic fixtures only; restore named schema objects before leaving test. */
    private function corruptProvenance(Document $document, string $state): \Closure
    {
        if (in_array($state, ['sealed', 'receipt-only'], true)) {
            $links = $document->links()->get()->map(fn ($link) => $link->getAttributes())->all();
            $document->links()->delete();
            DB::table('documents')->where('id', $document->id)->update(['security_domain' => 'EVER_PLAN']);
            if ($state === 'receipt-only') {
                DB::statement('ALTER TABLE documents DISABLE TRIGGER kirion_plan_document_guard_trigger');
                try {
                    DB::table('documents')->where('id', $document->id)->update(['security_domain' => null]);
                } finally {
                    DB::statement('ALTER TABLE documents ENABLE TRIGGER kirion_plan_document_guard_trigger');
                }
            }
            DB::statement('ALTER TABLE document_links DISABLE TRIGGER kirion_plan_generic_link_guard_trigger');
            try {
                DB::table('document_links')->insert($links);
            } finally {
                DB::statement('ALTER TABLE document_links ENABLE TRIGGER kirion_plan_generic_link_guard_trigger');
            }
            $this->assertDatabaseHas('plan_document_origin_receipts', ['document_id' => $document->id]);
            return static function (): void {};
        }
        if ($state === 'typed') {
            $family = \App\Models\PlanFamily::query()->create(['title' => 'Synthetic R4 typed fixture']);
            $edition = $family->editions()->create(['edition_label' => 'Synthetic R4']);
            DB::statement('ALTER TABLE plan_document_bindings DISABLE TRIGGER kirion_plan_typed_binding_guard_trigger');
            try {
                DB::table('plan_document_bindings')->insert([
                    'plan_edition_id' => $edition->id, 'document_id' => $document->id,
                    'role' => 'master', 'revision_no' => 1, 'binding_state' => 'QUARANTINED',
                    'created_at' => now(), 'updated_at' => now(),
                ]);
            } finally {
                DB::statement('ALTER TABLE plan_document_bindings ENABLE TRIGGER kirion_plan_typed_binding_guard_trigger');
            }
            $this->assertDatabaseMissing('plan_document_origin_receipts', ['document_id' => $document->id]);
            return static function (): void {};
        }
        if ($state === 'unknown') {
            DB::statement('ALTER TABLE documents DROP CONSTRAINT documents_plan_origin_domain_check');
            DB::table('documents')->where('id', $document->id)->update(['security_domain' => 'UNKNOWN']);
            return static function () use ($document): void {
                DB::table('documents')->where('id', $document->id)->update(['security_domain' => null]);
                DB::statement("ALTER TABLE documents ADD CONSTRAINT documents_plan_origin_domain_check CHECK (security_domain IN ('EVER_PLAN', 'LEGACY_CTW'))");
            };
        }
        $changes = match ($state) {
            'both' => ['domain', 'receipt'],
            default => [$state],
        };
        $renames = [
            'domain' => ['ALTER TABLE documents RENAME COLUMN security_domain TO r4_hidden_domain', 'ALTER TABLE documents RENAME COLUMN r4_hidden_domain TO security_domain'],
            'receipt' => ['ALTER TABLE plan_document_origin_receipts RENAME TO r4_hidden_receipts', 'ALTER TABLE r4_hidden_receipts RENAME TO plan_document_origin_receipts'],
            'binding' => ['ALTER TABLE plan_document_bindings RENAME TO r4_hidden_bindings', 'ALTER TABLE r4_hidden_bindings RENAME TO plan_document_bindings'],
            'binding-column' => ['ALTER TABLE plan_document_bindings RENAME COLUMN document_id TO r4_hidden_id', 'ALTER TABLE plan_document_bindings RENAME COLUMN r4_hidden_id TO document_id'],
            'receipt-column' => ['ALTER TABLE plan_document_origin_receipts RENAME COLUMN document_id TO r4_hidden_id', 'ALTER TABLE plan_document_origin_receipts RENAME COLUMN r4_hidden_id TO document_id'],
        ];
        foreach ($changes as $change) {
            DB::statement($renames[$change][0]);
        }
        return static function () use ($changes, $renames): void {
            foreach (array_reverse($changes) as $change) {
                DB::statement($renames[$change][1]);
            }
        };
    }

    public function test_complete_schema_legacy_null_and_explicit_non_pdf_download_and_cleanup(): void
    {
        $actor = $this->actor();
        $this->actingAs($actor);
        foreach ([null, 'LEGACY_CTW'] as $domain) {
            $document = $this->authorizedLegacyDocument($actor);
            $oldPath = $document->storage_path;
            $bytes = $domain === null ? Storage::disk('documents')->get($oldPath)
                : base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+Xn1sAAAAASUVORK5CYII=');
            if ($domain !== null) {
                $path = 'g2e-synthetic/'.Str::uuid().'.png';
                Storage::disk('documents')->put($path, $bytes);
                Storage::disk('documents')->delete($oldPath);
                $document->update(['storage_path' => $path, 'original_name' => 'synthetic.png', 'mime_type' => 'image/png',
                    'size_bytes' => strlen($bytes), 'checksum_sha256' => hash('sha256', $bytes)]);
                DB::table('documents')->where('id', $document->id)->update(['security_domain' => $domain]);
            }
            $this->assertTrue(app(DocumentAccessService::class)->canDownload($actor, $document));
            $response = $this->get('/documents/'.$document->public_id.'/download')->assertOk();
            $this->assertSame($bytes, $response->streamedContent());
            $this->assertStringStartsWith('attachment;', $response->headers->get('Content-Disposition'));
            app(DocumentAttachmentService::class)->cleanupDocuments([$document]);
            Storage::disk('documents')->assertMissing($document->storage_path);
        }
    }

    public function test_guard_and_service_query_counts_do_not_grow_with_single_document_link_cardinality(): void
    {
        $actor = $this->actor();
        $document = $this->authorizedLegacyDocument($actor);
        $this->actingAs($actor);
        $parent = $document->links()->firstOrFail();
        $counts = [];
        for ($number = 1; $number <= 32; $number++) {
            if ($number > 1) {
                DocumentLink::query()->create([
                    'document_id' => $document->id, 'linkable_type' => $parent->linkable_type,
                    'linkable_id' => $parent->linkable_id, 'relationship' => 'r4-budget-'.$number,
                ]);
            }
            if (! in_array($number, [1, 16, 17, 32], true)) {
                continue;
            }
            DB::enableQueryLog();
            DB::flushQueryLog();
            try {
                $this->assertTrue(app(DocumentAccessService::class)->canDownload($actor, $document));
                $serviceCount = count(DB::getQueryLog());
                DB::flushQueryLog();
                $this->assertFalse(\App\Services\PlanDocumentOriginGuard::isProtected($document));
                $guardCount = count(DB::getQueryLog());
            } finally {
                DB::disableQueryLog();
                DB::flushQueryLog();
            }
            $counts[] = [$serviceCount, $guardCount];
        }
        foreach ($counts as [$serviceCount, $guardCount]) {
            $this->assertSame($counts[0][0], $serviceCount);
            $this->assertSame(4, $guardCount);
        }
        fwrite(STDOUT, 'R4 single-document link budgets (1,16,17,32): '.json_encode($counts).PHP_EOL);
    }

    private function assertCleanupDenied(Document $document): void
    {
        try {
            app(DocumentAttachmentService::class)->cleanupDocuments([$document]);
            $this->fail('Expected generic cleanup to reject Plan/unknown provenance.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Protected Plan files require dedicated retention custody.', $exception->getMessage());
        }

        Storage::disk('documents')->assertExists($document->storage_path);
    }

    private function actor(): User
    {
        $department = Department::query()->create([
            'code' => 'G2E-'.Str::upper(Str::random(7)),
            'name' => 'G2E Synthetic Office',
            'short_name' => 'G2E',
            'branch' => 'executive',
            'office_type' => 'department',
            'is_active' => true,
            'is_routable' => true,
            'sort_order' => 10,
        ]);
        $actor = User::query()->create([
            'name' => 'G2E Synthetic Reviewer',
            'email' => Str::lower(Str::random(12)).'@example.test',
            'password' => 'password',
            'role' => 'department_head',
            'is_active' => true,
        ]);
        Employee::query()->create([
            'employee_number' => 'G2E-EMP-'.Str::upper(Str::random(10)),
            'full_name' => $actor->name,
            'work_email' => $actor->email,
            'user_id' => $actor->id,
            'department_id' => $department->id,
            'position_title' => 'Synthetic Reviewer',
            'employment_status' => 'active',
        ]);

        return $actor->fresh('employee.department');
    }

    private function storedDocument(User $actor, string $contents): Document
    {
        $path = 'g2e-synthetic/'.Str::uuid().'.pdf';
        Storage::disk('documents')->put($path, "%PDF-1.7\n".$contents."\n%%EOF");

        return Document::query()->create([
            'title' => 'G2E synthetic evidence',
            'original_name' => 'g2e-synthetic.pdf',
            'document_type' => 'supporting_document',
            'classification' => 'internal',
            'storage_disk' => 'documents',
            'storage_path' => $path,
            'owner_department_id' => $actor->employee->department_id,
            'uploaded_by_user_id' => $actor->id,
        ]);
    }

    private function authorizedLegacyDocument(User $actor): Document
    {
        $transaction = WorkflowTransaction::query()->create([
            'reference_no' => 'G2E-TX-'.Str::upper(Str::random(10)),
            'transaction_type' => 'internal_request',
            'title' => 'Synthetic allowed legacy transaction',
            'priority' => 'normal',
            'origin_department_id' => $actor->employee->department_id,
            'current_department_id' => $actor->employee->department_id,
            'created_by_user_id' => $actor->id,
            'status' => 'submitted',
        ]);
        $document = $this->storedDocument($actor, 'SYNTHETIC-LEGACY-DOCUMENT');
        DocumentLink::query()->create([
            'document_id' => $document->id,
            'linkable_type' => $transaction->getMorphClass(),
            'linkable_id' => $transaction->id,
            'relationship' => 'supporting_document',
        ]);

        return $document;
    }
}
