<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentLink;
use App\Models\Employee;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\AuditLogger;
use App\Services\DocumentArchiveQuery;
use App\Services\DocumentEvidenceQuery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

final class LegacyPdfPreviewTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['messaging_release.restricted_uat' => false]);
        Storage::fake('documents');
    }

    public function test_authorized_inline_exact_bytes_and_download_are_distinct(): void
    {
        [$actor, $record, $document] = $this->evidence();
        $url = $this->url($document);
        $response = $this->actingAs($actor)->get($url)->assertOk()
            ->assertHeader('Content-Type', 'application/pdf')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('Referrer-Policy', 'no-referrer');
        $this->assertStringContainsString('private', $response->headers->get('Cache-Control'));
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->assertStringStartsWith('inline;', $response->headers->get('Content-Disposition'));
        $this->assertSame($this->pdf(), $response->getContent());
        $this->assertDatabaseHas('audit_logs', [
            'actor_user_id' => $actor->id, 'action' => 'document.preview',
            'entity_type' => 'document', 'entity_id' => $document->id, 'outcome' => 'allowed',
        ]);

        $attachment = $this->get('/documents/'.$document->public_id.'/download')->assertOk();
        $this->assertStringStartsWith('attachment;', $attachment->headers->get('Content-Disposition'));
        $this->assertSame($this->pdf(), $attachment->streamedContent());
        $this->get($url, ['Range' => 'bytes=0-15'])->assertOk()->assertHeader('Content-Type', 'application/pdf');
        $this->head($url)->assertOk()->assertHeader('Content-Type', 'application/pdf')->assertContent('');

        $archive = app(DocumentArchiveQuery::class)->workspace($actor, ['document' => $document->public_id]);
        $this->assertSame($url, $archive['selected']['previewUrl']);
        $this->assertSame($url, $archive['records']->items()[0]['previewUrl']);
        $detail = app(DocumentEvidenceQuery::class)->forTransaction($record);
        $this->assertSame($url, $detail['record'][0]['previewUrl']);
    }

    public function test_cross_office_unknown_orphan_and_mixed_links_are_opaque(): void
    {
        [$actor, $record, $document] = $this->evidence();
        $other = $this->actor();
        $url = $this->url($document);
        $this->actingAs($other)->get($url)->assertNotFound()->assertContent('Not Found');
        $this->get('/documents/'.Str::uuid().'/preview')->assertNotFound()->assertContent('Not Found');
        $this->actingAs($actor)->get($url)->assertOk();
        $foreign = $this->transaction($other);
        $link = $this->link($document, $foreign);
        $this->get($url)->assertNotFound()->assertContent('Not Found');
        $this->assertNull(app(DocumentArchiveQuery::class)->workspace($actor, ['document' => $document->public_id])['selected']);
        $this->assertSame([], app(DocumentEvidenceQuery::class)->forTransaction($record)['record']);
        $link->delete();
        $invalid = DocumentLink::query()->create([
            'document_id' => $document->id, 'linkable_type' => $record->getMorphClass(),
            'linkable_id' => 99999999, 'relationship' => 'supporting_document',
        ]);
        $this->get($url)->assertNotFound();
        $invalid->delete();
        $document->links()->delete();
        $this->get($url)->assertNotFound();
        $this->assertDatabaseHas('audit_logs', [
            'actor_user_id' => $other->id, 'action' => 'document.preview', 'outcome' => 'denied',
            'entity_id' => null,
        ]);
    }

    public function test_integrity_missing_non_pdf_and_path_aliases_fail_closed(): void
    {
        [$actor, $record, $document] = $this->evidence();
        $this->actingAs($actor);
        $url = $this->url($document);
        $path = $document->storage_path;
        Storage::disk('documents')->put($path, str_replace('page one', 'page xxx', $this->pdf()));
        $this->get($url)->assertNotFound()->assertContent('Not Found');
        Storage::disk('documents')->delete($path);
        $this->get($url)->assertNotFound();
        Storage::disk('documents')->put($path, $this->pdf());
        $document->update(['mime_type' => 'image/png']);
        $this->get($url)->assertNotFound();
        $this->assertNull(app(DocumentEvidenceQuery::class)->forTransaction($record)['record'][0]['previewUrl']);
        $document->update(['mime_type' => 'application/pdf', 'storage_disk' => 'public']);
        $this->get($url)->assertNotFound();
        $document->update(['storage_disk' => 'documents', 'storage_path' => '../documents/'.$path]);
        $this->get($url)->assertNotFound();
        $bad = "%PDF-1.4\nNot a structured PDF\n%%EOF\n";
        Storage::disk('documents')->put($path, $bad);
        $document->update(['storage_path' => $path, 'size_bytes' => strlen($bad), 'checksum_sha256' => hash('sha256', $bad)]);
        $this->get($url)->assertNotFound();
        $this->assertDatabaseMissing('audit_logs', ['action' => 'document.preview', 'outcome' => 'allowed']);
    }

    public function test_plan_origin_and_partial_provenance_never_serve_legacy_bytes(): void
    {
        [$actor, $record, $document] = $this->evidence();
        $this->actingAs($actor);
        $document->links()->delete();
        DB::table('documents')->where('id', $document->id)->update(['security_domain' => 'EVER_PLAN']);
        $this->get($this->url($document))->assertNotFound()->assertContent('Not Found');
        $this->get('/documents/'.$document->public_id.'/download')->assertNotFound();
        $this->assertDatabaseHas('plan_document_origin_receipts', ['document_id' => $document->id]);

        [$actor, , $legacy] = $this->evidence();
        $this->actingAs($actor);
        Schema::partialMock();
        Schema::shouldReceive('hasColumn')->once()->with('documents', 'security_domain')->andReturn(true);
        Schema::shouldReceive('hasTable')->once()->with('plan_document_origin_receipts')->andReturn(false);
        $this->get($this->url($legacy))->assertNotFound();
    }

    public function test_guest_and_revoked_employee_do_not_receive_pdf(): void
    {
        [$actor, , $document] = $this->evidence();
        $this->get($this->url($document))->assertRedirect('/login');
        $this->actingAs($actor)->get($this->url($document))->assertOk();
        $actor->employee()->update(['employment_status' => 'inactive']);
        $this->get($this->url($document))->assertNotFound();
    }

    public function test_audit_failure_prevents_successful_retrieval(): void
    {
        [$actor, , $document] = $this->evidence();
        $this->actingAs($actor);
        $this->mock(AuditLogger::class, function ($mock): void {
            $mock->shouldReceive('record')->once()->andThrow(new RuntimeException('Synthetic audit unavailable'));
        });
        $this->get($this->url($document))->assertStatus(500)->assertDontSee('Synthetic evidence page one');
    }

    public function test_hostile_filename_cannot_inject_headers(): void
    {
        [$actor, , $document] = $this->evidence();
        $document->update(['original_name' => "../résumé\r\nX-Injection: yes%.pdf"]);
        $response = $this->actingAs($actor)->get($this->url($document))->assertOk();
        $header = $response->headers->get('Content-Disposition');
        $this->assertStringStartsWith('inline;', $header);
        $this->assertStringNotContainsString("\r", $header);
        $this->assertStringNotContainsString("\n", $header);
        $this->assertFalse($response->headers->has('X-Injection'));
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

    private function link(Document $document, WorkflowTransaction $record): DocumentLink
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
