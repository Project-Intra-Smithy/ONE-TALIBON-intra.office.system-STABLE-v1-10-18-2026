# KIRION FORGE — S1 FINAL SHOWCASE FORGE SPRINT

Date: 2026-09-30

Human Technical Authority: Kirch Ivan Balite

Showcase target: 2026-09-30 15:00 +08

This directive governs the rush completion sprint for the Talibon Intra-Office Portal. It supersedes earlier partial scheduling for this bounded sprint only. It does not promote, merge, or deploy `main`.

## 1. Live verified starting state

Live Git was re-verified before this sprint was opened.

- `main` = `9b5193e3502afded5f967f412b2a1d452e433bc0`
- accepted backend baseline = `314b6661b34d4a70272d2a079f7cdda238b522ae`
- S1 integrated presentation candidate = `7d7923ba83948aa1d0a8054854d9c12f74c5ab30`
- Welcome/Credits = `798ba88d545d3d016689686904063f97c2616929`
- showcase runtime implementation = `3c12eadbda652ea7ab50047a68509fb1fb348a22`
- runtime branch plus execution-plan documentation = `543419125187369e13b8fcfd2d0393ffe14a4497`
- AJ/Kikiam public-homepage donor = `f89996823cb7e6bb5f188897586682a0dd141b52`
- dark-mode-removal donor = `4539302043b035e51fa068da2adb3963f191314f`

The current trusted S1 work spine is:

`314b6661...` -> S1 UI/FUT work -> `7d7923ba...` -> `798ba88d...` -> `3c12eadb...` -> `543419125...`

The exact `7d7923ba... -> 798ba88d...` delta is one Welcome/Credits commit touching only `WelcomeWizard.tsx` and `tourCatalog.ts`. The `798ba88d... -> 543419125...` delta is two commits: the seven runtime scripts plus repository planning documentation.

`main` has continued independently. Do NOT merge `main` wholesale. The Maintainer must audit main-only history and selectively adopt only proven required payload. The accepted backend baseline `314b6661...` is already present in the S1 spine, so backend work must not be re-imported blindly.

## 2. Sprint objective

Deliver one clean, integrated, locally runnable showcase candidate that is:

- fast enough for approximately 30 light concurrent stakeholder sessions;
- deterministic to start, stop, inspect, and recover on the Windows showcase host;
- product-complete for the new Work Request requirement;
- able to attach protected files to Memoranda;
- able to expose curated loginable office personas for the supplied Talibon LGU office roster;
- using the approved public-homepage visual donor without importing stale/unsupported claims;
- light-only for the showcase without importing the broad `EliminateDarkMode` branch wholesale;
- consistently worded as `ONE TALIBON`, `Talibon Intra-Office Portal`, `Municipality of Talibon, Bohol`;
- validated by real build/runtime evidence before freeze.

## 3. Parallelism law

Maximum active Code Writers: **3**.

The Maintainer is coordination/integration authority and is not counted as a Code Writer.

Each writer:

- starts from the exact sprint integration base SHA supplied by Maintainer;
- owns an explicit file/domain boundary;
- creates one lane branch only;
- does not merge another writer;
- does not mutate `main`;
- does not rebase/reset/force-push shared branches;
- stops on unexpected overlap or architectural contradiction;
- returns exact SHA, commits, changed files, tests, runtime evidence, and limitations.

## 4. Priority ranking

### MAJOR — cannot be cut

1. Runtime/deployment hardening validation and blocker repairs.
2. Create Work Request rework at `/transactions/create`.
3. Curated loginable office personas for the supplied Talibon LGU office roster.
4. Final integration onto one exact candidate SHA.
5. Production build/typecheck and Laravel boot verification.
6. Real Windows multi-worker runtime rehearsal.
7. Authenticated multi-session load rehearsal with zero 5xx/timeouts/auth failures.
8. LAN access and restart/recovery rehearsal.

### MEDIUM — required unless a directly observed P0 blocker consumes the remaining window

