-- Shared privilege policy; entrypoints validate target and prerequisites.
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

