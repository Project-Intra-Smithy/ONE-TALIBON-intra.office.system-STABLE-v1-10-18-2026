# ONE TALIBON dual-repository staging and initial parity audit

Mission: `OT-FINAL-INTEGRATION-RESUME-GH007-R2`

## History staging result

- Destination `main` remains `3fb1091443f0b0d67409c6bde2f8c88ac57a3ec0`.
- GitHub Actions are disabled at repository level.
- Backend pinned main verified: `8a130e151fdf79e87e134a5d26e58667889f0a7e`.
- Backend whole-product candidate verified present: `2d39f7ba0f764769130a4e0066a0d0e5163b4eb0`.
- Backend authoritative namespaces: 109/109 branches, 86/86 PR heads, 44/44 tags; 1,578 distinct reachable commits.
- Frontend pinned main verified: `dc5950ce73a4b6342fd8f2e4e21a4a59ae28f62c`.
- Frontend whole-product candidate verified present: `eb0875822afe697a03c4d6781692133483710f51`.
- Frontend authoritative namespaces: 21 branches, 19 PR heads, 0 tags; 166 distinct reachable commits.
- Every authoritative destination ref was read back and compared to the exact source object SHA. No mismatch was found.
- The 77 branches accepted during the earlier interrupted `backend/*` attempt remain intact as non-authoritative legacy staging refs.

## Local UAT source snapshot

- Branch: `staging/codex/uat-aj-pr99-overlay-20261019`
- Snapshot commit: `5186ccb0edc26ee2b309088170c6267465e52e43`
- Exact parent: `88f3d6bd6258d502f1b5e6bf323bcf22619f5f8d`
- AJ executable source represented: `54b0cafe62243e6505ffbc1ca22ef263c08e1ce0`
- Contains the reviewed homepage/Login/MFA composition and sanitized deployment notice.
- Excludes `.env`, credentials, cookies, MFA material, database contents/volumes, Docker state, `vendor`, `node_modules`, build caches and runtime storage.
- No UAT redeployment or database mutation occurred during staging.

## Exact file parity inventory

Compared backend candidate `2d39f7b...` with frontend candidate `eb08758...` using tracked-file SHA-256 values:

| Classification | Count |
|---|---:|
| Backend only | 952 |
| Frontend only | 49 |
| Same path, different bytes | 36 |
| Identical | 72 |

Machine-readable evidence:

- `evidence/parity/file-parity.json`
- `evidence/parity/file-parity.csv`
- `tools/audit_parity.py`

## Initial integration dispositions and defects

### HIGH — Frontend route-readiness source enables restricted Messaging

- Frontend: `eb08758...:resources/js/navigation/stagedRoutes.ts:12`
- Evidence: the frontend candidate adds `/messages` to the set treated as staged/available. Canonical backend exposes `/messages` only behind `DenyUnapprovedMessaging` (`routes/web.php:94-98`). The mission explicitly prohibits Messaging activation.
- Root cause: the frontend integration candidate's readiness list is broader than the canonical backend composition list.
- Disposition: **REWORK**. Do not port `stagedRoutes.ts` wholesale. Retain the backend restriction and verify unauthorized navigation concealment plus direct-route denial.
- Owner: frontend implementer with backend authorization review.
- Verification: authenticated role-negative browser test, direct GET/POST denial, and navigation absence.

### HIGH — Frontend shell would remove the working workspace launcher

- Backend: `2d39f7b...:resources/js/layouts/AppLayout.tsx:9,262`
- Frontend: `eb08758...:resources/js/layouts/AppLayout.tsx:9,262`
- Evidence: canonical backend imports and renders `PortalLauncher`; the frontend candidate removes both while changing the mobile context label.
- Expected: preserve workspace-launcher access already required and browser-accepted in the UAT shell.
- Disposition: **PORT selectively / RETAIN_WITH_CONTRACT_REASON**. Port the mobile header wrapping correction, retain `PortalLauncher` and its server-filtered navigation groups.
- Verification: 320/390/768/1440 Chromium, keyboard focus, launcher open/close, authority-filtered destinations.

