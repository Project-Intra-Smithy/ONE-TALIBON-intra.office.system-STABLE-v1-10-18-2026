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
            throw new RuntimeException('N03 K2 requires a leased synthetic PG16 database.');
        }

        $guard = DB::selectOne(
            "SELECT current_database() AS db,
                    current_setting('server_version_num')::integer AS version,
                    current_setting('is_superuser') AS bootstrap,
                    to_regnamespace('legacy_custody') IS NOT NULL AS schema_present,
                    to_regclass('legacy_custody.generations') IS NOT NULL AS generations_present,
                    to_regclass('legacy_custody.compensation_tombstones') IS NULL AS tombstones_absent,
                    to_regclass('legacy_custody.compensation_outcomes') IS NULL AS outcomes_absent"
        );

        if ($guard->db !== PersistentInstaller::database()
            || $guard->version < 160000
            || $guard->version >= 170000
            || $guard->bootstrap !== 'on'
            || ! $guard->schema_present
            || ! $guard->generations_present
            || ! $guard->tombstones_absent
            || ! $guard->outcomes_absent) {
            throw new RuntimeException('N03 K2 migration environment or prerequisite schema drift.');
        }

        DB::unprepared(<<<'SQL'
ALTER TABLE legacy_custody.generations
 ADD CONSTRAINT n03_generation_compensation_tuple
 UNIQUE (operation_id, generation_id, namespace_id, locator, provider_object_identity);

CREATE TABLE legacy_custody.compensation_tombstones (
 tombstone_id uuid PRIMARY KEY,
 operation_id uuid NOT NULL REFERENCES legacy_custody.operations ON DELETE RESTRICT,
 generation_id uuid NOT NULL UNIQUE REFERENCES legacy_custody.generations ON DELETE RESTRICT,
 namespace_id uuid NOT NULL REFERENCES legacy_custody.namespaces ON DELETE RESTRICT,
 locator text NOT NULL CHECK (locator <> ''),
 provider_object_identity text NOT NULL CHECK (provider_object_identity <> ''),
 close_ack_id text NOT NULL CHECK (close_ack_id <> ''),
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY (operation_id, generation_id, namespace_id, locator, provider_object_identity)
  REFERENCES legacy_custody.generations (operation_id, generation_id, namespace_id, locator, provider_object_identity)
  ON DELETE RESTRICT
);

CREATE INDEX n03_compensation_tombstones_operation
 ON legacy_custody.compensation_tombstones (operation_id);

CREATE TABLE legacy_custody.compensation_outcomes (
 outcome_id uuid PRIMARY KEY,
 tombstone_id uuid NOT NULL UNIQUE REFERENCES legacy_custody.compensation_tombstones ON DELETE RESTRICT,
 disposition text NOT NULL CHECK (disposition IN ('DISPOSED', 'ABSENT_VERIFIED', 'QUARANTINED')),
 broker_receipt_ref text NOT NULL CHECK (broker_receipt_ref <> ''),
 recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE FUNCTION legacy_custody.k2_compensation_guard() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $f$
DECLARE op uuid;
BEGIN
 IF TG_OP IN ('UPDATE', 'DELETE') THEN
  RAISE EXCEPTION 'immutable compensation tuple' USING ERRCODE='23514';
 END IF;

 IF current_user <> 'n03_reconcile' THEN
  RAISE EXCEPTION 'reconcile role required' USING ERRCODE='42501';
 END IF;

 IF current_setting('transaction_isolation') <> 'read committed' THEN
  RAISE EXCEPTION 'unsupported custody isolation' USING ERRCODE='23514';
 END IF;

 IF TG_TABLE_NAME = 'compensation_tombstones' THEN
  PERFORM 1 FROM legacy_custody.operation_gates WHERE operation_id = NEW.operation_id FOR UPDATE;
  IF NOT FOUND
   OR NOT EXISTS (
    SELECT 1 FROM legacy_custody.operation_gates
    WHERE operation_id = NEW.operation_id AND state = 'CLOSED' AND fence_no = 2
   )
   OR NOT EXISTS (
    SELECT 1 FROM legacy_custody.terminal_receipts
    WHERE operation_id = NEW.operation_id AND outcome = 'ABORTED' AND fence_no = 2
      AND evidence_ref = NEW.close_ack_id
   )
   OR EXISTS (
    SELECT 1 FROM legacy_custody.terminal_receipts
    WHERE operation_id = NEW.operation_id AND outcome = 'COMMITTED'
   )
   OR legacy_custody.zero_artifacts(NEW.operation_id) IS NOT TRUE
  THEN
   RAISE EXCEPTION 'compensation tombstone precondition failed' USING ERRCODE='23514';
  END IF;
 ELSIF TG_TABLE_NAME = 'compensation_outcomes' THEN
  SELECT operation_id INTO op
  FROM legacy_custody.compensation_tombstones
  WHERE tombstone_id = NEW.tombstone_id;

  IF op IS NULL THEN
   RAISE EXCEPTION 'missing compensation tombstone' USING ERRCODE='23514';
  END IF;

  PERFORM 1 FROM legacy_custody.operation_gates WHERE operation_id = op FOR UPDATE;
  IF NOT FOUND
   OR NOT EXISTS (
    SELECT 1 FROM legacy_custody.operation_gates
    WHERE operation_id = op AND state = 'CLOSED' AND fence_no = 2
   )
   OR NOT EXISTS (
    SELECT 1 FROM legacy_custody.terminal_receipts
    WHERE operation_id = op AND outcome = 'ABORTED' AND fence_no = 2
   )
   OR EXISTS (
    SELECT 1 FROM legacy_custody.terminal_receipts
    WHERE operation_id = op AND outcome = 'COMMITTED'
   )
   OR legacy_custody.zero_artifacts(op) IS NOT TRUE
  THEN
   RAISE EXCEPTION 'compensation outcome precondition failed' USING ERRCODE='23514';
  END IF;
 ELSE
  RAISE EXCEPTION 'unexpected compensation table' USING ERRCODE='23514';
 END IF;

 RETURN NEW;
END $f$;

CREATE TRIGGER n03_k2_immutable
 BEFORE INSERT OR UPDATE OR DELETE ON legacy_custody.compensation_tombstones
 FOR EACH ROW EXECUTE FUNCTION legacy_custody.k2_compensation_guard();

CREATE TRIGGER n03_k2_immutable
 BEFORE INSERT OR UPDATE OR DELETE ON legacy_custody.compensation_outcomes
 FOR EACH ROW EXECUTE FUNCTION legacy_custody.k2_compensation_guard();

REVOKE ALL ON TABLE legacy_custody.compensation_tombstones, legacy_custody.compensation_outcomes FROM PUBLIC;
REVOKE ALL ON FUNCTION legacy_custody.k2_compensation_guard() FROM PUBLIC;
SQL);
    }

    public function down(): void
    {
        throw new RuntimeException('N03 K2 is forward-only; dispose the isolated database instead.');
    }
};
