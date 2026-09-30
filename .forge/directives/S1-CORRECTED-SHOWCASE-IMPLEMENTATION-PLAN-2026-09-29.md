# ONE TALIBON V1 — S1 CORRECTED SHOWCASE IMPLEMENTATION PLAN

Role:

`KIRION FORGE: MAINTAINER`

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Technical Authority:

**Kirch Ivan Balite**

Forge authority:

`Kirch-Nairu/KIRION-FORGE@44eb57e5b45b343be0033bf22a7a5e74d543c01a`

Corrected-plan base:

`main@5b7cc259b89d7d68abe26c47b67dc7abe864efac`

Showcase:

`2026-09-30 15:00 +08`

## 1. Why this correction exists

This directive supersedes the implementation-order and scope-expansion parts of:

`.forge/directives/S1-M0-FINAL-UI-ARCHITECTURE-IMPLEMENTATION-LOCK.md`

The previous M0 correctly captured several product truths, but it drifted by turning bounded showcase corrections into a broader UI program and by authorizing a dedicated Dashboard wave.

That is corrected here.

The governing rule is:

> **Implement only the concrete defects and client-requested prototype presentation requirements supplied by Kirch. Preserve the current working dashboard and product grammar. Missing pipeline systems may be shown as STATIC / PRESENTATION-ONLY Future Integrations, but must not be made to look functional.**

## 2. Source authority

Use this precedence:

1. explicit current instruction from Kirch Ivan Balite;
2. current client clarifications relayed by Kirch;
3. live repository truth;
4. Sir Gerry's supplied Intra-Office Portal pipeline PDF;
5. accepted showcase command directive;
6. screenshot intake observations;
7. storyboard / generated reference images as **design-flow references only**.

Reference images do not independently authorize product scope.

## 3. Client / PDF architecture that must not be missed

The supplied PDF defines ONE TALIBON as a **Digital Operations Platform** with the Core Intra-Office Portal acting as the municipal digital backbone.

Core architecture direction:

- unified authenticated access / Single Sign-On direction;
- Employee/User Directory;
- Document Routing;
- Notifications;
- Task/Workflow Engine;
- Digital Approval;
- Audit Trail;
- Central File Repository;
- API / Integration Layer.

The PDF then describes plug-in domains such as:

- Planning;
- HR;
- Budget;
- Procurement;
- Treasury;
- Accounting;
- Zoning;
- Engineering;
- eBOSS;
- GAD;
- CBMS;
- GIS;
- Project Monitoring;
- Citizen Services.

Design principle:

`encode once, use many times`

The showcase must communicate this architecture truthfully.

## 4. Initial rollout — exactly five highlighted modules

The five initial-rollout modules to highlight are:

1. **Document Routing & Correspondence**
2. **Task / Executive Dashboard**
3. **Project Monitoring**
4. **Procurement / PR Tracking**
5. **HR Employee Portal**

These are not all in the same implementation state.

### 4.1 Document Routing & Correspondence

Current prototype classification:

`FUNCTIONAL / PRIMARY`

Current supporting surfaces include:

- Document Center;
- Correspondence;
- Municipal Records;
- Official Memoranda;
- Tasks / routed transactions.

### 4.2 Task / Executive Dashboard

Current prototype classification:

`FUNCTIONAL / PRIMARY`

Current Dashboard structure is preserved.

**There is no authorized S1 Dashboard rewrite or recomposition.**

Do not create a new Priority Systems dashboard section.

Do not rebuild Quick Access from the storyboard.

If a later screenshot exposes a concrete Dashboard defect, handle only that defect.

### 4.3 Project Monitoring

Current prototype classification:

`FUNCTIONAL / PRIMARY`

Current issue is discoverability in the shell / guided tour, not fundamental absence.

### 4.4 Procurement / PR Tracking

Current prototype classification:

`STATIC / FUTURE INTEGRATION PRESENTATION`

The page may describe the intended pipeline:

`PR -> PPMP/APP -> RFQ -> PO -> delivery -> inspection -> payment`

It must not imply that the complete workflow is currently implemented.

No fake route.

No fake records.

No fake buttons that look operational.

### 4.5 HR Employee Portal

Current client clarification overrides the broader PDF wording.

For this prototype:

`HR EMPLOYEE PORTAL != BROAD HRIS`

Use the existing Staff Directory / employee reference foundation.

Show personnel-reference / employee-archive value.

The client specifically discussed Regular / Job Order / Casual personnel visibility.

Current Staff Directory contract does not expose reliable `employment_type`, so do not invent counts or categories.

If those categories are required as actual data, that is a separate bounded read-model decision requiring Technical Authority approval.

Do not advertise:

- payroll;
- DTR;
- attendance;
- leave;
- performance;
- broad HRIS administration

as current rollout capability.

## 5. PDF modules already represented by current prototype foundations

These may be described as current / supporting only to the extent current routes and contracts support them.

