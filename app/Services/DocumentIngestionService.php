<?php

namespace App\Services;

use App\Data\Documents\DocumentImportIntent;
use App\Models\Document;
use App\Models\DocumentImportRevision;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Throwable;

/**
 * Unrouted, authorized-by-adapter ingestion. This service never fetches Drive
 * data or exposes uploaded bytes. Each import owns a new protected Document.
 */
final class DocumentIngestionService
{
    private const CLASSIFICATION_RANK = [
        'public' => 0,
        'internal' => 1,
        'confidential' => 2,
        'restricted' => 3,
    ];

    private const RELATIONSHIPS = [
        'supporting_document', 'route_evidence', 'action_evidence',
        'response_attachment', 'photo_evidence',
    ];

    public function __construct(
        private readonly DocumentAttachmentService $attachments,
        private readonly DocumentImportAuthorization $authorization,
        private readonly AuditLogger $audit,
    ) {
    }

    /**
     * No writes, uploads, provider calls, or cross-parent duplicate disclosure.
     *
     * @return array{checksum_sha256:string,size_bytes:int,duplicate_content:bool,source_revision_exists:bool,next_version:int}
     */
    public function dryRun(
        User $actor,
        Model $parent,
        UploadedFile $file,
        DocumentImportIntent $intent,
    ): array {
        $departmentId = $this->validateInput($actor, $parent, $file, $intent);
        $checksum = $this->checksum($file);
        $previous = $intent->supersedesRevisionId
            ? $this->previous($intent, $departmentId, $parent, false)
            : DocumentImportRevision::query()
                ->where('owner_department_id', $departmentId)
                ->where('source_system', $intent->sourceSystem)
                ->where('source_file_id', $intent->sourceFileId)
                ->orderByDesc('version_number')->first();

        return [
            'checksum_sha256' => $checksum,
            'size_bytes' => (int) $file->getSize(),
            'duplicate_content' => Document::query()
                ->where('checksum_sha256', $checksum)
                ->whereHas('links', fn ($query) => $query
                    ->where('linkable_type', $parent->getMorphClass())
                    ->where('linkable_id', $parent->getKey()))
                ->exists(),
            'source_revision_exists' => DocumentImportRevision::query()
                ->where('owner_department_id', $departmentId)
                ->where('source_system', $intent->sourceSystem)
                ->where('source_file_id', $intent->sourceFileId)
                ->where('source_revision', $intent->sourceRevision)
                ->exists(),
            'next_version' => $previous ? (int) $previous->version_number + 1 : 1,
        ];
    }

    /**
     * On exact replay the same revision is returned; changed replay conflicts.
     * All DB changes and audits are atomic. Written files are removed on failure.
     */
    public function ingest(
        User $actor,
        Model $parent,
        UploadedFile $file,
        DocumentImportIntent $intent,
    ): DocumentImportRevision {
        $departmentId = $this->validateInput($actor, $parent, $file, $intent);
        $checksum = $this->checksum($file);
        $fingerprint = hash('sha256', json_encode([
            $actor->id, $departmentId, $parent->getMorphClass(), $parent->getKey(),
            $intent->sourceSystem, $intent->sourceFileId, $intent->sourceRevision,
            $intent->classification, $intent->relationship, $intent->supersedesRevisionId,
            $intent->sourceModifiedAt, $this->safeName($file), (int) $file->getSize(), $checksum,
        ], JSON_THROW_ON_ERROR));

        $created = [];

        try {
            return DB::transaction(function () use (
                $actor, $parent, $file, $intent, $departmentId, $checksum,
                $fingerprint, &$created
            ): DocumentImportRevision {
                // Re-evaluate current authority inside the write transaction.
                $this->authorization->authorize($actor, $parent, $intent->classification);

                $replay = DocumentImportRevision::query()
                    ->where('operation_key', $intent->operationKey)->first();

                if ($replay) {
                    if (! hash_equals($replay->request_fingerprint, $fingerprint)) {
                        throw new ConflictHttpException('Import operation key was reused with different content.');
                    }

                    return $replay;
                }

                $previous = $this->previous($intent, $departmentId, $parent, true);
                if ($previous && hash_equals($previous->checksum_sha256, $checksum)) {
                    throw new ConflictHttpException('A new revision must contain different file bytes.');
                }

                if (DocumentImportRevision::query()
                    ->where('owner_department_id', $departmentId)
                    ->where('source_system', $intent->sourceSystem)
                    ->where('source_file_id', $intent->sourceFileId)
                    ->where('source_revision', $intent->sourceRevision)
                    ->exists()) {
                    throw new ConflictHttpException('That source revision is already registered.');
                }

                $created = $this->attachments->attach(
                    $actor, [$file], [['model' => $parent, 'relationship' => $intent->relationship]],
                    $intent->classification
                );
                $document = $created[0];

                $document->forceFill(['metadata' => [
                    ...($document->metadata ?? []),
                    'source' => 'controlled_document_ingestion',
                    'import' => [
                        'source_system' => $intent->sourceSystem,
                        'source_file_id' => $intent->sourceFileId,
                        'source_revision' => $intent->sourceRevision,
                        'source_modified_at' => $intent->sourceModifiedAt,
                        'claimed_original_filename' => $this->safeName($file),
                        'checksum_sha256' => $checksum,
                    ],
                ]])->save();

                $revision = DocumentImportRevision::query()->create([
                    'document_id' => $document->id,
                    'supersedes_revision_id' => $previous?->id,
                    'root_revision_id' => $previous ? ($previous->root_revision_id ?? $previous->id) : null,
                    'version_number' => $previous ? (int) $previous->version_number + 1 : 1,
                    'owner_department_id' => $departmentId,
                    'actor_user_id' => $actor->id,
                    'parent_type' => $parent->getMorphClass(),
                    'parent_id' => $parent->getKey(),
                    'relationship' => $intent->relationship,
                    'source_system' => $intent->sourceSystem,
                    'source_file_id' => $intent->sourceFileId,
                    'source_revision' => $intent->sourceRevision,
                    'source_modified_at' => $intent->sourceModifiedAt,
                    'original_filename' => $this->safeName($file),
                    'checksum_sha256' => $checksum,
                    'operation_key' => $intent->operationKey,
                    'request_fingerprint' => $fingerprint,
                ]);

                $this->audit->record(
                    $actor, 'document.imported', 'Imported a protected document revision.',
                    entityType: 'document', entityId: $document->id
                );

                return $revision;
            });
        } catch (Throwable $exception) {
            $this->attachments->cleanupDocuments($created);

            throw $exception;
        }
    }

