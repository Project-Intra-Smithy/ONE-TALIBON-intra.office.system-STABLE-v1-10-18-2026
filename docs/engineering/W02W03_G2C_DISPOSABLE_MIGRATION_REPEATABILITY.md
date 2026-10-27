# W02/W03 G2C — disposable migration repeatability correction

**Trigger:** Codex receipt Issue #157 comment #6452133558: clean PG16 migration,
8/8 focused tests and 30 assertions passed; subsequent Laravel RefreshDatabase
setup failed with SQLSTATE 42723 because PostgreSQL retains mission-owned
trigger functions when `migrate:fresh` drops tables.

**Fix:** Replace only the five `CREATE FUNCTION kirion_plan_*()` definitions in
`2026_10_28_011000_add_plan_origin_and_quarantined_bindings.php` with
`CREATE OR REPLACE FUNCTION`. Function bodies, names, SECURITY INVOKER
semantics, search_path, trigger definitions, irreversible `down()`, typed
binding quarantine and existing security guards remain unchanged.

This change enables a second fresh-schema setup *when the existing functions
are owned by the approved test role*; it does NOT validate owner/grant
partitioning, disaster recovery or production migration. In particular,
`CREATE OR REPLACE` preserves an existing function's privileges, so qualified
DBA review is still necessary for any retained DB or production role design.

**New opt-in test:** `tests/Manual/PlanMigrationRepeatabilityTest.php` is OUTSIDE
normal PHPUnit discovery. It intentionally invokes two destructive
`migrate:fresh` cycles against `talibon_portal_test`, requires PostgreSQL 16
and rejects missing `KIRION_W02W03_DISPOSABLE_LEASE=EXCLUSIVE_PG16_THROWAWAY_QA_ONLY`.
That environment flag alone does not prove host isolation or consent: the
runner must independently attest the newly created synthetic container,
private address, tmpfs/ephemeral volume and disposable database **before**
setting it. Never run against a shared, retained, staging, demo or production DB.

**Execution gate:** No access to the previously used Windows Codex runner in
this source-write session. This batch requires a distinct leased executable
Codex/PG16 run to prove two fresh lifecycles, 8 focused tests, affected legacy
regressions and 75-case security status. No assertion or SQLSTATE is claimed
passed here until actual execution. 75 cases remain NOT_RUN; Kirion-Nox remains
independent nonauthor; W01–W08 series remains ON HOLD.
