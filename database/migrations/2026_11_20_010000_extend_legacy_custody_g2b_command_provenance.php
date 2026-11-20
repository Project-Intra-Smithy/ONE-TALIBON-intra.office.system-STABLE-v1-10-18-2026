<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (! app()->environment('testing')
            || getenv('N03_DISPOSABLE_LEASE') !== 'EXCLUSIVE_PG16_SYNTHETIC_ONLY'
            || DB::getDriverName() !== 'pgsql'
            || DB::connection()->getDatabaseName() !== 'talibon_portal_test') {
            throw new RuntimeException('N03 G2B requires a leased synthetic PG16 database.');
        }

        $guard = DB::selectOne(
            "SELECT current_database() AS db, current_setting('server_version_num')::integer AS version, current_setting('is_superuser') AS bootstrap, to_regnamespace('legacy_custody') IS NOT NULL AS present, to_regclass('legacy_custody.command_results') IS NOT NULL AS command_results_present"
        );

        if ($guard->db !== 'talibon_portal_test'
            || $guard->version < 160000
            || $guard->version >= 170000
            || $guard->bootstrap !== 'on'
            || ! $guard->present
            || ! $guard->command_results_present) {
            throw new RuntimeException('N03 G2B migration environment or prerequisite schema drift.');
        }

        DB::unprepared(<<<'SQL'
ALTER TABLE legacy_custody.command_results
 ADD CONSTRAINT n03_command_results_unique_transaction_event UNIQUE (transaction_event_id),
 ADD CONSTRAINT n03_command_results_unique_correspondence_event UNIQUE (correspondence_event_id),
 ADD CONSTRAINT n03_command_results_unique_travel_event UNIQUE (travel_event_id);

CREATE OR REPLACE FUNCTION legacy_custody.public_guard() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $f$
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
END $f$;

REVOKE ALL ON FUNCTION legacy_custody.public_guard() FROM PUBLIC;
SQL);
    }

    public function down(): void
    {
        throw new RuntimeException('N03 G2B is forward-only; dispose the isolated database instead.');
    }
};
