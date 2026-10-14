# CC-R1 — Genuine Laravel/PostgreSQL16/Chromium Browser Acceptance

**Executor**: Kirion-Lucien; **technical authority**: Kirch Ivan Balite.  
**Status**: runnable harness prepared; actual combined backend candidate **not yet identified or verified**. No genuine runtime PASS has been obtained.

## Frozen source tuple

| Source | Immutable revision |
|---|---|
| Frontend PR #35 | `Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE@431fe2e19daf41138791d1dbad2cbeedc5dbff42` |
| Backend staging baseline PR #81 | `Project-Intra-Smithy/Talibon-Sales-Prototype@d99285f96b0bbcfd4156139c4fc01e3db62ed26b` |
| Eventual combined backend | **UNRESOLVED**: exact accepted assembly SHA required. Do not substitute PR #81 or individual corrective PRs #84/#85/#86 for a genuine assembled candidate. |
| This harness | Stacked standalone draft branch `forge/lucien-cc-r1-genuine-runtime-browser-acceptance` based on frozen frontend PR #35, with **no mutations to that original PR** |

The 29 permitted frontend overlay paths and their exact Git blob hashes are in `docs/qa/CC-R1-assembly-attestation.template.json`. This template deliberately has an unusable backend SHA and status. It is not proof an assembly exists.

## Execution prerequisites (must all hold)

1. **Kurt or named assembly executor** obtains Kirch's authorization for the *combined* backend candidate. They provide one exact Git commit SHA, review PR #84 security inclusion/separation plus performance corrections, and record provenance. No synthetic combined SHA.
2. A fresh, disposable backend checkout at that exact SHA, with vendor packages installed, PHP 8.3+ and a running **PostgreSQL 16** database named for testing/QA. `APP_ENV=testing`. Database must contain two distinct active, properly associated disposable employee users. Configure both through existing backend mechanisms, without hardcoded passwords or auth-policy bypasses. MFA-required personas require legitimate assurance; do not weaken middleware.
3. Assemble **only** the 29 explicitly enumerated frontend PR #35 UI blob paths. Do not copy the frontend tree as a whole; do not overwrite backend policies, migrations, middleware, model or route definitions. Confirm dependency graph and compile application assets. Any missing integration dependencies must be a separate reviewed compatibility change that updates the source tuple, not silently alters PR #35 bytes.
4. Copy the attestation template into a *private local file*, set `backend.sha` to the authorized assembled SHA and `status` to `runtime-testing-authorized` only after inspection. The browser runner checks every source blob in the actual backend worktree and rejects an inconsistent tuple.
5. Start the real application on `http://127.0.0.1:8000` or another loopback port. Do **not** start `visual-preview.html`. Chromium must access the real Laravel server; no request interception, HAR replay, in-memory Task mocks, substituted API responses or screenshot fixtures are allowed.
6. On the execution host, install the **frontend PR #35/harness branch** npm dependencies (`npm ci`) and Playwright Chromium. The test script must execute from that frontend branch directory so its `playwright` dependency resolves, while `CC_RT_BACKEND_DIR` points to the separate assembled Laravel root. Ensure this uses development-only credentials.

## Environment variables (runtime executor sets privately, never commits)

```bash
export CC_RT_BACKEND_DIR=/absolute/path/to/disposable/backend
export CC_RT_BASE_URL=http://127.0.0.1:8000
export CC_RT_BACKEND_SHA=<exact-approved-40-hex-combined-backend-commit>
export CC_RT_ASSEMBLY_MANIFEST=/absolute/path/to/private-assembly-attestation.json
export CC_RT_REPORT_DIR=/absolute/path/to/disposable/evidence
export CC_RT_A_EMAIL=<account-A-email>
export CC_RT_B_EMAIL=<account-B-email>
export CC_RT_A_PASSWORD=<account-A-password>
export CC_RT_B_PASSWORD=<account-B-password>

node tests/Browser/cc-r1-real-runtime.mjs
```

