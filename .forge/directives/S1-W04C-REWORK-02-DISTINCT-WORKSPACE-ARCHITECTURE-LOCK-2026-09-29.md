# ONE TALIBON — S1-W04C REWORK-02 DISTINCT WORKSPACE ARCHITECTURE LOCK

Role:

`KIRION FORGE: MAINTAINER`

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Technical Authority:

**Kirch Ivan Balite**

Program:

`SEPTEMBER 30 PROTOTYPE SHOWCASE PREPARATION`

Lock issued:

`2026-09-29 +08`

Governing implementation branch at lock issue:

`KIRCH-TALIBON-S1-W04C-FUTURE-SYSTEM-PROTOTYPE-SURFACES`

Exact W04C candidate source at lock issue:

`f408d327f1f7263be55d6cc5941fcacf455e28bf`

Live `main` observed at lock issue:

`4f7fc567e8d8f4f524ac847901950a5296b4db8d`

Immutable accepted W04B product base remains:

`93a73faa23bb2c8e3b982b2b90f87eefdc617438`

Current operating mode:

`VISUAL-FIRST / TESTS DEFERRED UNTIL SHOWCASE FREEZE`

---

## 1. PURPOSE

This directive locks the next ONE TALIBON presentation architecture after local visual review of W04C REWORK-01.

The immediate problem is no longer whether the future systems have enough cards, tabs or interactions.

The problem is that too many systems still present through the same visible page skeleton, while Procurement still wastes vertical and horizontal space through an oversized header and permanent detail rail.

The governing design principle is therefore:

> **ONE TALIBON provides one shell and one design system. Each municipal system provides its own workspace architecture.**

Shared primitives are required.

Shared visible composition is not.

The showcase must communicate that Procurement is a procurement system, GIS is a geographic system, HR is a personnel directory, Budget is a financial control workspace, Fleet is a fleet system, Knowledge is a library, and Citizen Action is a service desk — while all remain unmistakably part of ONE TALIBON.

This lock supersedes any interpretation of W04C that requires FUT-02 through FUT-15 to remain visibly rendered through one universal workspace skeleton.

---

## 2. SOURCE AUTHORITY / PRECEDENCE

For this lane, authority is:

1. explicit current instruction from Kirch Ivan Balite;
2. this lock;
3. current live repository truth and authorization boundaries;
4. `.forge/directives/S1-CORRECTED-SHOWCASE-IMPLEMENTATION-PLAN-2026-09-29.md`;
5. prior W04/W04B/W04C handoffs and evidence where not superseded here;
6. screenshots and storyboard references as design-flow evidence only.

This directive changes presentation architecture only.

It does not reopen the accepted backend baseline.

---

## 3. CORE DESIGN SYSTEM RULE

ONE TALIBON keeps a shared design grammar:

- authenticated shell;
- sidebar;
- top utility/search bar;
- typography;
- spacing rhythm;
- border radii;
- semantic status colors;
- compact tables;
- metric cards;
- buttons;
- filter controls;
- drawers;
- timelines;
- badges;
- page density;
- municipal green identity.

The system must NOT force every module into the same composition.

The architectural target is:

```text
ONE TALIBON shell
    |
    +-- shared design primitives
    |
    +-- Procurement workspace
    +-- Budget / monitoring workspace
    +-- GIS workspace
    +-- Regulatory / permit workspace
    +-- Citizen service workspace
    +-- Analytics workspace
    +-- Asset workspace
    +-- Inventory workspace
    +-- Fleet workspace
    +-- Conservative integration workspace
    +-- Knowledge workspace
```

`FutureSystemPrototype.tsx` may remain temporarily as a shared engine or compatibility layer, but it is no longer the desired visible architecture for every module.

Implementation should move toward small shared primitives plus distinct archetype/workspace composition.

Do not create fourteen entirely unrelated design systems.

Do not retain one visibly cloned page either.

---

## 4. PROCUREMENT — LOCKED INFORMATION ARCHITECTURE

Procurement remains the primary static interactive showcase system.

### 4.1 Header compression

The current Procurement header is too tall.

Target:

- reduce header vertical footprint by approximately 35–45%;
- keep `Procurement / PR Tracking` dominant;
- place `BAC / General Services` and the functional description on one compact metadata line where practical;
- keep `PROCUREMENT OPERATIONS` as a small context label if useful;
- keep `PRESENTATION ENVIRONMENT` compact and secondary;
- do not use a large amber warning card.

Recommended visible hierarchy:

```text
PROCUREMENT OPERATIONS
Procurement / PR Tracking
BAC / General Services · Purchase requests, sourcing, delivery & inspection
                                               PRESENTATION ENVIRONMENT
```

The user should reach operational information immediately.

### 4.2 Permanent right rail is removed

