# KIRION FORGE — P1 / A01 FIVE-HUMAN EXECUTION PLAN

## Authority

Technical Authority:

**Kirch Ivan Balite**

Maintainer:

**ChatGPT / KIRION Forge Maintainer under Kirch authority**

Canonical product repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Plan publication base:

`main@ffdf1dec10a0417d4982887a19f49ba771dd953f`

Accepted executable/runtime anchor:

`395438674b4d2f00659eba616db760b339bb390a`

Project V1.1 acceptance evidence:

`Project-Intra-Smithy/engineering-hub#10 comment 6028829426 — PASS`

---

# 1. Series identity

Program:

`COMMON SYSTEM / P1 — COMMON WORK & ACCOUNTABILITY`

Series:

`A01 — FIRST-CLASS TASK DOMAIN`

A01 is the complete product-capability Series.

It is **not** equivalent to one backend work package.

---

# 2. Why A01 exists

Accepted repository/program evidence establishes:

- `WorkflowTransaction` is the existing Work Request / formal inter-office responsibility domain;
- current My Work is real but transaction-backed;
- no generic canonical common Task domain exists;
- First-Class Task is an engineering gap;
- Unified My Work depends on a stable Task contract.

Therefore A01 adds a common Task domain without replacing or rewriting Work Request.

---

# 3. Locked invariants

- `Task != Work Request`
- `Work Request != Correspondence`
- `Document != Transaction`
- Task is a common person-level responsibility domain.
- WorkflowTransaction remains the formal inter-office Work Request/custody domain.
- Task may reference another source domain without owning that domain's lifecycle.
- Existing Work Request behavior must remain intact.
- Current My Work is not rewritten in W01.
- No department-specific routing/approval/SLA/signature truth is invented.
- No universal mutable `WorkItem` aggregate is authorized.
- Frontend never invents lifecycle or server authorization.

---

# 4. Five-human execution model

## Kirch Ivan Balite

Lane:

`TECH LEAD / BACKEND / INTEGRATION / FINAL ACCEPTANCE`

Owns:

- A01 Series technical authority;
- backend/domain work;
- contract release decision;
- integration review;
- final technical acceptance.

Backend internal packages:

- A01-W01 — Task Domain Foundation
- A01-W02 — Task Lifecycle & Authorization
- A01-W03 — Task Application / Backend Contract
- A01-W04 — Task Events / Audit / Common Hooks
- A01-W05 — Backend Acceptance / Migration / Query Discipline

These are subordinate packages inside A01.

## AJ Rienze Josol

Lane:

`FRONTEND`

Receives bounded frontend implementation only after:

`A01-C1 + FRONTEND-REG-001`

Exact A01 frontend package ownership is assigned at contract release.

## Jhayr

Lane:

`FRONTEND`

Receives bounded frontend implementation only after:

`A01-C1 + FRONTEND-REG-001`

Exact A01 frontend package ownership is assigned at contract release.

AJ/Jhayr may work in parallel on non-overlapping frontend packages after contract release.

## Kurt Shine Khase Halasan

Lane:

`CI/CD / DEVELOPMENT OPERATIONS`

Owns:

`A01-CI01 — EXACT CANDIDATE / RELEASE-TUPLE CI/CD VALIDATION`

Kurt validates the exact candidate/release tuple and records reproducible evidence.

CI PASS is not final technical acceptance.

## Siris

Lane:

`QUALITY ASSURANCE`

Owns:

`A01-QA01 — INDEPENDENT FUNCTIONAL / NEGATIVE / REGRESSION QA`

Siris validates the exact candidate/release tuple independently.

QA does not silently repair the candidate.

## Maintainer

Lane:

`MAINTAINER / PROGRAM CONTROL`

Owns coordination only:

- exact source/branch issuance;
- work-package registration;
- dependency state;
- candidate/evidence reconciliation;
- contract-release record preparation;
- handoff preparation;
- integration-state preparation;
- bulletin/current-state synchronization.

Maintainer does not replace any human lane or self-award acceptance.

---

# 5. A01 staged delivery

## Gate A01-G0 — Control surface readiness

State:

`PASS / ACCEPTED`

Evidence:

- five-human control model merged;
- Project V1.1 PASS;
- human-friendly Project views active;
- A01-W01 remains Blocked;
- no implementation candidate exists.

## A01-W01 — Task Domain Foundation

Human owner:

`Kirch`

Purpose:

Create only the minimal canonical Task persistence/model foundation.

Owned implementation surface remains bounded to:

- `app/Models/Task.php`
- one additive `create_tasks_table` migration
- `tests/Feature/Tasks/TaskDomainFoundationTest.php`
- optional TaskFactory only if narrowly required by the focused test

No lifecycle enum/default/policy/application route/frontend work is authorized in W01.

### Historical W01 branch

Historical issuance branch:

`KIRCH-TALIBON-P1-A01-W01-TASK-DOMAIN-FOUNDATION@ddbcf2a2715315c0e9998a7bcfdd9414edb3acd4`

State:

`HISTORICAL / IMMUTABLE / DO NOT RESUME`

Reason:

It diverged from current product main after the governance/control-model reconciliation.

It remains provenance only.

### Replacement branch strategy

When Technical Authority releases W01:

