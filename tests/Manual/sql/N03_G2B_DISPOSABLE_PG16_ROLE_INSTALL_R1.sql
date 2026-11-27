-- N03 G2B additive role delta installer (synthetic PG16 role cluster only).
-- Must run strictly AFTER N03_DISPOSABLE_PG16_ROLE_INSTALL_R1.sql and G2B migration.
\set ON_ERROR_STOP on
\if :{?N03_DISPOSABLE_LEASE}
\else
  SELECT 1/0;
\endif
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='30s';
SELECT set_config('n03.lease', :'N03_DISPOSABLE_LEASE', true);
DO $guard$
BEGIN
 IF current_database()<>'talibon_portal_test'
 OR current_setting('server_version_num')::int NOT BETWEEN 160000 AND 169999
 OR current_setting('is_superuser')<>'on'
 OR current_setting('n03.lease',true) IS DISTINCT FROM 'EXCLUSIVE_PG16_SYNTHETIC_ONLY'
 OR to_regnamespace('legacy_custody') IS NULL
 OR NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='kirion_g1b_owner' AND NOT rolcanlogin AND NOT rolsuper)
 OR (SELECT count(*) FROM pg_roles WHERE rolname IN ('n03_stage','n03_command','n03_reconcile'))<>3
 OR (SELECT count(*) FROM pg_constraint
     WHERE conrelid='legacy_custody.command_results'::regclass
       AND contype='u'
       AND conname IN (
         'n03_command_results_unique_transaction_event',
         'n03_command_results_unique_correspondence_event',
         'n03_command_results_unique_travel_event'
       ))<>3
 THEN RAISE EXCEPTION 'N03 G2B installer prerequisites failed'; END IF;
END $guard$;

\ir ../../../database/deployment/g2b.sql

COMMIT;
SELECT 'N03_G2B_DISPOSABLE_INSTALL_COMPLETE' AS result;
