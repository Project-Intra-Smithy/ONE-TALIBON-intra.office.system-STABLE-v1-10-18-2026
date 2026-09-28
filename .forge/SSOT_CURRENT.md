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

First promotion-stability rework:

`KIRCH-TALIBON-FB0-FRONTEND-BACKEND-TRANSITION-REWORK-01`

REWORK-01 Reviewer result:

`REWORK REQUIRED`

Reason:

the persistent CURRENT SSOT still encoded a pre-promotion review cycle as its unconditional next action.

Further FB0 rework/review/acceptance state must be resolved from live Git and durable handoff/evidence rather than inferred from this CURRENT summary.

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

First backend infrastructure evidence phase after FB0 promotion:

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

## FB0 promotion gate

Before any FB0 governance candidate may be promoted:

1. re-resolve live `main`;
2. verify exact candidate lineage and governance-only scope;
3. obtain a fresh Reviewer disposition for that exact candidate;
4. obtain Acceptance for that exact candidate;
5. promote only through an accepted ancestry-preserving non-force operation.

These are promotion prerequisites, not the persistent post-promotion next action.

## Persistent post-FB0 next phase

Once an FB0 governance candidate has been accepted and promoted, the next engineering phase is:

`E0 — EXACT-MACHINE / SELF-HOSTED / TEST-DATABASE EVIDENCE CLOSURE`

E0 sequence:

1. re-resolve live repository `main`;
2. verify the application/runtime payload anchor and its diff from live `main`;
3. prove DEVKRTZ/toolchain/test-database isolation;
4. finish backend route/query/authorization/performance audit with exact-machine evidence;
5. obtain Technical Authority decisions where required;
6. issue bounded Forge writer waves.

No Code Writer is authorized merely by this SSOT.

## Evidence law

Live Git/runtime truth outranks this file if they disagree.

Historical MP5/STK1/OW1/CAL1/BH1/DA1/RC1/RV1 records remain provenance, not current authority.