The always-visible Request Details + activity + documents rail is no longer the desired desktop model.

Reason:

- it steals approximately 25–35% of the table width;
- creates horizontal scroll in the register;
- forces the left content container to visually inherit excessive height;
- creates large blank white regions;
- duplicates content across tabs.

Replace it with a shared `DetailDrawer` / right-side inspector opened when the user selects a request.

Target width:

`380–430px` desktop.

The drawer may overlay the content or use a bounded push layout where the current shell supports it cleanly.

It must not permanently shrink the main table.

### 4.3 Overview is a control surface, not a table duplicate

Procurement Overview must answer:

> **What is moving through procurement right now?**

Primary structure:

1. compact semantic KPI row;
2. operational two-column section;
3. compact lifecycle / stage summary.

Recommended desktop composition:

```text
[ Open PRs ] [ For Sourcing ] [ For Delivery ] [ For Inspection ]

[ Active Procurement ~65% ] [ Process Attention ~35% ]
                             [ Recent Movement ]

[ compact lifecycle / workflow stages ]
```

`Active Procurement` is a compact list, not the full dense register.

Each row may show:

- PR number;
- request;
- office;
- status;
- stage;
- amount.

`Process Attention` should show actionable-looking but non-operational counts such as sourcing, delivery and inspection workload.

`Recent Movement` should show concise request movement/history from reference data.

### 4.4 Purchase Requests is table-first

The full procurement register belongs in `Purchase Requests`.

It should use the entire available main-content width.

Preferred columns:

- PR No.;
- Request;
- Requesting Office;
- Current Stage;
- Status;
- Amount;
- Updated / Context.

At normal 1366–1536 desktop widths the table should avoid a horizontal scrollbar whenever practical.

Selecting a row opens the detail drawer.

### 4.5 Procurement Flow is lifecycle-first

`Procurement Flow` should not visually resemble the Purchase Requests table.

It should present:

`PR -> PPMP / APP -> RFQ -> PO -> Delivery -> Inspection -> Payment`

with stage columns/cards and request distribution.

Stage selection may focus requests and update drawer context.

No operational advance/approve/process controls.

### 4.6 Delivery & Inspection is fulfillment-first

This tab should emphasize downstream fulfillment:

- delivery state;
- inspection state;
- requesting office;
- amount/reference;
- next handoff;
- delivery/inspection reference context.

This may use a dedicated fulfillment register or split operational board.

It should not look like the Purchase Requests tab with different labels.

---

## 5. SHARED DETAIL DRAWER PRIMITIVE

A reusable detail drawer is authorized for presentation surfaces.

Primary use:

- Procurement request detail;
- HR employee quick preview;
- GIS location detail;
- asset/fleet detail where suitable.

Shared behavior:

- opens from row/card/marker selection;
- 380–430px desktop target;
- close control;
- accessible focus behavior where practical;
- responsive full-width/sheet treatment on small screens;
- no persistence or network action required solely for drawer behavior.

The drawer is a shared primitive.

Its content remains module-specific.

---

## 6. FUTURE SYSTEMS — DISTINCT WORKSPACE FAMILIES

The following visible identities are locked.

| System | Primary visual identity | Main workspace |
| --- | --- | --- |
| Procurement / PR Tracking | lifecycle + operational register | PR queue, flow, delivery |
| Budget & Obligation Monitoring | financial control cockpit | utilization, obligations, balances |
| GIS / Mapping Portal | map-first | map, layers, location inspector |
| Zoning & Locational Clearance | case workflow + geographic context | applications, evaluation, site context |
| Building Permit Workflow | permit dossier | applications, clearance matrix, permit flow |
| Business Permit / eBOSS | application processing | intake, assessment, clearances |
| Citizen Request / Action Center | service inbox | request queue, routing, response history |
| GAD Data Analytics | analytics-heavy | indicators, distributions, program progress |
| CBMS / Socioeconomic Dashboard | geographic analytics | barangay indicators, comparison, map |
| Asset & Property Management | property register | assets, custodian, condition, history |
| Inventory & Supplies | stock-control console | stock levels, alerts, requisition/issuance references |
| Motorpool / Fleet | fleet operations | vehicles, availability, maintenance, trip references |
| Accounting Integration | conservative integration-control | source/reference handoffs, checkpoints |
| Treasury / Revenue Integration | conservative integration-control | collection/payment references, checkpoints |
| Training / Knowledge Management | content/library | search, categories, resource preview |

This table governs visible composition.

A system may reuse an archetype with another system, but module-specific information hierarchy must remain visible.

---

## 7. GIS — GOOGLE MAPS AUTHORITY EXCEPTION

The prior restriction against external map APIs is explicitly reopened **for GIS / mapping surfaces only**.

### 7.1 Authorized external service

Authorized:

**Google Maps JavaScript API**

