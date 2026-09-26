# ONE TALIBON — STAKEHOLDER PORTAL REDIRECTION PLAN

## Authority

Technical Authority:

**Kirch Ivan Balite**

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Planning branch:

`KIRCH-TALIBON-STK1-STAKEHOLDER-PORTAL-REDIRECTION`

Planning base:

`4e2a4d0fc387d5692321e3cfcf76d415da1340dc`

Program identifier:

`STK1 — STAKEHOLDER PORTAL REDIRECTION`

Status:

`PLANNING / REPOSITORY MEMORY`

This document records the stakeholder-facing dashboard / portal direction approved after review of:

1. the stakeholder-provided ONE TALIBON PORTAL guide;
2. the stakeholder-provided Menu Overview / dashboard draft image;
3. Technical Authority clarification that the existing ONE TALIBON green identity remains primary and the image is a content / information-architecture reference rather than a color-system replacement;
4. current repository routes, navigation contracts, dashboard surfaces and accepted OW1 state.

This document does not itself authorize implementation, promotion or deployment. Bounded Code Writer handoffs remain required.

---

# 1. EXECUTIVE DECISION

ONE TALIBON will **not** be redesigned into the blue visual system shown in the stakeholder draft image.

The new direction is:

> **Stakeholder content architecture + ONE TALIBON green municipal design system.**

The stakeholder image is authoritative for:

- module breadth;
- broad category naming;
- the idea of a visible portal/menu overview;
- discoverability of subfunctions;
- a dense municipal information architecture;
- prominence of search, profile and key portal destinations.

The stakeholder guide is authoritative for:

- dark green / forest green primary identity;
- white main content;
- light neutral background;
- restrained gold accent;
- soft green status treatment;
- mobile / tablet / desktop responsiveness;
- a simple home dashboard;
- quick access;
- recent announcements;
- documents requiring action;
- upcoming activities;
- recent documents;
- project snapshot;
- role-based access;
- universal-search direction;
- the principle that ordinary LGU users should reach common needs within roughly three clicks or less.

Current accepted repository behavior remains authoritative for:

- real routes;
- authorization;
- role / workspace experience;
- backend workflow semantics;
- current authenticated shell behavior;
- actual implemented modules;
- what can truthfully be linked today.

---

# 2. SOURCE RECONCILIATION

The stakeholder guide and screenshot overlap but are not identical.

They must be reconciled rather than copied literally.

## 2.1 Theme resolution

Stakeholder written direction:

- dark green / forest green main navigation and header;
- white main content;
- light gray / neutral background;
- gold accents;
- soft green indicators;
- avoid excessive colors.

Therefore:

**GREEN WINS.**

The blue screenshot palette is not implementation authority.

## 2.2 Homepage density resolution

Stakeholder image:

- very dense Menu Overview;
- many modules visible at once;
- many subfunctions exposed as bullet links.

Stakeholder written guide:

- homepage should not be overloaded;
- first screen should focus on quick access and useful current information.

Therefore:

**HOME remains operational and concise above the fold.**

The dense screenshot structure becomes a:

- Portal Menu Overview;
- Explore All Modules section;
- or lower-page comprehensive module directory.

It may live on the same `/dashboard` page below priority operational content if the composition remains usable.

A separate `/menu` route is optional and not required for the first implementation wave.

## 2.3 Search resolution

The guide asks for universal search.

Current repository evidence says the shell currently contains truthful Records Search and explicitly avoided pretending it was universal search.

Therefore:

- do not rename current Records Search to Universal Search unless functionality is expanded;
- presentation may reserve / design the universal-search location;
- first STK1 implementation should either:
  - keep current Records Search semantics truthfully, or
  - implement a bounded client-side portal destination search separately;
- document / record universal search is a later real capability unless specifically authorized.

No fake search.

---

# 3. WHY THIS IS FAST RELATIVE TO PRIOR PROGRAMS

STK1 is primarily a **frontend composition / information-architecture remap**, not another backend program.

Current `main` already has wired routes for:

- Home;
- Work Queue;
- Inbox & Routing;
- Records Register;
- Official Memoranda;
- Announcements;
- Calendar;
- Meetings;
- Messages;
- Executive Departments;
- Staff Directory;
- Ordinances & Issuances;
- Councils, Boards & Committees;
- Development Plans;
- PPAs;
- Project Monitoring;
- System Administration;
- Systems Directory.

The current dashboard already contains:

- role-aware operational context;
- attention summary;
- work requiring attention;
- schedule and deadlines;
- workspace shortcuts;
- office / executive / administrative context;
- project portfolio;
- recent documents;
- correspondence;
- announcements;
- activity.

Therefore most first-pass work is:

1. reorganizing existing destinations;
2. creating a data-driven stakeholder module catalog;
3. creating shared module / quick-access cards;
4. composing the home page around the stakeholder guide;
5. adding a comprehensive menu overview without fabricating routes;
6. improving responsive behavior.

### Fast work

- module catalog;
- module cards;
- quick-access surface;
- menu overview;
- route mapping;
- green visual treatment;
- responsive layout;
- stakeholder terminology mapping;
- existing dashboard component recomposition.

### Not automatically fast

- true universal cross-domain search;
- Favorites / Recently Opened if not backed by real state;
- Forms & Templates if no actual route/data exists;
- Finance & Procurement if current scope has no truthful destination;
- Data & Analytics if no truthful current route exists;
- new Human Resource functions;
- new GIS;
- new project-monitoring workflow semantics;
- new document archive hierarchy;
- electronic approval;
- AI features.

These must be presented as:

- existing link;
- grouped existing capability;
- planned / unavailable;
- or omitted from active clickable UI.

No fake functionality is authorized merely because the screenshot lists it.

---

# 4. TARGET PRODUCT MODEL

## 4.1 Authenticated shell

Retain the current ONE TALIBON authenticated shell as the structural base.

Do not rebuild the application shell from scratch.

Retain:

- municipal green identity;
- current role / workspace awareness;
- navigation authorization;
- current mobile drawer behavior;
- current utility behavior;
- current session / Showcase contracts.

Refine shell only as necessary to support:

- clearer ONE TALIBON identity;
- search placement;
- module / app discovery;
- stakeholder category labels;
- responsive density.

## 4.2 Brand system

Primary direction:

- deep forest green: primary navigation / high-authority surfaces;
- municipal green: primary actions / active states;
- cream / off-white: page background;
- white / very light cream: cards;
- dark forest text: headings;
- muted slate-green: secondary text;
- restrained gold: important accents, selected markers and limited emphasis;
- soft green: positive / status surfaces;
- semantic warning / danger colors only when meaning requires them.

Avoid:

- blue shell replacement;
- rainbow card system;
- large unrelated categorical colors;
- SaaS-purple styling;
- neon;
- decorative gradients unrelated to municipal identity.

---

# 5. HOME DASHBOARD — FINAL DIRECTION

Route:

`/dashboard`

The dashboard becomes a **municipal operational home + portal gateway**.

It is not just an analytics dashboard.

It is not just a giant menu page.

The home page should answer:

1. What requires my attention now?
2. What is happening soon?
3. What do I need to open frequently?
4. Where do I go for everything else?

## 5.1 Recommended home hierarchy

### A. Compact welcome / role context

Keep a restrained role-aware header.

Example:

`ONE TALIBON`

`Welcome to your municipal workspace`

Context:

- persona / role;
- office;
- date / municipal context where already supported.

Avoid oversized hero content.

### B. Quick Access

Large but compact clickable cards for the most common destinations.

Recommended first set:

- Document Center / Records;
- Issuances & Memoranda;
- Projects & PPAs;
- Calendar & Meetings;
- Announcements;
- Tasks & Assignments / Work Queue;
- Departments & Offices;
- LGU Plans.

These must map to current routes truthfully.

### C. Immediate operational attention

Reuse existing real operational data.

Recommended content:

- overdue / urgent work;
- work requiring attention;
- correspondence requiring attention;
- documents / memoranda requiring action where supported;
- relevant office / executive counts.

Do not invent KPIs.

### D. Upcoming activities

Reuse current Calendar / Meetings / deadline data.

Show:

- today;
- next meeting;
- upcoming deadlines;
- municipal / office activity.

### E. Recent announcements

Show latest bounded set, preferably 5.

Important / priority announcements may receive restrained emphasis.

### F. Recent documents / correspondence

Reuse current supported document / correspondence projections.

No fake “recently opened” behavior unless actual recent-open tracking exists.

### G. Project snapshot

Reuse current project / project-monitoring data already present in the prototype.

Keep this a snapshot, not the entire Project Monitoring workspace.

### H. Portal Menu Overview / Explore All Modules

Place below the priority operational area.

This is where the stakeholder screenshot content model becomes most visible.

The section should provide a comprehensive catalog of portal modules and subfunctions while preserving truthful implementation status.

---

# 6. MENU OVERVIEW — CONTENT MODEL

The screenshot’s broad module categories are accepted as stakeholder taxonomy reference.

The first implementation should normalize them against real repository capability.

Recommended catalog:

1. Dashboard
2. Executive Offices & Departments
3. Programs, Projects & Activities
4. Project Monitoring
5. LGU Development Plans
6. Local Special Bodies
7. Documents & Correspondence
8. Tasks & Workflow
9. Calendar & Meetings
10. Internal Communication
11. Data & Analytics
12. Human Resource
13. Finance & Procurement
14. Forms & Templates
15. Directory
16. Knowledge Hub
17. Systems / Apps
18. My Account

Not every module receives an active route in STK1.

---

# 7. REAL ROUTE MAPPING

Current live repository mapping at the STK1 planning base:

| Stakeholder concept | Current truthful destination | Status |
| --- | --- | --- |
| Dashboard | `/dashboard` | wired |
| Tasks & Workflow | `/transactions` | wired |
| Documents & Correspondence | `/correspondence`, `/records`, `/memoranda` | wired |
| Announcements | `/announcements` | wired |
| Calendar & Meetings | `/calendar`, `/meetings` | wired |
| Internal Communication | `/messages` | wired |
| Executive Offices & Departments | `/departments` | wired |
| Directory | `/employees` | wired |
| Legislative / Issuances | `/legislation` | wired |
| Local Special Bodies | `/local-special-bodies` | wired |
| LGU Development Plans | `/development-plans` | wired |
| Programs / PPAs | `/ppas` | wired |
| Project Monitoring | `/operations` | wired for authorized workspace experiences |
| Systems / Apps | `/municipal-systems` | wired |
| System Administration | `/admin` | wired for authorized users |
| Accounts / Users | `/admin/users` | integration-pending / authorized only |
| Departments Admin | `/admin/departments` | integration-pending / authorized only |

### Unresolved screenshot categories

The following require explicit mapping or planned-state treatment before clickable implementation:

- Data & Analytics;
- Human Resource as a broad module;
- Finance & Procurement;
- Forms & Templates;
- Knowledge Hub;
- My Account as a dedicated route;
- universal search;
- Favorites;
- Recently Opened.

Do not create dead routes just to mirror the screenshot.

---

# 8. DATA-DRIVEN MODULE CATALOG

Do not hardcode 18 independent JSX card blocks.

Create one durable portal catalog.

Suggested location:

`resources/js/navigation/portalModuleCatalog.ts`

or:

`resources/js/data/portal/moduleCatalog.ts`

Suggested model:

```ts
type PortalModuleItem = {
    key: string;
    label: string;
    href?: string;
    destinationKey?: PortalDestinationKey;
    status?: 'available' | 'planned' | 'external';
    permission?: string;
};

type PortalModule = {
    key: string;
    title: string;
    icon: LucideIcon;
    description?: string;
    items: PortalModuleItem[];
};
```

The catalog should reuse existing:

- route plan;
- destination keys;
- permission/navigation contracts.

Do not duplicate authorization logic in card configuration.

The catalog is presentation configuration, not a second navigation authority.

---

# 9. SHARED MODULE CARD

Create one reusable component.

Suggested:

`resources/js/components/portal/PortalModuleCard.tsx`

Responsibilities:

- module icon;
- module title;
- short optional summary;
- bounded list of subfunctions;
- real links where available;
- planned-state presentation where authorized;
- accessible link semantics;
- mobile-safe wrapping;
- no horizontal overflow.

Visual behavior:

- white / light cream card;
- restrained green icon surface;
- green / forest title;
- subtle border;
- restrained shadow;
- compact vertical density;
- minimum touch target for actual links.

Avoid:

- rainbow per-card theme;
- giant icons;
- excessive hover motion;
- fake buttons for unavailable functionality.

---

# 10. QUICK ACCESS COMPONENT

Suggested:

`resources/js/components/dashboard/PortalQuickAccess.tsx`

