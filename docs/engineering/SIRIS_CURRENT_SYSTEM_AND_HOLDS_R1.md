# Siris — Live ONE TALIBON system state and release-boundary readback

**Pinned application main before docs branch:** `ec17cbfab2a52b55e4f3f45bd5ec199df3858d66` as of 2026-11-06. [Owner handoff Hub #162](https://github.com/Project-Intra-Smithy/engineering-hub/issues/162). **This is a source/issue readback, not executable acceptance.** Source moved? Reverify before work.

## Materially built, by domain

| Capability | Source examples | Verified boundary / next evidence |
|---|---|---|
| Login, MFA, active identity | `routes/web.php`, `app/Http/Controllers/Auth/*`, `app/Http/Middleware/RequireMfaAssurance.php` | Real four-role login/MFA/logout/role-deny must be reproduced on merged main, #161 |
| Dashboard & portal shell | `resources/js/pages/Dashboard.tsx`, `components/dashboard/r7/*`, `resources/css/aj-dashboard-workspace.css`, `navigation/portalNavigation.ts` | PR37 merged 350px desktop Dashboard, client terminology and exact Available Planning Maps link; Gerry client-reference acceptance pending |
| Work Requests/Transactions | `config/work_requests.php`, `WorkflowTransaction` domain, `TransactionWorkflowService`, routes/requests/tests | Implemented source routes/models/list/transition; history #128 flags ordinary non-mayoral closure and action outcomes; demonstrate current exact-SHA lifecycle and deny tests |
| Personal Tasks | `app/Domain/Tasks/*`, `app/Http/Controllers/Tasks/IndividualTaskController.php`, Task tables/tests | A01 bounded HTTP backend contract exists; do not conflate personal Tasks with delegated official workflow; test synthetic create/start/complete and ownership |
| Correspondence | `CorrespondenceWorkspaceController`, `CorrespondenceAccessDecider`, `DenyUnverifiedCorrespondenceMutations` | Read/list/detail logic exists, but restricted-UAT write gate remains fail-closed; never label intake/release/archive fully working without official policy and current-SHA negative tests |
| Document Center/Records/Memoranda | `DocumentCenterController`, `DocumentArchiveQuery`, `DocumentAccessService`, `MemorandumService` | List/search/archive/filter source exists; prove record-specific permission, bytes/download isolation, version/trace/negative visibility as applicable |
| G2 Plan custody | migrations 2026_10_28*, `PlanDocumentOriginGuard`, `config/plan_custody.php`, PG16 tests | Curated foundation merged PR27, not public/official PDF serving; WORM/scanner/storage mount/ACL, restore, G3/G4 and municipal edition authority distinct |
| Calendar | `CalendarWorkspaceQueryService`, `CalendarController`, React calendar components | Read and derived views present; do not assume unrestricted manual CRUD, synchronization or official calendar ownership; test dates, roles, focus |
| Development Plans & PPAs | `pages/Plans/Index.tsx`, `pages/PPAs/Index.tsx`, plan components | Presentation/reference-only; maps anchor empty by design, no official maps supplied, no implied GIS, PDF official edition or approved PPA register |
| Departments / Employee directory | `OfficeDirectoryCatalog`, `DepartmentController`, `EmployeeDirectoryController`, `config/office_directory.php` | 40 focal display entries vs 33 backend seeds vs 0 official email map; municipality must validate 48-row union/crosswalk |
| HRIS/payroll/property/legislative/travel orders | `app/Http/Controllers/Hris* /Property* /Legislative* /TravelOrder*` and respective React pages | Real source exists; operational release, privacy, signatory, LGU policy, workflow/QA not automatically accepted |
| Messaging / announcements / procurement / projects / meetings | `DenyUnapprovedMessaging`, navigation readiness, pending pages | Some code/demo surface, but current Messaging server hard-deny and `integration_pending` routes prohibit assuming ready user functionality |
| Public homepage | `PublicPortalController`, `pages/Public/Home.tsx`, `config/public_portal.php` | Review privacy and publication state before any DNS/hosting claim; no assumed weather/geolocation or actual live hosting |
| CI, scripts, fixtures | `.github/workflows/*`, `package.json`, `DatabaseSeeder.php`, `scripts/dev-start.ps1` | Existing scripts may kill listeners/migrate configured DB; use isolated loopback PG16/test-only users; a workflow file is not CI evidence |

## Exact recent merge lineage (verified GitHub)
- 2026-11-05: PR27 curated AJ frontend + G2 custody merged; donor PR18/22 remain open historical sources and **must not be reapplied**.
- 2026-11-05: PR34 scoped inherited Pint formatting recovery merged. Older #26 “41 Pint failures” is a historical claim; re-run scoped Pint at new exact SHA before concluding current status.
- 2026-11-06: PR37 merged candidate `e29bd395f0f2924f65d14f8dc716fb3270ae52b5` into `ec17cbfab2a52b55e4f3f45bd5ec199df3858d66`, delivering Dashboard compaction/sidebar terms/Planning Maps link+truthful no-maps state.
- [Nox PR37 review](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/pull/37#pullrequestreview-5799373296) source PASS and submitted evidence internally consistent, independent screenshot/runtime verification not awarded.
- [Siris QA #161](https://github.com/Project-Intra-Smithy/engineering-hub/issues/161) is already assigned; no completed screenshot/test report observed at this snapshot.
- [Gerry client alignment #35](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/issues/35) remains open and no client acceptance implied.

## Mandatory containment, independently owned

`config/messaging_release.php` literal `restricted_uat=true`; `DenyUnapprovedMessaging` returns 403; `DenyUnverifiedCorrespondenceMutations` denies until explicit controlled opt-in and existing per-record authorization. There is **no demo exception**. Protected Plan origin `EVER_PLAN` must not fall through to generic document retrieval, legacy association, public webroot or unverified scanner receipts. Login, active staff, MFA, classification/office/role and revocation gates are server-owned. Nox must validate negative cross-domain projections and unauthorized access with synthetic records if affected.

Historical [OPS index Hub #128](https://github.com/Project-Intra-Smithy/engineering-hub/issues/128) has P0-A correspondence leak, P0-B ordinary Work Request closure, P0-C correspondence release/archive, P0-D manual intake/outgoing and Track-W policy gate. These were classified on older SHAs and need current-source executable differential; **neither a frontend merge nor old issue-open status is current defect proof.** If any remain demonstrably unresolved, either fix under approved limited contract or exclude and keep safe containment.

## Current evidence labels
- `IN_REPO_SOURCE`: code exists at exact pinned SHA; not necessarily enabled.
- `SUBMITTED_EXECUTION`: Codex/worker reports test PASS; requires exact run receipt.
- `INDEPENDENT_QA`: real Siris/manual report with role, viewport, route, screenshot, exit code; pending.
- `HOSTED_CI`: current merged-source workflow run/status; not observed in this audit.
- `LGU_CLIENT_ACCEPTANCE`: Gerry/municipality signed scope and data; pending.
- `PRODUCTION_READY`: deployment, TLS, DB backup, storage/restore, rollback, monitoring, secret custody and owner release; not established.

**Current disposition:** `SOURCE_INTEGRATED / RELEASE_SCOPE_UNFROZEN / SIRIS_QA_PENDING / OFFICIAL_DIRECTORY_INPUT_PENDING / NO_PRODUCTION_CLAIM`.
