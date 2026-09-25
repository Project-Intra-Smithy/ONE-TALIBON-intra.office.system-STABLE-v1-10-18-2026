# KIRION FORGE — ONE TALIBON V1

## BH1 — BACKEND / RUNTIME PERFORMANCE HARDENING

### CODE WRITER HANDOFF

ROLE CALL:

KIRION FORGE: CODE WRITER

## AUTHORITY

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Technical Authority:

Kirch Ivan Balite

Forge authority:

`Kirch-Nairu/KIRION-FORGE`

Pinned Forge SHA:

`44eb57e5b45b343be0033bf22a7a5e74d543c01a`

Writer branch:

`KIRCH-TALIBON-BH1-BACKEND-RUNTIME-HARDENING`

Immutable product base:

`9dba054d34377ce76149d8474ddeb66b5c20130e`

CAL1 scope-freeze record:

`.forge/evidence/maintainer/CAL1-CALENDAR-CANDIDATE-FREEZE.md`

## WHY BH1 EXISTS

The current application has perceptible request/function latency even on localhost.

BH1 is not a UI wave.

BH1 exists to identify and remove actual request-path, query-path, session/auth, Inertia shared-data, serialization, middleware, boot, filesystem, configuration, or local-development bottlenecks before more feature expansion.

Do not compensate for backend latency with cosmetic loaders, artificial delays, optimistic fakery, hidden refreshes, or UI-only workarounds.

## PRIMARY OUTCOME

Make common authenticated One Talibon navigation and interaction feel immediate on local/self-hosted runtime while preserving current behavior, authorization, data isolation, and CAL1 presentation.

BH1 must produce evidence that explains:
- where request time is spent;
- which paths are actually slow;
- what was changed;
- measurable before/after behavior;
- which suspected bottlenecks were ruled out.

## START GATE

Before editing:

1. Fetch origin.
2. Switch to `KIRCH-TALIBON-BH1-BACKEND-RUNTIME-HARDENING`.
3. Verify the branch descends from:
   `9dba054d34377ce76149d8474ddeb66b5c20130e`.
4. Verify the CAL1 candidate-freeze record exists.
5. Inspect current repo-local governance and architecture.
6. Do not reset, rebase, squash, force-push, or rewrite accepted history.

## BH1 EXECUTION ORDER

### BH1-A — MEASURE BEFORE REPAIR

Instrument/measure representative requests.

At minimum inspect:
- first authenticated page request;
- subsequent authenticated navigation;
- Home/Dashboard;
- My Work;
- Correspondence;
- Records;
- Calendar month;
- Calendar week/day;
- Messages;
- any mutation currently perceived as slow.

Capture enough timing evidence to distinguish:
- framework/application boot;
- database query time/count;
- authorization/policy work;
- session/auth middleware;
- Inertia shared props;
- page-specific query services;
- eager/lazy relationship loading;
- serialization/payload size;
- filesystem/logging/config overhead;
- Vite/HMR development overhead versus PHP/server response time.

Do not begin broad optimization until at least one bottleneck is evidenced.

### BH1-B — REQUEST BOOT / GLOBAL SHARED WORK

Audit code that executes on most authenticated requests:
- middleware stack;
- Inertia shared data;
- service providers;
- navigation/shared municipal context;
- notifications/count badges;
- current-user employee/department hydration;
- weather or external-data helpers if present;
- repeated configuration/filesystem reads.

Eliminate repeated work only when behavior remains authoritative.

### BH1-C — DATABASE / QUERY PATH

Inspect:
- repeated identical queries;
- N+1 relationships;
- unbounded collections;
- count/existence queries that can be combined or deferred;
- unnecessary eager loading;
- missing high-value indexes supported by actual query shapes;
- repeated role/department lookups;
- per-row policy/access checks that can be safely scoped in query authority.

Do not add speculative indexes or caches without evidence.

