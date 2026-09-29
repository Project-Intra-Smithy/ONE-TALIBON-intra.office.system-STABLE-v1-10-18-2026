# KIRION FORGE — ONE TALIBON V1

## S1-W04C — MAIN SHOWCASE + 14 FUTURE SYSTEM FULL-PROTOTYPE SURFACES

### CODE WRITER HANDOFF

ROLE CALL:

**KIRION FORGE: CODE WRITER**

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Technical Authority:

**Kirch Ivan Balite**

Forge authority:

`Kirch-Nairu/KIRION-FORGE@44eb57e5b45b343be0033bf22a7a5e74d543c01a`

Immutable product base:

`main@93a73faa23bb2c8e3b982b2b90f87eefdc617438`

Writer branch:

`KIRCH-TALIBON-S1-W04C-FUTURE-SYSTEM-PROTOTYPE-SURFACES`

Current implementation authority:

`.forge/directives/S1-CORRECTED-SHOWCASE-IMPLEMENTATION-PLAN-2026-09-29.md`

## FINAL CLIENT-ALIGNED CORRECTION

Sir Gerry's source document prioritizes exactly five initial-rollout modules:

1. Document Routing & Correspondence
2. Task / Executive Dashboard
3. Project Monitoring
4. Procurement / PR Tracking
5. HR Employee Portal

Procurement and HR must therefore **not be buried inside Future Integrations**.

### Main Showcase direct access

Add two first-class direct sidebar destinations under the primary `WORK` area:

- **Procurement / PR Tracking**
- **HR Employee Portal**

Required Work order:

1. Document Center
2. Tasks & Assignments
3. Correspondence
4. Procurement / PR Tracking
5. HR Employee Portal
6. Municipal Records
7. Official Memoranda
8. Announcements
9. Calendar
10. Meetings
11. Messages

This keeps the frequency-first work hierarchy while making the two explicitly requested rollout modules immediately visible.

### HR sidebar behavior

Reuse the existing real route:

`/employees`

Change the navigation presentation from:

`Staff Directory`

to:

`HR Employee Portal`

Move it from Municipal Organization into the primary Work group.

Do not duplicate it in Municipal Organization.

The page remains the current personnel-reference foundation.

Do not activate broad HRIS.

### Procurement sidebar behavior

Add a dedicated authenticated presentation route:

`/procurement`

Sidebar label:

`Procurement / PR Tracking`

This route is explicitly authorized as **presentation-only**.

It must render the full static interactive Procurement showcase prototype.

It must not query procurement data, persist anything, or expose operational create/approve/pay actions.

A clean implementation is to reuse the same W04C prototype engine and enter directly into Procurement mode from the dedicated route.

## The count is now 14 Future Integrations

Procurement is promoted into the Main Showcase and is no longer counted in the Future Integrations catalog.

The Future Integrations catalog must therefore contain exactly:

`FUT-02` through `FUT-15`

= **14 future systems**

Do not renumber the existing FUT IDs.

## Product goal

The current W04B concept sheets are too brochure-like.

Every showcase surface must visually answer:

> "What would this system actually look like and how would people work inside it?"

The client should see a believable application surface, not explanatory paragraphs.

## Truth model

There are now three states:

### A. Current real modules

Examples:

- Document Routing / Correspondence
- Dashboard / Tasks
- Project Monitoring
- HR Employee Portal personnel reference

These use their real current routes.

### B. Main Showcase static prototype

- Procurement / PR Tracking

It gets first-class sidebar access and a full interactive static prototype.

It is **not operational**.

### C. Future Integrations

Exactly 14 modules:

- FUT-02 through FUT-15

Each gets a full static interactive future-system prototype inside Future Integrations.

## Shared presentation truth

Every static prototype must show:

`Interactive Concept Preview`

and:

`Illustrative prototype data — not live municipal records`

The warning must be visible but secondary.

**Show the product first. Explain the boundary second.**

Allowed interactions:

- switch internal module tabs;
- select illustrative records;
- change client-side filters;
- inspect a workflow stage;
- switch category/layer;
- open a local detail panel.

React state only.

No network request.
No persistence.
No form submission.
No backend workflow.

## ONE TALIBON native visual grammar

Reuse patterns already in the repository:

- `PageFrame`
- `PageHeader`
- `municipal-panel`
- compact summary cards
- status badges
- filters
- registers/tables
- progress bars
- tabs/workspace navigation
- selected-item detail panels
- compact responsive layouts

The prototypes must look like native ONE TALIBON modules.

Do not create a separate design system.

Do not recreate Sir Gerry's AI storyboard literally.

## Shared prototype architecture

Do not hand-code fourteen unrelated future pages plus Procurement.

Build one reusable prototype engine with module-specific configuration.

Preferred bounded architecture:

- `FutureSystemPrototype.tsx`
- optional small archetype components
- `futureSystemPrototypeData.ts`

The shared engine should support:

- masthead;
- internal tabs;
- summary metrics;
- lifecycle/status strip;
- local filters;
- main register/workspace;
- selected record/detail;
- secondary module panel;
- integration context;
- compact concept-only boundary.

## MAIN SHOWCASE — PROCUREMENT / PR TRACKING

Procurement is the **reference-quality prototype** for this wave.

Direct route:

`/procurement`

It must look like a credible procurement tracking system.

### Procurement internal navigation

Use 3–4 tabs such as:

- Overview
- Purchase Requests
- Procurement Flow
- Delivery & Inspection

### Procurement overview

Immediately show:

- compact status cards;
- lifecycle:
  `PR -> PPMP/APP -> RFQ -> PO -> Delivery -> Inspection -> Payment`
- current illustrative queue;
- selected request detail;
- current stage;
- requesting office;
- amount/reference if used;
- related-document/reference area;
- next handoff.

### Illustrative Procurement records

Use generic examples only:

- `PR-2026-014 — Office network equipment`
- `PR-2026-021 — Road maintenance materials`
- `PR-2026-027 — Health office supplies`

Clearly label them illustrative.

No real Talibon procurement claim.

### Procurement boundary

No:

- real PR creation;
- RFQ generation;
- PO issuance;
- delivery acceptance;
- inspection approval;
- payment processing;
- persistence.

## MAIN SHOWCASE — HR EMPLOYEE PORTAL

Direct sidebar destination:

`HR Employee Portal`

Existing route:

`/employees`

Keep the current real employee/personnel-reference UI.

Do not broaden it.

Do not advertise:

- payroll;
- DTR;
- attendance;
- leave;
- performance;
- broad HRIS administration

as current capability.

Do not invent Regular / Job Order / Casual counts without a real read contract.

## FUTURE INTEGRATIONS — EXACTLY 14

### FUT-02 — Budget & Obligation Monitoring

Archetype:

`MONITORING / ANALYTICS`

Must visibly resemble a budget-monitoring application.

Include:

- Appropriations
- Allotments
- Obligations
- Balances
- Office utilization

Design:

- KPI cards;
- utilization bars;
- office utilization register;
- selected office/program detail;
- tabs such as Overview / Obligations / Utilization / Reports.

### FUT-03 — GIS / Mapping Portal

Archetype:

`MAP / SPATIAL`

Scope:

- Projects
- Roads
- Zoning
- Government properties
- Facilities
- Hazards
- Businesses

Design:

- map-style CSS canvas;
- layer panel/toggles;
- illustrative pins/markers;
- selected-location panel;
- layers/status legend;
- tabs such as Map / Layers / Locations.

No external map API.
No real coordinates required.

### FUT-04 — Zoning & Locational Clearance System

Archetype:

`WORKFLOW / CASE MANAGEMENT`

Scope:

- Applications
- Evaluation
- GIS validation
- Inspections
- Clearances
- Certificates

Design:

- application queue;
- lifecycle stages;
- selected application detail;
- clearance status;
- local tab navigation.

### FUT-05 — Building Permit Workflow

Archetype:

`WORKFLOW / CASE MANAGEMENT`

Scope:

- Engineering clearance
- Zoning clearance
- Fire clearance
- Other departmental clearances
- Permit processing

Design:

- permit application queue;
- cross-office clearance matrix;
- current stage/progress;
- selected application;
- required clearances/status.

### FUT-06 — Business Permit / eBOSS Integration

Archetype:

`WORKFLOW / CASE MANAGEMENT`

Scope:

- Business applications
- Assessment
- Clearances
- Inspection
- Renewal

Design:

