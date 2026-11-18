<?php

namespace App\Services;

use App\Models\Document;
use App\Services\CommonEvidence\LegacyEvidenceEligibility;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

/**
 * Fail-closed classification before a legacy route reads or cleans up bytes.
 * This guard denies access; it never grants Plan document authorization.
 */
final class PlanDocumentOriginGuard
{
    /** Strict persisted provenance for all legacy byte paths in the current candidate. */
    public static function isEligibleForLegacyPreview(Document $document): bool
    {
        if (! $document->exists || $document->getKey() === null
            || ! in_array($document->getAttribute('security_domain'), [null, 'LEGACY_CTW'], true)) {
            return false;
        }

        try {
            $hasDomain = Schema::hasColumn('documents', 'security_domain');
            $hasReceipts = Schema::hasTable('plan_document_origin_receipts');
            if (! $hasDomain || ! $hasReceipts) {
                return false;
            }

            return LegacyEvidenceEligibility::restrict(DB::table('documents as d'), 'd')
                ->where('d.id', $document->getKey())->exists();
        } catch (Throwable) {
            return false;
        }
    }

    public static function isProtected(Document $document): bool
    {
        // A negative legacy decision protects bytes and custody. The old
        // dual-absent fallback is superseded in this post-G2B candidate:
        // missing provenance cannot prove genuine historical legacy origin.
        return ! self::isEligibleForLegacyPreview($document);
    }
}
