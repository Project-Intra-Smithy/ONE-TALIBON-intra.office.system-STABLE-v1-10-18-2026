<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public $withinTransaction = true;

    public function up(): void
    {
        if (! app()->environment('testing')
            || getenv('N03_DISPOSABLE_LEASE') !== 'EXCLUSIVE_PG16_SYNTHETIC_ONLY'
            || DB::getDriverName() !== 'pgsql'
            || DB::connection()->getDatabaseName() !== 'talibon_portal_test') {
            throw new RuntimeException('OPS009 G2B audit compatibility requires an exclusive synthetic PG16 testing lease.');
        }

        DB::transaction(static function (): void {
            $guard = DB::selectOne(<<<'SQL'
                SELECT current_database() AS database_name,
                       current_setting('server_version_num')::integer AS version_number,
                       current_setting('is_superuser') AS superuser,
                       session_user AS session_role,
                       current_user AS execution_role,
                       (SELECT count(*) FROM pg_catalog.pg_roles
                         WHERE rolname IN ('n03_stage','n03_command','n03_reconcile')
                           AND rolcanlogin AND NOT rolsuper) AS ordinary_roles,
                       (SELECT count(*) FROM pg_catalog.pg_trigger
                         WHERE tgrelid='public.audit_logs'::regclass
                           AND tgname='a_n03_public_guard'
                           AND NOT tgisinternal AND tgenabled='O'
                           AND tgfoid='legacy_custody.public_guard()'::regprocedure) AS audit_trigger_count,
                       (SELECT count(*) FROM pg_catalog.pg_constraint
                         WHERE conrelid='public.audit_logs'::regclass
                           AND conname IN ('n03_audit_marked','n03_audit_document')) AS document_audit_constraints,
                       (SELECT count(*) FROM pg_catalog.pg_constraint
                         WHERE conrelid='legacy_custody.command_results'::regclass
                           AND conname='n03_command_results_unique_transaction_event') AS g2b_unique_event,
                       (SELECT count(*) FROM public.migrations
                         WHERE migration='2026_11_22_150000_ops009_close_command_compatibility') AS close_schema_migrated,
                       (SELECT count(*) FROM public.migrations
                         WHERE migration='2026_11_20_010000_extend_legacy_custody_g2b_command_provenance') AS g2b_migrated
                SQL);

            if ($guard === null
                || $guard->database_name !== 'talibon_portal_test'
                || (int) $guard->version_number < 160000
                || (int) $guard->version_number >= 170000
                || $guard->superuser !== 'on'
                || $guard->session_role !== 'postgres'
                || $guard->execution_role !== 'postgres'
                || (int) $guard->ordinary_roles !== 3
                || (int) $guard->audit_trigger_count !== 1
                || (int) $guard->document_audit_constraints !== 2
                || (int) $guard->g2b_unique_event !== 1
                || (int) $guard->close_schema_migrated !== 1
                || (int) $guard->g2b_migrated !== 1) {
                throw new RuntimeException('OPS009 G2B audit compatibility refused disposable role, schema or migration drift.');
            }

            // A PostgreSQL 16 serialization lock for exact installed-function
            // verification, then atomic replacement in the same transaction.
            DB::statement('LOCK TABLE public.audit_logs IN ACCESS EXCLUSIVE MODE');

            $installed = DB::selectOne(<<<'SQL'
                SELECT p.prosrc AS body,
                       pg_get_functiondef(p.oid) AS definition,
                       pg_get_userbyid(p.proowner) AS owner_name,
                       pg_get_userbyid(n.nspowner) AS schema_owner,
                       pg_get_userbyid(t.relowner) AS audit_table_owner,
                       p.prosecdef AS security_definer,
                       p.provolatile AS volatility,
                       p.pronargs AS argument_count,
                       p.proacl::text AS grant_list,
                       p.proconfig::text AS function_settings
                  FROM pg_catalog.pg_proc p
                  JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
                  JOIN pg_catalog.pg_class t ON t.oid='public.audit_logs'::regclass
                 WHERE p.oid='legacy_custody.public_guard()'::regprocedure
                   AND n.nspname='legacy_custody'
                SQL);

            $canonical = <<<'G2B_EXPECTED'
DECLARE d record; aid bigint; op uuid; old_marked boolean:=false; new_marked boolean:=false;
BEGIN
 IF TG_TABLE_NAME='documents' THEN
  IF TG_OP<>'INSERT' THEN old_marked:=OLD.custody_mode='REGISTRY_V1' OR OLD.custody_operation_id IS NOT NULL; END IF;
  IF TG_OP<>'DELETE' THEN new_marked:=NEW.custody_mode='REGISTRY_V1' OR NEW.custody_operation_id IS NOT NULL OR NEW.custody_ordinal IS NOT NULL OR NEW.storage_disk='legacy_registry_v1'; END IF;
  IF TG_OP='UPDATE' AND current_user='n03_command' THEN RAISE EXCEPTION 'document lock only' USING ERRCODE='23514'; END IF;
  IF old_marked OR new_marked OR current_user='n03_command' THEN
   IF TG_OP<>'INSERT' OR current_user<>'n03_command' OR NOT new_marked THEN RAISE EXCEPTION 'registry document immutable' USING ERRCODE='23514'; END IF;
   PERFORM legacy_custody.lock_pending(NEW.custody_operation_id,1,'OPEN');
   IF NOT EXISTS(SELECT 1 FROM legacy_custody.command_results WHERE operation_id=NEW.custody_operation_id) THEN RAISE EXCEPTION 'result required' USING ERRCODE='23514'; END IF;
  END IF;
 ELSIF TG_TABLE_NAME='audit_logs' THEN
  IF TG_OP<>'INSERT' THEN old_marked:=OLD.custody_operation_id IS NOT NULL; END IF;
  IF TG_OP<>'DELETE' THEN new_marked:=NEW.custody_operation_id IS NOT NULL; END IF;
  IF old_marked OR new_marked OR current_user='n03_command' THEN
   IF TG_OP='INSERT' AND current_user='n03_command' AND NOT new_marked THEN
    IF NEW.entity_type IS NULL
    OR NEW.action IS NULL
    OR NEW.entity_type='document'
    OR NEW.action='document.uploaded'
    OR NEW.outcome IS DISTINCT FROM 'allowed'
    OR NEW.integration_client_id IS NOT NULL
    OR NEW.entity_id IS NULL
    OR NEW.actor_user_id IS NULL
    OR NEW.actor_department_id IS NULL
    OR NEW.correlation_id IS NULL
    OR (
     (NEW.entity_type, NEW.action) IN (
      ('travel_order','travel_order.recorded'),
      ('travel_order','travel_order.status_changed'),
      ('transaction','transaction.created'),
      ('transaction','transaction.transitioned'),
      ('App\Models\WorkflowTransaction','transaction.created'),
      ('correspondence_record','correspondence.registered'),
      ('correspondence_record','correspondence.classified'),
      ('correspondence_record','correspondence.routed'),
      ('correspondence_record','correspondence.in_action')
     )
     OR (
      NEW.entity_type='App\Models\WorkflowTransaction'
      AND NEW.action IN (
       'transaction.forward',
       'transaction.send_to_mayor',
       'transaction.return_origin',
       'transaction.request_information',
       'transaction.assign',
       'transaction.mark_review',
       'transaction.approve',
       'transaction.disapprove'
      )
     )
    ) IS NOT TRUE THEN
     RAISE EXCEPTION 'marked audit immutable' USING ERRCODE='23514';
    END IF;
   ELSE
    IF TG_OP<>'INSERT' OR current_user<>'n03_command' OR NOT new_marked THEN RAISE EXCEPTION 'marked audit immutable' USING ERRCODE='23514'; END IF;
    PERFORM legacy_custody.lock_pending(NEW.custody_operation_id,1,'OPEN');
   END IF;
  END IF;
 ELSE
  -- This trigger sorts before the inherited kirion_plan_generic_link_guard.
  -- For a command insert acquire the operation gate BEFORE the document lock.
  IF current_user='n03_command' THEN
   IF TG_OP<>'INSERT' THEN RAISE EXCEPTION 'link immutable' USING ERRCODE='23514'; END IF;
   SELECT custody_operation_id INTO op FROM public.documents WHERE id=NEW.document_id AND custody_mode='REGISTRY_V1';
   IF op IS NULL THEN RAISE EXCEPTION 'registry link required' USING ERRCODE='23514'; END IF;
   PERFORM legacy_custody.lock_pending(op,1,'OPEN');
  END IF;
  FOR aid IN SELECT DISTINCT id FROM (SELECT CASE WHEN TG_OP<>'INSERT' THEN OLD.document_id END AS id
   UNION ALL SELECT CASE WHEN TG_OP<>'DELETE' THEN NEW.document_id END) ids WHERE id IS NOT NULL ORDER BY id LOOP
   SELECT id,custody_mode,custody_operation_id INTO d FROM public.documents WHERE id=aid FOR UPDATE;
   IF FOUND AND d.custody_mode='REGISTRY_V1' THEN
    IF current_user<>'n03_command' OR TG_OP<>'INSERT' OR d.custody_operation_id IS DISTINCT FROM op THEN
     RAISE EXCEPTION 'registry link immutable' USING ERRCODE='23514'; END IF;
    IF NOT EXISTS(SELECT 1 FROM legacy_custody.expected_links(op) x WHERE x.linkable_type=NEW.linkable_type AND x.source_id=NEW.linkable_id AND x.relationship=NEW.relationship)
    OR NEW.created_by_user_id IS DISTINCT FROM (SELECT actor_user_id FROM legacy_custody.operations WHERE operation_id=op) THEN
     RAISE EXCEPTION 'link tuple mismatch' USING ERRCODE='23514'; END IF;
   ELSIF current_user='n03_command' THEN RAISE EXCEPTION 'registry link required' USING ERRCODE='23514';
   END IF;
  END LOOP;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END
G2B_EXPECTED;

            if ($installed === null
                || $installed->owner_name !== 'postgres'
                || $installed->schema_owner !== 'postgres'
                || $installed->audit_table_owner !== 'postgres'
                || (bool) $installed->security_definer
                || $installed->volatility !== 'v'
                || (int) $installed->argument_count !== 0
                || ! str_contains((string) $installed->function_settings, 'search_path=pg_catalog')
                || trim(str_replace("\r\n", "\n", (string) $installed->body)) !== trim($canonical)
                || ! str_contains((string) $installed->definition, 'SECURITY INVOKER')) {
                throw new RuntimeException('OPS009 G2B audit compatibility refused noncanonical installed public_guard.');
            }

            if (substr_count($canonical, "'transaction.disapprove'") !== 1
                || str_contains($canonical, "'transaction.close'")) {
                throw new RuntimeException('OPS009 G2B audit compatibility source anchor mismatch.');
            }
            $updated = str_replace(
                "'transaction.disapprove'",
                "'transaction.disapprove',\n        'transaction.close'",
                $canonical,
            );

            // CREATE OR REPLACE preserves the function OID, existing triggers,
            // owner and grants; the only source-text difference is this action.
            DB::unprepared('CREATE OR REPLACE FUNCTION legacy_custody.public_guard() RETURNS trigger '
                .'LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $f$'
                ."\n".$updated."\n".'$f$;');

            $after = DB::selectOne(<<<'SQL'
                SELECT p.prosrc AS body,
                       pg_get_userbyid(p.proowner) AS owner_name,
                       p.proacl::text AS grant_list,
                       p.proconfig::text AS function_settings
                  FROM pg_catalog.pg_proc p
                 WHERE p.oid='legacy_custody.public_guard()'::regprocedure
                SQL);

            if ($after === null
                || trim(str_replace("\r\n", "\n", (string) $after->body)) !== trim($updated)
                || $after->owner_name !== $installed->owner_name
                || $after->grant_list !== $installed->grant_list
                || $after->function_settings !== $installed->function_settings) {
                throw new RuntimeException('OPS009 G2B public_guard postcondition failed; transaction rollback required.');
            }
        });
    }

    public function down(): void
    {
        throw new RuntimeException('OPS009 G2B audit compatibility is forward-only; dispose the synthetic database.');
    }
};
