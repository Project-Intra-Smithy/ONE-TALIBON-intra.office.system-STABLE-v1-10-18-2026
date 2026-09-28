# ONE TALIBON V1 — CURRENT VALIDATION & EVIDENCE POLICY

## Evidence law

Only claim what was actually observed.

Valid states include:

- PASS
- FAIL
- SOURCE INSPECTED
- NOT RUN
- NOT OBSERVED
- UNKNOWN
- CARRIED / INHERITED WITH PROVEN SOURCE BOUNDARY

Build PASS does not prove runtime usability.
Runtime PASS does not prove authorization completeness.
Browser PASS does not prove production acceptance.
Runner registration does not prove runner readiness.

## Repository authority vs product validation anchor

Repository authority:

`main`

Exact current repository HEAD:

`RESOLVE LIVE FROM GIT`

Accepted application/runtime payload anchor:

`0e57508cab1a86bf4eabc1637e39b2dae6d32716`

These are intentionally separate.

Governance-only descendants may advance `main` without changing the application/runtime payload validated at the payload anchor.

Evidence may be carried only after exact diff inspection proves the relevant product source did not change.

## RC2 carried evidence

Backend-green:

`d6a350a5cbc536b23827172216b64f80082cbba8`

Observed:

`400 passed / 5,277 assertions / 0 failures`

V1:

`V1_SHOWCASE_BROWSER_PASS checks=270 matrices=6 screenshots=8`

V1-green:

`0d9b849bf5e71971e42f446bda9d2ebf76bae9ec`

OW1 at the accepted application/runtime payload anchor:

`OW1_ONBOARDING_BROWSER_PASS checks=63`

These are inherited results, not new FB0 executions.

## UI/UX UAT

Technical Authority disposition:

`UI/UX UAT PASS FOR FRONTEND → BACKEND TRANSITION`

This is bounded to presentation/usability transition evidence.

It does not establish backend closure, production acceptance, commercial completion, or self-hosted validation readiness.

## Database safety

UAT database:

`talibon_portal`

Disposable test database:

`talibon_portal_test`

Before destructive engineering preparation, the executing process must positively prove:

`DB_DATABASE == talibon_portal_test`

If the observed DB is `talibon_portal`, abort.

Read-only UAT DB evidence collection may be authorized separately; it must not mutate schema or data.

## E0 exact-machine evidence

Before `DEVKRTZ` becomes validation authority, prove in the runner execution context:

- exact repository SHA;
- application/runtime payload anchor;
- clean checkout;
- runner online;
- PowerShell;
- Git;
- PHP 8.4;
- pdo_pgsql / pgsql;
- Composer;
- Node/npm;
- PostgreSQL test connectivity;
- DB/session timezone;
- Playwright/Chromium;
- isolated runtime port 18000;
- deterministic cleanup.

## Backend wave evidence

Authorization changes require positive and negative direct-route tests.

Query/pagination changes require visibility/count parity plus bounded-query/materialization evidence.

Index changes require representative PostgreSQL plan evidence before and after.

Dashboard semantic changes require role/card/link/count regression evidence.

Messaging authority changes require multi-user positive/negative channel tests.

Windows validation workflow changes require exact-SHA execution evidence on the intended self-hosted runner.

## Performance evidence

Measure before optimizing.

Useful evidence includes query counts, bounded result size, PostgreSQL plans, request timing, before/after server response, materialization volume, and browser/runtime smoke where user-visible latency is affected.

Do not add indexes or caching solely from intuition.

## Self-hosted runner

Runner:

`DEVKRTZ`

Labels:

`self-hosted, Windows, X64`

State:

`REGISTERED / NOT YET ACCEPTED AS RELEASE VALIDATION AUTHORITY`

Current repository workflows remain Linux/GitHub-hosted oriented.

Do not merely replace `runs-on` with Windows self-hosted labels.

Do not execute untrusted external/fork PR code on the developer workstation.

The previously exposed registration token must never be reused.

## Promotion-stability rule

A governance-only candidate must remain truthful after promotion.

Review and Acceptance must distinguish:

1. live repository HEAD;
2. accepted application/runtime payload anchor;
3. exact candidate SHA under evaluation.

A candidate that encodes an older payload SHA as though it will remain the repository HEAD after promotion must be reworked.

## Claim boundaries

Keep separate:

- repository authority;
- application/runtime payload authority;
- source audit;
- exact-machine validation;
- backend integration validation;
- UI/UX UAT;
- deployment;
- production acceptance;
- commercial completion.
