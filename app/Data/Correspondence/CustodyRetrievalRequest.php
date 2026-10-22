<?php

namespace App\Data\Correspondence;

use InvalidArgumentException;

/** Read provenance request. No requested clearance, custodian or actor supplied. */
final readonly class CustodyRetrievalRequest
{
    public function __construct(
        public string $correspondencePublicId,
        public string $accessRequestKey,
        public string $correlationId,
        public string $purposeReference,
    ) {
        foreach ([$correspondencePublicId, $accessRequestKey, $correlationId] as $uuid) {
            if (preg_match('/\A[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\z/iD', $uuid) !== 1) {
                throw new InvalidArgumentException('Custody retrieval references must be UUIDs.');
            }
        }
        if (trim($purposeReference) === '' || strlen($purposeReference) > 160) {
            throw new InvalidArgumentException('A bounded retrieval-purpose reference is required.');
        }
    }
}
