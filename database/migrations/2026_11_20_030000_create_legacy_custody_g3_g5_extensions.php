<?php

declare(strict_types=1);

use App\Deployment\PersistentInstaller;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (! PersistentInstaller::active() && (! app()->environment('testing')
            || getenv('N03_DISPOSABLE_LEASE') !== 'EXCLUSIVE_PG16_SYNTHETIC_ONLY'
            || DB::getDriverName() !== 'pgsql'
            || DB::connection()->getDatabaseName() !== 'talibon_portal_test')) {
            throw new RuntimeException('N03 G3-G5 requires a leased synthetic PG16 database.');
        }

        $guard = DB::selectOne(
            "SELECT current_database() AS db,
                    current_setting('server_version_num')::integer AS version,
                    current_setting('is_superuser') AS bootstrap,
                    to_regnamespace('legacy_custody') IS NOT NULL AS schema_present,
                    to_regclass('legacy_custody.bindings') IS NOT NULL AS bindings_present,
                    to_regclass('legacy_custody.watermark_checkpoints') IS NULL AS watermarks_absent,
                    to_regclass('legacy_custody.classification_events') IS NULL AS classifications_absent"
        );

        if ($guard->db !== PersistentInstaller::database()
            || $guard->version < 160000
            || $guard->version >= 170000
            || $guard->bootstrap !== 'on'
            || ! $guard->schema_present
            || ! $guard->bindings_present
            || ! $guard->watermarks_absent
            || ! $guard->classifications_absent) {
            throw new RuntimeException('N03 G3-G5 migration environment or prerequisite schema drift.');
        }

        DB::unprepared(<<<'SQL'
CREATE TABLE legacy_custody.watermark_checkpoints (
 checkpoint_seq bigint PRIMARY KEY CHECK (checkpoint_seq > 0),
 namespace_id uuid NOT NULL REFERENCES legacy_custody.namespaces ON DELETE RESTRICT,
 epoch bigint NOT NULL CHECK (epoch > 0),
 event_kind text NOT NULL CHECK (event_kind IN (
  'AUTHORITY_REVOKE',
  'OPERATION_COMMIT',
  'OPERATION_ABORT',
  'COMPENSATION_TOMBSTONE',
  'EPOCH_ADVANCE'
 )),
 state_anchor_digest text NOT NULL CHECK (state_anchor_digest ~ '^[0-9a-f]{64}$'),
 actor_user_id bigint REFERENCES public.users ON DELETE RESTRICT,
 recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX n03_watermark_checkpoints_ns_seq
 ON legacy_custody.watermark_checkpoints (namespace_id, checkpoint_seq DESC);

CREATE TABLE legacy_custody.classification_events (
 classification_event_id uuid PRIMARY KEY,
 document_id bigint NOT NULL REFERENCES legacy_custody.bindings(document_id) ON DELETE RESTRICT,
 correspondence_record_id bigint NOT NULL REFERENCES public.correspondence_records ON DELETE RESTRICT,
 correspondence_event_id bigint NOT NULL REFERENCES public.correspondence_events ON DELETE RESTRICT,
 prior_classification text NOT NULL CHECK (prior_classification IN ('public', 'internal', 'confidential', 'restricted')),
 new_classification text NOT NULL CHECK (new_classification IN ('public', 'internal', 'confidential', 'restricted')),
 actor_user_id bigint NOT NULL REFERENCES public.users ON DELETE RESTRICT,
 office_id bigint NOT NULL REFERENCES public.departments ON DELETE RESTRICT,
 correlation_id uuid NOT NULL,
 audit_log_id bigint NOT NULL UNIQUE REFERENCES public.audit_logs ON DELETE RESTRICT,
 occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX n03_classification_events_doc_occurred
 ON legacy_custody.classification_events (document_id, occurred_at DESC, classification_event_id DESC);

CREATE FUNCTION legacy_custody.g3_extensions_guard() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $f$
DECLARE
 max_seq bigint;
BEGIN
 IF TG_OP IN ('UPDATE', 'DELETE') THEN
  RAISE EXCEPTION 'immutable g3 custody tuple' USING ERRCODE='23514';
 END IF;

 IF current_setting('transaction_isolation') IS DISTINCT FROM 'read committed' THEN
  RAISE EXCEPTION 'unsupported custody isolation' USING ERRCODE='23514';
 END IF;

 IF TG_TABLE_NAME = 'watermark_checkpoints' THEN
  IF current_user IS DISTINCT FROM 'n03_command' AND current_user IS DISTINCT FROM 'n03_reconcile' THEN
   RAISE EXCEPTION 'watermark checkpoint role required' USING ERRCODE='42501';
  END IF;

  IF NEW.namespace_id IS NULL OR NEW.checkpoint_seq IS NULL OR NEW.epoch IS NULL THEN
   RAISE EXCEPTION 'invalid watermark checkpoint tuple' USING ERRCODE='23514';
  END IF;

  SELECT COALESCE(MAX(checkpoint_seq), 0) INTO max_seq
  FROM legacy_custody.watermark_checkpoints
  WHERE namespace_id = NEW.namespace_id;

  IF NEW.checkpoint_seq <= max_seq THEN
   RAISE EXCEPTION 'non-monotonic watermark checkpoint_seq' USING ERRCODE='23514';
  END IF;

  RETURN NEW;
 ELSIF TG_TABLE_NAME = 'classification_events' THEN
  IF current_user IS DISTINCT FROM 'n03_command' THEN
   RAISE EXCEPTION 'command role required' USING ERRCODE='42501';
  END IF;

  IF NEW.document_id IS NULL
   OR NEW.correspondence_record_id IS NULL
   OR NEW.correspondence_event_id IS NULL
   OR NEW.actor_user_id IS NULL
   OR NEW.office_id IS NULL
   OR NEW.correlation_id IS NULL
   OR NEW.audit_log_id IS NULL THEN
   RAISE EXCEPTION 'invalid classification event tuple' USING ERRCODE='23514';
  END IF;

  IF NOT EXISTS (
   SELECT 1
   FROM public.correspondence_events ce
   WHERE ce.id = NEW.correspondence_event_id
     AND ce.correspondence_record_id = NEW.correspondence_record_id
     AND ce.event = 'classified'
     AND ce.actor_user_id = NEW.actor_user_id
     AND ce.office_department_id = NEW.office_id
     AND ce.correlation_id = NEW.correlation_id
     AND ce.n03_municipal_actor IS TRUE
  )
  OR NOT EXISTS (
   SELECT 1
   FROM public.audit_logs a
   WHERE a.id = NEW.audit_log_id
     AND a.entity_type = 'correspondence_record'
     AND a.entity_id = NEW.correspondence_record_id
     AND a.action = 'correspondence.classified'
     AND a.outcome = 'allowed'
     AND a.actor_user_id = NEW.actor_user_id
     AND a.actor_department_id = NEW.office_id
     AND a.correlation_id = NEW.correlation_id
     AND a.integration_client_id IS NULL
  ) THEN
   RAISE EXCEPTION 'classification event provenance mismatch' USING ERRCODE='23514';
  END IF;

  RETURN NEW;
 END IF;

 RAISE EXCEPTION 'unexpected g3 custody table' USING ERRCODE='23514';
END $f$;

CREATE TRIGGER n03_g3_immutable
 BEFORE INSERT OR UPDATE OR DELETE ON legacy_custody.watermark_checkpoints
 FOR EACH ROW EXECUTE FUNCTION legacy_custody.g3_extensions_guard();

CREATE TRIGGER n03_g3_immutable
 BEFORE INSERT OR UPDATE OR DELETE ON legacy_custody.classification_events
 FOR EACH ROW EXECUTE FUNCTION legacy_custody.g3_extensions_guard();

REVOKE ALL ON TABLE legacy_custody.watermark_checkpoints, legacy_custody.classification_events FROM PUBLIC;
REVOKE ALL ON FUNCTION legacy_custody.g3_extensions_guard() FROM PUBLIC;
SQL);
    }

    public function down(): void
    {
        throw new RuntimeException('N03 G3-G5 is forward-only; dispose the isolated database instead.');
    }
};
