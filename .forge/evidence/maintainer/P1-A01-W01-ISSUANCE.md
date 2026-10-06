# KIRION FORGE: MAINTAINER — P1/A01 OPENING & W01 ISSUANCE

## Canonical source

`main@f2ff373113f89173016634505eb3c3943edfb35c`

## Coordination

`KIRCH-TALIBON-P1-A01-FIRST-CLASS-TASK`

## Series

`A01 — FIRST-CLASS TASK DOMAIN`

## Writer issued

`A01-W01 — TASK DOMAIN FOUNDATION`

Writer branch:

`KIRCH-TALIBON-P1-A01-W01-TASK-DOMAIN-FOUNDATION`

Immutable writer source:

`ddbcf2a2715315c0e9998a7bcfdd9414edb3acd4`

## Governing files

- `.forge/plans/P1-A01-FIRST-CLASS-TASK-SERIES-PLAN.md`
- `.forge/handoffs/code-writer/A01-W01-TASK-DOMAIN-FOUNDATION.md`

## Scope boundary

W01 is the only active A01 implementation lane.

It owns only:

- new Task model;
- new additive tasks-table migration;
- focused Task domain-foundation test;
- optional TaskFactory if strictly required by the test.

No Work Request/My Work/frontend/route/policy/service/event mutation is authorized.

## Next gate

W01 must return an exact candidate SHA.

Maintainer then performs:

1. lineage verification;
2. changed-file ownership audit;
3. source review;
4. focused validation evidence review;
5. ACCEPT / REWORK / VALIDATION HOLD decision.

A01-W02 remains blocked until W01 is accepted.
