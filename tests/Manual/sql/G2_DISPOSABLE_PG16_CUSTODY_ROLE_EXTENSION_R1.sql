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

REVOKE ALL ON public.plan_custody_generations,
  public.plan_custody_scan_evidence, public.plan_custody_events FROM PUBLIC;
REVOKE ALL ON public.plan_custody_generations,
  public.plan_custody_scan_evidence, public.plan_custody_events
  FROM kirion_g1b_app, kirion_g1b_repair;
REVOKE ALL ON SEQUENCE public.plan_custody_generations_id_seq,
  public.plan_custody_scan_evidence_id_seq, public.plan_custody_events_id_seq
  FROM PUBLIC, kirion_g1b_app, kirion_g1b_repair;

GRANT SELECT, INSERT ON public.plan_custody_generations,
  public.plan_custody_scan_evidence, public.plan_custody_events TO kirion_g1b_custody;
GRANT USAGE, SELECT ON SEQUENCE public.plan_custody_generations_id_seq,
  public.plan_custody_scan_evidence_id_seq, public.plan_custody_events_id_seq
  TO kirion_g1b_custody;

DO $verify$
DECLARE bad integer;
BEGIN
  IF has_table_privilege('kirion_g1b_app','public.plan_custody_generations','SELECT')
     OR has_table_privilege('kirion_g1b_app','public.plan_custody_events','INSERT')
     OR has_table_privilege('kirion_g1b_repair','public.plan_custody_generations','UPDATE')
     OR NOT has_table_privilege('kirion_g1b_custody','public.plan_custody_generations','SELECT')
     OR NOT has_table_privilege('kirion_g1b_custody','public.plan_custody_scan_evidence','INSERT')
     OR has_table_privilege('kirion_g1b_custody','public.plan_custody_generations','UPDATE')
     OR has_table_privilege('kirion_g1b_custody','public.plan_custody_events','DELETE') THEN
    RAISE EXCEPTION 'G2 custody role matrix violated';
  END IF;

  SELECT count(*) INTO bad FROM pg_proc p
   WHERE p.pronamespace='public'::regnamespace
     AND p.proname IN ('kirion_plan_custody_generation_guard',
       'kirion_plan_custody_append_only_guard','kirion_plan_custody_scan_guard')
     AND (p.proowner <> 'kirion_g1b_owner'::regrole OR p.prosecdef
       OR has_function_privilege('kirion_g1b_app',p.oid,'EXECUTE')
       OR has_function_privilege('kirion_g1b_custody',p.oid,'EXECUTE'));
  IF bad <> 0 THEN
    RAISE EXCEPTION 'G2 custody function owner/ACL boundary violated: %', bad;
  END IF;
END $verify$;

COMMIT;
SELECT 'G2_DISPOSABLE_CUSTODY_ROLE_EXTENSION_INSTALLED' AS result;
