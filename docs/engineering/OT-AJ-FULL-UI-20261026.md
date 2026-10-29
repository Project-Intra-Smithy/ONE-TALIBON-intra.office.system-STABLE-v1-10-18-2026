# Full application UI refinement — scope proposal
Mission: OT-AJ-FULL-UI-20261026. Owner: AJ Rienze (azinamouto), Codex-assisted. Kirch retains acceptance.
Status: PREPARED / SYNC_REQUIRED / HOLD. No application implementation or acceptance claimed.

## Verified source, 26 October 2026
Repository: Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026.
Base: candidate/r8a-r13-w02-w03-integration-preflight-r1 at 04e188422bbbcb97a13a25426fab8c5d9ae13c4c.
Main: 923e19f81692b816c9156475d94020d6ae76f6a6.
New isolated branch: feat/aj-full-ui-refinement-20261026.
PR10 navigation: 4ed17f41aac484bb5d08fbf65666091b699cf0a8.
PR15 combined UI: 7bd125e771f21542c4f05e31ee0a70751e399dce; same integration base.
These are source observations, not runtime or acceptance evidence. Existing worktrees and contributor branches remain untouched.

## Existing components and observed refinement opportunities
Reuse PageFrame (including comfortable density), PageHeader, portal/StatusBadge, PortalSearchField, ProgressiveFilterBar, WorkspaceUnavailable and existing form/evidence components.
Dashboard currently composes R7UpperRegion with compact RecentWorkList, ActivityRail and MetricGroup in one upper grid; lower region includes existing Tasks/documents/actions. Reorganize into wide sections without discarding data.
Calendar already declares month/week/day/schedule, server range and timezone metadata. Preserve these and existing router/form behavior.
Document Center already has Records/Files modes, server filters, pagination, selection, DocumentRegister, DocumentArchive and DocumentMetadataPanel. Refine those consumers; do not invent folder hierarchy, bulk operations, upload permission or inline PDF delivery.

## Design contract
White and light-gray surfaces; forest-green primary actions; subtle translucent surfaces with opaque fallbacks; restrained shadows and radii. Dark surfaces must retain readable contrast.
Default body text 16px with comfortable line height; secondary labels normally at least 14px. Titles, descriptions, statuses and dates occupy distinct rows or aligned label/value groups.
Wide information sections, 24–32px desktop padding and comfortable mobile gutters; no repeated nested cards. Preserve all useful data.
Minimum 44px interactive targets, visible focus, keyboard reachability, 150–250ms transitions and reduced-motion override. No decorative gradients or placeholder metrics.

## Sequential page-level batches and proposed paths
All paths below are relative to resources/js unless stated otherwise. Scope is presentation only, subject to the overlap approvals below.

