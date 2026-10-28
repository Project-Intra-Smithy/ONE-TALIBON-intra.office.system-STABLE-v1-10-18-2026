# KIRION FORGE — G2E Legacy Caller Boundary Verification R1

**Mission:** `OT-R13-W02W03-G2E-LEGACY-CALLER-SIDE-EFFECT-BOUNDARIES-R1`  
**Parent:** `80502e98b5e109d3efcc556ae9514bd6e060f0ff` (G2D source, verified PG16 exact-SHA receipt #6453267239).  
**Authority:** Kirch's instruction to continue concrete Forge G1/G2 implementation and document it, preserving one application writer Kirch-Nairu.  
**Branch:** `candidate/r13-w02w03-nairu-single-integrator-r1`.  
**Mode:** isolated test source commit, no schema or application behavior changes, no production/retained DB, no merge/deploy.

## Evidence justifying this batch

G2D executable validation on disposable PostgreSQL 16.15 passed: 6 hardening methods / 14 assertions, original 8 Plan methods / 30 assertions, and 157 legacy methods / 1,768 assertions. Instrumentation found 4 SQL queries for a normal persisted provenance check; 100 checks = 400 queries, ~955.8 ms wall time locally. A forced connection failure denied but took ~4.07 seconds. None of this proves the legacy controller or cleanup side-effect boundary responds correctly in every fault path.

The G2D receipt specifically requested next bounded caller-level synthetic negative tests, with fake storage, at (1) `DocumentController::download()`, (2) `DocumentAccessService::canDownload()`, and (3) `DocumentAttachmentService::cleanupDocuments()`.

## Exact source scope

**Only add** `tests/Feature/PlanLegacyCallerBoundaryTest.php`; do not modify the protected guard, migrations, authorization policy, storage backend or UI.

Seven independent PHPUnit methods (synthetic fixtures; `RefreshDatabase`; `Storage::fake('documents')`):

| ID | Test method / goal | Expected |
| --- | --- | --- |
| G2E-01 | Sealed `EVER_PLAN` is requested through generic authenticated `/documents/{public_id}/download` | 404 concealed, denied audit row, no Plan bytes in response, fake blob intact |
| G2E-02 | Ordinary authorized transaction evidence with simulated *partial Plan schema* | Baseline eligible; legacy HTTP route returns 404, no bytes, stored blob intact |
| G2E-03 | Same authorized legacy actor/document; schema probe fails | Baseline eligible; `DocumentAccessService` denies, blob intact |
| G2E-04 | Loaded legacy model subsequently sealed in actual PG16 | Generic cleanup throws precise custody exception; permanent receipt and blob intact |
| G2E-05 | Persisted model deleted, orphaned fake storage blob | Cleanup denies; blob intact |
| G2E-06 | Partially migrated Plan schema during cleanup | Cleanup denies; blob intact |
| G2E-07 | Ordinary unprotected `LEGACY_CTW`-compatible document | Existing cleanup still deletes ordinary fake blob |

The controller route is tested with an authenticated, MFA-assured synthetic department-head user. The authorized legacy control uses an actual synthetic `WorkflowTransaction` plus `DocumentLink`, not a mocked authorization oracle. Schema partial-state tests mock only provenance schema capability probes and do not drop real PostgreSQL tables. No real Plan bytes or municipal data.

## Test prerequisites and exact command

Run **only** after verifying a fresh disposable PG16 environment (db=`talibon_portal_test`, actual PG16, loopback, no retained volumes, synthetic-only) and exact source SHA.

```bash
php -l tests/Feature/PlanLegacyCallerBoundaryTest.php
php vendor/bin/phpunit --configuration ../phpunit.disposable.xml tests/Feature/PlanLegacyCallerBoundaryTest.php --testdox
php vendor/bin/phpunit --configuration ../phpunit.disposable.xml tests/Feature/PlanLegacyOriginGuardHardeningTest.php tests/Feature/PlanCatalogFoundationTest.php tests/Feature/PlanDocumentOriginIsolationTest.php --testdox
```

Then rerun the prior 15-file/157 authored-method selected legacy regression scope exactly as listed in the G2D and G2C Codex receipts, plus any affected controller/storage test files. Capture actual assertion counts, individual result matrix, commands and exits. No PASS is established by lint alone.

## Security boundaries and explicit limitations

- This batch tests *legacy caller side effects*; it does not provide atomic authorization through storage open. A Plan origin promotion between check and byte open remains **TOCTOU OPEN** and must be addressed in the future G4 gateway with approved locks, current epochs, immutable descriptor pinning and durable start audit.
- No proven remedy yet for 4-query normal guard checks or ~4-second outage delay. Proposed caching or query reduction must be reviewed against stale provenance and restore-safety before deployment.
- Historical restore: both Plan schema components absent does not itself certify legacy origin after stale backup restoration. G1 external monotonic fence is non-waivable.
- DB roles/owners/PUBLIC EXECUTE, privileged repair, authoritative MFA/office epochs, private immutable scanned objects, audit durability, external escrow/backup and LGU classification/retention decisions are **G1 owner gates**.
- W02 R4 as amended R4-07/NX57/NX63 source-specific event evidence, G3 projections, G4 authenticated PDF gateway, G5 UI, G6 recovery, all 75 formal security cases, and independent Kirion-Nox implemented-code acceptance remain outstanding.
- Existing P0 security issues #128/#129 remain OPEN. No worker-series activation; no production migration, merge, deployment, official Plan PDF ingest or public access.

## Acceptance protocol

**This commit is source/test only.** A future disposable PG16 run must establish the seven boundary cases and regressions at the new exact SHA. Any runtime failures go back to the single integrator for correction; author cannot self-approve. Independent Kirion-Nox review follows executable acceptance. Retain the currently successful G2D candidate in history.

**Disposition after source commit:** `G2E_TESTS_COMMITTED / SYNTAX_VERIFIED_ONLY / 7_CASES_NOT_RUN / NO_RELEASE`.
