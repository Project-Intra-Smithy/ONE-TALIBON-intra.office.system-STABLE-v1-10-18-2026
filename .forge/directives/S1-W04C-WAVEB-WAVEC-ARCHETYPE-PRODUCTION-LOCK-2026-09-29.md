# S1-W04C WAVE B / WAVE C — ARCHETYPE + PRODUCTION LOCK

Date: 2026-09-29
Program: SEPTEMBER 30 PROTOTYPE SHOWCASE PREPARATION
Repository: Kirch-Nairu/Talibon-Sales-Prototype
Technical Authority: Kirch Ivan Balite
Governing lane: S1-W04C — FUTURE SYSTEM FULL-PROTOTYPE SURFACES

## 1. PURPOSE

This directive exists to prevent design and implementation drift while the remaining Future Integration systems are completed under showcase time pressure.

The program is split into two different kinds of work:

- **WAVE B = INVENT AND LOCK THE VISUAL / INTERACTION FAMILIES.**
- **WAVE C = APPLY THOSE LOCKED FAMILIES TO THE REMAINING MODULES.**

Wave C is not a second design-exploration phase.

Once an archetype is visually accepted, later systems must adapt its architecture instead of inventing another generic template or restarting product design from zero.

## 2. NON-NEGOTIABLE PRODUCT PRINCIPLE

> **ONE TALIBON shares one shell and one design system. It does not share one visible page template.**

Shared primitives are encouraged and expected:

- module headers;
- compact semantic summary blocks;
- filters;
- tables/registers;
- status chips;
- activity timelines;
- detail modals;
- drawers where specifically appropriate;
- cards;
- progress indicators;
- empty states;
- loading/fallback states;
- typography, spacing, border, radius and semantic-color rules.

However, different municipal products must not be forced into the same visible composition merely because they share React primitives.

**Reuse architecture and primitives, not cloned screens.**

## 3. CURRENT LOCKED / GOVERNING W04C DIRECTION

The following decisions remain governing unless Kirch Ivan Balite explicitly reopens them:

### Procurement / PR Tracking

Product identity: workflow / procurement lifecycle / fulfillment.

Locked interaction grammar:

- compact operational header;
- semantic procurement summary cards;
- Overview control surface;
- full-width Purchase Requests register;
- Procurement Flow lifecycle board;
- Delivery & Inspection downstream view;
- centered standard request-detail modal with Summary / Activity / Documents.

Do not reuse this composition as the default for unrelated Future Integration systems.

### HR Employee Portal

Product identity: personnel directory / employee reference.

Locked interaction grammar:

- compact personnel directory header;
- truthful employee / office / portal summary;
- identity-oriented employee register;
- compact centered employee quick-preview modal;
- existing full employee profile navigation.

Do not broaden into payroll, DTR, attendance, leave, performance or general HRIS behavior.

### GIS / Mapping Portal

Product identity: spatial / map-first workspace.

The layout architecture is locked as:

- layers / references on the left;
- map/spatial canvas dominant in the center;
- selected location context on the right.

Google Maps remains a good-to-have enhancement for the current showcase and may stay deferred. The non-map fallback must remain usable and professional.

## 4. WAVE B OBJECTIVE

Wave B exists to establish the **distinct reusable product families** needed by the remaining Future Integration systems.

Wave B must finish and visually lock six archetypes:

| FUT | System | Locked family to establish |
| --- | --- | --- |
| FUT-02 | Budget & Obligation Monitoring | Financial monitoring / utilization |
| FUT-07 | Citizen Request / Action Center | Service desk / inbox |
| FUT-10 | Asset & Property Management | Register / custody / condition |
| FUT-05 | Building Permit Workflow | Regulatory case / application dossier |
| FUT-12 | Motorpool / Fleet Management | Fleet operations / resource availability |
| FUT-15 | Training / Knowledge Management | Library / knowledge / content |

