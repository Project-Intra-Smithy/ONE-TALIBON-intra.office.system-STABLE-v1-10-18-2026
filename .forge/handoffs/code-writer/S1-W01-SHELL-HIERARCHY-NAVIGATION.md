# KIRION FORGE — ONE TALIBON V1

## S1-W01 — SHELL HIERARCHY & NAVIGATION BEHAVIOR

### CODE WRITER HANDOFF

ROLE CALL:

**KIRION FORGE: CODE WRITER**

==================================================
FORGE AUTHORITY
==================================================

Forge repository:

`Kirch-Nairu/KIRION-FORGE`

Forge authority:

`main@44eb57e5b45b343be0033bf22a7a5e74d543c01a`

Use the normal Forge Code Writer bootstrap.

Load only the Forge doctrine required for this bounded writer task.

Do not reinterpret this handoff as Maintainer, Reviewer, Acceptance, Integration, release, deployment, or backend authority.

==================================================
TARGET PROJECT
==================================================

Project:

`ONE TALIBON V1 — SEPTEMBER 30 PROTOTYPE SHOWCASE`

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Technical Authority:

**Kirch Ivan Balite**

Current Forge phase:

`S1 — LIGHT UI CORRECTIONS & PRESENTATION FLOW LOCK`

Wave:

`S1-W01 — SHELL HIERARCHY & NAVIGATION BEHAVIOR`

Writer branch:

`KIRCH-TALIBON-S1-W01-SHELL-HIERARCHY-NAVIGATION`

Immutable implementation base:

`main@3ea1d37cbd6dbb3241d0b48af1f6d1f6f4397f4c`

This branch contains the repository-local Code Writer handoff above the immutable implementation base.

Accepted backend application/runtime payload remains:

`314b6661b34d4a70272d2a079f7cdda238b522ae`

Do not alter that backend authority.

==================================================
REQUIRED REPOSITORY-LOCAL AUTHORITY
==================================================

Read before implementation:

`.forge/SSOT_CURRENT.md`

`.forge/AUTHORITY.md`

`.forge/directives/PROTOTYPE-SHOWCASE-COMMAND-2026-09-30.md`

`.forge/directives/S1-M0-FINAL-UI-ARCHITECTURE-IMPLEMENTATION-LOCK.md`

Then execute this handoff exactly.

If live Git contradicts any exact SHA or authority in this handoff:

`STOP`

Do not repair around an authority contradiction.

==================================================
MISSION
==================================================

Implement the first shared S1 UI foundation:

> **A frequency-first, progressively disclosed municipal navigation shell that keeps daily work immediately reachable, prevents secondary navigation from becoming visually jammed, preserves existing role/permission visibility, and makes Showcase workspace switching obvious enough for stakeholder demonstration.**

This wave is intentionally shell-first.

Do not implement the Guided Tour copy/target repair yet.

Do not implement Dashboard priority changes yet.

Do not implement Future Integrations presentation yet.

Do not polish individual feature pages yet.

Those are later S1 waves and depend on this shell becoming stable first.

==================================================
REPO TRUTH — CURRENT SHELL
==================================================

Current shell/navigation authority includes:

`resources/js/layouts/AppLayout.tsx`

`resources/js/components/shell/PortalSidebar.tsx`

`resources/js/components/shell/SidebarSection.tsx`

`resources/js/components/shell/SidebarFooter.tsx`

`resources/js/components/showcase/WorkspaceSwitcher.tsx`

`resources/js/navigation/portalNavigation.ts`

`resources/js/navigation/navigationGroups.ts`

`resources/js/navigation/navigationOrder.ts`

`resources/js/navigation/navigationDestinations.ts`

Current repo behavior already provides:

- server-derived destination visibility through `isPortalDestinationVisible(...)`;
- Home and Work as primary non-collapsible navigation groups;
- Municipal Organization / Planning / Administration / Municipal Systems as secondary groups;
- collapsible secondary groups;
- active-route detection;
- compact desktop sidebar;
- mobile sidebar;
- Showcase-only `WorkspaceSwitcher` inside the Account & tools footer.

Do not replace this architecture.

Refine it.

==================================================
INFORMATION ARCHITECTURE CONTRACT
==================================================

The shell uses:

`FREQUENCY FIRST -> REFERENCE / INFORMATION -> DEEPER / SYSTEM CONTEXT`

### DAILY / HIGH-FREQUENCY AREA

Preserve the current high-frequency sequence:

`Home`

`Search Portal`

then Work:

`Document Center`

`Tasks & Assignments`

`Correspondence`

`Municipal Records`

`Official Memoranda`

`Announcements`

`Calendar`

`Meetings`