This is not the same as the full menu overview.

Purpose:

- most common 6–8 actions;
- above-the-fold;
- immediate navigation.

Desktop:

- 4–8 compact cards depending on available width.

Tablet:

- 2–4 columns.

Mobile:

- 2-column compact tiles or single-column rows depending on content length.

Do not render long descriptions inside Quick Access.

---

# 11. MENU OVERVIEW COMPONENT

Suggested:

`resources/js/components/dashboard/PortalMenuOverview.tsx`

Desktop behavior:

- 4 columns at standard laptop width where content remains readable;
- 5 columns only at large widths where cards retain healthy minimum width.

Tablet:

- 2–3 columns.

Mobile:

- 1 column.

Each card may show:

- first 4–6 subitems;
- “View module” when a primary destination exists;
- “View all” expansion if the list is long.

Do not place ten tiny links inside every mobile card by default.

---

# 12. MOBILE-FIRST CONTRACT

Required target widths:

- 360 × 800;
- 390 × 844;
- 430-class;
- 768-class tablet;
- 1366 × 768;
- 1440 × 900;
- 1536-class wide desktop.

## Mobile shell

Retain current mobile navigation architecture unless a bounded shell handoff changes it.

Do not show a permanent sidebar.

Recommended persistent mobile utilities:

- Home;
- Search / Records Search;
- Quick Action where truthful;
- Notifications;
- Profile.

The stakeholder guide treats bottom navigation as optional, not mandatory.

Do not introduce another mobile nav system unless it clearly improves current architecture.

## Mobile dashboard

Order:

1. compact identity / welcome;
2. Quick Access;
3. immediate attention;
4. upcoming activities;
5. announcements;
6. recent documents;
7. project snapshot;
8. Portal Menu Overview.

Cards:

- full width or controlled 2-column quick tiles;
- natural wrapping;
- no horizontal scroll;
- minimum readable text;
- no desktop-density shrinking.

---

# 13. DESKTOP CONTRACT

At 1366 × 768:

- sidebar remains efficient;
- home priority content must remain understandable without requiring a huge initial scroll;
- Quick Access should be visible early;
- attention / schedule should remain visible early;
- comprehensive Menu Overview may begin below the initial viewport.

At 1536-class width:

- Menu Overview may use 5 columns if card minimum width remains comfortable.

Do not optimize only for the stakeholder screenshot resolution.

---

# 14. EXISTING DASHBOARD PRESERVATION

Current Dashboard implementation is not discarded.

Current useful components should be reused or repositioned:

- DashboardHeader;
- AttentionSummary;
- AttentionQueue;
- SchedulePanel;
- MetricGroup;
- OfficeOverview;
- ExecutiveOverview;
- AdministrativeAttention;
- ProjectPortfolio;
- MunicipalUpdates;
- RecentDocuments;
- RecentCorrespondence;
- OfficeActivityFeed;
- ActivityRail.

The redesign is primarily a **composition change**.

Do not delete real operational value merely to mimic a screenshot.

Potential low-priority / expandable content may remain inside a details / secondary context section.

---

# 15. ROLE-AWARE HOME

The stakeholder home direction does not remove current role awareness.

Home must remain contextual.

## Employee

Prioritize:

- My Work;
- Memoranda;
- Calendar;
- Records;
- Messages;
- announcements;
- common municipal resources.

## Department Head

Prioritize:

- office workload;
- correspondence;
- Work Queue;
- Projects / PPAs / Project Monitoring where authorized;
- staff / office context;
- calendar;
- announcements.

## Executive

Prioritize:

- municipal attention;
- documents / work for decision;
- projects;
- meetings;
- departments;
- current municipal status.

## System Administrator

Prioritize:

- system overview;
- administration;
- systems directory;
- users / departments where actually authorized.

The Menu Overview may remain broad, but clickable availability must still follow capability / workspace visibility.

---

# 16. SEARCH PLAN

## STK1 first pass

Do not fabricate universal search.

Allowed fast implementation:

### Option A — retain current Records Search

Keep existing semantics and label truthfully.

### Option B — add client-side Portal Navigation Search

Search only:

- module names;
- destination labels;
- department / office names if already present in safe presentation data;
- system directory labels.

Clearly scope it as:

`Search portal`

not:

`Search all documents`

unless actual document search is included.

## Later search wave

True Universal Search can federate authorized sources such as:

- Records;
- Correspondence;
- Memoranda;
- Plans;
- PPAs;
- Projects;
- Offices;
- Issuances;
- directory.

This is not assumed in STK1.

---

# 17. STAKEHOLDER SCREENSHOT CONTENT MAPPING

The image categories are treated as desired discoverability, not proof that every listed subfeature already exists.

Examples:

## Dashboard

Potential links:

- Executive Summary;
- Announcements;
- Upcoming Meetings;
- Pending Tasks;
- Quick Links;
- Key Performance Indicators.

Only link implemented / truthful surfaces.

## Executive Offices & Departments

Map to:

- Departments;
- Mayor / Executive workspace where authorized;
- department pages.

## Programs, Projects & Activities

Map existing:

- PPAs;
- projects / project monitoring where available;
- announcements / activities where appropriate.

Do not invent:

- DRRM project registry;
- GAD workflow;
- special-project backend;

unless existing repository capability truthfully supports them.

## Project Monitoring

Map to existing `/operations` for authorized experiences.

Sublabels may describe existing views only where source supports them.

## LGU Development Plans

Map to current Development Plans.

## Local Special Bodies

Map to Councils, Boards & Committees.

## Documents & Correspondence

Map:

- Inbox & Routing;
- Records Register;
- Official Memoranda;
- Ordinances & Issuances where relevant.

## Tasks & Workflow

Map:

- Work Queue;
- workflow transactions.

## Calendar & Meetings

Map both existing routes.

## Internal Communication

Map Messages and Announcements where semantically appropriate.

## Directory

Map Staff Directory and Departments.

## Systems / Apps

Map Systems Directory.

Other categories remain planned / mapped later unless current code proves a valid route.

---

# 18. VISUAL DIRECTION

Use stakeholder content density without copying legacy visual noise.

## Header

Keep compact.

Must support:

- ONE TALIBON identity;
- current workspace context;
- search affordance;
- notifications;
- current user / profile;
- workspace switching as already supported.

Avoid:

- giant photographic masthead;
- tall decorative banner;
- excessive slogans inside authenticated work surfaces.

## Sidebar

Retain dark municipal green.