These six are **archetype work**, not bulk production work.

Each archetype must have an immediately identifiable product identity even if the page title were hidden.

## 5. WAVE B IMPLEMENTATION SEQUENCE

Maximum parallel Code Writers during archetype invention: **2**.

### Pair 1

- FUT-02 Budget & Obligation Monitoring
- FUT-07 Citizen Request / Action Center

### Pair 2

- FUT-10 Asset & Property Management
- FUT-05 Building Permit Workflow

### Pair 3

- FUT-12 Motorpool / Fleet Management
- FUT-15 Training / Knowledge Management

Do not start a third archetype worker while two archetype workers are already active.

After each pair:

1. independent Maintainer source review;
2. local production build where available;
3. browser visual review;
4. bounded visual rework only if required;
5. visual lock;
6. integrate into the governing W04C candidate;
7. only then start the next pair.

## 6. ARCHETYPE DEFINITIONS

### A. Financial Monitoring Family — FUT-02 Budget

Primary visual grammar:

- approved / obligated / available amounts;
- utilization percentage;
- comparative progress bars;
- budget-line monitoring;
- attention / threshold context;
- dense right-aligned financial figures.

It must not look like Procurement with financial labels.

### B. Service Desk Family — FUT-07 Citizen Action

Primary visual grammar:

- queue navigation;
- ticket / request inbox;
- priority and status;
- routing states;
- response / activity history;
- service-desk workload context.

It must not look like a generic dashboard or Budget analytics screen.

### C. Register / Custody Family — FUT-10 Asset Management

Primary visual grammar:

- asset register;
- asset identity / property number;
- category;
- owning/custodian office;
- current condition;
- location / assignment reference;
- custody / condition / movement history;
- selected asset inspection.

The dominant mental model is **municipal property custody and condition**, not workflow stages.

### D. Regulatory Case Family — FUT-05 Building Permit

Primary visual grammar:

- application / case dossier;
- applicant/site reference without unnecessary PII;
- requirements / clearance matrix;
- stage / status;
- inspection or review references;
- selected case detail.

The dominant mental model is **regulatory case processing and completeness**, not a generic ticket inbox.

### E. Fleet Operations Family — FUT-12 Motorpool

Primary visual grammar:

- vehicle identity;
- availability;
- current assignment/reference;
- maintenance/service state;
- trip / usage context;
- service-due attention;
- vehicle detail/history.

Motorpool may reuse Asset primitives but must not visually collapse into the Asset register.

### F. Library / Knowledge Family — FUT-15 Knowledge Management

Primary visual grammar:

- search;
- categories / collections;
- featured resources;
- resource cards/list;
- selected material preview;
- training / reference context.

The dominant mental model is **finding and consuming institutional knowledge**, not queues, lifecycle boards or finance monitoring.

## 7. WAVE C START CONDITION

Wave C must **NOT** start until all six Wave B archetypes above are visually locked or Kirch Ivan Balite explicitly authorizes an exception.

Once the archetypes are locked, Wave C becomes a production/adaptation lane.

At that point, one strong Code Writer may own the remaining Wave C systems in one bounded branch because the worker is no longer being asked to invent seven unrelated product designs.

## 8. WAVE C SINGLE-WORKER STRATEGY

Wave C may be assigned to **one Code Writer** on one dedicated Wave C branch based on the then-current integrated W04C candidate.

The worker's job is:

- map each remaining system to an established family;
- reuse accepted primitives and interaction grammar;
- introduce only the module-specific differences needed for product identity;
- preserve presentation/static boundaries;
- avoid generic-template regression;
- avoid unnecessary shared-file churn;
- make coherent, reviewable commits by module or small module group.

The Wave C worker must not redesign the six locked Wave B archetypes.

## 9. WAVE C FAMILY-TO-MODULE MATRIX

