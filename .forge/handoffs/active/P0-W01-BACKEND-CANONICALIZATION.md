# KIRION FORGE: CODE WRITER — P03 BACKEND CANONICALIZATION

## Authority

Technical Authority: **Kirch Ivan Balite**

Series: `P SERIES — CANONICAL BASELINE HARDENING`

Slice: `P03 — BACKEND CANONICALIZATION`

Writer lane: `P03-W01-BACKEND`

Writer branch:

`KIRCH-TALIBON-P0-W01-BACKEND-CANONICALIZATION`

Immutable implementation base:

`a10dca34db0509d7139ebeb4080e85dde2c0e544`

This handoff supersedes the earlier broad P0-W01 wording for this branch. Do not change branch strategy. Do not merge W02. Do not target `main`.

## Governing product authority

Use the uploaded **ONE TALIBON — Intra Office System Technical Audit / Cross-Reference / Implementation Plan** as the primary scope authority for this slice.

The engineering direction is:

1. finish and stabilize municipality-wide shared capabilities that can be made true for all offices without inventing department-specific rules;
2. remove prototype/showcase terminology from active product/runtime source where it falsely describes current product authority;
3. remove or de-expose runtime logic that is outside immediate scope or no longer needed, but only after proving it is not required by accepted current behavior;
4. preserve accepted Messaging behavior even if legacy names still contain `Prototype`;
5. map all client/LGU-data dependencies instead of hard-coding assumptions;
6. leave specialized workflows blocked until process truth is supplied and validated.

Historical `.forge/**` provenance is not to be rewritten merely to erase the word `prototype`. Historical evidence remains historical evidence.

## Product truth that controls P03

Treat these as **shared-core engineering targets**:

- Organization / offices / users / employees;
- Employee & Office Directory;
- roles / permissions / account status;
- authentication / MFA / auditability;
- first-class Task foundation where current repository authority is sufficient;
- unified My Work aggregation where current repository authority is sufficient;
- inter-office Work Request / Transaction engine;
- correspondence;
- documents / attachments / Document Center;
- records / records registry / authorization-safe search foundations;
- memoranda;
- notifications / reminders infrastructure;
- calendar backend;
- accepted Messaging exact behavior;
- role-safe dashboard/report projection foundations.

Treat these as **not authoritative general-core completion targets** unless validated client/process truth exists:

- department-specific routing matrices;
- approval/signature authorities;
- SLA durations;
- confidentiality rules;
- specialized reports/KPIs;
- Procurement final lifecycle;
- Project Monitoring final lifecycle/KPIs;
- Vice Mayor-specific dashboard behavior;
- Meeting authority/publishing/action-item lifecycle beyond current proven foundation;
- Announcement publishing authority/audience lifecycle beyond current proven foundation.

Treat **Full HRIS as excluded immediate scope**. The immediate organizational capability is Employee & Office Directory. Historical HRIS code does not override scope authority.

## Core cleanup law — prototype/showcase/demo removal

Inventory active backend source for terms and behaviors including:

`Prototype`, `Showcase`, `Demo`, `Mock`, `Sample`, `Reference`, bypasses, seeded persona shortcuts, temporary bridge endpoints, or equivalent transitional logic.

For each occurrence classify:

- `REMOVE` — no longer required by accepted product behavior;
- `RENAME / CANONICALIZE` — accepted behavior exists but transitional naming remains;
- `DE-EXPOSE` — keep code/history temporarily but remove from active route/runtime surface;
- `KEEP — ACCEPTED` — required by an accepted exact-SHA feature or current core behavior;
- `KEEP — HISTORICAL` — provenance/schema history only;
- `BLOCKED — CLIENT DATA/AUTHORITY` — cannot be finalized without LGU input.

Do not blindly string-replace. Remove transitional semantics, not evidence.

Preserve Messaging behavior. If backend namespaces/routes/classes still use `PrototypeMessaging`, canonicalize naming only when the change can be completed without breaking the accepted behavior or cross-layer contract. If a URL/contract rename requires frontend coordination, record it for P06 instead of guessing.

Showcase/MFA bypass logic is presumed removable from the canonical production-oriented baseline unless a current authorized non-production use is proven. Production authentication/authorization must not depend on showcase shortcuts.

## P03 execution slices

### P03-A — Runtime Surface & Route Authority

Audit `routes/**` and all routed controllers.

For every active route classify:

- `CORE — GENERAL`;
- `ACCEPTED FEATURE DELTA`;
- `REFERENCE / MATURITY WORK`;
- `CLIENT-DATA BLOCKED`;
- `SPECIALIZED-DOMAIN BLOCKED`;
- `OUTSIDE IMMEDIATE SCOPE`;
- `HISTORICAL / NON-RUNTIME`.

Required actions:

- remove/de-expose routes that make excluded or non-authoritative domains look production-ready;
- remove active showcase/prototype-only endpoints that are not required;
- preserve accepted Messaging;
- do not expose Procurement or Project Monitoring as a finalized lifecycle;
- remove/de-expose Full HRIS runtime surfaces beyond Employee & Office Directory unless a specific immediate-core dependency is proven;
- identify static/reference Meeting and Announcement backend gaps without inventing lifecycle authority.

### P03-B — Organization, Identity, Access & Audit

