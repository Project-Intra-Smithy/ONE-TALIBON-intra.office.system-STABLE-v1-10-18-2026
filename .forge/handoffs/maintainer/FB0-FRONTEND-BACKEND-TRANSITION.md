# KIRION FORGE — ONE TALIBON V1

## FB0 — FRONTEND / UIUX → BACKEND / RUNTIME TRANSITION

### MAINTAINER HANDOFF

ROLE CALL:

**KIRION FORGE: MAINTAINER**

---

## 1. AUTHORITY

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Technical Authority:

**Kirch Ivan Balite**

Forge:

`Kirch-Nairu/KIRION-FORGE@44eb57e5b45b343be0033bf22a7a5e74d543c01a`

Accepted product:

`main@0e57508cab1a86bf4eabc1637e39b2dae6d32716`

Transition coordination branch:

`KIRCH-TALIBON-FB0-FRONTEND-BACKEND-TRANSITION`

---

## 2. ROLE

This is Maintainer authority.

The Maintainer owns:

- authority reconciliation;
- current-state documentation;
- backend reconnaissance;
- runtime/query/route/authorization audit;
- evidence classification;
- wave planning;
- handoff issuance.

The Maintainer does **not** silently become Code Writer.

---

## 3. CURRENT PROGRAM TRANSITION

Frontend/UIUX-focused UAT is accepted for transition purposes.

The engineering program now shifts to:

**BACKEND / AUTHORIZATION / PERFORMANCE / RUNTIME HARDENING**

Primary goal:

> make the application faster, more stable, faster to load/render, semantically coherent, and easier to trust.

UI/UX is now a preservation constraint, not the main development program.

Targeted frontend changes remain allowed only when required to make backend semantics truthful.

---

## 4. TIME-BOUNDED PRIORITIES

Time is limited.

Prioritize work in this order:

### P0 — correctness / authority / semantic truth

- route/controller/service/policy authority;
- direct URL authorization;
- cross-surface scope consistency;
- System Administration authority decision;
- Dashboard/Work Queue semantic mismatch;
- data leakage risks.

### P1 — load speed / backend performance

- whole-corpus materialization;
- N+1;
- duplicate aggregates;
- pagination;
- Work Queue query cost;
- Records/Documents search;
- Dashboard query cost;
- indexes only after evidence;
- server response latency.

### P2 — runtime stability / reproducibility

- PostgreSQL/test isolation;
- startup/recovery;
- Node/PHP/Composer availability;
- self-hosted Windows validation;
- browser/runtime smoke.

### P3 — governance hygiene

- stale current docs;
- branch classification;
- archival/cleanup only after explicit authority.

Do not spend the remaining time on broad cosmetic polish unless a blocking usability defect appears.

---

## 5. FIRST REQUIRED PHASE — E0

Before Code Writer implementation, close exact-machine evidence gaps.

E0 must be read-only to product source unless a separately authorized infrastructure evidence branch is required.

Verify:

- exact main SHA;
- clean audit checkout/worktree;
- UAT checkout untouched;
- UAT database untouched;
- DEVKRTZ runner execution context;
- PowerShell;
- Git;
- PHP 8.4;
- pdo_pgsql;
- pgsql;
- Composer;
- Node;
- npm;
- PostgreSQL test connectivity;
- Playwright/Chromium;
- test-db migration state;
- read-only UAT-db migration/schema state;
- PostgreSQL timezone;
- exact-machine representative backend tests;
- representative query plans;
- isolated runtime port 18000.

Absolute database rule:

No destructive command until the process proves:

`DB_DATABASE == talibon_portal_test`

---

## 6. BACKEND AUDIT TARGETS

Audit:

- all protected route families;
- controller mutation boundaries;
- FormRequests;
- Policies/Gates/access deciders;
- transaction capability composition;
- Dashboard projections;
- Work Queue projections;
- Correspondence;
- Records;
- Documents;
- Memoranda;
- Messaging;
- Department Workspace;
- Mayor Office;
- System Administration;
- HRIS;
- Property;
- Legislative;
- Travel;
- Notifications;
- search;
- database schema/indexes;
- query counts;
- pagination/materialization;
- runtime error/recovery behavior.

---

## 7. KNOWN PRIORITY FINDINGS

### SEM-01

Department Head dashboard attention composition can present personal work under an office-scoped card/link.

Audit/repair semantic composition, not office queue authority.

### PERF-01

`DocumentArchiveQuery` full-corpus materialization before filtering/pagination.

Confirmed backend performance target.

### AUTH-01

System Administration Work Queue metadata says municipal while actual RC2 Work Queue behavior is personal-scoped.

### AUTH-02

System Administration generic transaction authority remains municipality-wide and mutation-capable under historical authorization.

Technical Authority decision required before redesign.

### PROD-01

Executive Work Queue is executive-only.

No automatic repair.

Technical Authority decides whether to preserve or add personal accountability.

### MSG-01

Prototype message channels do not currently enforce participant membership.

Technical Authority decides whether channels remain open prototype groups or become protected audiences.

### CI-01

Current workflows are Ubuntu/Linux/container oriented.

Do not directly point them at the Windows runner.

---

## 8. PERFORMANCE RULE

Do not optimize by intuition.

For every performance change, identify:

- current query/materialization shape;
- current bounded/unbounded behavior;
- representative data volume;
- baseline evidence;
- proposed change;
- before/after evidence;
- regression gate.

Prefer removing unnecessary work before adding caching.

Prefer correct database pagination before in-memory pagination.

Prefer measured index changes before speculative index accumulation.

---

## 9. ANTI-DRIFT GATE

Before every writer/reviewer/acceptance transition:

1. fetch/re-read live main;
2. record exact base SHA;
3. record current role;
4. state allowed paths/systems;
5. state forbidden mutations;
6. state evidence inherited and why;
7. stop on mismatch.

No code wave from chat prose alone.

---

## 10. REQUIRED MAINTAINER RETURN

After E0 + backend audit, return:

1. exact authority snapshot;
2. route/authorization matrix;
3. backend architecture map;
4. data/scope semantic map;
5. query/performance findings;
6. database/index findings;
7. runtime/reproducibility findings;
8. self-hosted runner evidence;
9. UAT/backend reconciliation;
10. findings register;
11. bounded implementation plan;
12. exact proposed writer branches/bases;
13. test gates;
14. Reviewer/Acceptance requirements;
15. Maintainer disposition.

Allowed dispositions:

- `AUDIT CLEAN — NO BACKEND WAVE REQUIRED`
- `AUDIT COMPLETE — BOUNDED REPAIR WAVES REQUIRED`
- `AUDIT COMPLETE — ARCHITECTURE CORRECTION PROGRAM REQUIRED`
- `ADDITIONAL EVIDENCE REQUIRED`

---

## 11. FORBIDDEN DURING FB0/E0

- no product-source repair;
- no main mutation;
- no UAT DB mutation;
- no destructive command against `talibon_portal`;
- no branch deletion;
- no force push;
- no rebase/squash reconstruction;
- no governance rewrite of historical evidence;
- no release/production claims from runner registration alone.

---

## 12. END STATE

The transition is complete only when:

- repository current authority matches live Git;
- UI/UX closeout is durably recorded;
- backend program goals are durably recorded;
- exact-machine evidence gaps are classified;
- backend writer work is issued through bounded Forge handoffs rather than chat memory.
