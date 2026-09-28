# KIRION FORGE — ONE TALIBON V1

## FB0 REWORK-02 — PROMOTION-STABLE NEXT-PHASE STATE

### MAINTAINER REWORK RECORD

Role:

`KIRION FORGE: MAINTAINER`

Parent rework candidate:

`KIRCH-TALIBON-FB0-FRONTEND-BACKEND-TRANSITION-REWORK-01@6891bc486ec278109a5a980fd3d77bdae6754714`

REWORK-01 Reviewer evidence:

`KIRCH-TALIBON-FB0-FRONTEND-BACKEND-TRANSITION-REWORK-01-REVIEW@3237ce7731cc3fd47c4702d216a1b5b4fecfe31c`

Reviewer disposition:

`REWORK REQUIRED`

Exact confirmed defect:

`PROMOTION-STABILITY-01`

The CURRENT SSOT still encoded “complete FB0 re-review and re-Acceptance first” as its unconditional current next action. Successful promotion would therefore make the promoted CURRENT SSOT stale immediately.

## Rework objective

Make the SSOT phase-transition wording stable before and after promotion by separating:

- **FB0 promotion prerequisites** — conditional gates required before any exact FB0 candidate may be promoted;
- **persistent post-FB0 next phase** — E0 exact-machine/self-hosted/test-database evidence closure.

## Exact allowed scope

Only:

`.forge/SSOT_CURRENT.md`

plus this durable rework record.

No other governance file requires semantic repair for PROMOTION-STABILITY-01.

## Forbidden

No application/runtime source.
No migration.
No dependency change.
No workflow implementation.
No DB mutation.
No runner mutation.
No main promotion.
No branch deletion.
No rebase/squash/force push.

## Exit condition

After hypothetical promotion of the exact REWORK-02 candidate:

- all CURRENT SSOT statements remain truthful;
- pre-promotion review/Acceptance requirements are described as conditional promotion gates rather than the persistent next action;
- E0 is the durable post-FB0 engineering next phase.

Fresh Reviewer and Acceptance are required before promotion.
