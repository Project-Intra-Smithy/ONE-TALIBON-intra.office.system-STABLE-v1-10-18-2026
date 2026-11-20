-- N03 G2B exact catalog proof verifier (synthetic PG16 role cluster only).
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL statement_timeout='30s';
DO $verify$
DECLARE r text; t text; a record;
BEGIN
 IF current_database()<>'talibon_portal_test'
 OR current_setting('server_version_num')::int NOT BETWEEN 160000 AND 169999
 OR current_setting('is_superuser')<>'on' THEN
  RAISE EXCEPTION 'unsafe G2B verifier';
 END IF;

 -- Verify G2B unique event provenance constraints exist on legacy_custody.command_results.
 IF (SELECT count(*) FROM pg_constraint
     WHERE conrelid='legacy_custody.command_results'::regclass
       AND contype='u'
       AND conname IN (
         'n03_command_results_unique_transaction_event',
         'n03_command_results_unique_correspondence_event',
         'n03_command_results_unique_travel_event'
       ))<>3 THEN
  RAISE EXCEPTION 'missing G2B command_results unique event constraints';
 END IF;

 -- Verify schema/table/function ownership, non-SECURITY-DEFINER, search_path, zero PUBLIC ACLs.
 IF (SELECT nspowner FROM pg_namespace WHERE nspname='legacy_custody')<>'kirion_g1b_owner'::regrole
 OR (SELECT count(*) FROM pg_tables WHERE schemaname='legacy_custody')<>10
 OR EXISTS(SELECT 1 FROM pg_class WHERE relnamespace='legacy_custody'::regnamespace AND (relowner<>'kirion_g1b_owner'::regrole OR relrowsecurity))
 OR (SELECT count(*) FROM pg_proc WHERE pronamespace='legacy_custody'::regnamespace)<>7
 OR EXISTS(SELECT 1 FROM pg_proc p WHERE pronamespace='legacy_custody'::regnamespace
   AND (proowner<>'kirion_g1b_owner'::regrole OR prosecdef OR NOT coalesce(proconfig @> ARRAY['search_path=pg_catalog'],false)
   OR EXISTS(SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) x WHERE x.grantee=0 AND x.privilege_type='EXECUTE')))
 THEN RAISE EXCEPTION 'unsafe G2B ownership/visibility/function rights'; END IF;

 IF EXISTS(SELECT 1 FROM pg_namespace n CROSS JOIN LATERAL aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) x
  WHERE n.nspname='legacy_custody' AND x.grantee=0)
 OR EXISTS(SELECT 1 FROM pg_class c CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) x
  WHERE c.relnamespace='legacy_custody'::regnamespace AND c.relkind='r' AND x.grantee=0)
 THEN RAISE EXCEPTION 'unexpected G2B PUBLIC rights'; END IF;

 FOREACH r IN ARRAY ARRAY['n03_stage','n03_command','n03_reconcile','kirion_g1b_app','kirion_g1b_custody','kirion_g1b_repair'] LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r AND NOT (rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls OR rolinherit))
  OR EXISTS(SELECT 1 FROM pg_auth_members WHERE member=r::regrole)
  OR has_schema_privilege(r,'legacy_custody','CREATE') OR has_schema_privilege(r,'public','CREATE')
  OR has_database_privilege(r,current_database(),'TEMP') OR has_database_privilege(r,current_database(),'CREATE')
  THEN RAISE EXCEPTION 'unsafe role %',r; END IF;

  IF has_schema_privilege(r,'legacy_custody','USAGE') IS DISTINCT FROM (r LIKE 'n03_%') THEN
   RAISE EXCEPTION 'schema usage mismatch %',r;
  END IF;

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
    THEN RAISE EXCEPTION 'private column ACL mismatch % %.%',r,t,a.attname; END IF;
   END LOOP;
  END LOOP;

  FOR a IN SELECT p.oid,p.proname FROM pg_catalog.pg_proc p WHERE p.pronamespace='legacy_custody'::regnamespace LOOP
   IF has_function_privilege(r,a.oid,'EXECUTE') IS DISTINCT FROM
     ((r LIKE 'n03_%' AND a.proname='lock_pending') OR (r='n03_reconcile' AND a.proname='zero_artifacts') OR (r='n03_command' AND a.proname='expected_links'))
   THEN RAISE EXCEPTION 'function execute mismatch % %',r,a.proname; END IF;
  END LOOP;

  IF r LIKE 'n03_%' THEN
   FOR a IN SELECT c.oid AS relation_oid,c.relname AS table_name,att.attname AS column_name
     FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace ns ON ns.oid=c.relnamespace
     JOIN pg_catalog.pg_attribute att ON att.attrelid=c.oid
     WHERE ns.nspname='public' AND c.relkind IN ('r','p','v','m','f') AND att.attnum>0 AND NOT att.attisdropped LOOP
    IF has_column_privilege(r,a.relation_oid,a.column_name,'SELECT') IS DISTINCT FROM
      ((r='n03_command' AND (
        (a.table_name='documents' AND a.column_name IN ('id','public_id','document_type','owner_department_id','uploaded_by_user_id','size_bytes','checksum_sha256','mime_type','storage_disk','storage_path','security_domain','custody_mode','custody_operation_id','custody_ordinal'))
        OR (a.table_name='users' AND a.column_name IN ('id','role','is_active','account_status','session_version','suspended_at'))
        OR (a.table_name='employees' AND a.column_name IN ('id','user_id','department_id','full_name','employment_status','separation_date'))
        OR (a.table_name='departments' AND a.column_name IN ('id','code','is_active','is_routable'))
        OR (a.table_name='travel_orders' AND a.column_name IN ('id','public_id','reference_number','issuance_date','purpose','destination','department_id','travel_start_date','travel_end_date','status','recorded_by_user_id','status_updated_by_user_id','created_at','updated_at'))
        OR (a.table_name='travel_order_employee' AND a.column_name IN ('id','travel_order_id','employee_id'))
        OR (a.table_name='travel_order_events' AND a.column_name IN ('id','travel_order_id','actor_user_id','event','from_status','to_status','remarks','occurred_at','created_at'))
        OR (a.table_name='transactions' AND a.column_name IN ('id','reference_no','transaction_type','request_category','request_type','action_required','title','description','priority','origin_department_id','current_department_id','created_by_user_id','assigned_employee_id','status','received_at','due_at','completed_at','closed_at','created_at','updated_at'))
        OR (a.table_name='transaction_events' AND a.column_name IN ('id','transaction_id','actor_user_id','from_department_id','to_department_id','from_assigned_employee_id','to_assigned_employee_id','action','previous_status','new_status','remarks','created_at'))
        OR (a.table_name='correspondence_records' AND a.column_name IN ('id','public_id','external_reference_no','subject','summary','receiving_department_id','registered_by_user_id','registered_at','municipal_reference_no','classification','classified_at','classified_by_user_id','routed_by_user_id','routed_at','action_started_by_user_id','action_started_at','lifecycle_state','workflow_transaction_id','created_at','updated_at'))
        OR (a.table_name='correspondence_events' AND a.column_name IN ('id','correspondence_record_id','event','previous_lifecycle_state','new_lifecycle_state','actor_user_id','integration_client_actor_id','office_department_id','remarks','metadata','correlation_id','occurred_at','n03_municipal_actor'))
        OR (a.table_name='correspondence_reference_counters' AND a.column_name IN ('year','last_value','created_at','updated_at'))
        OR (a.table_name IN ('plan_document_origin_receipts','plan_document_bindings') AND a.column_name='document_id')
      ))
      OR (r='n03_reconcile' AND a.table_name='documents' AND a.column_name IN ('id','custody_mode','custody_operation_id','custody_ordinal'))
      OR (r IN ('n03_command','n03_reconcile') AND (
        (a.table_name='document_links' AND a.column_name IN ('id','document_id','linkable_type','linkable_id','relationship','created_by_user_id'))
        OR (a.table_name='audit_logs' AND a.column_name IN ('id','custody_operation_id','entity_id','entity_type','action','outcome','actor_user_id','actor_department_id','correlation_id','integration_client_id'))
      )))
    OR has_column_privilege(r,a.relation_oid,a.column_name,'REFERENCES')
    THEN RAISE EXCEPTION 'public G2B read/reference ACL mismatch % %.%',r,a.table_name,a.column_name; END IF;

    IF has_column_privilege(r,a.relation_oid,a.column_name,'UPDATE') IS DISTINCT FROM
      (r='n03_command' AND (
        (a.table_name='documents' AND a.column_name='updated_at')
        OR (a.table_name='travel_orders' AND a.column_name IN ('status','status_updated_by_user_id','updated_at'))
        OR (a.table_name='transactions' AND a.column_name IN ('reference_no','current_department_id','assigned_employee_id','status','received_at','completed_at','updated_at'))
        OR (a.table_name='correspondence_records' AND a.column_name IN ('receiving_department_id','municipal_reference_no','registered_by_user_id','registered_at','classification','classified_by_user_id','classified_at','workflow_transaction_id','routed_by_user_id','routed_at','action_started_by_user_id','action_started_at','lifecycle_state','updated_at'))
        OR (a.table_name='correspondence_reference_counters' AND a.column_name IN ('last_value','updated_at'))
      ))
    THEN RAISE EXCEPTION 'public G2B update mismatch % %.%',r,a.table_name,a.column_name; END IF;

    IF has_column_privilege(r,a.relation_oid,a.column_name,'INSERT') IS DISTINCT FROM
      (r='n03_command' AND (
        (a.table_name='documents' AND a.column_name IN ('public_id','title','document_type','classification','original_name','mime_type','size_bytes','storage_disk','storage_path','checksum_sha256','owner_department_id','uploaded_by_user_id','retention_code','metadata','created_at','updated_at','security_domain','custody_mode','custody_operation_id','custody_ordinal'))
        OR (a.table_name='document_links' AND a.column_name IN ('document_id','linkable_type','linkable_id','relationship','created_by_user_id','created_at','updated_at'))
        OR (a.table_name='audit_logs' AND a.column_name IN ('actor_user_id','actor_department_id','action','entity_type','entity_id','outcome','summary','ip_address','user_agent','correlation_id','created_at','integration_client_id','custody_operation_id'))
        OR (a.table_name='travel_orders' AND a.column_name IN ('public_id','reference_number','issuance_date','purpose','destination','department_id','travel_start_date','travel_end_date','status','recorded_by_user_id','created_at','updated_at'))
        OR (a.table_name='travel_order_employee' AND a.column_name IN ('travel_order_id','employee_id','created_at','updated_at'))
        OR (a.table_name='travel_order_events' AND a.column_name IN ('travel_order_id','actor_user_id','event','from_status','to_status','remarks','occurred_at','created_at'))
        OR (a.table_name='transactions' AND a.column_name IN ('reference_no','transaction_type','request_category','request_type','action_required','title','description','priority','origin_department_id','current_department_id','created_by_user_id','assigned_employee_id','status','received_at','due_at','created_at','updated_at'))
        OR (a.table_name='transaction_events' AND a.column_name IN ('transaction_id','actor_user_id','from_department_id','to_department_id','from_assigned_employee_id','to_assigned_employee_id','action','previous_status','new_status','remarks','created_at'))
        OR (a.table_name='correspondence_events' AND a.column_name IN ('correspondence_record_id','event','previous_lifecycle_state','new_lifecycle_state','actor_user_id','office_department_id','remarks','metadata','correlation_id','occurred_at'))
        OR (a.table_name='correspondence_reference_counters' AND a.column_name IN ('year','last_value','created_at','updated_at'))
      ))
    THEN RAISE EXCEPTION 'public G2B insert mismatch % %.%',r,a.table_name,a.column_name; END IF;
   END LOOP;

   FOR a IN SELECT c.oid, c.relname FROM pg_catalog.pg_class c
     JOIN pg_catalog.pg_namespace ns ON ns.oid=c.relnamespace
     WHERE ns.nspname='public' AND c.relkind IN ('r','p','v','m','f') LOOP
    IF has_table_privilege(r,a.oid,'DELETE') OR has_table_privilege(r,a.oid,'TRUNCATE')
     OR has_table_privilege(r,a.oid,'TRIGGER') OR has_table_privilege(r,a.oid,'REFERENCES')
    THEN RAISE EXCEPTION 'unexpected public G2B DML % %',r,a.relname; END IF;
   END LOOP;

   FOR a IN SELECT sequencename FROM pg_sequences WHERE schemaname='public' LOOP
    IF has_sequence_privilege(r,'public.'||a.sequencename,'USAGE') IS DISTINCT FROM
       (r='n03_command' AND a.sequencename IN (
         'documents_id_seq','document_links_id_seq','audit_logs_id_seq',
         'travel_orders_id_seq','travel_order_employee_id_seq','travel_order_events_id_seq',
         'transactions_id_seq','transaction_events_id_seq','correspondence_events_id_seq'
       ))
     OR has_sequence_privilege(r,'public.'||a.sequencename,'SELECT,UPDATE')
    THEN RAISE EXCEPTION 'sequence G2B ACL mismatch % %',r,a.sequencename; END IF;
   END LOOP;
  END IF;
 END LOOP;

 -- Verify kirion_g1b_app and kirion_g1b_custody boundaries remain intact.
 IF has_table_privilege('kirion_g1b_app','public.audit_logs','INSERT,UPDATE')
 OR has_column_privilege('kirion_g1b_app','public.audit_logs','custody_operation_id','INSERT,UPDATE')
 OR has_column_privilege('kirion_g1b_app','public.documents','custody_operation_id','INSERT,UPDATE')
 OR has_column_privilege('kirion_g1b_app','public.documents','custody_mode','INSERT,UPDATE')
 OR has_column_privilege('kirion_g1b_app','public.documents','custody_ordinal','INSERT,UPDATE')
 OR has_column_privilege('kirion_g1b_app','public.documents','security_domain','INSERT,UPDATE')
 OR NOT has_column_privilege('kirion_g1b_app','public.audit_logs','integration_client_id','INSERT')
 OR has_table_privilege('kirion_g1b_app','public.audit_logs','DELETE,TRUNCATE')
 OR EXISTS(SELECT 1 FROM pg_attribute a WHERE a.attrelid='public.audit_logs'::regclass AND a.attnum>0 AND NOT a.attisdropped
   AND has_column_privilege('kirion_g1b_app','public.audit_logs',a.attname,'UPDATE'))
 OR NOT has_column_privilege('kirion_g1b_custody','public.documents','security_domain','UPDATE')
 OR has_table_privilege('kirion_g1b_app','public.plan_custody_generations','SELECT')
 THEN RAISE EXCEPTION 'legacy/Plan ACL drift'; END IF;

 -- Explicitly assert n03_command cannot mutate users, employees, departments or insert integration_client_actor_id.
 IF has_table_privilege('n03_command','public.users','INSERT,UPDATE,DELETE,TRUNCATE')
 OR has_table_privilege('n03_command','public.employees','INSERT,UPDATE,DELETE,TRUNCATE')
 OR has_table_privilege('n03_command','public.departments','INSERT,UPDATE,DELETE,TRUNCATE')
 OR has_column_privilege('n03_command','public.correspondence_events','integration_client_actor_id','INSERT')
 THEN RAISE EXCEPTION 'n03_command boundary violation'; END IF;

 -- Preserve G2A Plan function ACL, default function ACL, deferred trigger, and generated column invariants.
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
SELECT 'N03_G2B_DISPOSABLE_CATALOG_VERIFIED' AS result;
