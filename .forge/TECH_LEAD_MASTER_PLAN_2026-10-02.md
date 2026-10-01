# KIRION FORGE — TECH LEAD MASTER PLAN

Date: 2026-10-02

Technical Authority: Kirch Ivan Balite

Program branch: `KIRION-INTRA-REAL-SYSTEM-TRANSITION`

Accepted product baseline: `main@269975e1c1e61bcde78490530e5cc8e90f35ae47`

Security/reference baseline: `Kirch-Nairu/Talibon-Intra-Office-Portal@a7d7be17feb435b50c52cacd063e11d92ad047e1`

Corpus basis: `Kirch-Nairu/Data-001-Dump`, registered evidence DUMP-0001 through DUMP-0026 plus derived master-assurance synthesis and coverage audit.

Status: `STAGED / PROGRAM GOVERNANCE ONLY / PRODUCT CODE STILL FROZEN UNDER R0`

This plan is subordinate to the active transition SSOT and directives already staged on this branch. It does not erase showcase history, accepted evidence, or accepted main. It turns the collected evidence into one technical-lead operating plan for the real-system transition.

---

# 1. Mission

Build ONE TALIBON INTRA as the Municipality of Talibon's secure internal digital operating environment for municipal work.

The system must make municipal responsibility visible without collapsing distinct administrative meanings.

For authorized users, the product must answer:

1. What work exists?
2. Who owns it now?
3. Which office currently has it?
4. How long has it been there?
5. What must happen next?
6. What happened before?
7. What evidence/documents belong to it?
8. When is it due or overdue?
9. What closes it?
10. Can it be retrieved later as institutional evidence?

The product is not a public website, a Google Drive clone, a chat app, a Mayor-only router, a file upload portal, or thirty separate department applications.

---

# 2. Governing architecture laws

## 2.1 Domain meanings stay separate

Do not collapse these domains into one generic activity table:

- Task — delegated work that may stay entirely inside one office.
- Work Request / Workflow Transaction — formal routed work, primarily inter-office.
- Correspondence — official transmitted communication that may create/link work.
- Document — a reusable artifact linked to operational/institutional objects.
- Record — retained institutional evidence; not every file is automatically a formal record.
- Message — lightweight coordination, not the accountability engine.
- Memorandum — official issuance/instruction/information with audience/acknowledgement semantics.
- Announcement / Advisory — organizational information distribution.
- Meeting — official coordinated activity owning agenda, participants, minutes, decisions, and action items.
- Calendar Event — cross-domain time projection.
- PPA / Project / Plan — planning and management objects with specialized meaning.

## 2.2 Organizational hierarchy is not transaction routing

Ordinary office-to-office work must route directly.

Allowed examples:

- Engineering -> Planning
- Planning -> Assessor
- Budget -> Accounting
- MDRRMO -> Engineering

Mayor's Office enters when executive approval, signature, endorsement, policy direction, authorization, or escalation is truly required.

Forbidden assumption: every municipal transaction must pass through the Mayor.

## 2.3 Generic first, configurable second, specialized third

Build shared municipal primitives before hard-coding department-specific workflows.

Working rule:

> Generic enough to serve every office; configurable enough to reflect real process; specialized only where the domain truly requires it.

## 2.4 Encode once, use many times

Canonical identities must be reused rather than independently duplicated by modules.

Priority master data includes:

- Office / Department
- Employee / User
- Barangay
- Plan / AIP / PPA
- Project
- Funding source
- Business/client where applicable
- Supplier/partner where applicable
- Property/asset
- Committee / Local Special Body

## 2.5 Security is backend authority

Frontend visibility is never authorization.

Every protected read or mutation must be enforced server-side through policy, capability, middleware, scoped query, service authorization, or equivalent explicit backend control.

## 2.6 Historical truth is preserved

Remove prototype/showcase wording and behavior from the active product path, not from Git history.

Historical Forge evidence, accepted showcase records, tags, and prior plans remain provenance.

---

# 3. Current repository posture

