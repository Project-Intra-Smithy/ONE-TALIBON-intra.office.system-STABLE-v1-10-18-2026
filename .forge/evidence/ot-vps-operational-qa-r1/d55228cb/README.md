# R4 bounded N79-01-only corrective successor — qualification record (`d55228cb`)

Mission `OT-VPS-OPERATIONAL-QA-R1`. Accountable Engineer: KIRCH (`Kirch-Nairu` / `291564617`). Executor: Antigravity (sole executor under transition `7226741955`/`7226753999` and R4 order `7228448263`). OperationForge pin `0e8765de6e0e87ea9b4503714f08fa650e1a79c6` / Ponytail full. Frozen PR78 (`ad1d6d60`), PR79 (`34116e7e`), PR80 (`b8657ee3`), PR81 (`71da9dc4`) and `main` (`f5a74a7b`) preserved unchanged. No VPS mutation, backup/snapshot/reset, redundant deployed instance, main merge, Kurt, extra agents or Siris activation.

Authority: [R4 corrective order 7228448263](https://github.com/Project-Intra-Smithy/engineering-hub/issues/197#issuecomment-7228448263), [Nox PR81 review 6093466425](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/pull/81#pullrequestreview-6093466425) (`N79-02`, `N79-03`, `N79-04` and canonical reproduction **PASS**; **`N79-01` HOLD only**), paired R4 START `7228476910` / `1934b7729733de4dc6f92ff2f32a7430fed248dd` / `7228493502`. Existing canonical-main propagation exception retained.

Frozen candidate [draft PR82](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/pull/82):
- **Branch:** `candidate/ot-persistent-deployment-r4`
- **Exact HEAD SHA:** `d55228cba9fca025a5b8bcf9494df5da879b7995`
- **Git tree SHA:** `703f093c6be9d9ff16be4dd14c960d6ab6726a0b`
- **Authenticated launcher SHA-256:** `800849047fe4ea4cd5cf26f1308fe7aa42046642dba1ad82d6b081a724e1bef1` (identical to R3 — zero changes to N79-04 launcher, N79-02 registry/retirement continuity, or N79-03 credential boundary)

Qualification does not self-award independent security acceptance or authorize VPS deployment.

## N79-01 Residual Closure & Discriminating Trace

| Residual | Implementation (`71da9dc4..d55228cb`) | Discriminating Pre-Fix vs. Post-Fix Proof ([discriminating-witness.json](discriminating-witness.json)) & Full Rehearsal |
|---|---|---|
| **A. Existing system view & rewrite security** | `app/Deployment/SecurityCatalog.php`: runs snapshot under controlled `search_path = pg_catalog` (restored in `finally`), extends `system_relation_security` with `c.reloptions` and `CASE WHEN c.relkind IN ('v','m') THEN pg_get_viewdef(c.oid,true) END AS definition`, and adds `system_rewrite_security` (`n.nspname||'.'||c.relname||'.'||r.rulename`, `ev_type`, `ev_enabled`, `is_instead`, `pg_get_ruledef(r.oid,true)` for `pg_catalog`/`information_schema`). `app/Deployment/PersistentSecurity.php`: adds `system_rewrite_security` to explicit initial-preflight system family check. Canonical contract index and shards (`system_rewrite_security-0..1.json`, updated `system_relation_security`, etc.) independently regenerated. | Pre-fix `71da9dc4` passed all 3 injections; post-fix `d55228cb` refused each at the intended gate and passed after clean restoration: `system_view_security_options` (`security_invoker=true, security_barrier=true`), `system_view_definition` (`information_schema.applicable_roles` replaced), and `system_rewrite_rule` (`CREATE RULE` on `information_schema.tables`). All 3 covered in initial preflight + rollback and registered drift + semantic rollback + fixture cleanup on both fresh and 54-migration upgrade (Linux + Windows). |
| **B. Default database tablespace** | `app/Deployment/SupportedPg16.php`: extends `user_tablespaces` predicate to include `OR oid=(SELECT dattablespace FROM pg_database WHERE datname=current_database())` while preserving unrelated unused cluster tablespaces. `app/Deployment/SecurityCatalog.php`: adds `(SELECT spcname FROM pg_tablespace WHERE oid=d.dattablespace) AS tablespace` to `database` section (included in semantic rollback witnesses). | Pre-fix `71da9dc4` passed `ALTER DATABASE ... SET TABLESPACE qa_target_ts` with implicit relation placement (`0` non-default/non-global `pg_class.reltablespace`); post-fix `d55228cb` refused with `Unsupported ONE TALIBON PG16 object family: user_tablespaces`, preserved unrelated `qa_unused_ts` across full fresh and upgrade lifecycles, and proved unchanged rollback state on both platforms. |

**Preservation of previously accepted findings (`N79-02`, `N79-03`, `N79-04`):** Zero edits to `scripts/deployment/verified-install.py`, `scripts/deployment/build-package.py`, `app/Deployment/CredentialBoundary.php`, `app/Deployment/PersistentInstaller.php`, `database/deployment/registry.sql`, `database/deployment/finalize.sql`, the nine guarded migrations, the six shared privilege policy SQL bodies, or dependency lockfiles.

## Observed Exact-Source Qualification (`d55228cba9fca025a5b8bcf9494df5da879b7995`)

All **15/15 hosted jobs PASS** at exact SHA `d55228cba9fca025a5b8bcf9494df5da879b7995` ([hosted-runs.json](hosted-runs.json)):

- **[Persistent installation - PG16 fresh and upgrade #46128729496](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/actions/runs/46128729496)** (`1/1` job `140929007936` PASS; [46128729496-artifacts.json](46128729496-artifacts.json)):
  - Bounded source & shared policy integrity verifier: **PASS**.
  - Independent guarded canonical policy contract regeneration & comparison (`PG 16.16` / `160016`): **PASS** (`independently_regenerated: true`, `matches: true`, [linux-contract-comparison.json](linux-contract-comparison.json)).
  - **Linux persistent qualification:** **`514 / 514` unique checks PASS (`0` failed)** ([linux-persistent-rehearsal.json](linux-persistent-rehearsal.json)); **`468 / 468` R3 containment (`missing = 0`)**; **`303 / 303` R2 containment (`missing = 0`)**.
- **[Functional completion - Protected PG16 #46128732598](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/actions/runs/46128732598)** (`12/12` jobs PASS; [46128732598-artifacts.json](46128732598-artifacts.json)):
  - `Traceability Core full` (`140929017606`): **`OK (914 tests, 12836 assertions)`**.
- **[TCDS Phase A presentation evidence #46128725665](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/actions/runs/46128725665)** (`2/2` jobs PASS; [46128725665-artifacts.json](46128725665-artifacts.json)):
  - `presentation` (`140928996400`) and `canonical-runtime` (`140928996252`, artifact `15256758280`) PASS.
- **Windows exact-source qualification (`PG 16.15` / `160015`, uninterrupted `17:04:29`–`18:32:45 +08:00`):**
  - Independent guarded canonical policy contract regeneration & comparison (`PG 16.15` / `160015`): **PASS** (`independently_regenerated: true`, `matches: true`, [windows-contract-comparison.json](windows-contract-comparison.json)).
  - **Windows persistent qualification:** **`504 / 504` unique checks PASS (`0` failed)** (`1` builder + `235` `fresh_*` + `268` `upgrade_*`), SHA-256 `70ae018e382c76d94be66392369f97304a183640a0cae06fb7dacd7eead25254` ([windows-persistent-rehearsal.json](windows-persistent-rehearsal.json)); **`458 / 458` R3 containment (`missing = 0`)**; **`303 / 303` R2 containment (`missing = 0`)**.
  - Both disposable PG16 clusters cleanly stopped (`40P01_deadlocks = 0`), zero active processes, and all private credential/target files removed (`sensitive_or_canary = NONE`).

## Linux (`514`) vs. Windows (`504`) Reconciliation

After normalizing the platform permission label (`private_mode_required` ↔ `private_acl_required`), Linux (`514`) and Windows (`504`) match identically except for the exact **10 `PG 16.16`-only `minor_routine_acl` checks** (`fresh` x5 and `upgrade` x5 for `OID 4551`), with **0** Windows-only differences. Both platforms add the exact same **46** new N79-01 residual checks (`+23` per mode × 2 modes).

No secret values, SCRAM verifiers, private inputs, or raw server logs are published (`0` secret/verifier pattern hits across all published evidence files).

## Current Disposition

**`EXACT_SOURCE_QUALIFICATION_PASS / HOSTED_15_15 / LINUX_514_514 / WINDOWS_504_504 / R3_468_458_CONTAINED / R2_303_303_CONTAINED / NONAUTHOR_REACCEPTANCE_PENDING`.**

Next required external gates:
1. Bounded independent **Kirion-Nox** reacceptance of **`N79-01`** and preservation confirmation of **`N79-02`–`N79-04`** at exact frozen `d55228cba9fca025a5b8bcf9494df5da879b7995`.
2. Final **Maintainer / Engineer** disposition before resuming the authorized VPS deployment mission.