Active state:

- strong but compact;
- clear indicator;
- accessible contrast.

## Cards

Module cards:

- restrained;
- information-dense;
- readable;
- consistent.

No card should look like a marketing feature block.

---

# 19. ACCESSIBILITY

Maintain:

- semantic headings;
- keyboard navigation;
- visible focus;
- sufficient contrast;
- 44px-class touch targets where interactive controls require it;
- logical reading order;
- no information conveyed by color alone;
- no hidden required actions behind hover;
- safe text wrapping at 200% zoom where practical.

The menu overview must remain navigable by keyboard.

---

# 20. HONESTY / READINESS MODEL

Every module item should be one of:

`available`

`planned`

`external`

Avoid presenting planned capabilities as implemented.

Possible UI behavior:

- available → normal link;
- planned → muted label / “Planned” badge, non-clickable;
- external → external-link affordance only if a real trusted URL exists.

Do not use fake disabled controls everywhere if omission is cleaner.

---

# 21. RECOMMENDED IMPLEMENTATION PROGRAM

This should remain a short frontend program, not another multi-week architecture campaign.

## STK1-A — Portal catalog foundation

Scope:

- module catalog;
- stakeholder taxonomy;
- truthful route mapping;
- shared PortalModuleCard;
- tests for mapping / no dead active links.

No Dashboard composition change yet.

## STK1-B — Home dashboard recomposition

Scope:

- Quick Access;
- preserve operational attention;
- upcoming activities;
- announcements;
- recent documents;
- project snapshot;
- role-aware composition.

Reuse existing Dashboard data.

## STK1-C — Menu Overview

Scope:

- comprehensive module grid;
- responsive 1 / 2–3 / 4–5 column behavior;
- planned-state treatment;
- truthful links only.

## STK1-D — Mobile / tablet hardening

Scope:

- 360;
- 390;
- 430;
- 768;
- touch / wrapping / overflow;
- sidebar / drawer coexistence;
- no horizontal action hunting.

## STK1-E — Exact-candidate validation

Scope:

- TypeScript;
- production build;
- targeted feature tests;
- browser matrix;
- persona checks;
- responsive checks;
- no page errors / server 5xx;
- no live runtime mutation.

---

# 22. PARALLELIZATION

Maximum recommended concurrent Code Writer lanes:

2.

Safe initial split:

### Lane A — Catalog / module card

Own:

- portal module catalog;
- PortalModuleCard;
- mapping tests.

### Lane B — Dashboard composition

Own:

- Dashboard page;
- Quick Access;
- Menu Overview integration shell;
- responsive dashboard components.

Do not allow both lanes to edit the same central navigation files simultaneously.

Integration only after each lane returns exact SHA and changed-file evidence.

---

# 23. EXPECTED FILE OWNERSHIP

Likely new / modified files:

`resources/js/pages/Dashboard.tsx`

`resources/js/components/dashboard/DashboardHeader.tsx`

`resources/js/components/dashboard/PortalQuickAccess.tsx`

`resources/js/components/dashboard/PortalMenuOverview.tsx`

`resources/js/components/portal/PortalModuleCard.tsx`

`resources/js/navigation/portalModuleCatalog.ts`

Potential supporting:

`resources/js/navigation/navigationDestinations.ts`

`resources/js/navigation/navigationOrder.ts`

Only modify core navigation contracts if required by approved terminology / route mapping.

Do not casually mutate backend routes.

---

# 24. WHAT STAYS OUT OF STK1

Not authorized merely by this plan:

- schema changes;
- migrations;
- new search backend;
- new document engine;
- new archive engine;
- new task engine;
- new messaging backend;
- new HRIS;
- new payroll;
- new procurement engine;
- new finance workflow;
- GIS;
- AI assistant;
- QR verification;
- digital signatures;
- new analytics backend;
- new public-facing portal scope.

---

# 25. VALIDATION CONTRACT

Minimum static gates:

```text
git diff --check
npm run types:check
npm run build
```

Browser validation must include:

- Employee;
- Department Head;
- Executive;
- System Administrator where applicable;
- 360 × 800;
- 390 × 844;
- 430-class;
- 768-class tablet;
- 1366 × 768;
- 1440 × 900;
- no horizontal overflow;
- usable mobile drawer;
- Quick Access reachable;
- Menu Overview reachable;
- real links resolve;
- planned items are not fake links;
- no page errors;
- no server 5xx.

Current OW1 first-run / Guide behavior must not regress.

---

# 26. DEFINITION OF DONE

STK1 presentation work is successful when:

1. ONE TALIBON remains recognizably green / municipal;
2. the stakeholder module taxonomy is visibly represented;
3. Home is useful rather than overloaded;
4. common functions are reachable quickly;
5. dense module discovery exists without dominating the first viewport;
6. existing real operational dashboard data remains useful;
7. module cards are data-driven;
8. no dead / fake active links are introduced;
9. mobile is intentionally designed;
10. 360 / 390 / 430 widths have no horizontal overflow;
11. role-aware visibility remains correct;
12. authorization remains server-authoritative;
13. no backend architecture expansion occurs;
14. exact-candidate validation passes;
15. deployment remains a separate Technical Authority decision.

---

# 27. TECHNICAL AUTHORITY SUMMARY

The approved implementation principle is:

> **Use the stakeholder draft for what information people expect to find. Use the written guide and current ONE TALIBON design system for how the portal should actually look and behave.**

In short:

```text
THEIR CONTENT MODEL
+
OUR GREEN MUNICIPAL DESIGN SYSTEM
+
CURRENT REAL ROUTES / AUTHORIZATION
=
ONE TALIBON STK1
```

The development team should prefer the shortest safe path because the repository already contains most of the required product surfaces.

Do not restart backend architecture work for a frontend information-architecture request.

---

# 28. NEXT ACTION

Before implementation:

1. close or rebase around the active OW1-HF1 hotfix according to Maintainer authority;
2. resolve the exact new main after HF1;
3. rebase / reissue STK1 implementation handoffs from that accepted main;
4. run two bounded frontend lanes at most;
5. integrate;
6. review;
7. accept;
8. promote;
9. deploy only by explicit Technical Authority instruction.

This planning branch is repository memory only until the Technical Authority issues implementation authority.


---

# 29. SECOND STAKEHOLDER STORYBOARD — AUTHORITY AMENDMENT

A second stakeholder image was received after the initial STK1 planning record.

