# ONE TALIBON — FORGE HANDOFF CONTINUITY

## Nov 6 Siris takeover — current pointer (pending docs-only merge)

**Current technical lead delegation:** [Hub #162](https://github.com/Project-Intra-Smithy/engineering-hub/issues/162) appoints Siris as Acting Technical Lead effective 2026-11-06; [current source-state and stale-claim overlay](../memory/SIRIS_ACTING_TECH_LEAD_TAKEOVER_2026-11-06.md). Product main as verified at appointment: `ec17cbfab2a52b55e4f3f45bd5ec199df3858d66`. Existing QA is [Hub #161](https://github.com/Project-Intra-Smithy/engineering-hub/issues/161), not automatically passed. Read exact live Git before acting; original `.forge/SSOT_CURRENT.md`, `WORK_LEDGER.md`, and historical `active/` packages have dated assumptions. This pointer confers **no** source-write lease, new roles, CI green, release approval or disabled security gate. It is canonical only after the reviewed docs-only PR merges and crosslinks to #162.

---


This directory preserves durable handoff packets, returns and execution provenance.

## Current execution authority

A handoff is **not current merely because the file exists**.

Before executing any repository handoff:

1. resolve live Git and the exact source;
2. read `.forge/SSOT_CURRENT.md`;
3. read `.forge/WORK_LEDGER.md`;
4. read the current Series plan;
5. confirm that the handoff is explicitly current/issued by the present control state or Technical Authority;
6. stop if its source, ownership, scope, dependency or state conflicts with stronger current authority.

A stale or historical handoff must not be silently rebased, resumed or reinterpreted.

## Important: `active/` is a historical path name

The directory `.forge/handoffs/active/` is retained for provenance from earlier Forge programs.

Its name does **not** mean every file inside it is currently executable.

Many records under that path describe completed, superseded, frozen or historical work. Current executable authority comes only from the current SSOT/ledger/Series plan plus an explicitly current issued handoff.

Do not delete historical handoffs merely to make the directory look current.

## Minimum writer handoff record

A writer handoff should identify:

- Forge/assistant role;
- human owner;
- target repository;
- exact source branch and SHA;
- writer branch name;
- owned files/directories;
- explicit non-owned boundaries;
- accepted decisions/contracts relevant to the package;
- required behavior;
- required validation;
- known evidence limitations;
- stop conditions;
- expected return format.

## Minimum writer return

A writer return should identify:

- exact candidate SHA;
- changed scope summary;
- tests/checks actually run;
- checks not run and why;
- known limitations;
- authority returned to Maintainer / Technical Authority.

## Conflict rule

Handoff text never overrides directly observed Git authority or a stronger current Technical Authority record.

If the source moved unexpectedly or current authority contradicts the handoff, stop and return for reconciliation instead of silently rebasing or proceeding.
