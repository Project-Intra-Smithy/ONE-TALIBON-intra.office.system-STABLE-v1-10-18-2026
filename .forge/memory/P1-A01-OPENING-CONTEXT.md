# KIRION FORGE MEMORY — P1 / A01 OPENING CONTEXT

## Status

`PRE-EXECUTION CONTEXT — NO CODE WRITER ISSUED YET`

This record exists so A01 implementation begins from the locked program rather than reconstructing context from chat/history.

---

# 1. Source authority

Backend repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Current accepted baseline:

`main@4bac88d22e1fb3f808c024888845503922c41683`

Validated executable anchor carried by P0-H:

`395438674b4d2f00659eba616db760b339bb390a`

Program lock branch:

`KIRCH-TALIBON-COMMON-SYSTEM-PROGRAM-LOCK`

A01 implementation branch must not be created until this program-lock package is reviewed/accepted.

---

# 2. Why A01 is first

The governing Technical Audit identifies:

- First-Class Task as immediate engineering;
- Unified My Work as following the Task foundation.

Live source confirms:

- strong Work Request / WorkflowTransaction domain exists;
- current My Work is real but transaction-backed;
- no generic canonical Task model/controller/route exists;
- specialized HR task artifacts do not satisfy the common Task requirement.

Therefore A01 is a source-backed missing common domain, not a speculative new feature.

---

# 3. A01 purpose

Create a generic internal/person-level Task domain for ONE TALIBON.

A Task represents personal/internal responsibility.

It does not replace:

- Work Request / WorkflowTransaction;
- Correspondence;
- Document;
- Meeting.

---

# 4. Required A01 invariants

At minimum:

- Task has an independent canonical identity;
- Task lifecycle is explicit and not borrowed blindly from WorkflowTransaction;
- server-side authorization defines create/view/assign/reassign/act/complete/cancel/return semantics as actually approved;
- assignee/responsibility is explicit;
- due/priority semantics are bounded and testable;
- Task can reference related work without owning that source domain;
- audit/event evidence exists;
- migration is forward-safe from P0;
- existing Work Request behavior remains unchanged unless a separately authorized integration change requires otherwise.

Do not invent department-specific approval or routing logic.

---

# 5. A01 staged execution model

Recommended internal staging:

## A01-W01 — Domain / persistence / invariants
Backend authority.

## A01-W02 — Authorization / lifecycle / negative cases
Backend + security authority.

## A01-W03 — Application service / route / request-response contract
Backend authority.

## A01-C1 — FRONTEND CONTRACT RELEASE
Unlock point.

Must publish:

- route/API contract;
- DTO/response shape;
- validation/error semantics;
- lifecycle/status values;
- allowed actions presentation contract;
- pagination/filter contract where relevant;
- source-reference contract;
- exact backend candidate SHA/version.

## A01-W04 — events / audit / notification/link hooks
Backend continuation.

## A01-W05 — Feature/security/migration/query acceptance
Backend validation.

## A01-F01/F02 — frontend implementation
Only after A01-C1 and FRONTEND-REG-001.

## A01-I01 — integration candidate

## A01-V01 — exact-candidate CI/runtime/responsive validation

## A01-H — technical acceptance / known-state publication

This internal decomposition is a planning recommendation until the Maintainer issues the exact work-package handoffs.

---

# 6. Frontend state

Existing frontend repo:

`Kirch-Nairu/Talibon-Intra-Office-Portal`

Observed main:

`a7d7be17feb435b50c52cacd063e11d92ad047e1`

Frontend implementation is blocked only on:

- A01-C1 contract release;
- FRONTEND-REG-001 exact integration-base reconciliation.

A01 backend work does not wait for frontend synchronization.

---

# 7. A02 parallelization rule

Kirch may begin bounded A02 backend architecture after A01-C1 releases a stable Task identity/contract.

Frontend may implement A01 at the same time.

Allowed parallelism:

`A01 FRONTEND || A01 BACKEND CONTINUATION || A02 BACKEND ARCHITECTURE`

provided contracts and ownership do not overlap unsafely.

A02 frontend remains blocked until its own contract release.

---

# 8. A01 stop conditions

Stop and return to Technical Authority if A01 appears to require:

- replacing WorkflowTransaction;
- changing department-specific routing;
- inventing final LGU role truth;
- universal WorkItem abstraction;
- generic workflow DSL;
- Procurement/Project Monitoring logic;
- Full HRIS expansion;
- production deployment changes;
- frontend redesign outside the Task integration scope;
- schema-history rewrite;
- destructive migration against protected data;
- assumption of unsupported SLA/approval/signature behavior.

---

# 9. A01 acceptance posture

A01 is not complete because Task pages render.

A01 must prove:

`IMPLEMENTED + COMMITTED + SELF-VALIDATED + REVIEWED + CI PASSED + QA/ACCEPTANCE AS REQUIRED + TECHNICAL AUTHORITY ACCEPTED + INTEGRATED + RECORDED`

Exact gates are issued with the work package.

A01 acceptance does not mean P1 is complete; A02/A03/A04 remain.
