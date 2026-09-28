# ONE TALIBON V1 — PROTOTYPE SHOWCASE COMMAND DIRECTIVE

Technical Authority:

**Kirch Ivan Balite**

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Directive date:

`2026-09-28 22:12 +08`

Showcase:

`2026-09-30 15:00 +08`

Time remaining at directive issue:

`40 hours 48 minutes`

## 1. Mission

The governing objective is no longer broad backend improvement.

The governing objective is:

> **Deliver one stable, responsive, credible and recoverable ONE TALIBON prototype for the September 30, 2026 3:00 PM stakeholder showcase, then freeze that exact state as the prototype-presentation baseline.**

Every remaining task must be judged against one question:

`Does this materially increase the probability that the prototype showcase succeeds?`

If the answer is no, defer it.

This directive supersedes any tendency to reopen broad architecture, speculative hardening, cleanup or feature expansion before the showcase.

## 2. Current authority and immediate critical path

Live main at directive issue:

`6481491134928413389240b9a82ff422ffc51ceb`

Current B1 exact candidate:

`314b6661b34d4a70272d2a079f7cdda238b522ae`

B1 exact-machine result:

- targeted Records validation: `21 passed / 630 assertions`;
- BH1/BH2: `3 passed / 25 assertions`;
- full Feature regression: `400 passed / 5291 assertions`;
- `records.inertia: 22 -> 17 queries`;
- `documents.records: 22 -> 17 queries`;
- Reviewer disposition: `SUITABLE FOR ACCEPTANCE`.

### Immediate instruction

Finish the **current B1 Acceptance / promotion work first**.

Do not begin another backend wave in parallel.

When B1 is accepted and promoted, that promoted state becomes:

`PROTOTYPE BACKEND BASELINE`

After that point, backend changes are frozen except for a presentation-blocking defect proven by direct rehearsal evidence.

## 3. Stakeholder / audience reality

Sir Gerry's current expected showcase attendance:

`16-20 participants`

The shared Talibon Dashboard `02 EXECUTIVE DEPARTMENTS` structure contains:

- **20 principal numbered executive offices / department-level office entries** (`01` through `20`);
- **4 subordinate/specialized sub-office entries** (`01.1`, `01.2`, `02.1`, `02.2`);
- **24 organizational folders total** inside the Executive Departments folder.

For showcase planning, use:

`20 PRINCIPAL DEPARTMENT / OFFICE HEAD SLOTS`

not 24.

The expected attendance of 16-20 therefore represents a near-full Department Head / office-head audience rather than a small technical review.

Principal dashboard offices:

1. Mayor's Office
2. MPDC
3. Municipal Engineering Office
4. Municipal Assessor's Office
5. Municipal Agriculture's Office
6. Municipal Health Office
7. Municipal Civil Registrar
8. Municipal Social Welfare and Development Office
9. Municipal Budget Office
10. Municipal Accounting Office
11. Municipal Treasurer's Office
12. Human Resource Development Office
13. Municipal PESO
14. Municipal Tourism Office
15. Talibon Market Office
16. Talibon Integrated Transport Terminal
17. MDRRMO
18. MENRO
19. General Services Office
20. TPC

Sub-office / specialized entries observed separately:

- Municipal Administrator
- Talibon Traffic Management Office
- MPDC Zoning Administration
- LEDIPO

## 4. Confirmed showcase stakeholder classes

The presentation must be optimized for:

- Department Heads / principal office heads;
- designated LGU representatives and users;
- the MPDO / project focal side led by Sir Gerry;
- technical / functional representatives participating in evaluation;
- other authorized LGU representatives present for prototype review.

Do not assume every named official will attend unless separately confirmed.

The prototype should therefore explain municipal workflow value in operational language, not engineering language.

## 5. Presentation product thesis

For this audience, do not demonstrate menu breadth.

Demonstrate:

1. **cross-office accountability**;
2. **where work is now**;
3. **who is responsible**;
4. **what action happened**;
5. **what changed after an action**;
6. **how management sees status without chasing offices manually**;
7. **that unauthorized users do not gain access merely because they know a URL**.

The strongest story is:

`Engineering -> Budget -> Mayor -> Engineering`

