# KIRION FORGE: CODE WRITER — S1 FINAL SHOWCASE WRITER B
## OPERATIONAL PRODUCT + SHOWCASE PERSONAS

ROLE: KIRION FORGE: CODE WRITER

LANE: B — WORK REQUEST / MEMORANDA ATTACHMENTS / CURATED OFFICE LOGINS

Human Technical Authority: Kirch Ivan Balite

## SOURCE

Start only from the exact SHA supplied by the sprint Maintainer after Gate G0.

Required base branch family:

`KIRCH-TALIBON-S1-FINAL-SHOWCASE-INTEGRATED`

Create one lane branch only:

`KIRCH-TALIBON-S1-FINAL-SHOWCASE-OPERATIONS`

No merge to `main`. No promotion. No deployment. No rebase/reset/force-push.

## GOAL

Deliver the last required product functionality for the showcase:

1. rework `/transactions/create` into a usable municipal digital routing slip;
2. add optional protected file attachments to Memoranda publish;
3. make the supplied Talibon LGU office roster available as curated loginable showcase identities without inventing a new authorization architecture.

Work aggressively, but preserve the existing workflow/document/security foundations.

## REQUIRED AUDIT FIRST

Before mutation, inspect:

- `resources/js/pages/Transactions/Create.tsx`
- `app/Http/Controllers/TransactionController.php`
- `app/Services/TransactionWorkflowService.php`
- workflow config/definitions
- `TransactionEvidenceService`
- `DocumentAttachmentService`
- Memorandum controller/service/model/views
- `config/showcase.php`
- `WorkforceDemoSeeder.php`
- ShowcaseSession / ShowcaseSessionController
- `WorkspaceDialog.tsx`
- feature tests for transactions, memoranda, showcase sessions, workforce seeding

Identify the smallest authoritative extension points. Do not create duplicate domain stacks.

## PART 1 — CREATE WORK REQUEST

### Required visible normal-employee flow

Render in this order:

1. Request Category
2. Request Type — dynamic based on Request Category
3. Action Required
4. Receiving Office
5. Assigned Person — dynamic/filter by Receiving Office
6. Priority
7. Target Completion
8. Subject
9. Description
10. Attachment
11. Submit

Keep the form compact enough for rapid showcase use.

### Required Request Category options

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

### Required Action Required options

- For Information
- For Review
- For Comment
- For Recommendation
- For Approval
- For Signature
- For Compliance
- For Appropriate Action
- For Inspection
- For Validation
- For Certification
- For Endorsement
- For Processing
- For Implementation
- For Monitoring
- For Filing / Record

### Priority

- Normal
- Priority
- Urgent
- Very Urgent / Immediate

Map safely onto existing workflow/SLA semantics. Do not break existing `normal/high/urgent` behavior without an explicit migration/compatibility plan.

### Target Completion

- Today
- Within 24 Hours
- Within 3 Days
- Within 5 Working Days
- Within 7 Working Days
- Specific Deadline

Resolve to the existing due-date/SLA field safely. Working-day behavior may be bounded to a deterministic business-day calculator if the project already has one; otherwise document the simplest reliable implementation rather than inventing a calendar subsystem.

### Dynamic Request Type requirements

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

For all other categories, provide a sensible bounded set from the product requirement or a generic fallback such as Prepare Document / Review / Endorsement / Approval / Inspection / Validation / Data Request / Report Preparation / Coordination.

### Receiving Office

Use active routable departments from the database. Preserve executive/legislative grouping where useful.

Do not hard-code a separate shadow office registry if authoritative departments already exist.

### Assigned Person

Must be optional unless existing workflow semantics require assignment.

When a Receiving Office is selected, show only active employees of that office. Server must validate that selected employee belongs to the receiving office; React filtering is not authorization.

### Attachments

Preserve existing transaction evidence behavior using `TransactionEvidenceService` / `DocumentAttachmentService`.

### Request number

Use a collision-safe format compatible with existing transaction IDs.

Preferred presentation:

`WR-YYYY-OFFICE-SEQUENCE`

Do not use raw `COUNT()+1` without a uniqueness/race strategy.

### Data model constraint

Do not explode the schema unless required.

Prefer adding explicit bounded fields only when needed for authoritative querying/presentation, such as category/action-required/request-subtype. If metadata is already a safe first-class project pattern, use it only if it remains queryable/testable and does not bypass validation.

Do not invent a new workflow engine per request subtype. Reuse current workflow definition fallback/default behavior.

## PART 2 — MEMORANDA ATTACHMENTS

Current Memorandum publish flow has no file upload field.

Add optional attachment upload to Memorandum creation.

Requirements:

- reuse `DocumentAttachmentService` and private protected storage;
- use `DocumentLink` with a relationship authorized by the attachment architecture;
- add the minimum new relationship constant/value if required;
- validate extension/content/MIME through the existing service;
- no public filesystem URL;
- publishing with zero files continues to work;
- attachment creation and memo publish should have rollback/cleanup behavior if either side fails;
- recipient/issuer download/view authorization must be checked against Memorandum visibility/authority.

UI:

- concise `Attach files` section;
- indicate optional;
- allow the same protected file types already supported by the shared document service unless the current domain requires a narrower set.

## PART 3 — CURATED LOGINABLE TALIBON OFFICE PERSONAS

