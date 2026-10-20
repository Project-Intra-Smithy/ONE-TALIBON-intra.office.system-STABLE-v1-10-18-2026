# KIRION FORGE — R11 F01 Inert Internal Review Packet

**Mission:** `OT-R11-CODEX-INTERNAL-CI-QA-SECURITY-REVIEW-R1`
**Technical Authority:** Kirch Ivan Balite
**Internal reviewer:** Codex on the existing authenticated Windows host
**Status:** REVIEW-ONLY SOURCE CANDIDATE / HOSTED CI NOT RUN / RELEASE HOLD
**Independence:** **NOT AN INDEPENDENT QA OR SECURITY SIGNOFF.** This review does not provide author separation and cannot replace separately required human approval.

## Frozen source and authority

- Destination: `Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026`.
- Accepted integration: `e39c7ecc6b4b7ae6538f545a48dff57625edc478`.
- Accepted tree: `0900d14f42ee1797eac707c9db588de1c73b011d`.
- R10 baseline: `88789678c52aaf2932c31c7cd0a45294e55aec29`.
- Destination main remains `3fb1091443f0b0d67409c6bde2f8c88ac57a3ec0`.
- The R11 net application delta from R10 is exactly `tests/Browser/h1-mutation-readiness.mjs` and `tests/Browser/p08-responsive-smoke.mjs`.
- The review branch adds only this document and `OT-R11-F01-NONTRIGGERING-REVIEW.yml`. It must not alter the frozen integration or main refs.

The YAML remains under `docs/ci-candidates/`, has no `on:` key, and is not a registered Action. Moving it to `.github/workflows`, adding a trigger, enabling Actions, dispatching it, or executing hosted CI remains unauthorized.

## Evidence audit

The local archive `R11-EVIDENCE-20261021-004555.zip` was audited on 2026-10-21:

- ZIP SHA-256: `b56d2bc4165fecbd122e915b1eb99d6e31fcabab093a37e70ff60e496cfc7681` — MATCH.
- Manifest: 34 entries — 34 present and 34 SHA-256 matches. The manifest itself is the 35th file.
- H1 final receipt: 16 authorized PASS, one `DENIAL_PASS` with HTTP 403 and zero row/event mutation, three `BLOCKED_BY_POLICY`, zero FAIL, zero page errors and zero HTTP 5xx.
- P08: 1440×900 and 390×844 PASS, with Records and Messaging-denial screenshots.
- Calendar: local untracked runner receipt reports 40/40 on accepted R11, with eight screenshots. The runner is not part of accepted tracked source, so this is genuine local provenance but cannot be reproduced by the candidate as written.
- Directory: 9/9 source/logo safety and 1/1 mounted 40-entry/14-group rendering evidence.
- Feature: 557 tests, 6,358 assertions, zero failures/errors and one skipped test. The receipt predates the final browser-harness-only commits; application and Feature source were unchanged afterward.
- The skipped JUnit test is `Tasks\TaskConcurrentConnectionTest::test_two_postgresql_sessions_cannot_both_start_the_same_task`; Windows lacks `pcntl`. The Linux candidate requires this test to execute, requires zero skips, keeps the test count at 557 and accepts an assertion count no lower than the Windows baseline of 6,358.
- PHPUnit's console `WARN` presentation corresponds to repeated PHP `file_get_contents(...)` warnings emitted by source-inspection instrumentation. They are not assertion failures, but they are not clean output either; the candidate records exact JUnit counters and should preserve warning diagnostics for review.
- The first AJ home/auth attempt collided with another local fixture server and failed 8/9 mounts. The isolated rerun passed 9/9. Both logs remain disclosed; only the isolated rerun is acceptance evidence.

These are audited existing receipts, not independent reruns performed by another reviewer.

## Security source findings

- `DenyUnverifiedCorrespondenceMutations` fails closed unless `messaging_release.restricted_uat` is literal `false`. All eight write routes retain this middleware. The accepted H1 receipt proves HTTP 403 and unchanged lifecycle, classification, municipal reference, workflow link and event count.
- `DenyUnapprovedMessaging` unconditionally returns HTTP 403 on list, feed and write routes. No frontend logo, Directory identity or system-administrator role bypasses it.
- Web mutations remain in Laravel's web middleware group. The accepted H1 uses `APP_ENV=testing`, so it is not sufficient proof of live CSRF enforcement. The corrected inert proposal adds an isolated `APP_ENV=local` login POST without a CSRF token, requires HTTP 419 and verifies the synthetic user table remains unchanged.
- Authentication remains normal credential submission. Privileged accounts complete real TOTP MFA; nonprivileged accounts do not receive a false MFA requirement. H1 records sanitized 302 transitions for three privileged personas and one employee.
- Active HRIS exposure remains only `/hris` → Directory, `/hris/attendance`, and authenticated `/employees/presence`. Payroll, leave, development, health vault, onboarding and offboarding routes remain withheld.
- The operational Department table remains distinct from the 40-entry/14-group display catalog. `FOCAL-036` has no invented Department code. `OfficeDirectoryCatalog` emits `recordsHref: null`; frontend `safeRecordsHref()` accepts only literal `/records`. Logo aliases do not confer role, routing, Records or correspondence authority.

