-- N03 G2A synthetic role cluster only. Do not rerun historical installers after this.
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
DECLARE actual text[]; expected text[]:=ARRAY['bindings','command_results','generations','namespaces','operation_events','operation_gates','operation_items','operations','ownership_links','terminal_receipts'];
BEGIN
 IF current_database()<>'talibon_portal_test' OR current_setting('server_version_num')::int NOT BETWEEN 160000 AND 169999
 OR current_setting('is_superuser')<>'on' OR current_setting('n03.lease',true) IS DISTINCT FROM 'EXCLUSIVE_PG16_SYNTHETIC_ONLY'
 OR EXISTS(SELECT 1 FROM pg_roles WHERE rolname LIKE 'n03_%')
 OR NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='kirion_g1b_owner' AND NOT rolcanlogin AND NOT rolsuper)
 OR (SELECT count(*) FROM pg_roles WHERE rolname IN ('kirion_g1b_app','kirion_g1b_custody','kirion_g1b_migrator','kirion_g1b_repair'))<>4
 OR NOT has_table_privilege('kirion_g1b_custody','public.plan_custody_generations','INSERT')
 OR has_table_privilege('kirion_g1b_app','public.plan_custody_generations','SELECT')
 THEN RAISE EXCEPTION 'N03 installer prerequisites or role collision'; END IF;
 SELECT array_agg(tablename::text ORDER BY tablename) INTO actual FROM pg_tables WHERE schemaname='legacy_custody';
 IF actual IS DISTINCT FROM expected OR (SELECT count(*) FROM pg_proc WHERE pronamespace='legacy_custody'::regnamespace)<>7
 OR EXISTS(SELECT 1 FROM pg_class WHERE relnamespace='legacy_custody'::regnamespace AND relkind NOT IN ('r','i'))
 OR EXISTS(SELECT 1 FROM pg_tables t JOIN pg_class c ON c.oid=to_regclass(format('%I.%I',t.schemaname,t.tablename))
 WHERE t.schemaname='public' AND c.relowner<>'kirion_g1b_owner'::regrole)
 OR EXISTS(SELECT 1 FROM pg_class WHERE relnamespace='legacy_custody'::regnamespace AND relrowsecurity)
 THEN RAISE EXCEPTION 'N03 migration inventory drift'; END IF;
 SELECT array_agg(attname::text ORDER BY attname) INTO actual FROM pg_attribute WHERE attrelid='public.audit_logs'::regclass AND attnum>0 AND NOT attisdropped;
 IF actual IS DISTINCT FROM ARRAY['action','actor_department_id','actor_user_id','correlation_id','created_at','custody_operation_id','entity_id','entity_type','id','integration_client_id','ip_address','outcome','summary','user_agent']
 THEN RAISE EXCEPTION 'audit column inventory drift'; END IF;
 IF EXISTS(SELECT 1 FROM public.documents WHERE custody_mode<>'LEGACY_PATH') OR EXISTS(SELECT 1 FROM legacy_custody.operations)
 THEN RAISE EXCEPTION 'nonempty registry before role installation'; END IF;
END $guard$;
CREATE ROLE n03_stage LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE n03_command LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE n03_reconcile LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
-- The executor supplies ephemeral values; no echo of generated password SQL.
SELECT format('ALTER ROLE n03_stage PASSWORD %L', :'N03_STAGE_PASSWORD') \gexec
SELECT format('ALTER ROLE n03_command PASSWORD %L', :'N03_COMMAND_PASSWORD') \gexec
SELECT format('ALTER ROLE n03_reconcile PASSWORD %L', :'N03_RECONCILE_PASSWORD') \gexec
REVOKE TEMPORARY, CREATE ON DATABASE talibon_portal_test FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT CONNECT ON DATABASE talibon_portal_test TO n03_stage,n03_command,n03_reconcile;
GRANT USAGE ON SCHEMA public TO n03_command,n03_reconcile;
ALTER SCHEMA legacy_custody OWNER TO kirion_g1b_owner;
DO $owners$
DECLARE obj record;
BEGIN
 FOR obj IN SELECT tablename FROM pg_tables WHERE schemaname='legacy_custody' LOOP
  EXECUTE format('ALTER TABLE legacy_custody.%I OWNER TO kirion_g1b_owner',obj.tablename);
 END LOOP;
 FOR obj IN SELECT oid::regprocedure AS signature FROM pg_proc WHERE pronamespace='legacy_custody'::regnamespace LOOP
  EXECUTE format('ALTER FUNCTION %s OWNER TO kirion_g1b_owner',obj.signature);
 END LOOP;
