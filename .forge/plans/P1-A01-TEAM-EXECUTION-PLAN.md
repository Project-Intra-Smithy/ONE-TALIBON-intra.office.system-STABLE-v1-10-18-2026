# KIRION FORGE — P1 / A01 TEAM EXECUTION PLAN

## Authority

Technical Authority:

**Kirch Ivan Balite**

Maintainer:

**ChatGPT / KIRION Forge Maintainer under Kirch authority**

Canonical product repository:

`Project-Intra-Smithy/Talibon-Sales-Prototype` (canonical; former owner path is historical)

Plan publication base:

`main@ffdf1dec10a0417d4982887a19f49ba771dd953f`

Accepted executable/runtime anchor:

`395438674b4d2f00659eba616db760b339bb390a`

Project V1.1 acceptance evidence (historical):

`Project-Intra-Smithy/engineering-hub#10 comment 6028829426 — PASS`

Project V1.2 roadmap staging / usability rework: `PASS / ACCEPTED / CLOSED` — Hub #10 final acceptance comment `6036463032`.

Kirch's historical decision (08 October 2026): `ACCEPT A01 PLAN — RELEASE W01`. Current accepted state and separate C1 gate are recorded below.

---

## Verified current A01 release state — 09 October 2026

**Current integrated backend:** `Project-Intra-Smithy/Talibon-Sales-Prototype@0573680696c8bd6fb421d625b5e7dc2c37cb1905` ([merged W03 PR #31](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/pull/31)); PR #31 accepted source `f38c1f5f76d837e21a5e750e329d82c323ceb7e4`, integration tree identical, 4 scoped paths. [Kurt exact-integrated-main CI #37889890224](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/actions/runs/37889890224) **PASS: 46 tests / 378 assertions** (W03 HTTP, independent PostgreSQL race, W02, W01, Work Request). This is a *bounded* validation, not whole-A01 CI/QA.

| Existing control | Current disposition |
| --- | --- |
| [A01 plan #1](https://github.com/Project-Intra-Smithy/engineering-hub/issues/1) | CLOSED / accepted |
| [A01-W01 #2](https://github.com/Project-Intra-Smithy/engineering-hub/issues/2) | CLOSED / accepted, merged, CI PASS |
| [A01-W02 #18](https://github.com/Project-Intra-Smithy/engineering-hub/issues/18) | CLOSED / accepted, merged, CI PASS |
| [A01-W03 #19](https://github.com/Project-Intra-Smithy/engineering-hub/issues/19) | CLOSED / accepted, merged, post-merge CI PASS |
| [A01-C1 #20](https://github.com/Project-Intra-Smithy/engineering-hub/issues/20) | OPEN / contract NOT released; error/CSRF/MFA browser contract remains to be verified |
| [A01-W04 #21](https://github.com/Project-Intra-Smithy/engineering-hub/issues/21), [A01-W05 #22](https://github.com/Project-Intra-Smithy/engineering-hub/issues/22), frontend, [formal CI01 #26](https://github.com/Project-Intra-Smithy/engineering-hub/issues/26), [independent QA01 #27](https://github.com/Project-Intra-Smithy/engineering-hub/issues/27) | STAGED / not accepted or released |

**GitHub Projects:** W03 #19 custom `Status=Closed`, `Next=PR #31 merged; exact-main post-merge CI PASS — complete` verified by authenticated human UI screenshots after refresh on 09 October 2026, **not** independently via Projects API. C1/CI01/QA remain Intake. Live Projects UI is a distinct authority from issue state.

**Authority:** Kirch owns package release, integration, and final acceptance. This reconciliation changes **documentation only** and does not grant C1, W04, W05, municipal official-Task privileges, formal A01-CI01/QA, or production deployment. Earlier W01/W02 release statements below are retained as historical snapshots, not active instructions.

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

# 4. Team execution model

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

- team control model merged;
- Project V1.1 PASS;
- human-friendly Project views active;
- A01-W01 is released by Kirch's separate explicit acceptance decision;
- no implementation candidate exists and no W01 validation is claimed.

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

### Replacement branch strategy — accepted W01 release

The prepared replacement branch is:

`KIRCH-TALIBON-P1-A01-W01-TASK-DOMAIN-FOUNDATION-R2`

The release-control branch is:

`KIRCH-TALIBON-A01-W01-RELEASE-CONTROL`

M2: merge a reviewed, documentation-only release-control PR into `main`.

M3: re-resolve product `main`, verify R2 has no implementation commits and safely fast-forward R2 to accepted `main` without force. Record its final exact writer-source SHA in Hub issue #2; resolve exact Git state rather than guessing a SHA in advance.

M4: publish Kirch's decision in Hub #1, release Hub #2 as Active, and synchronize Project #1/#2 fields through an authorized Projects-v2-capable surface. Do not claim a Project field update if that surface is unavailable.

M5: issue a bounded Kirion-Jane Code Writer handoff under Kirch's human ownership and stop; no W01 code is written during Maintainer bootstrap.

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

# 8. Historical W01 release state — superseded by current A01 status above

Project V1.1:

`PASS / CLOSED`

A01 plan:

`ACCEPTED — KIRCH TECHNICAL AUTHORITY`

A01 Series:

`ACTIVE`

A01-W01:

`RELEASE AUTHORIZED — CODE WRITER HANDOFF PENDING`

Human owner: `KIRCH`

Historical W01 branch:

`IMMUTABLE PROVENANCE / DO NOT RESUME`

Replacement W01 branch:

`KIRCH-TALIBON-P1-A01-W01-TASK-DOMAIN-FOUNDATION-R2` — writer-source SHA resolved only after M2 merge and M3 fast-forward.

A01 implementation candidate:

`NONE`

Project staging: `PASS / ACCEPTED / CLOSED` (Hub #10).

Repository promotion: `DEFERRED` until Kirch explicitly reauthorizes it.

This release authorizes bounded W01 preparation/implementation after exact-source issuance. It does not create a candidate, inherit P0 validation, authorize W02, or release frontend Task work.

---

# 9. Historical W01 execution action — superseded by current A01 status above

Technical Authority decision is complete: `ACCEPT A01 PLAN — RELEASE W01`.

Maintainer must first synchronize the release-control PR and safely fast-forward the existing R2 replacement branch. After recording the exact writer-source SHA, update Hub issue #1/#2, publish the current team bulletin, and issue the bounded Code Writer handoff to Kirion-Jane. Project #1/#2 custom fields require independent Project API/UI confirmation.

Stop Maintainer execution after handoff. Do not implement W01 in this turn, do not start W02, and do not merge the future W01 candidate to `main` without its own validation/acceptance evidence.
