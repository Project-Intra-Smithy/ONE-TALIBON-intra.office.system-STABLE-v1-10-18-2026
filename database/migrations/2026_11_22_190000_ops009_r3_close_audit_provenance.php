<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public $withinTransaction = true;

    public function up(): void
    {
        // R3 experimental candidate only, never a production upgrade path.
        if (! app()->environment('testing')
            || getenv('N03_DISPOSABLE_LEASE') !== 'EXCLUSIVE_PG16_SYNTHETIC_ONLY'
            || DB::getDriverName() !== 'pgsql'
            || DB::connection()->getDatabaseName() !== 'talibon_portal_test') {
            throw new RuntimeException('OPS009 R3 audit provenance requires an exclusive disposable PG16 testing lease.');
        }

        DB::transaction(static function (): void {
            $identity = DB::selectOne(<<<'SQL'
                SELECT current_database() AS database_name,
                       current_setting('server_version_num')::integer AS pg_version,
                       current_setting('is_superuser') AS superuser,
                       session_user AS session_role,
                       current_user AS execution_role,
                       pg_get_userbyid(n.nspowner) AS custody_owner,
                       pg_get_userbyid(f.proowner) AS function_owner,
                       pg_get_userbyid(a.relowner) AS audit_owner,
                       f.prosecdef AS security_definer,
                       f.proconfig::text AS function_settings,
                       f.prosrc AS installed_function,
                       (SELECT count(*) FROM pg_catalog.pg_roles
                         WHERE rolname IN ('n03_stage','n03_command','n03_reconcile')
                           AND rolcanlogin AND NOT rolsuper) AS ordinary_role_count,
                       (SELECT count(*) FROM pg_catalog.pg_constraint
                         WHERE conrelid='public.audit_logs'::regclass
                           AND conname IN ('n03_audit_marked','n03_audit_document')) AS marked_constraints,
                       (SELECT count(*) FROM pg_catalog.pg_trigger
                         WHERE tgrelid='public.audit_logs'::regclass
                           AND tgname='a_n03_public_guard' AND tgenabled='O') AS original_trigger,
                       (SELECT count(*) FROM public.migrations
                         WHERE migration IN (
                           '2026_11_22_150000_ops009_close_command_compatibility',
                           '2026_11_22_170000_ops009_g2b_close_audit_compatibility'
                         )) AS predecessor_migrations,
                       to_regclass('public.ops009_close_audit_bindings') IS NULL AS table_absent,
                       to_regprocedure('public.ops009_verify_close_audit()') IS NULL AS function_absent
                  FROM pg_catalog.pg_namespace n
                  JOIN pg_catalog.pg_proc f ON f.pronamespace=n.oid
                  CROSS JOIN pg_catalog.pg_class a
                 WHERE n.nspname='legacy_custody'
                   AND f.oid='legacy_custody.public_guard()'::regprocedure
                   AND a.oid='public.audit_logs'::regclass
                SQL);
            if ($identity === null
                || $identity->database_name !== 'talibon_portal_test'
                || (int) $identity->pg_version < 160000
                || (int) $identity->pg_version >= 170000
                || $identity->superuser !== 'on'
                || $identity->session_role !== 'postgres'
                || $identity->execution_role !== 'postgres'
                || $identity->custody_owner !== 'kirion_g1b_owner'
                || $identity->function_owner !== 'kirion_g1b_owner'
                || $identity->audit_owner !== 'kirion_g1b_owner'
                || (bool) $identity->security_definer
                || ! str_contains((string) $identity->function_settings, 'search_path=pg_catalog')
                || ! str_contains((string) $identity->installed_function, "'transaction.close'")
                || (int) $identity->ordinary_role_count !== 3
                || (int) $identity->marked_constraints !== 2
                || (int) $identity->original_trigger !== 1
                || (int) $identity->predecessor_migrations !== 2
                || ! $identity->table_absent
                || ! $identity->function_absent) {
                throw new RuntimeException('OPS009 R3 provenance refused unexpected owner, G2B, document-guard or lease state.');
            }

            DB::unprepared(<<<'SQL'
                -- Sidecar is separate from the document-only custody_operation_id
                -- on public.audit_logs. Its UNIQUE keys forbid replay or duplicate
                -- bindings for an audit, source event, business transaction or op.
                CREATE TABLE public.ops009_close_audit_bindings (
                    audit_id bigint PRIMARY KEY REFERENCES public.audit_logs(id) ON DELETE RESTRICT,
                    transaction_event_id bigint NOT NULL UNIQUE REFERENCES public.transaction_events(id) ON DELETE RESTRICT,
                    transaction_id bigint NOT NULL UNIQUE REFERENCES public.transactions(id) ON DELETE RESTRICT,
                    operation_id uuid NOT NULL UNIQUE REFERENCES legacy_custody.operations(operation_id) ON DELETE RESTRICT
                );

                -- The audit is inserted BEFORE command_results and terminal_receipts.
                -- Thus the verification must run at end of the SAME transaction.
                CREATE FUNCTION public.ops009_verify_close_audit() RETURNS trigger
                LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $guard$
                DECLARE matches integer;
                BEGIN
                    IF current_user <> 'n03_command' OR session_user <> 'n03_command' THEN
                        RETURN NULL; -- Ordinary Eloquent audit remains unaffected.
                    END IF;
                    IF TG_OP <> 'INSERT'
                       OR NEW.custody_operation_id IS NOT NULL
                       OR NEW.outcome IS DISTINCT FROM 'allowed'
                       OR NEW.integration_client_id IS NOT NULL THEN
                        RAISE EXCEPTION 'OPS009 close audit provenance rejected noncanonical row' USING ERRCODE='23514';
                    END IF;

                    SELECT count(*) INTO matches
                    FROM public.ops009_close_audit_bindings b
                    JOIN legacy_custody.operations o ON o.operation_id=b.operation_id
                    JOIN legacy_custody.operation_gates g ON g.operation_id=o.operation_id
                    JOIN legacy_custody.command_results cr ON cr.operation_id=o.operation_id
                    JOIN legacy_custody.terminal_receipts tr ON tr.operation_id=o.operation_id
                    JOIN public.transaction_events ev ON ev.id=b.transaction_event_id
                    JOIN public.transactions tx ON tx.id=b.transaction_id
                    JOIN public.users u ON u.id=o.actor_user_id
                    JOIN public.employees emp ON emp.user_id=o.actor_user_id
                    JOIN public.departments dep ON dep.id=o.office_id
                    WHERE b.audit_id=NEW.id
                      AND b.transaction_id=NEW.entity_id
                      AND NEW.entity_type='App\Models\WorkflowTransaction'
                      AND NEW.action='transaction.close'
                      AND NEW.actor_user_id=o.actor_user_id
                      AND NEW.actor_department_id=o.office_id
                      AND NEW.correlation_id=o.correlation_id
                      AND o.command_kind='transaction_transition'
                      AND o.command_action='close'
                      AND g.state='OPEN' AND g.fence_no=1
                      AND cr.fence_no=1
                      AND cr.source_kind='transaction'
                      AND cr.source_id=b.transaction_id
                      AND cr.transaction_event_id=b.transaction_event_id
                      AND cr.event_action='close'
                      AND cr.actor_user_id=o.actor_user_id
                      AND cr.office_id=o.office_id
                      AND cr.correlation_id=o.correlation_id
                      AND tr.outcome='COMMITTED'
                      AND tr.fence_no=1
                      AND tr.actor_user_id=o.actor_user_id
                      AND tr.manifest_digest=o.manifest_digest
                      AND tr.service_identity=o.service_identity
                      AND tr.evidence_ref='n03-g2b:transaction:'||b.transaction_id::text||':'||b.transaction_event_id::text
                      AND ev.transaction_id=b.transaction_id
                      AND ev.actor_user_id=o.actor_user_id
                      AND ev.action='close'
                      AND ev.from_department_id=o.office_id
                      AND ev.to_department_id=o.office_id
                      AND ev.new_status=tx.status
                      AND tx.status='closed'
                      AND tx.completed_at IS NOT NULL
                      AND tx.current_department_id=o.office_id
                      AND u.role='department_head' AND u.is_active AND u.account_status='active'
                      AND emp.department_id=o.office_id AND emp.employment_status='active'
                      AND dep.is_active AND dep.is_routable;
                    IF matches <> 1 THEN
                        RAISE EXCEPTION 'OPS009 close audit event-operation-receipt provenance invalid' USING ERRCODE='23514';
                    END IF;
                    RETURN NULL;
                END $guard$;

                CREATE CONSTRAINT TRIGGER ops009_close_audit_integrity
                    AFTER INSERT ON public.audit_logs
                    DEFERRABLE INITIALLY DEFERRED
                    FOR EACH ROW
                    WHEN (NEW.custody_operation_id IS NULL
                          AND NEW.entity_type='App\Models\WorkflowTransaction'
                          AND NEW.action='transaction.close')
                    EXECUTE FUNCTION public.ops009_verify_close_audit();

                ALTER TABLE public.ops009_close_audit_bindings OWNER TO kirion_g1b_owner;
                ALTER FUNCTION public.ops009_verify_close_audit() OWNER TO kirion_g1b_owner;
                REVOKE ALL ON TABLE public.ops009_close_audit_bindings FROM PUBLIC;
                REVOKE ALL ON FUNCTION public.ops009_verify_close_audit() FROM PUBLIC;
                GRANT SELECT (audit_id,transaction_event_id,transaction_id,operation_id),
                      INSERT (audit_id,transaction_event_id,transaction_id,operation_id)
                  ON TABLE public.ops009_close_audit_bindings TO n03_command;
                SQL);

            $post = DB::selectOne(<<<'SQL'
                SELECT
                    (SELECT count(*) FROM pg_catalog.pg_trigger
                      WHERE tgrelid='public.audit_logs'::regclass
                        AND tgname='ops009_close_audit_integrity'
                        AND tgdeferrable AND tginitdeferred
                        AND tgenabled='O') AS deferred_trigger,
                    (SELECT count(*) FROM pg_catalog.pg_constraint
                      WHERE conrelid='public.audit_logs'::regclass
                        AND conname IN ('n03_audit_marked','n03_audit_document')) AS original_constraints,
                    pg_get_userbyid(c.relowner) AS sidecar_owner,
                    has_table_privilege('n03_command','public.ops009_close_audit_bindings','INSERT') AS can_insert,
                    has_table_privilege('n03_command','public.ops009_close_audit_bindings','SELECT') AS can_read,
                    has_table_privilege('n03_command','public.ops009_close_audit_bindings','UPDATE') AS can_update,
                    has_table_privilege('n03_command','public.ops009_close_audit_bindings','DELETE') AS can_delete
                FROM pg_catalog.pg_class c
                WHERE c.oid='public.ops009_close_audit_bindings'::regclass
                SQL);
            if ($post === null
                || (int) $post->deferred_trigger !== 1
                || (int) $post->original_constraints !== 2
                || $post->sidecar_owner !== 'kirion_g1b_owner'
                || ! $post->can_insert || ! $post->can_read
                || $post->can_update || $post->can_delete) {
                throw new RuntimeException('OPS009 R3 provenance DDL postcondition failed.');
            }
        });
    }

    public function down(): void
    {
        throw new RuntimeException('OPS009 R3 provenance spike is forward-only; discard the disposable PG16 database.');
    }
};