- application/renewal queue;
- lifecycle strip;
- clearance matrix;
- assessment/status panel;
- selected business/application detail.

### FUT-07 — Citizen Request / Action Center

Archetype:

`WORKFLOW / CASE MANAGEMENT`

Scope:

- Complaints
- Requests
- Referrals
- Status tracking
- Response time

Design:

- citizen concern queue;
- category/status cards;
- routing/office assignment;
- SLA/response-time indicator;
- selected request history.

Do not use real citizen identities.

### FUT-08 — GAD Data Analytics

Archetype:

`MONITORING / ANALYTICS`

Scope:

- Sex-disaggregated data
- GPB / GAR monitoring
- Sectoral statistics

Design:

- illustrative KPI cards;
- sector/category filters;
- monitoring tables;
- GPB/GAR progress;
- simple CSS bars/indicators.

No chart dependency.

### FUT-09 — CBMS / Socioeconomic Dashboard

Archetype:

`MONITORING / ANALYTICS`

Scope:

- Barangay demographics
- Poverty indicators
- Planning analytics

Design:

- illustrative planning KPIs;
- barangay/indicator selector;
- comparison table;
- status/trend indicators;
- selected indicator detail.

Do not imply real CBMS household data.

### FUT-10 — Asset & Property Management

Archetype:

`ASSET / LOGISTICS REGISTER`

Scope:

- Vehicles
- Computers
- Furniture
- Buildings
- Equipment
- Accountability

Design:

- asset summary;
- asset register;
- category/condition/custody status;
- selected asset;
- accountability/history preview.

### FUT-11 — Inventory & Supplies System

Archetype:

`ASSET / LOGISTICS REGISTER`

Scope:

- Stock requests
- Issuance
- Inventory levels
- Reorder alerts

Design:

- stock summary;
- inventory register;
- stock-level/reorder indicators;
- request/issuance status;
- selected item detail.

### FUT-12 — Motorpool / Fleet Management

Archetype:

`ASSET / LOGISTICS REGISTER`

Scope:

- Vehicle scheduling
- Fuel
- Maintenance
- Trip tickets
- GPS

Design:

- fleet status strip;
- vehicle register;
- schedule/trip-ticket list;
- maintenance/fuel indicators;
- selected vehicle detail;
- static map/location placeholder if useful.

No real GPS integration.

### FUT-13 — Accounting Integration

Archetype:

`INTEGRATION`

The source authority only names Accounting as a future plug-in.

Keep conservative.

Design may show:

- shared-record handoff queue;
- reference/integration status;
- source module;
- reference number;
- integration checkpoints;
- ONE TALIBON connection points.

Do not invent:

- journal rules;
- ledger behavior;
- disbursement workflow;
- financial statements;
- accounting approval rules.

### FUT-14 — Treasury / Revenue Integration

Archetype:

`INTEGRATION`

Keep conservative.

Design may show:

- future collection/payment reference handoff;
- source module;
- reference status;
- integration checkpoints;
- revenue/treasury connection direction.

Do not invent:

- tax schedules;
- receipt behavior;
- collection policy;
- treasury approval workflow.

### FUT-15 — Training / Knowledge Management

Archetype:

`KNOWLEDGE`

Scope:

- Manuals
- SOPs
- Templates
- Videos
- Onboarding
- Institutional knowledge

Design:

- search;
- category tabs;
- resource cards/library;
- recent/featured references;
- onboarding collection;
- selected resource preview.

## Future Integrations catalog behavior

The `Future Integrations` catalog must show exactly the 14 modules above.

Remove Procurement from the Future Integrations list.

Procurement instead appears in:

- Main Showcase / Initial Rollout;
- direct Work sidebar;
- direct `/procurement` presentation route.

Change future CTA from:

`View concept`

to:

`Preview system`

Every FUT-02 through FUT-15 item must open its full prototype.

## Initial Rollout presentation

Keep exactly five priorities:

1. Document Routing & Correspondence — Current / Working
2. Task / Executive Dashboard — Current / Working
3. Project Monitoring — Current / Working
4. Procurement / PR Tracking — Main Showcase / Interactive Static Prototype
5. HR Employee Portal — Current Personnel Reference

Procurement CTA:

`Open Procurement Prototype`

HR CTA may use the real `/employees` route.

