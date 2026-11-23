-- N03 G3 exact catalog proof verifier (synthetic PG16 role cluster only).
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
  'classification_events',
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
  'terminal_receipts',
  'watermark_checkpoints'
 ];
 reader_private_tables text[] := ARRAY[
  'bindings',
  'classification_events',
  'command_results',
  'generations',
  'namespaces',
  'operation_gates',
  'operation_items',
  'operations',
  'ownership_links',
  'terminal_receipts',
  'watermark_checkpoints'
 ];
BEGIN
 IF current_database()<>'talibon_portal_test'
 OR current_setting('server_version_num')::int NOT BETWEEN 160000 AND 169999
 OR current_setting('is_superuser')<>'on' THEN
  RAISE EXCEPTION 'unsafe G3 verifier';
 END IF;

 -- Verify exact 14 tables and 9 functions in legacy_custody, all owned by kirion_g1b_owner, zero SECURITY DEFINER.
 SELECT array_agg(tablename::text ORDER BY tablename) INTO actual_tables
 FROM pg_tables WHERE schemaname='legacy_custody';

 IF actual_tables IS DISTINCT FROM expected_tables
 OR (SELECT nspowner FROM pg_namespace WHERE nspname='legacy_custody')<>'kirion_g1b_owner'::regrole
 OR EXISTS(SELECT 1 FROM pg_class WHERE relnamespace='legacy_custody'::regnamespace AND (relowner<>'kirion_g1b_owner'::regrole OR relrowsecurity))
 OR (SELECT count(*) FROM pg_proc WHERE pronamespace='legacy_custody'::regnamespace)<>9
 OR EXISTS(SELECT 1 FROM pg_proc p WHERE pronamespace='legacy_custody'::regnamespace
   AND (proowner<>'kirion_g1b_owner'::regrole OR prosecdef OR NOT coalesce(proconfig @> ARRAY['search_path=pg_catalog'],false)
   OR EXISTS(SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) x WHERE x.grantee=0 AND x.privilege_type='EXECUTE')))
 THEN RAISE EXCEPTION 'unsafe G3 ownership/visibility/function rights'; END IF;

 IF EXISTS(SELECT 1 FROM pg_namespace n CROSS JOIN LATERAL aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) x
  WHERE n.nspname='legacy_custody' AND x.grantee=0)
 OR EXISTS(SELECT 1 FROM pg_class c CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) x
  WHERE c.relnamespace='legacy_custody'::regnamespace AND c.relkind='r' AND x.grantee=0)
 THEN RAISE EXCEPTION 'unexpected G3 PUBLIC rights'; END IF;

 FOREACH r IN ARRAY ARRAY['n03_stage','n03_command','n03_reconcile','n03_reader','kirion_g1b_app','kirion_g1b_custody','kirion_g1b_repair'] LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r AND rolcanlogin=(r<>'kirion_g1b_repair') AND NOT (rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls OR rolinherit))
  OR EXISTS(SELECT 1 FROM pg_auth_members WHERE member=r::regrole)
  OR has_schema_privilege(r,'legacy_custody','CREATE') OR has_schema_privilege(r,'public','CREATE')
  OR has_database_privilege(r,current_database(),'TEMP') OR has_database_privilege(r,current_database(),'CREATE')
  THEN RAISE EXCEPTION 'unsafe role %',r; END IF;

  IF has_schema_privilege(r,'legacy_custody','USAGE') IS DISTINCT FROM (r LIKE 'n03_%') THEN
   RAISE EXCEPTION 'G3 schema usage mismatch %',r;
  END IF;

  -- Verify G3 extension tables ACLs across every role.
  IF has_table_privilege(r,'legacy_custody.watermark_checkpoints','UPDATE,DELETE,TRUNCATE,TRIGGER,REFERENCES')
   OR has_table_privilege(r,'legacy_custody.watermark_checkpoints','SELECT') IS DISTINCT FROM (r IN ('n03_command','n03_reconcile','n03_reader'))
   OR has_table_privilege(r,'legacy_custody.watermark_checkpoints','INSERT') IS DISTINCT FROM (r IN ('n03_command','n03_reconcile'))
  THEN RAISE EXCEPTION 'G3 watermark_checkpoints ACL mismatch %',r; END IF;

  IF has_table_privilege(r,'legacy_custody.classification_events','UPDATE,DELETE,TRUNCATE,TRIGGER,REFERENCES')
   OR has_table_privilege(r,'legacy_custody.classification_events','SELECT') IS DISTINCT FROM (r IN ('n03_command','n03_reader'))
   OR has_table_privilege(r,'legacy_custody.classification_events','INSERT') IS DISTINCT FROM (r='n03_command')
  THEN RAISE EXCEPTION 'G3 classification_events ACL mismatch %',r; END IF;

  FOR a IN SELECT p.oid,p.proname FROM pg_catalog.pg_proc p WHERE p.pronamespace='legacy_custody'::regnamespace LOOP
   IF has_function_privilege(r,a.oid,'EXECUTE') IS DISTINCT FROM
     ((r IN ('n03_stage','n03_command','n03_reconcile') AND a.proname='lock_pending')
      OR (r='n03_reconcile' AND a.proname='zero_artifacts')
      OR (r='n03_command' AND a.proname='expected_links'))
   THEN RAISE EXCEPTION 'G3 function execute mismatch % %',r,a.proname; END IF;
  END LOOP;
 END LOOP;

 -- Verify n03_reader has strictly READ-ONLY privileges across ALL legacy_custody tables.
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='legacy_custody' LOOP
  IF has_table_privilege('n03_reader','legacy_custody.'||t,'INSERT,UPDATE,DELETE,TRUNCATE,TRIGGER,REFERENCES')
   OR has_table_privilege('n03_reader','legacy_custody.'||t,'SELECT') IS DISTINCT FROM (t = ANY(reader_private_tables))
  THEN RAISE EXCEPTION 'n03_reader private table ACL mismatch %',t; END IF;
 END LOOP;

 -- Verify n03_reader has ZERO write privileges and exact narrow SELECT columns in public.
 FOR a IN SELECT c.oid AS relation_oid,c.relname AS table_name,att.attname AS column_name
   FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace ns ON ns.oid=c.relnamespace
   JOIN pg_catalog.pg_attribute att ON att.attrelid=c.oid
   WHERE ns.nspname='public' AND c.relkind IN ('r','p','v','m','f') AND att.attnum>0 AND NOT att.attisdropped LOOP
  IF has_column_privilege('n03_reader',a.relation_oid,a.column_name,'INSERT,UPDATE,REFERENCES') THEN
   RAISE EXCEPTION 'n03_reader unexpected public write/reference privilege %.%',a.table_name,a.column_name;
  END IF;

  IF has_column_privilege('n03_reader',a.relation_oid,a.column_name,'SELECT') IS DISTINCT FROM (
    (a.table_name='users' AND a.column_name IN ('id','name','role','is_active','account_status','session_version','suspended_at'))
    OR (a.table_name='employees' AND a.column_name IN ('id','user_id','department_id','full_name','employment_status','separation_date'))
    OR (a.table_name='departments' AND a.column_name IN ('id','code','name','short_name','is_active','is_routable'))
    OR (a.table_name='documents' AND a.column_name IN ('id','public_id','title','document_type','classification','original_name','mime_type','size_bytes','storage_disk','storage_path','checksum_sha256','owner_department_id','uploaded_by_user_id','retention_code','security_domain','custody_mode','custody_operation_id','custody_ordinal','created_at','updated_at'))
    OR (a.table_name='document_links' AND a.column_name IN ('id','document_id','linkable_type','linkable_id','relationship','created_by_user_id','created_at'))
    OR (a.table_name IN ('plan_document_origin_receipts','plan_document_bindings') AND a.column_name='document_id')
  ) THEN
   RAISE EXCEPTION 'n03_reader public read ACL mismatch %.%',a.table_name,a.column_name;
  END IF;
 END LOOP;

 FOR a IN SELECT c.oid,c.relname FROM pg_catalog.pg_class c
   JOIN pg_catalog.pg_namespace ns ON ns.oid=c.relnamespace
   WHERE ns.nspname='public' AND c.relkind IN ('r','p','v','m','f') LOOP
  IF has_table_privilege('n03_reader',a.oid,'INSERT,UPDATE,DELETE,TRUNCATE,TRIGGER,REFERENCES') THEN
   RAISE EXCEPTION 'n03_reader unexpected public DML %',a.relname;
  END IF;
 END LOOP;

 FOR a IN SELECT sequencename FROM pg_sequences WHERE schemaname='public' LOOP
  IF has_sequence_privilege('n03_reader','public.'||a.sequencename,'USAGE,SELECT,UPDATE') THEN
   RAISE EXCEPTION 'n03_reader unexpected sequence privilege %',a.sequencename;
  END IF;
 END LOOP;

 -- Verify G3 immutable triggers exist and are enabled.
 IF (SELECT count(*) FROM pg_trigger
     WHERE tgname='n03_g3_immutable'
       AND tgenabled='O'
       AND tgrelid IN ('legacy_custody.watermark_checkpoints'::regclass, 'legacy_custody.classification_events'::regclass))<>2
 THEN RAISE EXCEPTION 'missing or disabled G3 immutable triggers'; END IF;

 -- Preserve app & Plan role exclusion from legacy_custody.*.
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='legacy_custody' LOOP
  IF has_table_privilege('kirion_g1b_app','legacy_custody.'||t,'SELECT,INSERT,UPDATE,DELETE')
   OR has_table_privilege('kirion_g1b_custody','legacy_custody.'||t,'SELECT,INSERT,UPDATE,DELETE')
  THEN RAISE EXCEPTION 'G3 boundary leakage to app/Plan role on %',t; END IF;
 END LOOP;
END $verify$;
ROLLBACK;
SELECT 'N03_G3_DISPOSABLE_READER_CATALOG_VERIFIED' AS result;
