# ONE TALIBON V1 — CURRENT VALIDATION & EVIDENCE POLICY

## Evidence law

Only claim what was actually observed.

Valid evidence states include:

- PASS
- FAIL
- SOURCE INSPECTED
- NOT RUN
- NOT OBSERVED
- UNKNOWN
- CARRIED / INHERITED WITH PROVEN SOURCE BOUNDARY

Build success does not prove runtime usability.

Runtime success does not prove authorization completeness.

Browser success does not prove production acceptance.

Runner registration does not prove runner readiness.

## Exact accepted product

`main@0e57508cab1a86bf4eabc1637e39b2dae6d32716`

## RC2 carried validation

### Backend

Backend-green SHA:

`d6a350a5cbc536b23827172216b64f80082cbba8`

Observed:

- 400 passed;
- 5,277 assertions;
- 0 failures.

No production PHP changed after backend-green before final RC2 promotion, so this result was validly inherited into the accepted candidate.

### Frontend

After the Calendar semantic heading repair:

- TypeScript PASS;
- production build PASS;
- compiled runtime PASS.

Later final changes were browser carriers only.

### V1 browser readiness

V1-green SHA:

`0d9b849bf5e71971e42f446bda9d2ebf76bae9ec`

Observed:

`V1_SHOWCASE_BROWSER_PASS checks=270 matrices=6 screenshots=8`

Final candidate differs from this SHA only by the OW1 browser carrier.

### OW1

Exact final candidate:

`0e57508cab1a86bf4eabc1637e39b2dae6d32716`

Observed:

`OW1_ONBOARDING_BROWSER_PASS checks=63`

## UI/UX local UAT

Technical Authority disposition:

`UI/UX UAT PASS FOR FRONTEND→BACKEND TRANSITION`

This claim is bounded to the current local presentation/usability pass.

It does not mean:

- backend architecture complete;
- all routes audited;
- all authorization semantics accepted;
- all performance goals achieved;
- deployment/production acceptance established.

## Local environment incidents

The following previously observed local-start issues are environment/orchestration failures, not product failures:

- assumed checkout path did not exist;
- PostgreSQL password was absent from the process environment;
- `npm.cmd` was not resolvable in one PowerShell session.

Do not convert these into backend defects.

They do justify reproducibility/preflight work.

## Database safety

Real UAT database:

`talibon_portal`

Disposable test database:

`talibon_portal_test`

Before any destructive database command, the executing process must positively prove:

`DB_DATABASE == talibon_portal_test`

If the observed database is `talibon_portal`, abort.

### UAT database evidence

Read-only inspection of `talibon_portal` is allowed when explicitly authorized for evidence collection.

No migration, seed, wipe, truncate, reset, or mutation is permitted during such inspection.

## Backend hardening validation model

The next backend program should validate in layers.

### E0 — exact-machine evidence

Required before trusting DEVKRTZ as a validation gate:

- exact repository SHA;
- clean runner checkout;
- runner online;
- PowerShell;
- Git;
- PHP 8.4;
- pdo_pgsql;
- pgsql;
- Composer;
- Node;
- npm;
- PostgreSQL connectivity to `talibon_portal_test`;
- database timezone/session evidence;
- Playwright Chromium;
- isolated runtime port 18000;
- deterministic process cleanup.

### Source/backend waves

Each bounded backend Code Writer wave must define the smallest relevant gate.

Examples:

- authorization wave → positive/negative direct-route tests + affected Feature regressions;
- query/pagination wave → visibility/count parity + query/materialization evidence;
- index wave → before/after PostgreSQL EXPLAIN evidence + regressions;
- dashboard semantic wave → role matrix + exact card/link/count regression;
- messaging authority wave → two-user/channel positive-negative tests;
- CI workflow wave → exact-SHA Windows-native execution proof.

Do not rerun the entire universe by default when a smaller exact gate is sufficient.

Run the complete Feature suite at integration/release boundaries or when cross-domain risk justifies it.

## Performance evidence

Performance changes require evidence.

Acceptable evidence includes:

- query counts;
- bounded result size;
- EXPLAIN / EXPLAIN ANALYZE where safe and appropriate on disposable data;
- request timing;
- before/after server response measurements;
- materialization count/memory evidence;
- browser/runtime smoke where user-visible latency is affected.

Do not add indexes or caching solely from intuition.

## Self-hosted runner

Runner:

`DEVKRTZ`

Labels:

`self-hosted, Windows, X64`

Current status:

`REGISTERED / NOT YET ACCEPTED AS RELEASE VALIDATION AUTHORITY`

Current repository workflows are Linux/GitHub-hosted oriented.

Windows self-hosted workflows must be separately designed and reviewed.

The runner must never execute untrusted external/fork PR code on the developer workstation.

The previously exposed registration token must never be reused.

## UAT isolation

Do not reuse the live UAT checkout as a destructive test workspace.

Do not bind CI validation to port 8000.

Preferred validation runtime port:

`18000`

Preferred validation database:

`talibon_portal_test`

## Claim boundaries

Keep separate:

- source audit;
- exact-machine validation;
- backend integration validation;
- UI/UX UAT;
- deployment;
- production acceptance;
- commercial completion.

Each requires its own evidence and authority.
