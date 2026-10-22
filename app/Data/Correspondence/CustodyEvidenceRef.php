<?php

namespace App\Data\Correspondence;

use App\Domain\Correspondence\CorrespondenceClassification;
use InvalidArgumentException;

/** Immutable reference to a previously protected Document version and digest. */
final readonly class CustodyEvidenceRef
{
    public function __construct(
        public int $documentId,
        public int $version,
        public string $checksumSha256,
        public CorrespondenceClassification $classification,
    ) {
        if ($documentId < 1 || $version < 1 || preg_match('/\A[a-f0-9]{64}\z/D', $checksumSha256) !== 1) {
            throw new InvalidArgumentException('Valid document ID, version and SHA-256 digest are required.');
        }
    }

    /** @return array{document_id:int,version:int,sha256:string,classification:string} */
    public function snapshot(): array
    {
        return [
            'document_id' => $this->documentId,
            'version' => $this->version,
            'sha256' => $this->checksumSha256,
            'classification' => $this->classification->value,
        ];
    }
}