No default accounts/passwords exist in the script. Use only two test identities from the disposable PostgreSQL16 environment. The executor is responsible for provisioning approved active users without production data. No credentials appear in emitted evidence.

## Actual browser + database cases

| Gate | Real verification |
|---|---|
| AUTH | Two separate Chromium contexts login with real Laravel form/session; successful authenticated Dashboard; MFA not bypassed |
| SOURCE | Backend worktree HEAD is the approved 40-hex SHA; each of 29 PR #35 UI blobs matches the recorded exact Git SHA |
| DATABASE | Laravel environment is `testing`, driver is `pgsql`, PostgreSQL major version 16, test-named DB and both distinct active accounts |
| TASK CREATE | Use actual UI to POST `/tasks` (HTTP 201); authoritative GET and `tasks` table readback; persisted `created` event |
| RELOAD | Actual Chromium document reload and live server read; Task remains `open` |
| DENIAL | Separate Account B real list lacks Account A Task; direct `GET /tasks/{id}` returns masked 404 |
| TASK START | Use real UI `POST /tasks/{id}/start` (HTTP 200); Task state `in_progress` and persisted `start` event |
| TASK COMPLETE | Use real UI `POST /tasks/{id}/complete` (HTTP 200); Task state `completed` and persisted `complete` event, plus true page reload |
| WORK | `/transactions` real Inertia props, Personal Tasks + Work Requests presentation |
| P2 | `/notifications/feed` JSON; authenticated notification panel, calendar and messaging Inertia screens |
| P3 | Authenticated `/documents` register and `?mode=files` archive props; correspondence screen and authorized record list |
| RESPONSIVE | Desktop 1366×900 and mobile 390×844 authentic sessions with genuine screenshots |
| LOGOUT | Real Laravel POST `/logout`, Account A receives 401 on private Task GET, Account B remains separately authenticated |
| EVIDENCE | `result.json` holds sanitized statuses, test cases, source SHAs, DB driver/version and screenshot filenames; **no HTML fixture evidence accepted** |

**Limit:** Cross-office protected correspondence/document **negative destination** cases require separately authorized A-visible/B-invisible disposable records with known URLs and should be part of the independent P0/P3 security test matrix before acceptance. This script covers P1 cross-account Task negative behavior and P2/P3 authenticated screen/data wiring; it does **not** claim P0/P3 full security acceptance.

## Evidence classification and release rule

`node --check` and the frontend CI job may validate script syntax, dependencies and unchanged UI tests. Neither is a genuine runtime/browser PASS. The only runtime acceptance receipt is a successful execution against the exact authorized **combined** backend SHA with Laravel, PG16 and Chromium, `result.json` showing PASS, and genuinely captured screenshots. Publish the source tuple, actual HTTP status matrix and sanitized DB event receipt for independent review.

If any preflight fails: classify `BLOCKED`; on failed runtime assertions classify `FAIL`. No auto-retry on write errors, no merge, no deployment, no expanding backend authorization, and no GitHub credentials transferred into a frontend pull-request workflow.

## Separate operational handoffs

**Kurt / integration assembly** — Deliver a disposable combined-backend exact SHA, reviewed 29-blob overlay and dependency report, isolated test-only PostgreSQL16 accounts/credentials, test-only connection string and signed-off local attestation. Authority: source assembly only, no production writes or canonical merge.

**Kirion-Lucien / browser executor** — Execute this exact script against the approved assembly after its preflight and capture real HTTP/PG16/screenshots. Correct only frontend-owned UI defects on a reviewed implementation branch. No backend policy changes.

**Siris / independent QA** — Independently reproduce Task lifecycle, logout, P2/P3 navigation and negative security cases on the identical SHA tuple. Reject fixture screenshots or untraceable source overlays.

**Kirion-Nox / security** — Independently verify PR #84 correspondence authorization parity and any combined candidate's negative record-access behavior; no security PASS inferred from frontend CI.

**Kirch / human technical authority** — Authorize exact combined candidate and release decision. Preserve draft status until runtime and independent gates actually pass.
