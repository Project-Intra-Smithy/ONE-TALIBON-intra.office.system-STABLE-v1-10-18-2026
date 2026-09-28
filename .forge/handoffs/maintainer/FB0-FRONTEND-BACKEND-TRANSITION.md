# KIRION FORGE — ONE TALIBON V1

## FB0 — FRONTEND / UIUX → BACKEND / RUNTIME TRANSITION

### MAINTAINER HANDOFF

ROLE CALL:

**KIRION FORGE: MAINTAINER**

## 1. Authority

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Technical Authority:

**Kirch Ivan Balite**

Forge:

`Kirch-Nairu/KIRION-FORGE@44eb57e5b45b343be0033bf22a7a5e74d543c01a`

FB0 opening repository main:

`main@0e57508cab1a86bf4eabc1637e39b2dae6d32716`

Accepted application/runtime payload anchor:

`0e57508cab1a86bf4eabc1637e39b2dae6d32716`

For every later execution:

`RESOLVE CURRENT MAIN LIVE FROM GIT`

Do not assume repository HEAD remains equal to the application/runtime payload anchor after governance-only promotion.

## 2. Role

Maintainer owns authority reconciliation, audit, evidence classification, planning and handoff issuance.

Maintainer does not silently become Code Writer.

## 3. Program transition

UI/UX-focused UAT is accepted for transition purposes.

Primary engineering program becomes:

`BACKEND / AUTHORIZATION / PERFORMANCE / RUNTIME HARDENING`

Goal:

> make the application faster, more stable, faster to load/render, semantically coherent, and easier to trust.

Broad visual polish is no longer the primary program.

## 4. Time-bounded priorities

### P0 — correctness / authority

- routes/controllers/services/policies;
- direct URL authorization;
- cross-surface scope truth;
- System Administration authority decision;
- Dashboard/Work Queue semantics;
- leakage risks.

### P1 — performance

- whole-corpus materialization;
- N+1;
- duplicate aggregates;
- pagination;
- Work Queue cost;
- Records/Documents search;
- Dashboard cost;
- measured indexes;
- server response latency.

### P2 — runtime / reproducibility

- PostgreSQL isolation;
- startup/recovery;
- Node/PHP/Composer availability;
- Windows self-hosted validation;
- browser/runtime smoke.

### P3 — governance hygiene

- stale current docs;
- branch classification;
- cleanup only with explicit authority.

## 5. E0 — exact-machine evidence closure

Before Code Writer implementation, re-resolve:

- exact live repository `main`;
- exact application/runtime payload anchor;
- exact diff between them.

If that delta is governance-only, inherited application evidence may remain eligible.

Then verify:

- clean audit checkout;
- UAT checkout untouched;
- UAT DB untouched;
- DEVKRTZ execution context;
- PowerShell/Git;
- PHP 8.4 + pdo_pgsql/pgsql;
- Composer;
- Node/npm;
- PostgreSQL test connectivity;
- Playwright/Chromium;
- test DB migration state;
- read-only UAT DB migration/schema state;
- timezone;
- representative backend tests/query plans;
- isolated runtime port 18000.

No destructive operation until the process proves:

`DB_DATABASE == talibon_portal_test`

## 6. Known priority findings

- `SEM-01` — Dashboard attention scope/presentation mismatch.
- `PERF-01` — DocumentArchiveQuery full-corpus materialization.
- `AUTH-01` — System Administration Work Queue metadata mismatch.
- `AUTH-02` — broader System Administration transaction authority requires Technical Authority decision.
- `PROD-01` — executive-only Work Queue is current behavior, not automatic defect.
- `MSG-01` — prototype channels do not enforce participant membership.
- `CI-01` — current workflows are Linux/container oriented.

## 7. Performance rule

Do not optimize by intuition.

For every performance change identify current query shape, bounded/unbounded behavior, representative volume, baseline evidence, proposed change, before/after evidence, and regression gate.

Prefer removing unnecessary work before caching.

Prefer database pagination before in-memory pagination.

Prefer measured index changes before speculative indexes.

## 8. Promotion-stability / anti-drift gate

Before each Writer/Reviewer/Acceptance transition:

1. fetch live `main`;
2. record exact repository HEAD;
3. record exact application/runtime payload anchor;
4. prove whether the delta is governance-only or product-affecting;
5. state role;
6. state allowed paths/systems;
7. state forbidden mutations;
8. state inherited evidence and inheritance basis;
9. stop on mismatch.

No code wave from chat prose alone.

## 9. Required Maintainer return after E0 + audit

Return:

1. repository authority snapshot;
2. application/runtime payload anchor;
3. route/authorization matrix;
4. backend architecture map;
5. data/scope semantic map;
6. query/performance findings;
7. database/index findings;
8. runtime/reproducibility findings;
9. self-hosted runner evidence;
10. UAT/backend reconciliation;
11. findings register;
12. bounded implementation plan;
13. exact writer branches/bases;
14. test gates;
15. Reviewer/Acceptance requirements;
16. Maintainer disposition.

Allowed disposition:

- `AUDIT CLEAN — NO BACKEND WAVE REQUIRED`
- `AUDIT COMPLETE — BOUNDED REPAIR WAVES REQUIRED`
- `AUDIT COMPLETE — ARCHITECTURE CORRECTION PROGRAM REQUIRED`
- `ADDITIONAL EVIDENCE REQUIRED`

## 10. Forbidden during FB0/E0

- no product-source repair;
- no UAT DB mutation;
- no destructive command against `talibon_portal`;
- no branch deletion;
- no force push;
- no rebase/squash reconstruction;
- no rewriting historical evidence;
- no release/production claim from runner registration alone.

## 11. End state

The transition is complete only when current governance remains truthful after promotion, live repository HEAD is resolved from Git rather than assumed from a historical payload SHA, and backend writer work begins only through bounded Forge handoffs.
