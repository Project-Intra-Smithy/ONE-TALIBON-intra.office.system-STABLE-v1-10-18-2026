# KIRION FORGE MEMORY — COMMON SYSTEM PROGRAM LOCK

## Authority

Technical Authority: **Kirch Ivan Balite**

Product repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Program-lock preparation branch:

`KIRCH-TALIBON-COMMON-SYSTEM-PROGRAM-LOCK`

Frozen backend authority at lock preparation:

`main@4bac88d22e1fb3f808c024888845503922c41683`

Accepted executable/runtime anchor:

`395438674b4d2f00659eba616db760b339bb390a`

Final pre-lock audit:

`.forge/evidence/maintainer/COMMON-SYSTEM-PRELOCK-FINAL-AUDIT.md`

Audit commit:

`f07f3df6556f5603bb71c12b500aecc04532d249`

This memory supersedes earlier planning language where it conflicts with the program state below. Historical Forge evidence remains provenance and must not be rewritten to look current.

---

# 1. Program objective

ONE TALIBON will complete the **COMMON MUNICIPAL ENGINE first**.

The common engine is the shared municipal capability layer that can serve every office without inventing office-specific business truth.

The governing development rule is:

`BUILD COMMON FIRST -> CONFIGURE WHEN SUFFICIENT -> EXTEND REUSABLE CAPABILITY WHEN REPEATED VALIDATED NEED JUSTIFIES IT -> SPECIALIZE ONLY WHEN VALIDATED DOMAIN TRUTH REQUIRES IT`

Department-specific workflow implementation is not authorized merely because a route, page, Charter row, prototype, or historical model exists.

---

# 2. Governing architectural invariants

These boundaries are locked:

- `Task != Work Request`
- `Work Request != Correspondence`
- `Document != Transaction`
- `Meeting != Task`
- `Executive oversight != universal routing`

Do not introduce a universal mutable domain merely to simplify integration.

A projection may normalize presentation semantics while the source domains retain their own identities, state machines, authorization rules and audit history.

---

# 3. Whole common-system phase lock

## P0 — Canonical Baseline

Status:

`COMPLETE / FROZEN`

Purpose:

Establish one truthful exact-SHA baseline, reconcile prototype/showcase residue, prove current shared foundations, publish known state and stop baseline hardening.

Do not reopen P0 without:

- a concrete defect;
- invalidated evidence;
- changed acceptance requirement; or
- explicit Technical Authority decision.

---

## P1 — Common Work & Accountability

Purpose:

Create the missing common Task domain and extend the existing transaction-backed My Work experience into an authoritative cross-domain responsibility projection without replacing the Work Request engine.

### A01 — First-Class Task Domain

State:

`BUILD`

Required domain result:

- generic internal/person-level Task;
- independent lifecycle;
- assignment/responsibility;
- due date/priority where justified;
- authorization/policy;
- audit/events;
- source/reference linkage;
- backend contract;
- tests;
- explicit separation from Work Request.

### A02 — Unified My Work Projection

State:

`BUILD / EXTEND EXISTING`

Hard dependency:

`A01 TASK CONTRACT RELEASE`

Initial authoritative sources:

- Task;
- WorkflowTransaction / Work Request.

Rule:

`AGGREGATE SEMANTICS; DO NOT COLLAPSE DOMAIN SEMANTICS`

Existing transaction-backed My Work behavior must be migrated compatibly rather than discarded.

### A03 — Non-Destructive Task / Work Request Integration

State:

`INTEGRATE / REGRESS`

Includes:

- shared responsibility presentation;
- cross-navigation;
- source-aware references;
- My Work integration;
- notification/calendar hooks only where contracts exist;
- existing frontend-consumer compatibility;
- Work Request non-regression.

Explicitly prohibited:

- converting WorkflowTransaction into Task;
- replacing the transaction engine;
- inventing universal lifecycle states;
- generic workflow DSL;
- new municipal approval rules without authority.

### A04 — P1 Integration & Contract Acceptance

State:

`ACCEPT / FREEZE P1 CONTRACT`

Must prove:

- migration from accepted P0;
- Task lifecycle + negative authorization;
- Work Request non-regression;
- Unified My Work runtime;
- compatibility state;
- audit/event coverage;
- responsive/frontend contract where applicable;
- exact accepted SHA;
- published contract.

### P1-H — Work & Accountability Known-State Freeze

P1 is the only phase currently authorized for detailed work-package decomposition.

---

## P2 — Common Coordination Integration

