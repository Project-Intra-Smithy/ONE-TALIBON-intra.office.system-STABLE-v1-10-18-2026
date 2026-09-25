# ONE TALIBON V1

**Municipal Digital Workspace Prototype**

**Engineering direction:** Kirch Ivan Balite  
**Development collaboration:** Kirjane Labs × ALZA IT Solutions

ONE TALIBON is a working municipal operations prototype built around real internal workflows: office routing, records, correspondence, memoranda, calendars, messaging, HR actions, executive decisions, and role-based workspaces.

This repository is being prepared for the Talibon prototype presentation under the technical direction of **Kirch Ivan Balite**.

## Current state

| Area | State |
| --- | --- |
| Internal municipal workspace | Operational prototype |
| Calendar workspace | Completed and feature-frozen |
| Backend/runtime hardening | Completed and reviewed |
| Messaging prototype | Integrated in current product line |
| Prototype-day blocker audit | Active |
| Main promotion | Pending final audit + reconciliation |
| Branch consolidation | Planned after validated main promotion |

The current engineering focus is simple: **find anything that can break or hinder the actual prototype presentation, fix only proven problems, then consolidate the validated product into `main`.**

## What is already in place

The prototype currently includes:

- role-aware municipal dashboards and navigation;
- My Work queues and office-level task views;
- transaction routing across municipal offices;
- Correspondence and Records;
- Memoranda with delivery and acknowledgement flow;
- Calendar with Month, Week, Day, and Schedule views;
- internal Messages;
- Mayor / executive decision surfaces;
- Legislative records;
- HR / leave workflows;
- System Administration;
- seeded showcase identities and demo data;
- public-portal work that will be reconciled into the final product line before main promotion.

Recent engineering work also completed a backend/runtime hardening pass that reduced unnecessary request work and query fan-out across several high-use surfaces.

## Development approach

The project is built **backend-first and workflow-first**.

We do not build a polished screen first and invent behavior behind it later.

The normal order is:

1. define the real municipal workflow;
2. implement the database, server-side rules, authorization, and write path;
3. prove the behavior with tests and seeded data;
4. build the UI on top of the real behavior;
5. profile and harden the runtime;
6. audit the exact presentation path before promotion.

The current prototype-day audit is deliberately trying to break the application before the actual presentation does.

We prefer:

- real database-backed actions over fake demo buttons;
- server-side authorization over UI-only hiding;
- deterministic seed data over manual setup;
- measured performance work over speculative optimization;
- exact Git evidence over memory;
- narrow repairs over uncontrolled rewrites.

## Engineering team

### Technical Direction

**Kirch Ivan Balite** — [@Kirch-Nairu](https://github.com/Kirch-Nairu)  
Technical Authority / Backend Systems / Architecture  
**Kirjane Labs**

All architecture, product-direction, integration, promotion, and release decisions are under the direction of Kirch Ivan Balite.

### Developers / Contributors

**Kurt Shine Khasi Halasan** — [@k3nchinxd](https://github.com/k3nchinxd)  
Developer  
**Kirjane Labs**

**Kikiam** — [@kyumw3b](https://github.com/kyumw3b)  
Developer  
**ALZA IT Solutions**

**AJ RIENZE** — [@rynzz22](https://github.com/rynzz22)  
Developer  
**ALZA IT Solutions**

This is a joint development effort between contributors from **Kirjane Labs** and **ALZA IT Solutions**, under the technical direction of **Kirch Ivan Balite**.

## Stack

- PHP 8.4
- Laravel 13
- PostgreSQL
- Inertia
- React 19
- TypeScript
- Vite
- Playwright for browser-level validation

## Current engineering phase

The current active line is the **DA1 Prototype-Day Blocker Audit**.

The audit covers:

- clean application boot;
- migrations and deterministic demo seeding;
- all curated showcase personas;
- full Feature suite;
- TypeScript and production build;
- Engineering → Budget → Mayor transaction flow;
- Memorandum publish / receive / acknowledge;
- Legislative lookup;
- HR leave flow;
- negative authorization behavior;
- Calendar;
- two-user Messages;
- browser errors / server 5xx;
- critical desktop and mobile presentation surfaces.

Once that passes, the plan is:

```text
DA1 audit
   ↓
repair confirmed blockers only
   ↓
main reconciliation
   ↓
full validation
   ↓
promote validated product to main
   ↓
archive historical branch tips
   ↓
delete non-main branches
   ↓
continue from main only
```

## Repository direction

The repository is being consolidated toward a single continuing branch:

```text
main
```

Historical development branches will only be removed after the final product is validated, promoted, and their important tips are preserved.

No force-push shortcut is part of the consolidation plan.

## Engineering records

Detailed authority, audit, and consolidation records live under:

- `.forge/`
- `docs/PROTOTYPE_DAY_MAIN_CONSOLIDATION_PLAN.md`
- `docs/DEMO_FLOW.md`

The README is intentionally kept as the **human-readable project front page**. Deep governance belongs in the Forge records, not here.
