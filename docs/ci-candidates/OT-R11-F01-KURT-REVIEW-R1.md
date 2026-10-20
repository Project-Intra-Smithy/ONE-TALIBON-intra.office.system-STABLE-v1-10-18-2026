# KIRION FORGE — R11 F01 Inert Review Packet (Kurt)

**Mission:** `OT-R11-F01-DESTINATION-NONTRIGGERING-CANDIDATE-R1`  
**Technical Authority:** Kirch Ivan Balite  
**Scope authorized 2026-10-21:** PREPARATION ONLY. No hosted run, workflow activation, manual dispatch, `main` promotion, deployment, Messaging activation or UAT replacement.  
**Reviewer:** Kurt, CI/CD independent reviewer. **Review mode:** READ ONLY / NONAUTHOR.  
**Status:** SOURCE CANDIDATE ONLY / NO EXECUTION RECEIPT / CI_HOLD.

## Immutable scope

- Destination repository: `Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026`.
- Accepted application/integration source: `e39c7ecc6b4b7ae6538f545a48dff57625edc478`.
- Accepted application tree: `0900d14f42ee1797eac707c9db588de1c73b011d`.
- R10 parent baseline: `88789678c52aaf2932c31c7cd0a45294e55aec29`.
- R11 five commits ahead, zero behind; net source delta exactly `tests/Browser/h1-mutation-readiness.mjs` and `tests/Browser/p08-responsive-smoke.mjs`.
- The review branch is intentionally separate from the accepted `integration/one-talibon-complete-r1` branch. The application checked out by the proposed CI is **pinned to R11**, not to the review-branch HEAD.
- Existing destination `main` must remain `3fb1091443f0b0d67409c6bde2f8c88ac57a3ec0` until an entirely separate promotion decision.

## Inert design: zero registered triggers

The candidate is `docs/ci-candidates/OT-R11-F01-NONTRIGGERING-REVIEW.yml`, **not** `.github/workflows/*`. It intentionally has **no `on` event key**. It is an unexecuted YAML workflow *template*, not a runnable Actions workflow.

Do not move it, add `workflow_dispatch`, add push/PR/call triggers, enable repository Actions, use `gh workflow run`, or issue an API dispatch without a second express authorization and a fresh independent source review. The old `.github/workflows/a01-f01-canonical-integration.yml` is for `Talibon-Sales-Prototype`, and its source guard remains pinned to an older frontend/backend tuple; it is **not compatible with this destination**.

## Proposed contract in the inert template

1. Pin checkout to exact R11 application SHA and tree; verify Git repository, hosted runner identity, R10 ancestry, two-file R11 diff and clean tracked checkout.
2. Use locked Composer and npm inputs, PHP 8.4, Node 22 from `.nvmrc`, PostgreSQL 16 and Chromium.
3. Use a runner-local, fresh PostgreSQL service; check both intended databases are empty before any `migrate:fresh --seed`. Run the PHPUnit Feature suite only on `talibon_portal_test`, and browser H1 only on `talibon_h1_mutations`. Never connect to retained UAT data.
4. Generate one-off synthetic password and MFA TOTP with masking. Never store secrets in source, attestation, screenshots or uploaded files.
5. Execute TypeScript, Vite, frontend contracts, directory UI source checks, serial UX/AJ/Directory Chromium tests, full active Feature suite and real Laravel+PostgreSQL H1/P08 Chromium acceptance.
6. Require H1 **16 PASS / 1 DENIAL_PASS / 3 BLOCKED_BY_POLICY / 0 FAIL** and 0 page errors/5xx. Preserve restricted Correspondence HTTP 403 and zero-event evidence; Messaging remains HTTP 403.
7. Require P08 desktop 1440x900 and mobile 390x844 complete, with Records and Messaging screenshots present. Generate a **sanitized, summary-only** CI artifact.

## Explicit gaps: these are NOT hidden passes

- **Calendar Chromium 40/40:** Prior R11 local receipt exists and is pinned to the accepted source, but no equivalent calendar Chromium test runner was found as a *tracked* R11 repository file. Candidate CI therefore labels `calendarChromium: NOT_RUN_NO_TRACKED_R11_CALENDAR_BROWSER_HARNESS`. Kurt must demand a source-pinned, independently reviewed tracked runner before claiming equivalent hosted Calendar acceptance.
- **Native browser CSRF:** The H1 probe requires `APP_ENV=testing`, where Laravel may disable CSRF middleware. This template is not proof of a hosted `APP_ENV=local` CSRF-negative browser gate. Review how to add a separate correct environment check without modifying or bypassing auth.
- **Feature warnings:** Prior local run: 557 tests, 6,358 assertions, instrumentation warnings, one JUnit skipped node, zero failures/errors. The template proposes a full Feature rerun, but no hosted outcome exists yet. Kurt must ensure warning/skip counts and test identifiers remain faithfully reported and strict exits are honored.
- **PostgreSQL runner ownership:** The template uses a disposable Postgres 16 service with loopback-published port and trust authentication. Confirm service ownership, runner nonpersistence, isolation, and safety preflight before authorizing even a hosted synthetic run. Consider replacing `trust` with an independently reviewed credentialed alternative.
- **Supply-chain pins:** Review the existing action commit pins, locked dependencies, `postgres:16` image pin strategy, Node/Composer/Playwright versions and any reachable network downloads.
- **Evidence minimization:** Only the newly generated sanitized summary is proposed for artifact upload. Do not upload raw H1 JSON, detailed logs, database content, private municipal records, credentials or screenshots without a separate sensitivity audit.
- **Coverage:** This is an R11-specific F01 native acceptance candidate, not a substitute for independent QA/security, mandatory policy approvals, historic deferred HRIS tests, official LGU branding signoff or municipal UAT.

## Kurt's return contract

Review this exact candidate commit and issue a **single** `CI_READY_FOR_SEPARATE_EXECUTION_AUTHORIZATION` or `CI_HOLD_CHANGES_REQUIRED` verdict, with each blocking finding linked to the exact path, line, source SHA, failure mechanism and bounded correction. State whether hosted F01 is required by active release policy; do **not** assume it is obligatory or waived.

No workflow execution should take place based on the reviewer verdict alone. Activation and hosted execution require separate explicit Technical Authority approval, after independent review and a safe non-production runner plan.

## Prior local R11 evidence provenance

- R11 archive (local, not committed): `R11-EVIDENCE-20261021-004555.zip`.
- SHA-256: `b56d2bc4165fecbd122e915b1eb99d6e31fcabab093a37e70ff60e496cfc7681`.
- Reported ZIP-level verification: 34/34 manifested files matched their hashes; 8 Calendar and 4 P08 screenshots preserved. ZIP contents are **not** automatically available to Kurt through the Git repository.
- Accepted R11 H1/P08/Calendar reports were generated on exact final SHA; full Feature-suite provenance is qualified as pre-final-browser-harness, with no application/Feature changes afterward.

**Disposition:** `PREPARED_FOR_KURT_READ_ONLY_SOURCE_REVIEW / CI_NOT_RUN / RELEASE_HOLD`.