Do not rebuild Dashboard.

## Navigation implementation

### Add destination key

Add a bounded destination for Procurement, e.g.:

`procurementTracking`

### Route

Add:

`/procurement`

Authenticated presentation route only.

It may render the existing MunicipalSystems page in dedicated Procurement mode or a thin dedicated presentation page that reuses the shared prototype component.

No controller/database query is required.

### Work group ordering

Update navigation definitions/order so Work presents:

- Document Center
- Tasks & Assignments
- Correspondence
- Procurement / PR Tracking
- HR Employee Portal
- Municipal Records
- Official Memoranda
- Announcements
- Calendar
- Meetings
- Messages

### HR movement

Keep destination key `employeeDirectory` if practical.

Change:

- label: `HR Employee Portal`
- group: `work`

Remove it from Municipal Organization through the group move; do not duplicate.

### Future Integrations

Keep one Municipal Systems child:

`Future Integrations`

Do not add FUT-02..FUT-15 individually to sidebar.

## Authorized paths

### Future-system presentation

- `resources/js/pages/MunicipalSystems/Index.tsx`
- `resources/js/components/municipal-systems/SystemDirectory.tsx`
- `resources/js/components/municipal-systems/FutureIntegrationDetail.tsx`
- `resources/js/data/municipal/systems.ts`
- bounded new files under:
  - `resources/js/components/municipal-systems/**`
  - `resources/js/data/municipal/**`

### Main Showcase navigation

- `resources/js/navigation/navigationTypes.ts`
- `resources/js/navigation/navigationRoutePlan.ts`
- `resources/js/navigation/navigationDestinations.ts`
- `resources/js/navigation/navigationOrder.ts`

### Static Procurement presentation route

- `routes/web.php`

This route change is explicitly authorized by Technical Authority for showcase presentation.

### Focused contract proof if wording/order contract requires it

- `tests/Feature/CurrentPortalNavigationTest.php`

Do not run the full suite.

## Forbidden

No:

- Procurement backend/controller/query;
- Procurement persistence;
- Procurement operational forms;
- migrations/schema;
- seeders;
- auth/MFA redesign;
- permission widening for real modules;
- Dashboard change;
- Quick Access change;
- broad HRIS activation;
- dependency/lockfile change;
- external maps/charts;
- 14 future-system sidebar entries;
- CI work.

## Validation

Time-boxed.

Maximum total validation effort:

`5 minutes`

If available:

- `npm run types:check`
- `npm run build`

Do not run full Feature.

Do not run broad browser suites.

Maintainer will manually inspect:

1. Procurement direct sidebar + full prototype;
2. HR Employee Portal direct sidebar;
3. Future Integrations count = 14;
4. Budget;
5. GIS;
6. Building Permit;
7. Asset / Inventory / Fleet;
8. Accounting/Treasury conservative previews.

## Done definition

W04C is complete only when:

- Procurement / PR Tracking has first-class direct sidebar access;
- Procurement opens a full static interactive system prototype;
- HR Employee Portal has first-class direct sidebar access;
- the Future Integrations catalog contains exactly 14 systems — FUT-02 through FUT-15;
- all 14 future systems open full module-like prototypes, not brochure sheets;
- every prototype has internal local navigation;
- every prototype has module-specific work surfaces;
- all sample data is explicitly illustrative;
- procurement remains non-operational;
- HR remains personnel-reference focused;
- Dashboard is untouched;
- no real backend workflows are added.

## Return

Return only:

1. role;
2. branch;
3. immutable base;
4. final HEAD;
5. exact changed paths;
6. Procurement direct-sidebar implementation;
7. HR Employee Portal direct-sidebar implementation;
8. Procurement route implementation;
9. Future Integrations exact count / list;
10. shared prototype architecture;
11. archetypes implemented;
12. FUT-02 through FUT-15 completeness;
13. Procurement prototype summary;
14. Budget/GIS/regulatory/logistics/knowledge preview summary;
15. Accounting/Treasury conservative treatment;
16. illustrative-data truth statement;
17. typecheck/build result or NOT RUN;
18. limitations;
19. explicit no procurement backend/schema/auth/Dashboard/dependency/merge/promotion/deployment statement.

Do not self-accept.
Do not self-promote.
