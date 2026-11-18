<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentLink;
use App\Models\Employee;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\AuditLogger;
use App\Services\DocumentAccessService;
use App\Services\DocumentAttachmentService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

final class LegacyDocumentCustodyIntegrityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['messaging_release.restricted_uat' => false]);
        // Laravel's fake here is a disposable real local filesystem adapter.
        Storage::fake('documents');
    }

    public static function invalidDescriptors(): array
    {
        return [
            'same-size tamper' => ['tamper'],
            'wrong size' => ['size'],
            'wrong hash' => ['hash'],
            'missing size' => ['missing-size'],
            'missing hash' => ['missing-hash'],
            'missing disk' => ['missing-disk'],
            'missing path' => ['missing-path'],
            'wrong disk' => ['wrong-disk'],
            'traversal' => ['traversal'],
            'over cap' => ['cap'],
            'missing object' => ['missing-object'],
            'file symlink' => ['symlink'],
            'directory symlink' => ['directory-symlink'],
            'hardlink' => ['hardlink'],
            'directory object' => ['directory'],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('invalidDescriptors')]
    public function test_integrity_failure_masks_byte_paths_and_retains_other_bytes(string $state): void
    {
        [$actor, , $document] = $this->evidence();
        [, , $other] = $this->evidence();
        $disk = Storage::disk('documents');
        $otherBytes = str_replace('page one', 'page TWO', $this->pdf());
        $disk->put($other->storage_path, $otherBytes);
        $other->update(['checksum_sha256' => hash('sha256', $otherBytes)]);
        $path = $disk->path($document->storage_path);
        $otherPath = $disk->path($other->storage_path);
        switch ($state) {
            case 'tamper': $disk->put($document->storage_path, $otherBytes); break;
            case 'size': $document->update(['size_bytes' => strlen($this->pdf()) + 1]); break;
            case 'hash': $document->update(['checksum_sha256' => str_repeat('a', 64)]); break;
            case 'missing-size': $document->update(['size_bytes' => null]); break;
            case 'missing-hash': $document->update(['checksum_sha256' => null]); break;
            case 'missing-disk': $document->update(['storage_disk' => null]); break;
            case 'missing-path': $document->update(['storage_path' => null]); break;
            case 'wrong-disk': $document->update(['storage_disk' => 'public']); break;
            case 'traversal': $document->update(['storage_path' => '2026/11/../11/'.basename($path)]); break;
            case 'cap': config(['documents.max_upload_mb' => 0]); break;
            case 'missing-object': unlink($path); break;
            case 'symlink': unlink($path); $this->assertTrue(symlink($otherPath, $path)); break;
            case 'hardlink': unlink($path); $this->assertTrue(link($otherPath, $path)); break;
            case 'directory': unlink($path); $this->assertTrue(mkdir($path)); break;
            case 'directory-symlink':
                $this->assertTrue(symlink(dirname($otherPath), $disk->path('aliased-dir')));
                $document->update(['storage_path' => 'aliased-dir/'.basename($otherPath)]);
                break;
        }
        $this->actingAs($actor);
        $this->assertTrue(app(DocumentAccessService::class)->canDownload($actor, $document));
        try {
            $this->assertOpaque($document);
            $this->assertCleanupRetained($document);
        } finally {
            if ($state === 'directory-symlink') {
                unlink($disk->path('aliased-dir'));
            }
            if (is_link($path)) {
                unlink($path);
            }
        }
        $this->assertSame($otherBytes, $disk->get($other->storage_path));
    }

    public function test_stale_loaded_path_cannot_delete_another_document(): void
    {
        [, , $document] = $this->evidence();
        [, , $other] = $this->evidence();
        $disk = Storage::disk('documents');
        $otherBytes = str_replace('page one', 'page TWO', $this->pdf());
        $disk->put($other->storage_path, $otherBytes);
        $other->update(['checksum_sha256' => hash('sha256', $otherBytes)]);
        $document->storage_path = $other->storage_path;
        $this->assertCleanupRetained($document);
        $this->assertSame($otherBytes, $disk->get($other->storage_path));
    }

    public function test_persisted_descriptor_drift_retains_original_blob(): void
    {
        [, , $document] = $this->evidence();
        [, , $other] = $this->evidence();
        DB::table('documents')->where('id', $document->id)->update(['storage_path' => $other->storage_path]);
        $this->assertCleanupRetained($document);
        Storage::disk('documents')->assertExists($document->storage_path);
        Storage::disk('documents')->assertExists($other->storage_path);
    }

    public static function aliases(): array
    {
        return [['exact'], ['normalized'], ['plan'], ['disk-alias']];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('aliases')]
    public function test_conflicting_hidden_locator_denies_even_when_hash_matches(string $state): void
    {
        [$actor, , $document] = $this->evidence();
        [$outsider, , $other] = $this->evidence();
        $disk = Storage::disk('documents');
        $original = $disk->get($document->storage_path);
        $alias = $state === 'normalized'
            ? '2026//11/./'.basename($document->storage_path)
            : $document->storage_path;
        if ($state === 'disk-alias') {
            config(['filesystems.disks.k1_alias' => [
                'driver' => 'local', 'root' => $disk->path(''), 'visibility' => 'private', 'serve' => false,
            ]]);
        }
        $other->update(['storage_path' => $alias, 'storage_disk' => $state === 'disk-alias' ? 'k1_alias' : 'documents']);
        if ($state === 'plan') {
            $other->links()->delete();
            DB::table('documents')->where('id', $other->id)->update(['security_domain' => 'EVER_PLAN']);
        }
        $this->actingAs($actor);
        $this->assertFalse(app(DocumentAccessService::class)->canDownload($actor, $other->fresh()));
        $this->assertOpaque($document);
        $this->assertCleanupRetained($document);
        $this->assertSame($original, $disk->get($document->storage_path));
    }

    public function test_safe_exact_buffer_attachment_and_cleanup_and_cap_boundary(): void
    {
        [$actor, , $document] = $this->evidence();
        $this->actingAs($actor);
        config(['documents.max_upload_mb' => 1]);
        $bytes = str_pad($this->pdf(), 1024 * 1024, ' ');
        Storage::disk('documents')->put($document->storage_path, $bytes);
        $document->update(['size_bytes' => strlen($bytes), 'checksum_sha256' => hash('sha256', $bytes)]);
        $response = $this->get('/documents/'.$document->public_id.'/download')->assertOk();
        $this->assertStringStartsWith('attachment;', $response->headers->get('Content-Disposition'));
        $this->assertSame($bytes, $response->streamedContent());
        $this->get($this->url($document))->assertOk()->assertContent($bytes);
        $bytes .= ' ';
        Storage::disk('documents')->put($document->storage_path, $bytes);
        $document->update(['size_bytes' => strlen($bytes), 'checksum_sha256' => hash('sha256', $bytes)]);
        $this->get('/documents/'.$document->public_id.'/download')->assertNotFound();
        $this->assertCleanupRetained($document);
        $this->assertSame($bytes, Storage::disk('documents')->get($document->storage_path));
        config(['documents.max_upload_mb' => 2]);
        app(DocumentAttachmentService::class)->cleanupDocuments([$document->fresh()]);
        Storage::disk('documents')->assertMissing($document->storage_path);
    }

    public function test_attachment_is_not_reopened_after_verification(): void
    {
        [$actor, , $document] = $this->evidence();
        $this->actingAs($actor);
        $original = $this->pdf();
        $path = $document->storage_path;
        $this->mock(AuditLogger::class, function ($mock) use ($path): void {
            $mock->shouldReceive('record')->once()->andReturnUsing(function () use ($path): void {
                Storage::disk('documents')->put($path, 'SYNTHETIC REPLACEMENT AFTER AUDIT');
            });
        });
        $response = $this->get('/documents/'.$document->public_id.'/download')->assertOk();
        $this->assertSame($original, $response->streamedContent());
    }

    private function assertOpaque(Document $document): void
    {
        foreach (['preview', 'download'] as $action) {
            $url = '/documents/'.$document->public_id.'/'.$action;
            $missing = $this->get('/documents/'.Str::uuid().'/'.$action)->assertNotFound();
            $response = $this->get($url)->assertNotFound()->assertHeaderMissing('Content-Disposition')
                ->assertHeaderMissing('Content-Range')->assertDontSee($document->original_name);
            $this->assertSame($missing->headers->get('Content-Length'), $response->headers->get('Content-Length'));
            $this->get($url, ['Range' => 'bytes=0-15'])->assertNotFound()->assertHeaderMissing('Content-Range');
            $this->head($url)->assertNotFound()->assertContent('')->assertHeaderMissing('Content-Disposition');
            $this->assertDatabaseMissing('audit_logs', [
                'action' => 'document.'.$action, 'entity_id' => $document->id, 'outcome' => 'allowed',
            ]);
        }
    }

    private function assertCleanupRetained(Document $document): void
    {
        $denied = false;
        try {
            app(DocumentAttachmentService::class)->cleanupDocuments([$document]);
        } catch (RuntimeException) {
            $denied = true;
        }
        $this->assertTrue($denied, 'Ambiguous or invalid cleanup must refuse deletion.');
    }

    private function url(Document $document): string
    {
        return '/documents/'.$document->public_id.'/preview';
    }

    private function evidence(): array
    {
        $actor = $this->actor();
        $record = $this->transaction($actor);
        $bytes = $this->pdf();
        $path = '2026/11/'.Str::uuid().'.pdf';
        Storage::disk('documents')->put($path, $bytes);
        $document = Document::query()->create([
            'title' => 'Synthetic evidence', 'original_name' => 'synthetic-evidence.pdf',
            'document_type' => 'supporting_document', 'classification' => 'internal',
            'mime_type' => 'application/pdf', 'size_bytes' => strlen($bytes),
            'checksum_sha256' => hash('sha256', $bytes), 'storage_disk' => 'documents',
            'storage_path' => $path, 'owner_department_id' => $actor->employee->department_id,
            'uploaded_by_user_id' => $actor->id,
        ]);
        $this->link($document, $record);

        return [$actor, $record, $document];
    }

    private function link(Document $document, Model $record): DocumentLink
    {
        return DocumentLink::query()->create([
            'document_id' => $document->id, 'linkable_type' => $record->getMorphClass(),
            'linkable_id' => $record->id, 'relationship' => 'supporting_document',
        ]);
    }

    private function transaction(User $actor): WorkflowTransaction
    {
        $office = $actor->employee->department_id;
        return WorkflowTransaction::query()->create([
            'reference_no' => 'PDF-'.Str::upper(Str::random(12)),
            'transaction_type' => 'internal_request', 'title' => 'Synthetic PDF transaction',
            'priority' => 'normal', 'origin_department_id' => $office, 'current_department_id' => $office,
            'created_by_user_id' => $actor->id, 'status' => 'submitted',
        ]);
    }

    private function actor(): User
    {
        $office = Department::query()->create([
            'code' => 'PDF-'.Str::upper(Str::random(10)), 'name' => 'Synthetic PDF office',
            'short_name' => 'PDF', 'branch' => 'executive', 'office_type' => 'department',
            'is_active' => true, 'is_routable' => true, 'sort_order' => 10,
        ]);
        $actor = User::query()->create([
            'name' => 'Synthetic PDF reviewer', 'email' => Str::random(12).'@example.test',
            'password' => 'password', 'role' => 'department_head', 'is_active' => true,
        ]);
        Employee::query()->create([
            'employee_number' => 'PDF-'.Str::upper(Str::random(12)), 'full_name' => $actor->name,
            'work_email' => $actor->email, 'user_id' => $actor->id, 'department_id' => $office->id,
            'position_title' => 'Synthetic reviewer', 'employment_status' => 'active',
        ]);

        return $actor->fresh('employee.department');
    }

    private function pdf(): string
    {
        $content = "BT /F1 24 Tf 50 680 Td (Synthetic evidence page one) Tj ET\n";
        $second = "BT /F1 24 Tf 50 680 Td (Synthetic evidence page two) Tj ET\n";
        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 6 0 R >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 7 0 R >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
            '<< /Length '.strlen($content)." >>\nstream\n".$content.'endstream',
            '<< /Length '.strlen($second)." >>\nstream\n".$second.'endstream',
        ];
        $pdf = "%PDF-1.4\n";
        $offsets = [];
        foreach ($objects as $index => $object) {
            $offsets[] = strlen($pdf);
            $pdf .= ($index + 1)." 0 obj\n".$object."\nendobj\n";
        }
        $xref = strlen($pdf);
        $pdf .= "xref\n0 8\n0000000000 65535 f \n";
        foreach ($offsets as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }

        return $pdf."trailer\n<< /Size 8 /Root 1 0 R >>\nstartxref\n".$xref."\n%%EOF\n";
    }
}
