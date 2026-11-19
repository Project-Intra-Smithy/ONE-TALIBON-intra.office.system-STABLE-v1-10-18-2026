-- N03 G3 additive reader role & extension ACL installer (synthetic PG16 role cluster only).
-- Must run strictly AFTER G2A, G2B, K2 installers and G3-G5 migration.
\set ON_ERROR_STOP on
\if :{?N03_DISPOSABLE_LEASE}
\else
  SELECT 1/0;
\endif
\if :{?N03_READER_PASSWORD}
\else
  SELECT 1/0;
\endif
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='30s';
SELECT set_config('n03.lease', :'N03_DISPOSABLE_LEASE', true);

DO $guard$
BEGIN
 IF current_database()<>'talibon_portal_test'
 OR current_setting('server_version_num')::int NOT BETWEEN 160000 AND 169999
 OR current_setting('is_superuser')<>'on'
 OR current_setting('n03.lease',true) IS DISTINCT FROM 'EXCLUSIVE_PG16_SYNTHETIC_ONLY'
 OR to_regnamespace('legacy_custody') IS NULL
 OR to_regclass('legacy_custody.watermark_checkpoints') IS NULL
 OR to_regclass('legacy_custody.classification_events') IS NULL
 OR EXISTS(SELECT 1 FROM pg_roles WHERE rolname='n03_reader')
 OR NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='kirion_g1b_owner' AND NOT rolcanlogin AND NOT rolsuper)
 OR (SELECT count(*) FROM pg_roles WHERE rolname IN ('n03_stage','n03_command','n03_reconcile'))<>3
 THEN RAISE EXCEPTION 'N03 G3 installer prerequisites or role collision'; END IF;
END $guard$;

-- Create strictly read-only custody reader login role.
CREATE ROLE n03_reader LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
SELECT format('ALTER ROLE n03_reader PASSWORD %L', :'N03_READER_PASSWORD') \gexec

-- Transfer ownership of G3 extension tables and trigger function to kirion_g1b_owner.
ALTER TABLE legacy_custody.watermark_checkpoints OWNER TO kirion_g1b_owner;
ALTER TABLE legacy_custody.classification_events OWNER TO kirion_g1b_owner;
ALTER FUNCTION legacy_custody.g3_extensions_guard() OWNER TO kirion_g1b_owner;

-- Fail-closed revocations from PUBLIC, app, Plan, repair, migrator, and N03 roles.
REVOKE ALL ON TABLE
 legacy_custody.watermark_checkpoints,
 legacy_custody.classification_events
FROM PUBLIC,kirion_g1b_app,kirion_g1b_custody,kirion_g1b_repair,kirion_g1b_migrator,n03_stage,n03_command,n03_reconcile,n03_reader;

REVOKE ALL ON FUNCTION legacy_custody.g3_extensions_guard()
FROM PUBLIC,kirion_g1b_app,kirion_g1b_custody,kirion_g1b_repair,kirion_g1b_migrator,n03_stage,n03_command,n03_reconcile,n03_reader;

REVOKE ALL ON DATABASE talibon_portal_test FROM n03_reader;
REVOKE ALL ON SCHEMA public, legacy_custody FROM n03_reader;
REVOKE ALL ON ALL TABLES IN SCHEMA legacy_custody FROM n03_reader;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM n03_reader;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM n03_reader;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA legacy_custody FROM n03_reader;

-- Strictly READ-ONLY grants for n03_reader (ZERO INSERT/UPDATE/DELETE/TRUNCATE anywhere).
GRANT CONNECT ON DATABASE talibon_portal_test TO n03_reader;
GRANT USAGE ON SCHEMA legacy_custody, public TO n03_reader;

GRANT SELECT ON TABLE
 legacy_custody.namespaces,
 legacy_custody.operations,
 legacy_custody.operation_items,
 legacy_custody.operation_gates,
 legacy_custody.generations,
 legacy_custody.command_results,
 legacy_custody.bindings,
 legacy_custody.ownership_links,
 legacy_custody.terminal_receipts,
 legacy_custody.watermark_checkpoints,
 legacy_custody.classification_events
TO n03_reader;

GRANT SELECT(id,name,role,is_active,account_status,session_version,suspended_at) ON public.users TO n03_reader;
GRANT SELECT(id,user_id,department_id,full_name,employment_status,separation_date) ON public.employees TO n03_reader;
GRANT SELECT(id,code,name,short_name,is_active,is_routable) ON public.departments TO n03_reader;
GRANT SELECT(id,public_id,title,document_type,classification,original_name,mime_type,size_bytes,storage_disk,storage_path,checksum_sha256,owner_department_id,uploaded_by_user_id,retention_code,security_domain,custody_mode,custody_operation_id,custody_ordinal,created_at,updated_at) ON public.documents TO n03_reader;
GRANT SELECT(id,document_id,linkable_type,linkable_id,relationship,created_by_user_id,created_at) ON public.document_links TO n03_reader;
GRANT SELECT(document_id) ON public.plan_document_origin_receipts, public.plan_document_bindings TO n03_reader;

-- Append-only G3 table grants for n03_command and n03_reconcile.
GRANT SELECT, INSERT ON TABLE
 legacy_custody.watermark_checkpoints,
 legacy_custody.classification_events
TO n03_command;

GRANT SELECT, INSERT ON TABLE
 legacy_custody.watermark_checkpoints
TO n03_reconcile;

COMMIT;
SELECT 'N03_G3_DISPOSABLE_READER_INSTALL_COMPLETE' AS result;
