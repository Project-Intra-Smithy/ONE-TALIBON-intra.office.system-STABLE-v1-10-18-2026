# R3 bounded corrective successor — qualification record (`71da9dc4`)

Mission `OT-VPS-OPERATIONAL-QA-R1`. Accountable Engineer: KIRCH (`Kirch-Nairu` / `291564617`). Implementation writer: Codex (`b9978565`–`71da9dc4`); executor transition to Antigravity for final Windows qualification, reconciliation and evidence publication ([Hub#197/7226741955](https://github.com/Project-Intra-Smithy/engineering-hub/issues/197#issuecomment-7226741955), paired memory `e4dfed67887ffabd87066ef9c21ce473b3587081`). OperationForge pin `0e8765de6e0e87ea9b4503714f08fa650e1a79c6` / Ponytail full. Frozen PR78 (`ad1d6d60`), PR79 (`34116e7e`), PR80 (`b8657ee3`) and `main` (`f5a74a7b`) preserved unchanged. No VPS mutation, backup/snapshot/reset, redundant deployed instance, main merge, Kurt, extra agents or rollout.

Authority: [R3 corrective order 7223309777](https://github.com/Project-Intra-Smithy/engineering-hub/issues/197#issuecomment-7223309777), [Nox PR80 HOLD 6090942300](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/pull/80#pullrequestreview-6090942300), paired START `7223421087` / `b9978565` / `7223434610`. Existing canonical-main propagation exception retained.

Frozen candidate [draft PR81](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/pull/81):
- **Branch:** `candidate/ot-persistent-deployment-r3`
- **Exact HEAD SHA:** `71da9dc4d12e4fc77de9d5f4eb98efed151fb46f`
- **Git tree SHA:** `92b62162670f43bf88c63a49a28299375fe84d94`
- **Authenticated launcher SHA-256:** `800849047fe4ea4cd5cf26f1308fe7aa42046642dba1ad82d6b081a724e1bef1`

Qualification does not self-award independent security acceptance or authorize VPS deployment.

## Finding-to-implementation and adversarial trace (`N79-01`–`N79-04`)

| Finding | R3 Corrective Mechanism | Discriminating Qualification (Linux + Windows) |
|---|---|---|
| **N79-04** (Priority 1, pre-bootstrap executable containment) | `scripts/deployment/verified-install.py` runs under `python -I -S` with same-byte outer hash verification, independently pinned absolute PHP and private provisioning INI digests, complete package walk + native permission/DACL check + SHA-256 manifest match, OS-derived Windows system directory (`GetWindowsDirectoryW`), minimal explicit PHP environment, and Laravel cache/storage/dotenv/home/libpq paths bound inside the verified package or private temporary bootstrap. | External PHP cache/path execution canaries (`unverified.php`, `hashlib.py`, zero `execution-canary` created); unpinned/tampered INI; outer Python `PYTHONPATH`/`PYTHONHOME`/`PYTHONSTARTUP` and Windows `SystemRoot`/`WINDIR`; relative PHP refusal; package/SQL/vendor/lockfile/build/manifest/launcher tampering; native Unix mode / Windows DACL negatives. |
| **N79-01** (finite PG16 catalog boundary & independent contract reproduction) | `app/Deployment/SupportedPg16.php` and `docs/deployment/PG16-SUPPORTED-BOUNDARY.md` refuse enumerated unsupported object families and reserved namespaces prior to mutation. `SecurityCatalog.php` covers all indexed security sections including complete system language/extension/schema/column/type/routine/relation sections with fixed hashed PG16.15/16.16 catalog profiles. Checked-in contract sharded into reviewer-inspectable hashed files (`database/deployment/security-contract/*.json`). Hosted persistent workflow independently regenerates and compares the canonical contract in the original guarded disposable lane. Migration ledger acquires `AccessExclusive` lock before writes under existing `5s` lock timeout. | Fresh and 54-migration upgrade + registered drift; unsupported large objects, FDW/server/user mapping, publication/subscription, domain, system-schema additions, reserved namespaces, user collation; semantic catalog/registry/unsupported rollback witnesses; initial and registered system language/schema/column/type/routine ACL negatives (+ PG16.16 `minor_routine_acl` on Linux); `55P03` maintenance-lock refusal + rollback; independent guarded contract comparison PASS on Linux PG16.16 ([linux-contract-comparison.json](linux-contract-comparison.json)) and Windows PG16.15 ([windows-contract-comparison.json](windows-contract-comparison.json)). |
| **N79-02** (durable retirement continuity) | `database/deployment/registry.sql` (format 3) and `PersistentInstaller.php` / `PersistentSecurity.php` persist and bind target name/OID, cluster, endpoint, bootstrap name/OID, and canonical disjoint `legacy_owner_roles` / `retired_runtime_roles` name+OID sets to the registry and independently retained receipt before caller-controlled retirement scope is used. | Omitted, reduced, substituted (`replacement_runtime`) and reclassified retirement identity sets; retired role assume-role authority drift combined with omission; original split owner/runtime ownership/membership/inheritance drift; unrelated database and roles proven unchanged; no global role deletion/disabling. |
| **N79-03** (registered password proof & confidentiality) | Credential loading strictly follows N79-04 containment, transport, and logging/instrumentation preflight. Local SCRAM verifier generation keeps plaintext out of SQL. Each registered role requires positive (correct password) and negative (wrong password) fresh connections under explicit `PGREQUIREAUTH=scram-sha-256` / no-fallback `libpq` environment. | Per-role wrong credential file rejection for all 7 managed roles; permissive non-password (`trust`) HBA refusal; real runtime + Laravel connections; success and injected late rollback plaintext + SCRAM verifier canary scans of server and client/error logs; no credential rotation on rerun; verbose logging/audit/TLS/instrumentation refusals. |

See [R3-SOURCE-REVIEW.md](R3-SOURCE-REVIEW.md) for the writer's non-accepting source inspection and contract mismatch diagnosis (`PG16.15` vs `PG16.16` `OID 4551`).

## Observed Exact-Source Qualification (`71da9dc4d12e4fc77de9d5f4eb98efed151fb46f`)

All **15/15 hosted jobs PASS** at exact SHA `71da9dc4d12e4fc77de9d5f4eb98efed151fb46f` ([hosted-runs.json](hosted-runs.json)):

- **[Persistent installation - PG16 fresh and upgrade #46042014239](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/actions/runs/46042014239)** (`1/1` job `140651831813` PASS; artifact `15220194812`):
  - Bounded source & shared policy integrity verifier: **PASS** (original nine guarded migration bodies, six shared privilege policies, disposable guards, and lockfiles preserved).
  - Independent guarded canonical policy contract regeneration & comparison (`PG 16.16` / `160016`): **PASS** (`2/2` checks, `independently_regenerated: true`, `matches: true`, [linux-contract-comparison.json](linux-contract-comparison.json)).
  - **Linux persistent qualification:** **`468 / 468` unique checks PASS (`0` failed)** ([linux-persistent-rehearsal.json](linux-persistent-rehearsal.json)); **`303 / 303` prior R2 Linux cases contained (`missing = 0`)**.
- **[Functional completion - Protected PG16 #46042014365](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/actions/runs/46042014365)** (`12/12` jobs PASS; [46042014365-artifacts.json](46042014365-artifacts.json)):
  - `Traceability Core full` (`140651832801`): **`OK (914 tests, 12836 assertions)`** ([protected-counts.json](protected-counts.json), [planning-junit.xml](planning-junit.xml)).
- **[TCDS Phase A presentation evidence #46042057427](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/actions/runs/46042057427)** (`2/2` jobs PASS; [46042057427-artifacts.json](46042057427-artifacts.json)):
  - Presentation contract/UX/auth suites: `129/129`, `9/9`, `10/10` PASS ([presentation-counts.json](presentation-counts.json)).
  - Canonical browser observations ([canonical-summary.json](canonical-summary.json)): `source_worktree_dirty: false`, `completed: true`, **`96` routes / `79` interactions / `168` screenshots**, `0` overflow, `0` browser errors. (Disposable GitHub browser observations, not live VPS verification.)
- **Windows exact-source qualification (`PG 16.15` / `160015`):**
  - Independent guarded canonical policy contract regeneration & comparison (`PG 16.15` / `160015`): **PASS** (`2/2` checks, `independently_regenerated: true`, `matches: true`, [windows-contract-comparison.json](windows-contract-comparison.json)).
  - **Windows persistent qualification:** **`458 / 458` unique checks PASS (`0` failed)** (`1` `trusted_builder_source` + `212` `fresh_*` + `245` `upgrade_*`), SHA-256 `dadff03d50d853d6d52261d60eab28919ffd923ea276889e7e1459a0fbc89db5` ([windows-persistent-rehearsal.json](windows-persistent-rehearsal.json)); **`303 / 303` prior R2 Windows cases contained (`missing = 0`)**. Both disposable PG16 clusters cleanly stopped and private credential/target files removed.

## Linux (`468`) vs. Windows (`458`) Reconciliation

After normalizing the platform permission label (`private_mode_required` on Linux ↔ `private_acl_required` on Windows), the two passing inventories are **identical except for the exact 10 `PG 16.16`-only `minor_routine_acl` checks** (`fresh` x5 and `upgrade` x5 for `OID 4551` `binary_upgrade_set_next_attribute_versions(pg_lsn[])`, gated by `server_version_num == '160016'` in `tests/Manual/persistent-install-rehearsal.py`):
- `Only in Linux (10)`: `{fresh,upgrade}_{initial_minor_routine_acl,initial_minor_routine_acl_rollback,rejects_catalog_minor_routine_acl,drift_rollback_catalog_minor_routine_acl,fixture_cleanup_catalog_minor_routine_acl}`
- `Only in Windows (0)`: none.

## Preserved Failure / Interruption Evidence

- Earlier Windows rehearsal on `8a40663f` hit a PG `40P01` deadlock with autovacuum on `public.migrations`; resolved in `71da9dc4` via `AccessExclusive` lock on `public.migrations` before ledger writes (plus discriminating `55P03` lock-holder witness).
- Earlier Codex-launched Windows rehearsal on `71da9dc4` stopped at `410/458` (`03:05:50 PHT`) because the laptop entered Windows Modern Standby (`Kernel-Power` Event ID `506`/`507`, `02:52:52`–`03:05:45`, Reason: `Lid`), expiring the `240s` subprocess timeout on wake. That partial receipt is retained locally in `C:/dev/TAL/artifacts/OT-VPS-PERSISTENT-R3/71da9dc4-windows/` and is **not** counted as a pass; the complete uninterrupted `458/458` run above supersedes it.

## Trust Assumptions & Residual Risks

- Finite supported boundary: stock PostgreSQL `16.15` / `16.16`, empty or canonical 54-migration legacy target, classified owner/runtime roles, and exact-package registered rerun.
- Assumes independently trusted operator/build host, Python/PHP/PG16/OS binaries, TLS CA trust, and exclusive package/target maintenance custody during invocation (not a guarantee against a malicious root/kernel/build host or live process-memory extraction).
- No secret values, SCRAM verifiers, private inputs, or raw server logs are published (`0` secret/verifier pattern hits across all published evidence files).

## Current Disposition

**`EXACT_SOURCE_QUALIFICATION_PASS / HOSTED_15_15 / LINUX_468_468 / WINDOWS_458_458 / R2_303_303_CONTAINED / NONAUTHOR_REACCEPTANCE_PENDING`.**

Next required external gates:
1. Bounded independent **Kirion-Nox** reacceptance of `N79-01`–`N79-04` at exact frozen `71da9dc4d12e4fc77de9d5f4eb98efed151fb46f`.
2. Final **Maintainer / Engineer** disposition before resuming the previously authorized VPS deployment mission.

No VPS deployment, main merge, Siris activation, or independent acceptance is awarded here.
