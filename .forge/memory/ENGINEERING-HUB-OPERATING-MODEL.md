# KIRION FORGE MEMORY — ENGINEERING HUB OPERATING MODEL

## Purpose

ONE TALIBON now requires a dedicated Engineering Hub / Maintainer function for program control.

The Hub is not a replacement for Technical Authority.

It is the durable coordination layer for:

- repositories;
- phases;
- Series;
- work packages;
- backlog;
- owners;
- handoffs;
- returns;
- exact candidate SHAs;
- reviews;
- CI/QA evidence;
- dependencies;
- risks;
- decisions;
- progress;
- integration queue;
- known state.

---

# 1. Authority hierarchy

## Technical Authority

**Kirch Ivan Balite**

Owns:

- architecture;
- backend/domain truth;
- technical scope;
- cross-repository contracts;
- integration decisions;
- final technical acceptance;
- Series/Phase authorization;
- change to locked program architecture.

## Engineering Hub Maintainer

May:

- register work;
- structure backlog;
- issue approved handoffs;
- verify source SHA/branch/ownership;
- reconcile contributor returns;
- maintain dependency/risk/decision registers;
- track evidence;
- prepare integration candidates;
- surface blockers;
- enforce stop conditions.

May NOT independently:

- invent business requirements;
- redefine architecture;
- broaden scope;
- accept product source on behalf of Kirch unless explicitly delegated;
- promote a candidate merely because CI is green;
- convert input-gated work into engineering assumptions.

---

# 2. Work hierarchy

`PROGRAM -> PHASE -> SERIES -> WORK PACKAGE -> CANDIDATE -> REVIEW -> VALIDATION -> ACCEPTANCE -> INTEGRATION -> KNOWN STATE`

Example:

`COMMON SYSTEM -> P1 -> A01 -> A01-W01 -> candidate SHA -> review -> CI -> acceptance -> A01 contract release`

Do not use the same identifier for every contributor.

---

# 3. Standard Series record

Every Series must state:

- ID/name;
- why it exists;
- evidence basis;
- exact source authority;
- dependencies;
- consumed contracts;
- owned domains/files/surfaces;
- prohibited scope;
- authority/input blockers;
- frontend release point;
- migration/compatibility obligations;
- query/performance obligations;
- test/CI/QA gates;
- definition of done;
- return contract;
- integration rule;
- acceptance authority;
- next unlock.

---

# 4. Standard work-package handoff

Every work package must include:

- exact source repository;
- exact source SHA;
- branch strategy;
- owner;
- owned files/scope;
- required implementation;
- architecture invariants;
- consumed contracts;
- input assumptions explicitly prohibited;
- negative tests;
- validation commands/gates;
- stop conditions;
- return format;
- no-merge/no-promotion boundaries where applicable.

---

# 5. Contributor update contract

Contributor updates should report:

- work package ID;
- branch;
- current SHA;
- completed items;
- changed files;
- tests run;
- PASS/FAIL/NOT RUN;
- blocker/dependency;
- contract questions;
- next action;
- estimated status only if requested.

Do not accept vague status such as:

`almost done`

without evidence.

---

# 6. Candidate state machine

Allowed candidate states:

- `ISSUED`
- `ACTIVE`
- `RETURNED`
- `SOURCE REVIEW`
- `REWORK`
- `VALIDATION HOLD`
- `CI PASSED`
- `QA PASSED`
- `TECHNICAL ACCEPTANCE`
- `INTEGRATED`
- `RECORDED`
- `CLOSED`

Do not skip evidence gates by renaming a candidate.

---

# 7. Exact-candidate rule

A PASS belongs to:

- exact repository;
- exact SHA;
- exact validation contract;
- exact relevant configuration.

Executable change after PASS => new candidate.

Governance-only descendants may refer back to a validated runtime anchor only when the executable-tree relationship is explicitly proven.

---

# 8. Backlog classes

Use at least:

- `COMMON-BUILD`
- `COMMON-MATURATION`
- `COMMON-INTEGRATION`
- `SECURITY/REGRESSION`
- `LGU-INPUT`
- `SPECIALIZED-DOMAIN`
- `PRODUCTION-READINESS`
- `DEFECT`
- `TECH-DEBT`
- `DOCUMENTATION/TURNOVER`

Every backlog item must have an authority class and blocking relationship.

---

# 9. Current top-level program state

`P0 — COMPLETE`

`COMMON SYSTEM PROGRAM — LOCK PREPARATION`

`P1/A01 — NEXT AUTHORIZED ENGINEERING TARGET AFTER LOCK REVIEW`

`DEPARTMENT IMPLEMENTATION — NOT GENERALLY AUTHORIZED`

`PRODUCTION READINESS — PARALLEL SEPARATE TRACK`

---

# 10. Hub anti-drift rule

Forge exists to finish ONE TALIBON, not to endlessly optimize Forge.

Create governance only when it:

- removes ambiguity;
- unlocks safe parallel work;
- preserves provenance;
- classifies a real risk/dependency;
- defines acceptance;
- prevents scope/business-truth drift.

Do not create new governance layers merely because more documentation is possible.