| FUT | System | Required source family | Required module-specific distinction |
| --- | --- | --- | --- |
| FUT-04 | Zoning & Locational Clearance | Regulatory Case family | Site/location emphasis, zoning classification/context, locational-clearance requirements and reference inspection context |
| FUT-06 | Business Permit / eBOSS | Regulatory Case family | Business application identity, permit requirements/assessment references, inter-office clearance context |
| FUT-11 | Inventory & Supplies | Register / Custody family | Stock quantity, stock state, reorder/attention level, issuance/request references; must feel like stock control rather than property custody |
| FUT-08 | GAD Data Analytics | Financial/monitoring primitives with an analytics-specific composition | Program/indicator monitoring, distributions, comparative indicators, progress; must not imply live official GAD datasets |
| FUT-09 | CBMS / Socioeconomic Dashboard | Analytics + GIS/spatial composition | Barangay/socioeconomic indicators, spatial drilldown/reference context; must not imply live authoritative CBMS records |
| FUT-13 | Accounting Integration | Conservative Integration/Handoff family already established in W04C | Shared-record references, source-system handoffs, checkpoints/status only |
| FUT-14 | Treasury / Revenue Integration | Conservative Integration/Handoff family already established in W04C | Collection/payment reference handoffs, source/reference status and checkpoints only |

## 10. REQUIRED WAVE C IMPLEMENTATION ORDER

Unless the Maintainer issues a narrower handoff, the single Wave C worker should implement in this order:

1. FUT-04 — Zoning & Locational Clearance
2. FUT-06 — Business Permit / eBOSS
3. FUT-11 — Inventory & Supplies
4. FUT-08 — GAD Data Analytics
5. FUT-09 — CBMS / Socioeconomic Dashboard
6. FUT-13 — Accounting Integration
7. FUT-14 — Treasury / Revenue Integration

This order deliberately completes the straightforward archetype adaptations before the analytics hybrids and conservative financial integrations.

## 11. WAVE C RULE — REUSE ARCHITECTURE, NOT SCREENS

The following are prohibited:

- copying one locked archetype component and merely changing labels;
- rendering all seven Wave C modules through one visibly identical shell;
- using the same four KPI cards + same table + same right rail for every system;
- changing a title/icon while leaving the information hierarchy unchanged;
- reintroducing the old generic FutureSystemPrototype visible composition as the final product for every module.

Acceptable reuse includes:

- the same DetailDrawer/centered modal primitive;
- shared status chips;
- shared register primitives;
- shared progress bars;
- shared regulatory requirement rows;
- shared activity/timeline components;
- shared map/location inspectors;
- shared header/boundary components;
- shared responsive rules.

The composition must still be specific to the municipal product.

## 12. SELECTED-SYSTEM PAGE-SHELL RULE

When a user opens a specific Future Integration system, the selected system becomes the primary page.

The broad Future Integrations catalog header/tabs must not remain stacked above the product workspace.

Selected systems should use a compact in-product return control such as:

`← Future Integrations`

This rule applies consistently to all distinct Future Integration workspaces unless a specific route provides a dedicated first-class destination such as Procurement.

## 13. PRODUCT-TRUTH / PRESENTATION BOUNDARY

User-facing presentation language should remain professional.

Preferred boundary language:

- `PRESENTATION ENVIRONMENT`
- `Reference data only · Actions disabled`

Avoid prominent developer/mock language such as:

- mock;
- fake;
- prototype data;
- sample fake records;
- developer demo.

Internal engineering identifiers may still use terms such as `Prototype` where useful.

## 14. ACCOUNTING / TREASURY HARD BOUNDARIES

### FUT-13 Accounting Integration

Allowed:

- shared-record handoffs;
- source/reference state;
- integration checkpoints;
- linked document/reference context.

Prohibited unless explicitly authorized later:

- journal-entry semantics;
- ledger behavior;
- disbursement workflows;
- financial statements;
- accounting approval rules;
- posting behavior.

