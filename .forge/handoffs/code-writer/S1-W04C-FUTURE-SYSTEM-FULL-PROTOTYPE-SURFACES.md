# KIRION FORGE — ONE TALIBON V1

## S1-W04C — FUTURE SYSTEM FULL-PROTOTYPE SURFACES

### CODE WRITER HANDOFF

ROLE CALL:

**KIRION FORGE: CODE WRITER**

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Technical Authority:

**Kirch Ivan Balite**

Forge authority:

`Kirch-Nairu/KIRION-FORGE@44eb57e5b45b343be0033bf22a7a5e74d543c01a`

Immutable base:

`main@93a73faa23bb2c8e3b982b2b90f87eefdc617438`

Writer branch:

`KIRCH-TALIBON-S1-W04C-FUTURE-SYSTEM-PROTOTYPE-SURFACES`

Current implementation authority:

`.forge/directives/S1-CORRECTED-SHOWCASE-IMPLEMENTATION-PLAN-2026-09-29.md`

## Maintainer correction

W04B made each future system enterable, but the result is still a **brochure/detail sheet**.

That is not sufficient for the stakeholder showcase.

The new requirement is:

> **When the presenter enters a Future Integration, it must look and feel like a credible preview of the whole future system — not a paragraph explaining what it could do.**

This is still presentation-only.

Do not implement backend functionality.

Do not create new Laravel routes.

Do not persist anything.

## Product goal

A department head should be able to click:

`Future Integrations -> Procurement / PR Tracking -> View concept`

and immediately see something that resembles a real procurement system:

- module header;
- module navigation;
- summary/status cards;
- workflow/lifecycle;
- a believable static queue/register;
- a detail / status panel;
- integration context;
- clear `Concept Preview` / `Illustrative data` treatment.

The same principle applies to every FUT-01 through FUT-15.

The stakeholder should be able to understand:

> "Ah, mao diay ni mahimong itsura / trabaho sa module once integrated."

without us falsely claiming it is live.

## Truth boundary

The current screenshots over-emphasize warnings such as:

`Concept presentation only`

and under-deliver the actual system preview.

W04C must invert that hierarchy:

1. **show the system first**;
2. keep truth/boundary visible but compact;
3. never imply sample information is real LGU data.

Use a clear persistent label:

`Future Integration — Interactive Concept Preview`

and:

`Illustrative prototype data — not live municipal records`

Client-side presentation interactions are allowed:

- switching concept tabs;
- selecting a sample row;
- changing a static local filter;
- selecting a static workflow stage;
- opening a static preview detail.

These interactions must be React state only.

No network request.

No form submission.

No persistence.

## Repo-backed visual grammar

Reuse patterns already present in the application.

Relevant existing patterns include:

- `PageFrame` compact / wide content;
- `PageHeader`;
- `municipal-panel`;
- summary cards from Project Monitoring / Tasks / Records;
- compact filters;
- dense table/register rows;
- progress/status badges;
- expandable/detail panels;
- tab/workspace navigation;
- responsive desktop-to-narrow behavior.

Do not build an unrelated design system.

Do not copy Sir Gerry's storyboard pixel-for-pixel.

The result must look like a **native ONE TALIBON module**.

## Architecture — one shared prototype engine, module-specific data

Do NOT hand-code 15 unrelated giant pages.

Build one reusable future-module prototype system.

Preferred bounded architecture:

- `FutureSystemPrototype.tsx`
- optional `FutureSystemPrototypeSection.tsx`
- data/config additions under `resources/js/data/municipal/**`

Use module configuration to drive:

- header;
- tabs;
- summary metrics;
- lifecycle/workflow;
- filters;
- static sample register;
- selected-row/detail panel;
- secondary panels;
- integration notes.

The visual structure may vary by **archetype**, but it must remain data-driven.

## Required concept archetypes

Use approximately five reusable archetypes.

### A. WORKFLOW / CASE MANAGEMENT

Use for:

- FUT-01 Procurement / PR Tracking
- FUT-04 Zoning & Locational Clearance
- FUT-05 Building Permit Workflow
- FUT-06 Business Permit / eBOSS
- FUT-07 Citizen Request / Action Center

Expected preview grammar:

- summary cards;
- lifecycle stages;
- work queue / request register;
- office / owner / status;
- selected-item progress or routing detail;
- concept tabs such as Overview / Queue / Workflow.

### B. MONITORING / ANALYTICS

Use for:

- FUT-02 Budget & Obligation Monitoring
- FUT-08 GAD Data Analytics
- FUT-09 CBMS / Socioeconomic Dashboard

Expected preview grammar:

- summary/KPI cards;
- progress/utilization bars;
- category/sector breakdown;
- monitoring register;
- simple static visual indicators;
- concept tabs such as Overview / Monitoring / Reports.

Do not use fake municipal claims without labeling them illustrative.

### C. MAP / SPATIAL

Use for:

- FUT-03 GIS / Mapping Portal

Expected preview grammar:

- map-style canvas / schematic spatial preview using CSS/layout, not external maps;
- visible layer list/toggles;
- sample location pins/markers;
- right-side selected-location detail;
- layer categories matching supplied authority:
  Projects / Roads / Zoning / Government Properties / Facilities / Hazards / Businesses.

