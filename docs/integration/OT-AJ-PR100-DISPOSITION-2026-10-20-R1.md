# AJ PR #100 — Integrated source disposition (2026-10-20)

**Technical Authority:** Kirch Ivan Balite
**Source PR:** [backend PR #100](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/pull/100) — AJ, base PR #99, head `01da9eaa02cdc28687a32887ac5c846d0b4ba5cb`.
**Destination:** `Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026`, `integration/one-talibon-complete-r1`.
**Scope law:** HRIS directory + real portal presence + employee-self recorded attendance only. No payroll, leave, health, development or lifecycle exposure. Messaging and correspondence restrictions remain.

## Exact integration work already performed

- `869e039c14f0fe351f0f651d7674f12c3031a047`: PR100 complete Calendar UI, timezone/date utilities, unavailable component, workspace CSS, app import, current-shell styling attributes and schedule test.
- `c7456827e5b3beccd31b84aeab4366c8b2cff032`: exact-base-safe PR100 PageHeader, MunicipalContext, NotificationContext, PersonalTaskWorkspace UI, Login/MFA CSS, MFA page visual and source contract tests.
- `0593106fb6bdd43fe793e8f0d078143e3a0682cb`: manual merge of PR100 mobile bottom navigation, Tasks access, hash-aware navigation and notification states **onto existing** AppLayout/PortalSidebar/ActivityRail (retains unique current presence heartbeat, PortalLauncher, account/role navigation).
- `0a05864910757d97af52b9b2d95efdf6f2904afe`: PR100 UX fixture/visual test/navigation contract test and npm commands, backend-composed Dashboard fail-closed props boundary.
- Subsequent scoped anchor alignment: new `#personal-tasks` target is added **without removing** original backend `#dashboard-personal-tasks` target.

## Preserved integrated runtime instead of wholesale PR100 replacement

- `resources/js/pages/Dashboard.tsx` and its `DashboardSection`-based visuals: current integrated backend-composed role experiences, panels and **single** `PersonalTaskMutationPanel` are retained. PR100 improvements to Task state tabs, unavailable-props handling, quick Tasks access, Calendar and UX styles were separately ported.
- `resources/js/components/dashboard/{CorrespondenceOverview,DashboardHeader,ExecutiveOverview,MetricGroup,OfficeOverview,QuickActions,RecentWorkList,SystemOverview}.tsx`: all diverged materially from PR99 baseline in the destination. Preserve current role/workflow/server-contract renderers rather than copy older, incompatible layouts. This means PR100 visual byte parity is deliberately **not** claimed.
- `resources/js/components/shell/PortalSidebar.tsx` and `resources/js/layouts/AppLayout.tsx`: preserve destination's current auth/presence/workspace and source-driven navigation; manually merge relevant PR100 mobile Tasks/More and notification behaviors.
- `tests/Browser/aj-home-auth.test.mjs`: preserve destination's currently integrated regression test; PR100 additive UX/browser/Frontend tests imported separately.
- Original PR #100 evidence/screenshots and historical continuity docs stay in AJ's PR repository; their presence there is not misrepresented as tests run on destination.

## Exact evidence and blockers

AJ reports TypeScript + Vite + 40 focused tests PASS **at PR100's own source**, not against this integration branch.
Destination integrated code has **NOT** been locally executed by this GitHub writer after these commits. Source writes are real; no PHP lint, TypeScript, Vite, Node contract, browser or PHPUnit PASS is claimed here.

Next exact-candidate validation must include **fast** `npm run types:check`, `npm run build`, `npm run test:contracts`, `npm run test:ux`, existing `npm run test:aj-home-auth` and focused route/Feature security tests on disposable PostgreSQL. Resolve failures only on the integration line, preserving backend-authoritative role data and restrictions. Genuine authenticated Chromium Q0–Q7, independent acceptance, release gates and final main/UAT operations remain outstanding.

**Do not merge the stacked PR #100 directly into original backend main, overwrite present integrated shell, run destructive UAT migrations, activate Messaging, or call a PR100 visual preview authenticated Laravel E2E.**