Canonicalize the client-independent mechanics for:

- municipality / office / employee / user relationships;
- active/inactive account handling;
- auth/MFA;
- roles/permissions/policies/gates/middleware;
- audit events and security-negative behavior.

Do not hard-code the final LGU office/employee roster. Record `ORG-001` as client-data dependent.

### P03-C — Work, Accountability & Official Records

Audit and harden the general shared mechanics for:

- Task vs Work Request separation;
- Transaction / Work Request custody, assignee, status, due/event history;
- Correspondence registration/classification/routing/reference generation;
- Documents/attachments;
- Records and authorization-safe search;
- Memoranda;
- notifications/reminders infrastructure.

Preserve:

- `Task != Work Request`
- `Work Request != Correspondence`
- `Document != Transaction`

Where first-class Task / unified My Work cannot be completed without new design authority, prepare a precise engineering gap rather than inventing workflow semantics.

### P03-D — Coordination & Accepted Messaging

Audit:

- Messaging backend accepted state;
- Calendar event persistence/publication;
- notifications/eventing;
- Meetings backend authority gap;
- Announcements backend authority gap.

Canonicalize transitional naming where safe. Do not create Meeting or Announcement publishing rules without client/process authority.

### P03-E — Schema, Seeds, Config & Dead Runtime Logic

Audit:

- migrations;
- seeders;
- active models;
- unused controllers/services/jobs/listeners;
- server configuration;
- environment assumptions;
- demo personas / showcase seeds;
- dead HRIS/specialized-domain runtime code.

Rules:

- no destructive migration history rewrite;
- preserve schema provenance where required;
- delete dead runtime code only after references/routes/tests prove non-use;
- remove demo/showcase seed dependencies from canonical runtime where they are not required;
- no protected/UAT data mutation.

### P03-F — Backend Extraction & Client-Data Map

Return a backend extraction manifest for the future backend repository.

Also produce a **CLIENT/LGU INPUT REGISTER** with at least:

- `ORG-001` authoritative office list, Department Heads/acting officers, employee roster;
- `WF-001` departmental workflows, forms/templates, routing rules, approval/signature authorities, service levels, reports, confidentiality rules, exceptions;
- `WF-002` process-owner validation/correction of translated workflows;
- `KPI-001` approved dashboard/report indicators by role;
- `VICE-001` Vice Mayor dashboard requirements;
- `MEET-001` authoritative Meeting ownership/lifecycle/action-item/minutes rules if required;
- `ANN-001` Announcement publishing/audience/authority rules if required;
- `PROC-001` Procurement lifecycle authority and cross-office process truth;
- `PROJ-001` Project Monitoring data model/lifecycle/KPIs;
- any additional client-owned data/authority discovered.

Each dependency must identify:

`what is missing -> why engineering cannot responsibly decide it -> current safe system treatment -> exact code surfaces blocked by it`.

## Owned files

Primary source ownership:

- `app/**`
- `routes/**`
- backend-focused `config/**` where current authority is clear
- `database/**` under non-destructive rules
- `tests/Feature/**`
- backend-focused `tests/Unit/**`

May add one evidence report:

`.forge/evidence/code-writer/P03-W01-BACKEND-CANONICALIZATION.md`

## Reserved / prohibited

Do not modify without Maintainer authorization:

- `resources/js/**`
- `resources/css/**`
- `tests/Browser/**`
- `.github/**`
- `composer.json`
- `composer.lock`
- `package.json`
- `package-lock.json`
- root Vite/TypeScript configuration
- governing `.forge` memory/authority files
- Docker/deployment files

Do not:

- invent LGU routing/approval/SLA/confidentiality/signature/KPI rules;
- create Procurement or Project Monitoring lifecycle semantics;
- expand Full HRIS;
- rewrite migration history destructively;
- perform repository separation;
- Dockerize;
- merge/promote/deploy;
- run broad CI on every commit.

## Validation during P03

This is CODE-FIRST.

Use only narrow proof directly tied to changed backend code:

- targeted Feature/Unit tests;
- authorization/security negatives;
- route listing/registration checks when routes change;
- disposable test DB checks when schema/seed behavior changes.

Do not burn the broad Windows CI lane for intermediate commits. Full targeted CI/CD happens after P03+P04 integration in P08.

## Return package

Return exactly:

1. exact candidate SHA;
2. diff from `a10dca34db0509d7139ebeb4080e85dde2c0e544`;
3. P03-A through P03-F disposition summary;
4. all removed/de-exposed/renamed prototype/showcase/demo logic;
5. all excluded-scope logic removed/de-exposed, especially Full HRIS beyond directory needs;
6. accepted Messaging preservation statement;
7. shared-core areas hardened/completed without client-specific assumptions;
8. client/LGU input register;
9. backend extraction manifest;
10. validation actually run and actual results;
11. unresolved cross-layer issues for P06;
12. explicit statement that frontend, CI, Docker, deployment and `main` were not modified.

## Stop conditions

Stop and return to Maintainer instead of guessing when:

- a required change crosses frontend ownership;
- a Messaging contract rename requires simultaneous frontend change;
- required behavior depends on client workflow/process authority;
- a shared dependency/root config change is required;
- code appears old but current use cannot be disproven;
- schema/data intent is ambiguous;
- the failure is runner/CI/host-only.