Purpose:

Integrate/preserve established coordination foundations against accepted common-work contracts.

### B01 — Notification Responsibility / Event Integration
`MATURE / INTEGRATE`

### B02 — Calendar Common Integration
`PRESERVE / INTEGRATE`

### B03 — Messaging Preservation & Common Work Context
`PRESERVE / BOUNDED INTEGRATION`

### B04 — P2 Integration & Contract Acceptance

### P2-H — Coordination Known-State Freeze

Not part of P2 completion:

- Meetings;
- Announcements.

Those remain authority/input-gated.

Detailed P2 work packages are generated only when consumed P1 contracts are stable.

---

## P3 — Official Information & Evidence Maturation

Purpose:

Mature existing Correspondence, Documents and Records foundations without collapsing their domain boundaries.

### C01 — Correspondence Common Lifecycle Maturation
### C02 — Documents / Attachments Lifecycle Maturation
### C03 — Records Lifecycle & Registry Maturation
### C04 — Evidence Linkage / Reference Integration
### C05 — P3 Integration & Contract Acceptance
### P3-H — Information / Evidence Known-State Freeze

Unresolved correspondence/records business semantics remain authority-gated.

---

## P4 — Common Search

Purpose:

Expand search only across accepted source domains with authorization-safe retrieval and bounded query behavior.

### D01 — Cross-Domain Search Source Contract
### D02 — Authorization-Safe Search Integration
### D03 — Query / Pagination / Performance Acceptance
### D04 — P4 Integration & Contract Acceptance
### P4-H — Search Known-State Freeze

Search cannot promote an unaccepted domain merely because its data exists.

---

## P5 — Visibility & Control

Purpose:

Integrate accepted common-domain semantics into existing dashboard/report/audit projection foundations.

### E01 — Employee Workspace / Responsibility Projection Integration
### E02 — Office / Department Workspace Integration
### E03 — Executive Bounded Oversight Integration
### E04 — Reports / Export Integration
### E05 — Audit Coverage Integration
### E06 — P5 Integration & Contract Acceptance
### P5-H — Visibility / Control Known-State Freeze

Official LGU KPIs remain input/authority-gated.

---

## P6 — Cross-Domain Authorization Reconciliation & Security Regression

Purpose:

Prove the integrated common-domain set does not create cross-domain privilege escalation or data leakage.

Security is required in every Series. P6 is final reconciliation/regression, not delayed security implementation.

### F01 — Canonical Permission / Capability Matrix Reconciliation
### F02 — Cross-Domain Negative Authorization Regression
### F03 — Search / Record / File Leakage Regression
### F04 — Account / Session / MFA Regression
### F05 — Audit / Mutation Integrity Regression
### F06 — P6 Security Acceptance
### P6-H — Security Known-State Freeze

Final municipal role assignments remain dependent on authoritative LGU role/configuration input.

---

## P7 — Common-Core Acceptance

Purpose:

Prove the assembled common municipal engine as one reproducible exact candidate.

### G01 — Full Common-System Integration / Release Manifest
### G02 — Migration / Reproducibility / Configuration Freeze
### G03 — Exact-Candidate CI / Runtime / Responsive Acceptance
### G04 — Known-State / Deferred-Authority Publication
### G-H — Common Municipal Engine Engineering Freeze

---

# 4. Hard vs soft dependency law

## Hard dependency spine

`P0 -> A01 -> A02 -> A03/A04 -> P1-H`

Additional hard rules:

- cross-domain Search cannot expose a source domain before that domain contract is accepted;
- final P6 reconciliation depends on the domains included in the release candidate;
- P7 depends on every capability declared part of COMMON MUNICIPAL ENGINE COMPLETE.

## Soft/program-order dependencies

P2 and P3 may overlap once the contracts they consume are stable.

P4 and P5 may partially overlap because Search and dashboard/report projections are sibling read concerns over accepted domains.

Program order is not a license for mixed uncontrolled work. Parallelism begins only at explicit contract-release/dependency gates.

---

# 5. Frontend release law

Backend/domain authority is established before frontend implementation is released.

Per feature/Series:

`DOMAIN TRUTH -> AUTHORITY -> BACKEND CONTRACT -> CONTRACT RELEASE -> FRONTEND AUTHORIZED -> INTEGRATION -> EXACT-CANDIDATE VALIDATION`

Backend/reference HTML or minimal interactive surfaces may be used as **contract harnesses**.

They are not canonical UX authority.

