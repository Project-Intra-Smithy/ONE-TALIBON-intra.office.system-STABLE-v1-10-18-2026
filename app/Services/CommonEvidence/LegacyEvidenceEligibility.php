<?php

namespace App\Services\CommonEvidence;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use Throwable;

/** Legacy file eligibility, never a grant of source or Plan access. */
final class LegacyEvidenceEligibility
{
    public static function restrict(Builder $query, string $alias, bool $explicitLegacy = false): Builder
    {
        self::restrictWithSchema($query, $alias, $explicitLegacy);

        return $query;
    }

    /**
     * Apply the same fail-closed provenance restriction and return the
     * operation-local schema state for callers that project preview hints.
     *
     * @return array{ready: bool, custodyColumns: int}
     */
    public static function restrictWithSchema(Builder $query, string $alias, bool $explicitLegacy = false): array
    {
        $schema = self::schemaState();
        if (! $schema['ready']) {
            $query->whereRaw('1 = 0');

            return $schema;
        }

        $query
            ->where(function (Builder $domain) use ($alias, $explicitLegacy): void {
                $domain->where($alias.'.security_domain', 'LEGACY_CTW');
                if (! $explicitLegacy) {
                    $domain->orWhereNull($alias.'.security_domain');
                }
            })
            ->whereNotExists(fn (Builder $receipt) => $receipt->selectRaw('1')
                ->from('plan_document_origin_receipts as receipt')
                ->whereColumn('receipt.document_id', $alias.'.id'))
            ->whereNotExists(fn (Builder $binding) => $binding->selectRaw('1')
                ->from('plan_document_bindings as binding')
                ->whereColumn('binding.document_id', $alias.'.id'));

        return $schema;
    }

    /** @return array{ready: bool, custodyColumns: int} */
    private static function schemaState(): array
    {
        try {
            // One fixed PostgreSQL probe, even for a large archive. Resolve
            // the actual tables on the same search path as the read query.
            $schema = DB::selectOne(<<<'SQL'
                SELECT CASE WHEN
                    EXISTS (SELECT 1 FROM pg_attribute
                        WHERE attrelid = to_regclass('documents')
                        AND attname = 'security_domain' AND attnum > 0 AND NOT attisdropped)
                    AND EXISTS (SELECT 1 FROM pg_attribute
                        WHERE attrelid = to_regclass('plan_document_origin_receipts')
                        AND attname = 'document_id' AND attnum > 0 AND NOT attisdropped)
                    AND EXISTS (SELECT 1 FROM pg_attribute
                        WHERE attrelid = to_regclass('plan_document_bindings')
                        AND attname = 'document_id' AND attnum > 0 AND NOT attisdropped)
                    AND has_table_privilege(to_regclass('plan_document_origin_receipts'), 'SELECT')
                    AND has_table_privilege(to_regclass('plan_document_bindings'), 'SELECT')
                    THEN 1 ELSE 0 END AS ready,
                    (SELECT COUNT(*) FROM pg_attribute
                        WHERE attrelid = to_regclass('documents')
                        AND attname IN ('custody_mode', 'custody_operation_id')
                        AND attnum > 0 AND NOT attisdropped) AS custody_columns
                SQL);

            $custodyColumns = (int) ($schema->custody_columns ?? -1);

            return [
                'ready' => (int) ($schema->ready ?? 0) === 1 && in_array($custodyColumns, [0, 2], true),
                'custodyColumns' => $custodyColumns,
            ];
        } catch (Throwable) {
            return ['ready' => false, 'custodyColumns' => -1];
        }
    }
}
