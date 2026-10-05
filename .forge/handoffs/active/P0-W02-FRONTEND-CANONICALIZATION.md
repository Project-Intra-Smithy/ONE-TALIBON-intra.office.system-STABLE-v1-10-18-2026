# KIRION FORGE: CODE WRITER — P04 FRONTEND CANONICALIZATION

## Authority

Technical Authority: **Kirch Ivan Balite**

Series: `P SERIES — CANONICAL BASELINE HARDENING`

Slice: `P04 — FRONTEND CANONICALIZATION`

Writer lane: `P04-W02-FRONTEND`

Writer branch:

`KIRCH-TALIBON-P0-W02-FRONTEND-CANONICALIZATION`

Immutable implementation base:

`a10dca34db0509d7139ebeb4080e85dde2c0e544`

This handoff supersedes the earlier broad P0-W02 wording for this branch. Do not change branch strategy. Do not merge W01. Do not target `main`.

## Governing product authority

Use the uploaded **ONE TALIBON — Intra Office System Technical Audit / Cross-Reference / Implementation Plan** as the primary scope authority for this slice.

The engineering direction is:

1. finish and stabilize municipality-wide shared UI capabilities that can truthfully serve every office without client-specific assumptions;
2. remove `prototype` / `showcase` wording from active product UI and frontend implementation where it misrepresents current product state;
3. remove or hide frontend logic/surfaces that are outside immediate scope or not authoritative;
4. preserve accepted Messaging behavior;
5. keep reference/maturity surfaces truthful without presenting them as live municipal authority;
6. map every area that cannot be completed until LGU/client data, workflow rules, process authority, or KPIs are supplied.

Historical `.forge/**` provenance is not to be rewritten merely to erase transitional wording.

## Product truth that controls P04

Treat these as **shared municipality-wide UI targets**:

- Organization / offices / employees / users;
- Employee & Office Directory;
- authentication/account status/MFA presentation;
- first-class Task / unified My Work presentation where backend authority exists;
- inter-office Work Requests / Transactions;
- Correspondence;
- Documents / Attachments / Document Center;
- Records / authorization-safe Search;
- Memoranda;
- Notifications;
- Calendar;
- accepted Messaging;
- role-safe dashboards/report projections where indicators are already authoritative.

Treat these as **client/process-data dependent** and do not fabricate final UI behavior:

- department-specific workflow fields/stages;
- routing/approval/signature matrices;
- SLA timing;
- confidentiality classifications;
- official role KPIs/reports;
- Vice Mayor-specific dashboard requirements;
- Procurement final lifecycle;
- Project Monitoring final lifecycle/KPIs;
- authoritative Meeting ownership/minutes/action-item lifecycle where not already accepted;
- authoritative Announcement publishing/audience rules where not already accepted.

Treat **Full HRIS as excluded immediate scope**. Keep Employee & Office Directory as the immediate organizational capability. Do not present historical HRIS implementation as current authorized product scope.

## Core cleanup law — prototype/showcase/demo removal

Inventory active frontend source for wording/logic including:

`Prototype`, `Showcase`, `Demo`, `Mock`, `Sample`, `Reference`, placeholder personas, fake metrics, static municipal-looking data, temporary bridge labels, test-only navigation, and transitional visual states.

For each occurrence classify:

- `REMOVE` — no longer required;
- `RENAME / CANONICALIZE` — accepted behavior exists but transitional terminology remains;
- `HIDE / DE-EXPOSE` — keep source temporarily but remove from active user navigation/surface;
- `KEEP — ACCEPTED` — part of accepted current behavior;
- `KEEP — TRUTHFUL REFERENCE` — non-live/reference data that remains useful and is clearly labeled;
- `BLOCKED — CLIENT DATA/AUTHORITY` — cannot become authoritative without LGU input.

Do not blindly remove every reference notice. If a surface still uses non-live data, it must remain truthfully identified; prefer clear product wording such as `Reference data`, `Sample data`, or `Pending authoritative data` over `prototype/showcase` language when accurate.

Preserve accepted Messaging behavior. If legacy browser contracts or UI names still say `prototype`, canonicalize them only where behavior remains identical. Backend URL/route renames requiring cross-layer coordination belong to P06 unless independently safe.

## P04 execution slices

### P04-A — Shell, Navigation & Product Surface Truth

Audit:

- app shell;
- navigation registry/groups/destinations;
- module catalog;
- breadcrumbs/workspace navigation;
- route assumptions;
- role/permission visibility presentation.

Required actions:

- remove active navigation that makes excluded or client-data-blocked domains look production-ready;
- do not present Procurement as an authoritative final lifecycle;
- do not present Project Monitoring as a frozen lifecycle/KPI system;
- remove/de-expose Full HRIS navigation beyond Employee & Office Directory;
- preserve accepted Messaging;
- ensure frontend visibility follows backend/server authority rather than invented role checks;
- remove prototype/showcase language from canonical product navigation.

### P04-B — Work & Accountability UI

Audit and canonicalize:

- Task / assignment UI;
- unified My Work UI;
- Transaction / Work Request workspace;
- custody/assignee/status/due/history presentation;
- empty/loading/error/permission-denied states.

Preserve `Task != Work Request`.

Where backend authority for first-class Task / My Work is incomplete, make the frontend boundary explicit and record the engineering dependency rather than faking complete functionality.

