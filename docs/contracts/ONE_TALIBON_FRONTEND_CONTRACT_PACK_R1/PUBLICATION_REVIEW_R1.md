# KIRION FORGE — CONTRACT-PACK-001 / Tech Lead controlled-publication review R1

**Disposition:** `FAMILY REVIEW COMPLETE / CONTROLLED DOCUMENTATION INTAKE RECOMMENDED / NO NEW CONTRACT RELEASE / NO MERGE APPROVAL`.

**Technical review and acceptance authority:** Kirch Ivan Balite (`Kirch-Nairu`). This document records source-level contract classifications, not independent runtime QA or approval of additional backend contracts. Backend evidence was pinned to `7b4ebb838982f6262b9fef65d18ba57488ebf941`. The original documentation candidate was merged via [PR #4](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/pull/4); frontend development has since advanced.

**Meaning of “publish”:** Sharing a clearly marked, immutable SHA-linked **source-observed reference** with frontend engineers is not the same as issuing a **formally released stable backend→frontend contract**. No new family receives the latter by this review. Only A01-C1 (C23) already possesses a formally released backend contract. The reference documents are available on frontend `main`, but that does not make source-observed interfaces formally released contracts.

## Publication-control codes

- `EXISTING_RELEASE_DOC`: backend contract already released; mirror its terms accurately; frontend not accepted until separately tested and approved.
- `IMPORT_REFERENCE_ONLY`: source-verified enough for reading during shell/UI import, **not** a stable agreed contract, feature authorization or verified compatible SDK.
- `RESTRICTED_REFERENCE_HOLD`: source evidence may remain in docs with warnings; do not promote operational/privacy-sensitive behavior into implementable frontend requirements.
- `EXCLUDE_FROM_COMMON`: reference/mock, parked-specialized or machine-only, never a new common frontend contract by implication.

## Each of the 24 source-identified families — controlled-publication review decision

| Family | Document disposition | Consumer use allowed now | Before formal frontend contract publication |
|---|---|---|---|
| **C01 Public portal** | `EXCLUDE_FROM_COMMON` | Treat public `PROTOTYPE SAMPLE DATA` as explicitly non-live reference only | Independent public portal approval and real data provenance |
| **C02 Login/session** | `IMPORT_REFERENCE_ONLY` | Match real guest/session login, redirects, CSRF when importing existing login UI | Authenticated browser, session/invalid-credentials and role tests on accepted frontend SHA |
| **C03 MFA/security** | `IMPORT_REFERENCE_ONLY` with sensitive-handling flag | Design against six-digit/recovery-code rules; **never log or mock live enrollment secrets/recovery codes** | Real cookie/CSRF/TOTP, recovery/expiry, cache-control and negative tests |
| **C04 Dashboard** | `IMPORT_REFERENCE_ONLY` | Shell/dashboard import; respect **role-discriminated** `systemOverview`, `officeOverview`, `executiveOverview` props | Nested serializers, per-role rendering and actor-scoped dashboard tests |
| **C05 Work Requests/My Work** | `IMPORT_REFERENCE_ONLY` | Use `/transactions` reference and queue DTO for compatibility design, not hypothetical `/my-work` API or C1 Task semantics | Transitions/policies, office boundary, 25-per-page view, poll-staleness remediation & negative tests |
| **C06 Correspondence** | `IMPORT_REFERENCE_ONLY` | Preserve Inertia workspace + redirect forms, distinct direct lifecycle JSON | Full nested schema/authorization/evidence/upload and mutation tests |
| **C07 Records** | `IMPORT_REFERENCE_ONLY` | Scoped Records catalogue projections; Travel Order **reference rows** allowed as existing aggregator output | Per-record visibility, nullable union rows, pagination and sensitive-data tests |
| **C08 Documents/archive** | `IMPORT_REFERENCE_ONLY` | Real archive mode and protected file-download flow references | Protected-file authorization, disk/path 404/403, size/data-scale and browser tests |
| **C09 Memoranda** | `IMPORT_REFERENCE_ONLY` | Current role-scoped memo surfaces, no invention of official new signing policy | Audience/role actions, nested/acknowledgement and negative tests |
| **C10 Messaging** | `RESTRICTED_REFERENCE_HOLD` | Document existing six-channel source/DTO only; **never imply private office membership/confidentiality** | LGU channel entitlement decision, source enforcement if needed, negative access tests; prevent composer draft bleed |
| **C11 Notifications** | `IMPORT_REFERENCE_ONLY` | Distinguish memo/platform/transaction union, owner-specific read/acknowledge redirects | Type-variant and owner-scope E2E/negative tests |
| **C12 Calendar** | `IMPORT_REFERENCE_ONLY` | Read-only view/date selector and event DTO; invalid query falls back, not 422 | Actor scope/nullable fields, timezone and unbounded-row performance tests |
| **C13 Employees** | `IMPORT_REFERENCE_ONLY` **directory only**; `RESTRICTED_REFERENCE_HOLD` profile | Public-to-authorized **internal** active roster 40-page reference; never import government IDs/private/HR/health context into general UI | Employee PII/HR controller field grants, privacy process approval and role tests |
| **C14 Departments** | `IMPORT_REFERENCE_ONLY` directory; `RESTRICTED_REFERENCE_HOLD` workspace | Display source-backed directory only; `Departments/Workspace` receives data while actual page withholds official workflow | LGU office workflow and data minimization/reconciliation before workspace activation |
| **C15 Administration** | `RESTRICTED_REFERENCE_HOLD` | Technical admin schema review only, not broad employee UI | SystemAdministrationAccess, admin role/identity and 25-row pagination tests |
| **C16 Audit** | `RESTRICTED_REFERENCE_HOLD` | Audit producer reference only, do not display internal events by default | Role restriction, record privacy, max-250 truncation and negative tests |
| **C17 Reports/CSV** | `RESTRICTED_REFERENCE_HOLD` | Six source report definitions/CSV technical reference; no invented KPI/official certification | Report-specific filter 422, out-of-office 403, 404 unknown report, download protection and CSV verification |
| **C18 Portal search** | `IMPORT_REFERENCE_ONLY` **partial archive activity** | Existing `archiveActivity` only; **not** an approved global/full-text search API | Confirm actual search backend and typed projection before future implementation |
| **C19 Mayor Office** | `RESTRICTED_REFERENCE_HOLD` | Read existing source DTO and MAYOR-department guards; no new municipal approval routing | Executive role+office authorization, KPI authority and negative tests |
| **C20 Travel Orders** | `EXCLUDE_FROM_COMMON` | Preserve authorized references inside C07/C08; no imported workflow | Explicit specialized program authority |
| **C21 Property** | `EXCLUDE_FROM_COMMON` | Historical/specialized source only, no new ledger UI | Explicit specialized authority; 500-row summary correctness |
| **C22 Legislation** | `EXCLUDE_FROM_COMMON` | Historical/specialized source only | Explicit legislative-process authority |
| **C23 A01-C1 individual Task** | `EXISTING_RELEASE_DOC` (**backend only**) | Study and mirror released `/tasks` same-origin JSON contract; no presumed frontend consumer | FRONTEND-REG-001 completion, bounded F01/F02 authorization, actual compatibility/negative CI/QA and Kirch acceptance |
| **C24 Machine Integration API** | `EXCLUDE_FROM_COMMON` | Machine-only source provenance; **no browser tokens** or machine credentials | Separate backend/integration-only decision, never frontend consumption |

All 24 rows above describe **current source-family** maturity. Some composite families are split by consumer/PII scope (C13/C14) without increasing the census or creating additional “released contracts.” No family except existing C23 is marked formally released.

## What may be shared with AJ and Jhayr immediately

[PR #4](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/pull/4) is merged as source-reference documentation. The frontend source is on `main`; the active compatibility candidate is [draft PR #6](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/pull/6). Neither state authorizes A01 F01/F02 implementation, new messaging privacy claims or official LGU workflows.

**Publication record:** The source-reference documentation was merged separately from operational integration. Its classifications remain non-binding until family-specific approval. Before accepting an integrated frontend, verify the current candidate SHA, actual backend compatibility, role access, privacy, tests and remaining exclusions.

## Existing frontend import lane — do not change staffing

[FRONTEND-REG-001 #1](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/1) remains open: Jhayr (`kyumw3b`) coordinates, AJ (`rynzz22`) contributes existing frontend work, and Kirch reviews. The imported React/Inertia baseline is on `main@fbf6568790009856a0285bc55ed7e8cb152add93`; [draft PR #6](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/pull/6) contains compatibility repairs with build/test CI passing. Authenticated Laravel desktop/mobile validation remains outstanding.

Required next submission: updated `docs/FRONTEND_IMPORT_REGISTER.md`, isolated scoped import branch/PR, framework and dependency conflict record, actual install/typecheck/build and authenticated browser desktop/mobile evidence, exact SHAs and missing pieces. Import only existing frontend assets with permission/provenance; **no historical PHP/routes/models/migrations**. **Frontend import does not depend on acceptance of every C02–C24 family**, but release-gated feature integrations do.

## Recorded evidence / not claimed

Review basis: [contract manifest](CONTRACT_MANIFEST.md), [source-backed producer register](BACKEND_PRODUCER_VERIFICATION.md), [exclusion list](SHOWCASE_REFERENCE_EXCLUSIONS.md), [hold register](AUTHORITY_AND_INTEGRATION_HOLDS.md), backend `main@7b4ebb838982f6262b9fef65d18ba57488ebf941`, original [A01-C1 contract](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/.forge/contracts/A01-C1-INDIVIDUAL-TASK-HTTP-CONTRACT.md), and current FRONTEND-REG issue/source register.

**NOT RUN:** PHP/DB/API integration, frontend build, Playwright/auth browser, independent Siris QA, actual AJ/Jhayr submitted import. **No merge/PR ready status, Project-v2 custom field, branch ownership or contract release was changed** by this review.