    private function validateInput(
        User $actor, Model $parent, UploadedFile $file, DocumentImportIntent $intent,
    ): int {
        $actor->loadMissing('employee');
        $departmentId = (int) ($actor->employee?->department_id ?? 0);

        if (! $actor->is_active || $departmentId < 1 || ! $parent->exists || ! $parent->getKey()) {
            throw ValidationException::withMessages(['import' => 'An active actor and persisted record are required.']);
        }

        // Default policy always denies; a Maintainer-owned binding is required.
        $this->authorization->authorize($actor, $parent, $intent->classification);

        if (! Str::isUuid($intent->operationKey)
            || ! preg_match('/^[a-z][a-z0-9_-]{0,31}$/D', $intent->sourceSystem)
            || ! $this->validSourceValue($intent->sourceFileId, 255)
            || ! $this->validSourceValue($intent->sourceRevision, 128)
            || ! array_key_exists($intent->classification, self::CLASSIFICATION_RANK)
            || ! in_array($intent->relationship, self::RELATIONSHIPS, true)
            || ($intent->supersedesRevisionId !== null && $intent->supersedesRevisionId < 1)
            || ($intent->sourceModifiedAt !== null && ! $this->validTimestamp($intent->sourceModifiedAt))) {
            throw ValidationException::withMessages(['import' => 'Invalid document import metadata.']);
        }

        $this->attachments->assertValidUploads([$file]);

        return $departmentId;
    }

    private function previous(
        DocumentImportIntent $intent, int $departmentId, Model $parent, bool $lock,
    ): ?DocumentImportRevision {
        if ($intent->supersedesRevisionId === null) {
            if (DocumentImportRevision::query()
                ->where('owner_department_id', $departmentId)
                ->where('source_system', $intent->sourceSystem)
                ->where('source_file_id', $intent->sourceFileId)
                ->exists()) {
                throw new ConflictHttpException('A source file already has an initial revision.');
            }

            return null;
        }

        $query = DocumentImportRevision::query()
            ->whereKey($intent->supersedesRevisionId)
            ->where('owner_department_id', $departmentId)
            ->where('source_system', $intent->sourceSystem)
            ->where('source_file_id', $intent->sourceFileId)
            ->where('parent_type', $parent->getMorphClass())
            ->where('parent_id', $parent->getKey());

        $previous = ($lock ? $query->lockForUpdate() : $query)->first();

        if (! $previous || DocumentImportRevision::query()
            ->where('supersedes_revision_id', $previous->id)->exists()
            || self::CLASSIFICATION_RANK[$intent->classification]
                < self::CLASSIFICATION_RANK[$previous->document->classification]) {
            throw new ConflictHttpException('Stale revision, unauthorized lineage, or classification downgrade.');
        }

        return $previous;
    }

    private function validSourceValue(string $value, int $limit): bool
    {
        return trim($value) === $value && $value !== ''
            && strlen($value) <= $limit && ! preg_match('/[\x00-\x1F\x7F]/', $value);
    }

    private function validTimestamp(string $value): bool
    {
        try {
            return preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/D', $value) === 1
                && CarbonImmutable::parse($value) !== null;
        } catch (Throwable) {
            return false;
        }
    }

    private function checksum(UploadedFile $file): string
    {
        $hash = hash_file('sha256', (string) $file->getRealPath());
        if (! is_string($hash)) {
            throw ValidationException::withMessages(['import' => 'Unable to checksum import bytes.']);
        }

        return $hash;
    }

    private function safeName(UploadedFile $file): string
    {
        return Str::limit(basename(str_replace('\\', '/', $file->getClientOriginalName())), 255, '');
    }
}