`Messages`

Do not move future/planned systems into this list.

Do not reorder the daily work list merely for visual novelty.

### MUNICIPAL ORGANIZATION — SECONDARY

Existing authorized children remain:

- Executive Departments;
- Staff Directory;
- Ordinances & Issuances;
- Councils, Boards & Committees.

### PLANNING — SECONDARY

Existing authorized children remain:

- Development Plans;
- PPAs;
- Project Monitoring.

### ADMINISTRATION — SECONDARY / ROLE-SPECIFIC

Keep existing authorization/readiness behavior.

Do not make Administration generally visible.

### MUNICIPAL SYSTEMS — SECONDARY

Keep the single current Systems Directory destination in W01.

Do not rename/reframe it to Future Integrations in this wave.

That belongs to W04.

Do not add future systems as child sidebar destinations.

==================================================
W01 REQUIRED BEHAVIOR
==================================================

## W01-1 — CONTROLLED SECONDARY-GROUP DISCLOSURE

Secondary groups must no longer behave as unrelated independent expanders that can all remain open and produce a jammed sidebar.

Implement a controlled disclosure model at the sidebar level.

Required behavior:

1. Home and Work remain primary and always rendered normally.
2. Secondary groups remain collapsible only when the sidebar is expanded.
3. On initial render, secondary groups are collapsed except the group containing the active route.
4. On URL/current-route change, the new active secondary group automatically opens.
5. Opening one secondary group must close the previously user-opened secondary group.
6. Do not create a state loop that immediately reopens a group after an explicit user toggle.
7. Compact desktop navigation must remain usable.
8. Mobile navigation must use the same coherent disclosure model.
9. Existing active-row styling and route detection must remain intact.
10. No page reload is permitted just to change group open state.

A practical controlled-state design is preferred over unrelated local `useState` inside every `SidebarSection`.

Do not over-engineer a global store.

Local shell state is sufficient.

## W01-2 — ACTIVE GROUP DISCOVERABILITY

When navigation lands on a route inside:

- Municipal Organization;
- Planning;
- Administration;
- Municipal Systems;

the owning group must become visible/open automatically.

This is important for later W02 Guided Tour work.

W01 does not itself implement tour scrolling.

## W01-3 — SWITCH WORKSPACE DISCOVERABILITY

Current issue:

`WorkspaceSwitcher` exists, but in expanded mode it is hidden behind the low-salience `Account & tools` disclosure.

For Showcase sessions:

- `Switch Workspace` must be visibly discoverable without first opening Account & tools;
- keep it in the persistent utility/footer region, not among daily-work navigation destinations;
- preserve existing `POST /showcase/switch` behavior;
- preserve `data-tour="shell:workspace-switcher"`;
- preserve disabled/switching behavior;
- compact mode may remain icon-led if accessible name/title is present;
- expanded mode must visibly say `Switch Workspace`.

Account appearance, Guided Tour, and Sign Out may remain under Account & tools.

Do not weaken authentication/session behavior.

## W01-4 — SHELL DENSITY

The secondary headers should remain visually subordinate to daily work.

Do not make every group look like a primary navigation button.

Avoid adding large cards, badges, decorative descriptions, or extra explanatory copy to the sidebar.

The shell should remain compact.

==================================================
OWNERSHIP
==================================================

### PRIMARY OWNERSHIP

Writer may modify:

`resources/js/components/shell/PortalSidebar.tsx`

`resources/js/components/shell/SidebarSection.tsx`

`resources/js/components/shell/SidebarFooter.tsx`

`resources/js/components/showcase/WorkspaceSwitcher.tsx`

### SUPPORTING OWNERSHIP — ONLY IF REQUIRED

`resources/js/navigation/navigationGroups.ts`

`resources/js/navigation/navigationOrder.ts`

`resources/js/navigation/navigationDestinations.ts`

`resources/js/navigation/portalNavigation.ts`

`resources/js/layouts/AppLayout.tsx`

Use the smallest set required.

Do not churn files whose current contract already satisfies M0.

### TEST / PROOF OWNERSHIP

Writer may add or modify focused proof under:

`tests/Feature/CurrentPortalNavigationTest.php`

and/or a bounded S1-W01 browser/source proof under:

`tests/Browser/**`

only as needed to prove the shell behavior.

Do not rewrite unrelated browser suites.

==================================================
EXPLICIT NON-SCOPE
==================================================

Do not modify:

- PHP controllers/services/models/policies;
- routes;
- migrations/schema;
- seeders;
- database records;
- authentication;
- MFA;
- authorization permissions;
- Inertia shared-prop permission contracts;
- dependency manifests or lockfiles;
- Dashboard presentation;
- Quick Access;
- Guided Tour copy;
- `tourCatalog.ts`;
- onboarding workflow;
- Municipal Systems page content;
- HR Employee Portal presentation;
- Project Monitoring page content;
- Records/Correspondence/Memoranda page presentation;
- Cloudflare/tunnel configuration;
- CI workflows.

No backend reopening.

No broad refactor.

No new module.

No new navigation destination.

==================================================
AUTHORIZATION SAFETY
==================================================

Current navigation visibility is server-driven / contract-driven.

Preserve:

`buildPortalNavigation(...)`

and:

`isPortalDestinationVisible(destination, experience, permissions)`

Do not introduce:

- raw role matrices in React;
- `user.role === ...` navigation decisions;
- hard-coded persona allowlists to replace existing destination access;
- permission widening to make the showcase look fuller.

A destination that is not authorized for the current workspace remains absent.

==================================================
REFERENCE IMAGE RULE
==================================================

Sir Gerry's long sidebar reference is **not** a literal implementation specification.

Do not add:

- Procurement;
- Budget;
- GIS;
- Zoning;
- Building Permits;
- eBOSS;
- GAD;
- CBMS;
- Citizen Requests;

as permanent W01 sidebar rows.

Later W04 owns their truthful Future Integrations presentation.

==================================================
VALIDATION GATE
==================================================

At minimum run:

`npm run types:check`

`npm run build`

and:

`php artisan test tests/Feature/CurrentPortalNavigationTest.php`

The Feature test must continue to prove:

- current wired destinations;
- route contracts;
- server-derived permission visibility;
- hidden backend routes remain registered;
- no raw React role matrix is introduced.

If writer adds focused frontend/browser proof, report its exact command and result.

Do not claim browser/runtime evidence unless actually observed.

### REQUIRED SOURCE CHECKS

Verify final diff contains:

`NO PHP PRODUCT SOURCE`

`NO ROUTE CHANGE`

`NO MIGRATION/SCHEMA CHANGE`

`NO DEPENDENCY/LOCKFILE CHANGE`

`NO AUTHORIZATION CONTRACT CHANGE`

==================================================
MANUAL / BROWSER BEHAVIOR TARGETS
==================================================

When runtime proof is available, verify at minimum:

### DESKTOP EXPANDED

- Home/Search + Work remain immediately visible;
- secondary groups begin collapsed unless current route belongs to one;
- opening Planning does not leave every other exploratory secondary group open;
- navigating to Project Monitoring opens Planning;
- navigating to Executive Departments opens Municipal Organization;
- Showcase session exposes visible `Switch Workspace` in the footer/utility region;
- Account & tools remains available;
- no horizontal overflow.

### MOBILE

- same destination permissions as desktop;
- secondary disclosure remains usable;
- footer utilities remain reachable;
- `Switch Workspace` has a clear accessible label;
- no horizontal overflow caused by W01.

Runtime observation may be deferred to Reviewer if writer environment cannot execute it.

==================================================
COMMIT / HISTORY RULES
==================================================

Use atomic commits.

Do not:

- rebase;
- reset accepted history;
- squash;
- force push;
- merge main;
- promote;
- deploy;
- delete branches.

Writer owns only this branch and this bounded implementation.

==================================================
DONE DEFINITION
==================================================

S1-W01 is a candidate only when:

- shell hierarchy remains frequency-first;
- daily-work ordering is preserved;
- secondary groups use coherent controlled disclosure;
- active secondary route opens its owning group;
- workspace switching is visibly discoverable in Showcase mode;
- compact/mobile behavior is preserved;
- existing permission filtering is unchanged;
- no future integrations are added as sidebar clutter;
- TypeScript passes;
- production build passes;
- CurrentPortalNavigationTest passes;
- changed paths stay within authorized W01 scope;
- no backend/schema/auth/dependency drift exists.

==================================================
CODE WRITER RETURN
==================================================

Return exactly:

1. role;
2. repository;
3. writer branch;
4. immutable implementation base;
5. initial handoff HEAD;
6. final writer HEAD;
7. ahead/behind vs immutable base;
8. exact changed paths;
9. implementation summary;
10. secondary-group state model;
11. active-group behavior;
12. Switch Workspace behavior;
13. authorization-preservation statement;
14. `npm run types:check` result;
15. `npm run build` result;
16. `CurrentPortalNavigationTest` result;
17. browser/runtime evidence if actually run;
18. confirmed defects;
19. limitations / NOT OBSERVED evidence;
20. explicit statement that no merge, integration, promotion, deployment, backend, schema, route, auth, or dependency mutation was performed.

Do not self-accept.

Do not self-promote.