This image is materially more useful than the first Menu Overview screenshot because it describes an intended **product storyboard across nine surfaces**, not merely a dashboard composition.

The panels are:

1. Main Dashboard — Desktop View
2. Universal Search
3. Document Center
4. Department Page
5. Plans Library
6. Projects & PPAs
7. Calendar & Meetings
8. Task Management
9. Mobile View — Responsive

This amendment treats that storyboard as a visual / information-architecture target while preserving repository truth.

## 29.1 What the storyboard now confirms

The stakeholder wants ONE TALIBON to feel like:

- one coherent internal portal;
- a strong green municipal identity;
- a compact persistent desktop sidebar;
- a top utility/search/header layer;
- a simple but information-rich home;
- strong quick access;
- dedicated workspaces rather than one giant monolithic dashboard;
- a document-centric internal portal;
- office-centric organization;
- planning / project visibility;
- calendar and work tracking;
- strong mobile access.

This aligns closely with the written guide.

## 29.2 What the storyboard does NOT automatically authorize

The storyboard does not prove that every shown control or dataset already exists.

It therefore does not independently authorize:

- a new search engine;
- a second document-management subsystem;
- a second task engine;
- a second project database;
- a new archive engine;
- GIS;
- new HRIS;
- new procurement;
- new analytics backend;
- new approval semantics.

Repository truth continues to govern implementation.

---

# 30. ARCHITECTURAL READING OF THE NINE PANELS

The nine panels should be implemented as **different projections over shared existing domain authority**, not nine unrelated mini-applications.

Target architecture:

```text
                        ONE TALIBON SHELL
                               |
        -------------------------------------------------
        |            |             |                   |
   NAVIGATION     SEARCH       WORKSPACE CTX        UTILITIES
        |            |             |                   |
        -------------------------------------------------
                               |
                        PRESENTATION LAYER
                               |
     ---------------------------------------------------------
     |         |          |         |        |       |       |
 Dashboard  Documents  Departments  Plans   PPAs  Calendar  Work
     |         |          |         |        |       |       |
     ---------------------------------------------------------
                               |
                    EXISTING APPLICATION SERVICES
                               |
     ---------------------------------------------------------
     | transactions | correspondence | documents | plans     |
     | projects     | calendar       | departments| users    |
     ---------------------------------------------------------
                               |
                          PostgreSQL
```

React remains presentation.

Authorization remains server-side.

No cross-surface screenshot requirement is allowed to move business authority into frontend configuration.

---

# 31. SHARED PORTAL SHELL

The storyboard confirms a stable application shell.

## Desktop shell

Recommended structure:

```text
┌───────────────┬─────────────────────────────────────────────┐
│ ONE TALIBON   │ Header / Search / Notifications / Profile │
│               ├─────────────────────────────────────────────┤
│ Sidebar       │                                             │
│               │ Page / Workspace                            │
│               │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

### Sidebar

Primary characteristics:

- deep forest green;
- compact;
- readable;
- persistent on desktop;
- capability-filtered;
- one source of truth from current navigation authority.

Do not create a second independent screenshot-only sidebar definition.

### Header

Keep compact.

Potential contents:

- small ONE TALIBON identity;
- search affordance;
- notifications;
- messages where appropriate;
- calendar shortcut;
- current user;
- current office / persona;
- account menu.

Avoid a tall photo masthead as a persistent authenticated header.

The large photographic welcome panel from the storyboard may be interpreted as a Home-only welcome surface, not global shell chrome.

---

# 32. PANEL 1 — MAIN DASHBOARD ARCHITECTURE

Route:

`/dashboard`

Status:

`FAST / HIGH REUSE`

The screenshot shows the intended first-view composition clearly.

Recommended implementation hierarchy:

1. compact welcome / identity strip;
2. Quick Access;
3. Recent Announcements;
4. Documents for My Action;
5. Upcoming Activities;
6. Project Status Snapshot;
7. My Recent Documents;
8. lower Portal Menu Overview / Explore All Modules.

## 32.1 Welcome surface

The screenshot uses a wide municipal photo banner.

Implementation rule:

- optional;
- Home-only;
- low vertical cost;
- must not dominate smaller laptop or mobile screens;
- may use approved municipal imagery if already present in repository assets;
- no remote hotlinked image dependency.

At 1366 × 768, the page must remain operationally useful even if the welcome image is reduced or omitted.

## 32.2 Quick Access

Screenshot confirms eight prominent destinations:

- Document Center
- Issuances & Memoranda
- Projects & PPAs
- Calendar & Meetings
- Announcements
- Tasks & Assignments
- Departments & Offices
- LGU Plans Library

This is now the preferred Quick Access taxonomy.

Map each item to existing real routes or a truthful facade.

## 32.3 Recent Announcements

Reuse existing municipal announcement data / route.

Target:

- 4–5 items;
- issuing office;
- date;
- compact priority treatment;
- View All → `/announcements`.

## 32.4 Documents for My Action

Do not invent a separate document-action engine.

Derive from current authorized actionable sources, such as:

- correspondence requiring action;
- workflow transactions requiring current user / office action;
- memoranda requiring acknowledgement where supported.

A thin dashboard projection / service may unify them for display if required.

## 32.5 Upcoming Activities

Reuse:

- Calendar;
- Meetings;
- current deadlines.

Do not create duplicate calendar state.

## 32.6 Project Status Snapshot

Reuse existing current project / PPA / Project Monitoring presentation data.

The exact colored status distribution from the screenshot is illustrative unless current domain data supports those states.

Do not invent project counts.

## 32.7 My Recent Documents

Use a truthful bounded definition.

Preferred first implementation:

- recently created / received / routed documents visible to the user;
- or current recent-record projection.

Do NOT claim “recently opened” unless open-history is actually persisted.

---

# 33. PANEL 2 — UNIVERSAL SEARCH ARCHITECTURE

Status:

`NOT A PURE VISUAL FAST PATH`

The storyboard makes Universal Search a major expected capability.

The written guide also treats search as a central portal capability.

However current repository authority explicitly distinguishes existing Records Search from true universal search.

Therefore implement in two stages.

## 33.1 Stage S1 — Portal Navigation Search

Fast.

Client-side or server-light search over safe presentation metadata:

- modules;
- destinations;
- departments;
- systems;
- plans / PPA titles only if already safely present.

Purpose:

- help users navigate the portal;
- no claim of searching every internal document.

Suggested label:

`Search portal`

## 33.2 Stage S2 — Real Universal Search

Separate bounded backend wave.

Suggested server architecture:

`PortalSearchService`

with typed result DTO:

```text
PortalSearchResult
- sourceType
- sourceId
- title
- subtitle
- office
- date
- documentType
- project
- fileType
- status
- href
```

Potential authorized sources after explicit audit:

- Correspondence;
- Records projection;
- Memoranda;
- Legislative issuances;
- Development Plans;
- PPAs / Projects;
- Departments;
- safe Systems Directory entries.

### Security requirement

Every source must apply its existing authorization before entering the result set.

Do not:

- fetch broad data then filter in React;
- leak restricted result counts;
- leak titles / metadata for unauthorized documents;
- infer access from role names in frontend.

### Filter contract

Storyboard filters are treated as desired search UX:

- type;
- office;
- year;
- file type;
- barangay;
- status;
- additional filters.

Only expose filters backed by normalized source metadata.

No fake filter dropdown.

---

# 34. PANEL 3 — DOCUMENT CENTER ARCHITECTURE

Status:

`MEDIUM; MUST REUSE CURRENT DOCUMENT AUTHORITY`

The storyboard shows:

- document category tree;
- document register;
- metadata side panel;
- upload action;
- view/download actions.

This is architecturally valid but must not become a second document system.

## 34.1 Core rule

Reuse existing:

- Documents;
- Document Links;
- Correspondence;
- Records;
- Memoranda;
- Legislative records;
- secure attachment / evidence architecture.

## 34.2 Initial fast facade

If a dedicated `/documents` route is authorized, implement it as a **facade / read-model workspace**, not a new source of truth.

Initial categories may link / federate existing sources:

- Incoming Communications
- Outgoing Communications
- Memoranda
- Executive / Office Orders where real
- Resolutions / Ordinances
- Reports
- Project Documents
- Plans
- Technical Documents

Unavailable categories should not be fabricated.

## 34.3 Metadata panel

Shared document metadata contract can display existing facts such as:

- title;
- reference / number;
- date;
- office;
- type;
- subject;
- signatory where present;
- project / program relation;
- confidentiality;
- uploaded by;
- uploaded date;
- version only if actual version authority exists;
- tags only if real tags exist.

Do not display synthetic metadata placeholders as if persisted.

## 34.4 Upload

Only enable upload in contexts already authorized by backend rules.

A generic upload button must not bypass parent-context authorization.

---

# 35. PANEL 4 — DEPARTMENT PAGE ARCHITECTURE

Current route family:

`/departments`

Status:

`FAST / HIGH REUSE`

The storyboard wants each office to feel like its own workspace.

Existing Department Workspace is the correct base.

Recommended page structure:

```text
Department identity
Office title / short name / mandate

