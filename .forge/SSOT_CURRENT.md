# ONE TALIBON V1 — CURRENT SSOT

## Authority

Technical Authority:

**Kirch Ivan Balite**

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Forge authority:

`Kirch-Nairu/KIRION-FORGE@44eb57e5b45b343be0033bf22a7a5e74d543c01a`

## Live repository authority

Accepted repository branch:

`main`

Successful S1 showcase promotion merge:

`3086a66042b81dc6c8e00230ecfa98f9607b8395`

Promotion method:

- non-force fast-forward of `main` to a reconciliation merge commit;
- first parent preserved the prior `main` lineage at `9b5193e3502afded5f967f412b2a1d452e433bc0`;
- second parent preserved the successful integrated S1 lineage at `908bbe915b0110dcf8d2bf8122039a99f7257d23`;
- promoted tree equals the validated integrated showcase tree.

Resolve the exact live `main` SHA from Git before every future state transition because documentation commits may advance `main` beyond the promotion merge.

## September 30, 2026 showcase outcome

`SUCCESSFUL SHOWCASE DAY`

The live S1 showcase completed successfully on **2026-09-30**.

Historical showcase evidence:

`.forge/evidence/showcase/S1-SUCCESSFUL-SHOWCASE-2026-09-30.md`

Preserved rollback tag:

`S1-SHOWCASE-ACED-2026-09-30`

The rollback tag marks the exact pre-AJ version that successfully completed the live showcase and must not be rewritten or deleted.

## Validated showcase evidence

The final integrated candidate demonstrated:

- public ONE TALIBON homepage;
- Employee Login entry point;
- authenticated dashboard;
- inter-office Work Request creation;
- routing and approval behavior;
- completion workflow;
- municipal workspace navigation;
- post-showcase AJ municipal homepage integration with repo-backed Talibon imagery.

Validation observed on the integrated candidate:

- TypeScript `tsc --noEmit`: **PASS**;
- production Vite build: **PASS**;
- Laravel application boot inspection: **PASS**;
- showcase environment with debug disabled;
- PostgreSQL database driver;
- file cache and session drivers;
- synchronous queue;
- `/up`: **HTTP 200**;
- local homepage visual check: **PASS**.

## Runtime record

The custom multi-worker showcase proxy was not used for the successful final presentation path.

The successful fallback was:

`php artisan serve --host=127.0.0.1 --port=8000`

External showcase transport used a Cloudflare Quick Tunnel pointed at the local Laravel server.

This was a successful **showcase transport strategy**, not an assertion of final production hosting architecture.

## Completed backend evidence

### E0 — exact-machine baseline

`COMPLETE`

### B1 — Records Registry Query Consolidation

`ACCEPTED / PROMOTED`

Exact B1 payload:

`314b6661b34d4a70272d2a079f7cdda238b522ae`

Observed B1 evidence:

- targeted Records: `21 passed / 630 assertions`;
- BH1/BH2: `3 passed / 25 assertions`;
- full Feature suite: `400 passed / 5291 assertions`;
- `records.inertia: 22 -> 17 queries`;
- `documents.records: 22 -> 17 queries`;
- protected UAT database untouched.

B1 remains the accepted prototype backend baseline carried forward into the showcased product line.

## Current program state

`S1 SHOWCASE — COMPLETE / PROMOTED`

Pre-showcase preparation is closed.

The next engineering phase is **post-showcase hardening and deployment planning**. It is not an automatic broad redesign or feature expansion.

Future work must begin from live `main` and should be driven by:

1. stakeholder feedback from the successful showcase;
2. production-readiness gaps;
3. deployment architecture decisions;
4. known deferred engineering findings;
5. explicitly authorized product expansion.

## Current product presentation

The promoted product line includes:

- ONE TALIBON identity;
- Talibon Intra-Office Portal public entry surface;
- Employee Login;
- AJ-derived municipal homepage composition selectively integrated into the validated S1 candidate;
- repo-backed Talibon municipal imagery;
- role-aware authenticated workspace;
- inter-office transaction / Work Request workflow;
- Records, Correspondence, Memoranda, Calendar, Messages, employee/office surfaces, executive and municipal-system prototype surfaces already present in the S1 line.

## Database boundary

Protected UAT database:

`talibon_portal`

Disposable engineering/test database:

`talibon_portal_test`

Showcase database used during S1 final preparation:

`talibon_showcase_s1`

Never run destructive engineering preparation against protected UAT data.

## Deferred findings

Known deferred findings remain non-automatic work until explicitly prioritized:

- PERF-01 — `DocumentArchiveQuery` full-corpus materialization;
- SEM-01 — Dashboard attention semantics;
- AUTH-01 — System Administration Work Queue metadata mismatch;
- AUTH-02 — generic System Administration transaction authority decision;
- PROD-01 — executive Work Queue composition;
- MSG-01 — prototype Messaging membership authority;
- CI-01 — generalized Windows/self-hosted workflow redesign.

## Evidence law

Live Git/runtime truth outranks this file if they disagree.

Passing tests do not prove deployment.

Showcase success does not by itself equal production deployment approval.

Cloudflare Quick Tunnel is presentation transport, not final contractual hosting.

## Preservation law

Preserve:

- live `main` history;
- `S1-SHOWCASE-ACED-2026-09-30`;
- showcase evidence record;
- accepted B1 evidence;
- the successful S1 promotion lineage.

Branch cleanup may remove obsolete remote working branches only after their required history is reachable from `main` or intentionally preserved by tags/evidence.
