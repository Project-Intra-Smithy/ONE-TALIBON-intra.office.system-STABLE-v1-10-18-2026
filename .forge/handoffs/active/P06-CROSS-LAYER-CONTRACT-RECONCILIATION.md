# KIRION FORGE: MAINTAINER — P06 CROSS-LAYER CONTRACT RECONCILIATION

## Authority

Technical Authority: **Kirch Ivan Balite**

Series: `P SERIES — CANONICAL BASELINE HARDENING`

Slice: `P06 — CROSS-LAYER CONTRACT RECONCILIATION`

Coordination branch:

`KIRCH-TALIBON-P0-CANONICAL-BASELINE-STABILIZATION`

P05 governing disposition:

`.forge/evidence/maintainer/P05-PRODUCT-SURFACE-DISPOSITION.md`

Immutable writer base:

`a10dca34db0509d7139ebeb4080e85dde2c0e544`

Accepted inputs for reconciliation only:

- P03 Backend: `594950469aa82a0d85dbf86c443d32adcd7dbe09`
- P04 Frontend: `fb300c4a9ffc2d5d3b66ee9260e5d33a966c810a`

These inputs are **not yet an integrated candidate**.

---

## Objective

Resolve only the remaining cross-layer contracts that prevent P03 and P04 from becoming one coherent canonical baseline.

P06 is not a feature-development slice.

It does not create client/LGU business rules.

It does not implement first-class Task, Unified My Work, Procurement, Project Monitoring, Meetings, Announcements, Full HRIS, or new specialized domains.

The core cleanup rule remains:

> Remove obsolete prototype/showcase/demo semantics and runtime logic that the canonical product no longer needs, but preserve accepted behavior and historical provenance.

---

## P06-A — Showcase / session / MFA transition closure

### Current cross-layer residue

The active source still contains a runtime showcase subsystem spanning:

- `config/showcase.php` and `SHOWCASE_MODE`;
- `App\Providers\ShowcaseServiceProvider`;
- `App\Http\Controllers\ShowcaseSessionController`;
- `App\Services\ShowcaseSession`;
- `/showcase/session` and `/showcase/switch` runtime routes;
- `RequireMfaAssurance` showcase-session bypass;
- Inertia `showcaseSession` shared props;
- frontend `components/showcase/**`;
- `WorkspaceSwitcher` in the authenticated shell;
- onboarding/persona behavior coupled to showcase state;
- feature/browser tests that authenticate through showcase paths.

The current secure default (`SHOWCASE_MODE=false`) is not the final baseline objective if the subsystem is no longer needed by the actual municipal product.

### Target contract

P06 must determine and implement the smallest safe path to this canonical end state:

```text
normal authentication
+ active-account enforcement
+ normal MFA assurance
+ real role/permission authority
+ local/testing fixtures only where tests need data

WITHOUT production runtime showcase-session switching
WITHOUT showcase-driven MFA assurance bypass
WITHOUT demo-persona product controls
```

Preferred disposition if dependency inspection confirms no required municipal function depends on it:

`REMOVE ACTIVE SHOWCASE SUBSYSTEM`

Testing/demo convenience must move to test/local fixture setup and normal login behavior rather than remain a production runtime product feature.

Do not weaken MFA to make tests easier.

---

## P06-B — Messaging canonical naming contract

### Frozen behavior

Messaging remains an accepted feature and must retain:

- authenticated send;
- PostgreSQL persistence;
- sender identity;
- polling;
- refresh persistence;
- channel isolation;
- current accepted UI behavior.

### Transitional residue

Current accepted behavior still uses names such as:

- `PrototypeMessaging` namespace/classes;
- `PrototypeMessage` model or equivalent legacy naming;
- `messages.prototype.*` route names;
- `/messages/prototype/messages` API path;
- matching frontend fetch/test references.

### P06 rule

Canonicalize transitional naming only as one atomic full-stack contract.

No frontend-only or backend-only rename is acceptable.

The rework package must explicitly map:

```text
OLD controller/service/model/test names -> NEW names
OLD route names -> NEW names
OLD HTTP paths -> NEW paths
OLD frontend consumers -> NEW consumers
OLD browser/Feature tests -> NEW tests
DB table/migration naming -> explicit preserve-or-non-destructive-rename decision
```

If a database rename is proposed, it must be non-destructive and prove data preservation. If the table name can safely remain legacy provenance without affecting product/runtime clarity, P06 may defer physical table rename and record the debt. Behavior takes priority over cosmetic schema churn.

---

## P06-C — Product DTO / route / navigation contract cleanup

P06 must reconcile these known mismatches:

### Procurement

Backend canonical route name:

`procurement.reference`

Residual payload:

`['showcase' => 'procurement']`

Frontend disposition:

`integration_pending / authority-pending`

Required outcome:

- remove/canonicalize `showcase` payload semantics;
- do not promote Procurement;
- preserve truthful authority-pending/reference treatment.

