# KIRION FORGE — P0 CANONICAL BASELINE & REPOSITORY SEPARATION PLAN

## Authority

Technical Authority: **Kirch Ivan Balite**

Current repository: `Kirch-Nairu/Talibon-Sales-Prototype`

Current coordination branch: `KIRCH-TALIBON-P0-CANONICAL-BASELINE-STABILIZATION`

Planning source before this memory record: `3a2576eb49b809ee1f9e8211bd3ac35b2ce21db8`

This record governs the remainder of Phase 0 unless superseded by an explicit Technical Authority decision recorded in-repository.

## Why this plan exists

Phase 0 is not a CI-repair program. Its purpose is to produce a defensible, cleaned, known-state canonical product baseline from the existing substantial implementation foundation, while preserving accepted behavior and exposing incomplete, prototype-only, misleading, unsafe, or stale state.

CI/CD is a validation gate inside Phase 0, not the center of the program.

## Phase 0 exit condition

Phase 0 is complete only when all of the following are true:

1. canonical source is cleaned and stabilized;
2. architecture boundaries are checked against current implementation;
3. backend and frontend ownership boundaries are mapped;
4. exact-candidate validation evidence exists for the frozen candidate;
5. known-good, partial, reference/non-authoritative, deferred, blocked, and production-gated capabilities are recorded;
6. the exact Phase 0 baseline SHA is published;
7. collaboration reopening instructions are published;
8. the baseline is suitable to become the extraction source for separate backend and frontend repositories.

A green workflow alone does not satisfy Phase 0.

## Program sequence

### P0-A — Authority and lineage reconstruction

Purpose: establish what repository state is actually authoritative before cleanup.

Controls:

- verify source ancestry and branch relationship;
- preserve accepted feature history;
- distinguish canonical, working, historical, prototype/reference, and deferred state;
- preserve archive provenance;
- do not rewrite historical evidence to look current.

State: substantially complete; continue exact-SHA checks as changes occur.

### P0-B — Security and dangerous-default cleanup

Purpose: prevent prototype conveniences from being mistaken for production-safe defaults.

Includes:

- showcase disabled by default;
- non-protected example database defaults;
- MFA/showcase negative-path validation;
- truth-label prototype/reference surfaces;
- environment and secret hygiene;
- production-promotion blockers recorded explicitly.

State: materially progressed; final closure depends on exact-candidate validation and production lane evidence.

### P0-C — Canonical source cleanup

Purpose: remove or reconcile source state that makes the product baseline ambiguous or unsafe to extend.

Required audit classes:

- stale prototype/demo behavior;
- dead or unreachable code;
- duplicated paths or responsibilities;
- misleading labels/surfaces;
- abandoned experiments;
- frontend/backend contract drift;
- stale tests that assert superseded contracts;
- obsolete environment coupling;
- platform-specific assumptions that should not be application assumptions;
- undocumented runtime dependencies;
- migrations/schema history requiring clarification;
- configuration whose defaults contradict current authority.

Rule: cleanup must be evidence-backed. Do not delete historical or apparently unused behavior solely because it looks old.

### P0-D — Architecture boundary audit

The following domain boundaries are invariants and must not be collapsed during cleanup:

- `Task != Work Request`
- `Work Request != Correspondence`
- `Document != Transaction`
- `Meeting != Task`
- `Executive oversight != universal routing`

Additional rule: do not invent Department Head, Mayor, Vice Mayor, procurement, SLA, approval, acknowledgement, confidentiality, KPI, signature, or escalation rules that require LGU/process-owner authority.

### P0-E — Backend canonicalization

Purpose: make backend authority explicit before repository extraction.

Backend authority inventory:

- Laravel application/domain code;
- models and domain relationships;
- authorization/Gates/policies/middleware;
- controllers/services/actions;
- routes and API surface;
- events/listeners/notifications/jobs/queues;
- database migrations and seed authority;
- audit behavior;
- records/search/file controls;
- backend tests;
- configuration whose primary authority is server-side.

