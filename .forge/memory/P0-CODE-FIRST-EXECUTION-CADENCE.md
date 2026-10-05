# P0 — CODE-FIRST EXECUTION CADENCE

## Authority

Technical Authority: **Kirch Ivan Balite**

Program: **P0 — Canonical Baseline Stabilization**

Repository: `Kirch-Nairu/Talibon-Sales-Prototype`

Coordination branch: `KIRCH-TALIBON-P0-CANONICAL-BASELINE-STABILIZATION`

Immutable dual-writer implementation base: `a10dca34db0509d7139ebeb4080e85dde2c0e544`

## Decision

P0 execution is CODE-FIRST.

The two bounded Code Writers perform repository cleanup/canonicalization first. Expensive or broad CI/CD validation is deferred until candidate integration, except for narrow local/static checks that are directly necessary to avoid obviously invalid commits.

This prevents the validation harness from becoming the delivery program and keeps P0 centered on the actual Tech Lead deliverable: a clean, authoritative, known-state baseline.

## Concurrency

Maximum active P0 Code Writers: `2`.

- W01 — Backend Canonicalization
- W02 — Frontend Canonicalization

No third writer is authorized without an explicit Technical Authority amendment.

## Six execution phases

### Phase 1 — Parallel Code Canonicalization

W01 and W02 inspect, classify, and repair only their owned source surfaces from the same immutable implementation base.

Focus:
- stale/prototype/demo behavior;
- dead or duplicate code paths;
- misleading or obsolete tests;
- unsafe defaults;
- authorization assumptions;
- frontend/backend contract drift;
- environment coupling;
- extraction blockers for the future split repositories.

No Dockerization, deployment, main mutation, dependency modernization campaign, or repository split.

### Phase 2 — Writer Return and Independent Forge Review

Each writer returns an exact candidate SHA and evidence record.

Maintainer verifies:
- exact branch HEAD;
- lineage from immutable base;
- changed files;
- owned-scope compliance;
- overlap with the parallel writer;
- architecture invariants;
- prohibited-scope compliance;
- unresolved defects.

Candidates may receive bounded rework. No acceptance is inferred from source inspection alone.

### Phase 3 — Maintainer Reconciliation and Integration Candidate

Accepted source repairs are reconciled once under Maintainer authority onto the P0 coordination branch.

Shared/high-risk files remain Maintainer-owned.

The result is one exact integrated P0 candidate SHA. Validation evidence from writer branches does not transfer automatically to this new SHA.

### Phase 4 — Targeted CI/CD and Runtime Validation

Run validation against the exact integrated candidate only.

Required targeted gates include, as applicable:
- dependency-lock integrity;
- PHP/Laravel bootstrap;
- TypeScript typecheck;
- production frontend build;
- focused security/authorization negatives;
- database migration/seed on disposable test database only;
- affected Feature/Unit suites;
- Laravel cacheability;
- runtime smoke;
- focused browser/responsive journeys;
- Messaging regression preservation;
- repository hygiene.

If a gate fails, classify the defect first. Repair only the responsible lane, produce a new SHA, and rerun affected downstream gates. No PASS inheritance.

### Phase 5 — P0 Baseline Freeze and Known-State Publication

When the exact integrated candidate passes required engineering gates, publish:
- canonical P0 baseline SHA;
- known-good capabilities;
- partial/reference capabilities;
- known defects and deferred domains;
- security status;
- backend/frontend status;
- CI/runtime status;
- explicit non-claims;
- collaboration reopening instructions.

This closes the Tech Lead Phase 0 baseline-stabilization obligation.

### Phase 6 — Post-P0 Repository Separation Preparation

Only after P0 freeze, define and validate the extraction contract for separate repositories.

Backend authority will include Laravel application/domain code, PostgreSQL migrations, authorization, APIs/services, events/jobs, audit, backend tests, and backend-owned runtime contracts.

Frontend authority will include React/TypeScript application shell, pages/components, client state, API client, styles/assets, browser/responsive tests, and frontend build output.

Before physical extraction, freeze:
- API/interface contracts;
- authentication/session strategy;
- CSRF/CORS rules;
- validation/error envelope;
- file transfer rules;
- migration/seed ownership;
- environment ownership;
- integration-test ownership;
- source mapping and rollback procedure.

Docker/containerization follows as a separate platform lane after repository-boundary authority is explicit.

## Validation cadence rule

During Phases 1–3, prefer source review and narrow local/static proof. Do not burn the Windows self-hosted runner on every intermediate writer commit.

The principal CI/CD event is the exact integrated Phase 4 candidate.

Exceptions require one of:
1. a writer change touches a build/runtime boundary that cannot be responsibly reviewed without execution;
2. a security/authorization repair requires an immediate focused negative test;
3. the Maintainer explicitly requests pre-integration execution evidence.

## Architecture invariants

Preserve:
- `Task != Work Request`
- `Work Request != Correspondence`
- `Document != Transaction`
- `Meeting != Task`
- `Executive oversight != universal routing`

Do not invent LGU routing, approval, SLA, procurement, project-monitoring, confidentiality, signature, KPI, or publishing rules.

## Exit rule

P0 is not complete because branches exist or code has been cleaned.

P0 completes only when one exact integrated candidate is technically accepted, its known state is published, and the Tech Lead has a stable source baseline from which the post-P0 repository-separation program can begin.
