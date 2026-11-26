-- N03 K2 additive role delta installer (synthetic PG16 role cluster only).
-- Must run strictly AFTER N03_DISPOSABLE_PG16_ROLE_INSTALL_R1.sql,
-- N03_G2B_DISPOSABLE_PG16_ROLE_INSTALL_R1.sql, and K2 migration.
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
BEGIN
 IF current_database()<>'talibon_portal_test'
 OR current_setting('server_version_num')::int NOT BETWEEN 160000 AND 169999
 OR current_setting('is_superuser')<>'on'
 OR current_setting('n03.lease',true) IS DISTINCT FROM 'EXCLUSIVE_PG16_SYNTHETIC_ONLY'
 OR to_regnamespace('legacy_custody') IS NULL
 OR to_regclass('legacy_custody.compensation_tombstones') IS NULL
 OR to_regclass('legacy_custody.compensation_outcomes') IS NULL
 OR NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='kirion_g1b_owner' AND NOT rolcanlogin AND NOT rolsuper)
 OR (SELECT count(*) FROM pg_roles WHERE rolname IN ('n03_stage','n03_command','n03_reconcile'))<>3
 OR NOT EXISTS(
   SELECT 1 FROM pg_constraint
   WHERE conrelid='legacy_custody.generations'::regclass
     AND contype='u'
     AND conname='n03_generation_compensation_tuple'
 )
 THEN RAISE EXCEPTION 'N03 K2 installer prerequisites failed'; END IF;
END $guard$;

-- Transfer ownership of K2 tables and guard function to kirion_g1b_owner.
ALTER TABLE legacy_custody.compensation_tombstones OWNER TO kirion_g1b_owner;
ALTER TABLE legacy_custody.compensation_outcomes OWNER TO kirion_g1b_owner;
ALTER FUNCTION legacy_custody.k2_compensation_guard() OWNER TO kirion_g1b_owner;

-- Fail-closed revoke from all roles and PUBLIC before granting narrow reconcile privileges.
REVOKE ALL ON TABLE
 legacy_custody.compensation_tombstones,
 legacy_custody.compensation_outcomes
FROM PUBLIC,kirion_g1b_app,kirion_g1b_custody,kirion_g1b_repair,kirion_g1b_migrator,n03_stage,n03_command,n03_reconcile;

REVOKE ALL ON FUNCTION legacy_custody.k2_compensation_guard()
FROM PUBLIC,kirion_g1b_app,kirion_g1b_custody,kirion_g1b_repair,kirion_g1b_migrator,n03_stage,n03_command,n03_reconcile;

-- Least-privilege K2 compensation grants: n03_reconcile ONLY (append-only SELECT + INSERT).
GRANT SELECT, INSERT ON TABLE
 legacy_custody.compensation_tombstones,
 legacy_custody.compensation_outcomes
TO n03_reconcile;

COMMIT;
SELECT 'N03_K2_DISPOSABLE_INSTALL_COMPLETE' AS result;
