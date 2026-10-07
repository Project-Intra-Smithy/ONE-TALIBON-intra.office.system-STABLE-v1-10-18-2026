# ONE TALIBON — FORGE HANDOFF CONTINUITY

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