Outputs:

- backend source map;
- stale/duplicate/unsafe findings;
- bounded repairs where evidence is sufficient;
- extraction-boundary manifest;
- unresolved cross-layer contracts for Maintainer disposition.

### P0-F — Frontend canonicalization

Purpose: make frontend authority explicit before repository extraction.

Frontend authority inventory:

- React/TypeScript shell;
- navigation composition and visibility presentation;
- pages/components;
- frontend state and client-side behavior;
- design primitives and responsive behavior;
- frontend representations of backend contracts;
- browser/readiness tests;
- prototype/reference UI surfaces;
- frontend-only assets and styling.

Outputs:

- frontend source map;
- stale/duplicate/misleading findings;
- bounded repairs where evidence is sufficient;
- extraction-boundary manifest;
- unresolved API/data-contract dependencies for Maintainer disposition.

### P0-G — Exact-candidate validation

Validation must target one immutable candidate SHA.

Required evidence, as applicable:

- locked dependency install;
- TypeScript/static checks;
- production asset build;
- Laravel/backend tests;
- security negative tests;
- migration + disposable test database seed;
- cache/config buildability;
- runtime smoke;
- browser/persona matrix;
- responsive checks;
- accepted Messaging regression;
- repository hygiene;
- artifacts/logs sufficient to classify failures.

Failure routing:

- source defect -> owning writer lane;
- cross-layer contract defect -> Maintainer/Technical Authority;
- CI/runtime-harness defect -> CI/DevOps repair then rerun same candidate when source is unchanged;
- environment/runner defect -> repair host/tooling, no source mutation;
- stale test contract -> synchronize test to current authority only when current authority is independently established.

### P0-H — Known-state publication and freeze

The Phase 0 closeout must record:

- exact canonical baseline SHA;
- known-good capabilities;
- partial capabilities;
- reference/non-authoritative capabilities;
- known defects;
- deferred domains;
- security status;
- database/schema status;
- backend status;
- frontend status;
- CI/QA status;
- production-readiness status;
- next authorized work;
- repository-separation readiness.

## Concurrency model

Phase 0 authorizes **two active Code Writers maximum** for the current cleanup batch.

The writers operate from one immutable planning base and may not edit overlapping source areas.

### Writer 1 — Backend Canonicalization

Lane ID: `P0-W01-BACKEND-CANONICALIZATION`

Primary ownership:

- `app/**`
- `routes/**`
- backend-focused `config/**` only where explicitly justified
- `database/**` with destructive schema/history changes prohibited
- `tests/Feature/**`
- `tests/Unit/**` when backend-focused

Reserved/shared files requiring Maintainer disposition before modification:

- `composer.json`
- `composer.lock`
- root environment policy files
- `.github/**`
- `package.json`
- `package-lock.json`
- Vite/TypeScript root configuration
- `.forge/**`
- cross-layer shared types/contracts whose ownership is ambiguous

Writer 1 must not modify frontend implementation under `resources/js/**` or `resources/css/**`.

### Writer 2 — Frontend Canonicalization

Lane ID: `P0-W02-FRONTEND-CANONICALIZATION`

Primary ownership:

- `resources/js/**`
- `resources/css/**`
- frontend assets used exclusively by those surfaces
- `tests/Browser/**`

Reserved/shared files requiring Maintainer disposition before modification:

- `package.json`
- `package-lock.json`
- Vite/TypeScript root configuration
- `.github/**`
- `.forge/**`
- server routes/controllers/models/configuration
- cross-layer shared types/contracts whose ownership is ambiguous

Writer 2 must not modify backend implementation under `app/**`, `routes/**`, or `database/**`.

## Two-writer integration law