1. resolve current product `main` exactly;
2. verify no executable A01 candidate exists;
3. create a **fresh replacement W01 branch from current main**;
4. issue a new bounded W01 handoff carrying forward only the accepted technical W01 contract;
5. record the new exact writer-source SHA in Hub issue #2 and product SSOT;
6. only then change #2 Project Status from Blocked to Active.

No mutation of the historical W01 branch is authorized.

## A01-W02 — Task Lifecycle & Authorization

Blocked until W01 candidate is reviewed and accepted.

Owns:

- canonical lifecycle semantics;
- allowed transitions;
- create/view/assign/reassign/act/complete/cancel/return authority as approved;
- negative authorization;
- terminal-state semantics;
- assignment visibility.

No municipal workflow semantics may be invented.

## A01-W03 — Task Application / Backend Contract

Blocked until W02 acceptance.

Owns:

- routes/controllers/application service;
- request validation;
- response/resource/DTO contract;
- list/detail/create/action semantics;
- filters/pagination as justified;
- error semantics;
- allowed-action representation;
- source-reference semantics.

## A01-C1 — Backend Contract Release

Kirch releases C1 only when frontend can consume Task without guessing.

C1 publishes:

- exact backend candidate SHA;
- route/API contract;
- request/response fields;
- lifecycle values;
- authorization/error behavior;
- filters/pagination;
- source-reference shape;
- migration/deprecation notes;
- frontend validation assumptions.

C1 unlocks:

- A01 frontend after FRONTEND-REG-001;
- bounded A02 architecture against stable Task identity/contract.

## A01-W04 — Events / Audit / Common Hooks

May overlap after relevant W02/W03 contracts are stable.

Owns:

- Task audit/event evidence;
- common hooks only where accepted contracts justify them;
- source-link integrity.

No department-specific SLA/notification policy.

## A01-W05 — Backend Acceptance / Migration / Query Discipline

Proves backend readiness:

- forward migration;
- rollback/recovery where feasible;
- model/lifecycle tests;
- authorization negatives;
- query/index sanity;
- Work Request non-regression;
- exact candidate evidence.

## A01-F01 / A01-F02 — Frontend implementation

Blocked until:

`A01-C1 + FRONTEND-REG-001`

Frontend-owned presentation may include:

- Task list/detail;
- create/action surfaces;
- loading/empty/error/permission states;
- responsive integration;
- contract-driven action availability.

Exact split between AJ and Jhayr is issued at frontend release to avoid speculative ownership.

## A01-I01 — Integrated Candidate

Maintainer prepares integration state.

Kirch owns integration decision.

Candidate must identify exact backend/frontend SHAs or release tuple.

## A01-CI01 — Kurt CI/CD

Required before final QA/acceptance where applicable.

Evidence belongs to the exact candidate/release tuple.

## A01-QA01 — Siris QA

Independent functional, negative and regression validation against the exact candidate/release tuple.

## A01-TL01 — Kirch Technical Acceptance

Kirch reviews:

- architecture;
- scope;
- evidence;
- authorization;
- migration/integration impact;
- Work Request non-regression;
- frontend/backend contract integrity.

Disposition:

`ACCEPT / REWORK / HOLD`

## A01-H — Series Freeze

A01 closes only after:

- exact accepted candidate/release tuple exists;
- required CI/CD PASS exists;
- required QA PASS exists;
- Kirch acceptance exists;
- integration is recorded;
- Task contract is stable enough for A02;
- known state is published.

Then:

`A01 FREEZE -> A02 AUTHORIZATION`

---

# 6. Parallelism

Before A01-C1:

- Kirch backend A01 packages may proceed serially or with bounded preparation;
- Track W and Track R remain parallel;
- frontend implementation remains blocked;
- A02 implementation remains blocked.

After A01-C1 + FRONTEND-REG-001:

- AJ/Jhayr may work on non-overlapping frontend packages;
- bounded backend continuation may proceed;
- bounded A02 architecture may begin against the released Task contract.

Canonical integration remains gated.

---

# 7. Evidence law

Use only:

`PASS / FAIL / PARTIAL / BLOCKED / NOT RUN / NOT OBSERVED / UNKNOWN`

A PASS belongs to an exact candidate/release tuple.

Changed executable source creates a new candidate.

CI PASS != QA PASS.

QA PASS != Kirch acceptance.

Project Status != implementation authority.

---

# 8. Current release state

Project V1.1:

`PASS / CLOSED`

A01 plan:

`PUBLISHED FOR TECHNICAL AUTHORITY REVIEW`

A01-W01:

`BLOCKED / SUSPENDED`

Historical W01 branch:

`IMMUTABLE PROVENANCE`

Replacement W01 branch:

`NOT YET CREATED`

A01 implementation candidate:

`NONE`

No product implementation is released by this plan alone.

---

# 9. Next authority action

Technical Authority must decide:

`ACCEPT A01 HUMAN EXECUTION PLAN + RELEASE W01`

or:

`RETURN BOUNDED REWORK`

If accepted, Maintainer will:

1. resolve current product main;
2. create a fresh replacement W01 branch from current main;
3. issue the corrected W01 handoff under Kirch human ownership;
4. update Hub issue #2 and Project status to Active;
5. stop governance work and begin actual A01 implementation.
