<?php

namespace Tests\Feature;

use App\Domain\Correspondence\CorrespondenceClassification;
use App\Domain\Correspondence\CorrespondenceLifecycleState;
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
        $actor = $actor->fresh('employee.department');
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
            'linkable_type' => (new \\App\\Models\\CorrespondenceEvent())->getMorphClass(),
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
