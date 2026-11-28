-- KIRION FORGE / G1B operational privilege candidate (DISPOSABLE PG16 ONLY).
-- This is not a production migration or an approved municipal privilege policy.
\set ON_ERROR_STOP on
\if :{?KIRION_G1B_DISPOSABLE_LEASE}
\else
  \echo 'REFUSING: KIRION_G1B_DISPOSABLE_LEASE is required'
  SELECT 1 / 0;
\endif

BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';
SELECT set_config('kirion.g1b_disposable_lease', :'KIRION_G1B_DISPOSABLE_LEASE', true);

DO $guard$
DECLARE role_count integer; function_count integer;
BEGIN
  IF current_database() <> 'talibon_portal_test'
     OR current_setting('server_version_num')::integer NOT BETWEEN 160000 AND 169999
     OR current_setting('is_superuser') <> 'on'
     OR current_setting('kirion.g1b_disposable_lease', true)
        IS DISTINCT FROM 'EXCLUSIVE_PG16_TMPFS_QA_ONLY' THEN
    RAISE EXCEPTION 'G1B requires the leased disposable PG16 database';
  END IF;
  SELECT count(*) INTO role_count FROM pg_roles WHERE rolname LIKE 'kirion_g1b_%';
  IF role_count <> 0 THEN
    RAISE EXCEPTION 'G1B role collision: refusing to alter existing roles';
  END IF;
  IF to_regclass('public.documents') IS NULL
     OR to_regclass('public.plan_document_bindings') IS NULL THEN
    RAISE EXCEPTION 'G1B requires the fully migrated G2F schema';
  END IF;
  SELECT count(*) INTO function_count FROM pg_proc
   WHERE pronamespace = 'public'::regnamespace AND pronargs = 0
     AND prorettype = 'trigger'::regtype AND proname IN
       ('kirion_plan_document_guard','kirion_plan_origin_receipt_guard',
        'kirion_plan_stamp_origin','kirion_plan_generic_link_guard',
        'kirion_plan_typed_binding_guard');
  IF function_count <> 5 THEN
    RAISE EXCEPTION 'Expected five Plan trigger functions, found %', function_count;
  END IF;
END $guard$;

\ir ../../../database/deployment/g1b.sql
SELECT format('ALTER ROLE kirion_g1b_migrator PASSWORD %L', :'G1B_MIGRATOR_PASSWORD') \gexec
SELECT format('ALTER ROLE kirion_g1b_app PASSWORD %L', :'G1B_APP_PASSWORD') \gexec
SELECT format('ALTER ROLE kirion_g1b_custody PASSWORD %L', :'G1B_CUSTODY_PASSWORD') \gexec

COMMIT;
SELECT 'G1B_DISPOSABLE_ROLE_POLICY_INSTALLED' AS result;
