# KIRION FORGE: MAINTAINER — S1 FINAL SHOWCASE FORGE SPRINT

ROLE: KIRION FORGE: MAINTAINER

BOUNDARY: this handoff governs only the final September 30 showcase completion sprint for the Talibon Intra-Office Portal.

Human Technical Authority: Kirch Ivan Balite

Maximum active Code Writers: **3**.

You are the only Maintainer for this sprint. Control integration, evidence, branch state and handoffs. Do not implement application code yourself unless the Human Technical Authority explicitly reassigns your role.

## GOVERNING REPOSITORY ARTIFACTS

Read first:

- `.forge/directives/S1-FINAL-SHOWCASE-FORGE-SPRINT-PLAN-2026-09-30.md`
- `.forge/evidence/maintainer/S1-FINAL-SHOWCASE-PRE-SPRINT-AUDIT.md`
- `.forge/handoffs/code-writer/S1-FINAL-SHOWCASE-WRITER-A-RUNTIME.md`
- `.forge/handoffs/code-writer/S1-FINAL-SHOWCASE-WRITER-B-OPERATIONS.md`
- `.forge/handoffs/code-writer/S1-FINAL-SHOWCASE-WRITER-C-PRESENTATION.md`

Historical context only:

- `.forge/directives/S1-FINAL-SHOWCASE-EXECUTION-PLAN-2026-09-30.md`

The new Final Showcase Forge Sprint plan is governing for this bounded sprint where it is more specific.

## LIVE STATE KNOWN AT HANDOFF AUTHORING

The following refs were directly re-verified before this handoff set was written:

- `main` = `9b5193e3502afded5f967f412b2a1d452e433bc0`
- accepted backend baseline = `314b6661b34d4a70272d2a079f7cdda238b522ae`
- S1 integrated candidate = `7d7923ba83948aa1d0a8054854d9c12f74c5ab30`
- Welcome/Credits = `798ba88d545d3d016689686904063f97c2616929`
- showcase runtime/documentation line = `543419125187369e13b8fcfd2d0393ffe14a4497`
- AJ homepage donor = `f89996823cb7e6bb5f188897586682a0dd141b52`
- `EliminateDarkMode` donor = `4539302043b035e51fa068da2adb3963f191314f`

The control branch was created from `543419125...` and then received only sprint documentation/evidence. Re-resolve its live HEAD before acting.

Do not treat these SHAs as permanently current. Your first act is an independent re-verification.

## PHASE 0 — READ-ONLY HISTORY AUDIT

Remain read-only until this phase is complete.

### A. Re-resolve refs

Resolve:

- `main`
- `KIRCH-TALIBON-S1-SHOWCASE-INTEGRATED-CANDIDATE`
- `KIRCH-TALIBON-S1-SHOWCASE-WELCOME-CREDITS`
- `KIRCH-TALIBON-S1-SHOWCASE-RUNTIME-HARDENING`
- `KIRCH-TALIBON-S1-FINAL-SHOWCASE-FORGE-SPRINT`
- `KIRCH-TALIBON-S1-FINAL-SHOWCASE-INTEGRATED`
- AJ donor
- EliminateDarkMode donor

If any governing ref moved unexpectedly, STOP and classify the change before dispatching writers.

### B. Trace the actual history

Establish/verify the S1 spine:

`314b6661...` backend baseline
-> S1 UI/FUT/presentation work
-> `7d7923ba...` integrated candidate
-> `798ba88d...` Welcome/Credits
-> `3c12eadb...` runtime implementation
-> `543419125...` runtime/documentation base
-> current sprint-control documentation head

Verify exact deltas rather than trusting names.

### C. Audit current main-only history

`main` moved independently.

Do NOT merge `main` wholesale.

Enumerate all main-only commits/payload after the accepted backend baseline and classify each:

1. already represented in S1 spine;
2. selectively required;
3. unrelated/deferred;
4. conflicting/rejected.

Particular attention:

- B1 Records query consolidation / accepted backend baseline;
- AJ/Kikiam homepage work already present on main;
- any repository-governance-only commits;
- any later fixes that would otherwise regress if omitted.

If a required main-only payload exists, issue a bounded selective-transplant handoff or perform integration only after writer lanes return. Never take main wholesale to save time.

### D. Record Gate G0

Create:

`.forge/evidence/maintainer/S1-FINAL-SHOWCASE-G0-AUDIT.md`

Record:

- exact live SHAs;
- ancestry/compare results;
- main-only classification;
- exact sprint integration base SHA;
- allowed writer branches;
- frozen areas;
- unresolved contradictions.

Only after this file exists may writer mutation begin.

## PHASE 1 — LOCK CLEAN INTEGRATION BASE