No external map API.

No real geospatial data.

### D. ASSET / LOGISTICS REGISTER

Use for:

- FUT-10 Asset & Property Management
- FUT-11 Inventory & Supplies
- FUT-12 Motorpool / Fleet Management

Expected preview grammar:

- summary/status cards;
- register/table;
- status / stock / serviceability signals;
- selected record details;
- module-specific secondary view:
  - asset accountability;
  - stock/reorder;
  - vehicle schedule/fuel/maintenance/trip tickets.

### E. INTEGRATION / KNOWLEDGE

Use for:

- FUT-13 Accounting integration
- FUT-14 Treasury / Revenue integration
- FUT-15 Training / Knowledge Management

Accounting/Treasury:

- integration-status style preview;
- handoff/reference queue;
- shared-record connection points;
- no invented accounting/treasury workflow beyond supplied authority.

Training/Knowledge:

- knowledge categories;
- manuals/SOPs/templates/videos/onboarding;
- recent/reference library;
- search/filter concept;
- learning-resource cards.

## Module-level design requirements

Every future module detail must contain:

### 1. Module masthead

Show:

- module name;
- lead office;
- Future Integration badge;
- Planned / Not Enabled;
- short one-line purpose;
- compact `Illustrative prototype data` notice.

### 2. Internal module navigation

Use 3–4 static client-side tabs appropriate to the archetype.

Examples:

- Overview
- Queue / Register
- Workflow / Monitoring
- Reports / Integration

The tabs must switch visible preview content locally.

This is a key requirement.

The screen must feel like **a system**, not one static information card.

### 3. Summary row

Use 3–5 compact metrics or state cards.

These may use illustrative values only if clearly covered by the global:

`Illustrative prototype data — not live municipal records`

Examples are allowed.

Do not use specific real-person names.

Do not imply these numbers came from Talibon records.

### 4. Main work surface

Must occupy most of the screen.

Use believable module-specific content such as:

- register;
- queue;
- monitoring table;
- map schematic;
- utilization matrix;
- vehicle/asset cards;
- knowledge library.

### 5. Selected-item / context panel

Where appropriate, selecting a static sample row should update a detail panel using React state.

No modal is required unless it fits the current product grammar.

### 6. Integration footer/panel

Keep ONE TALIBON integration context compact.

Do not let explanatory architecture text dominate the page.

### 7. Current boundary

Keep the boundary compact and visible, ideally as a footer/banner:

`Concept preview only — no live municipal records or operational transactions.`

Do not repeat a giant warning panel on every section.

## Required illustrative sample data direction

Sample data is explicitly allowed for this W04C showcase wave if:

- clearly labeled illustrative;
- generic;
- not represented as real municipal records;
- no real citizen data;
- no private employee data;
- no fake client claim that it is currently operational.

Use municipality-relevant but generic examples.

Examples:

### Procurement

- `PR-2026-014 — Office network equipment`
- `PR-2026-021 — Road maintenance materials`
- `PR-2026-027 — Health office supplies`

Statuses may correspond to lifecycle stages.

### Budget

Generic office/utilization examples.

### GIS

Generic locations such as:

- Road rehabilitation project
- Municipal facility
- Flood-prone area
- Government property

No exact coordinates required.

### Building Permit

Generic references such as:

- `BP-2026-0041 — Residential building application`

### Citizen Requests

Generic examples:

- drainage concern;
- streetlight request;
- road obstruction referral.

### Assets

Generic computers, vehicles, furniture, buildings/equipment.

### Inventory

Generic office supplies.

### Fleet

Generic vehicle identifiers such as `Service Vehicle 01`.

### CBMS / GAD

Use clearly illustrative category values, not claims about real municipal demographics.

## Exact client/PDF scope per module

Preserve the same W04B authority:

### FUT-01 Procurement / PR Tracking

- PR
- PPMP / APP
- RFQ
- PO
- delivery
- inspection
- payment

### FUT-02 Budget & Obligation Monitoring

- appropriations
- allotments
- obligations
- balances
- office utilization

### FUT-03 GIS / Mapping Portal

- projects
- roads
- zoning
- government properties
- facilities
- hazards
- businesses

### FUT-04 Zoning & Locational Clearance

- applications
- evaluation
- GIS validation
- inspections
- clearances
- certificates

### FUT-05 Building Permit Workflow

- engineering clearance
- zoning clearance
- fire clearance
- other departmental clearances
- permit processing

### FUT-06 Business Permit / eBOSS

- business applications
- assessment
- clearances
- inspection
- renewal

### FUT-07 Citizen Request / Action Center

- complaints
- requests
- referrals
- status tracking
- response time

### FUT-08 GAD Data Analytics

- sex-disaggregated data
- GPB / GAR monitoring
- sectoral statistics

### FUT-09 CBMS / Socioeconomic Dashboard

- barangay demographics
- poverty indicators
- planning analytics

### FUT-10 Asset & Property Management

- vehicles
- computers
- furniture
- buildings
- equipment
- accountability

### FUT-11 Inventory & Supplies

