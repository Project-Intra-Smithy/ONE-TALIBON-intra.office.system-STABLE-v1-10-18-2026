# ONE TALIBON V1 — CURRENT SSOT

## Authority

Technical Authority:

**Kirch Ivan Balite**

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Forge:

`Kirch-Nairu/KIRION-FORGE@44eb57e5b45b343be0033bf22a7a5e74d543c01a`

## Repository authority

Accepted repository branch:

`main`

Exact current repository HEAD:

`RESOLVE LIVE FROM GIT`

Do not treat an older SHA in governance as a permanent alias for `main`.

Governance-only commits may advance `main` without changing application/runtime source.

## Accepted application/runtime payload anchor

`0e57508cab1a86bf4eabc1637e39b2dae6d32716`

This is the accepted RC2 application/runtime payload anchor.

At FB0 opening, live `main` pointed exactly to this SHA.

After a governance-only promotion, repository `main` may advance while this payload anchor remains unchanged.

When application/runtime source is later accepted, this payload anchor must be updated through a governed transition.

## FB0 transition

Program:

`FB0 — FRONTEND / UIUX CLOSEOUT → BACKEND / RUNTIME HARDENING`

Original FB0 candidate:

`9bb41e812acfce24c421f312ee3b940faaf47e9f`

First Acceptance result:

`REJECT / RETURN FOR REWORK`

Reason:

promotion-stability wording conflated live repository HEAD with the application/runtime payload anchor.

Rework branch:

`KIRCH-TALIBON-FB0-FRONTEND-BACKEND-TRANSITION-REWORK-01`

## Carried validation

Backend-green:

`d6a350a5cbc536b23827172216b64f80082cbba8`

Observed:

`400 passed / 5,277 assertions / 0 failures`

V1:

`V1_SHOWCASE_BROWSER_PASS checks=270 matrices=6 screenshots=8`

OW1 at application payload anchor:

`OW1_ONBOARDING_BROWSER_PASS checks=63`

These are carried evidence, not new FB0 executions.

## UI/UX UAT

Technical Authority disposition:

`PASS FOR FRONTEND → BACKEND TRANSITION PURPOSES`

This does not establish backend acceptance, production readiness, commercial completion, or runner readiness.

## Backend direction

Primary program after FB0:

`BACKEND / AUTHORIZATION / PERFORMANCE / RUNTIME HARDENING`

Priority findings already established:

- SEM-01 — Dashboard attention scope/presentation mismatch.
- PERF-01 — DocumentArchiveQuery full-corpus materialization.
- AUTH-01 — System Administration Work Queue scope metadata mismatch.
- AUTH-02 — broader System Administration transaction authority requires Technical Authority decision.
- PROD-01 — executive-only Work Queue is current behavior, not a proven defect.
- MSG-01 — prototype channels do not enforce participant membership.
- CI-01 — current workflows are Linux/container-oriented.

## Self-hosted validation

Runner:

`DEVKRTZ`

Labels:

`self-hosted, Windows, X64`

State:

`REGISTERED / NOT YET ACCEPTED AS VALIDATION AUTHORITY`

Next infrastructure evidence phase:

`E0 — EXACT-MACHINE / SELF-HOSTED / TEST-DATABASE EVIDENCE CLOSURE`

## Database boundary

UAT:

`talibon_portal`

Disposable engineering/test DB:

`talibon_portal_test`

Never perform destructive engineering preparation against `talibon_portal`.

## Promotion-stability rule

Always distinguish:

1. live repository HEAD;
2. accepted application/runtime payload anchor;
3. exact candidate SHA under Review/Acceptance.

Current-state governance must remain true after a governance-only promotion.

## Next action

No Code Writer is authorized by FB0.

Complete FB0 re-review and re-Acceptance first.

After accepted governance promotion:

1. re-resolve live `main`;
2. run E0;
3. finish backend route/query/authorization/performance audit;
4. obtain Technical Authority decisions where required;
5. issue bounded Forge writer waves.

## Evidence law

Live Git/runtime truth outranks this file if they disagree.

Historical MP5/STK1/OW1/CAL1/BH1/DA1/RC1/RV1 records remain provenance, not current authority.
