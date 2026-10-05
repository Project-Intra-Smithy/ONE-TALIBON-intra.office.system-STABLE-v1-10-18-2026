# KIRION FORGE: P04 / W02 FRONTEND TARGET MAP

Technical Authority: **Kirch Ivan Balite**

Series: `P — CANONICAL BASELINE HARDENING`

Slice: `P04 — FRONTEND CANONICALIZATION`

Writer lane: `W02`

Immutable implementation base: `a10dca34db0509d7139ebeb4080e85dde2c0e544`

This addendum narrows the existing W02 handoff. It does not broaden owned scope.

## Execution order

### P04-A — Shell/Navigation/Destination Authority

Start here.

Inspect `resources/js/layouts/**`, `resources/js/navigation/**`, Dashboard entry and shared shell.

Explicit mismatches:

- Procurement / PR Tracking marked `wired`;
- Project Monitoring marked `wired` through `/operations`;
- `HR Employee Portal` wording versus immediate Employee & Office Directory authority;
- integration-pending admin destinations;
- reference/deferred modules that look production-ready.

Do not invent missing backend authority. Correct presentation or return cross-layer findings to Maintainer.

### P04-B — Work & Accountability Surfaces

Inspect My Work/Transactions, assignment/status/due-date presentation, transaction details/live surfaces and dashboard work projections.

Preserve Task != Work Request.

### P04-C — Documents/Correspondence/Records/Search

Inspect Correspondence, Document Center/Documents, Records, search and Memoranda presentation plus denied/empty/error states.

### P04-D — Coordination Surfaces

Inspect Notifications, Calendar, Messaging, Meetings and Announcements.

Meetings and Announcements use repository static municipal datasets and must remain truthfully marked reference/non-live unless later accepted evidence proves otherwise.

Preserve accepted Messaging behavior; historical `PrototypeMessaging` naming alone is not permission to redesign it.

### P04-E — Organization/Admin/Specialized Reference Surfaces

Inspect Departments/Employees, Admin/Audit/Reports, Legislative, Local Special Bodies, Plans, PPAs, Municipal Systems/Future Integrations, frontend HRIS remnants, Procurement and Project Monitoring presentation.

### P04-F — Shared States/Responsive Stability

Inspect loading/empty/error/permission states, stale wrappers/components/imports, 1440/390 behavior, overflow and accessibility on changed surfaces.

No broad visual redesign.

### P04-G — Frontend Extraction Manifest

Map Inertia props, server route assumptions, auth/session/CSRF dependencies, uploads/downloads, browser tests, build/assets and future API client needs.

## Commit discipline

Prefer one bounded commit per sub-slice when actual source changes exist:

- `KIRCH-FORGE-P04A-...`
- `KIRCH-FORGE-P04B-...`
- etc.

A sub-slice may legitimately return `NO SOURCE CHANGE — CLASSIFICATION ONLY` when mutation is not justified.

## Validation cadence

Code first. Use TypeScript/build or targeted browser proof only where a changed surface requires it. Broad integrated CI/CD belongs to P08.

## Stop rule

Stop for Maintainer disposition when the necessary repair requires backend/controller/route/schema changes, root package/build changes, CI/Docker scope, or unclear LGU business authority.