- stock requests
- issuance
- inventory levels
- reorder alerts

### FUT-12 Motorpool / Fleet

- vehicle scheduling
- fuel
- maintenance
- trip tickets
- GPS

### FUT-13 Accounting integration

Keep conservative.

The authority names Accounting as an integration domain but does not define a full detailed workflow.

Do not invent journals, disbursement procedures, financial statements, or approval rules beyond a generic future handoff/reference integration preview.

### FUT-14 Treasury / Revenue integration

Keep conservative.

The authority names Treasury as an integration domain but does not define a full detailed workflow.

Do not invent collection rules, tax schedules, official receipt behavior, or treasury approval workflows.

### FUT-15 Training / Knowledge Management

- manuals
- SOPs
- templates
- videos
- onboarding
- institutional knowledge

## Procurement is the showcase reference implementation

FUT-01 must receive the strongest complete treatment because it is one of the five initial-rollout priorities.

Its default Overview should immediately show:

- summary/status strip;
- procurement lifecycle;
- current sample work queue;
- selected request detail;
- office/status/amount placeholder if used;
- integration context.

Its internal tabs should provide a credible visual story of:

`PR -> PPMP/APP -> RFQ -> PO -> Delivery -> Inspection -> Payment`

without implementing any actual procurement behavior.

The other modules should use the same quality level with their correct archetype.

## Initial Rollout tab

Keep the five-item Initial Rollout tab.

For Procurement:

- `Preview future system` should enter FUT-01 full prototype.

For current modules:

- do not create fake previews where the real module already exists.

If safe and already-authorized routing is available, existing current modules may retain links to their real pages; otherwise leave current state presentation unchanged.

## Catalog behavior

Keep Future Integrations catalog and filters.

Change CTA from generic `View concept` to something stronger such as:

`Preview system`

or:

`Open prototype`

Preferred:

`Preview system`

Every FUT-01 through FUT-15 must work.

## Responsive behavior

The screenshots show the current sidebar correctly compacts at narrower widths.

The future-system prototype itself must:

- remain usable around 1366x768;
- degrade to stacked panels at narrow desktop/tablet widths;
- not require browser resizing to access its primary content;
- avoid horizontal page overflow.

Tables may internally overflow only when necessary and should prefer responsive card fallbacks if the pattern is already simple.

## Performance

This entire Future Integrations experience should remain **frontend-static**.

Do not add server queries.

Do not add heavy libraries.

Do not add map/chart packages.

Use existing CSS/Tailwind and lucide-react.

The concept should feel instant once `/municipal-systems` is loaded.

## Authorized paths

Primary:

- `resources/js/pages/MunicipalSystems/Index.tsx`
- `resources/js/components/municipal-systems/SystemDirectory.tsx`
- `resources/js/components/municipal-systems/FutureIntegrationDetail.tsx`
- `resources/js/data/municipal/systems.ts`

May add bounded presentation files under:

- `resources/js/components/municipal-systems/**`
- `resources/js/data/municipal/**`

Suggested:

- `FutureSystemPrototype.tsx`
- `FutureSystemMapPreview.tsx`
- `futureSystemPrototypeData.ts`

Only add files that materially help keep the 15 previews data-driven.

## Forbidden

No:

- PHP/backend;
- Laravel routes;
- schema/migrations;
- seeders;
- auth/MFA;
- permission changes;
- Dashboard;
- Quick Access;
- sidebar hierarchy;
- HR Employee Portal;
- dependency/lockfile changes;
- external map/chart packages;
- CI;
- real data fetches;
- fake functional forms;
- persistence.

## Validation

Time-boxed.

Do not run full Feature.

Do not run broad browser matrices.

Writer may run:

- `npm run types:check`
- `npm run build`

only if available and within **5 minutes total**.

Maintainer will visually inspect:

1. Procurement;
2. GIS;
3. Budget;
4. Building Permit;
5. Asset/Fleet;
6. Accounting conservative preview.

## Done definition

W04C is complete only when:

- the Future Integrations detail no longer reads like a brochure;
- each FUT-01 through FUT-15 opens a credible whole-system static prototype;
- every prototype has internal local navigation;
- every prototype has module-specific main content;
- illustrative data is visibly labeled as illustrative;
- Procurement looks presentation-ready as a future initial-rollout system;
- all previews remain consistent with ONE TALIBON design;
- there is no backend behavior;
- there are no fake claims of current operational capability.

## Return

Return only:

1. role;
2. branch;
3. immutable base;
4. final HEAD;
5. exact changed paths;
6. shared prototype architecture;
7. prototype archetypes implemented;
8. internal local navigation behavior;
9. FUT-01 through FUT-15 completeness;
10. Procurement full-system preview summary;
11. GIS preview summary;
12. Budget / monitoring preview summary;
13. Asset/logistics preview summary;
14. Accounting/Treasury conservative treatment;
15. illustrative-data truth statement;
16. typecheck/build result or NOT RUN;
17. limitations;
18. explicit no backend/route/schema/auth/permission/dependency/Dashboard/HR/merge/promotion/deployment statement.

Do not self-accept.
Do not self-promote.
