# P SERIES — CANONICAL BASELINE HARDENING

## Authority

Technical Authority: **Kirch Ivan Balite**

Repository: `Kirch-Nairu/Talibon-Sales-Prototype`

Coordination branch: `KIRCH-TALIBON-P0-CANONICAL-BASELINE-STABILIZATION`

Immutable dual-writer implementation base: `a10dca34db0509d7139ebeb4080e85dde2c0e544`

Historical coordination label: `P0 — CANONICAL BASELINE STABILIZATION`.

Current Forge naming law for this program:

- full program = **P SERIES**;
- bounded execution units = **P01, P02, ...** slices;
- writer lanes remain W01/W02 and are assigned to specific slices;
- a slice is not complete because code exists; it closes only on its stated exit evidence.

## What baseline hardening means

Baseline hardening is the controlled conversion of the current mixed-maturity repository into a trustworthy engineering source baseline.

It is not a redesign, feature sprint, Docker migration, or rewrite.

It does four concrete things:

1. **Authority hardening** — determine which routes, domains, pages, tests, defaults and data are authoritative, reference-only, deferred, historical or out of immediate scope.
2. **Source hardening** — repair evidence-backed unsafe, stale, duplicate, misleading or dead source state without inventing LGU rules.
3. **Boundary hardening** — enforce domain and authorization boundaries and make frontend/backend ownership explicit enough for later repository separation.
4. **Evidence hardening** — produce one exact integrated SHA whose behavior is reproducible and whose known state is documented.

The current repository demonstrably mixes mature core behavior with prototype/reference and scope-ambiguous surfaces. `routes/web.php` currently exposes core work/correspondence/records routes alongside static Meetings/Announcements routes, prototype Messaging endpoints, Procurement showcase, Property, Legislative and extensive HRIS/health/payroll/lifecycle routes. The frontend navigation also marks Procurement Tracking and Project Monitoring as wired destinations while product authority still classifies those domains as discovery/specialized work. Baseline hardening exists to resolve that mismatch deliberately rather than allowing route existence or a menu item to imply scope or maturity.

Hardening does **not** automatically delete those surfaces. Every surface first receives an authority disposition.

## Global disposition vocabulary

Every material route/page/domain encountered during P SERIES is classified as one of:

- `AUTHORITATIVE CORE`
- `VERIFIED FOUNDATION`
- `PARTIAL / MATURITY WORK`
- `REFERENCE / NON-AUTHORITATIVE`
- `DEFERRED DOMAIN`
- `OUTSIDE IMMEDIATE SCOPE`
- `HISTORICAL / PROVENANCE`
- `BLOCKED — AUTHORITY REQUIRED`

No route, controller, model, page or test is removed merely because it appears old.

## Concurrency law

Maximum active Code Writers: `2`.

Current allocation:

- W01 — backend writer;
- W02 — frontend writer.

Broad CI/CD is deferred until the exact integrated candidate. Narrow local/static checks are permitted where necessary to avoid obviously invalid code or to prove a security repair.

# P SERIES SLICE MAP

## P01 — SOURCE TRUTH & AUTHORITY LOCK

Owner: Maintainer / Technical Authority.

Purpose: establish the exact source state and authority hierarchy before code cleanup.

Targets:

- Git lineage and source SHA;
- accepted/frozen feature ancestry;
- historical vs current Forge records;
- canonical vs working branches;
- scope/non-claim boundaries;
- architecture invariants.

Required outputs:

- exact source SHA;
- immutable writer base;
- authority hierarchy;
- frozen architecture boundaries;
- prohibited assumptions.

Current state: `SUBSTANTIALLY COMPLETE`.

Exit: writers can be issued from one immutable base without ambiguity.

## P02 — SECURITY, SHOWCASE & ENVIRONMENT BOUNDARY

Owner: Maintainer + bounded backend repair when necessary.

Purpose: make prototype conveniences incapable of masquerading as production defaults.

Targets:

- showcase default and session boundary;
- MFA assurance and negative paths;
- protected UAT database isolation;
- example/dev/test database naming;
- secrets/config defaults;
- demo persona leakage;
- environment assumptions that belong to CI/host rather than product logic.

Already material repairs include showcase disabled by default and safer example DB defaults. Final proof still belongs to the integrated candidate.

Current state: `MATERIALLY PROGRESSED`.

Exit: no known dangerous default remains silently enabled in the baseline source; remaining production controls are explicitly production-gated.

## P03 — BACKEND CANONICALIZATION

Writer: `P0-W01-BACKEND-CANONICALIZATION`.

Primary source ownership: `app/**`, `routes/**`, bounded backend `config/**`, non-destructive `database/**`, backend tests.

### P03-A — Route & Surface Authority

Inspect every public/authenticated route and classify it.

Priority evidence targets:

- `routes/web.php`;
- `routes/api.php`;
- static/reference routes for Meetings and Announcements;
- prototype Messaging endpoints;
- Procurement showcase route;
- Project Monitoring/Operations relationship;
- Property and Legislative route families;
- full HRIS, DTR, payroll, leave, health vault, development, onboarding/offboarding route families.