because it makes routing, responsibility, decision authority, traceability and final status visible in one sequence.

Records, Correspondence, Memoranda, Calendar, Messages, Legislative and selected HR surfaces support the story; they are not equal-weight presentation objectives.

## 6. Scope law until showcase

### Authorized after B1

- light UI corrections already identified by Technical Authority;
- presentation-critical wording / spacing / density fixes;
- broken presentation interaction repair;
- deterministic showcase/demo data preparation;
- runtime / startup hardening;
- Cloudflare Quick Tunnel rehearsal;
- responsive desktop/mobile verification;
- presentation-flow rehearsal;
- bounded performance repair only when an observed showcase path fails or becomes materially slow;
- recovery / restart preparation;
- presentation documentation and runbook.

### Not authorized before showcase without direct blocker evidence

- broad backend hardening waves;
- architecture redesign;
- new modules;
- schema redesign;
- speculative indexes;
- Redis/cache architecture;
- generalized CI redesign;
- System Administration authority redesign;
- Messaging membership redesign;
- DocumentArchiveQuery redesign merely because PERF-01 exists;
- code cleanup/refactoring with no presentation effect;
- feature expansion to impress stakeholders.

Known findings remain recorded, but being known does not make them showcase blockers.

## 7. Phase plan

### PHASE S0 — B1 closure and backend freeze

**Window:** now, September 28.

Objective:

- complete Acceptance of exact B1 candidate;
- perform authorized non-force promotion;
- verify promoted SHA;
- record backend presentation baseline;
- freeze backend.

Exit condition:

`B1 PROMOTED + BACKEND PRESENTATION BASELINE PINNED`

No UI work outranks this current task.

### PHASE S1 — light UI correction and presentation-flow lock

**Window:** after S0 through September 29 morning.

Objective:

Apply only the Technical Authority's remaining light UI corrections.

Rules:

- no broad redesign;
- no new IA program;
- no backend semantics changes hidden inside frontend work;
- no unnecessary component churn;
- no cosmetic work on surfaces outside likely showcase flow unless extremely low risk.

Priority surfaces:

1. public / entry experience;
2. workspace gateway / persona switching;
3. Dashboard;
4. My Work / transaction detail;
5. Correspondence;
6. Records;
7. Memoranda;
8. Calendar;
9. Messages;
10. selected Legislative / HR showcase paths.

Exit condition:

`SHOWCASE UI CANDIDATE PINNED`

### PHASE S2 — exact integrated validation

**Window:** September 29 midday.

Objective:

Validate the exact integrated backend + UI candidate.

Required:

- exact SHA;
- clean checkout;
- test DB isolation;
- typecheck;
- production frontend build;
- targeted presentation-critical Feature tests;
- full Feature regression once on the final integrated candidate;
- cacheability;
- browser smoke;
- no tracked source mutation.

Do not repeat expensive broad validation after every cosmetic commit. Batch the UI work, then validate the exact candidate once.

Exit condition:

`INTEGRATED SHOWCASE CANDIDATE GREEN`

### PHASE S3 — Cloudflare Quick Tunnel / delivery rehearsal

**Window:** September 29 afternoon.

Objective:

Prove the application through the actual presentation transport.

Cloudflare Quick Tunnel is a prototype-day transport mechanism, not a claim of final production hosting.

Validate through the generated public tunnel URL:

- public homepage;
- workspace gateway;
- authenticated navigation;
- transaction creation and cross-office state changes;
- Records;
- Correspondence;
- Memoranda;
- Calendar;
- Messages;
- selected HR / Legislative paths;
- uploads/downloads if they are part of the actual presentation;
- browser refresh;
- reconnect after brief client disconnect.

Test on:

- primary presentation laptop;
- second laptop/device;
- at least one phone/mobile viewport.

Engineering concurrency target:

`25 concurrent lightweight browser sessions`

This is a showcase-safety target with headroom over the expected 16-20 attendees, not a TOR contractual capacity claim.

Do not load-test destructive write flows at 25-way concurrency. Use predominantly reads/navigation with a small controlled number of writes.

Record:

- local response behavior;
- tunnel-facing response behavior;
- unexpected 4xx;
- unexpected 5xx;
- browser console errors/page errors;
- tunnel disconnect behavior.

Exit condition:

`TUNNEL DELIVERY GREEN`

### PHASE S4 — full presentation rehearsal and failure recovery

**Window:** September 29 evening.

Run the stakeholder sequence end-to-end without developer intervention.

Core rehearsal:

1. public entry / introduction;
2. Department Head workspace;
3. Engineering creates high-priority funding request to Budget;
4. Budget receives and routes/reviews;
5. Mayor decides;
6. Engineering sees final status and trace;
7. show Records / search;
8. Mayor publishes memorandum;
9. Employee acknowledges;
10. management sees acknowledgement;
11. Calendar;
12. bounded Messages exchange;
13. selected Legislative / HR proof;
14. authorization-denial proof only if stable and presentation-useful;
15. controlled application restart;
16. recovery through presentation URL.

Run with unique deterministic demo references.

No terminal repair during the timed rehearsal.

Any failure is classified:

- PRODUCT BLOCKER;
- DATA / FIXTURE BLOCKER;
- TUNNEL / NETWORK BLOCKER;
- PRESENTATION SCRIPT ERROR;
- OPERATOR ERROR;
- NON-BLOCKING DEFECT.

Only PRODUCT / DATA / DELIVERY blockers reopen code.

Exit condition:

`FULL SHOWCASE REHEARSAL PASS`

### PHASE S5 — showcase-day freeze and launch

**Window:** September 30.

#### Morning

- start from frozen exact candidate;
- verify DB/demo dataset;
- build/cache/start;
- one bounded smoke;
- one tunnel smoke;
- confirm presentation devices.

#### Freeze

Target:

`NO LATER THAN SEPTEMBER 30 10:00 +08`

After freeze:

- no feature work;
- no visual experimentation;
- no refactor;
- no dependency update;
- no branch archaeology.

Only a reproducible showstopper can break freeze.

#### 13:00-14:00

- establish runtime;
- establish Cloudflare Quick Tunnel;
- record current tunnel URL;
- verify public and authenticated access;
- verify presentation machine power/network;
- verify backup connection option;
- pre-open required tabs only after URL is final.

#### 14:00-14:30

- final room/device smoke;
- no source changes;
- reset demo data only through the approved deterministic method.

#### 14:30 onward

`HANDS OFF CODE`

Presentation preparation only.

#### 15:00

`ONE TALIBON PROTOTYPE SHOWCASE`

## 8. Reliability standard

The prototype-day candidate is not green merely because tests pass.

It is green only when:

- startup is repeatable;
- the public tunnel is reachable;
- major pages are responsive;
- no unexplained 5xx occurs;
- no browser pageerror blocks flow;
- demo identities/data are deterministic;
- cross-office actions persist correctly;
- refreshes recover;
- application restart recovers;
- the presenter does not need a terminal during the scripted flow;
- one known recovery procedure exists.

## 9. Baseline freeze package

The final prototype baseline must pin:

1. exact Git SHA;
2. exact database / deterministic demo-data preparation;
3. exact environment/runtime configuration;
4. exact production build output basis;
5. exact Cloudflare launch/runbook procedure;
6. exact stakeholder presentation flow;
7. exact recovery procedure;
8. known non-blocking limitations.

This becomes the post-showcase implementation baseline unless stakeholder feedback explicitly changes it.

## 10. Decision priority

From this directive onward:

`SHOWCASE SUCCESS > CODE CLEANLINESS`

`SHOWCASE RELIABILITY > FEATURE BREADTH`

`KNOWN WORKING STATE > LAST-MINUTE IMPROVEMENT`

`DIRECT OBSERVATION > ASSUMPTION`

`FREEZE > DRIFT`

## 11. Maintainer instruction

Forge Maintainer must actively prevent scope drift.

Current sequence is mandatory:

`B1 CLOSE -> BACKEND FREEZE -> LIGHT UI -> INTEGRATED VALIDATION -> TUNNEL REHEARSAL -> FULL DRESS REHEARSAL -> FREEZE -> SHOWCASE`

Do not reopen a completed phase without direct evidence that the showcase cannot safely proceed.
