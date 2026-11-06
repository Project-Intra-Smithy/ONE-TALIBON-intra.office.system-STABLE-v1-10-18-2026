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

## Final Dashboard refinement

The follow-up refinement changes only the scoped Dashboard CSS and its focused contract assertion.

- `refinement/before/`: the original PR #37 candidate Dashboard for department head, executive, and system administrator at 390×844, 768×1024, 1280×800, and 1440×900.
- `refinement/after/`: the revised authenticated Dashboard captures for the same 12 cases.
- `refinement/playwright-results.json`: computed panel geometry, metric overflow/collision results, focus and keyboard-scroll observations, page dimensions, HTTP status, horizontal overflow, and console/page errors.
- Department-head 1280×800: three aligned 350px upper panels; full-page height reduced from 4,220px to 3,466px.
- Department-head 1440×900: three aligned 350px upper panels; full-page height remains 2,918px with wider metric-label clearance.
- Mobile/tablet heights remain 5,473px at 390×844 and 4,352px at 768×1024; no new horizontal overflow.
- Final targeted Playwright result: **12/12 PASS**, with zero placement, card-height, metric-overflow, label/icon collision, focus, horizontal-overflow, console, or page-error failures. Scrollable Work Summary regions accepted keyboard scrolling; non-overflowing regions remained focusable without requiring artificial scroll.

Final refinement gates: TypeScript exit 0; frontend contracts exit 0 (103/103); UX exit 0 (9/9); production build exit 0; targeted authenticated Playwright exit 0 (12/12).
