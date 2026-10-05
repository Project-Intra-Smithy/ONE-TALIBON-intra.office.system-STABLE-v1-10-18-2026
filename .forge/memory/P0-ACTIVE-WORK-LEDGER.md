# KIRION FORGE — P SERIES ACTIVE WORK LEDGER

## Technical Authority

**Kirch Ivan Balite**

## Program

`P SERIES — CANONICAL BASELINE HARDENING`

Historical coordination label:

`P0 — CANONICAL BASELINE STABILIZATION`

Coordination branch:

`KIRCH-TALIBON-P0-CANONICAL-BASELINE-STABILIZATION`

Governing plan:

`.forge/memory/P0-CANONICAL-BASELINE-AND-REPOSITORY-SEPARATION-PLAN.md`

Detailed slice/cadence authority:

`.forge/memory/P0-CODE-FIRST-EXECUTION-CADENCE.md`

## Governing execution rule

Finish and stabilize municipality-wide shared capabilities first wherever engineering authority is sufficient. Client/LGU-specific workflows, routing, approvals/signatures, SLA/service levels, confidentiality, KPIs and specialized-domain semantics are mapped and blocked rather than guessed.

Active product/runtime source must stop presenting obsolete `prototype` / `showcase` / demo semantics as current product authority. Remove, rename, de-expose or truth-label transitional logic based on evidence. Historical provenance remains preserved.

Full HRIS remains outside immediate scope. Employee & Office Directory remains the immediate organizational capability. Procurement and Project Monitoring remain specialized/client-data-dependent. Accepted Messaging behavior remains protected.

## Slice state

- `P01 — SOURCE TRUTH & AUTHORITY LOCK`: SUBSTANTIALLY COMPLETE
- `P02 — SECURITY, SHOWCASE & ENVIRONMENT BOUNDARY`: MATERIALLY PROGRESSED
- `P03 — BACKEND CANONICALIZATION`: RETURNED / P05 INPUT ACCEPTED
- `P04 — FRONTEND CANONICALIZATION`: RETURNED / P05 INPUT ACCEPTED
- `P05 — PRODUCT SURFACE DISPOSITION`: COMPLETE
- `P06 — CROSS-LAYER CONTRACT RECONCILIATION`: ACTIVE — MAINTAINER CONTRACT DEFINITION
- `P07 — SOURCE RECONCILIATION & INTEGRATED CANDIDATE`: BLOCKED ON P06
- `P08 — TARGETED CI/CD & RUNTIME ACCEPTANCE`: BLOCKED ON P07 EXACT SHA
- `P09 — BASELINE FREEZE & KNOWN-STATE PUBLICATION`: BLOCKED ON P08

## Immutable common writer base

`a10dca34db0509d7139ebeb4080e85dde2c0e544`

## Returned writer candidates

### P03 / W01 — Backend Canonicalization

Branch:

`KIRCH-TALIBON-P0-W01-BACKEND-CANONICALIZATION`

Final candidate:

`594950469aa82a0d85dbf86c443d32adcd7dbe09`

Relationship to immutable base:

`4 commits ahead / 0 behind`

State:

`RETURNED — ACCEPTED AS P05/P06 RECONCILIATION INPUT`

Principal outcomes:

- Full HRIS active routes de-exposed;
- Employee & Office Directory preserved;
- demo-account dependency removed from active directory summary;
- development/test seeding guarded from non-local/non-testing environments;
- transitional backend names partially canonicalized;
- accepted Messaging behavior preserved.

### P04 / W02 — Frontend Canonicalization

Branch:

`KIRCH-TALIBON-P0-W02-FRONTEND-CANONICALIZATION`

Final candidate:

`fb300c4a9ffc2d5d3b66ee9260e5d33a966c810a`

Relationship to immutable base:

`31 commits ahead / 0 behind`

State:

`RETURNED — ACCEPTED AS P05/P06 RECONCILIATION INPUT`

Principal outcomes:

- shell/navigation product truth aligned;
- Work Requests no longer mislabeled as first-class Tasks;
- Full HRIS removed from canonical navigation;
- Meetings/Announcements/Procurement/Project Monitoring and other incomplete domains de-exposed or marked integration-pending;
- fake/static municipal-looking fallback presentation reduced;
- accepted Messaging preserved;
- client/LGU input register and frontend extraction map produced.

## P05 — Product Surface Disposition

Governing record:

`.forge/evidence/maintainer/P05-PRODUCT-SURFACE-DISPOSITION.md`

P05 record commit:

`2fd63466e5c7b95d2d512248f008e6f36a5f8a13`

Disposition:

`COMPLETE`

P05 locks the current product truth:

### Canonical active/shared core

- Public portal / Login / MFA
- Dashboard foundation
- Search Portal
- Document Center / Attachments
- Municipal Records
- Correspondence
- Memoranda
- Work Requests / Transactions
- Employee & Office Directory
- Departments / Offices
- Calendar
- Messaging
- Notifications
- Reports foundation
- Audit
- System Administration
- bounded executive oversight

