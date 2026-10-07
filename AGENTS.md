# AGENTS.md — ONE TALIBON CURRENT GOVERNANCE

## Human authority

Technical Authority: **Kirch Ivan Balite**

Engineering team:
- Kirch — Tech Lead / Systems Architecture / Backend / integration / final technical acceptance
- AJ — Frontend
- Jhayr — Frontend
- Kurt — CI/CD / Development Operations
- Siris — Quality Assurance

KIRION Forge / ChatGPT may assist, but does not replace human ownership or any human acceptance gate.

## Current execution gate

Before acting, resolve live `main` directly from Git and then read:

1. `.forge/SSOT_CURRENT.md`
2. `.forge/AUTHORITY.md`
3. `.forge/WORK_LEDGER.md`
4. `.forge/VALIDATION.md`
5. the current Series plan
6. the explicitly current bounded handoff, if one has been issued

Current program: **P1 — Common Work & Accountability**

Current Series: **A01 — First-Class Task Domain**

Current Technical Authority decision: **A01 team execution plan review**

A01-W01: **BLOCKED / SUSPENDED — DO NOT EXECUTE**

A01 implementation candidate: **NONE**

Historical W01 branch:

`KIRCH-TALIBON-P1-A01-W01-TASK-DOMAIN-FOUNDATION@ddbcf2a2715315c0e9998a7bcfdd9414edb3acd4`

State: **HISTORICAL / IMMUTABLE / DO NOT RESUME**

If W01 is later released, it requires a fresh replacement branch from then-current product `main` and a new exact issued source.

## Work hierarchy

`PROGRAM -> PHASE -> SERIES -> HUMAN LANE WORK PACKAGE -> EXACT CANDIDATE / RELEASE TUPLE -> CI/CD -> QA -> KIRCH ACCEPTANCE -> INTEGRATION`

A backend Wxx package is subordinate to the Series and is not itself Series acceptance.

## Human ownership rule

Every executable work package must name a human owner.

- implementation is owned by the assigned human developer;
- Kurt owns CI/CD evidence unless a different human CI owner is explicitly authorized;
- Siris owns independent QA evidence unless a different human QA owner is explicitly authorized;
- Kirch owns scope, architecture, integration and final technical acceptance.

AI may assist these lanes but may not self-award their decisions.

## Exact-candidate rule

A PASS belongs to the exact candidate SHA or exact cross-repository release tuple that was actually validated.

Executable source changes after a PASS create a new candidate and require affected downstream revalidation.

CI PASS != QA PASS.

QA PASS != Kirch acceptance.

## LGU / process-authority rule

Do not invent municipal routing, approval, signatory, SLA, escalation, confidentiality, KPI, role, department or workflow rules.

Documents, screenshots, historical code, Citizens' Charter material and prototypes may support discovery. They do not replace validated LGU/process-owner business truth when that truth is material.

## Safety / stop rules

- Do not weaken authentication, authorization or audit controls for convenience.
- Do not run destructive tests against protected databases.
- Do not treat frontend state as server authority.
- Do not infer current authority from a historical handoff or a directory named `active`.
- Stop on source, contract, authority or ownership contradiction.
- Do not start A01-W01 until Kirch explicitly releases it and a fresh exact writer source is issued.