### P04-C — Documents, Correspondence, Records & Search UI

Audit and canonicalize:

- Correspondence pages;
- Document Center;
- Records;
- Memoranda;
- search surfaces;
- attachment/download affordances;
- cross-domain linking presentation.

Remove stale demo/example wording. Do not expose data the server does not authorize.

### P04-D — Coordination UI

Audit and canonicalize:

- Notifications;
- Calendar;
- Messaging;
- Meetings;
- Announcements.

Messaging is an accepted feature delta and must be preserved.

Meetings and Announcements remain maturity/reference work unless later accepted evidence proves otherwise. If they still use static/non-live data, retain truthful reference labeling while removing `prototype/showcase` branding.

Do not invent Meeting ownership, minutes, publishing, audience, acknowledgement, or action-item business rules.

### P04-E — Organization, Administration & Specialized/Deferred Surfaces

Audit:

- Employee & Office Directory;
- Departments;
- Admin/System Administration;
- Municipal Systems / future integrations;
- Procurement;
- Project Monitoring;
- historical Full HRIS pages;
- other specialized/reference modules.

Required actions:

- keep Employee & Office Directory;
- de-expose/remove Full HRIS product surfaces outside immediate scope when non-use is proven;
- move specialized/client-blocked concepts out of normal production-ready navigation if they are not authoritative;
- keep `Future Integrations`/planned states truthful instead of fake live behavior.

### P04-F — Shared UI Quality & Responsive Baseline

Canonicalize shared product states across changed core surfaces:

- loading;
- empty;
- error;
- unauthorized/forbidden;
- stale/reference-data notice;
- keyboard/focus accessibility;
- responsive behavior at 1440 and 390 logical widths;
- no horizontal overflow introduced by cleanup.

Do not perform unrelated visual redesign.

### P04-G — Frontend Extraction & Client-Data Map

Return a frontend extraction manifest for the future standalone frontend repository.

Also produce a **CLIENT/LGU INPUT REGISTER** with at least:

- `ORG-001` authoritative office/Department Head/employee roster content;
- `WF-001` department workflow fields/forms/routing/approval/signature/SLA/report/confidentiality rules;
- `WF-002` process-owner validation/correction;
- `KPI-001` official dashboard/report indicators;
- `VICE-001` Vice Mayor dashboard requirements;
- `MEET-001` authoritative Meeting lifecycle/ownership/minutes/action-item expectations;
- `ANN-001` Announcement publishing/audience/authority requirements;
- `PROC-001` Procurement lifecycle/process truth;
- `PROJ-001` Project Monitoring data/lifecycle/KPIs;
- any additional client-owned data/content required to replace temporary/reference values.

Each dependency must identify:

`what is missing -> current UI affected -> safe temporary treatment -> backend/API/client contract eventually required`.

## Owned files

Primary ownership:

- `resources/js/**`
- `resources/css/**`
- frontend-only assets
- `tests/Browser/**`

May add one evidence report:

`.forge/evidence/code-writer/P04-W02-FRONTEND-CANONICALIZATION.md`

## Reserved / prohibited

Do not modify without Maintainer authorization:

- `app/**`
- `routes/**`
- `database/**`
- backend/server `config/**`
- `.github/**`
- `composer.json`
- `composer.lock`
- `package.json`
- `package-lock.json`
- root Vite/TypeScript config
- governing `.forge` memory/authority files
- Docker/deployment files

Do not:

- invent LGU routing/approval/SLA/confidentiality/signature/KPI rules;
- implement Procurement or Project Monitoring lifecycle semantics;
- expand Full HRIS;
- create fake production data to replace removed prototype data;
- perform broad visual redesign;
- perform repository separation;
- Dockerize;
- merge/promote/deploy;
- run broad CI on every commit.

## Validation during P04

This is CODE-FIRST.

Use narrow proof tied to changed frontend scope:

- TypeScript check where locally feasible;
- focused production build if shared imports/types are changed materially;
- targeted browser scripts for directly changed journeys only when necessary;
- static inspection for navigation/product-truth changes.

Do not burn the broad Windows CI lane for intermediate commits. Full targeted CI/CD occurs after P03+P04 integration in P08.

## Return package

Return exactly:

1. exact candidate SHA;
2. diff from `a10dca34db0509d7139ebeb4080e85dde2c0e544`;
3. P04-A through P04-G disposition summary;
4. all prototype/showcase/demo wording removed or truthfully replaced in active frontend product surfaces;
5. all excluded/out-of-scope frontend logic/surfaces removed or de-exposed, especially Full HRIS beyond directory needs;
6. accepted Messaging preservation statement;
7. all shared municipality-wide UI completed/hardened without client-specific assumptions;
8. client/LGU input register;
9. frontend extraction manifest;
10. validation actually run and actual results;
11. unresolved backend/API issues for P06;
12. explicit statement that backend, CI, Docker, deployment and `main` were not modified.

## Stop conditions

Stop and return to Maintainer instead of guessing when:

- a required change crosses backend ownership;
- a route/API/Messaging contract rename requires backend coordination;
- required behavior depends on client workflow/process authority;
- package/root build configuration must change;
- a surface appears obsolete but active use cannot be disproven;
- a failure is runner/CI/host-only.