### Current supporting

- **Local Special Bodies Portal** -> Councils, Boards & Committees foundation.
- **Planning Information System** -> Development Plans, PPAs, Project Monitoring foundation.
- **Legal / Ordinance & Resolution Repository** -> Ordinances & Issuances / legislative repository foundation.
- **Meeting & Task Management** -> Tasks & Assignments, Calendar, Meetings.
- **Records Archive / e-Records** -> Document Center + Municipal Records foundation.

Do not overclaim formal records retention/disposition if the current prototype does not implement it.

### Partial / foundation only

- **Training / Knowledge Management** -> some training/onboarding/development records exist in repository history, but there is no dedicated current general Knowledge Management portal. Do not present it as a completed standalone current module.
- **Data Privacy & Cybersecurity Module** -> authentication, MFA, authorization, audit/security and protected-file controls exist as platform foundations; do not claim a complete dedicated DPO/cybersecurity module.

## 6. REQUIRED STATIC / PRESENTATION-ONLY Future Integrations catalog

This is a mandatory S1 deliverable.

The current `/municipal-systems` surface must be reframed as the presentation home for the future pipeline.

Every missing / not-currently-enabled module below must be visible as a **static presentation tab/card/row**, with truthful status and no fake operational behavior.

### Five-star / initial rollout future item

- **Procurement / PR Tracking** — Future Integration / Planned.

### Five-star pipeline item not in the five initial-rollout list

- **Budget & Obligation Monitoring** — Future Integration / Planned or Not Enabled.

### Four-star future pipeline

- **GIS / Mapping Portal**
- **Zoning & Locational Clearance System**
- **Building Permit Workflow**
- **Business Permit / eBOSS Integration**
- **Citizen Request / Action Center**
- **GAD Data Analytics**
- **CBMS / Socioeconomic Dashboard**

### Three-star future pipeline

- **Asset & Property Management**
- **Inventory & Supplies System**
- **Motorpool / Fleet Management**

### Additional architecture plug-ins explicitly named by the PDF and currently not represented as active current rollout modules

- **Accounting integration**
- **Treasury / Revenue integration**

### Supporting pipeline item without a dedicated current general portal

- **Training / Knowledge Management**

### Static presentation rules

For every nonfunctional Future Integration item:

- visible on the Future Integrations page;
- static presentation only;
- no dedicated backend route required;
- no fake CRUD;
- no fake analytics;
- no fake current counts;
- no fake status claiming Active/Integrated unless repo truth supports it;
- allowed statuses include:
  - `Future Integration`
  - `Planned`
  - `Not Enabled`
  - `Current Foundation` only where a real current foundation exists;
- may contain concise scope text describing what the future system is intended to cover;
- may use in-page categories/tabs/filters;
- must not become permanent sidebar clutter.

## 7. Future Integrations page architecture

Current route:

`/municipal-systems`

Current source:

- `resources/js/pages/MunicipalSystems/Index.tsx`
- `resources/js/components/municipal-systems/SystemDirectory.tsx`
- `resources/js/data/municipal/systems.ts`

The route should remain.

The current data page already contains a systems catalog, but several statuses are not aligned with the current showcase truth. In particular, broad HRIS / Payroll / Attendance presentation must not imply current initial-rollout capability merely because parked/historical domain code exists.

Correct presentation structure:

### A. Core Platform Backbone

A compact architecture section showing the platform foundations:

- Unified authenticated access / SSO direction;
- Employee/User Directory;
- Document Routing;
- Notifications;
- Task/Workflow Engine;
- Digital Approval foundation;
- Audit Trail;
- Central File Repository;
- API / Integration Layer direction.

### B. Current / Initial Rollout

Show the five rollout priorities with their actual state:

- Document Routing & Correspondence — Current / Working;
- Task / Executive Dashboard — Current / Working;
- Project Monitoring — Current / Working;
- Procurement / PR Tracking — Future Integration;
- HR Employee Portal — Current personnel-reference foundation.

### C. Future Integrations

Show **all required static future modules from section 6**.

The page may use grouped static tabs / category filters / cards / rows.

It must be visually obvious which items are future.

## 8. Sidebar / navigation truth

W01 is already integrated.

Keep:

- frequency-first daily Work hierarchy;
- secondary collapsible groups;
- active-group auto expansion;
- single open secondary group behavior;
- persistent Switch Workspace utility.

Do not add the future pipeline systems as 20 permanent sidebar items.

One destination under Municipal Systems is sufficient:

`Future Integrations`

The existing server-derived permission / experience filtering remains authority.

Do not assume everything is universally visible.

## 9. FRE / Guided Tour correction

This remains a required immediate correction.

Known defects from screenshot intake:

1. stale wording;
2. Project Monitoring target required browser resizing/minimizing to become visible;
3. stakeholder-facing copy includes engineering/prototype caveats that are too technical;
4. Messages step says `prototype messaging workspace`;
5. Project Monitoring copy says `without implying municipality-wide authority`;
6. final Switch Workspace step must point to the now-visible control.

