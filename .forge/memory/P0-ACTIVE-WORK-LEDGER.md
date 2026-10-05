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

Shared municipality-wide capabilities are finished and stabilized first wherever engineering authority is sufficient. Client/LGU-specific workflows, routing, approval/signature authority, service levels, confidentiality, KPIs and specialized-domain semantics are mapped and blocked rather than guessed.

Active product/runtime source must stop presenting obsolete `prototype` / `showcase` semantics as current product authority. Remove, rename, de-expose or truth-label transitional logic based on evidence. Historical provenance is preserved.

Full HRIS remains outside immediate scope. Employee & Office Directory remains the immediate organizational capability. Procurement and Project Monitoring remain specialized/client-data-dependent until sufficient process truth exists. Accepted Messaging behavior remains protected.

## Slice state

- `P01 — SOURCE TRUTH & AUTHORITY LOCK`: SUBSTANTIALLY COMPLETE
- `P02 — SECURITY, SHOWCASE & ENVIRONMENT BOUNDARY`: MATERIALLY PROGRESSED
- `P03 — BACKEND CANONICALIZATION`: ACTIVE
- `P04 — FRONTEND CANONICALIZATION`: ACTIVE
- `P05 — PRODUCT SURFACE DISPOSITION`: BLOCKED ON P03/P04 RETURNS
- `P06 — CROSS-LAYER CONTRACT RECONCILIATION`: BLOCKED ON P05
- `P07 — SOURCE RECONCILIATION & INTEGRATED CANDIDATE`: BLOCKED
- `P08 — TARGETED CI/CD & RUNTIME ACCEPTANCE`: BLOCKED ON P07 EXACT SHA
- `P09 — BASELINE FREEZE & KNOWN-STATE PUBLICATION`: BLOCKED ON P08

## Current two-writer batch

Immutable shared implementation base:

`a10dca34db0509d7139ebeb4080e85dde2c0e544`

Maximum active Code Writers:

`2`

### P03 / W01 — Backend Canonicalization

Branch:

`KIRCH-TALIBON-P0-W01-BACKEND-CANONICALIZATION`

Primary handoff:

`.forge/handoffs/active/P0-W01-BACKEND-CANONICALIZATION.md`

Target-map addendum:

`.forge/handoffs/active/P03-W01-BACKEND-TARGET-MAP.md`

Current targeted handoff commit:

`be1cf2b7c23534bedf9dd4c5413ad7f452670f53`

State:

`ISSUED / ACTIVE`

Sub-slices:

- P03-A Runtime Surface & Route Authority
- P03-B Organization / Identity / Access / Audit
- P03-C Work / Accountability / Official Records
- P03-D Coordination / Accepted Messaging
- P03-E Schema / Seeds / Config / Dead Runtime Logic
- P03-F Backend Extraction + Client/LGU Input Register

Priority outcomes:

- remove/de-expose excluded or non-authoritative runtime surfaces;
- remove/canonicalize prototype/showcase/demo backend semantics where no longer needed;
- preserve accepted Messaging behavior;
- retain shared general mechanics that are valid municipality-wide;
- map all client-owned data/authority dependencies instead of hard-coding them.

### P04 / W02 — Frontend Canonicalization

Branch:

`KIRCH-TALIBON-P0-W02-FRONTEND-CANONICALIZATION`

Primary handoff:

`.forge/handoffs/active/P0-W02-FRONTEND-CANONICALIZATION.md`

Target-map addendum:

`.forge/handoffs/active/P04-W02-FRONTEND-TARGET-MAP.md`

Current targeted handoff commit:

`9058d08d35682cadc7b3cc61a0d6170c20caeb3e`

State:

`ISSUED / ACTIVE`

Sub-slices:

- P04-A Shell / Navigation / Product Surface Truth
- P04-B Work & Accountability UI
- P04-C Documents / Correspondence / Records / Search UI
- P04-D Coordination UI
- P04-E Organization / Administration / Specialized/Deferred Surfaces
- P04-F Shared UI Quality / Responsive Baseline
- P04-G Frontend Extraction + Client/LGU Input Register

Priority outcomes:

- remove prototype/showcase wording from active canonical product UI;
- truth-label remaining non-live/reference data without pretending it is production authority;
- de-expose excluded/client-blocked domains from production-ready navigation;
- preserve accepted Messaging behavior;
- finish client-independent shared UI mechanics first;
- map client/LGU data/content/authority dependencies explicitly.

## Client/LGU input register — minimum required map

Both P03 and P04 must return affected code surfaces for:

- `ORG-001` authoritative office list, Department Heads/acting officers and employee roster;
- `WF-001` departmental workflows/forms/templates/routing/approval/signature/service levels/reports/confidentiality/exceptions;
- `WF-002` process-owner validation/correction;
- `KPI-001` official management indicators/reports by role;
- `VICE-001` Vice Mayor dashboard requirements;
- `MEET-001` authoritative Meeting lifecycle/ownership/action-item/minutes requirements;
- `ANN-001` Announcement publishing/audience/authority requirements;
- `PROC-001` Procurement lifecycle/process truth;
- `PROJ-001` Project Monitoring authoritative data/lifecycle/KPIs.

Engineering must not wait for all client inputs to complete shared primitives, but client-specific business rules must not be hard-coded before validated input exists.

## Integration law

W01 and W02 remain intentionally non-overlapping. Neither writer may merge the other writer branch or modify the coordination branch.

The Maintainer/Technical Authority will:

1. verify each returned exact SHA;
2. verify lineage from `a10dca34db0509d7139ebeb4080e85dde2c0e544`;
3. inspect changed files for ownership violations;
4. review source changes independently;
5. execute P05 product-surface disposition;
6. execute P06 cross-layer contract reconciliation;
7. issue bounded writer rework if required;
8. construct one exact P07 integrated candidate;
9. run P08 targeted CI/CD and runtime acceptance;
10. publish P09 known-state baseline only after exact-candidate acceptance.

## Validation cadence

The Windows self-hosted runner is supporting validation infrastructure, not the delivery program.

Do not run the expensive broad pipeline for every intermediate writer commit.

P03/P04 use narrow local/static proof where necessary. The principal CI/CD acceptance event is P08 against the exact P07 integrated candidate.

The most recent earlier validation failure at source `3a2576eb49b809ee1f9e8211bd3ac35b2ce21db8` was a runner-host PowerShell resolution defect. A real portable PowerShell 7.6.6 executable has since been verified at:

`C:\Tools\PowerShell\7.6.6\pwsh.exe`

That host defect does not justify product-source mutation.

## Forward architecture

After P09, the accepted baseline becomes the traceable source for:

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

Repository separation and Dockerization remain prohibited inside P03/P04.

## Current writer allocation

- P03/W01 — ACTIVE
- P04/W02 — ACTIVE

`2 / 2 CODE WRITER SLOTS ALLOCATED`

No third Code Writer without explicit Technical Authority concurrency amendment.