The supplied office roster is the authoritative showcase persona target for this sprint.

Required office/persona coverage includes:

- Office of the Municipal Mayor
- Office of the Municipal Administrator
- Municipal Planning and Development Office
- Municipal Engineering Office
- Municipal Assessor's Office
- Municipal Budget Office
- Internal Audit Service
- Municipal Accounting Office
- Municipal Treasury Office
- Municipal Agriculture Office
- Municipal Health Office
- Municipal Social Welfare and Development Office
- Municipal Civil Registrar / Local Civil Registry
- Municipal General Services Office
- Human Resource Management Office
- Municipal Disaster Risk Reduction and Management Office
- Municipal Market Office
- Public Employment Service Office
- Municipal Environment and Natural Resources Office
- Talibon Integrated Transport Terminal Office
- Municipal Tourism Office
- Talibon Polytechnic College
- Municipal Information Office
- Municipal Population Office
- Local Economic Development and Investment Promotion Office
- Data Protection Office
- Zoning Administration
- Bids and Awards Committee
- Business Permit and Licensing Office / BPLS
- Community Tax Certificate Function
- Office of the Municipal Vice Mayor
- Sangguniang Bayan Office
- Office of the Secretary to the Sangguniang Bayan

Preserve existing dedicated System Administrator persona as an additional operational seat if it is not one of the roster offices.

### Role mapping law

Do NOT create 33 new authorization roles.

Map personas onto current role/authority semantics:

- Mayor -> mayor/executive approving authority
- department/office heads -> department_head where supported
- HRMO -> hr authority
- legislative offices -> legislative staff/appropriate existing legislative authority
- ordinary office personas -> employee
- system administration -> system_admin

Where a roster title says generic `Office Head`, use the existing office head/department-head authority only if the current authorization model supports it safely. Otherwise keep it as an employee showcase identity with the correct position title rather than broadening privileges.

### Seeder law

Keep total workforce target approximately 350.

Curated accounts replace part of the generated population; do not add 33+ on top of 350.

Passwords remain governed by the existing private `PROTOTYPE_DEMO_PASSWORD` contract. Do not commit passwords.

### Showcase selector

Update the showcase entry UI so the curated office accounts are actually selectable/loginable.

Preserve a fast presentation-friendly featured section for the primary existing roles, then provide a compact searchable/grouped office-seat list for the remaining personas.

Do not touch Login page appearance/theme unless strictly required for selector compatibility; Writer C owns light-only presentation.

## OWNED FILES

Primary expected ownership:

- `resources/js/pages/Transactions/Create.tsx`
- `app/Http/Controllers/TransactionController.php`
- transaction workflow/config/service files strictly needed by this requirement
- Memoranda create/show files and controller/service/model only as needed for attachments
- shared document relationship/query files strictly needed for Memoranda attachments
- `config/showcase.php`
- `database/seeders/WorkforceDemoSeeder.php`
- `resources/js/components/showcase/WorkspaceDialog.tsx`
- showcase persona components/types if required
- focused migrations/config/tests required by this lane

## FROZEN

DO NOT TOUCH:

- `scripts/showcase-*`
- public homepage components/CSS/config
- `resources/js/theme/*`
- `AppearanceControl.tsx`
- broad AppLayout/theme behavior
- Municipal Systems/FUT workspace architecture
- GuidedTour/tour targets
- `main`

If the requirement appears to require one of those files, STOP and report the dependency to Maintainer.

## VALIDATION

Run the most focused existing tests plus new tests for the changes.

Minimum expected:

- transaction create/store feature tests;
- invalid assigned employee from wrong office rejected;
- dynamic contract/source coverage where practical;
- request-number uniqueness/format behavior;
- transaction attachment path still works;
- Memorandum publish with no attachment;
- Memorandum publish with valid attachment;
- invalid attachment rejected;
- attachment rollback/cleanup behavior;
- recipient/issuer authorization for attachment access;
- ShowcaseSessionGateway tests updated for dynamic persona count rather than a stale hard-coded seven;
- WorkforceDemoSeeder test verifies curated accounts + total target;
- `npm run types:check`;
- `npm run build`.

Browser/manual:

- `/transactions/create` as normal employee;
- category -> request type changes;
- receiving office -> assigned person changes;
- submit valid request with file;
- new transaction detail shows correct routing/accountability;
- publish memo with file from authorized publisher;
- authorized recipient can reach attachment; unauthorized account cannot;
- primary featured persona + several new office personas log in correctly.

## RETURN

Return exactly:

BRANCH
STARTING SHA
FINAL SHA
COMMITS
EXACT CHANGED FILES

AUDIT FINDINGS
WORK REQUEST RESULT
DYNAMIC TYPE RESULT
RECEIVING OFFICE RESULT
ASSIGNED PERSON RESULT
REQUEST NUMBER RESULT
TRANSACTION ATTACHMENT REGRESSION RESULT
MEMORANDA ATTACHMENT RESULT
ATTACHMENT AUTHORIZATION RESULT
CURATED PERSONA COUNT
TOTAL SEEDED WORKFORCE
PERSONA SELECTOR RESULT

PHP TESTS
TYPECHECK
BUILD
BROWSER/MANUAL RESULT
KNOWN LIMITATIONS

NO MAIN MUTATION
NO MERGE
NO PROMOTION
NO DEPLOYMENT

STOP.