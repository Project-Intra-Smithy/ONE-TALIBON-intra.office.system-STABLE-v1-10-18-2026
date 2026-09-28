# ONE TALIBON V1 — CURRENT SSOT

## Technical Authority

**Kirch Ivan Balite**

## Repository

`Kirch-Nairu/Talibon-Sales-Prototype`

## Forge

`Kirch-Nairu/KIRION-FORGE@44eb57e5b45b343be0033bf22a7a5e74d543c01a`

## Current accepted product

Branch:

`main`

Exact SHA:

`0e57508cab1a86bf4eabc1637e39b2dae6d32716`

Current main is the exact accepted RC2 repair candidate.

Open PRs observed at FB0 opening:

`0`

Remote branches observed at FB0 opening:

`31 including main`

Branch cleanup is not part of FB0.

## Completed release chain

Frozen RC2:

`826d0bf735c848fdc21f8484d70491b056337da6`

Final repair:

`0e57508cab1a86bf4eabc1637e39b2dae6d32716`

Independent Reviewer:

`SUITABLE FOR ACCEPTANCE`

Acceptance:

`ACCEPT FOR EXACT MAIN PROMOTION WITH RECORDED LIMITATION`

Promotion:

`PASS / COMPLETE`

Method:

- direct ancestry-preserving ref-forward;
- force=false;
- no rebase;
- no squash;
- no reconstruction.

Current main and final repair candidate are identical.

## Carried validation evidence

Backend-green:

`d6a350a5cbc536b23827172216b64f80082cbba8`

Observed:

- 400 Feature tests passed;
- 5,277 assertions;
- 0 failures.

Production frontend:

- TypeScript PASS;
- production Vite build PASS;
- compiled runtime PASS.

V1 showcase:

`V1_SHOWCASE_BROWSER_PASS checks=270 matrices=6 screenshots=8`

V1-green SHA:

`0d9b849bf5e71971e42f446bda9d2ebf76bae9ec`

OW1 exact-final:

`OW1_ONBOARDING_BROWSER_PASS checks=63`

at:

`0e57508cab1a86bf4eabc1637e39b2dae6d32716`

## Local UAT disposition

Current UI/UX-oriented local UAT pass is considered PASS by the Technical Authority for transition purposes.

This UAT established that the promoted workspace is sufficiently usable to move engineering focus from frontend/UIUX correction into backend/runtime hardening.

It does **not** establish:

- backend architecture closure;
- production acceptance;
- commercial completion;
- self-hosted CI readiness.

Representative UAT observations included:

- Mayor / executive role-aware dashboard and executive task composition;
- Department Head personal task/request/office scope separation;
- broad navigation and major municipal workspace surfaces rendering;
- correspondence, records, memoranda, calendar, meetings, messages, staff directory, ordinances, local bodies and search presentation.

## Role-composition decisions carried forward

### Department Head

Current intended composition is:

- My Tasks;
- My Requests;
- Office Work.

Personal requests waiting in another office are not current-office work.

### Executive / Mayor

Current implementation exposes Executive Work rather than normal personal task groups.

This is a current product behavior, not a confirmed defect.

Whether executive authority should become additive to personal accountability remains a Technical Authority/product decision.

### System Administration

Current RC2 Work Queue behavior is personal-scoped.

The broader generic transaction authorization layer still grants historical municipality-wide transaction capabilities.

This is an unresolved authority-policy question and must not be silently normalized by a Code Writer.

## Confirmed backend findings entering the new phase

### SEM-01 — Dashboard scope composition

Department Head UAT showed:

- Dashboard `Office Work for Action = 1`;
- Work Queue `Incoming Office Work = 0`;
- Department Workspace `Active office work = 0`.

Current source shows the dashboard mixes personal recent attention with current-office unresolved work and then presents the merged result under an office-scoped label/link.

Repair must target the semantic composition/label/link contract, not widen `office_queue`.

### PERF-01 — Document archive materialization

`DocumentArchiveQuery` currently retrieves the full document corpus and performs visibility/filter/pagination after materialization.

This is a confirmed scaling/performance defect.

### AUTH-01 — System Administration Work Queue metadata

System Administration definitions retain `scope="municipal"` metadata while the current RC2 Work Queue query does not grant municipal scope to that profile.

Current behavior is safe under the present consumer path, but the metadata is authority-like and should be reconciled deliberately.

### AUTH-02 — System Administration generic transaction authority

The transaction capability/access layer still grants System Administration broad transaction view/action authority, including transition, assignment and Mayor-decision behavior.

This is established historical behavior and requires a Technical Authority decision before redesign.

### MSG-01 — Prototype messaging audience

Prototype messaging uses fixed named channels but does not enforce per-channel participant membership.

Whether that remains acceptable prototype behavior or becomes protected audience semantics is a Technical Authority decision.

## Current performance/runtime program

Program transition:

`FB0 — FRONTEND / UIUX CLOSEOUT → BACKEND / RUNTIME HARDENING`

Primary backend goals:

- make server behavior make sense across surfaces;
- audit routes and direct authorization;
- reduce unnecessary query/materialization cost;
- improve initial page load and server response;
- preserve bounded pagination;
- reduce N+1 and duplicate aggregate work;
- improve runtime stability;
- measure PostgreSQL query plans before index changes;
- make local/self-hosted validation reproducible;
- preserve current UI/UX unless backend truth requires a bounded presentation correction.

## Self-hosted validation state

Registered runner:

`DEVKRTZ`

Labels:

`self-hosted, Windows, X64`

Status/toolchain readiness:

`NOT YET ACCEPTED AS VALIDATION AUTHORITY`

Current workflows remain Ubuntu/Linux/container oriented.

Do not merely change `runs-on`.

First required infrastructure step:

`E0 — EXACT-MACHINE / SELF-HOSTED / TEST-DATABASE EVIDENCE CLOSURE`

E0 must prove:

- runner online in the intended execution context;
- Git;
- PowerShell;
- PHP 8.4;
- pdo_pgsql / pgsql;
- Composer;
- Node/npm from the runner process;
- PostgreSQL connectivity;
- Playwright/Chromium;
- exact test database guard;
- isolated Laravel runtime on port 18000;
- no UAT checkout/database interference.

## Database boundary

Real local UAT database:

`talibon_portal`

Disposable engineering database:

`talibon_portal_test`

Never run destructive test preparation against `talibon_portal`.

## Current next action

No Code Writer is authorized by FB0.

Maintainer sequence:

1. reconcile current authority/docs;
2. close exact-machine evidence gaps;
3. perform/finish backend route/query/authorization/performance audit;
4. obtain Technical Authority decisions for unresolved product/authority semantics;
5. issue bounded Forge Code Writer waves;
6. Reviewer;
7. Acceptance;
8. exact promotion where applicable.

## Evidence law

Only observed evidence may be claimed.

Do not convert:

- UI/UX UAT PASS into backend closure;
- source inspection into runtime PASS;
- runner registration into runner readiness;
- test-db evidence into UAT-db evidence;
- current role composition into a defect without product authority;
- historical evidence into current exact-SHA evidence unless ancestry/source inheritance is proven.

## Historical provenance

Older MP5, STK1, OW1, CAL1, BH1, DA1, RC1 and RV1 documents remain historical evidence.

They are not current authority merely because they exist under `.forge` or `docs`.

Live Git and this current SSOT take precedence.
