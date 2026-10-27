<?php

namespace App\Services;

use App\Models\Document;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

/**
 * Legacy paths may NEVER serve or delete a formerly sealed Plan document.
 * Does not confer any access right.
 */
final class PlanDocumentOriginGuard
{
    public static function isProtected(Document $document): bool
    {
        if ($document->getAttribute('security_domain') === 'EVER_PLAN') {
            return true;
        }

        try {
            if (! Schema::hasTable('plan_document_origin_receipts')) {
                return false;
            }

            return $document->exists && DB::table('plan_document_origin_receipts')
                ->where('document_id', $document->getKey())->exists();
        } catch (Throwable) {
            // Unknown database/schema state means no legacy byte access/cleanup.
            return true;
        }
    }
}
