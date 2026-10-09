# AJ / Jhayr — frontend implementation starter map
**DRAFT intake guide, not authorization to start A01 F01/F02.** Backend authority pinned `7b4ebb838982f6262b9fef65d18ba57488ebf941`. All application code remains in canonical backend until a separately authorized frontend source import.

## Existing frontend integration surfaces
| Priority | Source/reuse | Contract source | Safe initial work | Gate |
|---|---|---|---|---|
| 0 | [AppLayout](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/resources/js/layouts/AppLayout.tsx), [types](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/resources/js/types.ts), [navigation](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/resources/js/navigation/navigationDestinations.ts) | [shared props](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/app/Http/Middleware/HandleInertiaRequests.php), [nav access](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/app/Services/PortalNavigationAccess.php) | Map shell, auth, ARIA, CSS variables, responsive navigation; do not paste old backend PHP into new repo | FRONTEND-REG source provenance/build |
| 1 | `Auth/*`, `Dashboard.tsx` | session/MFA, DashboardWorkspaceQuery | Source-compatible login/dashboard UI import and tests | session/inertia version matrix + role tests |
| 2 | `Transactions/*` | `TransactionController` and requests; WorkQueueQuery | Work Request forms/queue/details from server-backed data, preserve return context | transition permission tests, polling freshness |
| 2 | `Correspondence/*` | `CorrespondenceWorkspaceController`, actions, lifecycle JSON | Split browsable inbox and detail from lifecycle writes | office policies + response/redirect tests |
| 2 | `Records/Index`, `Documents/Index` | RecordsSearchQuery + DocumentArchiveQuery | Archive/search presentation over proper mode and paginated data | selected record visibility, native download |
| 3 | `Memoranda/*`, `Calendar/Index` | MemorandumAuthority, CalendarWorkspaceQueryService | role-aware memo UI and read-only calendar | audience/role checks, timezone |
| 3 | `Messages/Index`, `AppLayout` notification surfaces | JSON feed/message resource; NotificationFeedQuery | Integrate existing endpoints with cursor/ownership semantics | H06 channel privacy, H07 drafts, H08 polling behavior |
| 4 | `Employees/Index`, `Departments/Index` | directory controllers | limited directory views; no private HR fields or department-specific forms | PII and roster authority |
| 4 | `Admin/Index`, `Audit/Index`, `Reports/Index` | privileged controllers | read-only audit/admin/report contracts after role definition | system admin and export negative tests |
| gated | A01-C1 `/tasks` | [released C1 contract](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/.forge/contracts/A01-C1-INDIVIDUAL-TASK-HTTP-CONTRACT.md) | Spec reading, TypeScript draft, test design; no automatic implementation handoff | FRONTEND-REG-001 + Kirch A01 frontend release |
| exclude | `MunicipalSystems/*`, `Plans`, `PPAs`, `ProjectMonitoring`, `Hris`, Property, Legislation, Travel | [exclusion register](SHOWCASE_REFERENCE_EXCLUSIONS.md) | style/reference study only without official operation claims | separate scope / LGU authority |

## Practical HTTP pattern
1. Browser server-rendered/Inertia screen: consume exactly the controller's component name and props. Preserve `auth.user` nullable, `permissions.navigation` and `workspaceExperience`. Feature flags/UX readiness are *not* authorization.
2. Mutating Inertia form: call the real mapped POST with session/CSRF; let backend validate and redirect; show validation and flash errors. Do not generate client-only lifecycle completion.
3. JSON helper: only for actual `GET/POST` endpoints declared in [routes](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/routes/web.php). Set same-origin credentials; type the documented JSON envelope; verify `response.ok` and content type; handle 401/403/419/422/429; never reuse machine tokens.
4. Task `/tasks`: strict JSON-only. Do not mix with Work Request `/transactions`, and do not assume unified 'My Work' until A02 release.
5. Catalog/static screens: preserve data provenance label and avoid posting form data to invented Laravel routes.

## Import submission checklist — one scoped PR per source stream
- Contributor + origin repository/archive with immutable source SHA.
- Framework/dependency versions, package manager, build and test commands, supported browsers/mobile sizes.
- Proposed files and import ownership; file-by-file collision map against shared shell and CSS.
- Exact producer SHA + accepted contract ID or explicit `source-observed/not released` marker per feature.
- Inertia props contract tests including nullable and empty/error states; 401/403/404/419/422 and wrong-office negative cases.
- No old full-stack backend copy, no `/api/v1` browser token, no static dummy records rendered as live.
- Screenshot and keyboard test evidence for desktop/narrow/mobile; smoke test dynamic data mutation/persistence against isolated fixtures only.
- Regression and CI names/links + Tech Lead sign-off; draft review is not final accepted release.

## Exact next actions
**Kirch:** review this draft and authorize *named contract families*, not blanket 24; decide holds H04–H06 and order controlled publication on his reserved branch.

**AJ and Jhayr:** complete FRONTEND-REG-001 source records and import/build proof first; then consume *only* families Kirch has released for them. Coordinate AppLayout, navigation and session once; do not fork competing contract truths.

**Lucien:** provide source/consumer diffs and negative-test designs; may not approve or merge. **Jane/Nox:** can advise backend/architecture under Kirch, not certify Siris QA.