The existing repository is not disposable. It contains a strong operational spine.

## Preserve / extend

- Department/User/Employee organization model.
- Direct inter-office `WorkflowTransaction` routing.
- Assignment, forwarding, return, review, approval, completion semantics.
- Current office/custodian/received/due/aging/next-action projections.
- Transaction event/audit history.
- Correspondence lifecycle and correspondence-to-workflow linkage.
- `Document` + `DocumentLink` reusable evidence model.
- Records search/registry foundation.
- Memorandum distribution/acknowledgement foundation.
- Calendar backend and source-domain projection.
- Notification infrastructure.
- Backend authorization patterns.
- MFA/TOTP/recovery/rate-limit/session foundations.

## Correct / complete

- Create a real same-office Task domain.
- Turn `My Work` into an aggregate workspace instead of a transaction-only label.
- Expand Department Workspace into a durable My Office workspace.
- Add real office folders/registers/archive semantics.
- Promote Meeting Minutes to an authoritative backend domain.
- Promote Announcements/Advisories to authoritative backend state.
- Replace prototype messaging; do not rename it and pretend it is production.
- Mature records lifecycle incrementally.
- Replace static/reference operational-looking data sources.
- Remove showcase runtime authority and security bypasses.
- Replace showcase/prototype active wording/context after backing behavior is real.

## Defer until process-owner discovery or later specialization

- Full Budget domain.
- Full Procurement domain.
- Full Accounting/Treasury workflows.
- HRIS expansion beyond authorized project scope.
- Zoning/Permits specialization.
- Engineering specialization.
- GIS/CBMS/GAD specialization.
- eBOSS integration beyond explicitly approved interfaces.

---

# 4. Program operating model

## 4.1 Branch strategy

`main` remains the accepted showcase/product baseline until an explicitly accepted real-system release is ready.

`KIRION-INTRA-REAL-SYSTEM-TRANSITION` is the integration/program branch.

From the first product-code implementation lane onward:

1. Freeze an exact accepted transition SHA.
2. Create one bounded implementation branch per lane.
3. Implement only owned scope.
4. Run required local/CI test gates.
5. Reviewer inspects exact candidate SHA.
6. Acceptance decides PASS / REWORK / REJECT.
7. Only accepted candidates integrate into the program branch.
8. `main` is promoted only at a release gate, not after every lane.

No broad unreviewed direct product-code dumping into the program branch.

## 4.2 Change classes

Every change must be classified as one of:

- KEEP — proven foundation, protect from unnecessary rewrite.
- EXTEND — good foundation needing missing capability.
- PROMOTE — prototype/static surface requiring real backend authority.
- REPLACE DATA SOURCE — keep useful UI, replace reference/static state.
- DEFER — specialized domain not ready for implementation.
- REMOVE ACTIVE CONTEXT — presentation-only/runtime authority not valid for real system.
- PRESERVE HISTORY — historical evidence only.

## 4.3 Decision records

Any architecture decision that changes a governing invariant must produce an ADR or Forge directive containing:

- problem;
- options considered;
- selected decision;
- rejected alternatives;
- migration impact;
- security impact;
- rollback/compatibility impact;
- exact effective SHA.

---

# 5. Execution waves

The existing R0-R6 program remains authoritative. The following waves refine sequencing without silently rewriting those lane labels.

## W0 — R0 complete baseline audit

Goal: know exactly what is authoritative, partial, static, presentation-only, security-sensitive, or missing before mutating product code.

Required inventories:

- every active runtime `showcase` dependency;
- every active runtime `prototype` dependency;
- every static/reference data source feeding operational-looking pages;
- every authentication/authorization bypass added for presentation convenience;
- every retained MFA/security control;
- every active demo/shared credential convention;
- every prototype/showcase CI workflow that no longer represents the real product;
- every active copy string/context that claims prototype/showcase/demo;
- every migration/table/model/controller/hook/component whose name reflects temporary architecture;
- every real domain that already has accepted backend behavior;
- every test that currently validates a presentation bypass rather than real-system behavior.