### HIGH — Personal Task mutation implementations are divergent, not additive

- Backend Dashboard: `resources/js/pages/Dashboard.tsx:12-13,66` uses read workspace plus `PersonalTaskMutationPanel`.
- Frontend Dashboard: `resources/js/pages/Dashboard.tsx:12,65` uses a different `PersonalTaskWorkspace` that imports frontend-only `TaskMutationControls` (`PersonalTaskWorkspace.tsx:6`).
- Evidence: `TaskMutationControls.tsx` is frontend-only; backend has `PersonalTaskMutationPanel.tsx`. The API implementations and associated tests also differ.
- Risk: blindly overlaying PR34/whole-product frontend can duplicate, remove or alter the already verified Task create/start/complete contract.
- Disposition: **REWORK** around one mutation surface. Preserve backend HTTP/authorization semantics; reconcile AJ presentation onto one component, then remove the redundant implementation only after exact tests.
- Verification: real PostgreSQL-backed create → reload → start → complete, event chain, CSRF, MFA/session expiry and second-owner masked access.

### MEDIUM — Authentication UI differs across candidates

- Different paths: `Auth/Login.tsx`, `Auth/MfaChallenge.tsx`, `login.css`, `mfa-challenge.css`.
- Backend candidate contains the newer PR99-composed Login/MFA source; frontend whole-product candidate contains the earlier consolidated frontend variant.
- Disposition: **RETAIN_WITH_CONTRACT_REASON** for backend PR99 auth source, unless a later visual port is performed without changing POST endpoints, payloads, CSRF/session handling, MFA redirects or error associations.
- Verification: genuine Laravel login, inactive account, wrong password, MFA TOTP/recovery, logout and CSRF negatives.

### MEDIUM — Frontend candidate includes preview/test-only runtime sources absent from backend

- Examples: dashboard preview fixtures/isolation, shell fixtures, visual preview sources, and mounted synthetic-response suites.
- These are useful evidence harnesses but are not production runtime modules.
- Disposition: **TEST_FIXTURE_ONLY**. Retain in a test/preview lane only; do not wire synthetic navigation or fixture identities into production bundles.

### MEDIUM — Shared operational pages have byte-level divergence

Different shared paths include Correspondence actions, Correspondence Show, Memoranda Show, Transaction Create, Departments, Staff Workload, theme/appearance and CSS foundations.

- Some frontend changes are formatting/presentation; others alter control sizing, dark-mode classes, navigation readiness or component composition.
- Disposition: **PORT** presentation only after file-by-file contract comparison; **RETAIN_WITH_CONTRACT_REASON** for server-bound fields, capabilities, authorization and route/payload semantics.
- Verification: TypeScript/build, real Laravel validation errors, authorization negatives, responsive Chromium and keyboard accessibility.

### BLOCKER — Complete runtime acceptance has not run for this exact tuple

- History and file parity are verified.
- Composer/npm installation, PHP tests, PostgreSQL migrations/tests, production build and genuine authenticated Chromium for the tuple `2d39f7b... + eb08758...` are **NOT_RUN**.
- No runtime PASS is claimed.

## File-level disposition rule

- Backend-only PHP, routes, migrations, authorization, configuration and server tests: **RETAIN_WITH_CONTRACT_REASON** unless independently fixed.
- Frontend preview fixtures and synthetic-only harness modules: **TEST_FIXTURE_ONLY**.
- AJ dashboard/shell visual components: **PORT** selectively.
- Navigation readiness, Task mutation and any shared file changing server contracts: **REWORK**.
- PR99 Login/MFA already composed in backend: **RETAIN_WITH_CONTRACT_REASON** pending real auth regression.

## Required next execution

Create a separate integration branch from the canonical backend candidate, port AJ dashboard/shell presentation while retaining backend authority and the launcher, reconcile one Task mutation implementation, keep Messaging restricted, then run locked dependency installation, TypeScript, production build, PHP/PostgreSQL suites and genuine Chromium acceptance. This report does not authorize mainline promotion.
