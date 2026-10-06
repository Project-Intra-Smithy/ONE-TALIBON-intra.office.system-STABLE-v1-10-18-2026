# KIRION FORGE — P1 / A01 FIRST-CLASS TASK SERIES PLAN

## Authority

Technical Authority:

**Kirch Ivan Balite**

Canonical source at A01 opening:

`main@f2ff373113f89173016634505eb3c3943edfb35c`

Coordination branch:

`KIRCH-TALIBON-P1-A01-FIRST-CLASS-TASK`

Governing program memory:

`.forge/memory/COMMON-SYSTEM-PROGRAM-LOCK.md`

Opening context:

`.forge/memory/P1-A01-OPENING-CONTEXT.md`

---

# 1. Why A01 exists

Live source confirms:

- `WorkflowTransaction` is the existing Work Request/inter-office responsibility domain;
- current My Work is real but transaction-backed;
- specialized HR task artifacts exist;
- no generic canonical common `Task` domain exists.

The Technical Audit identifies First-Class Task as immediate common engineering and Unified My Work as following the Task foundation.

Therefore A01 creates a new common domain without absorbing or rewriting Work Request.

---

# 2. Locked invariants

- `Task != Work Request`
- Task is internal/person-level responsibility.
- WorkflowTransaction remains the formal inter-office Work Request/custody domain.
- Task may reference another source domain without owning that domain's lifecycle.
- Department-specific routing/approval/SLA/signature rules are not part of A01.
- Existing Work Request behavior must remain intact.
- Existing frontend Login/Dashboard/shell are not redesigned by backend A01 work.
- No universal mutable `WorkItem` aggregate is authorized.

---

# 3. A01 staged decomposition

## A01-W01 — Task Domain Foundation

Purpose:

Create the minimal canonical persistence/model foundation for a generic Task.

Own:

- new Task model;
- new additive tasks-table migration;
- Task domain-foundation tests.

Does NOT own:

- routes/controllers;
- policies/permissions;
- lifecycle transition service;
- Task events;
- notifications/calendar integration;
- My Work integration;
- frontend.

Expected result:

A Task can exist independently, identify creator/assignee, carry instructions/due/completion fields, and optionally reference a source domain without modifying that source.

---

## A01-W02 — Task Lifecycle & Authorization

Blocked until W01 accepted.

Purpose:

Define and enforce:

- canonical Task lifecycle;
- allowed state transitions;
- create/view/assign/reassign/act/complete/cancel/return authority as approved;
- negative authorization;
- terminal-state semantics;
- assignment visibility.

W02 may add additive schema changes if W01 intentionally deferred fields required by proven authorization/lifecycle needs.

No department-specific workflow authority may be invented.

---

## A01-W03 — Task Application / Backend Contract

Blocked until W02 accepted.

Purpose:

Expose the backend contract required by frontend/A02:

- routes/controllers/application service;
- request validation;
- response/resource/DTO contract;
- list/detail/create/action semantics;
- filters/pagination as justified;
- validation/error semantics;
- allowed-action representation;
- source-reference semantics.

### A01-C1 — FRONTEND CONTRACT RELEASE

C1 is issued only after the W03 backend contract is stable enough that frontend may consume it without guessing.

C1 must publish:

- exact backend candidate SHA;
- route/API contract;
- request/response fields;
- Task lifecycle values;
- authorization/error behavior;
- filters/pagination;
- source-reference shape;
- deprecation/migration notes;
- frontend validation assumptions.

C1 unlocks:

- A01 frontend implementation after FRONTEND-REG-001;
- bounded A02 backend architecture against stable Task identity/contract.

---

## A01-W04 — Task Events / Audit / Common Hooks

May begin after the relevant W02/W03 contracts are stable.

Purpose:

- Task event evidence;
- audit integration;
- notification/calendar hooks only where common contracts justify them;
- source-link integrity.

Must not introduce department-specific notification/SLA policy.

---

## A01-W05 — Backend Acceptance / Migration / Query Discipline

Purpose:

Prove backend A01 readiness:

- forward migration from P0/P1 source;
- rollback/recovery behavior where feasible;
- Task model/lifecycle tests;
- authorization negatives;
- query/index sanity;
- no obvious N+1 in list/detail contract;
- Work Request non-regression;
- seed/fixture compatibility where material;
- exact-candidate evidence.

---

## A01-F01 — Task Workspace Frontend

Blocked until:

- A01-C1 released;
- FRONTEND-REG-001 complete.

Frontend-owned presentation:

- Task list;
- Task detail;
- status/responsibility presentation;
- loading/empty/error/permission states;
- responsive integration into existing portal shell.

Frontend may not invent lifecycle/permissions.

---

## A01-F02 — Task Actions Frontend

Same blockers as F01.

Frontend-owned presentation:

- create;
- assign/reassign where authorized;
- state-changing actions exposed by contract;
- validation/error display;
- action availability from server contract.

---

## A01-I01 — Integrated Candidate

Maintainer-owned.

Purpose:

Integrate accepted backend/frontend candidates with overlap/contract review.

---

## A01-V01 — Exact-Candidate Validation

Required as applicable:

- locked dependency restore;
- TypeScript/build;
- migration/seed;
- Task Feature suite;
- authorization negatives;
- Work Request regression;
- runtime/browser checks;
- responsive checks;
- repository hygiene;
- evidence artifact.

---

## A01-H — Technical Acceptance / Known State

Technical Authority closes A01 only after:

- exact accepted SHA exists;
- contract is recorded;
- migrations/config are reproducible;
- frontend state is known;
- Work Request non-regression is proven;
- A02 may consume Task contract safely.

A01-H does NOT complete P1.

---

# 4. Parallelism law

Before A01-C1:

`BACKEND A01 ONLY`

After A01-C1 + FRONTEND-REG-001:

`A01 FRONTEND || A01 BACKEND CONTINUATION || BOUNDED A02 BACKEND ARCHITECTURE`

Only non-overlapping ownership may run in parallel.

---

# 5. Migration / compatibility law

A01 is additive.

W01 must not:

- rename/drop `transactions`;
- rewrite Work Request history;
- alter current My Work routes;
- change existing frontend contracts;
- squash prior migrations.

Later A01 work may integrate with those surfaces only through separately accepted packages.

---

# 6. Source-reference law

A Task may optionally reference another domain using the minimal convention already familiar to the codebase:

- `source_domain`
- `source_type`
- `source_id`

This is a reference, not lifecycle ownership.

The source domain remains authoritative for its own state.

---

# 7. A01 success definition

A01 is successful when ONE TALIBON has a real generic Task domain that:

- can be created/assigned/acted upon under server authority;
- is independently auditable;
- can reference related work without replacing it;
- is consumable by frontend through a stable contract;
- is suitable as an input to Unified My Work;
- preserves Work Request behavior;
- passes exact-candidate acceptance.

Rendering a Task page alone is not A01 completion.
