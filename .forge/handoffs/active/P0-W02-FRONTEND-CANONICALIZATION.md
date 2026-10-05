# KIRION FORGE: CODE WRITER — P0-W02 FRONTEND CANONICALIZATION

## Authority

Technical Authority: **Kirch Ivan Balite**

Program: `P0 — CANONICAL BASELINE STABILIZATION`

Writer lane: `P0-W02-FRONTEND-CANONICALIZATION`

Writer branch:

`KIRCH-TALIBON-P0-W02-FRONTEND-CANONICALIZATION`

Immutable source base:

`a10dca34db0509d7139ebeb4080e85dde2c0e544`

Governing memory:

`.forge/memory/P0-CANONICAL-BASELINE-AND-REPOSITORY-SEPARATION-PLAN.md`

Do not change branch strategy. Do not merge another writer branch. Do not target `main`.

## Mission

Canonicalize the frontend side of the current ONE TALIBON baseline without redesigning the product, broadening scope, or inventing LGU workflow semantics.

The objective is to make frontend authority clear, reconcile evidence-backed stale/prototype/misleading/duplicate presentation state, preserve accepted behavior, and produce a frontend extraction-readiness map for the later split into a dedicated frontend repository.

This is not the repository split itself.

## Owned source scope

Primary owned implementation areas:

- `resources/js/**`
- `resources/css/**`
- frontend-only assets referenced by those surfaces
- `tests/Browser/**`

You may add one frontend findings/evidence record under:

`.forge/evidence/code-writer/P0-W02-FRONTEND-CANONICALIZATION.md`

The `.forge` evidence record is administrative evidence only; do not alter governing Forge doctrine.

## Reserved / prohibited files

Do not modify without Maintainer re-authorization:

- `app/**`
- `routes/**`
- `database/**`
- server-side `config/**`
- `.github/**`
- `composer.json`
- `composer.lock`
- `package.json`
- `package-lock.json`
- Vite/TypeScript root configuration
- `.env.example`
- `.forge/NEST.md`
- `.forge/WORK_LEDGER.md`
- governing memory/handoff files

Do not perform dependency upgrades, backend redesign, Dockerization, deployment, repository extraction, or new domain implementation.

## Frontend audit classes

Inspect and classify at minimum:

1. stale prototype/demo/reference UI presented as authoritative product behavior;
2. misleading labels or destinations that contradict current canonical navigation/domain terminology;
3. dead or unreachable components/pages/imports;
4. duplicated presentation paths or obsolete wrappers;
5. frontend assumptions that bypass or duplicate server authority;
6. hard-coded persona/permission/role logic that should remain server-derived;
7. browser tests asserting superseded UI contracts;
8. inconsistent empty/loading/error/permission-denied states;
9. responsive/mobile breakage or horizontal-overflow risks in core surfaces;
10. direct monorepo coupling that will block future frontend extraction;
11. stale API/data-shape assumptions embedded in UI code;
12. presentation-only references to deferred/non-authoritative domains that need truthful labeling rather than invented functionality.

## Architecture and authority invariants

Preserve:

- server-derived authorization and destination visibility;
- `Task != Work Request`;
- `Work Request != Correspondence`;
- `Document != Transaction`;
- `Meeting != Task`;
- `Executive oversight != universal routing`.

Do not introduce frontend role checks that replace backend authorization.

Do not invent:

- routing/approval/signature rules;
- procurement stages;
- Project Monitoring lifecycle/KPIs;
- SLA durations;
- acknowledgement semantics;
- confidentiality rules;
- escalation behavior;
- workflow states that require LGU/process-owner validation.

When authority is missing, label/reference the state truthfully or record a dependency instead of fabricating a product behavior.

## Repair policy

A repair is authorized only when the current frontend authority can be independently established.

Allowed examples:

- remove dead imports/components in frontend-owned files;
- reconcile stale Browser tests with current established UI contracts;
- truth-label prototype/reference surfaces;
- remove obsolete presentation branches whose non-use is demonstrated;
- align labels with current canonical destination registry;
- remove frontend-only permission/role assumptions that duplicate server-derived visibility;
- repair responsive/overflow/accessibility defects without changing business meaning;
- isolate data-access assumptions in preparation for future API-based separation where this can be done without backend changes.

Not authorized:

- new modules;
- new backend endpoints;
- business-rule invention;
- broad visual redesign unrelated to canonicalization;
- repository split implementation;
- Docker/runtime topology changes.

## Extraction-readiness deliverable

In the evidence record, classify frontend content into:

- `FRONTEND-OWNED`
- `BACKEND-CONTRACT DEPENDENCY`
- `SHARED / MAINTAINER DECISION`
- `HISTORICAL / PROVENANCE`
- `REFERENCE / NON-AUTHORITATIVE`
- `DEFERRED DOMAIN`

Identify specifically:

- data currently received through Inertia/server page props;
- direct assumptions that would need an API/client contract after separation;
- auth/session/CSRF dependencies;
- upload/download interactions;
- routes whose future ownership must be clarified;
- browser tests that can move directly to a frontend repository;
- assets/build behavior that must become frontend-owned.

Do not implement the split in this lane.

## Required validation

Run the strongest available validation for changed frontend scope.

Minimum expected where locally feasible:

- TypeScript check;
- production frontend build;
- targeted Browser/readiness checks for changed surfaces;
- responsive checks for relevant 1440px and 390px views;
- no horizontal overflow on changed core surfaces;
- no new browser page errors or server 5xx attributable to frontend changes.

If environment constraints prevent browser execution, record `NOT RUN` and the exact reason. Do not infer PASS.

## Return package

Return:

1. exact candidate SHA;
2. `git diff --name-only a10dca34db0509d7139ebeb4080e85dde2c0e544...HEAD` equivalent changed-file inventory;
3. concise defect/repair summary;
4. validation commands and actual results;
5. unresolved backend/data-contract dependencies;
6. extraction-readiness map;
7. explicit statement that backend-owned files and CI/deployment/Docker scope were not modified.

## Acceptance criteria

A suitable W02 candidate must:

- remain strictly within owned scope;
- preserve server authority and architecture boundaries;
- contain no invented LGU rules;
- reduce frontend ambiguity, stale presentation, or extraction risk with evidence-backed changes;
- improve frontend extraction readiness;
- include truthful validation evidence;
- remain cleanly integrable with the parallel W01 backend lane.

## Stop conditions

Stop and return to Maintainer instead of guessing when:

- a necessary fix requires backend/controller/route/schema changes;
- package/root build configuration must change;
- a UI behavior depends on unclear LGU business authority;
- a test failure is actually runner/host/CI infrastructure;
- cleanup would remove a component or route whose active use cannot be disproven;
- frontend/backend contract changes cannot be made safely within owned scope.