Target branch:

`KIRCH-TALIBON-S1-FINAL-SHOWCASE-INTEGRATED`

This branch was created as an empty clean integration target from the trusted S1 runtime/documentation base.

Before writer dispatch:

1. fast-forward it to the current final sprint-control documentation HEAD if required;
2. verify no application mutation exists on the control branch beyond inherited S1/runtime work;
3. record exact integration-base SHA in G0 evidence;
4. give the **same exact SHA** to all three writers.

No writer starts from `main`.
No writer starts from a donor branch.
No writer starts from another writer's branch.

## PHASE 2 — DISPATCH THREE PARALLEL WRITERS

Maximum 3 simultaneous writers.

### Writer A — Runtime / Deployment

Use repository handoff:

`.forge/handoffs/code-writer/S1-FINAL-SHOWCASE-WRITER-A-RUNTIME.md`

Branch:

`KIRCH-TALIBON-S1-FINAL-SHOWCASE-RUNTIME-FINAL`

Owns only runtime scripts/tooling.

Primary acceptance:

- public-origin/config-cache safety;
- Cloudflare/LAN forwarded protocol correctness;
- safe runtime state/stop behavior;
- authenticated load support;
- Windows prepare/start/status/load/stop/restart evidence.

### Writer B — Operational Product / Personas

Use repository handoff:

`.forge/handoffs/code-writer/S1-FINAL-SHOWCASE-WRITER-B-OPERATIONS.md`

Branch:

`KIRCH-TALIBON-S1-FINAL-SHOWCASE-OPERATIONS`

Owns:

- Create Work Request rework;
- Memoranda attachments;
- curated office login personas;
- showcase selector;
- focused tests/data contracts.

### Writer C — Public Presentation / Light-Only

Use repository handoff:

`.forge/handoffs/code-writer/S1-FINAL-SHOWCASE-WRITER-C-PRESENTATION.md`

Branch:

`KIRCH-TALIBON-S1-FINAL-SHOWCASE-PRESENTATION`

Owns:

- selective AJ/Kikiam public-homepage transplant;
- bounded light-only implementation;
- LGU/product wording;
- presentation tests.

## PARALLEL OWNERSHIP LAW

Expected direct overlap among A/B/C is **zero**.

Known sensitive boundaries:

- Writer B owns `WorkspaceDialog.tsx`, `config/showcase.php`, WorkforceDemoSeeder.
- Writer C must not touch those.
- Writer C may touch `Login.tsx` only for light/product presentation; Writer B must avoid Login implementation changes.
- Writer A owns `scripts/showcase-*`; B/C must not touch runtime scripts.
- Writer B owns transaction/Memoranda application code; C must not touch it.

If writer output violates boundary:

STOP integration of that writer and request rework. Do not silently resolve cross-lane scope drift.

## PHASE 3 — REVIEW WRITER RETURNS

For each writer:

1. re-resolve branch SHA;
2. compare exact starting SHA to final SHA;
3. inspect changed files;
4. verify scope;
5. inspect tests/evidence;
6. check for uncommitted/unpushed claims;
7. classify PASS / REWORK / DEFER.

Do not accept `PASS BY SOURCE` for runtime/build claims when executable evidence is required.

A writer may be accepted for source integration with an explicit runtime-evidence gate still open, but that limitation must be recorded.

Create one evidence file per writer or one consolidated G1 file:

`.forge/evidence/maintainer/S1-FINAL-SHOWCASE-G1-WRITER-RETURNS.md`

## PHASE 4 — CONTROLLED INTEGRATION

Integrate onto:

`KIRCH-TALIBON-S1-FINAL-SHOWCASE-INTEGRATED`

Preferred order:

1. Writer A runtime payload;
2. Writer B operational product/persona payload;
3. Writer C public presentation/light payload.

Why:

- A is infrastructure-only and should be conflict-free;
- B establishes final persona/product contracts;
- C then lands presentation without being allowed to alter those contracts.

Before every integration:

- compare changed paths against already integrated payload;
- if overlap is expected by handoff, inspect exact diff;
- if overlap is unexpected, STOP;
- do not invent conflict resolution under time pressure.

No squash if individual writer commits carry useful bounded evidence. Preserve commit provenance unless there is a specific repository law requiring otherwise.

## PHASE 5 — SOURCE / BUILD GATE

On exact integrated SHA:

Run:

`npm run types:check`

clean production build:

`npm run build`

Laravel:

`php artisan optimize:clear`
`php artisan optimize`
`php artisan about`

Focused feature tests for:

- Work Request create/store;
- receiving-office/assigned-person validation;
- transaction evidence regression;
- Memorandum publish with/without attachment;
- Memorandum attachment authorization;
- showcase session gateway;
- curated persona configuration;
- workforce seeder count/identity behavior.

Do not run destructive DB setup against protected UAT.

Use the dedicated showcase DB:

`talibon_showcase_s1`

## PHASE 6 — DATA GATE

Verify:

- curated Talibon office personas exist and can authenticate;
- existing featured personas still work where intentionally retained;
- System Administrator remains available;
- workforce scale remains approximately 350, not 350 plus another office roster;
- no committed demo password;
- request categories/types/action options render from one controlled contract;
- assigned employee cannot be forged across offices.

## PHASE 7 — WINDOWS RUNTIME GATE

On presentation Windows host:

1. pull/switch exact integrated SHA;
2. clean tracked worktree;
3. correct `.env` / APP_KEY / DB connection;
4. `scripts/showcase-prepare.ps1`;
5. `scripts/showcase-start.ps1 -Workers 4 -Port 18000`;
6. `scripts/showcase-status.ps1`;
7. verify all worker `/up`;
8. verify proxy `/up`;
9. verify LAN from another device;
10. run load tool;
11. exercise authenticated sessions;
12. stop;
13. restart without rebuild/migrate/seed;
14. status HEALTHY.

Try 6 workers only if measurements justify it. Do not introduce new server stacks during this sprint unless the current multi-worker approach fails hard and Technical Authority explicitly authorizes fallback.

## PHASE 8 — 30-SESSION REAL REHEARSAL

Use approximately 30 independent authenticated sessions/accounts.

Required read-heavy paths:

- login/showcase entry;
- dashboard;
- Work Queue;
- Work Request create/detail;
- Memoranda;
- Municipal Systems;
- public homepage.

Mutation sample should be controlled, not 30 simultaneous destructive writes.

Hard acceptance:

- 0 unexpected 5xx;
- 0 timeouts;
- 0 network errors;
- 0 unexpected auth failures;
- 0 worker/proxy crashes;
- 0 cross-session identity bleed.

Latency:

- preferred p95 < 1.5 s;
- acceptable showcase ceiling < 3 s.

Record exact measurements.

## PHASE 9 — EXTERNAL/LAN PRESENTATION CHECK

Required:

- LAN URL works from separate phone/laptop on same network;
- public homepage loads;
- Employee Login works;
- authenticated dashboard works;
- Work Request flow works;
- Memorandum attachment path works for authorized user;
- light-only behavior persists even when device/system prefers dark.

Cloudflare Quick Tunnel is optional until LAN runtime is proven. If used, point at the proxy (`127.0.0.1:18000`), never directly at a PHP worker.

## PHASE 10 — RECOVERY / FREEZE

Prove one clean recovery cycle.

Record:

- final integrated SHA;
- DB;
- worker count/ports;
- proxy PID/port behavior;
- LAN URL;
- Cloudflare URL if used;
- prepare/start/status/stop commands;
- credential source location (not secret values);
- known limitations.

Create:

`.forge/evidence/maintainer/S1-FINAL-SHOWCASE-FINAL-ACCEPTANCE.md`

Then freeze.

No more:

- visual experiments;
- refactors;
- new modules;
- mobile redesign;
- CI/CD work;
- logo CMS work;
- speculative optimization.

Only a demonstrated showcase blocker may reopen code.

## REQUIRED MAINTAINER RETURN

Return to Technical Authority:

CURRENT LIVE MAIN SHA
CONTROL BRANCH + SHA
INTEGRATION BRANCH + SHA
G0 AUDIT RESULT

WRITER A BRANCH/SHA/RESULT
WRITER B BRANCH/SHA/RESULT
WRITER C BRANCH/SHA/RESULT

INTEGRATED COMMITS
EXACT INTEGRATED SHA
TYPECHECK
BUILD
PHP TESTS
PERSONA COUNT
WORKFORCE COUNT

RUNTIME PREPARE
RUNTIME START
STATUS
WORKER COUNT
PROXY HEALTH
LAN RESULT
30-SESSION RESULT
P50
P95
MAX
5XX
TIMEOUTS
AUTH FAILURES

WORK REQUEST RESULT
MEMO ATTACHMENT RESULT
PUBLIC HOMEPAGE RESULT
LIGHT-ONLY RESULT
LGU WORDING RESULT

RECOVERY RESULT
KNOWN LIMITATIONS

NO MAIN MUTATION
NO PROMOTION
NO DEPLOYMENT unless separately authorized

Final disposition must be one of:

- SHOWCASE READY
- SHOWCASE READY WITH RECORDED LIMITATION
- REWORK
- BLOCKED

Do not call the sprint ready without executable evidence.