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

\ir ../../../database/deployment/n03.sql
SELECT format('ALTER ROLE n03_stage PASSWORD %L', :'N03_STAGE_PASSWORD') \gexec
SELECT format('ALTER ROLE n03_command PASSWORD %L', :'N03_COMMAND_PASSWORD') \gexec
SELECT format('ALTER ROLE n03_reconcile PASSWORD %L', :'N03_RECONCILE_PASSWORD') \gexec

COMMIT;
SELECT 'N03_DISPOSABLE_INSTALL_COMPLETE' AS result;