Overview | Documents | Projects | Reports | Calendar | Personnel | Tasks

Summary strip
- total documents
- active projects
- pending tasks / work
- upcoming activities

Recent documents
Current projects
Upcoming events
Current office workload
Personnel reference
```

Tabs should be capability-driven.

Do not show empty fake tabs merely to match the screenshot.

Where a tab has no dedicated backend projection, omit it or show a truthful bounded reference surface.

Department page remains an office-context projection over shared domains.

No per-department duplicate tables.

---

# 36. PANEL 5 — PLANS LIBRARY ARCHITECTURE

Current route:

`/development-plans`

Current page:

`resources/js/pages/Plans/Index.tsx`

Status:

`FAST / HIGH REUSE`

The storyboard confirms the desired visual model:

- recognizable plan cards;
- plan abbreviation;
- full title;
- cover / thumbnail where approved;
- organized library.

Initial target:

- CLUP
- CDP
- LDIP
- AIP
- ELA
- LCCAP
- other plans only where current data exists.

Recommended card contract:

```text
PlanCard
- code
- title
- period
- responsibleOffice
- status
- coverAsset?
- href
```

No requirement for real uploaded cover images in the first slice.

A restrained generated / branded placeholder is acceptable until approved assets exist.

Do not store cover files in React source if a document asset relation already exists.

---

# 37. PANEL 6 — PROJECTS & PPAs ARCHITECTURE

Current routes:

- `/ppas`
- `/operations`

Status:

`FAST–MEDIUM / REUSE CURRENT DATA`

The storyboard combines:

- filterable project register;
- office;
- status;
- percent complete;
- compact progress presentation.

Use existing PPAs / Project Monitoring as source authority.

Do not create another `projects` table or duplicate project lifecycle.

Recommended read model:

```text
ProjectRegisterItem
- id
- name
- responsibleOffice
- location
- fundingSource
- budget
- status
- physicalProgress
- financialProgress
- startDate
- targetDate
- href
```

Only fields backed by existing authority should render.

Mobile must switch from wide table to cards / stacked rows.

---

# 38. PANEL 7 — CALENDAR & MEETINGS ARCHITECTURE

Current routes:

- `/calendar`
- `/meetings`

Status:

`FAST / ALREADY WIRED`

The storyboard shows:

- month view;
- week / day / list toggles;
- Today rail;
- Upcoming rail;
- Add Event for authorized users.

Current Calendar foundation should remain authoritative.

Target correction is primarily:

- composition;
- compactness;
- clearer Today / Upcoming;
- green municipal theme;
- responsive calendar behavior.

Do not duplicate meeting data into a second calendar store.

Where meetings publish CalendarEvent state, retain one source of truth.

---

# 39. PANEL 8 — TASK MANAGEMENT ARCHITECTURE

Current authoritative work surface:

`/transactions`

Status:

`FAST PRESENTATION; NO NEW TASK ENGINE`

The storyboard shows:

- My Tasks;
- Assigned to Others;
- Completed;
- due date;
- status;
- Add Task.

For STK1:

`Tasks & Assignments`

must map primarily to existing workflow transaction / Work Queue authority.

Do not create a second generic task engine merely to match the screenshot.

Allowed fast tabs if supported by current data:

- My Work;
- Office / Assigned Work;
- Completed.

“Add Task” must not appear unless a real authorized creation workflow exists.

A later standalone collaboration-task system requires separate authority.

---

# 40. PANEL 9 — MOBILE ARCHITECTURE

Status:

`MANDATORY, NOT OPTIONAL POLISH`

The storyboard confirms the intended phone experience:

- compact green header;
- profile / notification utility;
- welcome;
- Quick Access;
- announcements;
- bottom utility navigation.

Mobile is not a screenshot shrunk to phone width.

## 40.1 Mobile information order

Recommended:

1. compact header;
2. greeting / office context;
3. Quick Access;
4. immediate attention;
5. announcements;
6. upcoming;
7. recent documents;
8. project snapshot;
9. Explore All Modules.

## 40.2 Bottom navigation

The guide / storyboard support:

- Home
- Search
- Quick Action / Add where truthful
- Notifications
- More / Profile

This should be introduced only if it replaces—not duplicates—existing mobile utility clutter.

Do not create three competing mobile navigation systems.

## 40.3 Mobile breakpoints

Required:

- 360 × 800
- 390 × 844
- 430-class

No:

- horizontal tables requiring action hunting;
- clipped cards;
- tiny text;
- hidden primary actions;
- permanent sidebar.

---

# 41. VISUAL COMPONENT ARCHITECTURE

Recommended shared primitives:

```text
PortalShell
PortalHeader
PortalSidebar