### BH1-D — CALENDAR PATH

CAL1 is frozen, but its request path is in scope for performance verification.

Inspect:
- `CalendarController`;
- `CalendarWorkspaceQueryService`;
- relationship loading;
- range predicates;
- ordering;
- event volume/payload;
- month/week/day/schedule response behavior.

Preserve:
- Month / Week / Day / Schedule contract;
- Municipality / My Office / My Events visibility boundaries;
- deterministic bounded windows;
- current CAL1 presentation.

### BH1-E — SESSION / AUTH / SECURITY

Measure and preserve:
- authentication;
- active-account enforcement;
- authorization;
- MFA/security boundaries already in force;
- CSRF/session behavior.

Performance work must not weaken access control.

### BH1-F — LOCALHOST VS SELF-HOST SEPARATION

Separate application/server response latency from frontend dev-tool latency.

Verify whether slowness comes from:
- PHP/Laravel request handling;
- database;
- Node/Vite HMR;
- browser asset reloads;
- Windows filesystem/antivirus;
- debug/logging configuration;
- cache/config/view compilation state.

A fast production build with a slow dev server and a slow backend request are different defects. Record them separately.

### BH1-G — TARGETED REPAIR

After measurement, repair the highest-impact proven bottlenecks first.

Prefer:
- query consolidation;
- bounded reads;
- correct eager loading;
- eliminating duplicate global work;
- request-local memoization where correct;
- framework config optimization;
- narrower Inertia partial reload payloads;
- deferring truly non-critical work when semantics permit.

Avoid:
- broad persistent caching that risks stale municipal data;
- hidden background state;
- authorization bypass;
- database denormalization without need;
- frontend redesign;
- feature expansion.

## MEASUREMENT EXPECTATIONS

Use repeatable measurements, not one subjective click.

For each repaired representative path, retain:
- endpoint/page;
- warm/cold condition;
- request count if relevant;
- DB query count if available;
- server/request duration;
- payload size when material;
- before/after comparison.

Do not invent a universal millisecond target if environment variance makes one dishonest. The required result is a demonstrated material reduction in proven bottlenecks and removal of obvious pathological work.

## TEST / REGRESSION GATES

Run the smallest useful gates continuously during repair.

Before BH1 closeout, verify at minimum:
- relevant targeted Feature tests;
- `CalendarWorkspaceTest` if calendar runtime code changed;
- authorization/security tests affected by modified query/middleware code;
- TypeScript check if frontend request mechanics changed;
- production frontend build;
- relevant Laravel/PHP test gate;
- route/runtime smoke verification.

Do not spend time babysitting CI. Local evidence first; CI only as final corroboration when useful.

## SCOPE PROHIBITIONS

Do NOT:
- redesign Calendar;
- start CAL2;
- add Google Calendar synchronization;
- add new municipal modules;
- rework Messages product semantics;
- replace authentication architecture;
- weaken permissions;
- change visual language;
- rewrite Git history;
- merge to main;
- deploy;
- claim Acceptance.

## REQUIRED WRITER RETURN

Return exactly:
1. role;
2. immutable BH1 base;
3. final writer HEAD;
4. lineage/ahead-behind from immutable base;
5. measured bottlenecks found;
6. repairs made, grouped by request/query/runtime layer;
7. before/after evidence;
8. tests/gates executed and results;
9. CAL1 preservation statement;
10. security/authorization preservation statement;
11. files changed;
12. migrations/index/config/package impact;
13. remaining performance risks;
14. exact next recommended Maintainer action.

## STOP CONDITION

BH1 is ready for Maintainer review when:
- the dominant observed localhost/server latency has been identified;
- targeted repairs are committed;
- common paths no longer exhibit the same pathological delay under repeatable local testing;
- no current feature/authorization regression is reproduced;
- CAL1 remains behaviorally intact;
- evidence is sufficient for an independent review without relying on chat memory.
