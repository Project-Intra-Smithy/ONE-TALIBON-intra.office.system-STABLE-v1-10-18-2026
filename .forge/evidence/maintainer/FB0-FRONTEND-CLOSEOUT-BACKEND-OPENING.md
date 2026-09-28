# FB0 — FRONTEND / UIUX CLOSEOUT AND BACKEND OPENING

## Purpose

FB0 records the transition from the UI/UX-focused RC2/UAT period into backend/runtime hardening.

The preceding frontend session advanced product source, UAT and decisions faster than the repository's current governance pointers were reconciled. That created authority lag and made chat context temporarily more current than Git governance.

FB0 exists to end that condition before backend implementation begins.

## Opening authority

At FB0 opening:

- repository `main = 0e57508cab1a86bf4eabc1637e39b2dae6d32716`;
- accepted application/runtime payload anchor = `0e57508cab1a86bf4eabc1637e39b2dae6d32716`;
- Forge = `44eb57e5b45b343be0033bf22a7a5e74d543c01a`;
- open PRs observed = `0`;
- remote branches observed = `31 including main`.

These are historical opening observations.

A governance-only promotion may later advance repository `main` while leaving the accepted application/runtime payload unchanged.

## Acceptance rework

The first FB0 candidate:

`9bb41e812acfce24c421f312ee3b940faaf47e9f`

received Reviewer disposition:

`SUITABLE FOR ACCEPTANCE WITH RECORDED LIMITATIONS`

but Acceptance returned:

`REJECT / RETURN FOR REWORK`

The blocker was governance promotion stability.

The rejected candidate treated `main@0e57508...` and the accepted application/runtime payload anchor as though they were permanently the same authority.

That would become false immediately after promoting governance-only FB0 commits.

REWORK-01 corrects this by separating:

1. live repository authority — resolve current `main` HEAD from Git;
2. accepted application/runtime payload anchor — `0e57508cab1a86bf4eabc1637e39b2dae6d32716`.

No application/runtime behavior is changed by this correction.

## Frontend/UIUX disposition

The Technical Authority accepts the current UI/UX-focused local UAT pass for frontend→backend transition purposes.

Current presentation is sufficiently usable to stop broad UI polish as the primary engineering program.

The current role-aware workspace behavior remains the presentation baseline.

This UAT does not establish backend acceptance, production readiness, or commercial completion.

## Backend program

Time is limited.

Primary engineering focus becomes:

`BACKEND / AUTHORIZATION / PERFORMANCE / RUNTIME HARDENING`

Priority:

1. make backend semantics consistent and understandable;
2. enforce server-side route/action authority correctly;
3. reduce server/query cost and load time;
4. replace unbounded materialization with bounded database work;
5. preserve pagination and authorization truth;
6. measure PostgreSQL behavior before index changes;
7. harden runtime startup/recovery;
8. validate safely on the Windows development host;
9. preserve current UI/UX unless backend truth requires a targeted presentation correction.

## Known opening findings

### SEM-01

Dashboard attention composition can mix personal attention with office/executive-scoped presentation.

### PERF-01

`DocumentArchiveQuery` loads the full document corpus before authorization/filtering/pagination.

### AUTH-01

System Administration Work Queue metadata says municipal while the current repaired Work Queue path is personal-scoped.

### AUTH-02

System Administration retains broader historical generic transaction authority. Policy intent requires Technical Authority.

### PROD-01

Executive Work Queue remains executive-only. This is current product behavior, not a proven defect.

### MSG-01

Prototype named channels do not enforce channel membership.

### CI-01

Current workflows are Linux/container oriented. `DEVKRTZ` is not yet validation authority.

## Anti-drift result

From FB0 forward:

- exact live Git is re-resolved at every phase transition;
- repository HEAD and product payload anchor are kept separate;
- every new program receives repository-local authority;
- writer waves name exact bases and bounded ownership;
- Reviewer/Acceptance returns become durable evidence;
- chat context does not replace Git authority.

## Transition result

FB0 closes broad frontend/UIUX work as the primary engineering focus and opens backend/runtime hardening.

No product implementation is authorized by this record.
