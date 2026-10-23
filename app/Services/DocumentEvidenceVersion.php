<?php

namespace App\Services;

use App\Models\CorrespondenceRecord;
use App\Models\Document;
use App\Models\DocumentImportRevision;
use Illuminate\Support\Facades\Storage;

/** Resolves existing proof only; never grants ingestion or custody authority. */
final class DocumentEvidenceVersion
{
    public function resolve(Document $document, CorrespondenceRecord $record): ?int
    {
        if ($document->storage_disk !== (string) config('documents.disk', 'documents') || ! $document->storage_path) {
            return null;
        }
        $revision = DocumentImportRevision::query()->where('document_id', $document->id)->first();
        $metadataVersion = $document->metadata['version'] ?? null;
        if ($revision !== null) {
            if ($revision->parent_type !== $record->getMorphClass()
                || (int) $revision->parent_id !== (int) $record->id
                || ! hash_equals($revision->checksum_sha256, (string) $document->checksum_sha256)
                || ($metadataVersion !== null && $metadataVersion !== (int) $revision->version_number)) {
                return null;
            }
            $version = (int) $revision->version_number;
        } else {
            // No guessed version 1, and no fallback for an import missing its ledger.
            if (($document->metadata['source'] ?? null) === 'controlled_document_ingestion') {
                return null;
            }
            $version = $metadataVersion;
        }
        if (! is_int($version) || $version < 1 || ! is_string($document->checksum_sha256)
            || ! preg_match('/^[a-f0-9]{64}$/D', $document->checksum_sha256)) {
            return null;
        }

        $stream = Storage::disk($document->storage_disk)->readStream($document->storage_path);
        if (! is_resource($stream)) {
            return null;
        }
        try {
            $hash = hash_init('sha256');
            hash_update_stream($hash, $stream);
            return hash_equals($document->checksum_sha256, hash_final($hash)) ? $version : null;
        } finally {
            fclose($stream);
        }
    }
}
