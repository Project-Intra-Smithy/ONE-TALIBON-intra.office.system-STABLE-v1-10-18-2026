-- N03 K2 exact catalog proof verifier (synthetic PG16 role cluster only).
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL statement_timeout='30s';
DO $verify$
DECLARE
 r text;
 t text;
 a record;
 actual_tables text[];
 expected_tables text[] := ARRAY[
  'bindings',
  'command_results',
  'compensation_outcomes',
  'compensation_tombstones',
  'generations',
  'namespaces',
  'operation_events',
  'operation_gates',
  'operation_items',
  'operations',
  'ownership_links',
  'terminal_receipts'
 ];
BEGIN
 IF current_database()<>'talibon_portal_test'
 OR current_setting('server_version_num')::int NOT BETWEEN 160000 AND 169999
 OR current_setting('is_superuser')<>'on' THEN
  RAISE EXCEPTION 'unsafe K2 verifier';
 END IF;

 -- Verify K2 unique compensation tuple constraint on legacy_custody.generations.
 IF NOT EXISTS(
   SELECT 1 FROM pg_constraint
   WHERE conrelid='legacy_custody.generations'::regclass
     AND contype='u'
     AND conname='n03_generation_compensation_tuple'
 ) THEN
  RAISE EXCEPTION 'missing K2 generations unique compensation tuple constraint';
 END IF;

 -- Verify exact 12 tables and 8 functions in legacy_custody, all owned by kirion_g1b_owner, zero SECURITY DEFINER.
 SELECT array_agg(tablename::text ORDER BY tablename) INTO actual_tables
 FROM pg_tables WHERE schemaname='legacy_custody';

 IF actual_tables IS DISTINCT FROM expected_tables
 OR (SELECT nspowner FROM pg_namespace WHERE nspname='legacy_custody')<>'kirion_g1b_owner'::regrole
 OR EXISTS(SELECT 1 FROM pg_class WHERE relnamespace='legacy_custody'::regnamespace AND (relowner<>'kirion_g1b_owner'::regrole OR relrowsecurity))
 OR (SELECT count(*) FROM pg_proc WHERE pronamespace='legacy_custody'::regnamespace)<>8
 OR EXISTS(SELECT 1 FROM pg_proc p WHERE pronamespace='legacy_custody'::regnamespace
   AND (proowner<>'kirion_g1b_owner'::regrole OR prosecdef OR NOT coalesce(proconfig @> ARRAY['search_path=pg_catalog'],false)
   OR EXISTS(SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) x WHERE x.grantee=0 AND x.privilege_type='EXECUTE')))
 THEN RAISE EXCEPTION 'unsafe K2 ownership/visibility/function rights'; END IF;

 IF EXISTS(SELECT 1 FROM pg_namespace n CROSS JOIN LATERAL aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) x
  WHERE n.nspname='legacy_custody' AND x.grantee=0)
 OR EXISTS(SELECT 1 FROM pg_class c CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) x
  WHERE c.relnamespace='legacy_custody'::regnamespace AND c.relkind='r' AND x.grantee=0)
 THEN RAISE EXCEPTION 'unexpected K2 PUBLIC rights'; END IF;

 FOREACH r IN ARRAY ARRAY['n03_stage','n03_command','n03_reconcile','kirion_g1b_app','kirion_g1b_custody','kirion_g1b_repair'] LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r AND NOT (rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls OR rolinherit))
  OR EXISTS(SELECT 1 FROM pg_auth_members WHERE member=r::regrole)
  OR has_schema_privilege(r,'legacy_custody','CREATE') OR has_schema_privilege(r,'public','CREATE')
  OR has_database_privilege(r,current_database(),'TEMP') OR has_database_privilege(r,current_database(),'CREATE')
  THEN RAISE EXCEPTION 'unsafe role %',r; END IF;

  FOR t IN SELECT unnest(ARRAY['compensation_tombstones','compensation_outcomes']) LOOP
   IF has_table_privilege(r,'legacy_custody.'||t,'UPDATE,DELETE,TRUNCATE,TRIGGER,REFERENCES')
    OR has_table_privilege(r,'legacy_custody.'||t,'SELECT') IS DISTINCT FROM (r='n03_reconcile')
    OR has_table_privilege(r,'legacy_custody.'||t,'INSERT') IS DISTINCT FROM (r='n03_reconcile')
   THEN RAISE EXCEPTION 'K2 compensation ACL mismatch % %',r,t; END IF;
  END LOOP;

  FOR a IN SELECT p.oid,p.proname FROM pg_catalog.pg_proc p WHERE p.pronamespace='legacy_custody'::regnamespace LOOP
   IF has_function_privilege(r,a.oid,'EXECUTE') IS DISTINCT FROM
     ((r LIKE 'n03_%' AND a.proname='lock_pending') OR (r='n03_reconcile' AND a.proname='zero_artifacts') OR (r='n03_command' AND a.proname='expected_links'))
   THEN RAISE EXCEPTION 'K2 function execute mismatch % %',r,a.proname; END IF;
  END LOOP;
 END LOOP;

 -- Verify K2 immutable triggers are installed and enabled.
 IF (SELECT count(*) FROM pg_trigger
     WHERE tgname='n03_k2_immutable'
       AND tgenabled='O'
       AND tgrelid IN ('legacy_custody.compensation_tombstones'::regclass, 'legacy_custody.compensation_outcomes'::regclass))<>2
 THEN RAISE EXCEPTION 'missing or disabled K2 immutable triggers'; END IF;

 -- Preserve Plan/app/G2A/G2B boundary invariants.
 IF has_table_privilege('kirion_g1b_app','legacy_custody.compensation_tombstones','SELECT')
 OR has_table_privilege('kirion_g1b_custody','legacy_custody.compensation_tombstones','SELECT')
 OR has_table_privilege('n03_stage','legacy_custody.compensation_tombstones','SELECT')
 OR has_table_privilege('n03_command','legacy_custody.compensation_tombstones','SELECT')
 THEN RAISE EXCEPTION 'K2 boundary leakage detected'; END IF;
END $verify$;
ROLLBACK;
SELECT 'N03_K2_DISPOSABLE_CATALOG_VERIFIED' AS result;