Required behavior:

- preserve the useful tour sequence;
- stakeholder-facing wording;
- no browser-resize hack;
- when a tour target lives inside a collapsed secondary group, open/scroll the owning group before positioning;
- Project Monitoring must be targetable at normal desktop size;
- Switch Workspace must be targetable in its W01 persistent location.

## 10. Dashboard rule

The current Dashboard remains structurally intact.

No dedicated W03 Dashboard implementation wave.

No new Priority Systems block.

No dashboard storyboard replication.

No fake client-facing analytics.

Dashboard changes are allowed only for a concrete defect explicitly identified by Kirch.

## 11. Corrected execution order

### W01 — Shell hierarchy / collapse / Switch Workspace

`DONE / INTEGRATED`

### W02 — FRE / Guided Tour targeted correction

`NEXT / REQUIRED`

Scope:

- stale copy;
- Project Monitoring target visibility;
- correct secondary-group reveal/scroll;
- Switch Workspace target;
- no other product changes.

### W04 — Future Integrations + HR Employee Portal presentation

`REQUIRED`

May run in parallel with W02 only when file ownership remains disjoint.

Scope:

- reframe `/municipal-systems` as Future Integrations;
- show Core Platform Backbone;
- show five initial-rollout priorities with truthful state;
- show **all static missing pipeline modules** listed in section 6;
- correct misleading current systems statuses;
- reposition employee directory as HR Employee Portal / personnel-reference foundation;
- no broad HRIS claim.

### W04B — Future Integration Detail Surfaces

`REQUIRED / CURRENT FOLLOW-UP`

W04 catalog presentation is not sufficient by itself. Every `FUT-01` through `FUT-15` Future Integration entry must be enterable as a **static concept detail surface** inside the existing `/municipal-systems` route.

Required interaction:

- click / enter a future-system catalog item;
- open a dedicated concept-preview subview;
- show module name, status, lead office, what it could cover, supplied illustrative workflow/scope, information/records it could manage, ONE TALIBON integration context, and current concept-only boundary;
- provide `Back to Future Integrations`;
- no new backend route;
- no fake CRUD, fake analytics, fake counts, fake transactions, or fake operational actions.

Presentation badge:

`Future Integration — Concept Preview`

Detailed scope must remain anchored to the supplied client/PDF authority. Where the PDF only names a plug-in domain (for example Accounting or Treasury) and does not define a detailed workflow, keep the concept conservative rather than inventing one.

W04B repository-local implementation handoff:

`.forge/handoffs/code-writer/S1-W04B-FUTURE-INTEGRATION-DETAIL-SURFACES.md`

### W03

`CANCELLED / NO IMPLEMENTATION`

Historical cancelled branch must not be used as implementation authority.

### W05 — Evidence-driven screenshot corrections only

There is no automatic broad page-polish program.

Only concrete remaining screenshot defects explicitly accepted by Maintainer enter this lane.

### W06 — Evidence-driven responsive correction only

There is no automatic redesign wave.

Only actual desktop/mobile/narrow breakage found during rehearsal is repaired.

### S1-M1 — UI freeze

Pin one exact candidate after required S1 corrections are integrated.

Then move to S2.

## 12. Time-bounded validation rule

For small S1 frontend waves:

`IMPLEMENT -> SHORT VISUAL CHECK -> INTEGRATE -> NEXT`

Do not run full Feature after each UI wave.

Do not run broad browser matrices after each UI wave.

Do not babysit CI.

Full integrated validation belongs to S2.

## 13. Hard anti-drift boundaries

During corrected S1:

- no backend reopening;
- no schema/migrations;
- no new dependencies;
- no dashboard rewrite;
- no new architecture program;
- no fake Procurement workflow;
- no fake future-module routes;
- no broad HRIS activation;
- no invented employee-type counts;
- no authorization broadening;
- no future-module sidebar explosion;
- no literal storyboard recreation;
- no implementation from the cancelled W03 branch.

## 14. Completion standard

Corrected S1 is ready to freeze when:

- W01 shell behavior remains stable;
- FRE wording is stakeholder-ready;
- Project Monitoring tour target works without resizing;
- Switch Workspace tour target is visible;
- Future Integrations page clearly communicates ONE TALIBON as a core platform with plug-in pipeline;
- all missing PDF pipeline modules required by section 6 are visibly represented as static/future where appropriate;
- five rollout priorities are obvious and truthfully classified;
- HR Employee Portal is personnel-reference focused and not broad HRIS;
- existing current modules keep their working behavior;
- Dashboard remains intact;
- no backend/auth/schema/dependency drift occurred.

Then:

`S1-M1 -> S2 integrated validation -> S3 Quick Tunnel -> S4 dress rehearsal -> S5 showcase freeze`
