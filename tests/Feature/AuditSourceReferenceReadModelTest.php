<?php

namespace Tests\Feature;

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentLink;
use App\Models\Employee;
use App\Models\TransactionEvent;
use App\Models\User;
use App\Models\WorkflowTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

final class AuditSourceReferenceReadModelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['messaging_release.restricted_uat' => false]);
        $disk = Storage::fake('documents');
        config(['filesystems.disks.documents.root' => rtrim($disk->path(''), '/')]);
    }

    public function test_observer_summaries_counts_and_filters_survive_without_source_entitlement(): void
    {
        $observer = User::query()->create(['name' => 'Synthetic observer', 'email' => Str::random(12).'@example.test', 'password' => 'password', 'role' => 'system_admin', 'is_active' => true]);
        $owner = $this->actor();
        $source = $this->transaction($owner);
        $event = $this->event($source, 'denied');
        $this->event($source);
        $this->actingAs($observer);
        $page = $this->page('/audit?outcome=denied&action=d0.synthetic');
        $page->assertJsonCount(1, 'props.events')
            ->assertJsonPath('props.events.0.id', $event->id)
            ->assertJsonPath('props.events.0.summary', 'Synthetic forensic summary')
            ->assertJsonPath('props.events.0.source_reference', null)
            ->assertJsonPath('props.summary.events24h', 2)
            ->assertJsonPath('props.summary.denied24h', 1)
            ->assertJsonPath('props.summary.events7d', 2)
            ->assertJsonPath('props.summary.distinctActors7d', 0);
        $this->assertOpaque($page->json('props.events'), [$source->reference_no, $source->title]);
    }

    public function test_origin_and_current_office_references_use_current_source_and_reauthorize_destination(): void
    {
        $origin = $this->actor();
        $current = $this->actor('mayor_approver');
        $source = $this->transaction($origin);
        $source->update(['current_department_id' => $current->employee->department_id]);
        $this->event($source);
        $source->update(['reference_no' => 'D0-CURRENT-REFERENCE']);
        foreach ([$origin, $current] as $viewer) {
            $this->actingAs($viewer);
            $this->page()->assertJsonPath('props.events.0.source_reference', [
                'kind' => 'transaction', 'reference' => 'D0-CURRENT-REFERENCE',
                'href' => '/transactions/'.$source->id,
            ]);
            $this->get('/transactions/'.$source->id)->assertOk();
        }
    }

    public function test_admin_and_audit_role_alone_do_not_authorize_foreign_transactions_or_documents(): void
    {
        $owner = $this->actor();
        $source = $this->transaction($owner);
        $document = $this->document($owner, $source);
        $this->event($source);
        $this->event($document);
        foreach (['system_admin', 'mayor_approver'] as $role) {
            $viewer = $this->actor($role);
            $this->actingAs($viewer);
            $page = $this->page();
            $events = $page->json('props.events');
            $this->assertSame([null, null], array_column($events, 'source_reference'));
            $this->assertOpaque($events, [$source->reference_no, $source->title, $document->public_id, $document->title, $document->storage_path]);
            foreach ([$source->reference_no, $source->title, $document->public_id, $document->title] as $secret) {
                $this->assertStringNotContainsString($secret, $page->getContent());
            }
        }
    }

    public function test_authorized_pdf_reference_preserves_native_inline_and_explicit_download_bytes(): void
    {
        $actor = $this->actor();
        $source = $this->transaction($actor);
        $document = $this->document($actor, $source);
        $this->event($document);
        $this->actingAs($actor);
        $href = '/documents/'.$document->public_id.'/preview';
        $this->page()->assertJsonPath('props.events.0.source_reference', [
            'kind' => 'document', 'reference' => $document->public_id, 'href' => $href,
        ]);
        $preview = $this->get($href)->assertOk()->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringStartsWith('inline;', $preview->headers->get('Content-Disposition'));
        $this->assertSame($this->pdf(), $preview->getContent());
        $download = $this->get('/documents/'.$document->public_id.'/download')->assertOk();
        $this->assertStringStartsWith('attachment;', $download->headers->get('Content-Disposition'));
        $this->assertSame($document->checksum_sha256, hash('sha256', $download->streamedContent()));
    }

    public function test_mixed_orphan_unknown_deleted_and_held_sources_are_null_in_raw_json(): void
    {
        $actor = $this->actor();
        $source = $this->transaction($actor);
        $foreign = $this->transaction($this->actor());
        $secrets = [$foreign->reference_no, $foreign->title];
        foreach ([[$foreign::class, $foreign->id], ['unknown', $source->id], [$source::class, 99999999]] as [$type, $id]) {
            $document = $this->document($actor, $source);
            DocumentLink::query()->create(['document_id' => $document->id, 'linkable_type' => $type, 'linkable_id' => $id, 'relationship' => 'synthetic']);
            $this->event($document);
            array_push($secrets, $document->public_id, $document->title, $document->storage_path);
        }
        $unsupported = $this->document($actor, $source);
        $unsupported->update(['mime_type' => 'image/png']);
        $this->event($unsupported);
        $held = $this->document($actor, $source);
        $held->links()->delete();
        $held->forceFill(['security_domain' => 'EVER_PLAN'])->save();
        $this->event($held);
        $orphan = $this->document($actor, $source);
        $orphan->links()->delete();
        $this->event($orphan);
        array_push($secrets, $held->public_id, $orphan->public_id);
        $deleted = $this->transaction($actor);
        $this->event($deleted);
        $deleted->delete();
        foreach ([null, '', 'transaction', 'App\\Models\\User', 'App\\Models\\WorkflowTransaction ', 'Unknown\\AutoloadCanary'] as $type) {
            AuditLog::query()->create(['action' => 'd0.synthetic', 'entity_type' => $type, 'entity_id' => $source->id, 'outcome' => 'allowed', 'summary' => 'Synthetic forensic summary', 'created_at' => now()]);
        }
        $this->actingAs($actor);
        $page = $this->page();
        foreach ($page->json('props.events') as $event) {
            $this->assertNull($event['source_reference']);
        }
        $this->assertOpaque($page->json('props.events'), $secrets);
        foreach ($secrets as $secret) {
            $this->assertStringNotContainsString($secret, $page->getContent());
        }
        $partial = $this->page('/audit', ['X-Inertia-Partial-Component' => 'Audit/Index', 'X-Inertia-Partial-Data' => 'events']);
        $this->assertSame($page->json('props.events'), $partial->json('props.events'));
    }

    public function test_transaction_event_document_parents_are_authorized_and_revocation_hides_references(): void
    {
        $actor = $this->actor('mayor_approver');
        $source = $this->transaction($actor);
        $document = $this->document($actor, $source);
        $event = TransactionEvent::query()->create(['transaction_id' => $source->id, 'action' => 'created', 'new_status' => 'submitted', 'actor_user_id' => $actor->id, 'created_at' => now()]);
        $document->links()->update(['linkable_type' => TransactionEvent::class, 'linkable_id' => $event->id]);
        $this->event($document);
        $this->event($source);
        $this->actingAs($actor);
        $this->assertNotNull($this->page()->json('props.events.0.source_reference'));
        $otherOffice = $this->actor()->employee->department_id;
        $source->update(['origin_department_id' => $otherOffice, 'current_department_id' => $otherOffice]);
        $events = $this->page()->json('props.events');
        $this->assertSame([null, null], array_column($events, 'source_reference'));
        // Revoke existing source VIEW_ALL before asserting the destinations' own policy denial.
        $actor->update(['role' => 'department_head']);
        $this->actingAs($actor->fresh());
        $this->get('/documents/'.$document->public_id.'/preview')->assertNotFound();
        $this->get('/transactions/'.$source->id)->assertForbidden();
    }

    public function test_guest_nonobserver_suspended_and_stale_sessions_cannot_obtain_references(): void
    {
        $this->get('/audit')->assertRedirect(route('login'));
        $staff = $this->actor('department_head');
        $this->actingAs($staff)->get('/audit')->assertForbidden();
        $viewer = $this->actor();
        $this->event($this->transaction($viewer));
        $this->actingAs($viewer);
        $viewer->update(['account_status' => 'suspended']);
        $this->get('/audit')->assertRedirect(route('login'));
        $viewer->update(['account_status' => 'active']);
        $this->actingAs($viewer->fresh());
        $viewer->increment('session_version');
        $this->get('/audit')->assertRedirect(route('login'));
    }

    public function test_missing_provenance_schema_withholds_document_without_losing_forensic_rows(): void
    {
        $actor = $this->actor();
        $source = $this->transaction($actor);
        $this->event($this->document($actor, $source));
        $this->actingAs($actor);
        DB::statement('ALTER TABLE plan_document_origin_receipts RENAME TO d0_held_origin_receipts');
        try {
            $this->page()->assertJsonCount(1, 'props.events')
                ->assertJsonPath('props.events.0.source_reference', null)
                ->assertJsonPath('props.summary.events24h', 1);
        } finally {
            DB::statement('ALTER TABLE d0_held_origin_receipts RENAME TO plan_document_origin_receipts');
        }
    }

    public function test_role_and_employment_revocation_remove_reference_access_on_subsequent_requests(): void
    {
        $actor = $this->actor();
        $this->event($this->transaction($actor));
        $this->actingAs($actor);
        $this->assertNotNull($this->page()->json('props.events.0.source_reference'));
        $actor->employee()->update(['employment_status' => 'separated']);
        $this->get('/audit')->assertRedirect(route('login'));
        $actor->employee()->update(['employment_status' => 'active']);
        $this->actingAs($actor->fresh());
        $actor->update(['role' => 'department_head']);
        $this->get('/audit')->assertForbidden();
    }

    public function test_250_mixed_events_have_constant_query_growth_and_preserve_event_counts(): void
    {
        $actor = $this->actor();
        $source = $this->transaction($actor);
        $document = $this->document($actor, $source);
        $foreign = $this->transaction($this->actor());
        $this->actingAs($actor);
        $counts = [];
        foreach ([5, 250] as $size) {
            AuditLog::query()->delete();
            for ($index = 0; $index < $size; $index++) {
                if ($index % 5 === 0) {
                    $source = $this->transaction($actor);
                    $document = $this->document($actor, $source);
                }
                $subject = [$source, $document, $foreign, null, $source][$index % 5];
                $this->event($subject);
            }
            DB::enableQueryLog();
            DB::flushQueryLog();
            try {
                $page = $this->page();
                $counts[] = count(DB::getQueryLog());
            } finally {
                DB::disableQueryLog();
            }
            $page->assertJsonCount($size, 'props.events')->assertJsonPath('props.summary.events24h', $size);
        }
        $this->assertLessThanOrEqual($counts[0] + 2, $counts[1]);
        $this->assertLessThanOrEqual(60, $counts[1]);
        fwrite(STDOUT, "\nD0 queries (5 / 250 events): ".implode(' / ', $counts)."\n");
    }

    private function page(string $url = '/audit', array $extra = [])
    {
        return $this->get($url, $extra + ['X-Inertia' => 'true', 'X-Inertia-Version' => (string) app(HandleInertiaRequests::class)->version(request())])->assertOk();
    }

    private function assertOpaque(array $events, array $secrets): void
    {
        $json = json_encode($events, JSON_THROW_ON_ERROR);
        foreach (array_merge($secrets, ['entity_type', 'entity_id', 'storage_path', 'checksum_sha256', 'source_count', 'employee_number']) as $secret) {
            $this->assertStringNotContainsString($secret, $json);
        }
    }

    private function actor(string $role = 'system_admin'): User
    {
        $office = Department::query()->create(['code' => 'D0-'.Str::random(10), 'name' => 'Synthetic D0 office', 'branch' => 'executive', 'office_type' => 'department', 'is_active' => true]);
        $actor = User::query()->create(['name' => 'Synthetic observer', 'email' => Str::random(12).'@example.test', 'password' => 'password', 'role' => $role, 'is_active' => true]);
        Employee::query()->create(['employee_number' => 'D0-'.Str::random(12), 'full_name' => 'Synthetic D0 observer', 'position_title' => 'Synthetic reviewer', 'user_id' => $actor->id, 'department_id' => $office->id, 'employment_status' => 'active']);

        return $actor->fresh('employee.department');
    }

    private function transaction(User $actor): WorkflowTransaction
    {
        return WorkflowTransaction::query()->create(['reference_no' => 'D0-'.Str::random(16), 'title' => 'SOURCE-SECRET-'.Str::random(12), 'transaction_type' => 'internal_request', 'priority' => 'normal', 'status' => 'submitted', 'created_by_user_id' => $actor->id, 'origin_department_id' => $actor->employee->department_id, 'current_department_id' => $actor->employee->department_id]);
    }

    private function document(User $actor, WorkflowTransaction $source): Document
    {
        $path = 'synthetic-d0/'.Str::uuid().'.pdf';
        Storage::disk('documents')->put($path, $this->pdf());
        $document = Document::query()->create(['title' => 'DOC-SECRET-'.Str::random(12), 'original_name' => 'synthetic.pdf', 'document_type' => 'supporting_document', 'classification' => 'internal', 'mime_type' => 'application/pdf', 'size_bytes' => strlen($this->pdf()), 'checksum_sha256' => hash('sha256', $this->pdf()), 'storage_disk' => 'documents', 'storage_path' => $path, 'owner_department_id' => $actor->employee->department_id, 'uploaded_by_user_id' => $actor->id]);
        DocumentLink::query()->create(['document_id' => $document->id, 'linkable_type' => $source::class, 'linkable_id' => $source->id, 'relationship' => 'supporting_document']);

        return $document;
    }

    private function event($subject, string $outcome = 'allowed'): AuditLog
    {
        return AuditLog::query()->create(['action' => 'd0.synthetic', 'outcome' => $outcome, 'summary' => 'Synthetic forensic summary', 'entity_type' => $subject ? $subject::class : 'unknown', 'entity_id' => $subject?->id, 'created_at' => now()]);
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
