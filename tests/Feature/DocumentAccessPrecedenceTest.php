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
use App\Models\TravelOrderEvent;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\CorrespondenceAccessDecider;
use App\Services\DocumentAccessService;
use App\Services\DocumentArchiveQuery;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class DocumentAccessPrecedenceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['documents.disk' => 'documents']);
        Storage::fake('documents');
    }

    public function test_restricted_correspondence_parent_dominates_allowed_transaction_at_positions_1_16_17_32(): void
    {
        $visibleOffice = $this->department('VISIBLE');
        $hiddenOffice = $this->department('HIDDEN');
        $actor = $this->human($visibleOffice);
        $transaction = $this->transaction($actor, $visibleOffice);
        $restricted = $this->restrictedCorrespondence($hiddenOffice);

        $this->assertTrue($actor->can('view', $transaction));
        $this->assertFalse(app(CorrespondenceAccessDecider::class)->canViewInWorkspace($actor, $restricted));

        foreach ([1, 16, 17, 32] as $position) {
            $document = $this->document($actor, $visibleOffice, 'Protected position '.$position);

            for ($index = 1; $index <= $position; $index++) {
                $source = $index === $position ? $restricted : $transaction;
                DocumentLink::query()->create([
                    'document_id' => $document->id,
                    'linkable_type' => $source->getMorphClass(),
                    'linkable_id' => $source->getKey(),
                    'relationship' => 'precedence_position_'.$index,
                    'created_by_user_id' => $actor->id,
                ]);
            }

            $this->assertSame($position, $document->links()->count());
            $this->assertFalse(
                app(DocumentAccessService::class)->canDownload($actor, $document),
                'Later restricted correspondence must not be skipped at link '.$position,
            );

            $archive = app(DocumentArchiveQuery::class)->workspace($actor, [
                'document' => $document->public_id,
                'archive_search' => 'Protected position '.$position,
            ]);
            $this->assertNull($archive['selected']);
            $this->assertSame(0, $archive['records']->total());

            $this->actingAs($actor)
                ->get('/documents/'.$document->public_id.'/download')
                ->assertForbidden();
        }
    }

    public function test_authorized_transaction_only_evidence_remains_visible_for_1_16_17_32_links(): void
    {
        $office = $this->department('ALLOWED');
        $actor = $this->human($office);
        $transaction = $this->transaction($actor, $office);

        foreach ([1, 16, 17, 32] as $count) {
            $document = $this->document($actor, $office, 'Authorized links '.$count);
            for ($index = 1; $index <= $count; $index++) {
                DocumentLink::query()->create([
                    'document_id' => $document->id,
                    'linkable_type' => $transaction->getMorphClass(),
                    'linkable_id' => $transaction->id,
                    'relationship' => 'allowed_link_'.$index,
                ]);
            }

            $this->assertTrue(app(DocumentAccessService::class)->canDownload($actor, $document));
            $this->actingAs($actor)
                ->get('/documents/'.$document->public_id.'/download')
                ->assertOk();
        }

        $archive = app(DocumentArchiveQuery::class)->workspace($actor, []);
        $this->assertSame(4, $archive['records']->total());
    }

    public function test_restricted_link_first_still_dominates_later_allowed_transaction_links(): void
    {
        $office = $this->department('EARLY');
        $other = $this->department('EARLY-HIDDEN');
        $actor = $this->human($office);
        $restricted = $this->restrictedCorrespondence($other);
        $transaction = $this->transaction($actor, $office);
        $document = $this->document($actor, $office, 'Early restricted');

        DocumentLink::query()->create([
            'document_id' => $document->id,
            'linkable_type' => $restricted->getMorphClass(),
            'linkable_id' => $restricted->id,
            'relationship' => 'restricted_parent',
        ]);

        for ($index = 1; $index <= 31; $index++) {
            DocumentLink::query()->create([
                'document_id' => $document->id,
                'linkable_type' => $transaction->getMorphClass(),
                'linkable_id' => $transaction->id,
                'relationship' => 'allowed_source_'.$index,
            ]);
        }

        $this->assertFalse(app(DocumentAccessService::class)->canDownload($actor, $document));
        $this->actingAs($actor)
            ->get('/documents/'.$document->public_id.'/download')
            ->assertForbidden();
    }

    public function test_correspondence_access_revocation_and_missing_file_are_enforced_at_download(): void
    {
        $office = $this->department('REVOCATION');
        $actor = $this->human($office);
        $record = $this->restrictedCorrespondence($office);
        $document = $this->document($actor, $office, 'Revocable evidence');

        DocumentLink::query()->create([
            'document_id' => $document->id,
            'linkable_type' => $record->getMorphClass(),
            'linkable_id' => $record->id,
            'relationship' => 'supporting_document',
        ]);

        $this->actingAs($actor)
            ->get('/documents/'.$document->public_id.'/download')
            ->assertOk();

        Storage::disk('documents')->delete($document->storage_path);
        $this->actingAs($actor)
            ->get('/documents/'.$document->public_id.'/download')
            ->assertNotFound();

        Storage::disk('documents')->put($document->storage_path, '%PDF-1.7 test');
        $actor->employee->update(['employment_status' => 'inactive']);
        // Deliberately keep the original actor with cached active relations.
        $this->assertFalse(app(DocumentAccessService::class)->canDownload($actor, $document));
        $response = $this->actingAs($actor)
            ->get('/documents/'.$document->public_id.'/download')
            ->assertRedirect(route('login'))
            ->assertSessionHasErrors([
                'email' => 'This session is no longer active. Please sign in again or contact an administrator.',
            ]);
        $response->assertHeaderMissing('Content-Disposition');
        $response->assertDontSee('%PDF-1.7 test', false);
    }

    public function test_orphaned_higher_priority_event_link_does_not_downgrade_to_transaction(): void
    {
        $office = $this->department('ORPHAN');
        $actor = $this->human($office);
        $transaction = $this->transaction($actor, $office);
        $document = $this->document($actor, $office, 'Orphan event');

        DocumentLink::query()->create([
            'document_id' => $document->id,
            'linkable_type' => $transaction->getMorphClass(),
            'linkable_id' => $transaction->id,
            'relationship' => 'supporting_document',
        ]);

        DocumentLink::query()->create([
            'document_id' => $document->id,
            'linkable_type' => (new CorrespondenceEvent)->getMorphClass(),
            'linkable_id' => 999999999,
            'relationship' => 'missing_high_priority_event',
        ]);

        $this->assertFalse(app(DocumentAccessService::class)->canDownload($actor, $document));
        $archive = app(DocumentArchiveQuery::class)->workspace($actor, ['document' => $document->public_id]);
        $this->assertNull($archive['selected']);
        $this->assertSame(0, $archive['records']->total());
    }

    public function test_mixed_correspondence_parents_deny_shared_document_in_both_link_orders(): void
    {
        foreach (['restricted_first', 'visible_first'] as $order) {
            $office = $this->department('CONTEXT-'.$order);
            $other = $this->department('HIDDEN-'.$order);
            $actor = $this->human($office);
            $this->actingAs($actor);
            $denied = $this->restrictedCorrespondence($other);
            $allowed = $this->restrictedCorrespondence($office);
            $allowed->update(['subject' => 'Authorized correspondence context']);
            $document = $this->document($actor, $office, 'Mixed correspondence '.$order);

            $parents = $order === 'restricted_first'
                ? [$denied, $allowed] : [$allowed, $denied];
            foreach ($parents as $index => $record) {
                DocumentLink::query()->create([
                    'document_id' => $document->id,
                    'linkable_type' => $record->getMorphClass(),
                    'linkable_id' => $record->id,
                    'relationship' => 'correspondence_'.($index + 1),
                ]);
            }

            $this->assertFalse(app(DocumentAccessService::class)->canDownload($actor, $document));
            $archive = app(DocumentArchiveQuery::class)->workspace($actor, [
                'document' => $document->public_id,
            ]);
            $this->assertSame(0, $archive['records']->total());
            $this->assertSame(0, $archive['counts']['all']);
            $this->assertNull($archive['selected']);
            $this->actingAs($actor)
                ->get('/documents/'.$document->public_id.'/download')->assertForbidden();
        }
    }

    public function test_multiple_authorized_correspondence_parents_retain_document_access(): void
    {
        $office = $this->department('MULTI-PARENT-ALLOWED');
        $actor = $this->human($office);
        $first = $this->restrictedCorrespondence($office);
        $second = $this->restrictedCorrespondence($office);
        $second->update(['subject' => 'Second allowed correspondence']);
        $document = $this->document($actor, $office, 'Both sources authorized');

        foreach ([$first, $second] as $index => $record) {
            DocumentLink::query()->create([
                'document_id' => $document->id,
                'linkable_type' => $record->getMorphClass(),
                'linkable_id' => $record->id,
                'relationship' => 'correspondence_'.($index + 1),
            ]);
        }

        $this->assertTrue(app(DocumentAccessService::class)->canDownload($actor, $document));
        $archive = app(DocumentArchiveQuery::class)->workspace($actor, [
            'document' => $document->public_id,
        ]);
        $this->assertSame(1, $archive['records']->total());
        $this->assertSame(1, $archive['counts']['all']);
        $this->assertSame($document->public_id, $archive['selected']['publicId']);
        $this->actingAs($actor)
            ->get('/documents/'.$document->public_id.'/download')->assertOk();
    }

    public function test_unknown_parent_conceals_document_in_both_link_orders_and_known_parent_remains_accessible(): void
    {
        $office = $this->department('UNKNOWN-PARENT');
        $actor = $this->human($office);
        $transaction = $this->transaction($actor, $office);
        $this->actingAs($actor);

        foreach (['unknown_first', 'unknown_last'] as $order) {
            $document = $this->document($actor, $office, 'Unknown parent '.$order);
            $links = [
                ['type' => 'Unknown\\RestrictedSource', 'id' => 123456789],
                ['type' => $transaction->getMorphClass(), 'id' => $transaction->id],
            ];
            if ($order === 'unknown_last') {
                $links = array_reverse($links);
            }
            foreach ($links as $index => $link) {
                DocumentLink::query()->create([
                    'document_id' => $document->id,
                    'linkable_type' => $link['type'],
                    'linkable_id' => $link['id'],
                    'relationship' => 'source_'.($index + 1),
                ]);
            }

            $this->assertFalse(app(DocumentAccessService::class)->canDownload($actor, $document));
            $archive = app(DocumentArchiveQuery::class)->workspace($actor, [
                'document' => $document->public_id,
                'archive_search' => $document->title,
            ]);
            $this->assertSame(0, $archive['records']->total());
            $this->assertSame(0, $archive['counts']['all']);
            $this->assertNull($archive['selected']);
            $this->actingAs($actor)->get('/documents/'.$document->public_id.'/download')
                ->assertForbidden();
        }

        $known = $this->document($actor, $office, 'Known parent remains visible');
        DocumentLink::query()->create([
            'document_id' => $known->id,
            'linkable_type' => $transaction->getMorphClass(),
            'linkable_id' => $transaction->id,
            'relationship' => 'supporting_document',
        ]);

        $this->assertTrue(app(DocumentAccessService::class)->canDownload($actor, $known));
        $archive = app(DocumentArchiveQuery::class)->workspace($actor, [
            'document' => $known->public_id,
            'archive_search' => $known->title,
        ]);
        $this->assertSame(1, $archive['records']->total());
        $this->assertSame(1, $archive['counts']['all']);
        $this->assertSame($known->public_id, $archive['selected']['publicId']);
        $this->actingAs($actor)->get('/documents/'.$known->public_id.'/download')->assertOk();
    }

    public function test_sql_archive_zero_one_and_one_thousand_documents_keep_stable_pages_and_counts(): void
    {
        $office = $this->department('SQL-BULK');
        $actor = $this->human($office);
        $transaction = $this->transaction($actor, $office);
        $archive = app(DocumentArchiveQuery::class);

        $empty = $archive->workspace($actor, []);
        $this->assertSame(0, $empty['records']->total());
        $this->assertSame(0, $empty['counts']['all']);
        $this->assertSame([], $empty['filterOptions']['documentTypes']);

        $one = $this->document($actor, $office, 'P3 single reference');
        DocumentLink::query()->create([
            'document_id' => $one->id,
            'linkable_type' => $transaction->getMorphClass(),
            'linkable_id' => $transaction->id,
            'relationship' => 'supporting_document',
        ]);
        $single = $archive->workspace($actor, ['document' => $one->public_id]);
        $this->assertSame(1, $single['records']->total());
        $this->assertSame($one->public_id, $single['selected']['publicId']);
        $this->assertContains('Supporting Document', $single['filterOptions']['documentTypes']);

        $now = now();
        for ($batch = 0; $batch < 10; $batch++) {
            $documents = [];
            for ($row = 0; $row < 100; $row++) {
                $documents[] = [
                    'public_id' => (string) Str::uuid(),
                    'title' => 'P3 Bulk Archive',
                    'original_name' => 'P3 Bulk Archive.pdf',
                    'document_type' => 'supporting_document',
                    'classification' => 'restricted',
                    'storage_disk' => 'documents',
                    'storage_path' => 'p3-tests/bulk-synthetic.pdf',
                    'owner_department_id' => $office->id,
                    'uploaded_by_user_id' => $actor->id,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            DB::table('documents')->insert($documents);
        }

        $documentIds = Document::query()
            ->where('title', 'P3 Bulk Archive')->pluck('id');
        $this->assertCount(1000, $documentIds);
        foreach ($documentIds->chunk(200) as $chunk) {
            $links = [];
            foreach ($chunk as $documentId) {
                $links[] = [
                    'document_id' => $documentId,
                    'linkable_type' => $transaction->getMorphClass(),
                    'linkable_id' => $transaction->id,
                    'relationship' => 'supporting_document',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            DB::table('document_links')->insert($links);
        }

        DB::flushQueryLog();
        DB::enableQueryLog();
        $before = memory_get_peak_usage(true);

        try {
            $first = $archive->workspace($actor, ['page' => 1]);
            $second = $archive->workspace($actor, ['page' => 2]);
            $searched = $archive->workspace($actor, ['archive_search' => 'P3 Bulk Archive']);
            $queryCount = count(DB::getQueryLog());
            $peakGrowth = max(0, memory_get_peak_usage(true) - $before);
        } finally {
            DB::disableQueryLog();
            DB::flushQueryLog();
        }

        $this->assertSame(1001, $first['records']->total());
        $this->assertSame(1001, $first['counts']['all']);
        $this->assertSame(1000, $searched['records']->total());
        $this->assertCount(20, $first['records']->items());
        $this->assertCount(20, $second['records']->items());
        $this->assertEmpty(array_intersect(
            array_column($first['records']->items(), 'publicId'),
            array_column($second['records']->items(), 'publicId'),
        ));
        $this->assertLessThanOrEqual(36, $queryCount);
        $this->assertLessThan(128 * 1024 * 1024, $peakGrowth);
    }

    public function test_sql_archive_conceals_denied_same_family_source_title_reference_and_url(): void
    {
        $office = $this->department('VISIBLE-META');
        $other = $this->department('HIDDEN-META');
        $actor = $this->human($office);
        $denied = $this->restrictedCorrespondence($other);
        $allowed = $this->restrictedCorrespondence($office);
        $allowed->update(['subject' => 'Authorized SQL archive source']);
        $document = $this->document($actor, $office, 'Source metadata mask');

        foreach ([$denied, $allowed] as $record) {
            DocumentLink::query()->create([
                'document_id' => $document->id,
                'linkable_type' => $record->getMorphClass(),
                'linkable_id' => $record->id,
                'relationship' => 'supporting_document',
            ]);
        }

        $archive = app(DocumentArchiveQuery::class)->workspace($actor, [
            'document' => $document->public_id,
        ]);
        $this->assertNull($archive['selected']);
        $this->assertSame(0, $archive['records']->total());
        $this->assertSame(0, $archive['counts']['all']);
        $serialized = json_encode($archive);
        $this->assertStringNotContainsString($allowed->subject, $serialized);
        $this->assertStringNotContainsString($allowed->municipal_reference_no, $serialized);
        $this->assertStringNotContainsString($allowed->public_id, $serialized);
        $this->assertStringNotContainsString($denied->subject, $serialized);
        $this->assertStringNotContainsString($denied->municipal_reference_no, $serialized);
        $this->assertStringNotContainsString($denied->public_id, $serialized);
        $this->assertSame(0, app(DocumentArchiveQuery::class)->workspace($actor, [
            'archive_search' => $denied->subject,
        ])['records']->total());
    }

    public function test_deleted_correspondence_parent_and_orphaned_travel_event_remain_authoritative(): void
    {
        $office = $this->department('ORPHAN-SQL');
        $actor = $this->human($office);
        $transaction = $this->transaction($actor, $office);
        foreach ([CorrespondenceRecord::class, TravelOrderEvent::class] as $class) {
            $document = $this->document($actor, $office, 'Higher priority missing '.$class);
            DocumentLink::query()->create([
                'document_id' => $document->id,
                'linkable_type' => $transaction->getMorphClass(),
                'linkable_id' => $transaction->id,
                'relationship' => 'transaction',
            ]);
            DocumentLink::query()->create([
                'document_id' => $document->id,
                'linkable_type' => (new $class)->getMorphClass(),
                'linkable_id' => 2147483600,
                'relationship' => 'deleted_parent',
            ]);
            $this->assertFalse(app(DocumentAccessService::class)->canDownload($actor, $document));
            $this->assertNull(app(DocumentArchiveQuery::class)->workspace($actor, [
                'document' => $document->public_id,
            ])['selected']);
        }
    }

    public function test_thousand_transaction_links_cannot_amplify_download_queries_or_hide_restricted_parent(): void
    {
        $office = $this->department('BUDGET');
        $hidden = $this->department('BUDGET-SECRET');
        $actor = $this->human($office);
        $transaction = $this->transaction($actor, $office);
        $denied = $this->restrictedCorrespondence($hidden);
        $document = $this->document($actor, $office, 'Many-link access budget');

        $links = [];
        for ($i = 0; $i < 1000; $i++) {
            $links[] = [
                'document_id' => $document->id,
                'linkable_type' => $transaction->getMorphClass(),
                'linkable_id' => $transaction->id,
                'relationship' => 'evidence_'.sprintf('%04d', $i),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        foreach (array_chunk($links, 200) as $batch) {
            DB::table('document_links')->insert($batch);
        }
        $this->assertSame(1000, $document->links()->count());

        DB::enableQueryLog();
        DB::flushQueryLog();

        try {
            $allowed = app(DocumentAccessService::class)->canDownload($actor, $document);
            $allowQueries = count(DB::getQueryLog());
        } finally {
            DB::disableQueryLog();
            DB::flushQueryLog();
        }
        $this->assertTrue($allowed);
        $this->assertLessThanOrEqual(10, $allowQueries);

        DocumentLink::query()->create([
            'document_id' => $document->id,
            'linkable_type' => $denied->getMorphClass(),
            'linkable_id' => $denied->id,
            'relationship' => 'restricted_authoritative_parent',
        ]);
        $this->assertSame(1001, $document->links()->count());

        DB::enableQueryLog();
        DB::flushQueryLog();

        try {
            $deniedDownload = app(DocumentAccessService::class)->canDownload($actor, $document);
            $downloadQueries = count(DB::getQueryLog());
            DB::flushQueryLog();
            $archive = app(DocumentArchiveQuery::class)->workspace($actor, [
                'document' => $document->public_id,
            ]);
            $archiveQueries = count(DB::getQueryLog());
        } finally {
            DB::disableQueryLog();
            DB::flushQueryLog();
        }

        $this->assertFalse($deniedDownload);
        $this->assertNull($archive['selected']);
        $this->assertSame(0, $archive['records']->total());
        $this->assertLessThanOrEqual(10, $downloadQueries);
        $this->assertLessThanOrEqual(14, $archiveQueries);
    }

    public function test_received_registration_role_does_not_expose_foreign_restricted_evidence(): void
    {
        $actorOffice = $this->department('REGISTRAR');
        $otherOffice = $this->department('RECEIVED-FOREIGN');
        $actor = $this->human($actorOffice);
        $received = $this->restrictedCorrespondence($otherOffice);
        $received->update(['lifecycle_state' => CorrespondenceLifecycleState::Received->value]);
        $document = $this->document($actor, $actorOffice, 'Received registrar intake');
        DocumentLink::query()->create([
            'document_id' => $document->id,
            'linkable_type' => $received->getMorphClass(),
            'linkable_id' => $received->id,
            'relationship' => 'intake_evidence',
        ]);

        $access = app(CorrespondenceAccessDecider::class);
        $this->assertFalse($access->canRegister($actor, $received));
        $this->assertFalse($access->canViewInWorkspace($actor, $received));
        $this->assertSame(0, $access->scopeVisibleTo(CorrespondenceRecord::query(), $actor)
            ->whereKey($received->id)->count());
        $this->assertFalse(app(DocumentAccessService::class)->canDownload($actor, $document));
        $result = app(DocumentArchiveQuery::class)->workspace($actor, [
            'document' => $document->public_id,
        ]);
        $this->assertSame(0, $result['records']->total());
        $this->assertNull($result['selected']);
    }

    public function test_received_unassigned_intake_remains_visible_without_foreign_office_grant(): void
    {
        $actorOffice = $this->department('INTAKE');
        $actor = $this->human($actorOffice);
        $record = $this->restrictedCorrespondence($actorOffice);
        $record->update([
            'lifecycle_state' => CorrespondenceLifecycleState::Received->value,
            'classification' => null,
            'receiving_department_id' => null,
            'municipal_reference_no' => null,
        ]);
        $record = $record->fresh();

        $access = app(CorrespondenceAccessDecider::class);
        $this->assertTrue($access->canRegister($actor, $record));
        $this->assertTrue($access->canViewInWorkspace($actor, $record));
        $this->assertSame(1, $access->scopeVisibleTo(CorrespondenceRecord::query(), $actor)
            ->whereKey($record->id)->count());
    }

    public function test_linked_workflow_uses_current_office_or_assignment_not_origin_office(): void
    {
        $office = $this->department('ORIGIN');
        $routedOffice = $this->department('ROUTED');
        $actor = $this->human($office);
        $otherEmployee = $this->human($office);
        $transaction = $this->transaction($actor, $office);
        $transaction->update([
            'current_department_id' => $routedOffice->id,
            'assigned_employee_id' => null,
        ]);
        $record = $this->restrictedCorrespondence($office);
        $record->update(['workflow_transaction_id' => $transaction->id]);
        $record = $record->fresh('workflowTransaction');

        $access = app(CorrespondenceAccessDecider::class);
        $this->assertFalse($access->canViewInWorkspace($actor, $record));
        $this->assertSame(0, $access->scopeVisibleTo(CorrespondenceRecord::query(), $actor)
            ->whereKey($record->id)->count());

        $transaction->update(['assigned_employee_id' => $actor->employee->id]);
        $record = $record->fresh('workflowTransaction');
        $this->assertTrue($access->canViewInWorkspace($actor, $record));
        $this->assertSame(1, $access->scopeVisibleTo(CorrespondenceRecord::query(), $actor)
            ->whereKey($record->id)->count());

        $this->assertFalse($access->canViewInWorkspace($otherEmployee, $record));
        $this->assertSame(0, $access->scopeVisibleTo(CorrespondenceRecord::query(), $otherEmployee)
            ->whereKey($record->id)->count());

        $transaction->update(['assigned_employee_id' => null]);
        $record = $record->fresh('workflowTransaction');
        $this->assertFalse($access->canViewInWorkspace($actor, $record));
        $this->assertSame(0, $access->scopeVisibleTo(CorrespondenceRecord::query(), $actor)
            ->whereKey($record->id)->count());

        $transaction->update(['current_department_id' => $office->id]);
        $record = $record->fresh('workflowTransaction');
        $this->assertTrue($access->canViewInWorkspace($actor, $record));
        $this->assertSame(1, $access->scopeVisibleTo(CorrespondenceRecord::query(), $actor)
            ->whereKey($record->id)->count());
    }

    public function test_retained_workflow_relation_rechecks_revoked_and_new_current_office(): void
    {
        $formerOffice = $this->department('SEC03-FORMER');
        $currentOffice = $this->department('SEC03-CURRENT');
        $formerActor = $this->human($formerOffice);
        $currentActor = $this->human($currentOffice);
        $workflow = $this->transaction($formerActor, $formerOffice);
        $record = $this->restrictedCorrespondence($formerOffice);
        $record->update([
            'workflow_transaction_id' => $workflow->id,
            'lifecycle_state' => CorrespondenceLifecycleState::Routed->value,
        ]);

        // The same correspondence instance is retained across the authoritative
        // reassignment; do not fresh() or reload its preloaded relationship.
        $record->load('workflowTransaction');
        $access = app(CorrespondenceAccessDecider::class);
        $this->assertTrue($access->canView($formerActor, $record));
        $this->assertFalse($access->canView($currentActor, $record));

        DB::table('transactions')->where('id', $workflow->id)->update([
            'current_department_id' => $currentOffice->id,
            'assigned_employee_id' => null,
        ]);

        $this->assertSame($formerOffice->id, (int) $record->workflowTransaction->current_department_id);
        $this->assertSame(0, $access->scopeVisibleTo(CorrespondenceRecord::query(), $formerActor)
            ->whereKey($record->id)->count());
        $this->assertSame(1, $access->scopeVisibleTo(CorrespondenceRecord::query(), $currentActor)
            ->whereKey($record->id)->count());

        $this->assertFalse($access->canView($formerActor, $record));
        $this->assertFalse($access->canViewInWorkspace($formerActor, $record));
        $this->assertFalse($access->canAct($formerActor, $record));
        $this->assertTrue($access->canView($currentActor, $record));
        $this->assertTrue($access->canViewInWorkspace($currentActor, $record));
        $this->assertTrue($access->canAct($currentActor, $record));
    }

    public function test_retained_workflow_relation_rechecks_explicit_employee_reassignment(): void
    {
        $originOffice = $this->department('SEC03-ASSIGN-ORIGIN');
        $routingOffice = $this->department('SEC03-ASSIGN-ROUTED');
        $formerAssignee = $this->human($originOffice);
        $newAssignee = $this->human($originOffice);
        $workflow = $this->transaction($formerAssignee, $originOffice);
        $workflow->update([
            'current_department_id' => $routingOffice->id,
            'assigned_employee_id' => $formerAssignee->employee->id,
        ]);
        $record = $this->restrictedCorrespondence($originOffice);
        $record->update(['workflow_transaction_id' => $workflow->id]);
        $record->load('workflowTransaction');

        $access = app(CorrespondenceAccessDecider::class);
        $this->assertTrue($access->canView($formerAssignee, $record));
        $this->assertFalse($access->canView($newAssignee, $record));

        // Direct SQL update models another authoritative workflow operation.
        DB::table('transactions')->where('id', $workflow->id)->update([
            'assigned_employee_id' => $newAssignee->employee->id,
        ]);

        $this->assertSame(
            $formerAssignee->employee->id,
            (int) $record->workflowTransaction->assigned_employee_id,
        );
        $this->assertSame(0, $access->scopeVisibleTo(CorrespondenceRecord::query(), $formerAssignee)
            ->whereKey($record->id)->count());
        $this->assertSame(1, $access->scopeVisibleTo(CorrespondenceRecord::query(), $newAssignee)
            ->whereKey($record->id)->count());
        $this->assertFalse($access->canView($formerAssignee, $record));
        $this->assertTrue($access->canView($newAssignee, $record));
    }

    public function test_archive_and_download_recheck_identity_between_distinct_operations(): void
    {
        $office = $this->department('OPERATION-REVOCATION');
        $actor = $this->human($office);
        $transaction = $this->transaction($actor, $office);
        $document = $this->document($actor, $office, 'Independent operation revocation');

        DocumentLink::query()->create([
            'document_id' => $document->id,
            'linkable_type' => $transaction->getMorphClass(),
            'linkable_id' => $transaction->id,
            'relationship' => 'transaction_evidence',
        ]);

        $archive = app(DocumentArchiveQuery::class);
        $download = app(DocumentAccessService::class);
        $this->assertSame(1, $archive->workspace($actor, [])['records']->total());
        $this->assertTrue($download->canDownload($actor, $document));

        $actor->employee()->update(['employment_status' => 'separated']);
        $this->assertFalse($download->canDownload($actor, $document));

        $this->expectException(AuthorizationException::class);
        $archive->workspace($actor, []);
    }

    public function test_stale_previous_office_cannot_expose_archive_or_download_after_transfer(): void
    {
        $first = $this->department('PRE-TRANSFER');
        $second = $this->department('POST-TRANSFER');
        $actor = $this->human($first);
        $transaction = $this->transaction($actor, $first);
        $document = $this->document($actor, $first, 'Old office evidence');

        DocumentLink::query()->create([
            'document_id' => $document->id,
            'linkable_type' => $transaction->getMorphClass(),
            'linkable_id' => $transaction->id,
            'relationship' => 'transaction_evidence',
        ]);

        $archive = app(DocumentArchiveQuery::class);
        $download = app(DocumentAccessService::class);
        $this->assertSame(1, $archive->workspace($actor, [])['records']->total());
        $this->assertTrue($download->canDownload($actor, $document));

        // The original User model intentionally retains a stale loaded office.
        $actor->employee()->update(['department_id' => $second->id]);

        $this->assertSame(0, $archive->workspace($actor, [])['records']->total());
        $this->assertFalse($download->canDownload($actor, $document));
    }

    public function test_protected_source_rejects_a_different_authenticated_principal(): void
    {
        $office = $this->department('SESSION-SCOPE');
        $actor = $this->human($office);
        $other = $this->human($office);
        $transaction = $this->transaction($actor, $office);
        $document = $this->document($actor, $office, 'Session scoped evidence');

        DocumentLink::query()->create([
            'document_id' => $document->id,
            'linkable_type' => $transaction->getMorphClass(),
            'linkable_id' => $transaction->id,
            'relationship' => 'transaction_evidence',
        ]);

        $this->actingAs($other);
        $this->assertFalse(app(DocumentAccessService::class)->canDownload($actor, $document));

        $this->expectException(AuthorizationException::class);
        app(DocumentArchiveQuery::class)->workspace($actor, []);
    }

    public function test_restricted_received_foreign_correspondence_never_leaks_archive_fields_or_download(): void
    {
        $actorOffice = $this->department('REVIEW-ACTOR');
        $foreignOffice = $this->department('REVIEW-HIDDEN');
        $actor = $this->human($actorOffice);
        $foreign = $this->restrictedCorrespondence($foreignOffice);
        $foreign->update([
            'lifecycle_state' => CorrespondenceLifecycleState::Received->value,
            'subject' => 'REVIEW-CONFIDENTIAL-SENTINEL',
        ]);
        $document = $this->document($actor, $actorOffice, 'P3 confidential archive review');
        DocumentLink::query()->create([
            'document_id' => $document->id,
            'linkable_type' => $foreign->getMorphClass(),
            'linkable_id' => $foreign->id,
            'relationship' => 'restricted_attachment',
        ]);

        $service = app(DocumentArchiveQuery::class);
        $all = $service->workspace($actor, ['document' => $document->public_id]);
        $this->assertSame(0, $all['records']->total());
        $this->assertNull($all['selected']);
        $this->assertSame(0, $all['counts']['all']);
        $this->assertStringNotContainsString($foreign->subject, json_encode($all));
        $this->assertStringNotContainsString($foreign->municipal_reference_no, json_encode($all));

        $search = $service->workspace($actor, ['archive_search' => $foreign->subject]);
        $this->assertSame(0, $search['records']->total());
        $this->assertFalse(app(DocumentAccessService::class)->canDownload($actor, $document));
        $this->actingAs($actor)->get('/documents/'.$document->public_id.'/download')->assertForbidden();
    }

    public function test_restricted_file_under_visible_work_request_requires_independent_document_clearance(): void
    {
        $office = $this->department('DOC-CLEARANCE');
        $head = $this->human($office);
        $staff = $this->human($office);
        $staff->update(['role' => 'department_staff']);
        $staff = $staff->fresh('employee.department');
        $transaction = $this->transaction($head, $office);
        $marker = 'RESTRICTED-ATTACHMENT-'.Str::upper(Str::random(10));
        $document = $this->document($head, $office, $marker);

        DocumentLink::query()->create([
            'document_id' => $document->id,
            'linkable_type' => $transaction->getMorphClass(),
            'linkable_id' => $transaction->id,
            'relationship' => 'transaction_evidence',
        ]);

        $this->actingAs($staff);
        $this->assertTrue($staff->can('view', $transaction));
        $this->assertFalse(app(DocumentAccessService::class)->canDownload($staff, $document));
        $hidden = app(DocumentArchiveQuery::class)->workspace($staff, ['document' => $document->public_id]);
        $this->assertSame(0, $hidden['records']->total());
        $this->assertSame(0, $hidden['counts']['all']);
        $this->assertNull($hidden['selected']);
        $this->assertStringNotContainsString($marker, json_encode($hidden));
        $this->get('/transactions/'.$transaction->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('evidence.record', []));
        $this->get('/documents/'.$document->public_id.'/download')->assertForbidden();

        $this->actingAs($head);
        $this->assertTrue(app(DocumentAccessService::class)->canDownload($head, $document));
        $this->assertSame(1, app(DocumentArchiveQuery::class)->workspace($head, [])['records']->total());
        $this->get('/transactions/'.$transaction->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('evidence.record.0.publicId', $document->public_id));
        $this->get('/documents/'.$document->public_id.'/download')->assertOk();
    }

    public function test_unknown_document_classification_fails_closed_on_download_metadata_and_archive(): void
    {
        $office = $this->department('UNKNOWN-CLEARANCE');
        $head = $this->human($office);
        $transaction = $this->transaction($head, $office);
        $document = $this->document($head, $office, 'Invalid classification evidence');

        DocumentLink::query()->create([
            'document_id' => $document->id,
            'linkable_type' => $transaction->getMorphClass(),
            'linkable_id' => $transaction->id,
            'relationship' => 'supporting_document',
        ]);

        $this->actingAs($head);
        $this->assertTrue(app(DocumentAccessService::class)->canDownload($head, $document));

        // Simulate a malformed legacy classification without altering the
        // application schema or production records.
        $document->update(['classification' => 'unrecognized_level']);

        $this->assertFalse(app(DocumentAccessService::class)
            ->canDownload($head, $document->fresh()));
        $archive = app(DocumentArchiveQuery::class)->workspace($head, [
            'document' => $document->public_id,
        ]);
        $this->assertSame(0, $archive['records']->total());
        $this->assertSame(0, $archive['counts']['all']);
        $this->assertNull($archive['selected']);
        $this->get('/documents/'.$document->public_id.'/download')->assertForbidden();
        $this->get('/transactions/'.$transaction->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('evidence.record', []));
    }

    private function department(string $name): Department
    {
        return Department::query()->create([
            'code' => 'P3-'.Str::upper(Str::random(7)),
            'name' => 'P3 '.$name,
            'short_name' => $name,
            'branch' => 'executive',
            'office_type' => 'department',
            'is_active' => true,
            'is_routable' => true,
            'sort_order' => 10,
        ]);
    }

    private function human(Department $office): User
    {
        $user = User::query()->create([
            'name' => 'P3 Reviewer '.Str::random(6),
            'email' => Str::lower(Str::random(12)).'@example.test',
            'password' => 'password',
            'role' => 'department_head',
            'is_active' => true,
        ]);
        Employee::query()->create([
            'employee_number' => 'P3-EMP-'.Str::upper(Str::random(10)),
            'full_name' => $user->name,
            'work_email' => $user->email,
            'user_id' => $user->id,
            'department_id' => $office->id,
            'position_title' => 'Records Reviewer',
            'employment_status' => 'active',
        ]);

        return $user->fresh('employee.department');
    }

    private function transaction(User $actor, Department $office): WorkflowTransaction
    {
        return WorkflowTransaction::query()->create([
            'reference_no' => 'P3-TX-'.Str::upper(Str::random(10)),
            'transaction_type' => 'internal_request',
            'title' => 'Authorized evidence source',
            'priority' => 'normal',
            'origin_department_id' => $office->id,
            'current_department_id' => $office->id,
            'created_by_user_id' => $actor->id,
            'status' => 'submitted',
        ]);
    }

    private function restrictedCorrespondence(Department $office): CorrespondenceRecord
    {
        return CorrespondenceRecord::query()->create([
            'public_id' => (string) Str::uuid(),
            'external_reference_no' => 'P3-EXT-'.Str::upper(Str::random(12)),
            'source' => 'email',
            'channel' => 'official_email',
            'sender_name' => 'P3 Test Sender',
            'sender_organization' => 'P3 Test Office',
            'subject' => 'Restricted source — never disclose',
            'received_at' => now(),
            'receiving_department_id' => $office->id,
            'municipal_reference_no' => 'P3-COR-'.Str::upper(Str::random(10)),
            'classification' => CorrespondenceClassification::Restricted->value,
            'lifecycle_state' => CorrespondenceLifecycleState::Classified->value,
        ]);
    }

    private function document(User $actor, Department $office, string $title): Document
    {
        $path = 'p3-tests/'.Str::uuid().'.pdf';
        Storage::disk('documents')->put($path, '%PDF-1.7 test');

        return Document::query()->create([
            'title' => $title,
            'original_name' => $title.'.pdf',
            'document_type' => 'supporting_document',
            'classification' => 'restricted',
            'storage_disk' => 'documents',
            'storage_path' => $path,
            'owner_department_id' => $office->id,
            'uploaded_by_user_id' => $actor->id,
        ]);
    }
}
