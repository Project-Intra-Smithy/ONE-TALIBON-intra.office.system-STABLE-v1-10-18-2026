# ONE TALIBON V1 — CURRENT AUTHORITY

## Technical Authority

**Kirch Ivan Balite**

Kirch Ivan Balite remains the sole human Technical Authority for product scope, architecture, promotion, release and deployment decisions.

## Forge

Authority:

`Kirch-Nairu/KIRION-FORGE@44eb57e5b45b343be0033bf22a7a5e74d543c01a`

Forge operating roles remain bounded:

- Maintainer controls state transitions and evidence;
- Code Writer implements bounded handoffs;
- Reviewer independently inspects candidate evidence;
- Acceptance determines whether exact candidates satisfy a promotion contract.

## Repository authority

Accepted branch:

`main`

Resolve live `main` from Git before every phase transition.

Current accepted application/runtime payload:

`314b6661b34d4a70272d2a079f7cdda238b522ae`

This is the accepted B1 Records query consolidation and the current:

`PROTOTYPE BACKEND BASELINE`

## Current operational authority

Program:

`SEPTEMBER 30 PROTOTYPE SHOWCASE PREPARATION`

Current phase:

`S1-M0 — FINAL UI ARCHITECTURE LOCKED`

Next implementation transition:

`S1-W01 — SHELL HIERARCHY & NAVIGATION BEHAVIOR`

Showcase:

`2026-09-30 15:00 +08`

Expected attendance:

`16-20`

Governing directive:

`.forge/directives/PROTOTYPE-SHOWCASE-COMMAND-2026-09-30.md`

S1 implementation authority:

`.forge/directives/S1-M0-FINAL-UI-ARCHITECTURE-IMPLEMENTATION-LOCK.md`

## Allowed current mutation

- bounded light UI corrections explicitly identified for the showcase;
- presentation-critical wording, density, spacing and responsive fixes;
- presentation-flow documentation;
- deterministic demo-data preparation;
- validation and rehearsal artifacts.

## Forbidden current mutation without direct blocker evidence

- broad backend hardening;
- architecture redesign;
- schema redesign;
- speculative indexes;
- cache/Redis architecture;
- new modules;
- System Administration authority redesign;
- Messaging membership redesign;
- broad CI redesign;
- unrelated cleanup/refactoring;
- destructive UAT database work.

## Backend freeze

B1 closed with:

- Reviewer: `SUITABLE FOR ACCEPTANCE`;
- Acceptance: `ACCEPT`;
- targeted Records: `21 passed / 630 assertions`;
- BH1/BH2: `3 passed / 25 assertions`;
- full Feature: `400 passed / 5291 assertions`;
- Records query count: `22 -> 17`;
- Documents/Records query count: `22 -> 17`.

Backend reopens only for a directly observed presentation blocker.

## Database authority

Protected UAT:

`talibon_portal`

Disposable validation DB:

`talibon_portal_test`

Destructive test operations are forbidden against UAT.

## Authority precedence

1. directly observed live Git/runtime state;
2. explicit instruction from Kirch Ivan Balite;
3. current repository-local governance;
4. durable Reviewer / Acceptance / Maintainer evidence;
5. historical documentation;
6. conversation memory.

## Anti-drift gate

Before every phase transition:

1. re-resolve live Git;
2. state exact SHA;
3. state current Forge role;
4. state allowed mutations;
5. state forbidden mutations;
6. state inherited evidence;
7. stop on contradiction.

## Claim boundaries

Prototype rehearsal, tunnel transport, deployment, UAT, production acceptance and contractual completion remain separate claims.
