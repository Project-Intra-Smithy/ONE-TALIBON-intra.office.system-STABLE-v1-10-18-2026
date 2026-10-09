# AGENTS.md — ONE TALIBON CURRENT GOVERNANCE

## Mandatory issue + repository memory pair — read before doing work

**No new work package starts, and no package is declared closed, without two crosslinked records:** the owning GitHub issue's START/CLOSE decision and the owning repository's committed START/CLOSE memory entry. Read [`.forge/memory/WORK-PACKAGE-START-CLOSE-PROTOCOL.md`](.forge/memory/WORK-PACKAGE-START-CLOSE-PROTOCOL.md), [backend package register](.forge/memory/WORK-PACKAGE-REGISTER.md), and [Engineering Hub #63](https://github.com/Project-Intra-Smithy/engineering-hub/issues/63). A missing half means `SYNC_REQUIRED / HOLD`, not an authorized start or accepted close. This applies equally to Maintainer, Code Writer, architecture, CI/QA and operations work within their respective authorization gates. Preserve evidence, actual authorship, next owner and deferred-reopen triggers. Never infer fresh completion from an older paragraph below; recheck live issues, refs and memory first.

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

Current Technical Authority decision: **A01-C1 bounded backend contract accepted and integrated.**

- Canonical accepted backend main: `b9a4ad3ed6e72ae3a5cb1a4108ebae06eedaec26`
- A01-W01/W02/W03: **ACCEPTED / MERGED / BOUNDED CI PASS**
- A01-C1: **ACCEPTED / MERGED PR #34 / EXACT-MAIN BOUNDED CI PASS**
- Post-merge CI: [37898947831](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/actions/runs/37898947831), **78/655 PASS**
- FRONTEND-REG-001: **INCOMPLETE** — frontend workspace import/build/screenshots are pending; A01-F01/F02 remain staged.
- Formal A01-I01/CI01/Siris QA01/A01 Series final acceptance and production: **NOT RELEASED**.
- Historical W01 branch `KIRCH-TALIBON-P1-A01-W01-TASK-DOMAIN-FOUNDATION@ddbcf2a2715315c0e9998a7bcfdd9414edb3acd4` remains immutable provenance, not a current implementation source.

Read [live SSOT](.forge/SSOT_CURRENT.md), [ledger](.forge/WORK_LEDGER.md) and [validation policy](.forge/VALIDATION.md) before issuing a new work package. Resolve `main` and all named frontend refs live; recorded SHAs here are audited historical anchors, not permission to skip drift checks.

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
- Do not restart historical W01 or begin new frontend F01/F02 until their actual current handoff gates and exact sources are verified.