Purpose:

- real geographic basemap;
- Talibon-centered geographic context;
- presentation markers/layers;
- professional mapping experience.

This does not authorize other third-party services across the product.

### 7.2 Target GIS layout

GIS is map-first.

Recommended desktop composition:

```text
+-------------+-----------------------------------+----------------+
| LAYERS      |                                   | LOCATION       |
|             |                                   | DETAILS        |
| Projects    |                                   |                |
| Roads       |          GOOGLE MAP               | selected item  |
| Zoning      |      TALIBON, BOHOL FOCUS         | category       |
| Property    |                                   | context        |
| Facilities  |                                   | status         |
| Hazards     |                                   |                |
| Businesses  |                                   |                |
+-------------+-----------------------------------+----------------+
```

Target map height:

approximately `65–72vh` where viewport permits.

The map must dominate the page.

Do not place it inside a small generic dashboard card.

### 7.3 Geographic focus

Initial viewport:

`Municipality of Talibon, Bohol, Philippines`

The implementation should use actual Google basemap geography.

Presentation overlays may represent:

- Projects;
- Government Properties;
- Facilities;
- Hazards;
- Businesses;
- Zoning references.

Road context may rely primarily on the Google basemap unless a specific authorized overlay is available.

### 7.4 Marker implementation

Prefer current Google Maps advanced markers rather than deprecated legacy marker patterns.

Markers may be ONE TALIBON styled.

Marker selection should open/update the module detail drawer or location inspector.

### 7.5 Municipal boundary

Do not fabricate a Talibon municipal boundary.

A boundary polygon may be drawn only from a legitimate/authoritative or otherwise explicitly accepted GeoJSON/source.

If such a boundary is not available before showcase, use the real Google basemap without a fake boundary.

### 7.6 Configuration

Use environment configuration such as:

- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_GOOGLE_MAPS_MAP_ID`

Do not hardcode credentials into source.

Do not commit actual keys.

### 7.7 API-key restrictions

The showcase/browser key must be restricted in Google Cloud.

Minimum direction:

- application restriction: HTTP referrers;
- API restriction: Maps JavaScript API only;
- authorize localhost / `127.0.0.1` for local showcase;
- authorize exact external showcase/tunnel hostname only when required.

No unrestricted key.

### 7.8 Maps failure fallback

GIS must degrade gracefully if Maps cannot initialize because of:

- missing key;
- referrer restriction;
- billing;
- quota;
- internet/network failure;
- tunnel hostname mismatch.

Required fallback:

- clear `Map temporarily unavailable` presentation state;
- layer/location register remains usable;
- page must not render blank or crash.

### 7.9 GIS scope exclusions

Not authorized in this lane:

- Places autocomplete;
- Directions API;
- Street View product integration;
- backend geocoding service;
- live GPS tracking;
- live municipal GIS database;
- fabricated real-world coordinates presented as authoritative.

---

## 8. HR EMPLOYEE PORTAL — TARGETED REFINEMENT

HR Employee Portal is already one of the strongest current surfaces.

It is not to be rebuilt into a fake broad HRIS dashboard.

The purpose of HR refinement is:

- improve product-facing copy;
- improve identity scanning;
- add useful derived presentation from existing truth;
- improve employee inspection/navigation.

### 8.1 Header

Current defensive copy listing excluded HRIS domains is too prominent.

Preferred product-facing description:

`Municipal personnel directory, office assignments and portal access reference.`

Use a small context label such as:

`PERSONNEL DIRECTORY`

Do not advertise payroll, DTR, attendance, leave or performance.

Those remain out of current rollout scope.

### 8.2 Summary metrics

Keep the existing real summary metrics.

Preferred four-card summary:

- Employees;
- Municipal Offices;
- Portal Accounts;
- Portal Coverage.

`Portal Coverage` may be derived only from existing real summary values:

`portalAccounts / employees`

Do not invent additional HR statistics.

If denominator is zero, handle safely.

### 8.3 Employee table identity treatment

Improve identity scanability without making rows taller than necessary.

Authorized ideas:

- initials/avatar circle;
- name;
- employee number;
- work email;
- office badge/context;
- position;
- portal status;
- profile chevron.

Maintain compact density.

### 8.4 Employee quick preview drawer

Authorized employee quick-preview drawer fields are limited to existing record truth such as:

- name;
- employee number;
- work email;
- position;
- office;
- employment status;
- portal account state.

Drawer includes:

`Open full profile ->`

Do not add HR-management controls.

No edit/payroll/DTR/leave/attendance/performance actions.

---

## 9. IMPLEMENTATION WAVES

The chronological visual implementation order is locked.

### WAVE A — HIGHEST SHOWCASE IMPACT

1. Procurement information architecture correction
   - compressed header;
   - remove permanent detail rail;
   - detail drawer;
   - overview restructuring;
   - full-width request register;
   - distinct flow and delivery compositions.

2. GIS
   - real Google Maps surface;
   - Talibon focus;
   - layer rail;
   - markers;
   - location drawer;
   - graceful fallback.

3. HR
   - compact product-facing copy;
   - fourth derived summary card;
   - identity table polish;
   - employee preview drawer.

### WAVE B — REPRESENTATIVE DISTINCT WORKSPACE FAMILIES

Implement visibly distinct composition for:

- Budget;
- Building Permit;
- Citizen Action Center;
- Asset Management;
- Motorpool / Fleet;
- Knowledge Management.

These establish reusable workspace/archetype families.

### WAVE C — APPLY THE FAMILIES

Apply/refine architecture for:

- Zoning;
- eBOSS;
- GAD;
- CBMS;
- Inventory;
- Accounting;
- Treasury.

Do not sacrifice Wave A to complete Wave C polish.

---

## 10. ARCHITECTURAL IMPLEMENTATION PREFERENCE

Preferred implementation direction:

Shared primitives under bounded municipal-system UI ownership, for example:

- `ModuleHeader`
- `MetricCard`
- `StatusChip`
- `FilterBar`
- `DetailDrawer`
- `ActivityTimeline`
- `DataRegister`
- `StageBoard`
- `MapWorkspace`

Then distinct compositions/workspace families such as:

- `ProcurementWorkspace`
- `BudgetWorkspace`
- `GISWorkspace`
- `RegulatoryWorkflowWorkspace`
- `CitizenActionWorkspace`
- `AnalyticsWorkspace`
- `AssetWorkspace`
- `InventoryWorkspace`
- `FleetWorkspace`
- `IntegrationWorkspace`
- `KnowledgeWorkspace`

Exact component names are not mandatory.

The architectural outcome is mandatory:

> shared design primitives, distinct product composition.

Avoid both extremes:

- one giant configurable renderer;
- fourteen copy-pasted bespoke applications.

---

## 11. VISUAL ACCEPTANCE TARGET

At 1366–1536 desktop width:

### Procurement

- operational content appears high in the first viewport;
- header is compact;
- no persistent right rail;
- no large blank left-side panel;
- normal Purchase Requests table avoids horizontal scrolling where practical;
- Overview, Purchase Requests, Flow and Delivery are visibly distinct.

### GIS

- map is immediately dominant;
- geographic context visibly centers Talibon;
- layers visibly control overlay context;
- selected marker/location produces relevant inspection detail;
- map failure produces graceful fallback, not a broken screen.

### HR

- compact header;
- four truthful summary cards if derived coverage is implemented;
- employee identity is easier to scan;
- row/detail interaction is professional;
- no broad HRIS claims.

### Future systems

A stakeholder should be able to identify the type of system from layout alone before reading its title.

That is the required distinction standard.

---

## 12. FROZEN BOUNDARIES

Unless a later explicit Kirch instruction supersedes this lock, remain frozen:

- accepted backend/runtime behavior;
- database/schema/migrations/seeders;
- auth/MFA architecture;
- authorization/permission widening;
- Dashboard / W03;
- W01 shell hierarchy;
- W02 guided-tour behavior;
- Quick Access;
- broad HRIS;
- payroll;
- DTR;
- attendance;
- leave management;
- performance management;
- operational Procurement persistence;
- operational Procurement approvals;
- real financial/accounting rules;
- real Treasury collection rules.

Google Maps is the only newly authorized external integration and only for GIS presentation scope as defined above.

---

## 13. VISUAL-FIRST VALIDATION POLICY

Current sprint priority remains visual-first due showcase time pressure.

Deferred until final freeze unless a direct blocker appears:

- full PHPUnit suite;
- browser automation suite;
- broad CI;
- nonessential regression sweeps.

Still desirable when cheap and available:

- frontend production build;
- exact Git diff inspection;
- local runtime visual proof;
- manual interaction proof on priority pages;
- source boundary audit.

Deferred means `NOT RUN`, not `PASS`.

---

## 14. DEFINITION OF SUCCESS

The showcase succeeds when:

- Procurement feels like procurement;
- GIS feels geographic and visibly belongs to Talibon;
- HR feels like a personnel directory;
- Budget looks financial;
- Fleet looks logistical/operational;
- Knowledge looks like a resource library;
- Citizen Action looks like a service inbox;
- all systems still clearly belong to ONE TALIBON.

The architecture must communicate modularity through a shared product system without communicating cloning through repeated page composition.

---

## 15. LOCK STATUS

Status:

`LOCKED BY MAINTAINER`

Next implementation authority must consume this directive explicitly.

No implementation is performed by this lock commit.

No merge.

No promotion.

No deployment.

No `main` mutation.
