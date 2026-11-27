<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Correspondence\CorrespondenceClassification;
use App\Models\CorrespondenceEvent;
use App\Models\CorrespondenceRecord;
use App\Models\Document;
use App\Models\DocumentLink;
use App\Models\User;
use App\Services\CommonEvidence\LegacyEvidenceEligibility;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

final class CorrespondenceEvidenceService
{
    public function __construct(
        private readonly CorrespondenceLifecycleService $lifecycle,
        private readonly CorrespondenceRoutingService $routing,
        private readonly DocumentAttachmentService $attachments,
    ) {}

    /** @param array<int, UploadedFile> $files */
    public function register(User $actor, CorrespondenceRecord $correspondence, string $correlationId, array $files): CorrespondenceRecord
    {
        if ($files === []) {
            return $this->lifecycle->register($actor, $correspondence, $correlationId);
        }

        $this->attachments->assertValidUploads($files);
        $attached = [];

        try {
            return DB::transaction(function () use ($actor, $correspondence, $correlationId, $files, &$attached): CorrespondenceRecord {
                ['record' => $record, 'event' => $event] = $this->lifecycle->registerWithEvent($actor, $correspondence, $correlationId);
                $attached = $this->attachments->attach($actor, $files, [
                    ['model' => $record, 'relationship' => 'supporting_document'],
                    ['model' => $event, 'relationship' => 'action_evidence'],
                ]);

                return $record;
            });
        } catch (Throwable $exception) {
            $this->attachments->cleanupDocuments($attached);
            throw $exception;
        }
    }

    /** @param array<int, UploadedFile> $files */
    public function classify(
        User $actor,
        CorrespondenceRecord $correspondence,
        CorrespondenceClassification $classification,
        string $correlationId,
        ?string $remarks,
        array $files,
    ): CorrespondenceRecord {
        if ($files !== []) {
            $this->attachments->assertValidUploads($files);
        }

        $attached = [];

        try {
            return DB::transaction(function () use ($actor, $correspondence, $classification, $correlationId, $remarks, $files, &$attached): CorrespondenceRecord {
                ['record' => $record, 'event' => $event] = $this->lifecycle->classifyWithEvent($actor, $correspondence, $classification, $correlationId, $remarks);
                $this->reclassifyExistingEvidence($record, $classification->value);

                if ($files !== []) {
                    $attached = $this->attachments->attach($actor, $files, [[
                        'model' => $event,
                        'relationship' => 'action_evidence',
                    ]], $classification->value);
                }

                return $record;
            });
        } catch (Throwable $exception) {
            $this->attachments->cleanupDocuments($attached);
            throw $exception;
        }
    }

    /** @param array<string, mixed> $data @param array<int, \Illuminate\Http\UploadedFile> $files */
    public function route(User $actor, CorrespondenceRecord $correspondence, array $data, string $correlationId, array $files): CorrespondenceRecord
    {
        if ($files === []) {
            return $this->routing->route($actor, $correspondence, $data, $correlationId);
        }

        $this->attachments->assertValidUploads($files);
        $attached = [];

        try {
            return DB::transaction(function () use ($actor, $correspondence, $data, $correlationId, $files, &$attached): CorrespondenceRecord {
                ['record' => $record, 'event' => $event] = $this->routing->routeWithEvent($actor, $correspondence, $data, $correlationId);
                $classification = $record->classification?->value ?? 'internal';
                $attached = $this->attachments->attach($actor, $files, [[
                    'model' => $event,
                    'relationship' => 'route_evidence',
                ]], $classification);

                return $record;
            });
        } catch (Throwable $exception) {
            $this->attachments->cleanupDocuments($attached);
            throw $exception;
        }
    }

    /** @param array<int, UploadedFile> $files */
    public function act(User $actor, CorrespondenceRecord $correspondence, string $correlationId, ?string $remarks, array $files): CorrespondenceRecord
    {
        if ($files === []) {
            return $this->routing->markInAction($actor, $correspondence, $correlationId, $remarks);
        }

        $this->attachments->assertValidUploads($files);
        $attached = [];

        try {
            return DB::transaction(function () use ($actor, $correspondence, $correlationId, $remarks, $files, &$attached): CorrespondenceRecord {
                ['record' => $record, 'event' => $event] = $this->routing->markInActionWithEvent($actor, $correspondence, $correlationId, $remarks);
                $classification = $record->classification?->value ?? 'internal';
                $attached = $this->attachments->attach($actor, $files, [[
                    'model' => $event,
                    'relationship' => 'action_evidence',
                ]], $classification);

                return $record;
            });
        } catch (Throwable $exception) {
            $this->attachments->cleanupDocuments($attached);
            throw $exception;
        }
    }

    private function reclassifyExistingEvidence(CorrespondenceRecord $record, string $classification): void
    {
        $documentIds = DocumentLink::query()
            ->where('linkable_type', $record->getMorphClass())
            ->where('linkable_id', $record->id)
            ->pluck('document_id');

        $eventIds = CorrespondenceEvent::query()
            ->where('correspondence_record_id', $record->id)
            ->pluck('id');

        if ($eventIds->isNotEmpty()) {
            $documentIds = $documentIds->merge(
                DocumentLink::query()
                    ->where('linkable_type', (new CorrespondenceEvent)->getMorphClass())
                    ->whereIn('linkable_id', $eventIds)
                    ->pluck('document_id'),
            );
        }

        $ids = $documentIds->unique()->values()->all();
        if ($ids === []) {
            return;
        }

        $query = Document::query()->whereIn('documents.id', $ids);
        $schema = LegacyEvidenceEligibility::restrictWithSchema($query->getQuery(), 'documents');

        if (! $schema['ready'] || ! in_array($schema['custodyColumns'], [0, 2], true)) {
            throw new RuntimeException('Unable to verify document custody schema for evidence reclassification.');
        }

        if ($schema['custodyColumns'] === 2) {
            $query
                ->where('documents.custody_mode', 'LEGACY_PATH')
                ->whereNull('documents.custody_operation_id');
        }

        $query->update(['classification' => $classification]);
    }
}