### Explicit engineering gaps

- `TASK-001` First-Class Task
- `WORK-001` Unified My Work
- `REC-001` deeper Records/Document lifecycle
- `SEARCH-001` broader accepted-domain Global Search

### Client/LGU authority blocked / integration pending

- Meetings
- Announcements
- Procurement / PR Tracking
- Project Monitoring
- Local Special Bodies
- Development Plans / PPAs where authoritative data/process truth is missing
- official KPI/report definitions
- Vice Mayor-specific behavior
- department-specific workflow rules

### Excluded immediate scope

- Full HRIS beyond Employee & Office Directory

### Preserved source / not promoted

- Legislative specialized workflow
- Property/asset specialized workflow
- Travel Order specialized workflow
- other historical/specialized source whose authority/dependency is not disproven

## Frozen architecture boundaries

```text
Task != Work Request
Work Request != Correspondence
Document != Transaction
Meeting != Task
Executive oversight != universal routing
```

## P06 — Cross-Layer Contract Reconciliation

Active handoff:

`.forge/handoffs/active/P06-CROSS-LAYER-CONTRACT-RECONCILIATION.md`

P06 handoff commit:

`2eb3d40c63a7b5ce3bb096758d7a70500c43dfd1`

State:

`ACTIVE — MAINTAINER CONTRACT DEFINITION`

P06 owns only the remaining cross-layer debt required before integration:

1. showcase/session/MFA transition closure;
2. accepted Messaging canonical naming without behavior change;
3. Procurement `showcase` payload residue;
4. Employee Directory `featuredLogins` compatibility residue;
5. navigation/route/test contract alignment;
6. de-exposed/historical source policy;
7. P07 integration recipe.

### P06 target for showcase cleanup

If dependency inspection confirms there is no required municipal product behavior behind it, retire the active runtime showcase subsystem instead of carrying it as a production feature:

```text
remove /showcase/* runtime session switching
remove showcase-driven MFA bypass
remove demo-persona product controls
remove showcase shared props/UI coupling
keep normal auth + active-account + MFA authority
move test convenience to local/testing fixtures + normal login
```

No MFA weakening is permitted.

### P06 Messaging rule

Accepted Messaging behavior remains frozen. Transitional `PrototypeMessaging` / `PrototypeMessage` / `messages.prototype.*` / `/messages/prototype/messages` naming may be canonicalized only as one atomic backend+frontend+test contract.

## Client/LGU input register — minimum

- `ORG-001` authoritative office list, Department Heads/acting officers and employee roster;
- `WF-001` departmental workflows/forms/templates/routing/approval/signature/service levels/reports/confidentiality/exceptions;
- `WF-002` process-owner validation/correction;
- `KPI-001` official management indicators/reports by role;
- `VICE-001` Vice Mayor requirements;
- `MEET-001` Meeting lifecycle/ownership/action-items/minutes;
- `ANN-001` Announcement publishing/audience/authority;
- `PROC-001` Procurement lifecycle/process truth;
- `PROJ-001` Project Monitoring data/lifecycle/KPIs;
- `ROLE-001` final municipal role/permission matrix.

Engineering proceeds on shared primitives without waiting for every workflow package, but client-specific municipal rules remain blocked until validated input exists.

## Integration law

No writer may merge P03/P04 or independently create the P07 combined candidate.

The Maintainer/Technical Authority will:

1. complete P06 source/contract inspection;
2. issue at most two bounded P06 Code Writer packages if required;
3. verify exact P06 return SHAs;
4. construct the single P07 integrated candidate;
5. run P08 targeted CI/CD/runtime acceptance against that exact SHA;
6. publish P09 known-state baseline only after acceptance.

## Validation cadence

The Windows self-hosted runner is supporting infrastructure, not the delivery program.

Do not run the expensive broad pipeline for intermediate P06 commits.

P08 remains the principal CI/CD acceptance event against the exact P07 integrated candidate.

Known runner host repair already established a real PowerShell executable at:

`C:\Tools\PowerShell\7.6.6\pwsh.exe`

## Forward architecture

After P09:

### R SERIES — Repository Separation

- R01 separation-contract freeze
- R02 backend extraction
- R03 frontend extraction
- R04 auth/API/file/integration parity
- R05 split-repository CI/cutover acceptance

### D SERIES — Container & Runtime Foundation

- D01 reproducible build images
- D02 local Compose topology
- D03 containerized CI/integration
- D04 production-style runtime/reverse proxy/workers/scheduler
- D05 health/secrets/persistence/logging/backup/restore proof

Repository separation and Dockerization remain prohibited inside the P series.

## Current writer allocation

P03/W01: `RETURNED`

P04/W02: `RETURNED`

P06 writers: `NOT YET ISSUED — waiting on exact Maintainer source strategy`

`0 / 2 CODE WRITER SLOTS CURRENTLY ALLOCATED`
