# KIRION FORGE — ONE TALIBON V1

## FB0 REWORK-01 — PROMOTION-STABLE CURRENT AUTHORITY

### MAINTAINER REWORK RECORD

Role:

`KIRION FORGE: MAINTAINER`

Rejected candidate:

`KIRCH-TALIBON-FB0-FRONTEND-BACKEND-TRANSITION@9bb41e812acfce24c421f312ee3b940faaf47e9f`

Acceptance evidence branch:

`KIRCH-TALIBON-FB0-FRONTEND-BACKEND-TRANSITION-ACCEPTANCE`

Acceptance evidence commit:

`bd962a1f6f09fcf20bf31605999592139ccca156`

Acceptance disposition:

`REJECT / RETURN FOR REWORK`

Rework branch:

`KIRCH-TALIBON-FB0-FRONTEND-BACKEND-TRANSITION-REWORK-01`

## Blocking defect

The rejected candidate conflated:

1. live repository `main` HEAD; and
2. accepted application/runtime payload anchor.

Its current-state wording would become false immediately after a governance-only promotion.

## Required correction

Current governance must distinguish:

- **live repository authority** — exact `main` HEAD, always resolved live from Git;
- **accepted application/runtime payload anchor** — `0e57508cab1a86bf4eabc1637e39b2dae6d32716` until a later accepted product-source mutation changes it.

Historical statements about `main@0e57508...` must be explicitly framed as FB0-opening or RC2-promotion observations.

## Rework scope

Allowed:

- `.forge/AUTHORITY.md`
- `.forge/SSOT_CURRENT.md`
- `.forge/VALIDATION.md`
- `.forge/evidence/maintainer/FB0-FRONTEND-CLOSEOUT-BACKEND-OPENING.md`
- `.forge/handoffs/maintainer/FB0-FRONTEND-BACKEND-TRANSITION.md`
- this rework record

Forbidden:

- application/runtime source;
- migrations;
- dependency files;
- GitHub workflow implementation;
- database mutation;
- runner mutation;
- main promotion;
- branch deletion.

## Exit condition

Rework is complete only when the candidate can be promoted without making any current-state governance statement false solely because `main` advances through governance-only commits.

A fresh Reviewer and Acceptance cycle is required.

No product implementation is authorized by this rework.