Exit gate:

- path-by-path matrix complete;
- security delta complete;
- test delta complete;
- migration/rollback implications recorded;
- first product-code handoff bounded and accepted for execution.

## W1 — Security and presentation-authority decoupling

This is the first product-code lane after R0.

Objectives:

- remove `ShowcaseSession` MFA bypass;
- remove showcase/persona authority from login and access decisions;
- remove active presentation session controls from the real-system path;
- preserve TOTP MFA, recovery codes, MFA version invalidation, rate limiting, active-account checks, session regeneration, logout invalidation, CSRF, audit events;
- remove/replace demo credential conventions from active system configuration;
- replace security tests that prove showcase exceptions with negative real-system security tests;
- keep historical showcase code/evidence reachable only through Git history, not active authority.

Mandatory negative tests:

- privileged account without MFA assurance cannot enter protected application routes;
- forged/legacy showcase session state cannot bypass MFA;
- inactive account cannot authenticate;
- unauthorized office cannot view/mutate scoped work;
- knowing a private document URL is insufficient;
- rate limit triggers after configured failed attempts;
- recovery code is single-use;
- MFA reset/version change invalidates prior assurance session.

## W2 — Active product identity cleanup

Only after W1 removes presentation authority.

Objectives:

- remove active user-facing `prototype`, `showcase`, `demo`, persona and presentation-specific wording from real-system UI;
- rename active runtime/config contracts only when behavior has a real replacement;
- remove obsolete showcase startup/runtime dependencies from normal development/production paths;
- replace old active CI labels/workflows with real-system equivalents;
- update package/composer/readme active descriptions from prototype wording to municipal internal system wording;
- keep historical docs/evidence unchanged or clearly archived/historical.

Rule: no cosmetic rename may promote a non-authoritative domain.

## W3 — First-class Task + true My Work

Goal: fix the largest domain abstraction gap.

Task requirements:

- stable ID/reference;
- owning department;
- creator;
- assignee;
- title/description;
- priority;
- status/lifecycle;
- due date;
- history/events;
- comments/notes as policy permits;
- document/evidence links;
- completion evidence where required;
- reassignment/return semantics;
- no fake receiving office for same-office work.

My Work becomes an aggregate read model across:

- Tasks assigned to me;
- Work Requests assigned to me;
- Requests I created;
- waiting on other offices;
- due soon;
- overdue;
- recently completed;
- Department Head office queue;
- unassigned work;
- staff workload;
- escalations;
- executive approvals where authorized.

Preserve `WorkflowTransaction` as the inter-office work-request engine.

## W4 — My Office workspace + office archive

Goal: promote office identity from dashboard/filter to durable operational home.

My Office must eventually expose authorized access to:

1. Incoming Documents
2. Outgoing Documents
3. Memoranda & Office Orders
4. Plans, Programs & Projects
5. Office Budget Monitoring
6. Procurement Records
7. Local Special Bodies & Committees
8. Trainings & Seminars
9. Calendar & Office Head Whereabouts
10. Priority Tasks & Accomplishments
11. Personnel Records
12. Property & Equipment
13. Meetings & Documentation
14. Policies, Manuals & References
15. Office-Specific Records

Near-term archive/folder capabilities:

- create folder/subfolder;
- upload/link document;
- rename folder;
- move item;
- search;
- access policy/classification;
- archive;
- delete/restore/recycle semantics;
- activity history;
- safe handling when a folder is removed.

Design law: deleting a folder must not silently destroy institutional evidence.

Use existing `Document`/`DocumentLink`; do not duplicate file storage per module.

## W5 — Generic Work Request configuration

Preserve current workflow engine while making request taxonomy configurable.

Compact form baseline:

- Request Category
- Request Type
- Action Required
- Receiving Office
- Assigned Person where policy permits
- Priority
- Deadline
- Subject
- Description
- Attachments

System-owned fields:

- stable internal ID;
- human-readable reference;
- requesting office/user;
- current office/custodian;
- created/received timestamps;
- status;
- age/time in stage;
- due/overdue state;
- routing history;
- turnaround;
- completion/final action.

Dynamic configuration must allow category -> request type -> optional metadata/required documents/transition rules without creating a controller/model per office.

Extended fields such as funding source, AIP/PPA, barangay/location, confidentiality, work mode, related module, and expected output are conditional metadata, not universal required fields.

## W6 — Meetings, Announcements, Messaging authority

### Meeting Minutes

Promote from reference dataset to backend domain supporting:

- organizer/office/committee/LSB;
- schedule/location;
- participants/attendance;
- agenda;
- attachments;
- minutes;
- Draft / For Review / Approved lifecycle;
- decisions/agreements/resolutions;
- action items;
- Task/Work Request links;
- Calendar publication;
- cancellation/reschedule/completion;
- authorization/audit history.

### Announcements / Advisories

Support:

- issuing office/author;
- audience targeting;
- priority;
- publish/expire lifecycle;
- visibility enforcement;
- acknowledgement/read semantics only where policy requires;
- audit history.

### Messaging

Replace prototype bridge with:

- conversation/channel identity;
- membership/participants;
- server-side authorization;
- read state;
- persistence/retention policy;
- attachments/links;
- notification strategy;
- deletion/moderation/audit policy;
- Message -> Task / Work Request / Document links where authorized.

Messages never become the accountability system.

## W7 — Records, search, reporting, cross-domain links

Records maturity:

- record declaration foundation;
- classification;
- responsible/custodian office;
- links to source domains/documents;
- retention code/schedule hooks;
- archival state;
- disposition authorization/evidence later when policy is validated;
- immutable meaningful lifecycle audit.

Cross-domain links:

- Correspondence -> Work Request;
- Meeting action -> Task/Work Request;
- Message -> link/create formal work;
- Task/Work Request/Meeting/Correspondence -> Documents;
- authoritative time-bound domains -> Calendar;
- completed/declared evidence -> Records.

Search must be permission-aware and return only authorized results.

Reports must derive from authoritative server-side state and respect the same scoping rules as source domains.

## W8 — Shared master data and integration contracts

Standardize canonical references for offices, employees, barangays, plans/PPAs/projects, committees, assets and later suppliers/businesses where required.

API/integration principles:

- scoped credentials;
- least privilege;
- rate limiting;
- idempotency for mutations;
- correlation IDs;
- audit events;
- versioned contracts;
- no direct database coupling from external applications;
- explicit source-of-truth ownership per entity.

## W9 — Department Head / process-owner discovery

Do not guess specialized workflows.

Use the approved discovery playbook to capture:

- incoming/outgoing transactions;
- internal delegated tasks;
- required documents/fields;
- first receiver and completeness validator;
- assignment authority;
- transitions and exceptions;
- parallel routing;
- approval/signature authority;
- SLA/escalation;
- confidentiality;
- completion event/evidence;
- recurring reports/records;
- specialized domain requirements.

Then classify each discovered process as:

- generic configuration;
- generic engine extension;
- specialized module;
- external system integration;
- out of scope/deferred.

## W10 — Production hardening and deployment

No production claim without evidence.

Required work:

- deployment topology decision: cloud / local / hybrid;
- environment separation;
- HTTPS/TLS;
- secure cookie policy;
- secrets management;
- DB/network isolation;
- object/file storage strategy;
- queues/workers;
- scheduled jobs;
- backup policy;
- restore drill evidence;
- centralized application/security logs;
- alerting/health checks;
- dependency/vulnerability scanning;
- concurrency/idempotency review;
- failure/retry strategy;
- storage integrity/checksums;
- migration rollback/recovery runbooks;
- privacy review;
- records-retention review;
- disaster recovery;
- audit retention/tamper-resistance strategy;
- administrator onboarding/offboarding procedure;
- incident response contacts/process.

## W11 — Pilot and controlled rollout

Do not launch every office simultaneously.

Pilot with representative offices covering different patterns, for example:

- one transaction-heavy office;
- one planning/project-oriented office;
- one executive/approval context;
- one records-heavy office.

Pilot acceptance measures:

- request traceability;
- assignment clarity;
- transaction aging visibility;
- document retrieval;
- negative authorization;
- audit completeness;
- user task completion;
- error recovery;
- backup/restore confidence;
- support burden;
- Department Head validation.

Expand only after pilot findings are resolved or explicitly accepted.

---

# 6. Target domain map

```text
ORGANIZATION
Municipality
├── Departments / Offices
├── Employees
├── Users
├── Roles / Capabilities
└── Office relationships

WORK
├── Task                     same-office capable
└── Work Request             inter-office routed workflow

OFFICIAL INFORMATION
├── Correspondence
├── Memorandum
├── Announcement / Advisory
└── Document

INSTITUTIONAL EVIDENCE
├── Office Archive / Folder
└── Record

COORDINATION
├── Meeting / Minutes
├── Message / Conversation
├── Calendar
└── Notification

MANAGEMENT / REFERENCE
├── Plan / AIP / PPA
├── Project
├── Local Special Body
├── Asset / Property
└── future specialized modules
```

---

# 7. Navigation direction

Use a restrained operational shell. The strongest current candidate is:

1. Dashboard
2. My Office
3. Work Requests & Document Tracking
4. Document Archives
5. Meeting Minutes
6. Tasks & Projects
7. Calendar & Whereabouts
8. Budget & Procurement
9. Office Directory
10. Messages & Advisories
11. Reports
12. Administration

Earlier broader areas such as Development Plans, PPAs, Project Monitoring, LSBs, Data & Analytics, Forms/Templates, Knowledge Hub and Systems/Apps should be grouped into workspaces/apps/quick links rather than automatically returning to a 20+ item sidebar.

Navigation is not frozen until stakeholder acceptance, but architecture must not depend on exact menu labels.

---

# 8. Security program

## Identity and authentication

- active account required;
- generic authentication failure response;
- password login rate limiting;
- session ID regeneration on successful login;
- MFA for approved privileged roles;
- TOTP enrollment/challenge;
- hashed recovery codes;
- recovery regeneration;
- version-based assurance invalidation after reset/disable;
- MFA attempt rate limiting;
- full session invalidation and CSRF token regeneration on logout.

## Authorization

- deny by default for sensitive operations;
- department-aware/office-aware scopes;
- role/capability checks;
- resource ownership/current-custody checks;
- classification/access-policy checks for documents/records;
- explicit executive authority lane;
- system admin cannot become an invisible business-workflow shortcut without audit.

## Audit

Minimum meaningful audit context:

- actor user;
- employee where present;
- department where present;
- action code;
- entity type/id;
- allowed/denied/failed outcome where relevant;
- human-readable summary;
- correlation/request ID;
- IP/user agent/session context where policy permits;
- timestamp.

## Production controls

- HTTPS only;
- secure + HttpOnly + appropriate SameSite cookie settings;
- secrets outside repository;
- DB isolation;
- private file authorization;
- encrypted backup/storage where required;
- log/alert centralization;
- dependency scanning;
- DR and restore drills.

---

# 9. Data and migration law

1. No destructive migration without explicit migration/rollback plan.
2. Existing accepted municipal/test data must not be silently dropped.
3. Prototype-only tables/data must be classified before removal:
   - migrate into new authoritative model;
   - retain read-only temporarily;
   - archive/export then remove;
   - discard only when proven synthetic and approved.
4. New migrations must be forward-safe and test rollback where practical.
5. External/public IDs should remain stable where users/bookmarks/integrations depend on them.
6. File/document checksums and links must survive domain promotion.
7. Work Request reference identity must survive routing; forwarding must not create disconnected pseudo-records.
8. Master-data deduplication requires explicit mapping, not ad hoc SQL deletion.

---

# 10. Engineering stack and standards

Current stack is preserved unless a proven requirement justifies change:

- PHP 8.3;
- Laravel 13;
- Inertia 3;
- React 19;
- TypeScript;
- Tailwind 4;
- Vite 8;
- PHPUnit 12;
- Playwright;
- Google2FA/TOTP.

Do not change framework/library generation during the real-system transition unless there is a separate bounded dependency/security reason. Product-domain conversion is already large enough.

Application structure preference:

- explicit domain/service layer for lifecycle mutations;
- thin controllers;
- authorization close to domain operations;
- transaction boundaries for multi-record lifecycle changes;
- row locking where concurrent ownership/state mutation requires it;
- events/outbox for cross-domain integration where appropriate;
- query/read-model services for dashboards/My Work/search;
- frontend components consume authoritative server contracts rather than reimplementing permissions.

---

# 11. Quality and testing strategy

Every implementation lane must include applicable:

- unit tests for deterministic domain rules;
- feature tests for HTTP/service lifecycle behavior;
- negative authorization tests;
- data/migration tests;
- browser/Playwright tests for critical user journeys;
- TypeScript check;
- frontend production build;
- PHP test suite;
- formatting/static quality checks available in repository;
- regression tests for preserved behavior.

Critical workflows require tests for:

- happy path;
- unauthorized path;
- invalid transition;
- stale/concurrent transition where applicable;
- returned/rejected path;
- completion/terminal state;
- audit/event creation;
- document access;
- notification side effects where applicable.

No lane is complete because a screenshot looks correct.

---

# 12. CI/CD direction

Current CI still contains showcase/prototype-era workflow names and assumptions. During W2/W10:

- identify which checks remain valuable;
- port reusable checks into real-system CI;
- replace presentation-day workflows with normal build/test/security workflows;
- ensure pull/lane candidates run backend tests, TS checks, frontend build and critical browser/security suites;
- add dependency/security scanning when deployment/tooling is chosen;
- keep historical workflow files available through Git history; active branch does not need to keep obsolete presentation workflows forever.

Recommended active gates eventually:

1. `backend-test`
2. `frontend-typecheck`
3. `frontend-build`
4. `security-negative-tests`
5. `migration-check`
6. `critical-browser`
7. `dependency-scan`
8. `release-smoke`

---

# 13. UX/product standards

The internal portal must feel like a municipal work system, not the public LGU website.

UI principles:

- action and responsibility first;
- clear current office/custodian/status/age/next action;
- compact forms with conditional complexity;
- role-aware but predictable navigation;
- no dead showcase controls;
- no fake metrics presented as live;
- labels must match domain meaning;
- mobile/responsive use for common employee tasks;
- keyboard/focus/accessibility basics preserved;
- destructive actions require explicit confirmation and safe recovery semantics;
- classification/confidentiality visible where relevant;
- error messages deterministic and useful without leaking sensitive details.

---

# 14. Department discovery and specialization rule

Do not implement a real department workflow because a chat example mentioned it.

Stakeholder examples around Budget, Accounting, Treasury, Procurement, Planning, Engineering, HR and others are evidence of platform needs and future integration, not authority to invent complete statutory process rules.

Each Department Head/process owner must validate their workflow before specialization.

Discovery output becomes configuration first. Build a specialized module only when generic Task/Work Request/Document/Meeting/Record primitives cannot faithfully represent required domain state.

---

# 15. Governance and team responsibilities

## Tech Lead

Owns:

- architecture;
- sequencing;
- lane boundaries;
- security invariants;
- integration decisions;
- technical acceptance criteria;
- dependency/risk decisions;
- release recommendation.

## Product/problem owner / LGU process owners

Own:

- real business process truth;
- approval/signature authority;
- legal/administrative required fields;
- SLAs;
- confidentiality rules;
- completion evidence;
- user acceptance.

## Code Writer / implementer

Owns exactly the bounded lane and tests in the handoff. No opportunistic architecture expansion.

## Reviewer

Independently checks exact SHA, scope discipline, architecture invariants, security, tests, migration impact and regressions.

## Acceptance

