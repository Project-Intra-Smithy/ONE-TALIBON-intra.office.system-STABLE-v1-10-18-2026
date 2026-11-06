# OT-CLIENT-ALIGNMENT-UI-FINAL-R1 evidence

Scope authority: [Issue #35 owner direction #6675320037](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/issues/35#issuecomment-6675320037).

## Candidate outcomes

1. **Desktop Dashboard compaction — PASS.** At 1440×900 the department-head full-page height decreased from approximately 3,530 px in the PR #160 baseline to 2,918 px. More importantly, the three upper cards now share a compact 350 px band with accessible internal scrolling, and Events, Tasks, Documents, and Quick Links begin immediately below it. All metrics and role-specific lower sections remain mounted.
2. **Sidebar client terminology — PASS.** Existing wired destinations use client-recognizable Dashboard, Departments & Offices, Development Planning, Document Management, and Employee Directory terminology/order. Server permissions, readiness, staged-route checks, hrefs, and held-module exclusions remain in force.
3. **Available Planning Maps — PASS.** The exact sidebar item deep-links to `/development-plans#available-planning-maps`. The focused section states that no municipality-approved maps have been supplied and distinguishes illustrative plan-card art from official maps. It adds no GIS backend, downloads, thumbnails, or invented data.

## Playwright evidence

- `before/`: 24 unchanged screenshots copied from Engineering Hub PR #160 (`main@17e7b60ba6c9450e0c2f6c9dcf676525639de0c6`).
- `after/`: 24 authenticated candidate screenshots using a fresh disposable PostgreSQL 16 database and normal UI MFA enrollment/challenge.
- Matrix: Dashboard for employee, department head, executive, and system administrator at 390×844, 768×1024, 1280×800, and 1440×900; Planning Maps for employee and department head at the same four viewports.
- Machine checks: 24/24 HTTP 200, 0 horizontal-overflow failures, 0 page/console errors, and 8/8 map cases with section focus, truthful status, and exactly one active map navigation item.
- Full structured observations: `playwright-results.json`.

Representative pairs:

- `before/department-head/1440x900/dashboard.png` → `after/department-head/1440x900/dashboard.png`
- `before/department-head/1440x900/available-planning-maps.png` → `after/department-head/1440x900/available-planning-maps.png`
- `before/employee/390x844/dashboard.png` → `after/employee/390x844/dashboard.png`
- `before/employee/390x844/available-planning-maps.png` → `after/employee/390x844/available-planning-maps.png`

## Test results

- `npm run types:check`: PASS
- `npm run test:contracts`: PASS — 103/103
- `npm run test:ux`: PASS — 9/9
- `npm run build`: PASS
- Bounded authenticated Playwright matrix: PASS — 24/24, 48 review images total including baselines

These results belong only to the exact candidate SHA identified by the PR. They do not award CI, independent QA, client acknowledgment, merge, release, or production approval.
