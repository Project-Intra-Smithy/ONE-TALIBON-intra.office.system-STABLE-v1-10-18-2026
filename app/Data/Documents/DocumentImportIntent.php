<?php

namespace App\Data\Documents;

/**
 * Provider metadata is untrusted input. No provider credential, URL, or local
 * path is accepted. A file must be supplied independently as an UploadedFile.
 */
final readonly class DocumentImportIntent
{
    public function __construct(
        public string $operationKey,
        public string $sourceSystem,
        public string $sourceFileId,
        public string $sourceRevision,
        public string $classification,
        public string $relationship = 'supporting_document',
        public ?int $supersedesRevisionId = null,
        public ?string $sourceModifiedAt = null,
    ) {
    }
}
