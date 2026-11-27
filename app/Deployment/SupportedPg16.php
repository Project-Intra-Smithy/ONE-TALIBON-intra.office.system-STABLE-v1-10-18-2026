<?php

declare(strict_types=1);

namespace App\Deployment;

use Illuminate\Support\Facades\DB;
use RuntimeException;

/** Finite ONE TALIBON target: canonical relational schema and stock PG16/plpgsql only. */
final class SupportedPg16
{
    public const UNSUPPORTED = [
        'reserved_namespaces' => "SELECT * FROM pg_namespace WHERE nspname ~ '^pg_' AND nspname NOT IN ('pg_catalog','pg_toast') AND nspname !~ '^pg_(toast_)?temp_[0-9]+$'",
        'large_objects' => 'SELECT * FROM pg_largeobject_metadata',
        'large_object_pages' => 'SELECT loid,pageno,md5(data::text) AS digest FROM pg_largeobject',
        'foreign_wrappers' => 'SELECT * FROM pg_foreign_data_wrapper',
        'foreign_servers' => 'SELECT * FROM pg_foreign_server',
        'user_mappings' => 'SELECT * FROM pg_user_mapping',
        'foreign_tables' => 'SELECT * FROM pg_foreign_table',
        'publications' => 'SELECT * FROM pg_publication',
        'publication_tables' => 'SELECT * FROM pg_publication_rel',
        'publication_schemas' => 'SELECT * FROM pg_publication_namespace',
        'subscriptions' => 'SELECT * FROM pg_subscription WHERE subdbid=(SELECT oid FROM pg_database WHERE datname=current_database())',
        'subscription_relations' => 'SELECT r.* FROM pg_subscription_rel r JOIN pg_subscription s ON s.oid=r.srsubid WHERE s.subdbid=(SELECT oid FROM pg_database WHERE datname=current_database())',
        'event_triggers' => 'SELECT * FROM pg_event_trigger',
        'security_labels' => 'SELECT * FROM pg_seclabel',
        'shared_target_labels' => "SELECT * FROM pg_shseclabel WHERE classoid='pg_database'::regclass AND objoid=(SELECT oid FROM pg_database WHERE datname=current_database())",
        'target_slots' => 'SELECT slot_name,plugin,slot_type,database,temporary,two_phase FROM pg_replication_slots WHERE database=current_database()',
        'extensions' => "SELECT * FROM pg_extension WHERE extname<>'plpgsql'",
        'languages' => "SELECT * FROM pg_language WHERE lanname NOT IN ('internal','c','sql','plpgsql') OR (lanname='plpgsql' AND (NOT lanpltrusted OR lanispl IS FALSE))",
        'user_domains_enums_ranges' => "SELECT * FROM pg_type WHERE oid>=16384 AND typtype IN ('d','e','r','m')",
        'partitioned_relations' => 'SELECT * FROM pg_partitioned_table',
        'inheritance' => 'SELECT * FROM pg_inherits',
        'user_aggregates' => 'SELECT a.* FROM pg_aggregate a WHERE a.aggfnoid>=16384',
        'extended_statistics' => 'SELECT * FROM pg_statistic_ext',
        'transforms' => 'SELECT * FROM pg_transform',
        'user_access_methods' => 'SELECT * FROM pg_am WHERE oid>=16384',
        'user_tablespaces' => "SELECT * FROM pg_tablespace WHERE spcname NOT IN ('pg_default','pg_global') AND oid IN (SELECT reltablespace FROM pg_class WHERE reltablespace<>0)",
        'user_operators' => 'SELECT * FROM pg_operator WHERE oid>=16384',
        'user_opclasses' => 'SELECT * FROM pg_opclass WHERE oid>=16384',
        'user_opfamilies' => 'SELECT * FROM pg_opfamily WHERE oid>=16384',
        'user_casts' => 'SELECT * FROM pg_cast WHERE oid>=16384',
        'user_conversions' => 'SELECT * FROM pg_conversion WHERE oid>=16384',
        'user_text_configs' => 'SELECT * FROM pg_ts_config WHERE oid>=16384',
        'user_text_dicts' => 'SELECT * FROM pg_ts_dict WHERE oid>=16384',
        'user_text_parsers' => 'SELECT * FROM pg_ts_parser WHERE oid>=16384',
        'user_text_templates' => 'SELECT * FROM pg_ts_template WHERE oid>=16384',
        'user_collations' => "SELECT * FROM pg_collation WHERE oid>=16384 OR collnamespace<>'pg_catalog'::regnamespace",
        'system_relations' => "SELECT c.* FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('pg_catalog','information_schema') AND c.oid>=16384",
        'system_routines' => "SELECT p.* FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('pg_catalog','information_schema') AND p.oid>=16384",
        'system_types' => "SELECT t.* FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname IN ('pg_catalog','information_schema') AND t.oid>=16384",
        'unsupported_rules' => "SELECT r.* FROM pg_rewrite r JOIN pg_class c ON c.oid=r.ev_class JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname !~ '^pg_' AND n.nspname<>'information_schema'",
        'temporary_objects' => "SELECT c.oid,c.relname,c.relnamespace FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname LIKE 'pg_temp_%' AND c.relkind NOT IN ('i','I')",
    ];

    public function snapshot(): array
    {
        $out = [];
        foreach (self::UNSUPPORTED as $name => $query) {
            // Sensitive foreign options/subscription strings are never returned or printed.
            $row = DB::selectOne("WITH objects AS ($query), bounded AS (SELECT to_jsonb(o)::text AS value FROM objects o LIMIT 256)
                SELECT (SELECT count(*) FROM objects) AS count,md5(coalesce((SELECT string_agg(value,'|' ORDER BY value) FROM bounded),'')) AS digest");
            $out[$name] = [(int) $row->count, $row->digest];
        }

        return $out;
    }

    public function verify(): void
    {
        if (! in_array((int) DB::selectOne("SELECT current_setting('server_version_num') AS version")->version, [160015, 160016], true)) {
            throw new RuntimeException('Unqualified PostgreSQL catalog version.');
        }
        if (DB::selectOne("SELECT current_setting('allow_system_table_mods') AS value")->value !== 'off') {
            throw new RuntimeException('System catalog modification mode is unsupported.');
        }
        foreach ($this->snapshot() as $name => $state) {
            if ($state[0] !== 0) {
                throw new RuntimeException('Unsupported ONE TALIBON PG16 object family: '.$name);
            }
        }
        // Stock built-ins are supplied by the trusted PG16 runtime. Explicit system-schema ACL
        // changes or definitions added by normal OIDs are not accepted application extensions.
        if (DB::selectOne("SELECT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname IN ('pg_catalog','information_schema') AND nspowner<>10)
            OR EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
              WHERE n.nspname IN ('pg_catalog','information_schema') AND p.proowner<>10)
            OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
              WHERE n.nspname IN ('pg_catalog','information_schema') AND c.relowner<>10) AS drift")->drift) {
            throw new RuntimeException('Unsupported system-schema ownership deviation.');
        }
    }
}