### Employee Directory

Residual backend compatibility key:

`featuredLogins`

Current meaning has already been changed away from demo-persona logins.

Required outcome:

- remove the legacy compatibility key if frontend no longer consumes it;
- define the final summary prop shape once;
- update backend response, frontend type and affected tests atomically.

### Navigation / route tests

P03 and P04 changed opposite sides of the product contract.

Required outcome:

- Feature/browser expectations derive from the final P05 product-surface disposition;
- only `wired` canonical destinations appear as ordinary navigation;
- `integration_pending` surfaces remain non-canonical;
- Work Requests remain distinct from Tasks.

---

## P06-D — De-exposed / historical source policy

P06 must not confuse runtime de-exposure with historical destruction.

### Full HRIS

Current target state:

- runtime routes absent;
- canonical navigation absent;
- Employee & Office Directory active;
- historical Full-HRIS source may remain provenance until a separate archival/deletion decision proves dependencies are absent.

### Property / Legislative / Travel Order and other specialized domains

Current target state:

- preserve source where authority/dependency is not disproven;
- do not advertise as normal shared-core navigation;
- no new workflow semantics;
- record exact future authority dependency.

### Static/reference datasets

If no active accepted feature depends on them, remove from active product execution paths.

Do not delete historical Forge evidence.

---

## P06-E — Test / fixture contract after cleanup

Broad CI remains deferred to P08, but P06 must make the source testable without relying on the runtime showcase product.

Required test-fixture direction:

- development/test seed data may exist only in `local` / `testing`;
- test identities authenticate through normal auth behavior;
- MFA tests explicitly establish assurance rather than inheriting a showcase bypass;
- Messaging tests continue to exercise the accepted behavior;
- route/navigation tests reflect the final canonical surface;
- no test may require production `SHOWCASE_MODE=true` as a correctness prerequisite.

P06 code writers may run narrow tests/typecheck directly relevant to their repair. Do not burn the broad P08 pipeline on intermediate commits.

---

## P06-F — Integration recipe

P06 must return an explicit P07 integration recipe containing:

1. exact accepted P03 SHA;
2. exact accepted P04 SHA;
3. each P06 rework SHA, if issued;
4. file-overlap/conflict map;
5. intended application of backend/frontend changes;
6. final expected route names and paths;
7. final expected frontend SharedProps/DTO shapes;
8. expected deleted/de-exposed transitional runtime files;
9. exact narrow tests run before integration;
10. unresolved client/LGU dependencies that must remain blocked.

P07 is the first slice allowed to construct the single combined candidate.

---

## Candidate writer allocation

P06 may use at most **two** bounded Code Writers after Maintainer inspection produces exact contracts.

Preferred split:

### P06-W01 — Authentication / Showcase Retirement + Shared Contract Cleanup

Potential ownership:

- showcase/session backend subsystem;
- MFA bypass removal;
- Inertia shared-prop cleanup;
- frontend WorkspaceSwitcher/showcase coupling cleanup;
- Procurement/Employee Directory shared contract residue where naturally coupled;
- narrow security/auth/navigation tests.

### P06-W02 — Messaging Canonical Naming + Messaging Contract Preservation

Potential ownership:

- backend Messaging class/route naming;
- frontend Messaging endpoint consumers;
- tests/browser contracts directly tied to Messaging;
- optional non-destructive schema-name decision if separately justified.

These writers MUST start from a Maintainer-issued source strategy. Do not independently branch from P03 or P04 until that source is explicitly issued.

---

## Stop conditions

Stop and return to Technical Authority if reconciliation would require:

- inventing LGU routing/approval/signature rules;
- implementing first-class Task or Unified My Work;
- promoting Procurement or Project Monitoring;
- creating Meeting/Announcement lifecycle rules;
- Full HRIS expansion;
- unrelated package upgrades;
- destructive migration rewriting;
- repository separation;
- Dockerization;
- deployment;
- `main` mutation;
- broad product redesign.

---

## Return contract

P06 returns:

```text
P06 SOURCE STATE
P03 INPUT SHA
P04 INPUT SHA
P06-W01 SOURCE / FINAL SHA if issued
P06-W02 SOURCE / FINAL SHA if issued
SHOWCASE RUNTIME DISPOSITION
MFA ASSURANCE RESULT
MESSAGING NAMING DISPOSITION
MESSAGING BEHAVIOR PRESERVATION
PROCUREMENT CONTRACT RESULT
EMPLOYEE DIRECTORY DTO RESULT
NAVIGATION / ROUTE CONTRACT RESULT
DE-EXPOSED SOURCE POLICY RESULT
NARROW TESTS ACTUALLY RUN
CLIENT/LGU BLOCKERS PRESERVED
P07 INTEGRATION RECIPE
FINAL P06 DISPOSITION
```

No merge, promotion or deployment occurs in P06.
