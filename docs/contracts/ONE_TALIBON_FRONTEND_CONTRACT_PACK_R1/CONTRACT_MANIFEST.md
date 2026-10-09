# Contract manifest — source-identified, not blanket release
**Pin:** backend `7b4ebb838982f6262b9fef65d18ba57488ebf941`; frontend base `bab1f4563b903d7d9810590cd0e3ce6628db8611`. Classification authority belongs to Kirch.

## Census method and reconciliation
This **24-entry grouped trace register** accounts for 22 named browser-route producer/consumer families plus 2 backend-only families. It groups multiple endpoints by a coherent consumer/domain and does not count TypeScript shapes as published APIs. The grouping explicitly names families; it does **not** independently certify a one-to-one match against the 24 labels in earlier audit #38, nor mean 24 contract releases. Separately, purely static Inertia route shells (`/procurement`, `/municipal-systems`, `/development-plans`, `/ppas`, `/meetings`, `/announcements`, `/local-special-bodies`, `/operations`) are documented as **exclusions/holds**, not counted as new business API releases.

**Formal released backend contract documents: 1:** [A01-C1-INDIVIDUAL-TASK-HTTP-CONTRACT.md](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/.forge/contracts/A01-C1-INDIVIDUAL-TASK-HTTP-CONTRACT.md). This releases only personal Tasks at the producer; frontend consumption is gated. All other families below are source-observed or excluded until independently accepted.