1. Memorandum file attachments using existing protected document architecture.
2. Selective AJ/Kikiam public-homepage transplant.
3. Light-only showcase presentation.
4. LGU/municipal wording normalization.
5. Dynamic Work Request type menus for Planning, Zoning/Land Use, Procurement, and ICT/Digital Systems.
6. Assigned Person filtered by Receiving Office.

### LIGHT — cut first if time pressure threatens major gates

1. Extra Work Request helper copy and decorative grouping.
2. Decorative homepage refinement beyond the donor's core composition.
3. Cosmetic request-number presentation beyond a collision-safe format.
4. Non-blocking responsive polish unrelated to the desktop/LAN showcase path.
5. CMS/logo administration work unless it is already complete and independently safe.
6. CI/CD changes.

## 5. Product requirements

### 5.1 Create Work Request

Normal employee form should present, in this order:

1. Request Category
2. Request Type — dynamic by category
3. Action Required
4. Receiving Office
5. Assigned Person — dynamic/filter by Receiving Office
6. Priority
7. Target Completion / deadline
8. Subject
9. Description
10. Attachment
11. Submit

Automatically derive/request from authenticated context where possible:

- Request No.
- Requesting Office
- Requesting Employee
- Date/Time
- Status
- Routing history
- Turnaround time

Required category coverage includes:

- Document / Communication
- Planning & Development
- Zoning / Land Use
- Engineering / Infrastructure
- Procurement
- Budget / Finance
- HR / Personnel
- General Services / Logistics
- ICT / Digital Systems
- Project Monitoring
- Inspection / Field Validation
- Permits / Clearances
- Legal / Sanggunian Action
- Meetings / Events
- Data / Research / Reports
- Economic Enterprise
- Environment / DRRM
- Agriculture / Fisheries
- Tourism / Investment Promotion
- Other

Required dynamic subtype examples:

Planning & Development:
- CLUP / Zoning
- CDP
- LDIP
- AIP
- Project Proposal
- Project Monitoring
- GIS / Mapping
- CBMS / Data
- Local Special Bodies
- Technical Review
- Development Permit
- Planning Certification

Zoning / Land Use:
- Locational Clearance
- Zoning Certification
- Development Permit
- Reclassification
- Rezoning
- Variance / Exception
- Site Inspection
- Land Use Verification
- Subdivision / Memorial Park Review
- Quarry / Special Land Use Review

Procurement:
- Purchase Request
- PPMP
- APP
- RFQ
- Purchase Order
- Delivery
- Inspection & Acceptance
- Payment Processing
- Procurement Status Follow-up

ICT / Digital Systems:
- Technical Support
- User Account
- Password Reset
- System Access
- Portal Issue
- Website Update
- Network / Internet
- Hardware
- Software
- Data Backup
- Dashboard Request
- System Enhancement

Do not create a separate workflow engine for every subtype. Reuse the existing transaction workflow boundary and default workflow behavior unless a current specialized type is explicitly required.

Preferred request-number presentation:

`WR-YYYY-OFFICE-SEQUENCE`

Use a collision-safe source such as the persisted transaction ID rather than `COUNT()+1`.

### 5.2 Memoranda attachment

Add optional protected attachments to Memorandum publish.

Reuse the existing `DocumentAttachmentService` / `Document` / `DocumentLink` architecture and its private-storage, content/MIME validation, checksum, and authorization model. Do not create a public upload directory or duplicate document stack.

### 5.3 Curated office logins

Create curated loginable showcase identities for the supplied Talibon office roster while preserving the existing authorization model. Do not invent dozens of new authorization roles.

Map office personas onto existing authority classes such as:

- Mayor / executive approving authority;
- department head;
- HR authority;
- legislative staff;
- employee;
- system administrator.

Keep the synthetic workforce target approximately 350 total by carving curated accounts out of the existing generated population rather than adding another population on top.

### 5.4 Public homepage donor

Use `AJ-TALIBON-PUBLIC-HOMEPAGE-GREEN-REFINEMENT@f89996823cb7e6bb5f188897586682a0dd141b52` as a **design donor**, not a merge target.