END $owners$;
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE kirion_g1b_owner REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
REVOKE ALL ON SCHEMA legacy_custody FROM PUBLIC,kirion_g1b_app,kirion_g1b_custody,kirion_g1b_repair,kirion_g1b_migrator;
REVOKE ALL ON ALL TABLES IN SCHEMA legacy_custody FROM PUBLIC,kirion_g1b_app,kirion_g1b_custody,kirion_g1b_repair,kirion_g1b_migrator;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA legacy_custody FROM PUBLIC,kirion_g1b_app,kirion_g1b_custody,kirion_g1b_repair,kirion_g1b_migrator;
GRANT USAGE ON SCHEMA legacy_custody TO n03_stage,n03_command,n03_reconcile;
GRANT SELECT ON legacy_custody.namespaces,legacy_custody.operations,legacy_custody.operation_items,legacy_custody.operation_gates,
 legacy_custody.generations,legacy_custody.terminal_receipts,legacy_custody.operation_events TO n03_stage,n03_command,n03_reconcile;
GRANT SELECT ON legacy_custody.command_results,legacy_custody.bindings,legacy_custody.ownership_links TO n03_command,n03_reconcile;
GRANT INSERT ON legacy_custody.operations,legacy_custody.operation_items,legacy_custody.operation_gates,legacy_custody.generations,legacy_custody.operation_events TO n03_stage;
GRANT INSERT ON legacy_custody.command_results,legacy_custody.bindings,legacy_custody.ownership_links,legacy_custody.terminal_receipts,legacy_custody.operation_events TO n03_command;
GRANT INSERT ON legacy_custody.terminal_receipts,legacy_custody.operation_events TO n03_reconcile;
GRANT UPDATE(lock_stub) ON legacy_custody.operation_gates TO n03_stage,n03_command;
GRANT UPDATE(state,fence_no) ON legacy_custody.operation_gates TO n03_reconcile;
GRANT EXECUTE ON FUNCTION legacy_custody.lock_pending(uuid,bigint,text) TO n03_stage,n03_command,n03_reconcile;
GRANT EXECUTE ON FUNCTION legacy_custody.zero_artifacts(uuid) TO n03_reconcile;
GRANT EXECUTE ON FUNCTION legacy_custody.expected_links(uuid) TO n03_command;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE ON public.audit_logs FROM kirion_g1b_app;
GRANT INSERT(id,actor_user_id,actor_department_id,action,entity_type,entity_id,outcome,summary,ip_address,user_agent,correlation_id,created_at,integration_client_id) ON public.audit_logs TO kirion_g1b_app;
GRANT SELECT(id,public_id,document_type,owner_department_id,uploaded_by_user_id,size_bytes,checksum_sha256,mime_type,storage_disk,storage_path,security_domain,custody_mode,custody_operation_id,custody_ordinal) ON public.documents TO n03_command;
GRANT SELECT(id,document_id,linkable_type,linkable_id,relationship,created_by_user_id) ON public.document_links TO n03_command,n03_reconcile;
GRANT SELECT(id,custody_operation_id,entity_id,entity_type,action,outcome,actor_user_id,actor_department_id,correlation_id,integration_client_id) ON public.audit_logs TO n03_command,n03_reconcile;
GRANT SELECT(id,custody_mode,custody_operation_id,custody_ordinal) ON public.documents TO n03_reconcile;
GRANT SELECT(id) ON public.users,public.departments,public.transactions,public.correspondence_records,public.travel_orders TO n03_command;
GRANT SELECT(id,transaction_id,actor_user_id,action) ON public.transaction_events TO n03_command;
GRANT SELECT(id,correspondence_record_id,actor_user_id,event,office_department_id,correlation_id,n03_municipal_actor) ON public.correspondence_events TO n03_command;
GRANT SELECT(id,travel_order_id,actor_user_id,event) ON public.travel_order_events TO n03_command;
GRANT SELECT(document_id) ON public.plan_document_origin_receipts,public.plan_document_bindings TO n03_command;
GRANT INSERT(public_id,title,document_type,classification,original_name,mime_type,size_bytes,storage_disk,storage_path,checksum_sha256,
 owner_department_id,uploaded_by_user_id,retention_code,metadata,created_at,updated_at,security_domain,custody_mode,custody_operation_id,custody_ordinal) ON public.documents TO n03_command;
GRANT UPDATE(updated_at) ON public.documents TO n03_command;
GRANT INSERT(document_id,linkable_type,linkable_id,relationship,created_by_user_id,created_at,updated_at) ON public.document_links TO n03_command;
GRANT INSERT(actor_user_id,actor_department_id,action,entity_type,entity_id,outcome,summary,ip_address,user_agent,correlation_id,created_at,integration_client_id,custody_operation_id) ON public.audit_logs TO n03_command;
GRANT USAGE ON SEQUENCE public.documents_id_seq,public.document_links_id_seq,public.audit_logs_id_seq TO n03_command;
COMMIT;
SELECT 'N03_DISPOSABLE_INSTALL_COMPLETE' AS result;