| ID | Family | Route surface | Producer → consumer | Technical class | Eligibility |
|---|---|---|---|---|---|
| C01 | Public portal | GET / | PublicPortalController → Public/Home | `PRESENTATION_STATIC_REFERENCE` | `EXCLUDE` |
| C02 | Login / session | GET,POST /login; POST /logout | AuthenticatedSessionController → Auth/Login | `CURRENT_COMMON_OPERATIONAL` | `SOURCE-OBSERVED` |
| C03 | MFA / security | GET,POST /security/mfa/*; DELETE /security/mfa | Mfa* controllers → Auth/Mfa* | `CURRENT_COMMON_OPERATIONAL` | `SOURCE-OBSERVED` |
| C04 | Dashboard | GET /dashboard | DashboardController / DashboardWorkspaceQuery → Dashboard | `CURRENT_COMMON_OPERATIONAL` | `SOURCE-OBSERVED` |
| C05 | Work Requests / current My Work | GET,POST /transactions; GET /transactions/{id}, /live; POST /transition | TransactionController / WorkQueueQuery → Transactions/* | `CURRENT_COMMON_OPERATIONAL` | `SOURCE-OBSERVED` |
| C06 | Correspondence | GET /correspondence, /{id}, /{id}/workspace; POST /{id}/{action} and /workspace/{action} | Correspondence* controllers → Correspondence/* | `CURRENT_COMMON_OPERATIONAL` | `SOURCE-OBSERVED` |
| C07 | Records | GET /records | RecordsController / RecordsSearchQuery → Records/Index | `CURRENT_COMMON_OPERATIONAL` | `SOURCE-OBSERVED` |
| C08 | Documents and archive | GET /documents; GET /documents/{id}/download | DocumentCenterController / DocumentArchiveQuery → Documents/Index | `CURRENT_COMMON_OPERATIONAL` | `SOURCE-OBSERVED` |
| C09 | Memoranda | GET /memoranda, /create, /{id}; POST /memoranda, /{id}/acknowledge | MemorandumController → Memoranda/* | `CURRENT_COMMON_OPERATIONAL` | `SOURCE-OBSERVED` |
| C10 | Messaging | GET /messages, /messages/feed; POST /messages/feed | ListMessagesController / StoreMessageController → Messages/Index | `CURRENT_COMMON_OPERATIONAL` | `SOURCE-OBSERVED` |
| C11 | Notifications | GET /notifications/feed; POST /notifications/{id}/read, /acknowledge | NotificationFeedController / PlatformNotificationController → AppLayout | `CURRENT_COMMON_OPERATIONAL` | `SOURCE-OBSERVED` |
| C12 | Calendar | GET /calendar | CalendarController / CalendarWorkspaceQueryService → Calendar/Index | `CURRENT_COMMON_OPERATIONAL` | `SOURCE-OBSERVED` |
| C13 | Employee directory/profile | GET /employees, /employees/{id} | EmployeeDirectoryController / EmployeeProfileController → Employees/* | `IMPLEMENTED_NOT_RELEASED` | `REVIEW-PII-PROFILE` |
| C14 | Department directory/workspace | GET /departments | DepartmentController → Departments/Index or authority-pending Workspace | `UNKNOWN_CONTRADICTORY` | `SPLIT-DIRECTORY-FROM-WORKFLOW` |
| C15 | System administration | GET /admin | AdminDashboardController / registry → Admin/Index | `IMPLEMENTED_NOT_RELEASED` | `ROLE-SCOPED-REVIEW` |
| C16 | Audit | GET /audit | AuditController → Audit/Index | `IMPLEMENTED_NOT_RELEASED` | `ROLE-SCOPED-REVIEW` |
| C17 | Reports | GET /reports; GET /reports/export/{report} | ReportsController → Reports/Index, native export | `IMPLEMENTED_NOT_RELEASED` | `ROLE-SCOPED-REVIEW` |
| C18 | Portal search | GET /portal-search | PortalSearchController / DocumentArchiveQuery → Search/Index | `IMPLEMENTED_NOT_RELEASED` | `PARTIAL-SEARCH` |
| C19 | Mayor office | GET /mayor-office; GET /mayor-office/live | MayorOfficeController / MayorOfficeLiveController → MayorOffice | `IMPLEMENTED_NOT_RELEASED` | `ROLE-SCOPED-REVIEW` |
| C20 | Travel orders | GET /travel-orders/*; POST /travel-orders, /{id}/status | TravelOrderController → TravelOrders/* | `PARKED_SPECIALIZED_OR_ORPHANED` | `EXCLUDE-COMMON` |
| C21 | Property | GET /property, /property/lifecycle; POST property/lifecycle actions | PropertyController / PropertyLifecycleController → Property/* | `PARKED_SPECIALIZED_OR_ORPHANED` | `EXCLUDE-COMMON` |
| C22 | Legislation | GET /legislation/*, /legislative-workspace; POST mutations | LegislativeRecordController / LegislativeWorkspaceController → Legislation/* | `PARKED_SPECIALIZED_OR_ORPHANED` | `EXCLUDE-COMMON` |
| C23 | Personal Task A01-C1 | GET,POST /tasks; GET /tasks/{id}; POST /tasks/{id}/start, /complete | IndividualTaskController → no accepted frontend consumer | `IMPLEMENTED_NOT_RELEASED` | `BACKEND-RELEASED; FRONTEND-PENDING` |
| C24 | Integration API | /api/v1 integration/self, proof-writes, correspondence | Integration controllers → machine clients; no browser consumer | `MACHINE_ONLY` | `NEVER-BROWSER` |

## Cross-layer field and trust characteristics
- **Inertia/browser props:** Laravel controllers are the producer, not independent `/api/v1` JSON. The Inertia protocol and full page props must be version-pinned; shared auth, navigation and flash fields are typed in [resources/js/types.ts](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/resources/js/types.ts).
- **GET JSON:** Only specifically routed JSON helpers are supported (examples: `/messages/feed`, `/notifications/feed`, `/transactions/{id}/live`, `/mayor-office/live`, A01 `/tasks`); do not convert every Inertia page into guessed REST endpoints.
- **Mutating browser forms:** same-origin Laravel session/CSRF and existing FormRequest policies; errors can be 403, 404, 419, 422, with framework/Inertia or JSON negotiation depending on route. Do not prescribe a uniform JSON shape for all families.
- **Nullability:** [types.ts](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/resources/js/types.ts) expresses optional employee, department, notification and memo fields. Query presenters define further domain-specific nullable fields; do not mark uninspected fields required.
- **Authority:** [PortalNavigationAccess](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/app/Services/PortalNavigationAccess.php) controls navigation discovery only; endpoint-level policies and controller guards remain independent enforcement.
- **A01-C1:** authentic browser session, strict JSON envelope, owner-only private Task IDs masked as 404; `MFA_REQUIRED` JSON from [RequireMfaAssurance](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/app/Http/Middleware/RequireMfaAssurance.php); never treat the `/api/v1` integration credential as browser auth.
- **One source family ≠ one release:** `IMPLEMENTED_NOT_RELEASED` means source exists, *not* accepted frontend contract. `CURRENT_COMMON_OPERATIONAL` reflects accepted shared-core product history, *not* contract-pack publication.

## Internal consumer conventions — nine, not extra HTTP contracts
1. Shared Inertia `SharedProps` and auth identity.
2. Navigation registry and readiness labels.
3. Dashboard workspace projection.
4. Work Queue / My Work projection.
5. Document Center/Archive projection.
6. Calendar workspace projection.
7. Messaging feed DTO and channel presentation.
8. Notifications ledger/refresh convention.
9. Return-navigation context and post-action redirects.

Older `/messages/prototype/messages`, `showcase` procurement prop, and `featuredLogins` directory field are superseded histories; do not implement them.

## Unresolved
Exact field-level schemas for many rich Inertia projections, LGU classification rules, PII sharing, per-domain write authorization, official specialized workflows, and clean test results for the exact frontend tuple remain **NOT FULLY VERIFIED**. Do not copy inferred shapes into a generated typed SDK. See module instructions and [holds](AUTHORITY_AND_INTEGRATION_HOLDS.md).