Required:

- transplant the strong public-homepage composition and local assets selectively;
- preserve secure Employee Login path;
- preserve public/internal data boundaries;
- normalize product naming;
- remove unsupported HRIS/leave/attendance claims or any statement implying unimplemented live functionality;
- do not overwrite current authenticated dashboard/workspace architecture.

### 5.5 Light-only showcase

Use `EliminateDarkMode@4539302043b035e51fa068da2adb3963f191314f` only as intent/reference.

Do NOT merge or cherry-pick the branch wholesale.

Implement a bounded light-only policy:

- resolve appearance to light;
- remove/hide appearance controls for the showcase path;
- never apply `.dark` to the root in showcase use;
- dormant `dark:` classes may remain if they cannot activate;
- avoid broad component-by-component theme rewrites.

## 6. Writer lanes

### Writer A — Runtime / Deployment

Own only:

- `scripts/showcase-*.ps1`
- `scripts/showcase-*.mjs`
- bounded runtime documentation/tests directly required by these scripts

Tasks:

- audit current seven-script runtime implementation;
- fix forwarded-protocol handling for LAN + Cloudflare;
- make APP_URL/public-origin behavior explicit/safe with cached config;
- preserve runtime state when recorded live processes cannot safely be stopped;
- strengthen authenticated load/rehearsal tooling without coupling to product code;
- run Windows validation on the showcase host when available;
- verify prepare/start/status/load/stop/restart.

Forbidden:

- transaction/business logic;
- Memoranda;
- persona config/seeder;
- homepage/theme/product wording.

### Writer B — Operational Product + Showcase Personas

Own:

- Work Request transaction create/store domain
- Memoranda publish attachment integration
- `config/showcase.php`
- `database/seeders/WorkforceDemoSeeder.php`
- showcase persona selection UI/components
- directly related migrations/config/tests only when unavoidable

Tasks:

- rework `/transactions/create` to the required municipal routing-slip model;
- centralize category/type/action/deadline option contracts;
- receiving-office -> assigned-person dynamic filtering;
- preserve existing protected Work Request evidence;
- add protected Memorandum attachments;
- add curated loginable office personas from the supplied roster;
- preserve total workforce target and existing authority semantics;
- provide focused feature tests.

Forbidden:

- runtime scripts;
- public homepage;
- broad theme/dark-mode rewrites;
- FUT workspace architecture.

### Writer C — Public Presentation / Light-Only / LGU Wording

Own:

- public homepage components/CSS/config/assets needed for selective transplant;
- bounded appearance/theme controls needed for light-only behavior;
- login/public/shell branding copy needed for current product language;
- focused visual/source tests for this lane

Tasks:

- selectively transplant AJ/Kikiam donor homepage;
- remove unsupported/stale claims;
- preserve authenticated app behavior;
- implement bounded light-only policy without wholesale donor merge;
- normalize LGU/product wording.

Forbidden:

- runtime scripts;
- transaction/Work Request backend;
- Memoranda backend;
- showcase persona config/seeder/WorkspaceDialog;
- FUT workspace architecture.

## 7. Maintainer audit before writers mutate

The sprint Maintainer must begin read-only.

Required history audit:

1. Re-resolve all live refs listed in section 1.
2. Trace `314b6661...` through the S1 spine to `543419125...`.
3. Confirm exact deltas for `7d7923ba... -> 798ba88d... -> 3c12eadb... -> 543419125...`.
4. Inspect current `main@9b5193e...` since the accepted backend baseline and classify main-only commits as:
   - already represented in the S1 spine;
   - required selective transplant;
   - unrelated/deferred;
   - conflicting/rejected.
5. Confirm B1 Records query consolidation/backend baseline is already inherited; do not re-import it blindly.
6. Inspect donor branches only as donors.
7. Confirm no untracked/unknown candidate has superseded the above refs.
8. Record the audit result in `.forge/evidence/maintainer/` before accepting writer output.

