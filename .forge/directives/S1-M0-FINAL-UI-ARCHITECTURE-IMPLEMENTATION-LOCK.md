# SUPERSEDED FOR CURRENT IMPLEMENTATION

The current implementation authority is:

`.forge/directives/S1-CORRECTED-SHOWCASE-IMPLEMENTATION-PLAN-2026-09-29.md`

This M0 document remains as historical planning evidence only.

The following parts are specifically superseded:

- dedicated S1-W03 Dashboard implementation wave;
- automatic broad W05 page-polish program;
- automatic W06 redesign program;
- any interpretation that storyboard/reference screenshots authorize product scope;
- any presentation of parked/broad HRIS, Payroll or Attendance capability as current initial-rollout functionality.

W01 historical shell decisions remain valid where already integrated.

---

# ONE TALIBON V1 — S1-M0 FINAL UI ARCHITECTURE & IMPLEMENTATION LOCK

Role:

`KIRION FORGE: MAINTAINER`

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Technical Authority:

**Kirch Ivan Balite**

Forge authority:

`Kirch-Nairu/KIRION-FORGE@44eb57e5b45b343be0033bf22a7a5e74d543c01a`

Live main at lock issue:

`47593a5da555be6cb4ae43960bee5956291ba542`

Accepted application/runtime payload:

`314b6661b34d4a70272d2a079f7cdda238b522ae`

Program:

`SEPTEMBER 30 PROTOTYPE SHOWCASE PREPARATION`

Showcase:

`2026-09-30 15:00 +08`

Expected attendance:

`16-20`

Current phase:

`S1 — LIGHT UI CORRECTIONS & PRESENTATION FLOW LOCK`

## 1. Purpose

This directive freezes the **S1 implementation architecture and chronological build order**.

It exists to prevent:

- shell changes from being repeatedly redone by later page work;
- future-integration presentation from being mistaken for working backend scope;
- screenshot/design references from silently becoming product requirements;
- role/permission behavior from being widened for presentation convenience;
- multiple writers from colliding in shared navigation/layout files;
- late-stage UI work from reopening the accepted B1 backend baseline.

The implementation objective is not a new design system.

The implementation objective is:

> **Restructure, relabel, prioritize and present the existing ONE TALIBON prototype truthfully and convincingly for the September 30 stakeholder showcase, using the product grammar that already exists in the repository.**

## 2. Source authority for S1

S1 uses this precedence:

1. explicit current instruction from Kirch Ivan Balite;
2. current client clarifications relayed by Kirch;
3. live repository behavior and authorization contracts;
4. the Sir Gerry-provided Intra-Office Portal pipeline document;
5. accepted ONE TALIBON showcase directive;
6. screenshot intake observations;
7. storyboard/reference images as **design-flow references only**.

### Important clarification

The second screenshot batch / storyboard refresh is **not new feature authority**.

It may influence:

- density;
- hierarchy;
- page rhythm;
- discoverability;
- visual grouping;
- responsive expectations.

It may **not** by itself authorize:

- new backend modules;
- new routes;
- new domain behavior;
- new permissions;
- fake working workflows;
- new database/schema work;
- literal replication of reference labels or menu breadth.

## 3. Current repo-backed design grammar

The current product already has a coherent presentation system.

### Stable shell pattern

Repository-backed components:

- `resources/js/layouts/AppLayout.tsx`
- `resources/js/components/shell/PortalSidebar.tsx`
- `resources/js/components/shell/SidebarSection.tsx`
- `resources/js/components/shell/SidebarFooter.tsx`
- `resources/js/navigation/portalNavigation.ts`
- `resources/js/navigation/navigationDestinations.ts`
- `resources/js/navigation/navigationOrder.ts`
- `resources/js/navigation/navigationGroups.ts`

Existing behavior:

- persistent municipal sidebar;
- top search/utility layer;
- server-derived destination visibility;
- primary `home` / `work` groups;
- collapsible secondary groups;
- active-route awareness;
- mobile shell support.

### Stable page pattern

Observed across Search, Documents, Tasks, Correspondence, Records, Memoranda and other current surfaces:

- compact PageHeader;
- contextual eyebrow;
- strong page title;
- short operational description;
- summary/at-a-glance cards;
- primary lists/tables;
- restrained municipal green;
- soft semantic card tones;
- right-side action when needed;
- compact information density.

### Stable dashboard pattern

Repository-backed surfaces include:

- hero/welcome context;
- Quick Access;
- announcements;
- work requiring action;
- upcoming activities;
- project snapshot;
- recent documents.

Do not replace this grammar with a new visual system before showcase.

## 4. Core product truth classification

### A. FUNCTIONAL / WIRED — may be demonstrated as working

#### Document Routing & Correspondence ecosystem

Current working surfaces:

- Document Center;
- Correspondence;
- Municipal Records;
- Official Memoranda;
- inter-office Tasks / Assignments;
- transaction routing and traceability.

Showcase classification:

`FUNCTIONAL / PRIMARY`

#### Task / Executive Dashboard

Current working surfaces:

- Dashboard;
- Tasks & Assignments / My Work;
- role-aware workspace projections;
- executive / department / employee context.

Showcase classification:

`FUNCTIONAL / PRIMARY`

#### Project Monitoring

Current working surfaces:

- Development Plans;
- PPAs;
- Project Monitoring;
- project physical / financial presentation foundations.

Showcase classification:

`FUNCTIONAL / PRIMARY`

Current problem is discoverability and shell placement, not fundamental existence.

#### Local Special Bodies

Current working surface:

- Councils, Boards & Committees.

Showcase classification:

`FUNCTIONAL / SUPPORTING`

#### Legal / Ordinances & Resolutions

Current working surface:

- Ordinances & Issuances / Legislative Records.

Showcase classification:

`FUNCTIONAL / SUPPORTING`

#### Meeting & Task Management

Current working surfaces:

- Tasks & Assignments;
- Calendar;
- Meetings.

Showcase classification:

`FUNCTIONAL / SUPPORTING`

#### Records Archive / e-Records

Current working foundations:

- Municipal Records;
- Document Center;
- attached-file/archive foundations.

Showcase classification:

`FUNCTIONAL FOUNDATION`

Do not claim a complete formal retention/disposition engine.

### B. FUNCTIONAL FOUNDATION / REPOSITION

#### HR Employee Portal

Current repo truth:

- Staff Directory is wired and searchable;
- employee records and office context exist;
- broader historical HRIS code exists but is parked from current Core Portal scope.

Client clarification for showcase:

`HR Employee Portal is not a broad HRIS claim.`

S1 presentation direction:

- position the existing Staff Directory as the **HR Employee Portal / personnel reference foundation**;
- present personnel directory/archive value;
- do not advertise payroll, DTR, leave, attendance or other broad HRIS functionality as current rollout capability;
- do not fabricate Regular / Job Order / Casual counts unless a reliable current read contract is explicitly added and validated.

Current `EmployeeDirectoryController` does not expose `employment_type` in the Staff Directory contract.

Therefore S1-M0 does **not** authorize invented employment-type metrics.

### C. PRESENTATIONAL / FUTURE INTEGRATION — visible but not claimed functional

These may be represented as static/planned integration entries:

- Procurement / PR Tracking;
- Budget & Obligation Monitoring;
- GIS / Mapping;
- Zoning & Locational Clearance;
- Building Permit Workflow;
- Business Permit / eBOSS;
- Citizen Request / Action Center;
- GAD Data Analytics;
- CBMS / Socioeconomic Dashboard;
- Asset & Property Management;
- Inventory & Supplies;
- Motorpool / Fleet Management;
- Training / Knowledge Management where shown as future capability.

### D. CORE SECURITY / ARCHITECTURE FOUNDATION — not a dedicated feature claim

The current system already has foundations for:

- authentication;
- MFA;
- authorization;
- audit evidence;
- notification/workflow/file foundations.

Do not present this as a completed dedicated `Data Privacy & Cybersecurity Module` unless only describing the platform foundation.

## 5. Five showcase priorities

The September 30 product narrative must emphasize:

1. **Document Routing & Correspondence** — real and working;
2. **Task / Executive Dashboard** — real and working;
3. **Project Monitoring** — real and working;
4. **Procurement / PR Tracking** — visible as future/planned prototype integration, not fake backend;
5. **HR Employee Portal** — real personnel directory/reference foundation, not broad HRIS.