Determines PASS / REWORK / REJECT on exact candidate evidence.

---

# 16. Release gates

A domain can be called operational/real only when applicable gates pass:

1. authoritative backend persistence;
2. server-side authorization;
3. explicit lifecycle;
4. ownership/responsibility semantics;
5. validation + negative authorization tests;
6. audit/event history for meaningful mutations;
7. deterministic failure behavior;
8. no static/demo/reference dataset as authoritative state;
9. migration strategy for prior data;
10. Reviewer + Acceptance evidence.

A system can be called production-ready only when, in addition:

- deployment architecture is fixed;
- TLS/secrets/session settings are production-safe;
- backups exist and restore is tested;
- logging/alerting exist;
- dependency/security review passes;
- operational runbooks exist;
- rollback/recovery path is tested;
- privacy/retention decisions for launched scope are accepted;
- pilot/UAT evidence exists.

---

# 17. Primary risk register

## RISK-01 — Cosmetic de-prototyping

Risk: remove words without replacing prototype behavior.

Control: non-prototype claim gate.

## RISK-02 — Breaking working workflow foundation

Risk: rewrite `WorkflowTransaction` instead of adding Task beside it.

Control: preserve Work Request engine; regression tests.

## RISK-03 — Security regression during showcase removal

Risk: accidentally remove good MFA/auth code together with showcase bypass.

Control: security-reference comparison + negative tests.

## RISK-04 — Department workflow invention

Risk: encode guessed rules before process-owner interviews.

Control: generic-first architecture + discovery gate.

## RISK-05 — Static data mistaken for municipal truth

Risk: screenshots/reference arrays presented as operational data.

Control: source classification and UI truthfulness.

## RISK-06 — Archive becomes file dump

Risk: recreate Google Drive with no domain links/authorization.

Control: linked Document model + Office Workspace/Record semantics.

## RISK-07 — Records overclaim

Risk: call operational archive a full formal RMS.

Control: incremental records lifecycle and claim gate.

## RISK-08 — Navigation-driven architecture

Risk: backend domain model changes every time menu labels change.

Control: bounded domains independent of IA presentation.

## RISK-09 — Production claim without operations evidence

Risk: code complete but backups/secrets/logging/DR absent.

Control: W10 release gate.

## RISK-10 — Long-running branch drift

Risk: program branch diverges while main or other branches move.

Control: exact SHA verification before every lane/handoff and explicit integration policy.

---

# 18. Technical-lead immediate orders

Until R0 closes:

- no broad product-code mutation;
- no new specialized department module;
- no cosmetic mass rename of prototype classes/tables;
- no deletion of historical evidence;
- no merge to `main`;
- no weakening MFA/authorization for convenience.

Immediate work products:

1. exhaustive active prototype/showcase/runtime inventory;
2. complete security-control delta against reference repository;
3. static/reference data-source inventory;
4. CI/workflow modernization inventory;
5. exact first Code Writer handoff for W1 security/presentation-authority decoupling;
6. Reviewer checklist and negative tests for W1.

After W1 acceptance, proceed to W2/W3 in bounded lanes rather than opening every domain simultaneously.

---

# 19. Program definition of success

The transition is successful when ONE TALIBON INTRA can truthfully operate as a municipal internal work system where:

- identity and MFA/security are enforced without presentation bypasses;
- employees and Department Heads can manage real same-office Tasks;
- offices can create and route real Work Requests directly;
- authorized users can see current holder, office, age, next action and history;
- Correspondence remains official communication and can generate linked work;
- documents are reusable, private when required, and connected to work/records;
- each office has a durable authorized workspace/archive;
- Meeting Minutes and action items are authoritative;
- advisories/announcements are authoritative;
- messages coordinate rather than replace accountable work;
- calendar projects authoritative time-bound events;
- search/reports honor authorization;
- specialized department processes are configured from validated process-owner truth;
- production operations have proven security, backups, logging, recovery and support procedures.

That is the target. Anything less must be labeled by its actual maturity rather than hidden behind wording.