Frontend owns presentation/interaction design within the approved backend contract and may not invent:

- lifecycle states;
- permissions;
- routing;
- municipal roles;
- SLA;
- approval/signature behavior;
- department-specific business fields.

Before first A01 frontend handoff, `FRONTEND-REG-001` must name the exact frontend integration base.

---

# 6. Cross-cutting acceptance laws

Every relevant Series must preserve:

## Compatibility / migration
- upgrade from accepted prior state;
- intentional deprecation/redirect behavior;
- existing route/API consumer compatibility where practical;
- fixture/seed compatibility where material;
- no destructive rewrite merely to simplify the new design.

## Minimal cross-domain reference contract
Consumers must be able to determine:
- source domain;
- canonical identifier;
- authorization path;
- navigation target;
- whether the consumer links to the source without owning its lifecycle.

## Query/performance discipline
Aggregators/search/projections must have:
- bounded query behavior;
- pagination;
- authorization before/during retrieval;
- no obvious N+1;
- deterministic sorting;
- realistic-volume acceptance.

## Reproducibility
Each accepted Series/freeze identifies:
- exact commit;
- schema/migration state;
- configuration version;
- feature flags where material;
- reference/seed data version where material;
- known deferred/input-gated capabilities.

## Exact-candidate law
Any executable source change after PASS creates a new candidate and requires affected revalidation.

---

# 7. Parallel tracks outside the common-series implementation

## Track W — LGU Workflow Intake / Authority

Runs in parallel.

Business-state progression:

`DOCUMENTED/RECEIVED -> COMPLETENESS REVIEW -> CLARIFICATION -> TECHNICALLY MODELED -> PROCESS-OWNER VALIDATED -> BASELINE READY -> IMPLEMENTATION AUTHORIZED`

After sufficient truth:

- configure existing common engine;
- shared extension candidate;
- specialized domain;
- external integration;
- outside scope.

Citizens' Charter is supporting discovery evidence only.

## Track R — Production Readiness

Runs in parallel under separate evidence:

- infrastructure;
- security hardening;
- DNS/HTTPS;
- backup/restore;
- monitoring/logging;
- notification/email delivery;
- staging;
- runbooks/operations.

Production readiness does not silently change product/domain authority.

---

# 8. COMMON MUNICIPAL ENGINE COMPLETE

The COMMON MUNICIPAL ENGINE is complete only when the accepted common domains and shared municipal capabilities defined by this program are:

- implemented;
- integrated;
- authorized;
- regression-tested;
- reproducible from a known exact candidate;
- frozen against the approved engineering baseline.

Minimum exit conditions:

1. First-Class Task exists independently.
2. Unified My Work aggregates Task + Work Request without destructive refactoring.
3. Existing Work Request behavior passes non-regression.
4. accepted Notifications/Calendar/Messaging are integrated/preserved.
5. Correspondence/Documents/Records are matured only to authorized requirements.
6. Search covers accepted domains only and passes leakage tests.
7. dashboards/reports consume accepted semantics without invented official KPIs.
8. authorization exists per Series and final cross-domain negatives pass.
9. audit coverage exists for promoted domains.
10. auth/MFA/account-state regressions remain green.
11. compatibility/migration evidence exists.
12. exact candidate + schema/config/reference state are published.
13. CI/runtime/responsive/QA evidence passes.
14. no INPUT REQUIRED item was silently converted into an assumption.
15. acceptance explicitly does NOT mean:
   - all department workflows complete;
   - LGU UAT complete;
   - production readiness complete;
   - final contractual acceptance complete.

---

# 9. Lock granularity

Locked now:

- P0-P7 purposes;
- all A/B/C/D/E/F/G Series identifiers and purpose boundaries;
- hard/soft dependency rules;
- domain invariants;
- cross-cutting acceptance laws;
- frontend contract-release law;
- Track W / Track R separation;
- COMMON MUNICIPAL ENGINE COMPLETE definition.

Not locked now:

- detailed P2-P7 W-package trees;
- department-specific business rules;
- exact future schemas not required by current Series;
- official LGU KPI definitions;
- production topology acceptance;
- UAT outcomes.

P1 is authorized for just-in-time detailed work-package decomposition.

---

# 10. Change control

After this program lock is accepted, changing P0-P7 architecture requires:

1. new repository evidence, validated business input or changed requirement;
2. written architecture decision;
3. affected dependency analysis;
4. Technical Authority approval.

Roadmap discussion alone is not sufficient authority to alter the lock.
