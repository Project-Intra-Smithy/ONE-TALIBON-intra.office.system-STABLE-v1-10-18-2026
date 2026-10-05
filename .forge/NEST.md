# ONE TALIBON V1 — FORGE NEST RECORD

## Identity

Project:

`ONE TALIBON V1`

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Technical Authority:

**Kirch Ivan Balite**

Nest maturity:

`NEST-2 — GOVERNED`

## Forge source

`Kirch-Nairu/KIRION-FORGE@44eb57e5b45b343be0033bf22a7a5e74d543c01a`

Forge provides operating doctrine. Technical Authority remains Kirch Ivan Balite.

## Historical materialization

The repository-local Nest was originally materialized during the UI/UX correction program from accepted baseline:

`0913a37f96affd2c2a681697bdf6fdb6c381a99e`

That remains historical provenance, not current authority.

## Current product authority

Canonical/default product source:

`main`

Non-main working branches may exist under bounded authority, but are not canonical product authority unless separately accepted.

Historical exact validated/promoted product payload:

`f6208cf082c4b1d189c70728adfdb9ddf3225990`

Completed provenance includes CAL1, BH1, DA1, RC1, RV1 and later bounded programs preserved in repository evidence.

Historical non-main remote heads from prior consolidation programs were archived before deletion where recorded.

## Current program

`P0 — CANONICAL BASELINE STABILIZATION`

Coordination branch:

`KIRCH-TALIBON-P0-CANONICAL-BASELINE-STABILIZATION`

Current planning source before the durable P0 memory installation:

`3a2576eb49b809ee1f9e8211bd3ac35b2ce21db8`

Durable governing memory:

`.forge/memory/P0-CANONICAL-BASELINE-AND-REPOSITORY-SEPARATION-PLAN.md`

Program purpose:

- clean and stabilize the current product source;
- preserve accepted behavior;
- reconcile stale/prototype/dead/misleading state only from evidence;
- map backend/frontend ownership and extraction boundaries;
- obtain exact-candidate validation;
- publish the known-state canonical Phase 0 SHA;
- prepare controlled separation into frontend and backend repositories after Phase 0 acceptance.

Phase 0 is not a CI-only exercise. CI/CD is one validation gate inside the baseline program.

Concurrency ceiling for the current cleanup batch:

`2 ACTIVE CODE WRITERS`

Writer lanes must be non-overlapping and issued from one exact immutable base.

## Forward repository architecture direction

After the Phase 0 baseline is accepted, ONE TALIBON is intended to move toward separate frontend and backend repositories.

Working target names are not yet frozen, but the architectural split is:

- backend repository — Laravel/domain/data/auth/API/jobs/audit/backend tests;
- frontend repository — React/TypeScript UI/state/API consumption/browser-responsive tests.

Repository separation is **post-P0**. Do not split the current source before the baseline and extraction contract are accepted.

Docker/container platform work is also a later bounded platform lane. Do not combine baseline cleanup, repository separation, Dockerization and production deployment into one unbounded change.

## Branch topology

The canonical/default product branch remains:

```text
main
```

P0 explicitly authorizes temporary coordination/writer branches under bounded authority.

No P0 branch is canonical product authority until Technical Authority accepts the exact candidate and separately authorizes integration/promotion.

Historical archive refs remain provenance and are not implicitly revived.

## Governance installed

The Nest governs:

- Technical Authority;
- current SSOT;
- architecture boundaries;
- handoffs;
- review/evidence discipline;
- integration policy;
- recovery policy;
- release validation;
- promotion rules;
- archival/cleanup rules;
- post-promotion rehearsal/deployment boundaries;
- Phase 0 repository-separation readiness.

## Evidence law

Observed Git/runtime evidence outranks stale branch references in historical records.

Historical review/acceptance/evidence files remain provenance and should not be rewritten to look current.

Validation belongs to an exact code state. Any source change after a PASS creates a new candidate and requires revalidation of affected gates.

## Architecture invariants

Do not collapse these boundaries during cleanup:

- `Task != Work Request`
- `Work Request != Correspondence`
- `Document != Transaction`
- `Meeting != Task`
- `Executive oversight != universal routing`

Do not invent LGU routing, approval, signature, SLA, acknowledgement, escalation, confidentiality, procurement, project-monitoring or KPI rules without validated authority.

## Role boundary

All contributors other than Kirch Ivan Balite are Developers / Contributors unless explicitly delegated a bounded Forge role.

A bounded Forge role does not transfer Technical Authority.

## Secrets

Do not store credentials, passwords, private employee data, private correspondence, keys, session material, or tokens in `.forge/`.