| Batch | Actual pages | Change and reuse |
| --- | --- | --- |
| 1 | pages/Dashboard.tsx; components/dashboard/** | Put role-appropriate summaries first, full-width readable count charts and activity/work sections; retain every server metric, task and authorized action. Reuse MetricGroup, RecentWorkList, ActivityRail and R7 regions. |
| 2 | pages/Calendar/Index.tsx | Clear toolbar and period heading, readable existing month/week/day/schedule views, event blocks and details, mobile scheduling flow; preserve timezone, range queries and existing mutations. |
| 3 | pages/Documents/Index.tsx; components/documents/DocumentArchive.tsx, DocumentRegister.tsx, DocumentMetadataPanel.tsx, DocumentCollectionNav.tsx | Drive-inspired list hierarchy, icons, metadata columns, selection/focus and contextual actions. Existing Records/Files filters and downloads remain authoritative. Breadcrumbs only for actual hierarchy. |
| 4 | pages/Transactions/{Index,Create,Show}.tsx; pages/Correspondence/{Index,Show}.tsx | Wide lists, aligned metadata, separate descriptions, clear forms/actions/timelines and evidence. Preserve action availability and submissions. |
| 5 | pages/Memoranda/{Index,Create,Show}.tsx; pages/TravelOrders/{Index,Create,Show}.tsx; pages/Records/Index.tsx | Consistent list/detail/form hierarchy, statuses, error placement and primary actions; preserve acknowledgment and approval behavior. |
| 6 | pages/Departments/{Index,Workspace}.tsx; pages/Employees/{Index,Show,DirectoryProfile}.tsx | Comfortable directory rows and readable profiles/office sections; preserve server-provided fields and visibility. |
| 7 | pages/Search/Index.tsx; pages/Announcements/Index.tsx; pages/Meetings/Index.tsx; pages/Messages/Index.tsx | Readable result/message/event lists, metadata and existing controls. No membership or messaging-policy changes. |
| 8 | pages/Plans/Index.tsx; pages/PPAs/Index.tsx; pages/ProjectMonitoring/Index.tsx; pages/Reports/Index.tsx | Spacious existing references/tables/charts; distinguish data from descriptions; retain existing unavailable states. No fabricated PDFs, plan approval or metrics. |
| 9 | pages/Legislation/{Index,Create,Show,Workspace}.tsx; pages/LocalBodies/Index.tsx; pages/Property/{Index,Lifecycle}.tsx | Refine existing authorized forms, lists and details only; do not activate dormant workflows. |
| 10 | pages/Admin/Index.tsx; pages/Audit/Index.tsx; pages/Operations/Index.tsx; pages/MunicipalSystems/Index.tsx; pages/MayorOffice.tsx | Readable existing administration/oversight panels, filters, statuses and tables. Privileged capabilities remain unchanged. |
| 11 | pages/Hris/{Dashboard,Admin,Attendance,Dtr,Payroll,Development,HealthAccess,HealthVault}.tsx; pages/Hris/{Lifecycle,Offboarding}/{Index,Show}.tsx | Presentation-only review after explicit privileged-page scope approval; no new personnel fields, health exposure or actions. |
| 12 | pages/Auth/{Login,ActivateAccount,MfaChallenge,MfaEnrollment,MfaRecoveryCodes,MfaSettings}.tsx; pages/Errors/{403,Status}.tsx; pages/Public/Home.tsx | Final consistency pass only after separate auth/public ownership clearance. Preserve authentication/MFA processing, secret handling and public boundary. |

Shared candidates: components/PageFrame.tsx, PageHeader.tsx, portal/StatusBadge.tsx, PortalSearchField.tsx and new page-scoped CSS only where justified by repeated usage. No shell-wide reset. Exact additions to each batch must be listed before editing.
Existing sidebar/mobile bottom navigation, AppLayout and navigation catalog are read-only for this mission unless separately approved.

## Explicit collision proposal — approval required before code
1. Dashboard: PR15 already changes pages/Dashboard.tsx, components/dashboard/DashboardHeader.tsx, components/dashboard/r7/lower/R7TaskPanel.tsx and dashboard CSS. Approve reconciliation of these paths on this new branch, preserving contributor attribution, or designate another boundary.
2. Document Center: Hub136 owns Documents/Index and document components; PR15 also changes Documents/Index and DocumentArchive. Approve presentation-only reconciliation on this new branch. Do not copy whole branches or overwrite writer commits.
3. Shared CSS: PR10/Hub148 and PR15 modify resources/css/workspace-refinement.css, AppLayout and sidebar. Keep all three read-only; prefer new page-scoped stylesheet imports. Any shared header/component change needs consumer regression coverage.
4. Tasks: PR15 changes PersonalTaskWorkspace and PersonalTaskMutationPanel. Keep these read-only initially; only adjust surrounding layout. Any required internal edit gets its own explicit approval.
5. HRIS, Auth and public screens require scoped ownership approval before their later batches.

## Verification and delivery
For each implemented batch: git diff --check, npm run types:check, npm run test:contracts, npm run test:ux and npm run build as applicable; preserve behavioral assertions and investigate baseline failures.
Browser matrix: 390/768/1024/1280/1440px, light/dark, four authorized synthetic roles where relevant. Capture before/after at each width and mode, include long titles/metadata, empty/loading/error states, reduced motion, keyboard navigation, dialogs and focus return; assert no viewport overflow and touch-target sizes. Review rendered screenshots, contrast and clipping.
Synthetic harnesses must be labeled as such. Authenticated Laravel/session/CSRF/MFA/real role/download acceptance requires an approved disposable runtime; never substitute fixture results.
Record exact command exits, candidate SHA, changed files, screenshots and NOT_RUN gates in each batch and paired final CLOSE. No backend/database/package/route edits, merge, deployment, force push or change to another worktree.

## START synchronization and single next action
The repository protocol requires the register entry on canonical main before execution. New-branch publication is a proposal, not START_SYNCED.
NEXT: AJ/Kirch approves the collision scope above and Maintainer synchronizes the START entry onto canonical main, then crosslinks the canonical memory SHA on the owning issue. Reverify base/PR drift before batch 1.