### FUT-14 Treasury / Revenue Integration

Allowed:

- collection/payment reference handoffs;
- source/reference state;
- integration checkpoints;
- linked document/reference context.

Prohibited unless explicitly authorized later:

- tax schedules/rules;
- official receipt behavior;
- collection policy;
- Treasury approval workflow;
- payment posting behavior.

## 15. GIS / CBMS TRUTH BOUNDARY

Do not fabricate authoritative geography, survey-grade coordinates or official municipal boundaries.

If Google Maps remains disabled for the showcase, the GIS/spatial architecture may continue using the professional fallback state.

CBMS must not claim current official socioeconomic data unless such data is actually supplied and authorized.

## 16. PRIVACY BOUNDARY

Presentation/reference systems must avoid unnecessary real-person PII.

Citizen Action remains privacy-safe and must not introduce:

- resident names;
- phone numbers;
- precise home addresses;
- private emails;
- complainant identity.

Other future modules should follow the same minimization principle unless real authorized records are explicitly part of the existing product foundation.

## 17. PARALLELISM RULE

During Wave B archetype invention:

- maximum parallel workers = 2.

During Wave C adaptation:

- default = 1 Code Writer owning the full Wave C production lane.

Do not split Wave C across many workers merely for speed unless the Maintainer proves file ownership can be made non-overlapping and the visual-family rules will remain intact.

The default single-worker model is intentionally chosen to reduce:

- dispatcher conflicts;
- shared-component churn;
- visual drift;
- inconsistent family adaptation;
- integration overhead.

## 18. INTEGRATION RULE

Workers do not self-integrate or self-promote.

After a worker return:

1. Maintainer re-verifies live Git state;
2. exact diff/path ownership is inspected;
3. source architecture is reviewed;
4. local production build is run where available;
5. browser visual acceptance is performed for new archetypes or materially changed products;
6. bounded rework is issued if needed;
7. only accepted candidates are integrated into the governing W04C candidate.

For parallel Wave B branches, integration is sequential and must preserve all explicit module dispatches.

## 19. VALIDATION / SHOWCASE MODE

Current showcase priority remains visual-first.

For each accepted batch:

- `npm run build` is the highest-value quick compile validation when a runnable checkout is available;
- runtime health should be checked after integration;
- automated suites may remain deferred until showcase freeze unless a direct blocker appears;
- no NOT-RUN validation may be represented as PASS.

## 20. ACCEPTANCE TEST FOR DISTINCTNESS

For every Future Integration workspace, ask:

> **If the title were hidden, could a stakeholder still reasonably infer what type of municipal system this is from the information hierarchy and interaction model?**

If the answer is no, the module has not achieved product identity and should not be visually locked.

Examples:

- Budget should read as financial monitoring.
- Citizen Action should read as a service desk.
- Asset should read as custody/property management.
- Building Permit should read as regulatory application processing.
- Motorpool should read as fleet operations.
- Knowledge should read as a searchable institutional library.

## 21. SHOWCASE COMPLETION TARGET

The intended completion path is:

`WAVE B ARCHETYPE LOCK`

→ `INTEGRATE SIX ARCHETYPES INTO W04C`

→ `ONE WAVE C PRODUCTION WORKER APPLIES LOCKED FAMILIES`

→ `WAVE C SOURCE + VISUAL REVIEW`

→ `ONE INTEGRATED W04C CANDIDATE`

→ `PRODUCTION BUILD / RUNTIME SMOKE`

→ `SHOWCASE FREEZE`

Do not reopen already locked products for aesthetic experimentation unless a concrete visual defect or showcase blocker is identified.

## 22. GOVERNING SUMMARY

**Wave B invents. Wave C applies.**

**Two workers maximum while inventing archetypes. One worker by default while producing Wave C adaptations.**

**ONE TALIBON shares primitives and visual grammar, not one cloned page template.**

**Reuse architecture, not screens.**
