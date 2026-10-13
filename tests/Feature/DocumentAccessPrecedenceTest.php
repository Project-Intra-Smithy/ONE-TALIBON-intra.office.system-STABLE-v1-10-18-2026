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
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\CorrespondenceAccessDecider;
use App\Services\DocumentAccessService;
use App\Services\DocumentArchiveQuery;
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
        $this->actingAs($actor)
            ->get('/documents/'.$document->public_id.'/download')
            ->assertForbidden();
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
            'linkable_type' => (new CorrespondenceEvent())->getMorphClass(),
            'linkable_id' => 999999999,
            'relationship' => 'missing_high_priority_event',
        ]);

        $this->assertFalse(app(DocumentAccessService::class)->canDownload($actor, $document));
        $archive = app(DocumentArchiveQuery::class)->workspace($actor, ['document' => $document->public_id]);
        $this->assertNull($archive['selected']);
        $this->assertSame(0, $archive['records']->total());
    }

    public function test_archive_uses_authorized_parent_for_relationship_metadata(): void
    {
        $office = $this->department('CONTEXT');
        $other = $this->department('HIDDEN-CONTEXT');
        $actor = $this->human($office);
        $denied = $this->restrictedCorrespondence($other);
        $allowed = $this->restrictedCorrespondence($office);
        $allowed->update(['subject' => 'Authorized correspondence context']);
        $document = $this->document($actor, $office, 'Mixed correspondence context');

        foreach ([$denied, $allowed] as $index => $record) {
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
        $this->assertSame('Authorized correspondence context', $archive['selected']['relatedTitle']);
        $this->assertSame('Authorized correspondence context', $archive['records']->items()[0]['relatedTitle']);
        $this->assertNotSame($denied->subject, $archive['selected']['relatedTitle']);
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
        $this->assertSame('Authorized SQL archive source', $archive['selected']['relatedTitle']);
        $serialized = json_encode($archive);
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
        foreach ([CorrespondenceRecord::class, \App\Models\TravelOrderEvent::class] as $class) {
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

    public function test_received_registrar_exception_matches_can_view_in_workspace_even_with_a_receiving_office(): void
    {
        $actorOffice = $this->department('REGISTRAR');
        $otherOffice = $this->department('RECEIVED-FOREIGN');
        $actor = $this->human($actorOffice);
        $received = $this->restrictedCorrespondence($otherOffice);
        $received->update([
            'lifecycle_state' => CorrespondenceLifecycleState::Received->value,
        ]);
        $document = $this->document($actor, $actorOffice, 'Received registrar intake');
        DocumentLink::query()->create([
            'document_id' => $document->id,
            'linkable_type' => $received->getMorphClass(),
            'linkable_id' => $received->id,
            'relationship' => 'intake_evidence',
        ]);

        $this->assertTrue(app(CorrespondenceAccessDecider::class)->canViewInWorkspace($actor, $received));
        $this->assertTrue(app(DocumentAccessService::class)->canDownload($actor, $document));
        $result = app(DocumentArchiveQuery::class)->workspace($actor, [
            'document' => $document->public_id,
        ]);
        $this->assertSame(1, $result['records']->total());
        $this->assertSame($document->public_id, $result['selected']['publicId']);
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