Required result: route existence must no longer be treated as proof of product authority. Out-of-scope or reference behavior is preserved, isolated, truth-labelled, disabled from canonical exposure, or returned to Maintainer for disposition based on evidence.

### P03-B — Identity, Authentication & Authorization

Targets:

- `app/Domain/Authorization/**`;
- `app/Domain/Identity/**`;
- Policies/Gates/middleware;
- MFA controllers/middleware;
- active-account enforcement;
- server-side visibility/authorization contracts;
- negative coverage for privilege boundaries.

Goal: remove permissive/stale assumptions while preserving server authority.

### P03-C — Operational Work & Official Information Domains

Targets:

- `app/Domain/Workflow/**`;
- transaction/work-request controllers/services/models;
- `app/Domain/Correspondence/**`;
- records/document/search/file controls;
- custody, assignment, status and event-history boundaries;
- duplicated lifecycle/workspace code where actual duplication is proven.

Invariant checks:

- Task != Work Request;
- Work Request != Correspondence;
- Document != Transaction.

### P03-D — Coordination, Eventing & Integration

Targets:

- Calendar backend foundation;
- Memoranda/notifications;
- accepted Messaging behavior — preserve accepted feature state;
- `app/Domain/Integration/**`;
- `app/Domain/Outbox/**`;
- jobs/events/listeners/notification publication;
- current API v1 integration surface.

The current `routes/api.php` is an integration API, not yet the future standalone frontend API. Do not invent the split-repo client API in this slice.

### P03-E — Schema, Seed & Runtime Authority

Targets:

- migrations and schema history;
- seeders/demo fixture authority;
- configuration defaults;
- stale data-model experiments;
- environment coupling;
- test assumptions that mutate or depend on protected data.

No migration squashing or destructive history rewrite.

### P03-F — Backend Extraction Readiness

Produce the backend manifest:

- backend-owned code;
- frontend-dependent contracts;
- shared/Maintainer decisions;
- historical/reference/deferred code;
- routes/data currently delivered through Inertia;
- capabilities that will need API contracts after the repository split.

P03 exit: one exact W01 candidate SHA + evidence + changed-file inventory + unresolved authority dependencies.

## P04 — FRONTEND CANONICALIZATION

Writer: `P0-W02-FRONTEND-CANONICALIZATION`.

Primary source ownership: `resources/js/**`, `resources/css/**`, frontend-only assets, `tests/Browser/**`.

### P04-A — Shell, Navigation & Destination Authority

Targets:

- `resources/js/layouts/**`;
- `resources/js/navigation/**`;
- `navigationDestinations.ts`;
- `navigationRoutePlan.ts`;
- `portalModuleCatalog.ts`;
- Dashboard entry and global shell.

Specific authority mismatches to inspect:

- Procurement / PR Tracking currently represented as `wired`;
- Project Monitoring currently represented as `wired` through `/operations`;
- `HR Employee Portal` terminology versus the approved immediate Employee & Office Directory boundary;
- integration-pending administration destinations;
- reference/deferred modules that visually look production-ready.

### P04-B — Work & Accountability Surfaces

Targets:

- My Work / Transactions;
- assignment, status and due-date presentation;
- transaction detail/live surfaces;
- dashboard work projections.

Goal: UI reflects server state without collapsing Task and Work Request semantics or inventing workflow authority.

### P04-C — Documents, Correspondence, Records & Search

Targets:

- Correspondence pages;
- Document Center/Documents;
- Records;
- portal/global search;
- Memoranda presentation;
- authorization-denied and empty-state behavior.

Goal: official-information surfaces accurately represent current backend maturity and authority.

### P04-D — Coordination Surfaces

Targets:

- Notifications;
- Calendar;
- Messaging;
- Meetings;
- Announcements.

Meetings and Announcements currently consume repository static municipal data and already carry reference-data notices. Preserve that truth and ensure surrounding navigation does not imply authoritative backend lifecycle.

Messaging must preserve accepted behavior and must not be casually rewritten because route/controller names still contain historical `PrototypeMessaging` terminology.

### P04-E — Organization, Administration & Specialized/Reference Surfaces

Targets:

- Departments/Employees;
- Admin/Audit/Reports;
- Legislative/reference surfaces;
- Local Special Bodies, Plans, PPAs;
- Municipal Systems/Future Integrations;
- any frontend HRIS remnants;
- Procurement and Project Monitoring presentation.

Goal: authoritative, reference, deferred and out-of-scope surfaces are visually and navigationally honest.

### P04-F — Shared UI State, Accessibility & Responsive Stability

Targets:

- loading/empty/error/permission states;
- stale wrappers/components/imports;
- 1440 and 390 behavior on touched core surfaces;
- horizontal overflow;
- semantic headings/labels where cleanup changes presentation.

No broad redesign.

### P04-G — Frontend Extraction Readiness

Map:

- Inertia page props;
- server-generated route assumptions;
- auth/session/CSRF dependencies;
- upload/download flows;
- browser tests transferable to a frontend repo;
- build/assets ownership;
- data interactions that require future API clients.

