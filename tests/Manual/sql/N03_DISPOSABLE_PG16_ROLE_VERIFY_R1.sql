-- Catalog proof only; real connection behavior is separately asserted by Feature tests.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL statement_timeout='30s';
DO $verify$
DECLARE r text; t text; a record; n integer;
BEGIN
 IF current_database()<>'talibon_portal_test' OR current_setting('server_version_num')::int NOT BETWEEN 160000 AND 169999
 OR current_setting('is_superuser')<>'on' THEN RAISE EXCEPTION 'unsafe verifier'; END IF;
 IF (SELECT nspowner FROM pg_namespace WHERE nspname='legacy_custody')<>'kirion_g1b_owner'::regrole
 OR (SELECT count(*) FROM pg_tables WHERE schemaname='legacy_custody')<>10
 OR EXISTS(SELECT 1 FROM pg_class WHERE relnamespace='legacy_custody'::regnamespace AND (relowner<>'kirion_g1b_owner'::regrole OR relrowsecurity))
 OR (SELECT count(*) FROM pg_proc WHERE pronamespace='legacy_custody'::regnamespace)<>7
 OR EXISTS(SELECT 1 FROM pg_proc p WHERE pronamespace='legacy_custody'::regnamespace
   AND (proowner<>'kirion_g1b_owner'::regrole OR prosecdef OR NOT coalesce(proconfig @> ARRAY['search_path=pg_catalog'],false)
   OR EXISTS(SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) x WHERE x.grantee=0 AND x.privilege_type='EXECUTE')))
 THEN RAISE EXCEPTION 'unsafe N03 ownership/visibility/function rights'; END IF;
 IF EXISTS(SELECT 1 FROM pg_namespace n CROSS JOIN LATERAL aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) x
 WHERE n.nspname='legacy_custody' AND x.grantee=0)
 OR EXISTS(SELECT 1 FROM pg_class c CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) x
 WHERE c.relnamespace='legacy_custody'::regnamespace AND c.relkind='r' AND x.grantee=0)
 THEN RAISE EXCEPTION 'unexpected PUBLIC rights'; END IF;
 FOREACH r IN ARRAY ARRAY['n03_stage','n03_command','n03_reconcile','kirion_g1b_app','kirion_g1b_custody','kirion_g1b_repair'] LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r AND NOT (rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls OR rolinherit))
  OR EXISTS(SELECT 1 FROM pg_auth_members WHERE member=r::regrole)
  OR has_schema_privilege(r,'legacy_custody','CREATE') OR has_schema_privilege(r,'public','CREATE')
  OR has_database_privilege(r,current_database(),'TEMP') OR has_database_privilege(r,current_database(),'CREATE')
  THEN RAISE EXCEPTION 'unsafe role %',r; END IF;
  IF has_schema_privilege(r,'legacy_custody','USAGE') IS DISTINCT FROM (r LIKE 'n03_%') THEN RAISE EXCEPTION 'schema usage mismatch %',r; END IF;
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='legacy_custody' LOOP
   IF has_table_privilege(r,'legacy_custody.'||t,'DELETE,TRUNCATE,TRIGGER,REFERENCES')
    OR has_table_privilege(r,'legacy_custody.'||t,'UPDATE')
    OR has_table_privilege(r,'legacy_custody.'||t,'SELECT') IS DISTINCT FROM
      (r LIKE 'n03_%' AND (r<>'n03_stage' OR t NOT IN ('command_results','bindings','ownership_links')))
    OR has_table_privilege(r,'legacy_custody.'||t,'INSERT') IS DISTINCT FROM
      (CASE r WHEN 'n03_stage' THEN t IN ('operations','operation_items','operation_gates','generations','operation_events')
      WHEN 'n03_command' THEN t IN ('command_results','bindings','ownership_links','terminal_receipts','operation_events')
      WHEN 'n03_reconcile' THEN t IN ('terminal_receipts','operation_events') ELSE false END)
   THEN RAISE EXCEPTION 'private ACL mismatch % %',r,t; END IF;
   FOR a IN SELECT attname FROM pg_attribute WHERE attrelid=to_regclass('legacy_custody.'||t) AND attnum>0 AND NOT attisdropped LOOP
    IF has_column_privilege(r,'legacy_custody.'||t,a.attname,'UPDATE') IS DISTINCT FROM
       (t='operation_gates' AND ((r IN ('n03_stage','n03_command') AND a.attname='lock_stub') OR (r='n03_reconcile' AND a.attname IN ('state','fence_no'))))
    THEN RAISE EXCEPTION 'column ACL mismatch % %.%',r,t,a.attname; END IF;
   END LOOP;
  END LOOP;
  IF r LIKE 'n03_%' THEN
   FOR a IN SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public' LOOP
    IF has_column_privilege(r,'public.'||a.table_name,a.column_name,'UPDATE') IS DISTINCT FROM
      (r='n03_command' AND a.table_name='documents' AND a.column_name='updated_at')
    THEN RAISE EXCEPTION 'public update mismatch % %.%',r,a.table_name,a.column_name; END IF;
    IF has_column_privilege(r,'public.'||a.table_name,a.column_name,'INSERT') IS DISTINCT FROM
      (r='n03_command' AND ((a.table_name='documents' AND a.column_name IN ('public_id','title','document_type','classification','original_name','mime_type','size_bytes','storage_disk','storage_path','checksum_sha256','owner_department_id','uploaded_by_user_id','retention_code','metadata','created_at','updated_at','security_domain','custody_mode','custody_operation_id','custody_ordinal'))
      OR (a.table_name='document_links' AND a.column_name IN ('document_id','linkable_type','linkable_id','relationship','created_by_user_id','created_at','updated_at'))
      OR (a.table_name='audit_logs' AND a.column_name IN ('actor_user_id','actor_department_id','action','entity_type','entity_id','outcome','summary','ip_address','user_agent','correlation_id','created_at','integration_client_id','custody_operation_id'))))
    THEN RAISE EXCEPTION 'public insert mismatch % %.%',r,a.table_name,a.column_name; END IF;
   END LOOP;
   IF EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND has_table_privilege(r,'public.'||tablename,'DELETE,TRUNCATE,TRIGGER,REFERENCES')) THEN RAISE EXCEPTION 'unexpected public DML %',r; END IF;
   FOR a IN SELECT sequencename FROM pg_sequences WHERE schemaname='public' LOOP
    IF has_sequence_privilege(r,'public.'||a.sequencename,'USAGE') IS DISTINCT FROM
       (r='n03_command' AND a.sequencename IN ('documents_id_seq','document_links_id_seq','audit_logs_id_seq'))
     OR has_sequence_privilege(r,'public.'||a.sequencename,'SELECT,UPDATE') THEN RAISE EXCEPTION 'sequence ACL mismatch % %',r,a.sequencename; END IF;
   END LOOP;
  END IF;
 END LOOP;
 IF has_table_privilege('kirion_g1b_app','public.audit_logs','INSERT,UPDATE')
 OR has_column_privilege('kirion_g1b_app','public.audit_logs','custody_operation_id','INSERT,UPDATE')
 OR has_column_privilege('kirion_g1b_app','public.documents','custody_operation_id','INSERT,UPDATE')
 OR has_column_privilege('kirion_g1b_app','public.documents','custody_mode','INSERT,UPDATE')
 OR has_column_privilege('kirion_g1b_app','public.documents','custody_ordinal','INSERT,UPDATE')
 OR has_column_privilege('kirion_g1b_app','public.documents','security_domain','INSERT,UPDATE')
 OR NOT has_column_privilege('kirion_g1b_app','public.audit_logs','integration_client_id','INSERT')
 OR NOT has_column_privilege('kirion_g1b_app','public.audit_logs','integration_client_id','UPDATE')
 OR NOT has_column_privilege('kirion_g1b_custody','public.documents','security_domain','UPDATE')
 OR has_table_privilege('kirion_g1b_app','public.plan_custody_generations','SELECT')
 THEN RAISE EXCEPTION 'legacy/Plan ACL drift'; END IF;
 IF EXISTS(SELECT 1 FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.proname LIKE 'kirion_plan_%' AND
   (p.proowner<>'kirion_g1b_owner'::regrole OR p.prosecdef OR has_function_privilege('n03_command',p.oid,'EXECUTE')))
 THEN RAISE EXCEPTION 'Plan ACL drift'; END IF;
 IF EXISTS(SELECT 1 FROM pg_default_acl d CROSS JOIN LATERAL aclexplode(d.defaclacl) x
 WHERE d.defaclrole IN (current_user::regrole,'kirion_g1b_owner'::regrole) AND d.defaclobjtype='f' AND x.grantee=0 AND x.privilege_type='EXECUTE')
 OR (SELECT count(*) FROM pg_trigger WHERE tgname LIKE 'n03_%complete' AND tgdeferrable AND tginitdeferred)<>10
 OR EXISTS(SELECT 1 FROM pg_trigger WHERE (tgname LIKE 'n03_%' OR tgname='a_n03_public_guard') AND tgenabled<>'O')
 THEN RAISE EXCEPTION 'default/trigger drift'; END IF;
 IF (SELECT attgenerated FROM pg_attribute WHERE attrelid='public.correspondence_events'::regclass AND attname='n03_municipal_actor')<>'s'
 THEN RAISE EXCEPTION 'expected stored generated municipal flag'; END IF;
END $verify$;
ROLLBACK;
SELECT 'N03_DISPOSABLE_CATALOG_VERIFIED' AS result;