PortalQuickAccess
QuickAccessTile

PortalSection
PortalSectionHeader

PortalModuleCard
PortalModuleGrid

PortalDataList
PortalStatusBadge
PortalEmptyState

PortalSearchBar
PortalFilterBar

PortalDocumentRow
PortalDocumentMetadata

DepartmentSummary
PlanCard
ProjectRegister
CalendarAgendaRail
WorkQueueCompact
```

Do not build every page from unique page-local Tailwind strings.

Reuse existing components where they already satisfy the contract.

New shared primitives are justified only where duplication is real.

---

# 42. DESIGN TOKEN DIRECTION

Reuse / normalize existing ONE TALIBON tokens rather than introducing screenshot-specific literals everywhere.

Suggested semantic tokens:

```text
--municipal-brand-deep
--municipal-brand
--municipal-brand-soft

--municipal-surface
--municipal-surface-raised
--municipal-border

--municipal-gold
--municipal-text
--municipal-muted

--status-success
--status-warning
--status-danger
--status-info
```

The screenshot’s varied icon colors should be reduced into:

- municipal green;
- gold / amber;
- semantic red only for alerts;
- semantic blue only where informational meaning actually exists.

---

# 43. DATA / PRESENTATION BOUNDARY

No business rule should be reconstructed from the storyboard in React.

Frontend may decide:

- card order;
- layout;
- grouping;
- responsive presentation;
- display labels;
- whether planned non-clickable content is shown.

Backend / existing services remain authoritative for:

- permissions;
- office scope;
- workflow state;
- actionability;
- confidentiality;
- project status;
- document access;
- notification state;
- task / transaction ownership.

---

# 44. READ-MODEL STRATEGY

The storyboard benefits from compact dashboard projections.

Do not fetch entire domain collections merely to render small cards.

Preferred pattern:

```text
DashboardController / service
    -> bounded counts
    -> top N items
    -> compact DTOs

Full page route
    -> complete authorized register
```

Examples:

- announcements → latest 5;
- documents for action → top 5;
- upcoming activities → next 4;
- recent documents → top 5;
- project snapshot → aggregate + limited featured projects.

No N+1 route fan-out from React.

---

# 45. PERFORMANCE CONTRACT

The stakeholder asks for “fast and searchable.”

Implementation should therefore avoid:

- loading all documents into Dashboard;
- loading all projects for a snapshot;
- loading full event history for Calendar teaser;
- embedding file metadata blobs into common Inertia props;
- per-card API waterfalls;
- dashboard polling across unrelated domains.

Use:

- bounded queries;
- indexes already present;
- compact props;
- explicit lazy / route-level loading for heavy registers.

---

# 46. SECURITY / PRIVACY CONTRACT

The richer portal must not broaden visibility accidentally.

Critical rule:

**discoverability does not equal authorization.**

A Menu Overview may show a module label only if product direction wants it visible, but actual:

- counts;
- result rows;
- document titles;
- metadata;
- files;
- actions;

must remain server-authorized.

Universal Search is particularly sensitive.

Do not leak:

- confidential titles;
- restricted office metadata;
- result counts;
- hidden personnel information;
- internal file names;

through search or dashboard summaries.

---

# 47. IMPLEMENTATION PROGRAM — REVISED AFTER SECOND STORYBOARD

The program should remain fast by separating presentation parity from deeper capability.

## STK1-P0 — Authority / mapping freeze

Deliverables:

- module catalog;
- exact route/readiness map;
- screenshot panel → repository surface map;
- no runtime change.

## STK1-P1 — Shell + Main Dashboard

High stakeholder visibility.

Deliver:

- green shell refinements only where needed;
- Quick Access;
- announcement list;
- action queue projection;
- upcoming activities;
- project snapshot;
- recent documents;
- responsive Home.

This creates immediate visible alignment with the storyboard.

## STK1-P2 — Menu Overview + Department + Plans

Deliver:

- comprehensive Portal Menu Overview;
- Department Workspace visual alignment;
- Plans Library visual alignment;
- mobile hardening.

Mostly existing routes.

## STK1-P3 — Projects / PPAs + Calendar + Work

Deliver:

- PPA / project register presentation;
- Calendar / Meetings alignment;
- Work Queue / Tasks & Assignments alignment;
- responsive narrow-layout treatment.

No new engines.

## STK1-P4 — Document Center facade

Deliver only after exact data-source audit.

- category navigation;
- document register;
- metadata panel;
- current authorized upload/view/download actions;
- no second document store.

## STK1-P5 — Search

### P5A
Portal navigation search.

### P5B
True universal authorized search only if separately accepted.

## STK1-P6 — Exact integrated validation

- static;
- build;
- feature;
- browser;
- role;
- responsive;
- no live mutation.

---

# 48. PRIORITY / DELIVERY LOGIC

For stakeholder impact, do not implement in numeric screenshot order if doing so delays visible progress.

Recommended order:

```text
P0 mapping
    ↓
P1 dashboard
    ↓
P2 menu + department + plans
    ↓
P3 projects + calendar + work
    ↓
P4 document center
    ↓
