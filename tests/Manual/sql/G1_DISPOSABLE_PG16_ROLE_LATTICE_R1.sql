-- KIRION FORGE / G1A: DISPOSABLE PG16 ROLE-LATTICE EXERCISE ONLY
-- Not a retained DB migration or an approved production privilege policy.
-- Independently attest a NEW exclusive throwaway PG16 cluster before running.
\set ON_ERROR_STOP on
\if :{?KIRION_G1_DISPOSABLE_ROLE_LEASE}
\else
  \echo 'REFUSING: missing disposable role-lattice lease'
  SELECT 1 / 0 AS missing_disposable_lease;
\endif

BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '15s';
SELECT set_config('kirion.g1_disposable_lease', :'KIRION_G1_DISPOSABLE_ROLE_LEASE', true);

DO $guard$
DECLARE
    function_count integer;
    existing_roles integer;
BEGIN
    IF current_database() <> 'talibon_portal_test'
       OR current_setting('server_version_num')::integer < 160000
       OR current_setting('server_version_num')::integer >= 170000
       OR current_setting('is_superuser') <> 'on'
       OR current_setting('kirion.g1_disposable_lease', true)
          IS DISTINCT FROM 'EXCLUSIVE_PG16_THROWAWAY_QA_ONLY'
    THEN
        RAISE EXCEPTION 'Only a leased, exclusive, disposable PG16 test database is permitted';
    END IF;

    SELECT count(*) INTO existing_roles FROM pg_catalog.pg_roles
      WHERE rolname IN ('kirion_g1_probe_migration', 'kirion_g1_probe_app',
                        'kirion_g1_probe_custody', 'kirion_g1_probe_repair');
    IF existing_roles <> 0 THEN
        RAISE EXCEPTION 'G1 synthetic probe role name collision; no existing roles may be altered';
    END IF;

    IF to_regclass('public.documents') IS NULL
       OR to_regclass('public.document_links') IS NULL
       OR to_regclass('public.plan_families') IS NULL
       OR to_regclass('public.plan_editions') IS NULL
       OR to_regclass('public.plan_document_origin_receipts') IS NULL
       OR to_regclass('public.plan_document_bindings') IS NULL
    THEN
        RAISE EXCEPTION 'G1 role test needs the disposable G2F migration-produced schema';
    END IF;

    SELECT count(*) INTO function_count FROM pg_catalog.pg_proc p
      WHERE p.pronamespace = 'public'::regnamespace
        AND p.proname IN ('kirion_plan_document_guard', 'kirion_plan_origin_receipt_guard',
                          'kirion_plan_stamp_origin', 'kirion_plan_generic_link_guard',
                          'kirion_plan_typed_binding_guard')
        AND p.pronargs = 0 AND p.prorettype = 'pg_catalog.trigger'::regtype;
    IF function_count <> 5 THEN
        RAISE EXCEPTION 'Expected five G2B/G2C Plan trigger functions, found %', function_count;
    END IF;
END;
$guard$;

-- Capture actual owner, SECURITY INVOKER/DEFINER, and PUBLIC EXECUTE status.
SELECT p.proname AS function_name,
       pg_catalog.pg_get_userbyid(p.proowner) AS current_owner,
       p.prosecdef AS security_definer,
       p.proacl AS explicit_acl,
       EXISTS (SELECT 1 FROM pg_catalog.aclexplode(
           coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))
       ) AS a WHERE a.grantee = 0 AND a.privilege_type = 'EXECUTE')
         AS effective_public_execute
  FROM pg_catalog.pg_proc p
 WHERE p.pronamespace = 'public'::regnamespace
   AND p.proname IN ('kirion_plan_document_guard', 'kirion_plan_origin_receipt_guard',
                     'kirion_plan_stamp_origin', 'kirion_plan_generic_link_guard',
                     'kirion_plan_typed_binding_guard')
 ORDER BY p.proname;

-- All roles and ACL changes exist in this rollback-only transaction.
CREATE ROLE kirion_g1_probe_migration NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE kirion_g1_probe_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE kirion_g1_probe_custody NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE kirion_g1_probe_repair NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION
  public.kirion_plan_document_guard(),
  public.kirion_plan_origin_receipt_guard(),
  public.kirion_plan_stamp_origin(),
  public.kirion_plan_generic_link_guard(),
  public.kirion_plan_typed_binding_guard()
FROM PUBLIC;

GRANT USAGE ON SCHEMA public TO kirion_g1_probe_app, kirion_g1_probe_custody, kirion_g1_probe_repair;
GRANT SELECT ON TABLE public.documents, public.document_links, public.plan_families,
  public.plan_editions, public.plan_document_origin_receipts, public.plan_document_bindings
TO kirion_g1_probe_app, kirion_g1_probe_custody;

-- An illustrative custody column write, NOT a complete operational workflow.
GRANT UPDATE (security_domain) ON TABLE public.documents TO kirion_g1_probe_custody;
GRANT INSERT ON TABLE public.plan_document_origin_receipts,
  public.plan_document_bindings TO kirion_g1_probe_custody;