These are presentation priorities, not equal implementation states.

## 6. Final sidebar information architecture rule

The shell uses **frequency-first progressive disclosure**.

### Primary daily work

Always high in the sidebar when authorized:

- Home;
- Search Portal;
- Document Center;
- Tasks & Assignments;
- Correspondence;
- Municipal Records;
- Official Memoranda;
- Announcements;
- Calendar;
- Meetings;
- Messages.

Do not add future modules to this daily-work list merely to match a reference image.

### Municipal Organization — secondary collapsible

Contains only destinations already authorized for the current persona, such as:

- Executive Departments;
- Staff Directory / HR Employee Portal presentation;
- Ordinances & Issuances;
- Councils, Boards & Committees.

### Planning — secondary collapsible

Contains:

- Development Plans;
- PPAs;
- Project Monitoring.

### Municipal Systems / Future Integrations — secondary collapsible

Do **not** place every future system as a permanent sidebar row.

Keep one directory destination:

- Future Integrations / Systems Directory.

The page itself carries the future-module catalog.

### Collapsible behavior contract

For expanded desktop/mobile shell:

- Home and Work remain non-collapsible primary groups;
- secondary groups default collapsed;
- current active secondary group auto-expands;
- opening a secondary group should collapse other secondary groups when practical;
- active child remains visible;
- sidebar must not become a permanently expanded 20-item future-system list.

This is an information architecture change only.

Existing permission/experience filtering in `buildPortalNavigation()` remains authoritative.

## 7. Workspace switching contract

Current issue:

`Switch workspace` is too difficult to discover for the multi-persona showcase.

S1 requirement:

- preserve workspace switching as a utility, not a daily-work module;
- provide a clearly labeled `Switch Workspace` affordance in the authenticated utility/account area;
- the guided tour must be able to identify it without requiring the user to hunt or resize;
- do not weaken session/authentication behavior.

Exact visual placement may be resolved inside the owned shell/footer files during W01, but discoverability is mandatory.

## 8. First-run / guided-tour contract

Current repo authority:

`resources/js/components/onboarding/tourCatalog.ts`

Current department-head tour order is structurally useful:

1. office/home context;
2. work queue;
3. correspondence;
4. project monitoring;
5. calendar;
6. messages;
7. workspace switching.

Preserve that operational sequence unless implementation evidence proves a better bounded order.

Required S1 corrections:

- remove stale engineering/prototype-facing copy where it is not needed;
- keep authorization claims truthful;
- do not use language such as `without implying municipality-wide authority` in stakeholder-facing copy when the same boundary can be stated naturally;
- avoid `prototype messaging workspace` language in ordinary user guidance;
- avoid forcing browser resize/minimize to expose a target;
- tour targeting must be able to open/scroll the relevant secondary group;
- final workspace-switch step must point to a discoverable control.

## 9. Future Integrations architecture

Current route:

`/municipal-systems`

Current files:

- `resources/js/pages/MunicipalSystems/Index.tsx`
- `resources/js/components/municipal-systems/SystemDirectory.tsx`
- `resources/js/data/municipal/systems.ts`

S1 direction:

Keep the existing route and frontend data architecture where practical.

Reframe presentation around:

### Core Platform / Existing Backbone

May describe current architectural foundations such as:

- authenticated access / SSO direction;
- Employee/User Directory;
- Document Routing;
- Notifications;
- Task/Workflow Engine;
- Digital Approval / decision workflow foundations;
- Audit Trail;
- Central File Repository;
- API / Integration Layer direction.

### Future Integrations

Display static/planned cards for the pipeline modules.

Every card must carry truthful status such as:

- Active;
- Integrated;
- Planned;
- Not Enabled;
- Prototype Presentation / Future Integration when needed.

No card may imply a working route/action if one does not exist.

No dedicated backend route is required for every future module.

This single-directory architecture is the default because it minimizes dead-click risk and sidebar congestion.

## 10. Dashboard presentation direction

Current dashboard structure remains.

Do not rebuild it from the storyboard.

S1 may:

- improve Quick Access ordering;
- strengthen the five-priority-module story;
- improve labels;
- improve discoverability of Project Monitoring;
- improve relationship between Quick Access and `Explore all modules`;
- ensure future/planned modules are visually distinguished from working destinations.

The storyboard is a **design-flow refresher**, not authority to copy all cards, counts or labels.

Do not introduce fake analytics or invented municipal metrics.

## 11. Chronological implementation plan

The following order is final for S1.

### S1-M0 — architecture lock

Status:

`THIS DIRECTIVE`

Purpose:

- classify module truth;
- lock shell hierarchy;
- lock implementation dependencies;
- lock client-vs-storyboard authority;
- prevent writer drift.

No application implementation.

Exit:

`S1 ARCHITECTURE LOCKED`

### S1-W01 — shell hierarchy & navigation behavior

Dependency:

`M0`

Primary ownership candidates:

- `resources/js/navigation/navigationGroups.ts`;
- `resources/js/navigation/navigationOrder.ts`;
- `resources/js/navigation/navigationDestinations.ts`;
- `resources/js/navigation/portalNavigation.ts` only if required;
- `resources/js/components/shell/PortalSidebar.tsx`;
- `resources/js/components/shell/SidebarSection.tsx`;
- `resources/js/components/shell/SidebarFooter.tsx`;
- bounded shell utility files.

Objectives:

- frequency-first hierarchy;
- secondary accordion/collapse behavior;
- active-group expansion;
- workspace-switch discoverability;
- preserve server-derived visibility.

Must not:

- change permissions;
- change routes;
- add future-module rows to daily work;
- touch backend.

Exit:

`SHELL IA STABLE`

### S1-W02 — FRE / guided-tour correction

Dependency:

`W01`

Primary ownership candidates:

- `resources/js/components/onboarding/tourCatalog.ts`;
- `FirstRunGate.tsx` only if targeting behavior requires it;
- bounded onboarding helpers.

Objectives:

- stakeholder-facing copy;
- target visibility;
- secondary-group opening/scrolling;
- no resize hack;
- clean Switch Workspace ending.

Exit:

`FRE FLOW STABLE`

### S1-W03 — dashboard priority & Quick Access presentation

Dependency:

`W01`

May begin after W01 while W02 is independently bounded, only if file ownership does not overlap.

Primary ownership candidates:

- `resources/js/components/dashboard/PortalQuickAccess.tsx`;
- dashboard-specific components;
- `resources/js/navigation/portalModuleCatalog.ts` where Quick Access/catalog presentation requires it.

Objectives:

- strengthen real five-priority narrative;
- preserve current dashboard grammar;
- no fake metrics;
- no backend behavior changes.

Exit:

`DASHBOARD SHOWCASE STORY STABLE`

### S1-W04 — Future Integrations + HR Employee Portal presentation

Dependencies:

`W01 + M0 truth classification`

Primary ownership candidates:

- `resources/js/pages/MunicipalSystems/Index.tsx`;
- `resources/js/components/municipal-systems/SystemDirectory.tsx`;
- `resources/js/data/municipal/systems.ts`;
- `resources/js/pages/Employees/Index.tsx`;
- navigation label files only if not owned concurrently by another lane.

Objectives:

- Future Integrations framing;
- core-platform vs pipeline separation;
- truthful static/planned statuses;
- HR Employee Portal presentation using existing directory truth;
- Procurement visible without fake workflow.

Default restriction:

`FRONTEND / PRESENTATION ONLY`

If explicit personnel-type grouping is later required, Maintainer must first inspect and authorize a separate bounded read-model change because the current directory contract does not expose `employment_type`.

Exit:

`PIPELINE PRESENTATION STABLE`

### S1-W05 — high-value functional page polish

Dependencies:

`W01-W04 stable`

Targets only visible showcase roughness in:

- Document Center;
- Tasks & Assignments;
- Correspondence;
- Municipal Records;
- Official Memoranda;
- Project Monitoring;
- related presentation-critical surfaces.

Objectives:

- labels;
- spacing;
- density;
- visual hierarchy;
- action discoverability;
- no domain-semantic change.

Do not polish already-good screens merely to create commit volume.

Exit:

`CORE SHOWCASE SURFACES STABLE`

### S1-W06 — responsive and viewport hardening

Dependencies:

`W01-W05`

Objectives:

- desktop presentation size;
- 430-class mobile;
- 390x844-class mobile;
- narrow shell behavior;
- guided-tour positioning;
- long-sidebar behavior;
- card wrapping;
- no horizontal action hunting.

This wave adapts a stable layout.

It must not redesign the shell again.

Exit:

`RESPONSIVE S1 CANDIDATE STABLE`

### S1-M1 — Maintainer S1 freeze

Dependencies:

`W01-W06`

Maintainer actions:

- re-resolve exact Git;
- inspect complete S1 delta against B1 backend baseline;
- verify changed paths are UI/presentation bounded;
- reject backend/schema/auth/dependency drift;
- pin one exact integrated S1 candidate;
- declare S1 implementation closed.

Exit:

`SHOWCASE UI CANDIDATE PINNED`

Then and only then advance to:

`S2 — EXACT INTEGRATED SHOWCASE VALIDATION`

## 12. Concurrency / collision rules

### W01

Single writer.

Reason:

It owns the shared shell/navigation authority that every later lane depends on.

### W02 and W03

May run in parallel **after W01 acceptance into the S1 integration authority** only when ownership is disjoint.

If either needs a shared navigation/catalog file, Maintainer serializes that change.

### W04

Do not run concurrently with another lane that owns:

- `navigationDestinations.ts`;
- `portalModuleCatalog.ts`;
- shared shell files.

### W05

Should be decomposed by page family only if the remaining screenshot findings justify parallelism and file overlap is zero.

### W06

Single integration/responsive writer or Maintainer-controlled bounded lane.

Reason:

Responsive work crosses shared layout assumptions.

## 13. Validation policy per S1 wave

Writers do not run the full 400-test Feature suite after every visual commit.

Minimum per-wave evidence:

- exact base and final SHA;
- changed-path report;
- TypeScript for affected frontend scope / repository typecheck when practical;
- production frontend build for meaningful shared UI changes;
- focused browser/source evidence for affected routes;
- no backend/schema/dependency drift;
- no unauthorized route/permission change.

Full integrated regression belongs to S2 after S1 is frozen.

## 14. Anti-drift rules

During S1:

- backend B1 payload remains frozen;
- no migrations;
- no schema changes;
- no new dependencies;
- no Redis/cache redesign;
- no broad HRIS activation;
- no Procurement backend invention;
- no fake future-module workflows;
- no authorization broadening;
- no literal storyboard replication;
- no future-module sidebar explosion;
- no broad visual redesign of already-stable screens.

New screenshots after this lock are mapped into existing W01-W06 lanes.

They do **not** change chronology unless they prove:

- a contradiction with client direction;
- a presentation blocker;
- a shared-architecture defect that would make later lanes invalid.

## 15. S1 acceptance standard

S1 is complete when:

- frequency-first shell works;
- secondary navigation no longer jams the page;
- active secondary group is discoverable;
- Project Monitoring is reachable without browser resizing;
- Switch Workspace is discoverable;
- FRE copy is stakeholder-ready;
- Dashboard tells the five-priority story truthfully;
- Procurement/other missing modules appear only as future/planned integrations;
- HR Employee Portal is framed as personnel-reference foundation, not broad HRIS;
- core functional pages retain working routes/contracts;
- mobile/narrow presentation remains usable;
- one exact S1 candidate is pinned;
- backend/auth/schema/dependency boundaries remain intact.

## 16. Next phase boundary

After S1-M1:

`S2 — EXACT INTEGRATED SHOWCASE VALIDATION`

S2 owns:

- exact candidate build;
- targeted Feature tests;
- full Feature regression;
- browser validation;
- responsive verification;
- source integrity.

S3 then owns:

`CLOUDFLARE QUICK TUNNEL / DELIVERY REHEARSAL`

S4 owns:

`FULL STAKEHOLDER DRESS REHEARSAL / RECOVERY`

S5 owns:

`SHOWCASE-DAY FREEZE / OPERATIONS`

Do not pull S2/S3/S4 work backward into S1 unless required to diagnose a direct blocker.
