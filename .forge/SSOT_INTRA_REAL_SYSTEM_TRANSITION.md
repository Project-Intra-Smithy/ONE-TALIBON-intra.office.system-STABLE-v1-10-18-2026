# ONE TALIBON INTRA — REAL-SYSTEM TRANSITION SSOT

## Status

`STAGED / NOT YET PROMOTED`

This file defines the candidate post-showcase program state on:

`KIRION-INTRA-REAL-SYSTEM-TRANSITION`

It does not replace `.forge/SSOT_CURRENT.md` on accepted `main` until the transition is reviewed and explicitly promoted.

## Exact ancestry

Accepted source branch:

`main`

Exact source SHA used to stage this program:

`269975e1c1e61bcde78490530e5cc8e90f35ae47`

Transition directive commit:

`319403d622f5e0c3c3508717095f37cb9ab245e4`

Governing transition directive:

`.forge/directives/INTRA-REAL-SYSTEM-TRANSITION.md`

## Product target

**ONE TALIBON INTRA — Municipal Intra-Office Operating System**

Target identity:

- real municipal internal work platform;
- office-aware and employee-aware;
- direct departmental coordination;
- authoritative work ownership;
- traceable official communication;
- institutional evidence and records foundation;
- executive visibility without Mayor-centric routing;
- modular domains with explicit boundaries;
- productionization based on evidence, not presentation labels.

## Governing domain boundaries

```text
ORGANIZATION
Municipality
├── Mayor / Executive
├── Departments
│   ├── Department Head
│   └── Employees
└── System Administration

OPERATIONAL WORK
├── Task / Assignment        (intra-department capable)
└── Work Request / Transaction (inter-office/routed work)

OFFICIAL INFORMATION / EVIDENCE
├── Correspondence
├── Document
├── Record
└── Memorandum

COORDINATION
├── Messages
├── Meetings
├── Announcements
├── Calendar
└── Notifications
```

These are related domains, not synonyms.

## Routing law

Normal routing is departmental.

```text
Department Head -> Staff
Staff -> Department Head
Department <-> Department
Department <-> Mayor's Office when executive action is required
Mayor's Office -> Department
```

Forbidden architectural assumption:

```text
Department -> Mayor's Office -> Department
```

as a universal routing requirement.

## Current system posture

The existing codebase contains a substantial accepted foundation that must be preserved and audited rather than rewritten wholesale:

- department/user/employee organization model;
- inter-office transaction workflow;
- direct receiving-office routing;
- staff assignment;
- office queues / My Work transaction projections;
- correspondence lifecycle and linked workflow;
- document/evidence linking;
- records search/register foundation;
- memorandum acknowledgement foundation;
- calendar backend foundation;
- executive oversight lane;
- backend authorization and audit/event patterns.

Known maturity corrections remain necessary before the repository can truthfully operate as a non-prototype INTRA system:

- general first-class Task domain;
- My Work aggregation across Task + routed work;
- replacement of prototype messaging authority;
- authoritative Meeting backend;
- authoritative Announcement backend;
- deeper Records lifecycle;
- cross-domain coordination links;
- production hosting/operations/security hardening.

## Program sequence

`R0 — REAL-SYSTEM BASELINE AUDIT`

Read-only product-code audit. Produce exact evidence and bounded implementation handoffs.

`R1 — FIRST-CLASS TASK + MY WORK`

Create genuine intra-department task ownership and aggregate it with existing transaction work.

`R2 — MESSAGING AUTHORITY`

Replace temporary/disposable messaging architecture with real participants, membership, authorization, persistence and lifecycle policy.

`R3 — MEETINGS + ANNOUNCEMENTS`

Move reference/static collaboration surfaces to authoritative backend domains.

`R4 — RECORDS LIFECYCLE`

Introduce formal record declaration, custody, classification, retention/archive foundations and lifecycle evidence.

`R5 — CROSS-DOMAIN COORDINATION`

Connect work, communication, meetings, documents, records, notifications and calendar without collapsing their domain meanings.

`R6 — PRODUCTION HARDENING`

Deployment architecture, storage, queues, backups, observability, security, failure recovery and operating runbooks.

## Immediate state

Current transition phase:

`R0 — REAL-SYSTEM BASELINE AUDIT`

Product code mutation during R0:

`FORBIDDEN`

Allowed R0 mutations:

- Forge audit artifacts;
- evidence matrices;
- source-path inventories;
- risk registers;
- bounded Code Writer handoffs;
- test inventories;
- migration/dependency plans.

## R0 required output

R0 must classify every major domain as one of:

- authoritative;
- authoritative foundation / incomplete lifecycle;
- transaction projection only;
- prototype bridge;
- static/reference surface;
- missing;
- unsafe production claim.

At minimum inspect:

- Organization / Departments / Employees;
- Tasks / Assignments;
- Workflow Transactions / Work Requests;
- My Work;
- Correspondence;
- Documents;
- Records;
- Memoranda;
- Messages;
- Meetings;
- Announcements;
- Calendar;
- Notifications;
- executive oversight;
- System Administration;
- audit/event history;
- authorization;
- storage;
- queueing;
- environment/deployment configuration.

Each finding must identify exact source paths, current behavior, intended behavior, mismatch, risk, tests, migration impact, and recommended implementation lane.

## Promotion law

The transition is not complete when this branch exists.

Promotion requires:

1. R0 evidence accepted;
2. bounded implementation lanes executed through Forge;
3. Reviewer inspection;
4. Acceptance decision on exact candidate SHAs;
5. non-prototype claim gates satisfied for the domains being promoted;
6. explicit Technical Authority promotion decision.

Historical showcase success remains valid historical evidence but is not evidence of production readiness.

## Preservation

Never rewrite or erase:

- accepted `main` history;
- `S1-SHOWCASE-ACED-2026-09-30`;
- successful showcase evidence;
- accepted backend evidence;
- existing audit lineage.

Real-system work must move forward from accepted history rather than pretending the prototype phase never happened.
