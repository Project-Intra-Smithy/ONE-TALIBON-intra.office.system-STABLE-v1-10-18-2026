<?php

namespace Tests\Feature;

use App\Domain\Correspondence\CorrespondenceClassification;
use App\Domain\Correspondence\CorrespondenceLifecycleState;
use App\Models\CorrespondenceEvent;
use App\Models\CorrespondenceRecord;
use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentLink;
use App\Models\Employee;
use App\Models\PlanFamily;
use App\Models\TransactionEvent;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\CorrespondenceEvidenceService;
use App\Services\TransactionWorkflowService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use RuntimeException;
use Tests\TestCase;

class CoreDocumentAttachmentsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config()->set('messaging_release.restricted_uat', false);
        $syntheticDisk = Storage::fake('documents');
        config(['filesystems.disks.documents.root' => rtrim($syntheticDisk->path(''), '/')]);
    }

    public function test_transaction_creation_persists_private_hashed_evidence_and_exact_links(): void
    {
        $origin = $this->department('TX-ORIGIN');
        $target = $this->department('TX-TARGET');
        $creator = $this->human('department_head', $origin);
        $contents = "%PDF-1.7\nCore portal evidence\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('official-request.pdf', $contents);

        $this->actingAs($creator)
            ->post('/transactions', [
                'transaction_type' => 'internal_request',
                'title' => 'Evidence-backed transaction',
                'description' => 'Transaction with protected evidence.',
                'priority' => 'normal',
                'target_department_id' => $target->id,
                'remarks' => 'Initial routing.',
                'evidence' => [$file],
            ])
            ->assertRedirect();

        $transaction = WorkflowTransaction::query()->sole();
        $event = TransactionEvent::query()
            ->where('transaction_id', $transaction->id)
            ->where('action', 'submitted')
            ->sole();
        $document = Document::query()->sole();

        $this->assertSame('documents', $document->storage_disk);
        $this->assertSame('internal', $document->classification);
        $this->assertSame('application/pdf', $document->mime_type);
        $this->assertSame(strlen($contents), $document->size_bytes);
        $this->assertSame(hash('sha256', $contents), $document->checksum_sha256);
        $this->assertSame($creator->id, $document->uploaded_by_user_id);
        $this->assertSame($origin->id, $document->owner_department_id);
        $this->assertSame('official-request.pdf', $document->original_name);
        $this->assertStringNotContainsString('official-request', (string) $document->storage_path);
        $this->assertMatchesRegularExpression('#^\d{4}/\d{2}/[0-9a-f-]{36}\.pdf$#', (string) $document->storage_path);
        Storage::disk('documents')->assertExists($document->storage_path);

        $this->assertDatabaseHas('document_links', [
            'document_id' => $document->id,
            'linkable_type' => $transaction->getMorphClass(),
            'linkable_id' => $transaction->id,
            'relationship' => 'supporting_document',
        ]);
        $this->assertDatabaseHas('document_links', [
            'document_id' => $document->id,
            'linkable_type' => $event->getMorphClass(),
            'linkable_id' => $event->id,
            'relationship' => 'route_evidence',
        ]);

        $this->actingAs($creator)
            ->get('/transactions/'.$transaction->id)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('evidence.record.0.publicId', $document->public_id)
                ->where('evidence.record.0.downloadUrl', '/documents/'.$document->public_id.'/download')
                ->where('evidence.events.'.$event->id.'.0.relationship', 'route_evidence'));
    }

    public function test_allowed_docx_and_image_content_are_accepted_with_canonical_metadata(): void
    {
        $office = $this->department('FILES');
        $target = $this->department('FILES-TARGET');
        $creator = $this->human('department_head', $office);
        $docx = UploadedFile::fake()->createWithContent(
            'brief.docx',
            "PK\x03\x04fake-package-[Content_Types].xml-word/document.xml",
        );
        $png = UploadedFile::fake()->createWithContent(
            'photo.png',
            "\x89PNG\r\n\x1A\n".str_repeat("\0", 24),
        );

        $this->actingAs($creator)
            ->post('/transactions', [
                'transaction_type' => 'document_review',
                'title' => 'Mixed evidence types',
                'priority' => 'normal',
                'target_department_id' => $target->id,
                'evidence' => [$docx, $png],
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('documents', 2);
        $this->assertSame(
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            Document::query()->where('original_name', 'brief.docx')->value('mime_type'),
        );
        $this->assertSame('image/png', Document::query()->where('original_name', 'photo.png')->value('mime_type'));
        foreach (['brief.docx', 'photo.png'] as $name) {
            $document = Document::query()->where('original_name', $name)->sole();
            $bytes = Storage::disk('documents')->get($document->storage_path);
            $this->assertSame(hash('sha256', $bytes), $document->checksum_sha256);
            $response = $this->actingAs($creator)->get('/documents/'.$document->public_id.'/download')
                ->assertOk()->assertHeader('Content-Type', $document->mime_type);
            $this->assertSame($bytes, $response->streamedContent());
        }
    }

    public function test_spoofed_pdf_and_non_docx_zip_are_rejected_before_transaction_mutation(): void
    {
        $origin = $this->department('SPOOF');
        $target = $this->department('SPOOF-TARGET');
        $creator = $this->human('department_head', $origin);
        $base = [
            'transaction_type' => 'internal_request',
            'title' => 'Must not persist',
            'priority' => 'normal',
            'target_department_id' => $target->id,
        ];

        $this->actingAs($creator)
            ->from('/transactions/create')
            ->post('/transactions', [
                ...$base,
                'evidence' => [UploadedFile::fake()->createWithContent('malware.pdf', "MZ\x90\x00executable")],
            ])
            ->assertSessionHasErrors('evidence.0');

        $this->actingAs($creator)
            ->from('/transactions/create')
            ->post('/transactions', [
                ...$base,
                'evidence' => [UploadedFile::fake()->createWithContent('renamed.docx', "PK\x03\x04ordinary-zip")],
            ])
            ->assertSessionHasErrors('evidence.0');

        $this->assertDatabaseCount('transactions', 0);
        $this->assertDatabaseCount('transaction_events', 0);
        $this->assertDatabaseCount('documents', 0);
        $this->assertDatabaseCount('document_links', 0);
        $this->assertSame([], Storage::disk('documents')->allFiles());
    }

    public function test_configured_upload_size_limit_is_enforced_before_mutation(): void
    {
        config(['documents.max_upload_mb' => 1]);
        $origin = $this->department('SIZE');
        $target = $this->department('SIZE-TARGET');
        $creator = $this->human('department_head', $origin);

        $this->actingAs($creator)
            ->from('/transactions/create')
            ->post('/transactions', [
                'transaction_type' => 'internal_request',
                'title' => 'Oversize evidence',
                'priority' => 'normal',
                'target_department_id' => $target->id,
                'evidence' => [UploadedFile::fake()->create('large.pdf', 1100, 'application/pdf')],
            ])
            ->assertSessionHasErrors('evidence.0');

        $this->assertDatabaseCount('transactions', 0);
        $this->assertDatabaseCount('documents', 0);
    }

    public function test_transaction_transition_evidence_is_linked_to_exact_append_only_event(): void
    {
        $origin = $this->department('ACTION-ORIGIN');
        $current = $this->department('ACTION-CURRENT');
        $creator = $this->human('department_head', $origin);
        $actor = $this->human('department_head', $current);
        $transaction = app(TransactionWorkflowService::class)->create($creator, [
            'transaction_type' => 'internal_request',
            'title' => 'Action evidence transaction',
            'priority' => 'normal',
            'target_department_id' => $current->id,
        ]);
        $file = UploadedFile::fake()->createWithContent('review.pdf', "%PDF-1.7\nreview\n%%EOF");

        $this->actingAs($actor)
            ->post('/transactions/'.$transaction->id.'/transition', [
                'action' => 'mark_review',
                'remarks' => 'Reviewed with attached proof.',
                'evidence' => [$file],
            ])
            ->assertRedirect('/transactions/'.$transaction->id);

        $event = TransactionEvent::query()
            ->where('transaction_id', $transaction->id)
            ->where('action', 'mark_review')
            ->sole();
        $document = Document::query()->sole();

        $this->assertDatabaseHas('document_links', [
            'document_id' => $document->id,
            'linkable_type' => $event->getMorphClass(),
            'linkable_id' => $event->id,
            'relationship' => 'action_evidence',
        ]);
        $this->assertDatabaseMissing('document_links', [
            'document_id' => $document->id,
            'linkable_type' => $transaction->getMorphClass(),
            'linkable_id' => $transaction->id,
        ]);
    }

    public function test_protected_download_reauthorizes_parent_and_guessed_storage_path_is_not_served(): void
    {
        $origin = $this->department('DOWNLOAD-ORIGIN');
        $target = $this->department('DOWNLOAD-TARGET');
        $other = $this->department('DOWNLOAD-OTHER');
        $creator = $this->human('department_head', $origin);
        $outsider = $this->human('department_head', $other);
        $file = UploadedFile::fake()->createWithContent('download.pdf', "%PDF-1.7\ndownload\n%%EOF");

        $this->actingAs($creator)->post('/transactions', [
            'transaction_type' => 'internal_request',
            'title' => 'Protected evidence download',
            'priority' => 'normal',
            'target_department_id' => $target->id,
            'evidence' => [$file],
        ])->assertRedirect();

        $document = Document::query()->sole();
        $this->assertFalse((bool) config('filesystems.disks.documents.serve'));

        $this->actingAs($creator)
            ->get('/documents/'.$document->public_id.'/download')
            ->assertOk()
            ->assertHeader('x-content-type-options', 'nosniff');

        $this->actingAs($outsider)
            ->get('/documents/'.$document->public_id.'/download')
            ->assertForbidden();

        $this->actingAs($creator)
            ->get('/storage/documents/'.$document->storage_path)
            ->assertStatus(403);
    }

    public function test_correspondence_lifecycle_evidence_inherits_classification_and_tracks_exact_events(): void
    {
        $origin = $this->department('COR-ORIGIN');
        $target = $this->department('COR-TARGET');
        $head = $this->human('department_head', $origin);
        $targetHead = $this->human('department_head', $target);
        $record = $this->record('Evidence-backed incoming document');

        $this->actingAs($head)->post('/correspondence/'.$record->public_id.'/workspace/register', [
            'evidence' => [UploadedFile::fake()->createWithContent('received.pdf', "%PDF-1.7\nreceived\n%%EOF")],
        ])->assertRedirect('/correspondence/'.$record->public_id.'/workspace');

        $registeredDocument = Document::query()->where('original_name', 'received.pdf')->sole();
        $registeredEvent = CorrespondenceEvent::query()->where('correspondence_record_id', $record->id)->where('event', 'registered')->sole();
        $this->assertDatabaseHas('document_links', [
            'document_id' => $registeredDocument->id,
            'linkable_type' => $record->getMorphClass(),
            'linkable_id' => $record->id,
            'relationship' => 'supporting_document',
        ]);
        $this->assertDatabaseHas('document_links', [
            'document_id' => $registeredDocument->id,
            'linkable_type' => $registeredEvent->getMorphClass(),
            'linkable_id' => $registeredEvent->id,
            'relationship' => 'action_evidence',
        ]);

        $this->actingAs($head)->post('/correspondence/'.$record->public_id.'/workspace/classify', [
            'classification' => 'restricted',
            'remarks' => 'Restricted municipal correspondence.',
        ])->assertRedirect('/correspondence/'.$record->public_id.'/workspace');

        $this->assertSame('restricted', $registeredDocument->fresh()->classification);

        $this->actingAs($head)->post('/correspondence/'.$record->public_id.'/workspace/route', [
            'target_department_id' => $target->id,
            'priority' => 'normal',
            'evidence' => [UploadedFile::fake()->createWithContent(
                'routing.docx',
                "PK\x03\x04[Content_Types].xml-word/document.xml-routing",
            )],
        ])->assertRedirect('/correspondence');

        $routed = $record->fresh('workflowTransaction');
        $routeEvent = CorrespondenceEvent::query()->where('correspondence_record_id', $record->id)->where('event', 'routed')->sole();
        $routeDocument = Document::query()->where('original_name', 'routing.docx')->sole();
        $this->assertSame('restricted', $routeDocument->classification);
        $this->assertDatabaseHas('document_links', [
            'document_id' => $routeDocument->id,
            'linkable_type' => $routeEvent->getMorphClass(),
            'linkable_id' => $routeEvent->id,
            'relationship' => 'route_evidence',
        ]);

        app(TransactionWorkflowService::class)->transition(
            $targetHead,
            $routed->workflowTransaction,
            'assign',
            assignedEmployeeId: $targetHead->employee->id,
        );

        $this->actingAs($targetHead)->post('/correspondence/'.$record->public_id.'/workspace/act', [
            'remarks' => 'Started field action.',
            'evidence' => [UploadedFile::fake()->createWithContent('photo.jpg', "\xFF\xD8\xFF".str_repeat("\0", 32))],
        ])->assertRedirect('/correspondence/'.$record->public_id.'/workspace');

        $actEvent = CorrespondenceEvent::query()->where('correspondence_record_id', $record->id)->where('event', 'in_action')->sole();
        $photo = Document::query()->where('original_name', 'photo.jpg')->sole();
        $this->assertSame('restricted', $photo->classification);
        $this->assertDatabaseHas('document_links', [
            'document_id' => $photo->id,
            'linkable_type' => $actEvent->getMorphClass(),
            'linkable_id' => $actEvent->id,
            'relationship' => 'action_evidence',
        ]);

        $this->actingAs($targetHead)
            ->get('/correspondence/'.$record->public_id.'/workspace')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('evidence.record.0.publicId', $registeredDocument->public_id)
                ->where('evidence.events.'.$routeEvent->id.'.0.publicId', $routeDocument->public_id)
                ->where('evidence.events.'.$actEvent->id.'.0.publicId', $photo->public_id));
    }

    public function test_restricted_correspondence_evidence_does_not_inherit_system_admin_transaction_oversight(): void
    {
        $owner = $this->department('RESTRICTED-OWNER');
        $adminOffice = $this->department('ADMIN-OFFICE');
        $head = $this->human('department_head', $owner);
        $admin = $this->human('system_admin', $adminOffice);
        $record = $this->record('Restricted evidence');

        $this->actingAs($head)->post('/correspondence/'.$record->public_id.'/workspace/register', [
            'evidence' => [UploadedFile::fake()->createWithContent('restricted.pdf', "%PDF-1.7\nsecret\n%%EOF")],
        ])->assertRedirect();
        $this->actingAs($head)->post('/correspondence/'.$record->public_id.'/workspace/classify', [
            'classification' => 'restricted',
        ])->assertRedirect();

        $document = Document::query()->sole();
        $this->actingAs($admin)
            ->get('/documents/'.$document->public_id.'/download')
            ->assertForbidden();
    }

    public function test_invalid_correspondence_evidence_does_not_advance_lifecycle_and_live_payload_has_no_documents(): void
    {
        $origin = $this->department('ROLLBACK-ORIGIN');
        $target = $this->department('ROLLBACK-TARGET');
        $head = $this->human('department_head', $origin);
        $targetHead = $this->human('department_head', $target);
        $record = $this->record('Invalid evidence intake');

        $this->actingAs($head)
            ->from('/correspondence/'.$record->public_id.'/workspace')
            ->post('/correspondence/'.$record->public_id.'/workspace/register', [
                'evidence' => [UploadedFile::fake()->createWithContent('fake.pdf', 'plain text pretending to be a PDF')],
            ])
            ->assertSessionHasErrors('evidence.0');

        $this->assertSame(CorrespondenceLifecycleState::Received, $record->fresh()->lifecycle_state);
        $this->assertDatabaseCount('documents', 0);
        $this->assertDatabaseCount('document_links', 0);

        $transaction = app(TransactionWorkflowService::class)->create($head, [
            'transaction_type' => 'internal_request',
            'title' => 'Live response remains lightweight',
            'priority' => 'normal',
            'target_department_id' => $target->id,
        ]);

        $this->actingAs($targetHead)
            ->getJson('/transactions/'.$transaction->id.'/live')
            ->assertOk()
            ->assertJsonMissingPath('evidence')
            ->assertJsonMissingPath('documents')
            ->assertJsonMissingPath('transaction.documents');
    }

    public function test_classify_reclassifies_only_eligible_legacy_path_evidence_and_quarantines_registry_contradictory_and_plan_rows(): void
    {
        $origin = $this->department('COMPAT-FULL');
        $head = $this->human('department_head', $origin);
        $record = $this->record('Full custody schema reclassification compatibility');
        $service = app(CorrespondenceEvidenceService::class);

        $record = $service->register(
            $head,
            $record,
            (string) Str::uuid(),
            [UploadedFile::fake()->createWithContent('legit-legacy.pdf', "%PDF-1.7\nlegit\n%%EOF")],
        );

        $legitDoc = Document::query()->where('original_name', 'legit-legacy.pdf')->sole();
        $registeredEvent = CorrespondenceEvent::query()
            ->where('correspondence_record_id', $record->id)
            ->where('event', 'registered')
            ->sole();

        $legacyCtwDoc = $this->linkedCorrespondenceDocument($head, $registeredEvent, 'legacy-ctw.pdf', 'LEGACY_CTW');
        $everPlanDoc = $this->linkedCorrespondenceDocument($head, $record, 'ever-plan.pdf', 'EVER_PLAN');
        $receiptDoc = $this->linkedCorrespondenceDocument($head, $record, 'plan-receipt.pdf', 'LEGACY_CTW', withReceipt: true);
        $bindingDoc = $this->linkedCorrespondenceDocument($head, $record, 'plan-binding.pdf', 'LEGACY_CTW', withBinding: true);

        $registryDoc = null;
        $contradictoryDoc = null;
        $hasCustodyColumns = Schema::hasColumn('documents', 'custody_mode')
            && Schema::hasColumn('documents', 'custody_operation_id');

        DB::beginTransaction();
        try {
            if ($hasCustodyColumns) {
                $registryDoc = $this->linkedCorrespondenceDocument($head, $record, 'registry-v1.pdf', 'LEGACY_CTW');
                $contradictoryDoc = $this->linkedCorrespondenceDocument($head, $registeredEvent, 'contradictory.pdf', 'LEGACY_CTW');

                DB::statement('ALTER TABLE documents DISABLE TRIGGER a_n03_public_guard');
                DB::statement('ALTER TABLE documents DROP CONSTRAINT n03_document_item');
                DB::statement('ALTER TABLE documents DROP CONSTRAINT n03_mode_check');
                try {
                    DB::table('documents')->where('id', $registryDoc->id)->update([
                        'custody_mode' => 'REGISTRY_V1',
                        'custody_operation_id' => (string) Str::uuid(),
                        'custody_ordinal' => 1,
                        'storage_disk' => 'legacy_registry_v1',
                        'storage_path' => null,
                    ]);
                    DB::table('documents')->where('id', $contradictoryDoc->id)->update([
                        'custody_mode' => 'LEGACY_PATH',
                        'custody_operation_id' => (string) Str::uuid(),
                    ]);
                } finally {
                    DB::statement('ALTER TABLE documents ENABLE TRIGGER a_n03_public_guard');
                }
            }

            $classified = $service->classify(
                $head,
                $record->fresh(),
                CorrespondenceClassification::Restricted,
                (string) Str::uuid(),
                'Restricted classification under full schema.',
                [],
            );

            $this->assertSame(CorrespondenceLifecycleState::Classified, $classified->lifecycle_state);
            $this->assertSame(CorrespondenceClassification::Restricted, $classified->classification);
            $this->assertSame('restricted', $legitDoc->fresh()->classification);
            $this->assertSame('restricted', $legacyCtwDoc->fresh()->classification);
            $this->assertSame('internal', $everPlanDoc->fresh()->classification);
            $this->assertSame('internal', $receiptDoc->fresh()->classification);
            $this->assertSame('internal', $bindingDoc->fresh()->classification);

            if ($registryDoc !== null && $contradictoryDoc !== null) {
                $this->assertSame('internal', $registryDoc->fresh()->classification);
                $this->assertSame('internal', $contradictoryDoc->fresh()->classification);
            }
        } finally {
            DB::rollBack();
        }
    }

    public function test_classify_reclassifies_eligible_legacy_evidence_when_both_custody_columns_are_absent_and_quarantines_plan_rows(): void
    {
        $origin = $this->department('COMPAT-LEGACY-ONLY');
        $head = $this->human('department_head', $origin);
        $record = $this->record('Legacy-only schema reclassification compatibility');
        $service = app(CorrespondenceEvidenceService::class);

        $record = $service->register(
            $head,
            $record,
            (string) Str::uuid(),
            [UploadedFile::fake()->createWithContent('legacy-only.pdf', "%PDF-1.7\nlegacy-only\n%%EOF")],
        );

        $legitDoc = Document::query()->where('original_name', 'legacy-only.pdf')->sole();
        $registeredEvent = CorrespondenceEvent::query()
            ->where('correspondence_record_id', $record->id)
            ->where('event', 'registered')
            ->sole();

        $legacyCtwDoc = $this->linkedCorrespondenceDocument($head, $registeredEvent, 'legacy-only-ctw.pdf', 'LEGACY_CTW');
        $everPlanDoc = $this->linkedCorrespondenceDocument($head, $record, 'legacy-only-plan.pdf', 'EVER_PLAN');
        $receiptDoc = $this->linkedCorrespondenceDocument($head, $record, 'legacy-only-receipt.pdf', 'LEGACY_CTW', withReceipt: true);
        $bindingDoc = $this->linkedCorrespondenceDocument($head, $record, 'legacy-only-binding.pdf', 'LEGACY_CTW', withBinding: true);

        $hasCustodyColumns = Schema::hasColumn('documents', 'custody_mode')
            && Schema::hasColumn('documents', 'custody_operation_id');

        DB::beginTransaction();
        try {
            if ($hasCustodyColumns) {
                DB::statement('ALTER TABLE documents DISABLE TRIGGER a_n03_public_guard');
                DB::statement('ALTER TABLE documents RENAME COLUMN custody_mode TO compat_hidden_custody_mode');
                DB::statement('ALTER TABLE documents RENAME COLUMN custody_operation_id TO compat_hidden_custody_op');
            }

            $classified = $service->classify(
                $head,
                $record->fresh(),
                CorrespondenceClassification::Confidential,
                (string) Str::uuid(),
                'Confidential classification under legacy-only schema.',
                [],
            );

            $this->assertSame(CorrespondenceLifecycleState::Classified, $classified->lifecycle_state);
            $this->assertSame(CorrespondenceClassification::Confidential, $classified->classification);
            $this->assertSame('confidential', $legitDoc->fresh()->classification);
            $this->assertSame('confidential', $legacyCtwDoc->fresh()->classification);
            $this->assertSame('internal', $everPlanDoc->fresh()->classification);
            $this->assertSame('internal', $receiptDoc->fresh()->classification);
            $this->assertSame('internal', $bindingDoc->fresh()->classification);
        } finally {
            DB::rollBack();
        }
    }

    public function test_classify_fails_closed_and_rolls_back_atomically_on_partial_custody_or_missing_provenance_schema(): void
    {
        $origin = $this->department('COMPAT-PARTIAL');
        $head = $this->human('department_head', $origin);
        $record = $this->record('Partial schema rollback verification');
        $service = app(CorrespondenceEvidenceService::class);

        $record = $service->register(
            $head,
            $record,
            (string) Str::uuid(),
            [UploadedFile::fake()->createWithContent('partial-guard.pdf', "%PDF-1.7\npartial\n%%EOF")],
        );

        $document = Document::query()->where('original_name', 'partial-guard.pdf')->sole();
        $initialFiles = Storage::disk('documents')->allFiles();

        $mutations = [
            'missing_security_domain' => 'ALTER TABLE documents RENAME COLUMN security_domain TO compat_hidden_domain',
            'missing_origin_receipts' => 'ALTER TABLE plan_document_origin_receipts RENAME TO compat_hidden_receipts',
            'missing_typed_bindings' => 'ALTER TABLE plan_document_bindings RENAME TO compat_hidden_bindings',
        ];

        if (Schema::hasColumn('documents', 'custody_mode') && Schema::hasColumn('documents', 'custody_operation_id')) {
            $mutations['partial_custody_mode_missing'] = 'ALTER TABLE documents RENAME COLUMN custody_mode TO compat_hidden_mode';
            $mutations['partial_custody_operation_missing'] = 'ALTER TABLE documents RENAME COLUMN custody_operation_id TO compat_hidden_op';
        }

        foreach ($mutations as $case => $ddl) {
            DB::beginTransaction();
            try {
                DB::statement($ddl);
                $failed = false;

                try {
                    $service->classify(
                        $head,
                        $record->fresh(),
                        CorrespondenceClassification::Restricted,
                        (string) Str::uuid(),
                        'Should fail closed on '.$case,
                        [UploadedFile::fake()->createWithContent('extra-'.$case.'.pdf', "%PDF-1.7\nextra\n%%EOF")],
                    );
                } catch (RuntimeException $exception) {
                    $this->assertSame(
                        'Unable to verify document custody schema for evidence reclassification.',
                        $exception->getMessage(),
                        $case,
                    );
                    $failed = true;
                }

                $this->assertTrue($failed, 'Expected fail-closed RuntimeException for '.$case);
                $this->assertSame(CorrespondenceLifecycleState::Registered, $record->fresh()->lifecycle_state, $case);
                $this->assertNull($record->fresh()->classified_at, $case);
                $this->assertSame('internal', $document->fresh()->classification, $case);
                $this->assertSame(
                    0,
                    CorrespondenceEvent::query()
                        ->where('correspondence_record_id', $record->id)
                        ->where('event', 'classified')
                        ->count(),
                    $case,
                );
                $this->assertSame(
                    0,
                    DB::table('outbox_messages')
                        ->where('event_type', 'correspondence.classified')
                        ->where('aggregate_id', $record->public_id)
                        ->count(),
                    $case,
                );
                $this->assertSame(
                    0,
                    DB::table('audit_logs')
                        ->where('action', 'correspondence.classified')
                        ->where('entity_id', $record->id)
                        ->count(),
                    $case,
                );
                $this->assertSame(1, Document::query()->count(), $case);
                $this->assertSame($initialFiles, Storage::disk('documents')->allFiles(), $case);
            } finally {
                DB::rollBack();
            }
        }
    }

    public function test_unauthorized_actor_cannot_classify_or_reclassify_linked_correspondence_evidence(): void
    {
        $origin = $this->department('COMPAT-AUTH-ORIGIN');
        $foreign = $this->department('COMPAT-AUTH-FOREIGN');
        $head = $this->human('department_head', $origin);
        $staff = $this->human('department_staff', $origin);
        $foreignHead = $this->human('department_head', $foreign);
        $record = $this->record('Authorization boundary on reclassification');
        $service = app(CorrespondenceEvidenceService::class);

        $record = $service->register(
            $head,
            $record,
            (string) Str::uuid(),
            [UploadedFile::fake()->createWithContent('auth-guard.pdf', "%PDF-1.7\nauth\n%%EOF")],
        );

        $document = Document::query()->where('original_name', 'auth-guard.pdf')->sole();

        foreach ([$staff, $foreignHead] as $unauthorized) {
            $this->actingAs($unauthorized)
                ->post('/correspondence/'.$record->public_id.'/workspace/classify', [
                    'classification' => 'restricted',
                    'remarks' => 'Unauthorized reclassification attempt.',
                ])
                ->assertForbidden();

            $denied = false;
            try {
                $service->classify(
                    $unauthorized,
                    $record->fresh(),
                    CorrespondenceClassification::Restricted,
                    (string) Str::uuid(),
                    'Direct unauthorized service call.',
                    [],
                );
            } catch (AuthorizationException) {
                $denied = true;
            }

            $this->assertTrue($denied);
            $this->assertSame(CorrespondenceLifecycleState::Registered, $record->fresh()->lifecycle_state);
            $this->assertSame('internal', $document->fresh()->classification);
            $this->assertSame(
                0,
                CorrespondenceEvent::query()
                    ->where('correspondence_record_id', $record->id)
                    ->where('event', 'classified')
                    ->count(),
            );
        }
    }

    private function linkedCorrespondenceDocument(
        User $uploader,
        CorrespondenceRecord|CorrespondenceEvent $linkable,
        string $name,
        ?string $securityDomain,
        bool $withReceipt = false,
        bool $withBinding = false,
    ): Document {
        $bytes = "%PDF-1.7\n".$name."\n%%EOF";
        $path = 'compat-synthetic/'.Str::uuid().'.pdf';
        Storage::disk('documents')->put($path, $bytes);

        $document = Document::query()->create([
            'title' => $name,
            'original_name' => $name,
            'document_type' => 'supporting_document',
            'classification' => 'internal',
            'storage_disk' => 'documents',
            'storage_path' => $path,
            'mime_type' => 'application/pdf',
            'size_bytes' => strlen($bytes),
            'checksum_sha256' => hash('sha256', $bytes),
            'owner_department_id' => $uploader->employee->department_id,
            'uploaded_by_user_id' => $uploader->id,
        ]);

        if ($securityDomain === 'EVER_PLAN') {
            DB::statement('ALTER TABLE documents DISABLE TRIGGER kirion_plan_document_guard_trigger');
            DB::statement('ALTER TABLE documents DISABLE TRIGGER kirion_plan_stamp_origin_trigger');
            try {
                DB::table('documents')->where('id', $document->id)->update(['security_domain' => 'EVER_PLAN']);
            } finally {
                DB::statement('ALTER TABLE documents ENABLE TRIGGER kirion_plan_document_guard_trigger');
                DB::statement('ALTER TABLE documents ENABLE TRIGGER kirion_plan_stamp_origin_trigger');
            }
        } elseif ($securityDomain !== null) {
            DB::table('documents')->where('id', $document->id)->update(['security_domain' => $securityDomain]);
        }

        if ($withReceipt) {
            DB::statement('ALTER TABLE plan_document_origin_receipts DISABLE TRIGGER kirion_plan_receipt_guard_trigger');
            try {
                DB::table('plan_document_origin_receipts')->insert([
                    'document_id' => $document->id,
                    'origin' => 'EVER_PLAN',
                    'sealed_at' => now(),
                ]);
            } finally {
                DB::statement('ALTER TABLE plan_document_origin_receipts ENABLE TRIGGER kirion_plan_receipt_guard_trigger');
            }
        }

        if ($withBinding) {
            $family = PlanFamily::query()->create(['title' => 'Synthetic Compat Family '.Str::random(6)]);
            $edition = $family->editions()->create(['edition_label' => 'Synthetic Compat Edition']);
            DB::statement('ALTER TABLE plan_document_bindings DISABLE TRIGGER kirion_plan_typed_binding_guard_trigger');
            try {
                DB::table('plan_document_bindings')->insert([
                    'plan_edition_id' => $edition->id,
                    'document_id' => $document->id,
                    'role' => 'master',
                    'revision_no' => 1,
                    'binding_state' => 'QUARANTINED',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } finally {
                DB::statement('ALTER TABLE plan_document_bindings ENABLE TRIGGER kirion_plan_typed_binding_guard_trigger');
            }
        }

        DB::statement('ALTER TABLE document_links DISABLE TRIGGER kirion_plan_generic_link_guard_trigger');
        try {
            DocumentLink::query()->create([
                'document_id' => $document->id,
                'linkable_type' => $linkable->getMorphClass(),
                'linkable_id' => $linkable->id,
                'relationship' => 'supporting_document',
                'created_by_user_id' => $uploader->id,
            ]);
        } finally {
            DB::statement('ALTER TABLE document_links ENABLE TRIGGER kirion_plan_generic_link_guard_trigger');
        }

        return $document->fresh();
    }

    private function department(string $suffix): Department
    {
        return Department::query()->create([
            'code' => 'EVID-'.Str::upper(Str::random(5)).'-'.$suffix,
            'name' => 'Evidence '.$suffix,
            'short_name' => 'EV-'.$suffix,
            'branch' => 'executive',
            'office_type' => 'department',
            'sort_order' => 10,
            'is_routable' => true,
            'is_active' => true,
        ]);
    }

    private function human(string $role, Department $department): User
    {
        $user = User::query()->create([
            'name' => 'Evidence '.$role.' '.Str::random(5),
            'email' => Str::lower(Str::random(10)).'@example.test',
            'password' => 'password',
            'role' => $role,
            'is_active' => true,
        ]);

        Employee::query()->create([
            'employee_number' => 'EVID-EMP-'.Str::upper(Str::random(10)),
            'full_name' => $user->name,
            'work_email' => $user->email,
            'user_id' => $user->id,
            'department_id' => $department->id,
            'position_title' => 'Evidence Test Officer',
            'employment_status' => 'active',
        ]);

        return $user->fresh('employee.department');
    }

    private function record(string $subject): CorrespondenceRecord
    {
        return CorrespondenceRecord::query()->create([
            'public_id' => (string) Str::uuid(),
            'external_reference_no' => 'EXT-'.Str::upper(Str::random(16)),
            'source' => 'email',
            'channel' => 'official_email',
            'sender_name' => 'Evidence Sender',
            'sender_organization' => 'Evidence Office',
            'subject' => $subject,
            'summary' => 'Incoming correspondence used for protected evidence tests.',
            'received_at' => now()->subHour(),
            'lifecycle_state' => CorrespondenceLifecycleState::Received->value,
        ]);
    }
}
