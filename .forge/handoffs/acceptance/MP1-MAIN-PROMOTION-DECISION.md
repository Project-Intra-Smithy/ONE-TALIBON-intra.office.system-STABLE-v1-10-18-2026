# KIRION FORGE — ONE TALIBON V1

## MP1 — MAIN PROMOTION DECISION

### TECHNICAL AUTHORITY HANDOFF

Technical Authority:

**Kirch Ivan Balite**

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

## Promotion under consideration

Current pre-promotion main:

`main@9cc1b50b28762402c3b24a721cd5ba7ae961817c`

Exact RC1 candidate:

`KIRCH-TALIBON-RC1-MAIN-CONSOLIDATION@f6208cf082c4b1d189c70728adfdb9ddf3225990`

RV1 execution supplement:

`.forge/evidence/maintainer/RV1-EXACT-RC1-EXECUTION-SUPPLEMENT.md`

## Required pre-promotion verification

Before moving `main`:

1. re-fetch remote `main`;
2. require it to remain exactly `9cc1b50b28762402c3b24a721cd5ba7ae961817c`;
3. re-fetch RC1;
4. require it to remain exactly `f6208cf082c4b1d189c70728adfdb9ddf3225990`;
5. require current main to be an ancestor of RC1;
6. require no force push;
7. require normal fast-forward / ancestry-preserving promotion only.

If either ref moved, STOP.

## Evidence basis

RC1 source / ancestry review:

`PASS`

Focused TypeScript / production build / focused PHPUnit execution:

`PASS BY FAIL-FAST EXECUTION PROGRESSION`

Playwright browser launch:

`PASS`

Exact-SHA current-contract runtime smoke:

`PASS`

Observed runtime marker:

`RV1_NARROW_RUNTIME_PASS sha=f6208cf082c4b1d189c70728adfdb9ddf3225990 pageerrors=0 server5xx=0`

Confirmed RC1 product defects:

`NONE`

Confirmed RC1 integration defects:

`NONE`

## Historical limitations retained

Do not claim:

- `=== DA1 FULL AUDIT PASS ===`;
- historical H0 exact-SHA marker.

The DA1 aggregate marker was never observed.

The historical H0 carrier is stale against the current Showcase login contract; exact RC1 runtime was instead proved through the current-contract narrow smoke.

## Promotion boundary

This handoff does not itself authorize promotion.

Promotion requires an explicit current instruction from **Kirch Ivan Balite**.

If authorized, the promotion must:

- move `main` to exact RC1 candidate `f6208cf...` through a normal non-force operation;
- preserve history;
- verify remote `main` equals the expected promoted SHA;
- perform only a narrow post-promotion smoke/integrity check appropriate to the already-validated candidate;
- not deploy;
- not delete branches yet.

## After promotion

Only after exact remote-main verification:

1. record main-promotion evidence;
2. preserve archival refs/tags required by the consolidation plan;
3. separately authorize branch cleanup;
4. separately authorize deployment / prototype rehearsal.

No branch deletion or deployment is authorized by this handoff.
