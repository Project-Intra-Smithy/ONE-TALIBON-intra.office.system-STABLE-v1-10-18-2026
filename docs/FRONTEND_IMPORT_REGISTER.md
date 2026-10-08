# FRONTEND-REG-001 — Existing-work source and compatibility register

**State: INTAKE / NOT YET POPULATED.** This document is a template; no login, dashboard or shared frontend source has been verified or imported yet. The current team repository began with only a README at `5278a91a453b5cea1c9cba274964469f2c8735c2`.

[First task / coordinating issue #1](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/1). Human coordinator: Jhayr; human contributors: AJ and Jhayr; Kirch: technical authority/reviewer. AJ's administrative repository access is deferred, **not** a reason to stop Jhayr's independent work.

## Existing source inventory — fill with evidence

| Owner | Deliverable | Existing location + exact commit/archive | Stack/toolchain | Actual working behavior | Dependencies / blockers |
| --- | --- | --- | --- | --- | --- |
| AJ (`@rynzz22`) | Login / authentication UI (confirm ownership) | **Unverified** | **Unknown** | **Unknown; cannot assume real login** | Source and access information needed |
| AJ (`@rynzz22`) | Other completed frontend work | **Unverified** | **Unknown** | **Unknown** | Inventory needed |
| Jhayr (`@kyumw3b`) | Dashboard (confirm ownership) | **Unverified** | **Unknown** | **Unknown** | Source/stack needed |
| Jhayr (`@kyumw3b`) | Other completed frontend work | **Unverified** | **Unknown** | **Unknown** | Inventory needed |

**Template rows are prompts, not an assertion that a named teammate authored the example deliverable.** Replace with actual authorship evidence, links and exact SHAs.

## Architecture compatibility checkpoint

Record answers in the issue or a reviewed PR before choosing a shared framework:

- Language, UI framework/version, package manager, build scripts, routing, auth/UI interaction model;
- entrypoint(s), folder structure, styling and design tokens, reusable assets;
- local environment requirements **without secrets**, fixture/data dependencies, and documented tests;
- shared component ownership, divergent visual designs, duplicate routes/layouts, cross-package conflicts;
- frontend-backend interface dependencies, currently stubbed login/data, no-internet/offline assumptions if any;
- recommended single-app baseline versus multi-package workspace, with reasons and migration cost.

**Decision: PENDING; Kirch approves a reconciled setup before incompatible imports are combined.** Do not scaffold React/Vite, Vue or any other application stack just because an earlier reference repo happened to use it.

## Per-import acceptance record (copy per PR)

| Field | Evidence |
| --- | --- |
| Team-repo issue / PR / human contributor | Pending |
| Original source repository/archive + exact identifier | Pending |
| Imported paths and origin/copyright/license status | Pending |
| Branch start SHA / result SHA | Pending |
| Framework/dependency changes | Pending |
| Working views and mocked/incomplete behavior | Pending |
| Actual install / build / type-check / test commands and output | Pending |
| Desktop and mobile screenshots, keyboard smoke check | Pending |
| Conflict resolution / review / Kirch decision | Pending |
| Current server contract dependencies / missing endpoints | Pending |

## Stage definitions

- `STAGED`: source inventory, branches, review procedures prepared; **no feature result implied**.
- `PARTIAL / UI`: demonstrable frontend-only work, with fixture/auth stubs explicitly labeled.
- `ACCEPTED FRONTEND BASELINE`: reviewed, reproducible, usable imported shell/login/dashboard, including documented nonproduction limitations.
- `C1-PARTIAL`: only explicitly released, tested subset of actual backend endpoints (nonproduction).
- `A01-C1`: full approved backend frontend-consumable contract.
- `PRODUCTION`: separate engineering/integration/QA/deployment gates.

Keep Track W LGU interviews and Siris's separate formal QA gate independently evidenced. Never map word-of-mouth department-head rollout into assumed Task permissions.
