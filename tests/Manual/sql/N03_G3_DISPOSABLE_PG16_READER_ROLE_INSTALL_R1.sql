-- N03 G3 additive reader role & extension ACL installer (synthetic PG16 role cluster only).
-- Must run strictly AFTER G2A, G2B, K2 installers and G3-G5 migration.
\set ON_ERROR_STOP on
\if :{?N03_DISPOSABLE_LEASE}
\else
  SELECT 1/0;
\endif
\if :{?N03_READER_PASSWORD}
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
 OR to_regclass('legacy_custody.watermark_checkpoints') IS NULL
 OR to_regclass('legacy_custody.classification_events') IS NULL
 OR EXISTS(SELECT 1 FROM pg_roles WHERE rolname='n03_reader')
 OR NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='kirion_g1b_owner' AND NOT rolcanlogin AND NOT rolsuper)
 OR (SELECT count(*) FROM pg_roles WHERE rolname IN ('n03_stage','n03_command','n03_reconcile'))<>3
 THEN RAISE EXCEPTION 'N03 G3 installer prerequisites or role collision'; END IF;
END $guard$;

\ir ../../../database/deployment/g3.sql
SELECT format('ALTER ROLE n03_reader PASSWORD %L', :'N03_READER_PASSWORD') \gexec

COMMIT;
SELECT 'N03_G3_DISPOSABLE_READER_INSTALL_COMPLETE' AS result;
