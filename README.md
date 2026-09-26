# ONE TALIBON V1

**Municipal Digital Workspace Prototype**

**Technical Authority / engineering direction:** Kirch Ivan Balite  
**Development collaboration:** Kirjane Labs × ALZA IT Solutions

ONE TALIBON is a municipal operations prototype built around real internal workflows: office routing, records, correspondence, memoranda, calendars, messaging, HR actions, executive decisions, and role-aware workspaces.

## Current repository state

The consolidation program is closed.

| Area | State |
| --- | --- |
| Sole continuing remote branch | `main` |
| Validated/promoted product payload | `f6208cf082c4b1d189c70728adfdb9ddf3225990` |
| Calendar workspace | Completed and feature-frozen |
| Backend/runtime hardening | Completed and reviewed |
| DA1 repair wave | Closed with recorded historical validation limitations |
| RC1 consolidation | Completed |
| RV1 exact-candidate runtime validation | Passed |
| Main promotion | Completed |
| Archived non-main branch tips | 65 / 65 |
| Remote non-main branches | 0 |
| Open PRs at MP3 opening | 0 |
| Deployment | Not performed |

The repository now continues from **main only**. Historical branch tips remain recoverable under verified `archive/*` tags.

The next engineering transition is:

```text
MP3 governance/docs closeout
        ↓
MP4 final prototype-day rehearsal from main
        ↓
separate deployment decision
```

This is not another broad code-audit wave.

## What is in the prototype

The current product line includes:

- role-aware municipal dashboards and navigation;
- My Work queues and office-level task views;
- inter-office transaction routing;
- Correspondence and Records;
- Memoranda with delivery and acknowledgement;
- Calendar with Month, Week, Day, and Schedule views;
- internal Messages;
- Mayor / executive decision surfaces;
- Legislative records;
- HR / leave workflow surfaces used by the presentation flow;
- System Administration;
- deterministic showcase identities and demo data;
- a reconciled public municipal homepage.

Recent engineering work also completed backend/runtime hardening and exact-candidate browser validation before main promotion.

## Development approach

The project is built **backend-first and workflow-first**.

The operating order is:

1. define the municipal workflow;
2. implement database/server rules and authorization;
3. prove behavior with tests and deterministic data;
4. build the UI on real behavior;
5. harden the runtime;
6. validate the exact release candidate;
7. promote without rewriting accepted history;
8. preserve historical tips before destructive branch cleanup.

We prefer:

- real database-backed actions over fake demo controls;
- server-side authorization over UI-only hiding;
- deterministic seed data over manual setup;
- measured performance work over speculative optimization;
- exact Git/runtime evidence over memory;
- narrow repairs over uncontrolled rewrites.

## Engineering team

### Technical Authority

**Kirch Ivan Balite** — [@Kirch-Nairu](https://github.com/Kirch-Nairu)  
Technical Authority / Backend Systems / Architecture  
**Kirjane Labs**

Architecture, product-direction, integration, promotion, release disposition, and deployment authorization remain under Kirch Ivan Balite.

### Developers / Contributors

**Kurt Shine Khasi Halasan** — [@k3nchinxd](https://github.com/k3nchinxd)  
Developer — **Kirjane Labs**

**Kikiam** — [@kyumw3b](https://github.com/kyumw3b)  
Developer — **ALZA IT Solutions**

**AJ RIENZE** — [@rynzz22](https://github.com/rynzz22)  
Developer — **ALZA IT Solutions**

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

## Validation honesty

The exact promoted product payload received current-contract RV1 runtime proof, including public desktop/mobile, Showcase gateway, Employee Dashboard, My Work, and Records with zero observed page errors/server 5xx during that narrow smoke.

Historical limitations remain historical limitations:

- do not claim the old aggregate `=== DA1 FULL AUDIT PASS ===` marker;
- do not claim the historical H0 exact marker;
- do not equate prototype validation with deployment, UAT, or production acceptance.

## Repository direction

The branch-consolidation target has been reached:

```text
remote heads:
main
```

Historical branch names in evidence/handoff records are provenance. Their deleted remote refs are preserved through verified archival tags.

## Engineering records

Current authority and evidence live under:

- `.forge/SSOT_CURRENT.md`
- `.forge/AUTHORITY.md`
- `.forge/VALIDATION.md`
- `.forge/WORK_LEDGER.md`
- `docs/CURRENT_STATE.md`
- `docs/DEMO_FLOW.md`

Historical handoffs/evidence remain preserved under `.forge/evidence/` and `.forge/handoffs/`.
