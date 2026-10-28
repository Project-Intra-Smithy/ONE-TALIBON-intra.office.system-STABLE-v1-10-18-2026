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
