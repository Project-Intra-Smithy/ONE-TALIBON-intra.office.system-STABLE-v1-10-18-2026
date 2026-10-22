<?php

namespace Tests\Feature;

use App\Data\Documents\DocumentImportIntent;
use App\Domain\Correspondence\CorrespondenceLifecycleState;
use App\Models\CorrespondenceRecord;
use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentImportRevision;
use App\Models\DocumentLink;
use App\Models\Employee;
use App\Models\User;
use App\Services\DocumentImportAuthorization;
use App\Services\DocumentIngestionService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Tests\TestCase;

class DocumentIngestionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('documents');
    }

    public function test_default_authority_denies_dry_run_and_import_without_mutation(): void
    {
        [$actor, $record] = $this->context();

        try {
            $this->service()->dryRun($actor, $record, $this->file('one'), $this->intent());
            $this->fail('Unwired import policy must deny.');
        } catch (AuthorizationException) {
            $this->assertDatabaseCount('documents', 0);
        }

        $this->expectException(AuthorizationException::class);
        $this->service()->ingest($actor, $record, $this->file('one'), $this->intent());
    }

    public function test_authorized_dry_run_calculates_checksum_without_writing_anything(): void
    {
        [$actor, $record] = $this->context();
        $this->permit();
        $file = $this->file('dry-run');
        $preview = $this->service()->dryRun($actor, $record, $file, $this->intent());

        $this->assertSame(hash('sha256', "%PDF-1.7\ndry-run\n%%EOF"), $preview['checksum_sha256']);
        $this->assertFalse($preview['duplicate_content']);
        $this->assertFalse($preview['source_revision_exists']);
        $this->assertSame(1, $preview['next_version']);
        $this->assertDatabaseCount('documents', 0);
        $this->assertDatabaseCount('document_import_revisions', 0);
        $this->assertSame([], Storage::disk('documents')->allFiles());
    }

    public function test_import_persists_private_bytes_provenance_and_exact_parent_link(): void
    {
        [$actor, $record] = $this->context();
        $this->permit();
        $revision = $this->service()->ingest($actor, $record, $this->file('one'), $this->intent());
        $document = $revision->document;

        $this->assertSame(1, $revision->version_number);
        $this->assertNull($revision->supersedes_revision_id);
        $this->assertSame('drive', $revision->source_system);
        $this->assertSame('drive-file-abc', $revision->source_file_id);
        $this->assertSame('r1', $revision->source_revision);
        $this->assertSame(hash('sha256', "%PDF-1.7\none\n%%EOF"), $revision->checksum_sha256);
        $this->assertSame('controlled_document_ingestion', $document->metadata['source']);
        $this->assertSame('one.pdf', $revision->original_filename);
        $this->assertSame('internal', $document->classification);
        $this->assertSame('documents', $document->storage_disk);
        $this->assertSame($actor->id, $document->uploaded_by_user_id);
        $this->assertSame($actor->employee->department_id, $document->owner_department_id);
        $this->assertStringNotContainsString('one.pdf', $document->storage_path);
        Storage::disk('documents')->assertExists($document->storage_path);

        $this->assertDatabaseHas('document_links', [
            'document_id' => $document->id,
            'linkable_type' => $record->getMorphClass(),
            'linkable_id' => $record->id,
            'relationship' => 'supporting_document',
        ]);
    }

    public function test_exact_replay_is_idempotent_and_changed_payload_conflicts(): void
    {
        [$actor, $record] = $this->context();
        $this->permit();
        $intent = $this->intent();
        $first = $this->service()->ingest($actor, $record, $this->file('same'), $intent);
        $second = $this->service()->ingest($actor, $record, $this->file('same'), $intent);

        $this->assertSame($first->id, $second->id);
        $this->assertDatabaseCount('documents', 1);
        $this->assertDatabaseCount('document_links', 1);
        $this->assertDatabaseCount('document_import_revisions', 1);
        $this->assertCount(1, Storage::disk('documents')->allFiles());

        $this->expectException(ConflictHttpException::class);
        $this->service()->ingest($actor, $record, $this->file('different'), $intent);
    }

    public function test_same_provider_revision_cannot_be_imported_with_new_operation_key(): void
    {
        [$actor, $record] = $this->context();
        $this->permit();
        $this->service()->ingest($actor, $record, $this->file('original'), $this->intent());

        try {
            $this->service()->ingest(
                $actor, $record, $this->file('other'), $this->intent((string) Str::uuid())
            );
            $this->fail('Duplicate source revision must conflict.');
        } catch (ConflictHttpException) {
            $this->assertDatabaseCount('documents', 1);
            $this->assertDatabaseCount('document_import_revisions', 1);
            $this->assertCount(1, Storage::disk('documents')->allFiles());
        }
    }

    public function test_version_supersession_is_linear_append_only_and_rejects_forks(): void
    {
        [$actor, $record] = $this->context();
        $this->permit();
        $first = $this->service()->ingest($actor, $record, $this->file('v1'), $this->intent());

        $second = $this->service()->ingest(
            $actor, $record, $this->file('v2'),
            $this->intent((string) Str::uuid(), 'r2', $first->id)
        );
        $this->assertSame(2, $second->version_number);
        $this->assertSame($first->id, $second->supersedes_revision_id);
        $this->assertSame($first->id, $second->root_revision_id);
        $this->assertNotSame($first->document_id, $second->document_id);
        $this->assertSame('r1', $first->fresh()->source_revision);

        $third = $this->service()->ingest(
            $actor, $record, $this->file('v3'),
            $this->intent((string) Str::uuid(), 'r3', $second->id)
        );
        $this->assertSame(3, $third->version_number);
        $this->assertSame($first->id, $third->root_revision_id);

        try {
            $this->service()->ingest(
                $actor, $record, $this->file('fork'),
                $this->intent((string) Str::uuid(), 'fork', $first->id)
            );
            $this->fail('Stale ancestor must not fork a version chain.');
        } catch (ConflictHttpException) {
            $this->assertDatabaseCount('document_import_revisions', 3);
            $this->assertDatabaseCount('documents', 3);
        }
    }

    public function test_identical_bytes_and_classification_downgrade_cannot_supersede(): void
    {
        [$actor, $record] = $this->context();
        $this->permit();
        $original = $this->service()->ingest(
            $actor, $record, $this->file('same'), $this->intent(classification: 'restricted')
        );

        try {
            $this->service()->ingest(
                $actor, $record, $this->file('same'),
                $this->intent((string) Str::uuid(), 'r2', $original->id, 'restricted')
            );
            $this->fail('Identical bytes must not fabricate a new version.');
        } catch (ConflictHttpException) {
            $this->assertDatabaseCount('documents', 1);
        }

        $this->expectException(ConflictHttpException::class);
        $this->service()->ingest(
            $actor, $record, $this->file('different'),
            $this->intent((string) Str::uuid(), 'r2', $original->id, 'internal')
        );
    }

    public function test_invalid_pdf_is_rejected_before_storage_or_database_mutation(): void
    {
        [$actor, $record] = $this->context();
        $this->permit();

        try {
            $this->service()->ingest(
                $actor, $record,
                UploadedFile::fake()->createWithContent('bad.pdf', "MZ\x90\x00not a PDF"),
                $this->intent()
            );
            $this->fail('Spoofed file must be rejected.');
        } catch (ValidationException) {
            $this->assertDatabaseCount('documents', 0);
            $this->assertDatabaseCount('document_import_revisions', 0);
            $this->assertSame([], Storage::disk('documents')->allFiles());
        }
    }

    public function test_revision_insert_failure_rolls_back_documents_links_audit_and_files(): void
    {
        [$actor, $record] = $this->context();
        $this->permit();
        DocumentImportRevision::creating(static function (): never {
            throw new RuntimeException('Synthetic revision persistence failure.');
        });

        try {
            $this->service()->ingest($actor, $record, $this->file('rollback'), $this->intent());
            $this->fail('Expected injected persistence failure.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Synthetic revision persistence failure.', $exception->getMessage());
            $this->assertDatabaseCount('documents', 0);
            $this->assertDatabaseCount('document_links', 0);
            $this->assertDatabaseCount('document_import_revisions', 0);
            $this->assertDatabaseMissing('audit_logs', ['action' => 'document.uploaded']);
            $this->assertSame([], Storage::disk('documents')->allFiles());
        }
    }

    public function test_parent_classification_floor_blocks_public_upload_to_restricted_correspondence(): void
    {
        [$actor, $record] = $this->context();
        $record->forceFill(['classification' => 'restricted'])->save();
        $this->permit();

        try {
            $this->service()->ingest(
                $actor, $record, $this->file('downgrade'),
                $this->intent(classification: 'public')
            );
            $this->fail('Restricted parent must not receive public classified evidence.');
        } catch (AuthorizationException) {
            $this->assertDatabaseCount('documents', 0);
            $this->assertDatabaseCount('document_import_revisions', 0);
        }
    }

    public function test_cross_office_parent_is_denied_even_with_valid_file(): void
    {
        [$actor, $record] = $this->context();
        $other = $this->department();
        $record->forceFill(['receiving_department_id' => $other->id])->save();
        $this->permit();

        $this->expectException(AuthorizationException::class);
        $this->service()->ingest($actor, $record, $this->file('private'), $this->intent());
    }

    private function service(): DocumentIngestionService
    {
        return app(DocumentIngestionService::class);
    }

    private function intent(
        ?string $key = null, string $revision = 'r1', ?int $previous = null, string $classification = 'internal',
    ): DocumentImportIntent {
        return new DocumentImportIntent(
            operationKey: $key ?? (string) Str::uuid(),
            sourceSystem: 'drive',
            sourceFileId: 'drive-file-abc',
            sourceRevision: $revision,
            classification: $classification,
            supersedesRevisionId: $previous,
            sourceModifiedAt: '2026-10-22T09:00:00Z',
        );
    }

    private function file(string $contents): UploadedFile
    {
        return UploadedFile::fake()->createWithContent(
            $contents.'.pdf', "%PDF-1.7\n".$contents."\n%%EOF"
        );
    }

    private function permit(): void
    {
        // Synthetic adapter only. Production always denies until a real
        // Maintainer-owned parent/classification policy is integrated.
        $this->app->instance(DocumentImportAuthorization::class, new class extends DocumentImportAuthorization
        {
            public function authorize(User $actor, Model $parent, string $classification): void
            {
                if (! $actor->is_active
                    || ! $parent instanceof CorrespondenceRecord
                    || (int) $actor->employee?->department_id !== (int) $parent->receiving_department_id) {
                    throw new AuthorizationException('Not authorized for this document parent.');
                }
            }
        });
    }

    /** @return array{User, CorrespondenceRecord} */
    private function context(): array
    {
        $office = $this->department();
        $actor = User::query()->create([
            'name' => 'Synthetic Importer',
            'email' => Str::random(14).'@example.test',
            'password' => 'password',
            'role' => 'department_head',
            'is_active' => true,
        ]);
        Employee::query()->create([
            'employee_number' => 'IMP-'.Str::upper(Str::random(12)),
            'full_name' => $actor->name,
            'work_email' => $actor->email,
            'user_id' => $actor->id,
            'department_id' => $office->id,
            'position_title' => 'Synthetic Records Officer',
            'employment_status' => 'active',
        ]);
        $record = CorrespondenceRecord::query()->create([
            'public_id' => (string) Str::uuid(),
            'external_reference_no' => 'IMP-EXT-'.Str::upper(Str::random(12)),
            'source' => 'integration',
            'channel' => 'synthetic',
            'sender_name' => 'Synthetic Correspondent',
            'subject' => 'Synthetic document import parent',
            'received_at' => now(),
            'receiving_department_id' => $office->id,
            'classification' => 'internal',
            'lifecycle_state' => CorrespondenceLifecycleState::Classified->value,
        ]);

        return [$actor->fresh('employee'), $record];
    }

    private function department(): Department
    {
        return Department::query()->create([
            'code' => 'IMP-'.Str::upper(Str::random(8)),
            'name' => 'Synthetic Import Office',
            'short_name' => 'IMP',
            'branch' => 'executive',
            'office_type' => 'department',
            'sort_order' => 10,
            'is_routable' => true,
            'is_active' => true,
        ]);
    }
}
