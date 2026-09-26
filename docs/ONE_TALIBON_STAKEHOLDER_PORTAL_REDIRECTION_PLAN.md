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
