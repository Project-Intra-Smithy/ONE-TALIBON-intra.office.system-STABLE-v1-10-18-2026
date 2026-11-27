-- Shared privilege policy; entrypoints validate target and prerequisites.
CREATE ROLE kirion_g1b_owner NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE kirion_g1b_migrator LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE kirion_g1b_app LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE kirion_g1b_custody LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE kirion_g1b_repair NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;

-- Passwords are psql variables supplied only to the disposable executor.

GRANT kirion_g1b_owner TO kirion_g1b_migrator;
DO $database_acl$ BEGIN EXECUTE format('GRANT CONNECT ON DATABASE %I TO kirion_g1b_migrator, kirion_g1b_app, kirion_g1b_custody', current_database()); END $database_acl$;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO kirion_g1b_migrator, kirion_g1b_app, kirion_g1b_custody, kirion_g1b_repair;
GRANT CREATE ON SCHEMA public TO kirion_g1b_owner;

-- One NOLOGIN owner owns the complete Laravel schema so future migrations can
-- alter legacy as well as protected objects only after the migrator SET ROLE.
DO $object_owners$
DECLARE name text;
BEGIN
  FOR name IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO kirion_g1b_owner', name);
  END LOOP;
  FOR name IN SELECT sequencename FROM pg_sequences WHERE schemaname='public' LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO kirion_g1b_owner', name);
  END LOOP;
END $object_owners$;

ALTER FUNCTION public.kirion_plan_document_guard() OWNER TO kirion_g1b_owner;
ALTER FUNCTION public.kirion_plan_origin_receipt_guard() OWNER TO kirion_g1b_owner;
ALTER FUNCTION public.kirion_plan_stamp_origin() OWNER TO kirion_g1b_owner;
ALTER FUNCTION public.kirion_plan_generic_link_guard() OWNER TO kirion_g1b_owner;
ALTER FUNCTION public.kirion_plan_typed_binding_guard() OWNER TO kirion_g1b_owner;
ALTER FUNCTION public.kirion_plan_custody_generation_guard() OWNER TO kirion_g1b_owner;
ALTER FUNCTION public.kirion_plan_custody_append_only_guard() OWNER TO kirion_g1b_owner;
ALTER FUNCTION public.kirion_plan_custody_scan_guard() OWNER TO kirion_g1b_owner;

-- PostgreSQL's built-in PUBLIC function EXECUTE default is global. A per-schema
-- REVOKE does not override that global default, so this creator default is global.
ALTER DEFAULT PRIVILEGES FOR ROLE kirion_g1b_owner REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.kirion_plan_document_guard(),
  public.kirion_plan_origin_receipt_guard(), public.kirion_plan_stamp_origin(),
  public.kirion_plan_generic_link_guard(), public.kirion_plan_typed_binding_guard(),
  public.kirion_plan_custody_generation_guard(), public.kirion_plan_custody_append_only_guard(),
  public.kirion_plan_custody_scan_guard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kirion_plan_document_guard(),
  public.kirion_plan_origin_receipt_guard(), public.kirion_plan_stamp_origin(),
  public.kirion_plan_generic_link_guard(), public.kirion_plan_typed_binding_guard(),
  public.kirion_plan_custody_generation_guard(), public.kirion_plan_custody_append_only_guard(),
  public.kirion_plan_custody_scan_guard() TO kirion_g1b_owner;

-- Current legacy application tables remain operational. Protected tables and the
-- documents column boundary are excluded and granted explicitly below.
DO $legacy_grants$
DECLARE table_name text; sequence_name text;
BEGIN
  FOR table_name IN SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename NOT IN
      ('migrations','documents','plan_families','plan_editions',
       'plan_document_origin_receipts','plan_document_bindings',
       'plan_custody_generations','plan_custody_scan_evidence','plan_custody_events')
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO kirion_g1b_app', table_name);
  END LOOP;
  FOR sequence_name IN SELECT sequencename FROM pg_sequences
    WHERE schemaname = 'public' AND sequencename NOT IN
      ('plan_families_id_seq','plan_editions_id_seq','plan_document_bindings_id_seq')
      AND sequencename NOT LIKE 'plan_custody_%'
  LOOP
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE public.%I TO kirion_g1b_app', sequence_name);
  END LOOP;
END $legacy_grants$;

GRANT SELECT ON public.documents, public.plan_families, public.plan_editions,
  public.plan_document_origin_receipts, public.plan_document_bindings TO kirion_g1b_app;
GRANT INSERT (public_id,title,document_type,classification,original_name,mime_type,size_bytes,
  storage_disk,storage_path,checksum_sha256,owner_department_id,uploaded_by_user_id,
  retention_code,metadata,created_at,updated_at) ON public.documents TO kirion_g1b_app;
GRANT UPDATE (title,document_type,classification,original_name,mime_type,size_bytes,
  storage_disk,storage_path,checksum_sha256,owner_department_id,uploaded_by_user_id,
  retention_code,metadata,created_at,updated_at) ON public.documents TO kirion_g1b_app;
GRANT DELETE ON public.documents TO kirion_g1b_app;
GRANT USAGE, SELECT ON SEQUENCE public.documents_id_seq TO kirion_g1b_app;

GRANT SELECT ON public.documents, public.document_links, public.plan_families,
  public.plan_editions, public.plan_document_origin_receipts, public.plan_document_bindings
  TO kirion_g1b_custody;
GRANT UPDATE (security_domain) ON public.documents TO kirion_g1b_custody;
GRANT INSERT ON public.plan_document_origin_receipts, public.plan_document_bindings TO kirion_g1b_custody;
GRANT USAGE, SELECT ON SEQUENCE public.plan_document_bindings_id_seq TO kirion_g1b_custody;
-- kirion_g1b_repair deliberately receives schema USAGE only and cannot log in.

