-- Every persistent bootstrap runs under a maintenance window and one transaction.
DO $owners$
DECLARE obj record;
BEGIN
 FOR obj IN SELECT schemaname,tablename FROM pg_tables WHERE schemaname IN ('public','legacy_custody') LOOP
  EXECUTE format('ALTER TABLE %I.%I OWNER TO kirion_g1b_owner',obj.schemaname,obj.tablename);
 END LOOP;
 FOR obj IN SELECT schemaname,sequencename FROM pg_sequences WHERE schemaname IN ('public','legacy_custody') LOOP
  EXECUTE format('ALTER SEQUENCE %I.%I OWNER TO kirion_g1b_owner',obj.schemaname,obj.sequencename);
 END LOOP;
 FOR obj IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname IN ('public','legacy_custody') AND p.prorettype='trigger'::regtype LOOP
  EXECUTE format('ALTER FUNCTION %s OWNER TO kirion_g1b_owner',obj.signature);
 END LOOP;
END $owners$;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON public.migrations FROM PUBLIC,kirion_g1b_app,kirion_g1b_custody,n03_stage,n03_command,n03_reconcile,n03_reader;
REVOKE UPDATE,DELETE,TRUNCATE ON public.audit_logs FROM PUBLIC,kirion_g1b_app;
DO $functions$
DECLARE obj record;
BEGIN
 FOR obj IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname IN ('public','legacy_custody') AND p.prorettype='trigger'::regtype LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',obj.signature);
 END LOOP;
END $functions$;
DO $verify$
BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname IN
 ('kirion_g1b_owner','kirion_g1b_migrator','kirion_g1b_app','kirion_g1b_custody','kirion_g1b_repair','n03_stage','n03_command','n03_reconcile','n03_reader')
 AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls OR rolinherit))
 OR EXISTS(SELECT 1 FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.member
 WHERE r.rolname IN ('kirion_g1b_app','kirion_g1b_custody','n03_stage','n03_command','n03_reconcile','n03_reader'))
 OR has_table_privilege('kirion_g1b_app','public.audit_logs','UPDATE')
 OR has_table_privilege('kirion_g1b_app','legacy_custody.operations','INSERT')
 OR has_table_privilege('n03_reader','public.users','UPDATE')
 OR has_table_privilege('n03_stage','public.audit_logs','UPDATE')
 OR has_table_privilege('kirion_g1b_app','public.plan_custody_generations','SELECT') THEN
 RAISE EXCEPTION 'Persistent role lattice verification failed';
 END IF;
END $verify$;
