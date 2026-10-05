# KIRION FORGE — P0 ACTIVE WORK LEDGER

## Technical Authority

**Kirch Ivan Balite**

## Program

`P0 — CANONICAL BASELINE STABILIZATION`

Coordination branch:

`KIRCH-TALIBON-P0-CANONICAL-BASELINE-STABILIZATION`

Governing plan:

`.forge/memory/P0-CANONICAL-BASELINE-AND-REPOSITORY-SEPARATION-PLAN.md`

## Current two-writer batch

Immutable shared implementation base:

`a10dca34db0509d7139ebeb4080e85dde2c0e544`

Maximum active Code Writers:

`2`

### P0-W01 — Backend Canonicalization

Branch:

`KIRCH-TALIBON-P0-W01-BACKEND-CANONICALIZATION`

Handoff:

`.forge/handoffs/active/P0-W01-BACKEND-CANONICALIZATION.md`

Handoff issuance commit:

`eba7c33f9104a3ceb02c435cdfe8bca39789a62e`

State:

`ISSUED / ACTIVE`

Primary ownership:

`app/**`, `routes/**`, bounded backend `config/**`, `database/**` under non-destructive rules, backend tests.

### P0-W02 — Frontend Canonicalization

Branch:

`KIRCH-TALIBON-P0-W02-FRONTEND-CANONICALIZATION`

Handoff:

`.forge/handoffs/active/P0-W02-FRONTEND-CANONICALIZATION.md`

Handoff issuance commit:

`be2d5998e45d5efab490a16b246f02b0706ebe37`

State:

`ISSUED / ACTIVE`

Primary ownership:

`resources/js/**`, `resources/css/**`, frontend-only assets, `tests/Browser/**`.

## Integration rule

W01 and W02 are intentionally non-overlapping. Neither writer may merge the other writer branch or change the coordination branch.

The Maintainer/Technical Authority will:

1. verify each returned exact SHA;
2. verify lineage from `a10dca34db0509d7139ebeb4080e85dde2c0e544`;
3. inspect changed files for ownership violations;
4. review source changes independently;
5. reconcile cross-layer findings;
6. select an integration order;
7. build one exact integrated P0 candidate;
8. run full exact-candidate validation;
9. publish the P0 known-state baseline only after acceptance.

## Current validation-lab note

The Windows self-hosted validation lane is supporting evidence, not the Phase 0 program itself.

The most recent validation attempt at source `3a2576eb49b809ee1f9e8211bd3ac35b2ce21db8` failed during PHP setup because the runner resolved `pwsh` through an inaccessible WindowsApps alias. This is classified as a runner-host/tooling defect, not a product-source defect.

A real portable PowerShell 7.6.6 executable has since been installed and verified at:

`C:\Tools\PowerShell\7.6.6\pwsh.exe`

Future validation should run only after a fresh runner listener inherits the corrected PATH. No application-code change is justified by that host failure.

## Forward architecture decision

After the accepted Phase 0 baseline, the current combined repository will be used as the traceable extraction source for separate frontend and backend repositories.

Repository separation is not authorized inside W01/W02.

Docker/container platform work is also deferred to a bounded post-P0 lane after baseline freeze and extraction-contract definition.

## Current writer allocation

- W01 — ACTIVE
- W02 — ACTIVE

`2 / 2 CODE WRITER SLOTS ALLOCATED`

Do not issue a third Code Writer without explicit Technical Authority concurrency amendment.
