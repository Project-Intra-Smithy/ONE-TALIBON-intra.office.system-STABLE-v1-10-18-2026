# KIRION FORGE: CODE WRITER — P0-W01 BACKEND CANONICALIZATION

## Authority

Technical Authority: **Kirch Ivan Balite**

Program: `P0 — CANONICAL BASELINE STABILIZATION`

Writer lane: `P0-W01-BACKEND-CANONICALIZATION`

Writer branch:

`KIRCH-TALIBON-P0-W01-BACKEND-CANONICALIZATION`

Immutable source base:

`a10dca34db0509d7139ebeb4080e85dde2c0e544`

Governing memory:

`.forge/memory/P0-CANONICAL-BASELINE-AND-REPOSITORY-SEPARATION-PLAN.md`

Do not change branch strategy. Do not merge another writer branch. Do not target `main`.

## Mission

Canonicalize the backend side of the current ONE TALIBON baseline without redesigning the product or inventing LGU business rules.

The objective is to make backend authority clear, remove or reconcile evidence-backed stale/unsafe/duplicate backend state, preserve accepted behavior, and produce a backend extraction-readiness map for the later split into a dedicated backend repository.

This is not the repository split itself.

## Owned source scope

Primary owned implementation areas:

- `app/**`
- `routes/**`
- backend-focused `config/**` where current authority is clear
- `database/**` for inspection and tightly bounded repair
- `tests/Feature/**`
- `tests/Unit/**` where backend-focused

You may add one backend findings/evidence record under:

`.forge/evidence/code-writer/P0-W01-BACKEND-CANONICALIZATION.md`

The `.forge` evidence record is administrative evidence only; do not alter governing Forge doctrine.

## Reserved / prohibited files

Do not modify without Maintainer re-authorization:

- `resources/js/**`
- `resources/css/**`
- `tests/Browser/**`
- `.github/**`
- `composer.json`
- `composer.lock`
- `package.json`
- `package-lock.json`
- Vite/TypeScript root configuration
- `.env.example` unless a concrete backend baseline defect is found and explicitly reported before mutation
- `.forge/NEST.md`
- `.forge/WORK_LEDGER.md`
- governing memory/handoff files

Do not perform migration squashing, destructive schema-history rewrites, data-loss migrations, broad dependency upgrades, Dockerization, deployment, or repository extraction.

## Backend audit classes

Inspect and classify at minimum:

1. routes that expose stale, prototype-only, duplicate, misleading, or unreachable behavior;
2. controllers/services/actions whose responsibilities overlap or contradict current domain boundaries;
3. authorization/Gates/policies/middleware that encode stale or permissive assumptions;
4. showcase/demo behavior that can escape intended boundaries;
5. configuration defaults that are unsafe or inconsistent with current baseline authority;
6. models/domain relationships with duplicate or misleading semantics;
7. events/listeners/notifications/jobs/queues with stale wiring or hidden coupling;
8. audit/security code paths that lack current negative coverage;
9. migrations/seeds whose current authority is unclear;
10. tests asserting superseded backend contracts;
11. runtime/environment assumptions that belong to host/CI rather than product logic;
12. backend/frontend coupling that will block future repository separation.

## Architecture invariants

Preserve:

- `Task != Work Request`
- `Work Request != Correspondence`
- `Document != Transaction`
- `Meeting != Task`
- `Executive oversight != universal routing`

Do not invent:

- Mayor/Vice Mayor routing requirements;
- Department Head approval rules;
- procurement stages;
- Project Monitoring lifecycle/KPIs;
- SLA durations;
- acknowledgement semantics;
- confidentiality classifications;
- signature authority;
- escalation recipients/timing;
- workflow states that require LGU/process-owner validation.

When authority is missing, record the dependency instead of implementing an assumption.

## Repair policy

A repair is authorized only when the defect is supported by repository evidence, current authoritative documentation, or an already-established accepted contract.

Allowed examples:

- remove dead imports/references in backend-owned files;
- reconcile stale test assertions with independently established current backend authority;
- close an unsafe default or stale demo path;
- remove unreachable duplicate backend behavior when equivalence and non-use are demonstrated;
- improve negative tests around existing authorization/security behavior;
- clarify backend ownership or contract boundaries in code/evidence.

Not authorized:

- feature expansion;
- business-rule invention;
- new domain creation;
- schema redesign;
- repository split implementation;
- Docker/runtime topology changes.

## Extraction-readiness deliverable

In the evidence record, classify backend content into:

- `BACKEND-OWNED`
- `FRONTEND-DEPENDENT CONTRACT`
- `SHARED / MAINTAINER DECISION`
- `HISTORICAL / PROVENANCE`
- `REFERENCE / NON-AUTHORITATIVE`
- `DEFERRED DOMAIN`

Identify specifically what must later move into the backend repository and what interface/API contract must replace direct monorepo coupling.

## Required validation

Run the strongest available validation that does not require mutating protected/UAT data.

Minimum expected where locally feasible:

- targeted Feature/Unit tests for changed backend behavior;
- relevant authorization/security negative tests;
- route registration/authority checks when routes change;
- migration status/fresh disposable database checks when database-owned behavior changes;
- full Feature suite if environment permits.

Use only disposable/test database authority. Never target protected UAT database state.

If a validation cannot run, record `NOT RUN` and the exact reason. Do not infer PASS.

## Return package

Return:

1. exact candidate SHA;
2. `git diff --name-only a10dca34db0509d7139ebeb4080e85dde2c0e544...HEAD` equivalent changed-file inventory;
3. concise defect/repair summary;
4. validation commands and actual results;
5. unresolved dependencies;
6. extraction-readiness map;
7. explicit statement that frontend-owned files and CI/deployment/Docker scope were not modified.

## Acceptance criteria

A suitable W01 candidate must:

- remain strictly within owned scope;
- preserve architecture invariants;
- contain no invented LGU rules;
- reduce backend ambiguity or risk with evidence-backed changes;
- improve backend extraction readiness;
- include truthful validation evidence;
- remain cleanly integrable with the parallel W02 frontend lane.

## Stop conditions

Stop and return to Maintainer instead of guessing when:

- a necessary repair crosses into frontend-owned files;
- a shared root dependency/configuration change is required;
- schema intent cannot be established safely;
- business/process authority is missing;
- the defect is actually CI/runner/host related;
- a proposed cleanup could remove behavior whose current use cannot be disproven.
