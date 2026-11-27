# Persistent deployment correction — qualified source, acceptance pending

Mission OT-VPS-OPERATIONAL-QA-R1, 27 November 2026 PHT. Engineer KIRCH accountable; Maintainer orchestration; Codex sole writer/executor. OperationForge pinned 0e8765de6e0e87ea9b4503714f08fa650e1a79c6 and Ponytail full. No additional agent process or Kurt involvement.

[Engineer-authorized continuation START7218647858](https://github.com/Project-Intra-Smithy/engineering-hub/issues/197#issuecomment-7218647858), [paired START46140e41](https://github.com/Project-Intra-Smithy/engineering-hub/issues/197#issuecomment-7218660892), [Maintainer corrected disposition](https://github.com/Project-Intra-Smithy/engineering-hub/issues/197#issuecomment-7218625032), [qualified-source checkpoint7219294498](https://github.com/Project-Intra-Smithy/engineering-hub/issues/197#issuecomment-7219294498). Existing canonical-main propagation exception retained. This is not mission CLOSE, independent acceptance, deployment, or Siris readiness.

## Exact successor

- [Draft PR79](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/pull/79), candidate/ot-persistent-deployment-r1.
- Frozen executable: **34116e7ed8321c14c2a48b3542d68ce3ebddd7b8**.
- Git tree: **a0d18df26396fc9ab5d8a3afd8441718d0370acb**.
- Frozen PR78 ad1d6d60e31e06a49c7eb15fdfbc192dc776179d unchanged. Main f5a74a7b648855be94809cac5ec56b60837cbf8c unchanged. Source worktree clean at final verification. Evidence is published on a separate documentation-only branch so the qualified executable does not move.

## Implemented correction

The original disposable-only incompatibility is resolved in this successor by an explicit `deploy:persistent` command. A private manifest binds connection host/port/database, actual PG16 cluster system identifier, bootstrap session/execution identity, source SHA, existing APP_KEY and exact observed migration ledger. Uncached staging/production CLI is required; neither a web flag nor changing APP_ENV enables ordinary migration authority.

The command runs one database transaction with an advisory lock: ordinary baseline prerequisites; G1B/G2 ownership and privileges; each N03 foundation/G2B/K2/G3 migration followed by the corresponding role policy; the five OPS009 migrations in canonical order; then ownership/ACL/identity/ledger verification. Any refusal, including a late postflight failure, rolls back roles, DDL and migration-ledger writes. Existing accounts are compared in memory; no records, passwords, encrypted MFA, employee-office association or application key are replaced. Reruns require the observed current ledger and registered target, apply only pending work and do not rotate credentials.

Six disposable SQL wrappers retain their original guards/prerequisite checks and include shared privilege-policy files. The source check reconstructs the exact original policy, allowing only database ACL addressing through verified current_database(); original SQL migration heredocs remain exact. Existing test-only installers still refuse unauthorized targets/leases. Persistent execution is a separately checked legitimate mechanism, not runtime rewriting of guards or forged migration receipts.

Offline bootstrap authority is never the runtime identity. The application uses kirion_g1b_app and separate configured N03 stage/command/reconcile/reader connections. Postflight rejects missing roles, unsafe role flags/login capability, owner memberships for runtime roles, audit mutation and secret-column access. Prior runtime grants are revoked only in the selected database; remaining inherited/column/owner authority causes rollback. No cluster role used by unrelated services is dropped or globally disabled.

Implementation: app/Deployment/PersistentInstaller.php, app/Console/Commands/InstallPersistent.php, nine bounded migration-authority changes, six disposable wrappers/shared SQL policies, final ACL verification, qualification and CI/docs. Dependencies, unrelated application behavior and existing tests are unchanged. [Operator procedure](../../../../docs/deployment/PERSISTENT-PG16.md).

## Exact-source evidence

| Qualification | Result | Original evidence |
|---|---|---|
| Protected disposable PG16 matrix | 12/12 jobs PASS; full 914 tests / 12,836 assertions | [run46004497443](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/actions/runs/46004497443) |
| Planning regression | 45 tests / 777 assertions PASS | [planning-junit.xml](planning-junit.xml) |
| Persistent fresh + exact 54-migration synthetic upgrade | 58/58 checks PASS on Linux PG16 | [run46004497475](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/actions/runs/46004497475), [raw check receipt](hosted-persistent-rehearsal.json) |
| Independent-platform local rehearsal | 58/58 checks PASS on Windows local PG16 | [raw check receipt](windows-persistent-rehearsal.json) |
| Canonical Laravel/Inertia browser + presentation | 2/2 jobs PASS | [run46004650421](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/actions/runs/46004650421) |
| Locked local production assets, TypeScript, frontend contracts | build/types PASS; 129/129 contracts PASS | local execution logs retained under C:/dev/TAL/artifacts/OT-VPS-PERSISTENT-R1 |

Total **15/15 hosted jobs PASS**, all at exact frozen source. [Run/job metadata](hosted-runs.json) and per-run artifact ID/digest/size JSON files are retained here. Artifact digests are GitHub-reported; no independent ZIP rehash is claimed. Original raw artifacts remain in those runs. Local rehearsals are synthetic source qualification, not independent evaluation or deployed VPS browser evidence.

The 58 checks include explicit nonempty original-like administrator/employee fixtures; exact user/employee digest preservation; password verification, encrypted MFA model decryption and valid TOTP after upgrade; original office association; APP_KEY binding; fresh install; exact54-migration upgrade; target/database/cluster/bootstrap/source/key/ledger refusals; ordinary staging migration refusal; late-failure rollback of roles/custody/ledger; actual authenticated Laravel runtime/N03 connections; denied DDL/audit/custody/ledger/owner escalation and reader MFA access; retired runtime grant revocation; complete unique migration ledger; rerun/no credential rotation; final table ownership.

Failed attempts remain historical failures: initial Linux socket-directory startup, an invalid synthetic recovery-code fixture that failed its nonempty-account usability assertion, and a local source-SHA refusal when HEAD changed during an exploratory run. The fixture was corrected to use the actual user model and assert account existence; final qualification ran against frozen34116e7e. No failed/vacuous preservation attempt is used as the final proof.

## Actual VPS state and preservation boundary

The VPS remains on the previously observed bf097d746836 release/image at srv2146360, https://devtestportal.talibonbohol.com; PHP8.4.28 / PG16.15, persistent database one_talibon_iam_20261110235520,54 migrations. Three existing containers up/database healthy, no published DB/app ports, valid HTTPS login200, debug off, secure cookie, log mail, sync queue. See [initial preflight receipt](../REPORT.md).

Additional read-only checks:5/5documents and5/5Work Requests have explicit synthetic markers;13/15users and employees have QA identifiers. The existing original administrator has active account/MFA/hash-presence booleans true; one additional existing executive-role identity requires private provenance classification before fixture delivery. No private names, login credentials, encrypted values or hashes are published here. Counts/patterns are evidence of markers, not official municipal facts or complete data-provenance certification.

There have been **no VPS deployment/config/account writes, migrations, grants, seeders, fixture insertions, backup/snapshot/dump/reset, credential/MFA/APP_KEY changes, extra running instance, public rollout or unrelated-service changes**. Administrator preservation PASS above belongs to synthetic upgrade qualification; actual hosted before/after upgrade preservation remains NOT_RUN because deployment has not been authorized through the successor acceptance gate. No deployed frontend SHA/manifest parity, authenticated hosted MFA/workflow smoke, evaluator credentials or populated operational dataset is claimed. Optional Drive structural-reference discovery is deferred; no confidential credentials workbook opened.

## Remaining external gate and next owner

**IMPLEMENTED / QUALIFIED / INDEPENDENT_TARGETED_ACCEPTANCE_PENDING / VPS_UNCHANGED.** [Nox targeted exact-source request7219159542](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/pull/79#issuecomment-7219159542) and GitHub review request are recorded; no independent PR79 review/acceptance was present at final inspection. Source writer does not self-accept or operate another account as a substitute independent reviewer. The Engineer directive says deployment resumes upon acceptance. Maintainer/Engineer owns targeted review/final technical disposition; this is the external gate, not continued installer incompatibility.

After acceptance, Codex resumes the already authorized original mission: final private classification/administrator preservation checks, locked exact-source deployment into the existing environment, supported migration/role execution, private storage/broker and runtime connection configuration, controlled ingress/mail/queue/scheduler, idempotent realistic synthetic fixtures, actual HTTPS/MFA multi-role positive/negative smoke, private Siris evaluator package and operational receipt. No main merge, redundant deployed environment, backup/snapshot or public municipal rollout. Siris remains queued until formal Engineer activation; no READY_FOR_SIRIS_QA disposition is awarded.
