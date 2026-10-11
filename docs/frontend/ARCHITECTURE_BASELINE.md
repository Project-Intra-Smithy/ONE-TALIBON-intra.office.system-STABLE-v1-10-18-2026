# FE-BASE-01 — frontend architecture baseline

Documentation candidate for [Issue #17](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/17), inspected 12 October 2026 (Asia/Shanghai). Owner: AJ; partner: Jhayr; executor: Codex. Contributor review and Kirch technical disposition are pending.

## Evidence boundary

- Inspected application source: `AJ-FRONTEND-REG-001-EXISTING-WORK@49ba8cafd7ad14e85984466907bc573f42d1d659`. Tests ran after documentation-only START commit `4164210a0240105f92c46976e2cfc9b5acdee509`; application content is unchanged.
- Live frontend main at preflight: `e6f5947ab330802f4b860b28baddc910ca32e13e`. This is a working-branch inventory, not a claim that the branch contains every later main change. No rebase or merge performed.
- Backend evidence tuple: documented `Talibon-Sales-Prototype@7b4ebb838982f6262b9fef65d18ba57488ebf941` + frontend source above. No assembled or authenticated runtime tuple was tested. This backend SHA is the contract pack's reference, not a claim about live backend main.
- [START memory](../WORK_PACKAGE_CONTINUITY.md#start--fe-base-01--2026-10-12-asiashanghai) and [verified issue crosslink](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/17#issuecomment-6112145691).
- The maintained [consumer contracts](../contracts/ONE_TALIBON_FRONTEND_CONTRACT_PACK_R1/FRONTEND_CONSUMER_CONTRACTS.md#fe-base-01--working-frontend-traceability) already own transport/prop guidance; FE-BASE-01 extends that document rather than creating a competing `CONTRACT_TRACEABILITY.md` or `frontend-contract-matrix.md`. The README and historical import register remain source/provenance context, not replacements for this exact-source inventory.

## Application and page resolution

| Actual path (relative to repository root) | Responsibility |
| --- | --- |
| `resources/js/app.tsx` | Imports global CSS, initializes appearance, mounts React through `createInertiaApp`/`createRoot`, wraps the app in `AppErrorBoundary`, and formats document titles. Resolves server component names using `./pages/${name}.tsx` and `import.meta.glob('./pages/**/*.tsx')`. |
| `vite.config.ts` | Laravel Vite entrypoints `resources/css/app.css` and `resources/js/app.tsx`; React and Tailwind plugins. No frontend HTTP authentication server. |
| `resources/js/layouts/AppLayout.tsx` | Only shared layout file. Operational page shell, server-derived identity/navigation, flash display, notification polling/state, sidebar collapse preference and mobile navigation. Accepts `presentation: standard | portal-dashboard`. Auth pages compose their own markup; there is no separate AuthLayout file. |
| `resources/js/components/shell/PortalSidebar.tsx`, `MobileNavigation.tsx`, `PortalTools.tsx`, `NotificationContext.ts` | Desktop sidebar, native mobile dialog, identity/launcher/records search, and notification context consumed by dashboard activity. |
| `resources/js/navigation/portalNavigation.ts` | Destination/group/readiness registry and `buildPortalNavigation`; preserves server permission associations and experience filtering. |
| `resources/js/navigation/stagedRoutes.ts` | Local page-path allowlist. Prevents links to unsupported bundle pages; it is not endpoint authorization or a server router. |

The resolver contains these 19 pages. Each name below maps exactly to `resources/js/pages/<name>.tsx`; page presence does not establish backend acceptance.

| Component names / file stems | Responsibility |
| --- | --- |
| `Auth/Login` | Inertia `email/password/remember` form, POST `/login`; validation errors and processing state. Google sign-in is disabled and activation is informational. |
| `Auth/MfaChallenge`, `Auth/MfaEnrollment`, `Auth/MfaRecoveryCodes`, `Auth/MfaSettings` | TOTP/recovery challenge, enrollment confirmation, one-time recovery display, and settings actions. Preserve sensitive props and server redirects. |
| `Dashboard` | Composes employee, department-head, executive and system-administration presentations from `experience.key`. |
| `Transactions/Index`, `Transactions/Create`, `Transactions/Show` | Work Request queue/form/detail and live projection; not personal Tasks. |
| `Correspondence/Index`, `Correspondence/Show` | Inbox and workspace detail/actions. |
| `Records/Index` | Actor-scoped records register and filters. |
| `Memoranda/Index`, `Memoranda/Create`, `Memoranda/Show` | Memoranda list/issue/detail and acknowledgement surfaces. |
| `Calendar/Index` | Read-only calendar projection and view/date selection. |
| `Departments/Index`, `Employees/Index` | Directory consumers; no departmental workflow or employee private-profile page here. |
| `Errors/Status` | HTTP error page. |

Absent at the inspected branch: `Documents/Index`, `Messages/Index`, `Employees/Show`, `Departments/Workspace`, `Admin/Index`, `Audit/Index`, `Reports/Index`, `Search/Index`, `MayorOffice`, and a personal Task page. Some are documented backend render targets; do not infer complete route coverage from the resolver glob or add them in this package. Live PR #14 is merged, but its Task work is outside this branch inventory and FE-BASE-01 scope.

## Types, adapters and components

| Actual paths | Responsibility |
| --- | --- |
| `resources/js/types.ts` | Shared auth/department/experience/navigation types and notification feed types. `auth.user` and employee can be null. Type declarations do not validate server responses or publish contracts. |
| `resources/js/compat/notificationFeed.ts` | Safe empty notification feed; validates basic feed/list shape, filters unsafe row URLs, normalizes counts. Not exhaustive validation of every nested field. |
| `resources/js/compat/uiContracts.ts` | Memo audience filtering, calendar anchor/date fallback, safe correspondence overview counts. |
| `resources/js/components/dashboard/types.ts`, `resources/js/components/work-queue/types.ts` | Local dashboard and Work Request projections. Other pages also declare local prop types. |
| `resources/js/components/dashboard/DashboardHeader.tsx`, `MunicipalContext.tsx` | Experience heading/identity and municipal date context. |
| `resources/js/components/dashboard/MetricGroup.tsx`, `metricPresentation.ts` | Server metric presentation and semantic color choice; unsupported metric links are guarded. |
| `resources/js/components/dashboard/CorrespondenceOverview.tsx`, `OfficeOverview.tsx`, `ExecutiveOverview.tsx`, `SystemOverview.tsx` | Conditional domain/experience sections; these are not permissions granted by the browser. |
| `resources/js/components/dashboard/RecentWorkList.tsx`, `QuickActions.tsx`, `ActivityRail.tsx`, `format.ts` | Recent work and empty states, guarded action links, notification/system activity, date/status formatting. |
| `resources/js/components/PageFrame.tsx`, `PageHeader.tsx` | Shared width/density spacing and page heading/aside composition. |
| `resources/js/components/AppearanceControl.tsx`, `MunicipalBrand.tsx` | Appearance selector and branding presentation. |
| `resources/js/components/filters/ProgressiveFilterBar.tsx` | Shared filter controls including mobile dialog. |
| `resources/js/components/documents/EvidenceFields.tsx`, `EvidenceList.tsx` | Evidence input/list presentation; does not imply a complete Documents page. |
| `resources/js/components/correspondence/CorrespondenceActionPanel.tsx` | Existing capability-driven workspace action form. |
| `resources/js/components/work-queue/WorkItemList.tsx`, `WorkScopeTabs.tsx`, `StaffWorkloadTable.tsx` | Existing Work Request list, scope tabs and workload table. |
| `resources/js/components/system/AppErrorBoundary.tsx` | Render-failure fallback; distinct from HTTP `Errors/Status`. |
| `resources/js/hooks/useVisiblePolling.ts` | Visibility-aware polling with cancellation; used by notifications and live work. |

## Styling, assets and fixtures

| Actual paths | Responsibility |
| --- | --- |
| `resources/css/app.css` | Tailwind 4 import, municipal stylesheet imports, dark variant, Inter/system font stack, 320px minimum body width and shared focus outlines. Font declaration alone does not establish that Inter is loaded. |
| `resources/css/municipal.css`, `municipal-controls.css`, `visual-system.css` | Municipal tokens/components, common controls and visual presentation rules including auth surfaces. Shared CSS affects both workstreams. |
| `resources/js/theme/appearance.ts`, `useAppearance.ts` | System/light/dark preference, root classes and storage fallback; presentation preference only. |
| `resources/js/branding/talibonAssets.ts`, `public/` | Existing brand/landscape asset references; README labels the supplied SVGs as placeholders, not approved official artwork. |
| `visual-preview.html`, `resources/js/visual-preview.tsx` | Separate development fixture entry; resolves actual pages with synthetic props and a visible fixture banner. Not a Laravel production build input. |
| `resources/js/visual-fixtures.ts` | Synthetic page/role projections; not backend schema proof, persisted records, sessions or authorization evidence. |
| `scripts/verify-visual-preview.mjs` | Playwright fixture screenshots at 1440x900 and 390x844, mount/overflow checks and mobile Escape interactions; writes `artifacts/visual-fixture/`. Does not authenticate with Laravel. |
| `.github/workflows/frontend-staging.yml` | Node install, types, tests, build and Playwright fixture job. Docs-only changes do not match its PR path filter; no current-candidate CI PASS inferred. |

## Existing tests and this run

`tests/navigation-contract.test.mjs` has four tests for registry identities/readiness, paths/permissions, optional builder argument and guarded links, and preserved dashboard/density contracts. `tests/ui-contracts.test.mjs` has five tests for notification defaults/parsing, calendar date fallback, memo audiences, correspondence counts and staged paths. `tests/visual-fixtures.test.mjs` has two fixture metadata/role tests; despite a test name mentioning mounting, this Node test does not launch a browser. No new tests or package scripts were added.

Local runs on START commit `4164210a0240105f92c46976e2cfc9b5acdee509`, using Node `v22.16.0`, npm `10.9.2` and existing installed dependencies:

| Command / gate | Result | Actual evidence / limit |
| --- | --- | --- |
| `npm run types` | **FAIL** | npm: `Missing script: "types"`. Task spelling differs from `package.json`; no source change to mask this. |
| `npm run types:check` | **PASS** | `tsc --noEmit`, no diagnostics. Repository-documented typecheck. |
| `npm test` | **PASS** | 11 tests, 11 passed, 0 failed/cancelled/skipped. Node emitted experimental type-stripping warnings. |
| `npm run build` | **PASS** | Vite `8.3.0`; 2184 modules transformed; build completed in 1.00s. Generated `public/build` output excluded from commits. |
| `npm ci` | **NOT RUN** | Existing dependencies used; not a clean-install reproduction. |
| `npm run visual:verify`, keyboard/mobile/contrast review | **NOT RUN** | Source inventory only; no new screenshot or accessibility acceptance. |
| Authenticated Laravel, session/CSRF/MFA/role negatives | **NOT RUN** | No backend-mounted environment tested. |
| Hosted CI / independent QA / technical acceptance | **NOT RUN / NOT AWARDED** | Local frontend checks are not these gates. |

Final documentation whitespace/scope checks and exact delivery SHA are recorded in the paired CLOSE proposal in [work memory](../WORK_PACKAGE_CONTINUITY.md). Application files remain identical to the inspected source.

## Compact UX review — source observations, not browser acceptance

| Area | Existing evidence | Follow-up owner / evidence needed |
| --- | --- | --- |
| Typography/consistency | Shared municipal styles and heading primitives coexist with auth pages' local utility markup. | Jhayr #21 and AJ #18 coordinate auth/global tokens; validate rendered font, light/dark contrast and hierarchy. |
| Login accessibility | Wrapping labels, username/current-password autocomplete, required fields, focus styles and disabled processing button exist. Errors are plain spans without explicit `aria-describedby`/`aria-invalid` binding. | AJ #18: preserve form behavior; review error announcements, keyboard order and focus through validation. No accessibility compliance claimed. |
| Mobile | Login hides the left panel below `lg`; shell uses native dialog; shared body minimum width is 320px. | Jhayr #20/#21 and shared #23: verify narrow widths/zoom, dialog focus/return and overflow. |
| Empty/loading/error | Login changes processing text; recent work has empty messages; shell models loading/current/unavailable/expired feed; render and HTTP error surfaces exist. | AJ #22/Jhayr #20: verify actual empty data, delayed/failed feed and session expiry; do not display simulated success. |
| Future identity UI | Google button disabled; activation informational; no supported SSO/registration interaction established here. | AJ #18: any retained styling is presentation-only; no new auth endpoints or enabled flows. |

Historical README P0 notes about notification initialization and Calendar `summary` are not proof of current defects: this source already has an empty-feed adapter and Calendar adapter. Runtime behavior remains unverified. Rich dashboard nested props, notification union handling, one-time MFA flash behavior and unavailable page targets remain integration questions in the traceability matrix.

## Next scoped task

AJ and Jhayr review this baseline and [ownership boundaries](COMPONENT_OWNERSHIP.md); Kirch retains disposition authority. The next development task is **FE-AUTH-01 [#18](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/18)**: professional, minimal, glass-inspired government login presentation, preserving the documented C02 Inertia form, validation, session/CSRF and server-controlled redirects. Its own START pair and review gates apply; it has not begun here.

## Current Accepted F01 / Postmerge Operational Addendum

**12 October 2026 (Asia/Shanghai), FE-BASE-01-PR24-CORRECTIONS.** The preceding inventory and 11/11 test result remain historical evidence for `49ba8cafd7ad14e85984466907bc573f42d1d659`; they do not describe the current integrated Task consumer. This append follows [Kirch's review](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/pull/24#issuecomment-6112663595). His review was posted 11 October UTC / 12 October locally.

| Accepted reference | Exact value / evidence |
| --- | --- |
| Frontend main, fetched at correction preflight | `e6f5947ab330802f4b860b28baddc910ca32e13e` |
| Frontend Git tree, verified with `git rev-parse` | `a7cced7c276e7a62292f08c04606f4376450aac1` |
| Backend main, fetched read-only at correction preflight | `f9291aa6fb224aefa96e771a4c68f671c4db3278` |
| Accepted native integration | [CI #38165379027](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/actions/runs/38165379027), SUCCESS on the backend SHA above; Kirch-reviewed evidence: source pins 37/37, **41 Laravel tests / 406 assertions**, actual **PostgreSQL/Chromium 12/12**. Run conclusion/head independently read back; counts attributed to the maintainer's review. |
| PR #24 at preflight | `de05358d053680459f8557759dd1414f848042b8`, base `e6f5947ab330802f4b860b28baddc910ca32e13e`; existing remote merge already included F01. Checkout fast-forwarded to it without creating a merge. |

Accepted F01 mounts `resources/js/components/tasks/PersonalTaskWorkspace.tsx` inside `resources/js/pages/Dashboard.tsx`, using `components/tasks/taskReadApi.ts` for same-origin, session-authenticated JSON `GET /tasks` and `GET /tasks/{id}`. It is an owner-isolated personal Task list/detail, separate from Work Requests at `/transactions`; absence of a standalone Task page in the old inventory does not mean no current Task consumer. Preserve pagination, native state, masked owner denial, authorization/session data clearing and stale-response cancellation.

The native CI evidence belongs only to the accepted frontend/backend tuple above. It is not a fresh PR #24 authenticated test and does not certify all four dashboard experiences, a login/MFA redesign, F02 mutations, complete A01, A02 or production. C02 Login, C03 MFA and C04 Dashboard remain **SOURCE-OBSERVED**, not individually formally released. F02 belongs to Lucien's separate #15 lane; A02 remains draft design, not a released endpoint or consumer payload. Future frontend promotion requires reviewed re-pinning of the backend's 37-blob manifest, a new exact tuple and native CI.

### Agreed traceability-file substitution

The maintained [FE-BASE-01 consumer-contract supplement](../contracts/ONE_TALIBON_FRONTEND_CONTRACT_PACK_R1/FRONTEND_CONSUMER_CONTRACTS.md#fe-base-01--working-frontend-traceability), including its dated current-state addendum, substitutes for Issue #17's originally proposed `docs/frontend-contract-matrix.md`. This implements the requested substitution acknowledged as reasonable in Kirch's review; no duplicate matrix is created. The architecture inventory and ownership map remain companion deliverables. AJ/Jhayr exact-head review and Kirch's final disposition remain pending.

### Current-source verification ledger

Executed 12 October 2026 (Asia/Shanghai) with checked-out HEAD **`ee31926963b9f7036ce48d7373424215f866d654`**, the published correction START commit. Its application, tests and dependency manifests match PR preflight `de05358d053680459f8557759dd1414f848042b8` and accepted frontend main; `git diff origin/main HEAD -- resources tests package.json package-lock.json` produced no diff. Subsequent correction edits are Markdown only. This ledger names the actual tested HEAD, not a future commit or the old 11/11 snapshot.

Environment: Windows PowerShell, Node `v22.16.0`, npm `10.9.2`, existing installed dependencies. Local command output, not hosted PR CI:

| Command / gate | Actual result | Evidence and limit |
| --- | --- | --- |
| `npm run types` | **FAIL**, exit 1 | `Missing script: "types"`; package scripts unchanged within documentation-only scope. |
| `npm run types:check` | **PASS**, exit 0 | `tsc --noEmit`, no diagnostics. |
| `npm test` | **PASS**, exit 0 | **27 tests / 27 pass / 0 fail / 0 skipped / 0 cancelled**, 28.95s; includes five real mounted React/Chromium cases using simulated Task HTTP. These do not exercise Laravel sessions, database or authorization. Node emitted experimental type-stripping warnings. |
| `npm run build` | **PASS**, exit 0 | Vite `8.3.0`, 2186 modules, 1.45s. Generated build output excluded. |
| `git diff --check` | **PASS**, exit 0 | Correction Markdown whitespace check; final committed range checked again before publication. |
| `npm ci` | **NOT RUN** | Existing dependencies; not clean-install reproducibility. |
| `npm run visual:verify`; keyboard/mobile/contrast review | **NOT RUN** | Mounted tests above are not the full visual fixture suite or responsive/accessibility acceptance. |
| New authenticated Laravel/PostgreSQL/session/CSRF/MFA/two-owner tests | **NOT RUN** | No backend assembled or exercised for this PR correction. Accepted native CI remains separately attributed above. |
| Hosted candidate CI; independent AJ/Jhayr review; Kirch disposition | **NOT RUN / PENDING** | No new approval or production acceptance claimed. |

Remaining holds: missing `types` alias recorded for owner/Kirch disposition, not repaired here; AJ/Jhayr exact-head documentation review and Kirch merge decision; C02–C04 field/runtime questions and H13/H15 beyond bounded accepted F01 remain deferred to their owned packages and FE-QA #23 at an authorized exact tuple. F02 and A02 retain separate gates. **Single NEXT:** AJ/Jhayr review the corrected PR #24 head and return it to Kirch for disposition. Issue #17 remains open. The [paired correction checkpoint](../WORK_PACKAGE_CONTINUITY.md#close-proposal--fe-base-01-pr24-corrections--2026-10-12-asiashanghai) and Issue #17 publication crosslink identify the final delivery SHA.