P5 search
```

This gives the client the recognizable portal quickly while protecting architecture.

---

# 49. PARALLEL WRITER TOPOLOGY — REVISED

Maximum concurrent writers:

`2`

## Batch A

### Writer A1 — Portal Catalog / Module Grid

Own:

- portalModuleCatalog
- PortalModuleCard
- PortalMenuOverview
- mapping tests

### Writer A2 — Dashboard Composition

Own:

- Dashboard.tsx
- PortalQuickAccess
- announcement / action / upcoming / project snapshot composition
- responsive home tests

Integration after both close.

## Batch B

### Writer B1 — Department / Plans

Own:

- Departments workspace presentation
- Plans presentation

### Writer B2 — PPA / Project / Calendar / Work

Own:

- PPAs
- Project Monitoring presentation
- Calendar / Meetings presentation
- Work Queue presentation

Only if file ownership is non-overlapping.

Document Center and Search should not run concurrently with foundational catalog work unless ownership is explicitly separated.

---

# 50. TEST ARCHITECTURE

Add a dedicated stakeholder-portal browser proof rather than overloading OW1 onboarding harness.

Suggested:

`tests/Browser/stk1-portal-redirection.mjs`

Coverage:

## Desktop

- 1366 × 768
- 1440 × 900
- 1536-class

## Mobile

- 360 × 800
- 390 × 844
- 430-class

## Personas

At minimum:

- Employee;
- Department Head;
- Executive;
- System Administrator.

## Assertions

- correct green shell;
- Quick Access present;
- no dead active links;
- Menu Overview present;
- role-aware destinations;
- no unauthorized module actions;
- no horizontal overflow;
- mobile controls reachable;
- Department page reachable;
- Plans reachable;
- PPAs reachable;
- Calendar reachable;
- Work Queue reachable;
- no page errors;
- no server 5xx.

Search / Document Center tests activate only when those waves are implemented.

---

# 51. VISUAL PARITY VS FUNCTIONAL PARITY

This distinction is mandatory.

## Visual / IA parity — fast

Can move quickly:

- green shell;
- dashboard composition;
- quick access;
- menu overview;
- department layout;
- plans layout;
- project register layout;
- calendar composition;
- work queue composition;
- mobile responsive layout.

## Functional parity — selective / deeper

Requires separate backend or read-model work:

- real universal search;
- broad document center federation;
- real favorites;
- real recently-opened history;
- generalized upload categories;
- new task creation;
- new analytics;
- GIS;
- AI.

Do not let a screenshot turn visual alignment into uncontrolled backend scope.

---

# 52. CURRENT HF1 RELATIONSHIP

OW1-HF1 remains a separate accepted-code candidate process.

Current HF1 writer candidate:

`762339817eef13a14581e3a800622562bc2a7769`

HF1 is not part of STK1.

Do not mix:

- tour fallback repair;
- credits balance;

with:

- stakeholder portal redirection.

Before STK1 implementation begins:

1. HF1 must complete Maintainer validation / review / acceptance / promotion as applicable;
2. exact current main must be re-resolved;
3. STK1 implementation branches must start from that then-current accepted main;
4. this planning branch must be rebased / replayed by Maintainer only if required.

This prevents the dashboard redesign from swallowing a live OW1 defect fix.

---

# 53. UPDATED TECHNICAL AUTHORITY DESIGN FREEZE

The second storyboard refines, but does not replace, the original STK1 principle.

Final design freeze:

```text
ONE TALIBON =

GREEN MUNICIPAL BRAND
+
COMPACT PORTAL SHELL
+
OPERATIONAL HOME DASHBOARD
+
QUICK ACCESS
+
COMPREHENSIVE MENU OVERVIEW
+
DEDICATED OFFICE / PLAN / PROJECT / CALENDAR / WORK SURFACES
+
TRUTHFUL DOCUMENT / SEARCH CAPABILITY
+
MOBILE-FIRST RESPONSIVENESS
+
CURRENT SERVER-SIDE AUTHORIZATION
```

The system should visually resemble the stakeholder storyboard in composition and discoverability while remaining architecturally consistent with the current repository.

The target is not pixel-copying.

The target is:

**stakeholder-recognizable structure implemented correctly on top of existing ONE TALIBON authority.**


---

# 54. LOCAL-ONLY ASTRA IMPLEMENTATION DIRECTIVE

Technical Authority has authorized STK1 implementation to begin **locally only** while DAT and OW1-HF1 remain separate unfinished authority lanes.

Local implementation target:

`D:\KIRCH TALIBON\Talibon-Sales-Prototype`

Protected live runtime:

`C:\Talibon-MP5-VALIDATION-68607e3`

The local STK1 implementation must not modify, reuse, reset, clean, switch, build inside, or deploy into the protected live runtime.

Recommended local implementation branch:

`KIRCH-TALIBON-STK1-ASTRA-LOCAL`

Local work should begin from the current STK1 planning authority:

`KIRCH-TALIBON-STK1-STAKEHOLDER-PORTAL-REDIRECTION@1d3803aa413d19fcb9e035de1db0a5d02653645c`

which itself descends from application main:

`4e2a4d0fc387d5692321e3cfcf76d415da1340dc`

Current separate OW1-HF1 source candidate:

`KIRCH-TALIBON-OW1-HF1-TOUR-CREDITS-BALANCE@762339817eef13a14581e3a800622562bc2a7769`

HF1 must remain separate from STK1 until its own validation/review/acceptance/promotion authority is resolved.

## Local-only rule

During this temporary implementation period:

- local commits are authorized;
- local tests/build/browser validation are authorized;
- local branch creation is authorized;
- local architecture/read-model implementation within the STK1 plan is authorized;
- remote push is **not authorized**;
- pull request creation is **not authorized**;
- merge to main is **not authorized**;
- promotion is **not authorized**;
- deployment is **not authorized**.

Remote integration happens only after Technical Authority closes DAT and the separate HF1 lane, re-resolves exact current main, and issues the integration/rebase authority.

## Local code-writer objective

The local Astra implementation should deliver the maximum truthful stakeholder-visible parity without introducing duplicate domain engines.

Priority:

1. Portal catalog / module grid;
2. main dashboard composition;
3. mobile-responsive dashboard;
4. Departments visual alignment;
5. Plans visual alignment;
6. Projects / PPAs visual alignment;
7. Calendar / Meetings visual alignment;
8. Work Queue / Tasks & Assignments visual alignment;
9. truthful Document Center facade if it can reuse existing domain authority without schema or duplicate storage;
10. truthful Portal Search; real federated Universal Search only if an audit proves it can be implemented safely without architecture drift.

If a requested storyboard feature requires a new domain subsystem, schema/migration, or unclear authorization semantics, Astra must stop that sub-scope, record the blocker, and continue with other independent authorized presentation work.

The goal is a strong local candidate, not remote churn.