## 8. Clean integration branch

Target integration branch:

`KIRCH-TALIBON-S1-FINAL-SHOWCASE-INTEGRATED`

The branch must start from the exact audited sprint base and contain no wholesale merge from `main`, AJ donor, or `EliminateDarkMode`.

Integration order after writers return:

1. Writer A runtime payload.
2. Writer B operational product/persona payload.
3. Writer C presentation/light payload.

The Maintainer must inspect changed-path overlap before each integration. Unexpected overlap = STOP and review; do not invent conflict resolution.

## 9. Integration gates

### Gate G0 — Audit / base lock

Required:

- exact live refs recorded;
- ancestry/history classification recorded;
- clean integration base SHA locked;
- three writer lane bases issued from the same exact SHA;
- no main mutation.

### Gate G1 — Writer returns

Each writer returns:

- branch;
- starting SHA;
- final SHA;
- commits;
- exact changed files;
- tests executed;
- runtime/browser evidence where applicable;
- known limitations.

Maintainer verifies no unauthorized path overlap.

### Gate G2 — Source integration

On final integration branch:

- `npm run types:check`
- clean `npm run build`
- `php artisan optimize:clear`
- `php artisan optimize`
- focused feature tests for Work Request, Memoranda attachments, showcase persona/session gateway
- verify all migrations are non-destructive and target correct database only

### Gate G3 — Data/runtime

On Windows showcase machine:

- database exactly `talibon_showcase_s1`;
- seed/readiness creates curated office accounts while maintaining expected workforce scale;
- `scripts/showcase-prepare.ps1` PASS;
- `scripts/showcase-start.ps1 -Workers 4 -Port 18000` PASS;
- all worker `/up` checks PASS;
- proxy `/up` PASS;
- LAN URL reachable from another device;
- `scripts/showcase-status.ps1` HEALTHY.

### Gate G4 — Real showcase load

Run approximately 30 independent authenticated sessions/accounts.

Exercise at minimum:

- login/persona entry;
- dashboard;
- Work Queue;
- create/view Work Request;
- Memoranda list/detail and at least one publish/attachment path with authorized account;
- Municipal Systems;
- public homepage;
- notification/feed background behavior.

Hard failure criteria:

- any unexpected 5xx;
- any timeout;
- unexpected authentication/session failure;
- worker/proxy crash;
- corrupted or cross-session identity state.

Latency target:

- preferred p95 < 1.5 s;
- acceptable ceiling < 3 s for the bounded showcase rehearsal.

### Gate G5 — Recovery / freeze

Prove once:

1. stop runtime;
2. start runtime;
3. status healthy;
4. login;
5. dashboard;
6. Work Request page;
7. homepage;
8. LAN access.

Record:

- final SHA;
- DB name;
- worker count;
- proxy/public port;
- LAN URL;
- startup/stop/status commands;
- demo credential handling location;
- recovery steps.

Then freeze code. No more feature work except a demonstrated showcase blocker.

## 10. Explicit deferrals

Do not spend this sprint on:

- repo-wide mobile redesign;
- CI/CD redesign;
- Redis/cache architecture;
- queue-worker architecture;
- broad backend refactors;
- schema redesign unrelated to required product fields;
- new municipal modules;
- broad System Administration authority redesign;
- logo CMS unless already independently complete and risk-free;
- speculative optimization;
- production hosting claims.

## 11. Final deliverable

One exact SHA on:

`KIRCH-TALIBON-S1-FINAL-SHOWCASE-INTEGRATED`

with:

- accepted S1 presentation work;
- Welcome/Credits;
- hardened showcase runtime;
- Work Request product requirement;
- Memoranda attachments;
- curated office logins;
- selective donor homepage;
- bounded light-only policy;
- LGU wording;
- build/test evidence;
- Windows runtime evidence;
- authenticated load evidence;
- recovery evidence.

No merge to `main` and no deployment unless explicitly ordered by the Human Technical Authority after this sprint candidate is proven.