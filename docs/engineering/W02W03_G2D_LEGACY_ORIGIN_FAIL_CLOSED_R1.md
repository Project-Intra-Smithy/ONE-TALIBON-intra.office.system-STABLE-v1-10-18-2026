# KIRION FORGE — G2D Legacy-Origin Protection Hardening R1

**Mission:** `OT-R13-W02W03-G2D-LEGACY-ORIGIN-FAIL-CLOSED-R1`  
**Authority:** Kirch's explicit 2026-10-28 direction to resume the Forge engineering implementation, with thorough documentation.  
**Sole application source writer:** Kirch-Nairu (`291564617`).  
**Parent:** Issue #157; governed by W02 R4 as amended by R4-07 (#156), and official Plan authority discovery (#155).  
**Required parent SHA:** `593add7ea828ce8b11e5717dedaa9cd19d34dc24` (G2C PG16 repeatability and legacy regression receipt #6452654428).

## Why this batch is needed

G2C is targeted-executable PASS (two `migrate:fresh` cycles, 8 focused tests, 157 legacy tests), but it did not establish all G1/G2 protection invariants.

Exact parent-source `app/Services/PlanDocumentOriginGuard.php` previously:
- trusted the loaded Eloquent `security_domain` if it was `EVER_PLAN`, but did not re-fetch it when a stale loaded legacy Document was later sealed;
- returned `false` immediately if `plan_document_origin_receipts` was missing, even when `documents.security_domain` existed — a partially upgraded schema;
- returned `false` for an unsaved Document with no receipt lookup.

Callers: `DocumentController::download`, `DocumentAccessService::canDownload`, and `DocumentAttachmentService::cleanupDocuments`. All are **legacy** routes/services: none authorizes protected Plan byte retrieval. A protected status is an exclusion, not a capability.

## Implemented source changes (no schema or new gateway)

`app/Services/PlanDocumentOriginGuard.php` now:
1. Excludes a directly loaded `EVER_PLAN` immediately, even during DB outages.
2. Excludes unsaved/keyless Documents to prevent accidental storage cleanup on an object without persisted custody.
3. Checks for both PostgreSQL provenance schema components: `documents.security_domain` **and** `plan_document_origin_receipts`. If exactly one exists, the legacy route fails closed.
4. Allows ordinary legacy behavior on a *genuinely pre-G2B* schema where both components are absent. This compatibility case is NOT a retained-backup guarantee.
5. For a persisted Document in a post-G2B schema, fetches the **current** `security_domain` by ID to defeat stale Eloquent objects.
6. Denies if the current row is missing or explicitly `EVER_PLAN`.
7. Otherwise queries the authoritative append-only receipt to exclude former/protected Plans even if metadata incorrectly says `LEGACY_CTW`.
8. Denies on any thrown database/schema exception. No schema corruption or privileged bypass fixture is created here.

**No Plan retrieval route, privilege elevation, upload, release permission, permanent migration, rollback, worker dispatch, or production operation.**

## Focused synthetic test matrix

New `tests/Feature/PlanLegacyOriginGuardHardeningTest.php` under standard Feature test discovery, `RefreshDatabase`, expected **6 new test methods**:

| Case | Expected assertion |
| --- | --- |
| Previously loaded legacy model, then DB-sealed EVER_PLAN | Guard denies even though in-memory model remains NULL |
| Persisted legacy model deleted after load | Guard denies stale/deleted row |
| Unsaved Document object | Guard denies byte cleanup |
| Domain column exists, receipt table missing | Guard denies partial schema |
| Receipt table exists, domain column missing | Guard denies partial schema |
| Both Plan schema components absent (mocked pre-G2B) | Guard preserves genuine legacy behavior |

Mocked schema probes are test-local and do not drop PostgreSQL tables. The stale-origin case uses the ordinary DB sealing trigger and checks receipt creation.

## Critical limits / gaps not waived by this change

- **TOCTOU:** A new origin promotion can still race between any check and actual storage open/byte response. The safe G4 gateway needs an explicit same-epoch lock-and-pin/byte-audit protocol; this batch is only a defense-in-depth exclusion on legacy paths.
- **Restore downgrade:** A pre-G2B database restored after Plan custody was sealed may have neither component, and its own rows cannot prove that a sealed Plan existed. G1 external monotonic restore fencing, escrow/backup reattestation and old-key revocation remain **required**.
- **DB security:** Production role topology, default `PUBLIC EXECUTE`, least-privilege function owner/grants, restricted privileged repair, and PostgreSQL SECURITY DEFINER controls remain **G1 DBA decision gates**. Do not add speculative REVOKEs to a retained deployment.
- **Identity:** Verified municipal actors, office/MFA epochs, session invalidation, actor-specific entitlement masks and LGU owner signatures remain external policy inputs.
- **R4-07:** Plan-only PDFs never produce event/report `hasEvidence=Yes`. Only independently eligible LEGACY_CTW evidence may contribute. Exact NX57-a/b/c and NX63-a/b/c remain NOT_RUN.
- **G3–G7:** No authorized Plan projection, PDF gateway, frontend integration, retention/recovery, or full 75-case formal acceptance is implied.
- **Legacy P0 #128/#129:** This patch does not settle cross-parent precedence or classified correspondence parity.

## Validation and next execution

A PHP 8.4 syntax-only check is possible in this source-writing environment; this does **not** execute Laravel or PostgreSQL. On an isolated, freshly leased disposable PostgreSQL 16 environment, run:
1. `php -l` over the changed service and added test.
2. `php vendor/bin/phpunit --configuration <verified disposable config> tests/Feature/PlanLegacyOriginGuardHardeningTest.php` — record 6 individual outcomes.
3. Both preexisting focused files `PlanCatalogFoundationTest.php`, `PlanDocumentOriginIsolationTest.php` (original 8 tests); 157-method legacy regression selection from Codex G2C receipt; repeatable migration and adversarial stale-model fixtures.
4. Inspect behavior for a concurrent seal **during** real storage open, and block any Plan gateway progression until locking/authorization/audit G1 requirements are real.

No tests may be claimed PASS without an actual runtime receipt. Return exact SHA, real exit codes, PASS/FAIL/NOT_RUN, database lease and identity. After executable QA, independently hand the exact candidate to Kirion-Nox. No self-approval.

## Main pipeline return / stage ownership

- **G0:** exact branch and source pinned.
- **G1:** external DBA, IT/Identity, Records/DPO authority and immutable storage/DR constraints remain **OPEN**. Request named owner decisions, do not fabricate signatures.
- **G2:** G2C synthetic baseline PASS; this G2D legacy-path hardening is a new source candidate pending PG16 tests.
- **G3:** operation-scoped authorization/projections require cleared identity/permission policy.
- **G4:** secure private PDF gateway requires storage generations, pinned current revocation state and durable pre-byte audit; no synthetic workaround substituted as accepted control.
- **G5:** UI can remain reference-only pending official Plan evidence.
- **G6:** retention/restore/GC must be owner-approved.
- **G7:** full 75-case W02 evidence + Nox independent implemented-code review before release.
- **G8:** Kirch controls merge/staging/production; eight-worker series ON HOLD.

**Disposition:** `G2D_SOURCE_CANDIDATE_ONLY / G1_INPUT_REQUIRED / NO_PG_TEST_IN_THIS_BATCH / NO_MERGE_NO_DEPLOY`.
