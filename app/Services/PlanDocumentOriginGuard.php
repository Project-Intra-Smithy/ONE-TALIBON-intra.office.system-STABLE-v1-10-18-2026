<?php

namespace App\Services;

use App\Models\Document;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

/**
 * Fail-closed classification before a legacy route reads or cleans up bytes.
 * This guard denies access; it never grants Plan document authorization.
 */
final class PlanDocumentOriginGuard
{
    public static function isProtected(Document $document): bool
    {
        // A loaded, explicitly sealed Document remains protected even if the
        // database connection or migration state becomes unavailable.
        if ($document->getAttribute('security_domain') === 'EVER_PLAN') {
            return true;
        }

        // An unsaved or keyless object cannot authorize legacy byte cleanup.
        if (! $document->exists || $document->getKey() === null) {
            return true;
        }

        try {
            $hasDomain = Schema::hasColumn('documents', 'security_domain');
            $hasReceipts = Schema::hasTable('plan_document_origin_receipts');

            // One half of the Plan provenance schema is not a safe legacy
            // state. Never fall through to file access during partial upgrade.
            if ($hasDomain !== $hasReceipts) {
                return true;
            }

            // Preserve pre-G2B legacy behavior when *neither* Plan schema
            // component exists. External restore fencing is still required:
            // an old database alone cannot prove that a Plan was never sealed.
            if (! $hasDomain) {
                return false;
            }

            // Re-read the persisted security domain. The incoming Eloquent
            // instance may predate a concurrent EVER_PLAN origin promotion.
            $persisted = DB::table('documents')
                ->where('id', $document->getKey())
                ->first(['security_domain']);

            if ($persisted === null || $persisted->security_domain === 'EVER_PLAN') {
                return true;
            }

            // A receipt is permanent Plan evidence even if document metadata
            // is stale, inconsistent or claims LEGACY_CTW.
            return DB::table('plan_document_origin_receipts')
                ->where('document_id', $document->getKey())
                ->exists();
        } catch (Throwable) {
            // Unknown schema/DB state always denies legacy byte retrieval.
            return true;
        }
    }
}
