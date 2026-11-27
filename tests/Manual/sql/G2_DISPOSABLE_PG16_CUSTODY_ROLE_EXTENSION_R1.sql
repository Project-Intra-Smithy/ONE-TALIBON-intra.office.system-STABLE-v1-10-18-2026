-- KIRION FORGE / G2 custody role extension (DISPOSABLE PG16 ONLY).
-- Run after migrations and G1B_DISPOSABLE_PG16_ROLE_INSTALL_R1.sql.
\set ON_ERROR_STOP on
\if :{?KIRION_G2_DISPOSABLE_LEASE}
\else
  \echo 'REFUSING: KIRION_G2_DISPOSABLE_LEASE is required'
  SELECT 1 / 0;
\endif

BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';
SELECT set_config('kirion.g2_disposable_lease', :'KIRION_G2_DISPOSABLE_LEASE', true);

DO $guard$
BEGIN
  IF current_database() <> 'talibon_portal_test'
     OR current_setting('server_version_num')::integer NOT BETWEEN 160000 AND 169999
     OR current_setting('is_superuser') <> 'on'
     OR current_setting('kirion.g2_disposable_lease', true)
        IS DISTINCT FROM 'EXCLUSIVE_G2_PG16_TMPFS_QA_ONLY' THEN
    RAISE EXCEPTION 'G2 requires the leased disposable PG16 database';
  END IF;
  IF to_regclass('public.plan_custody_generations') IS NULL
     OR to_regclass('public.plan_custody_scan_evidence') IS NULL
     OR to_regclass('public.plan_custody_events') IS NULL
     OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='kirion_g1b_owner') THEN
    RAISE EXCEPTION 'G2 requires the migrated schema and installed G1B roles';
  END IF;
END $guard$;

\ir ../../../database/deployment/g2.sql

COMMIT;
SELECT 'G2_DISPOSABLE_CUSTODY_ROLE_EXTENSION_INSTALLED' AS result;
