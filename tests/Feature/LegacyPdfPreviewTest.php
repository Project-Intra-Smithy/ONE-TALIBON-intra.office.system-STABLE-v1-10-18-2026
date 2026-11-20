<?php

namespace Tests\Feature;

use App\Domain\Correspondence\CorrespondenceClassification;
use App\Domain\Correspondence\CorrespondenceLifecycleState;
use App\Domain\TravelOrders\TravelOrderStatus;
use App\Models\CorrespondenceEvent;
use App\Models\CorrespondenceRecord;
use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentLink;
use App\Models\Employee;
use App\Models\TransactionEvent;
use App\Models\TravelOrder;
use App\Models\TravelOrderEvent;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\AuditLogger;
use App\Services\DocumentArchiveQuery;
use App\Services\DocumentEvidenceQuery;
use Illuminate\Database\Eloquent\Model;
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
        $syntheticDisk = Storage::fake('documents');
        config(['filesystems.disks.documents.root' => rtrim($syntheticDisk->path(''), '/')]);
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

    public function test_all_legacy_direct_and_event_families_recheck_and_project_preview(): void
    {
        [$actor, $transaction, $document] = $this->evidence();
        $office = $actor->employee->department_id;
        $correspondence = $this->correspondence($actor);
        $travel = TravelOrder::query()->create([
            'reference_number' => 'PDF-TO-'.Str::upper(Str::random(10)),
            'issuance_date' => '2026-10-01', 'travel_start_date' => '2026-10-02',
            'travel_end_date' => '2026-10-03', 'purpose' => 'Synthetic PDF travel',
            'destination' => 'Synthetic destination', 'department_id' => $office,
            'status' => TravelOrderStatus::Approved,
        ]);
        $transactionEvent = TransactionEvent::query()->create([
            'transaction_id' => $transaction->id, 'actor_user_id' => $actor->id,
            'action' => 'submitted', 'new_status' => 'submitted', 'created_at' => now(),
        ]);
        $correspondenceEvent = CorrespondenceEvent::query()->create([
            'correspondence_record_id' => $correspondence->id, 'event' => 'received',
            'new_lifecycle_state' => CorrespondenceLifecycleState::Received->value,
            'occurred_at' => now(),
        ]);
        $travelEvent = TravelOrderEvent::query()->create([
            'travel_order_id' => $travel->id, 'actor_user_id' => $actor->id,
            'event' => 'evidence_marker', 'to_status' => TravelOrderStatus::Approved,
            'occurred_at' => now(), 'created_at' => now(),
        ]);
        $outsider = $this->actor();
        $url = $this->url($document);
        $plan = Document::query()->create(['title' => 'R3 synthetic quarantined marker',
            'original_name' => 'R3-hidden.pdf', 'classification' => 'restricted',
            'document_type' => 'plan_file', 'size_bytes' => 987654,
            'uploaded_by_user_id' => $actor->id, 'owner_department_id' => $office]);
        DB::table('documents')->where('id', $plan->id)->update(['security_domain' => 'EVER_PLAN']);
        $archive = app(DocumentArchiveQuery::class);

        foreach ([
            [$transaction, 'forTransaction', null],
            [$transactionEvent, 'forTransaction', $transaction],
            [$correspondence, 'forCorrespondence', null],
            [$correspondenceEvent, 'forCorrespondence', $correspondence],
            [$travel, 'forTravelOrder', null],
            [$travelEvent, 'forTravelOrder', $travel],
        ] as [$source, $query, $parent]) {
            $document->links()->delete();
            $this->link($document, $source);
            $this->actingAs($actor)->get($url)->assertOk()->assertContent($this->pdf());
            $this->assertSame($this->pdf(), $this->get('/documents/'.$document->public_id.'/download')->assertOk()->streamedContent());
            $evidence = app(DocumentEvidenceQuery::class)->{$query}($parent ?? $source);
            $items = $parent ? $evidence['events'][(string) $source->id] : $evidence['record'];
            $this->assertSame($url, $items[0]['previewUrl']);
            $baseline = $archive->workspace($actor, ['document' => $document->public_id]);
            $activity = $archive->activity($actor);
            // Deliberate synthetic corruption inside RefreshDatabase only.
            DB::statement('ALTER TABLE document_links DISABLE TRIGGER kirion_plan_generic_link_guard_trigger');
            try {
                $plan->links()->delete();
                $this->link($plan, $source);
            } finally {
                DB::statement('ALTER TABLE document_links ENABLE TRIGGER kirion_plan_generic_link_guard_trigger');
            }
            $current = $archive->workspace($actor, ['document' => $document->public_id]);
            foreach (['selected', 'counts', 'filterOptions'] as $key) {
                $this->assertSame($baseline[$key], $current[$key]);
            }
            $this->assertSame($baseline['records']->items(), $current['records']->items());
            $this->assertSame($baseline['records']->total(), $current['records']->total());
            $this->assertSame($activity, $archive->activity($actor));
            $this->assertSame($evidence, app(DocumentEvidenceQuery::class)->{$query}($parent ?? $source));
            $this->assertNull($archive->workspace($actor, ['document' => $plan->public_id])['selected']);
            $this->assertSame(0, $archive->workspace($actor, ['archive_search' => 'R3 synthetic quarantined marker'])['records']->total());
            $this->actingAs($outsider)->get($url)->assertNotFound()->assertContent('Not Found');
            $this->get('/documents/'.$document->public_id.'/download')->assertForbidden();
        }
    }

    public function test_mixed_restricted_parent_positions_and_unknown_source_fail_closed(): void
    {
        [$actor, $transaction, $document] = $this->evidence();
        $foreign = $this->correspondence($this->actor());
        $this->actingAs($actor);

        $queryCounts = [];
        foreach ([1, 16, 17, 32] as $position) {
            $document->links()->delete();
            for ($index = 1; $index <= 32; $index++) {
                $source = $index === $position ? $foreign : $transaction;
                DocumentLink::query()->create([
                    'document_id' => $document->id,
                    'linkable_type' => $source->getMorphClass(),
                    'linkable_id' => $source->id,
                    'relationship' => 'preview_position_'.$index,
                ]);
            }
            DB::enableQueryLog();
            DB::flushQueryLog();
            try {
                $this->get($this->url($document))->assertNotFound()->assertContent('Not Found');
                $previewCount = count(DB::getQueryLog());
                $this->get('/documents/'.$document->public_id.'/download')->assertForbidden();
                DB::flushQueryLog();
                $this->assertNull(app(DocumentArchiveQuery::class)->workspace($actor, ['document' => $document->public_id])['selected']);
                $archiveCount = count(DB::getQueryLog());
            } finally {
                DB::disableQueryLog();
                DB::flushQueryLog();
            }
            $queryCounts[] = [$previewCount, $archiveCount];
        }
        foreach ($queryCounts as [$previewCount, $archiveCount]) {
            $this->assertLessThanOrEqual($queryCounts[0][0] + 1, $previewCount);
            $this->assertLessThanOrEqual($queryCounts[0][1] + 1, $archiveCount);
        }

        $document->links()->delete();
        $this->link($document, $transaction);
        DocumentLink::query()->create([
            'document_id' => $document->id, 'linkable_type' => 'synthetic-unknown',
            'linkable_id' => 12, 'relationship' => 'unknown',
        ]);
        $this->get($this->url($document))->assertNotFound();
    }

    public function test_receipt_only_corruption_never_exposes_preview_entitlement(): void
    {
        [$actor, $record, $document] = $this->evidence();
        $document->links()->delete();
        $this->actingAs($actor);
        $before = $this->get('/documents?mode=files')->assertOk()->viewData('page')['props']['archive'];
        $searchBefore = $this->get('/portal-search')->assertOk()->viewData('page')['props']['archiveActivity'];
        DB::table('documents')->where('id', $document->id)->update(['security_domain' => 'EVER_PLAN']);
        // Privileged corruption fixture ONLY, inside RefreshDatabase's isolated
        // transaction. Restore the specific named triggers before exercising
        // any application read path. Never weaken production privileges.
        DB::statement('ALTER TABLE documents DISABLE TRIGGER kirion_plan_document_guard_trigger');
        try {
            DB::table('documents')->where('id', $document->id)->update(['security_domain' => null]);
        } finally {
            DB::statement('ALTER TABLE documents ENABLE TRIGGER kirion_plan_document_guard_trigger');
        }
        DB::statement('ALTER TABLE document_links DISABLE TRIGGER kirion_plan_generic_link_guard_trigger');
        try {
            $this->link($document, $record);
        } finally {
            DB::statement('ALTER TABLE document_links ENABLE TRIGGER kirion_plan_generic_link_guard_trigger');
        }
        $this->assertDatabaseHas('plan_document_origin_receipts', ['document_id' => $document->id]);
        $this->actingAs($actor)->get($this->url($document))->assertNotFound()->assertContent('Not Found');
        $this->get('/documents/'.$document->public_id.'/download')->assertNotFound();
        $this->get($this->url($document), ['Range' => 'bytes=0-15'])->assertNotFound()
            ->assertContent('Not Found')->assertHeaderMissing('Content-Disposition')
            ->assertHeaderMissing('Content-Range');
        $this->head($this->url($document))->assertNotFound()->assertContent('')
            ->assertHeaderMissing('Content-Disposition')->assertHeaderMissing('Content-Range');
        $archive = app(DocumentArchiveQuery::class)->workspace($actor, ['document' => $document->public_id]);
        $this->assertNull($archive['selected']);
        $this->assertSame(0, $archive['records']->total());
        $detail = app(DocumentEvidenceQuery::class)->forTransaction($record);
        $this->assertSame([], $detail['record']);
        $after = $this->get('/documents?mode=files')->assertOk()->viewData('page')['props']['archive'];
        foreach (['selected', 'counts', 'filterOptions', 'records'] as $key) {
            $this->assertSame(json_encode($before[$key]), json_encode($after[$key]));
        }
        $this->assertSame($searchBefore, $this->get('/portal-search')->assertOk()->viewData('page')['props']['archiveActivity']);
        $this->assertDatabaseMissing('audit_logs', [
            'action' => 'document.preview', 'outcome' => 'allowed', 'entity_id' => $document->id,
        ]);
    }

    public function test_both_provenance_components_absent_denies_new_preview(): void
    {
        [$actor, , $document] = $this->evidence();
        $this->actingAs($actor);
        // Simulate the old-schema compatibility branch without touching schema.
        Schema::partialMock();
        Schema::shouldReceive('hasColumn')->with('documents', 'security_domain')->andReturn(false);
        Schema::shouldReceive('hasTable')->with('plan_document_origin_receipts')->andReturn(false);

        $this->get($this->url($document))->assertNotFound()->assertContent('Not Found');
        // R4 supersedes the historical fallback in the current candidate.
        $this->get('/documents/'.$document->public_id.'/download')->assertNotFound();
    }

    public function test_symlink_alias_and_size_limit_cannot_return_bytes(): void
    {
        [$actor, , $document] = $this->evidence();
        $this->actingAs($actor);
        $path = Storage::disk('documents')->path($document->storage_path);
        $alias = dirname($path).'/alias.pdf';
        $this->assertTrue(symlink($path, $alias));
        try {
            $document->update(['storage_path' => '2026/11/alias.pdf']);
            $this->get($this->url($document))->assertNotFound();
        } finally {
            unlink($alias);
        }
        $document->update(['storage_path' => '2026/11/'.basename($path)]);
        $hard = dirname($path).'/hard.pdf';
        $this->assertTrue(link($path, $hard));
        try {
            $this->get($this->url($document))->assertNotFound();
        } finally {
            unlink($hard);
        }
        $this->get($this->url($document))->assertOk();
        config(['documents.max_upload_mb' => 0]);
        $this->get($this->url($document))->assertNotFound();
    }

    public function test_exact_preview_size_boundary_and_non_pdf_metadata_preservation(): void
    {
        [$actor, $record, $document] = $this->evidence();
        $this->actingAs($actor);
        config(['documents.max_upload_mb' => 1]);
        $bytes = str_pad($this->pdf(), 1024 * 1024, ' ');
        Storage::disk('documents')->put($document->storage_path, $bytes);
        $document->update(['size_bytes' => strlen($bytes), 'checksum_sha256' => hash('sha256', $bytes)]);
        $this->get($this->url($document))->assertOk()->assertContent($bytes);
        $bytes .= ' ';
        Storage::disk('documents')->put($document->storage_path, $bytes);
        $document->update(['size_bytes' => strlen($bytes), 'checksum_sha256' => hash('sha256', $bytes)]);
        $this->get($this->url($document))->assertNotFound();
        $document->update(['mime_type' => 'image/png']);
        $archive = app(DocumentArchiveQuery::class)->workspace($actor, ['document' => $document->public_id]);
        $this->assertSame($document->public_id, $archive['selected']['publicId']);
        $this->assertNull($archive['selected']['previewUrl']);
        $this->assertNotNull($archive['selected']['downloadUrl']);
        $this->assertNull(app(DocumentEvidenceQuery::class)->forTransaction($record)['record'][0]['previewUrl']);
    }

    public function test_actual_partial_and_missing_provenance_hide_metadata_and_preview(): void
    {
        [$actor, $record, $document] = $this->evidence();
        $this->actingAs($actor);
        $archive = app(DocumentArchiveQuery::class);
        foreach (['domain', 'receipt', 'both', 'binding'] as $missing) {
            $domain = in_array($missing, ['domain', 'both'], true);
            $receipt = in_array($missing, ['receipt', 'both'], true);
            $binding = $missing === 'binding';
            if ($domain) {
                DB::statement('ALTER TABLE documents RENAME COLUMN security_domain TO r3_hidden_domain');
            }
            if ($receipt) {
                DB::statement('ALTER TABLE plan_document_origin_receipts RENAME TO r3_hidden_receipts');
            }
            if ($binding) {
                DB::statement('ALTER TABLE plan_document_bindings RENAME TO r3_hidden_bindings');
            }
            try {
                $this->assertSame(0, $archive->workspace($actor, [])['records']->total());
                $this->assertNull($archive->workspace($actor, ['document' => $document->public_id])['selected']);
                $this->assertSame([], app(DocumentEvidenceQuery::class)->forTransaction($record)['record']);
                $this->get($this->url($document))->assertNotFound()->assertContent('Not Found');
            } finally {
                if ($binding) {
                    DB::statement('ALTER TABLE r3_hidden_bindings RENAME TO plan_document_bindings');
                }
                if ($receipt) {
                    DB::statement('ALTER TABLE r3_hidden_receipts RENAME TO plan_document_origin_receipts');
                }
                if ($domain) {
                    DB::statement('ALTER TABLE documents RENAME COLUMN r3_hidden_domain TO security_domain');
                }
            }
        }
        $this->get($this->url($document))->assertOk();
    }

    public function test_actual_partial_custody_columns_quarantine_metadata_and_both_byte_routes(): void
    {
        [$actor, $record, $document] = $this->evidence();
        $this->actingAs($actor);
        $archive = app(DocumentArchiveQuery::class);
        $preview = $this->url($document);
        $download = '/documents/'.$document->public_id.'/download';

        $this->get($preview)->assertOk()->assertContent($this->pdf());
        $this->assertSame($this->pdf(), $this->get($download)->assertOk()->streamedContent());

        foreach (['custody_mode', 'custody_operation_id'] as $column) {
            // Isolate each real schema mutation in a savepoint. A failed SQL
            // query must not hide the assertion failure behind cleanup DDL.
            DB::beginTransaction();
            try {
                DB::statement('ALTER TABLE documents RENAME COLUMN '.$column.' TO integration_hidden_custody');
                $this->assertSame(0, $archive->workspace($actor, [])['records']->total());
                $this->assertNull($archive->workspace($actor, ['document' => $document->public_id])['selected']);
                $this->assertSame([], app(DocumentEvidenceQuery::class)->forTransaction($record)['record']);
                $this->get($preview)->assertNotFound()->assertContent('Not Found');
                $this->get($download)->assertNotFound()->assertContent('Not Found');
            } finally {
                DB::rollBack();
            }
            $restored = $archive->workspace($actor, ['document' => $document->public_id]);
            $this->assertSame($document->public_id, $restored['selected']['publicId']);
            $this->assertSame($preview, $restored['selected']['previewUrl']);
            $this->get($preview)->assertOk()->assertContent($this->pdf());
            $this->assertSame($this->pdf(), $this->get($download)->assertOk()->streamedContent());
        }
    }

    public function test_retained_iam_epoch_cannot_read_pdf_bytes_after_revocation(): void
    {
        [$actor, , $document] = $this->evidence();
        foreach ([$this->url($document), '/documents/'.$document->public_id.'/download'] as $url) {
            $actor = $actor->fresh();
            $this->actingAs($actor);
            $this->get($this->url($document))->assertOk()->assertContent($this->pdf());
            $allowed = DB::table('audit_logs')->where('actor_user_id', $actor->id)
                ->whereIn('action', ['document.preview', 'document.download'])->where('outcome', 'allowed')->count();
            DB::table('users')->where('id', $actor->id)->increment('session_version');
            $response = $this->get($url)->assertRedirect(route('login'))->assertSessionMissing('auth_session_version');
            $this->assertGuest();
            $this->assertStringNotContainsString($this->pdf(), $response->getContent());
            $this->assertSame($allowed, DB::table('audit_logs')->where('actor_user_id', $actor->id)
                ->whereIn('action', ['document.preview', 'document.download'])->where('outcome', 'allowed')->count());
            $this->assertDatabaseHas('audit_logs', [
                'actor_user_id' => $actor->id,
                'action' => 'auth.account.deactivated_forced_logout', 'outcome' => 'denied',
            ]);
        }
        // Explicit synthetic reauthentication binds the now-current epoch.
        $this->actingAs($actor->fresh())->get($this->url($document))->assertOk()->assertContent($this->pdf());
        $this->assertSame($this->pdf(), $this->get('/documents/'.$document->public_id.'/download')->assertOk()->streamedContent());
    }

    public function test_unknown_domain_and_inconsistent_typed_ownership_are_quarantined(): void
    {
        [$actor, $record, $document] = $this->evidence();
        $this->actingAs($actor);
        $archive = app(DocumentArchiveQuery::class);
        DB::statement('ALTER TABLE documents DROP CONSTRAINT documents_plan_origin_domain_check');
        try {
            DB::table('documents')->where('id', $document->id)->update(['security_domain' => 'UNKNOWN']);
            $this->assertSame(0, $archive->workspace($actor, [])['records']->total());
            $this->get($this->url($document))->assertNotFound();
        } finally {
            DB::table('documents')->where('id', $document->id)->update(['security_domain' => null]);
            DB::statement("ALTER TABLE documents ADD CONSTRAINT documents_plan_origin_domain_check CHECK (security_domain IN ('EVER_PLAN', 'LEGACY_CTW'))");
        }

        $family = \App\Models\PlanFamily::query()->create(['title' => 'Synthetic R3 typed fixture']);
        $edition = $family->editions()->create(['edition_label' => 'Synthetic R3']);
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
        $this->assertSame(0, $archive->workspace($actor, [])['records']->total());
        $this->assertSame([], app(DocumentEvidenceQuery::class)->forTransaction($record)['record']);
        $this->get($this->url($document))->assertNotFound();
    }

    public function test_preview_metadata_query_budget_is_bounded_across_document_and_link_counts(): void
    {
        [$actor, $record, $document] = $this->evidence();
        $this->actingAs($actor);
        $archive = app(DocumentArchiveQuery::class);
        $detail = app(DocumentEvidenceQuery::class);
        $counts = [];
        for ($index = 1; $index <= 32; $index++) {
            if ($index > 1) {
                $copy = $document->replicate(['public_id']);
                $copy->public_id = (string) Str::uuid();
                $copy->save();
                $this->link($copy, $record);
            }
            if (! in_array($index, [1, 16, 17, 32], true)) {
                continue;
            }
            DB::enableQueryLog();
            DB::flushQueryLog();
            try {
                $projection = $archive->workspace($actor, ['page' => 1]);
                $archiveCount = count(DB::getQueryLog());
                DB::flushQueryLog();
                $items = $detail->forTransaction($record)['record'];
                $detailCount = count(DB::getQueryLog());
            } finally {
                DB::disableQueryLog();
                DB::flushQueryLog();
            }
            $this->assertSame($index, $projection['records']->total());
            $this->assertCount($index, $items);
            $counts[] = [$archiveCount, $detailCount];
        }
        foreach ($counts as [$archiveCount, $detailCount]) {
            $this->assertLessThanOrEqual($counts[0][0] + 1, $archiveCount);
            $this->assertLessThanOrEqual($counts[0][1] + 1, $detailCount);
        }
        $this->assertCount(12, $archive->workspace($actor, ['page' => 2])['records']->items());
    }

    private function correspondence(User $actor): CorrespondenceRecord
    {
        return CorrespondenceRecord::query()->create([
            'public_id' => (string) Str::uuid(), 'external_reference_no' => 'PDF-COR-'.Str::random(12),
            'source' => 'email', 'channel' => 'official_email', 'sender_name' => 'Synthetic sender',
            'sender_organization' => 'Synthetic office', 'subject' => 'Synthetic restricted source',
            'received_at' => now(), 'receiving_department_id' => $actor->employee->department_id,
            'municipal_reference_no' => 'PDF-MUN-'.Str::random(12),
            'classification' => CorrespondenceClassification::Restricted->value,
            'lifecycle_state' => CorrespondenceLifecycleState::Classified->value,
        ]);
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