## CI candidate corrections from internal review

1. Replaced mutable `postgres:16` plus `POSTGRES_HOST_AUTH_METHOD=trust` with the reviewed PostgreSQL 16.15 digest and a runner-scoped synthetic password shared through job/service expressions.
2. Pinned Composer to `2.10.3`; retained commit-pinned Actions. Observed action commits map to checkout v4.4.0, setup-node v4.4.0, setup-php 2.40.0 and upload-artifact v4.6.2. Re-review all pins before any future authorization.
3. Added exact accepted `composer.lock` and `package-lock.json` SHA-256 assertions.
4. Corrected Office Directory Node commands to use `--experimental-strip-types` and included the logo test. The uncorrected commands fail when importing `.ts` source under Node 22.
5. Added strict Feature JUnit attestation for 557 tests, at least 6,358 assertions, zero errors/failures and zero Linux skips. The one Windows-only skip remains disclosed in local provenance.
6. Added a third disposable database and a real `APP_ENV=local` CSRF-negative gate. It does not relax test or runtime middleware.
7. Preserved Calendar Chromium as `NOT_RUN_NO_TRACKED_R11_CALENDAR_BROWSER_HARNESS`; no fake helper or pass was added.
8. Kept artifact upload limited to a sanitized generated summary. Raw logs, screenshots, database content and credentials remain excluded.

## Calendar runner design — proposed, not present

Accepted R11 has no tracked Calendar browser runner. A future, separately authorized CI-candidate branch from exact R11 should add a reviewed helper such as `tests/Browser/calendar-authenticated-acceptance.mjs`, plus a narrow npm script. It must:

- require exact SHA, real Laravel session and isolated synthetic PostgreSQL;
- authenticate through the current credential/MFA UI;
- exercise Month, Week, Day and Schedule at 1440×900 and 390×844;
- assert HTTP status, view-specific markers, server-defined ranges, next/previous navigation, authorized projection and no horizontal overflow;
- sanitize screenshots and never embed credentials or TOTP seeds;
- be tested locally and reviewed as new source before the inert template may invoke it.

Until that source exists, hosted Calendar equivalence is `NOT_RUN`, while the sealed local 40/40 receipt remains provenance only.

## Supply-chain and runner limitations

- The Docker image is digest-pinned, but the digest and its upstream provenance still require revalidation immediately before any authorized execution.
- Ubuntu hosted-runner contents and `npx playwright install --with-deps` system packages are externally maintained and not fully content-addressed by this template.
- Composer and npm consume accepted lockfiles, but package registries remain network dependencies. Lock hashes and install exits detect source drift; they do not provide a full SLSA provenance guarantee.
- GitHub-hosted runner ownership is asserted, but no hosted execution has occurred. Runner ephemerality and repository Actions policy remain unproven until separately authorized.
- The old `.github/workflows/a01-f01-canonical-integration.yml` targets `Talibon-Sales-Prototype` and is incompatible with this destination. It must not be activated or used.

## Execution status and recommendation

Additional local, non-hosted verification on the review branch used only disposable PostgreSQL 16 data:

- Focused security suite: 43 tests, 849 assertions, zero failures/errors. Covered restricted Correspondence no-write, restricted Messaging, MFA controls, Directory/presence/attendance scope, Office Directory authority boundaries and Task web/CSRF placement.
- Real-environment CSRF negative: a newly named disposable database was migrated and seeded; `APP_ENV=local` POST `/login` without a token returned HTTP 419; synthetic user count stayed 350 → 350.
- Directory/catalog: server catalog 40 entries/14 groups versus 33 operational Departments; combined source/mounted tests passed 10/10.
- Routes: active HRIS route listing contains only `/hris` and `/hris/attendance`; Messaging GET/feed/POST retain auth, active-account, MFA and hard-denial middleware.
- `composer validate --strict --no-check-publish`: PASS. Inert YAML lint: PASS. Trigger scan: zero `on:` keys.
- Local versions: PHP 8.4.25, Composer 2.10.3, Node 22.16.0, npm 10.9.2, PostgreSQL 16.15 and Playwright 1.55.0.

Locally audited/executed evidence supports the accepted integration's active technical scope. Hosted execution is currently **optional only with an explicit written Technical Authority decision**; no repository rule or Issue #1 text inspected by Codex establishes it as a mandatory release gate, and this review cannot waive any policy not present in the repository record. If reproducible Linux/browser evidence or independent runner provenance is required, authorize the corrected inert candidate only after separate source review and after adding the tracked Calendar helper.

Internal verdict: `CODEX_INTERNAL_READY_FOR_AUTHORITY_REVIEW`

This verdict means the inert proposal is technically improved and ready for authority review. It is not release approval, independent QA/security signoff, hosted execution authorization, municipal UAT approval, LGU branding approval, main promotion or deployment authorization.