P04 exit: one exact W02 candidate SHA + evidence + changed-file inventory + unresolved backend-contract dependencies.

## P05 — PRODUCT SURFACE DISPOSITION

Owner: Maintainer after P03/P04 returns.

Purpose: reconcile backend route reality, frontend destination reality and approved scope into one product-surface register.

Every material user-facing capability gets:

- authority classification;
- backend maturity;
- frontend maturity;
- navigation exposure;
- current tests;
- keep / isolate / truth-label / defer / remove decision;
- future repo owner.

Special attention:

- Full HRIS exists in current route/source state but remains outside immediate approved scope. Do not silently destroy historical code and do not let it masquerade as immediate canonical scope.
- Procurement and Project Monitoring remain requirements/specialized-analysis domains despite wired-looking frontend destinations.
- Meetings/Announcements remain reference/maturity work unless later accepted evidence proves otherwise.
- Messaging accepted exact-state provenance must be preserved.

P05 exit: no major route/page/module remains maturity-ambiguous.

## P06 — CROSS-LAYER CONTRACT RECONCILIATION

Owner: Maintainer, with bounded W01/W02 rework if needed.

Purpose: make the current monorepo internally coherent and prepare separation without performing the split.

Targets:

- route -> controller -> Inertia page mapping;
- server-provided page props;
- auth/permission ownership;
- file download/upload boundaries;
- validation/error propagation;
- shared types/data shapes;
- direct frontend assumptions about backend implementation;
- future frontend API inventory.

Exit: cross-layer ambiguities are either repaired or explicitly recorded as later separation-contract work.

## P07 — SOURCE RECONCILIATION & INTEGRATED CANDIDATE

Owner: Maintainer.

Purpose: independently review W01/W02, reconcile overlap and construct one exact baseline candidate.

Steps:

- verify writer lineage;
- verify changed-file ownership;
- source review each candidate independently;
- bounded rework where required;
- integrate accepted changes once;
- handle shared/high-risk files centrally;
- remove only proven dead/duplicate state;
- synchronize tests only where current authority is independently established.

Exit: one immutable integrated P-series candidate SHA.

## P08 — TARGETED CI/CD & RUNTIME ACCEPTANCE

Owner: CI/DevOps validation lane under Technical Authority.

Run only against the exact P07 candidate unless a specific pre-integration security check was explicitly required.

Validation matrix:

- locked Composer/npm dependency integrity;
- PHP/Laravel bootstrap;
- TypeScript;
- production frontend build;
- changed-domain Unit/Feature suites;
- security/authorization negative tests;
- route authority checks;
- disposable PostgreSQL `migrate:fresh --seed`;
- full Feature suite at final acceptance candidate;
- Laravel cacheability;
- runtime `/` and `/login` smoke;
- targeted browser journeys for touched surfaces;
- 1440 / 390 responsive checks;
- Messaging preservation regression;
- repository hygiene;
- evidence artifact collection.

Failure law: classify first. Product defect returns to owning code lane; stale test returns to contract review; runner/host defect receives no product mutation. Any source repair creates a new candidate and invalidates downstream PASS inheritance.

Exit: exact candidate receives required engineering PASS evidence.

## P09 — BASELINE FREEZE & KNOWN-STATE PUBLICATION

Owner: Technical Authority.

Publish:

- exact canonical P-series baseline SHA;
- route/surface authority register;
- known-good capabilities;
- partial/reference/deferred/out-of-scope capabilities;
- known defects;
- security status;
- schema/data status;
- backend extraction manifest;
- frontend extraction manifest;
- CI/runtime evidence;
- explicit non-claims;
- collaboration reopening instructions.

P SERIES closes only here.

# FOLLOW-ON SERIES

## R SERIES — FRONTEND/BACKEND REPOSITORY SEPARATION

Begins only from the accepted P09 SHA.

Planned slices:

- `R01` — separation contract freeze;
- `R02` — backend repository extraction;
- `R03` — frontend repository extraction;
- `R04` — auth/API/file/integration parity;
- `R05` — split-repository CI and cutover acceptance.

No physical split before R01 authority is frozen.

## D SERIES — CONTAINER & RUNTIME FOUNDATION

Begins after repository ownership/boundaries are explicit.

Planned slices:

- `D01` — reproducible backend/frontend build images;
- `D02` — local Compose development topology;
- `D03` — containerized CI/integration topology;
- `D04` — production-style reverse proxy/runtime/workers/scheduler;
- `D05` — health, secrets, persistence, logging, backup/restore and operational proof.

Docker is therefore not used to hide unresolved P-series product ambiguity.

## Current active position

Completed/materially progressed: `P01`, `P02`.

Active in parallel: `P03` + `P04`.

Blocked until writer returns: `P05` onward.

Current writer concurrency: `2 / 2`.

## Validation cadence

P01-P07 are principally code/authority/review slices. Use targeted local/static proof where necessary.

P08 is the principal CI/CD acceptance slice.

Do not turn runner troubleshooting into the product-development loop again.