-- Repair role receives NO direct DML grants.

DO $check$
DECLARE
    bad_function_count integer;
    bad_role_count integer;
BEGIN
    SELECT count(*) INTO bad_function_count
      FROM pg_catalog.pg_proc p
     WHERE p.pronamespace = 'public'::regnamespace
       AND p.proname IN ('kirion_plan_document_guard', 'kirion_plan_origin_receipt_guard',
                         'kirion_plan_stamp_origin', 'kirion_plan_generic_link_guard',
                         'kirion_plan_typed_binding_guard')
       AND (p.prosecdef
         OR pg_catalog.has_function_privilege('kirion_g1_probe_app', p.oid, 'EXECUTE')
         OR EXISTS (SELECT 1 FROM pg_catalog.aclexplode(
                coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))
            ) AS a WHERE a.grantee = 0 AND a.privilege_type = 'EXECUTE'));
    IF bad_function_count <> 0 THEN
        RAISE EXCEPTION 'Unsafe effective trigger-function privilege/SECURITY DEFINER: %', bad_function_count;
    END IF;

    SELECT count(*) INTO bad_role_count FROM pg_catalog.pg_roles
     WHERE rolname IN ('kirion_g1_probe_migration', 'kirion_g1_probe_app',
                       'kirion_g1_probe_custody', 'kirion_g1_probe_repair')
       AND (rolcanlogin OR rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls);
    IF bad_role_count <> 0 THEN
        RAISE EXCEPTION 'G1 simulated roles may not have elevated role attributes';
    END IF;

    IF NOT pg_catalog.has_table_privilege('kirion_g1_probe_app', 'public.documents', 'SELECT')
       OR NOT pg_catalog.has_table_privilege('kirion_g1_probe_app', 'public.plan_document_origin_receipts', 'SELECT')
       OR pg_catalog.has_table_privilege('kirion_g1_probe_app', 'public.plan_document_bindings', 'INSERT')
       OR pg_catalog.has_table_privilege('kirion_g1_probe_app', 'public.plan_document_bindings', 'UPDATE')
       OR pg_catalog.has_table_privilege('kirion_g1_probe_app', 'public.documents', 'DELETE')
       OR pg_catalog.has_table_privilege('kirion_g1_probe_repair', 'public.documents', 'UPDATE')
       OR pg_catalog.has_table_privilege('kirion_g1_probe_repair', 'public.plan_document_bindings', 'DELETE')
       OR NOT pg_catalog.has_column_privilege('kirion_g1_probe_custody', 'public.documents', 'security_domain', 'UPDATE')
       OR pg_catalog.has_column_privilege('kirion_g1_probe_custody', 'public.documents', 'storage_path', 'UPDATE')
       OR pg_catalog.has_schema_privilege('kirion_g1_probe_app', 'public', 'CREATE')
    THEN
        RAISE EXCEPTION 'G1 synthetic role-lattice assertions violated';
    END IF;
END;
$check$;

-- Exercise authorization under the simulated role (not catalog-only checks).
SET LOCAL ROLE kirion_g1_probe_app;
SELECT count(*) AS app_may_read_synthetic_receipts FROM public.plan_document_origin_receipts;
DO $appdeny$
BEGIN
    BEGIN
        UPDATE public.plan_document_bindings SET binding_state = 'QUARANTINED' WHERE FALSE;
        RAISE EXCEPTION 'FAIL: ordinary role unexpectedly updated protected Plan bindings';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'PASS: ordinary role denied protected Plan UPDATE';
    END;
    BEGIN
        DELETE FROM public.plan_document_origin_receipts WHERE FALSE;
        RAISE EXCEPTION 'FAIL: ordinary role unexpectedly deleted origin receipts';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'PASS: ordinary role denied origin receipt DELETE';
    END;
END;
$appdeny$;
RESET ROLE;

SET LOCAL ROLE kirion_g1_probe_custody;
UPDATE public.documents SET security_domain = security_domain WHERE FALSE;
RESET ROLE;

SET LOCAL ROLE kirion_g1_probe_repair;
DO $repairdeny$
BEGIN
    BEGIN
        UPDATE public.documents SET security_domain = 'EVER_PLAN' WHERE FALSE;
        RAISE EXCEPTION 'FAIL: unapproved repair role unexpectedly wrote provenance';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'PASS: repair role denied direct provenance UPDATE';
    END;
END;
$repairdeny$;
RESET ROLE;

-- No role, ACL, function, or table privilege persists beyond this line.
ROLLBACK;
DO $post$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname IN
      ('kirion_g1_probe_migration', 'kirion_g1_probe_app',
       'kirion_g1_probe_custody', 'kirion_g1_probe_repair')) THEN
        RAISE EXCEPTION 'Disposable role exercise left cluster-wide role residue';
    END IF;
END;
$post$;
SELECT 'G1_DISPOSABLE_ROLE_LATTICE_PASSED_AND_ROLLED_BACK' AS result;