1. Both writers start from the same exact base SHA.
2. No writer merges the other writer branch.
3. No writer edits the coordination branch.
4. No writer changes CI/deployment/Docker files in this batch.
5. Each writer returns one exact candidate SHA plus a changed-file list and validation evidence.
6. Maintainer independently verifies lineage and file ownership.
7. Maintainer reviews candidates separately before integration.
8. Integration occurs only after overlap analysis.
9. The integrated candidate receives full exact-candidate validation.
10. Any post-validation source change creates a new candidate and invalidates inherited PASS claims.

## Repository separation architectural decision

Technical direction: the current combined repository is a transition source. After Phase 0 freeze, ONE TALIBON will move toward **separate frontend and backend repositories**.

This is a forward architecture decision. It does not retroactively redefine historical repository ownership.

Repository names are not frozen by this record; suggested working names are:

- `ONE-TALIBON-BACKEND`
- `ONE-TALIBON-FRONTEND`

Do not create or populate those repositories until the Phase 0 baseline and extraction contract are accepted.

### Backend repository target responsibility

Expected ownership:

- Laravel runtime;
- database/migrations;
- domain/application services;
- authentication/authorization;
- APIs;
- jobs/events/notifications;
- audit;
- file/data controls;
- backend automated tests;
- API/schema contract publication.

### Frontend repository target responsibility

Expected ownership:

- React/TypeScript application;
- application shell/navigation presentation;
- pages/components/state;
- API client/contract consumption;
- styling/assets;
- browser and responsive validation;
- frontend build/release artifact.

### Separation prerequisites

Do not split until all are available:

- accepted P0 source SHA;
- backend/frontend extraction manifests;
- explicit API/auth/session contract;
- file upload/download contract;
- error/validation response contract;
- environment/config ownership matrix;
- migration and seed ownership rules;
- frontend build/runtime ownership;
- CORS/CSRF/session strategy decision appropriate to the final topology;
- integration test strategy;
- rollback/reference mapping to the P0 source SHA.

## Docker / platform direction

Dockerization is a post-P0 platform lane, not a substitute for P0 cleanup.

Sequence:

1. freeze P0 baseline;
2. define and validate repository extraction contract;
3. establish backend/frontend repositories from traceable source history;
4. introduce containerized development/CI runtime;
5. establish production-style application runtime and reverse-proxy boundaries;
6. add health checks, migrations, workers/scheduler, secrets/config, persistence, logging, backup and restore controls;
7. validate staging before production decisions.

Do not combine repository separation, Dockerization, production deployment, and application-domain cleanup into one unbounded change.

## Product work after baseline

After P0 freeze and platform transition planning, shared-core completion remains ordered around the approved product direction:

- First-Class Task;
- Unified My Work;
- accepted coordination capabilities;
- Documents/Records lifecycle depth;
- authorization-safe Search;
- dashboard integration;
- security/authorization coverage;
- validated workflow configuration;
- specialized domains only when sufficient LGU process truth exists.

## Explicitly prohibited in the current two-writer batch

- Dockerfile/Compose introduction;
- production deployment;
- `main` promotion;
- new LGU business rules;
- procurement lifecycle invention;
- Project Monitoring lifecycle invention;
- full HRIS expansion;
- migration squashing or destructive schema-history rewriting;
- broad dependency upgrades;
- `composer update` without separate authority;
- bypassing platform requirements;
- UAT claims;
- final contractual acceptance claims.

## Maintainer decision points

The Maintainer/Technical Authority owns:

- cross-layer ambiguity;
- shared root configuration;
- CI/runtime harness;
- writer overlap resolution;
- candidate integration order;
- accepted baseline SHA;
- repository split authorization;
- Docker/platform lane authorization;
- promotion/release/deployment.

## Current operational rule

Run CI validation in parallel with source canonicalization where possible, but do not allow runner/tooling failures to stop evidence-backed source audit work. Likewise, do not declare P0 complete until the integrated exact candidate passes the required validation gates.
