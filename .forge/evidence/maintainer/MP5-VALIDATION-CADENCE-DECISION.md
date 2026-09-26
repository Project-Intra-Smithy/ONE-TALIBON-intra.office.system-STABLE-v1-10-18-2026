# ONE TALIBON V1 — MP5 VALIDATION CADENCE DECISION

Technical Authority:

**Kirch Ivan Balite**

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Decision date:

`2026-09-26`

## Decision

The remaining MP5 frontend correction series will use a **deferred integrated execution gate**.

Per-wave source/ownership Review remains mandatory.

Expensive executable validation is intentionally deferred until the authorized W-series corrections have been assembled into one exact MP5 integration candidate.

This decision changes timing only. It does **not** upgrade missing evidence into PASS.

## Current reviewed candidates

### W01

`a31aacc620d8dae448f0fdd1239408c17f74aaf2`

Review:

`SUITABLE WITH RECORDED LIMITATIONS`

Execution evidence remains:

- TypeScript: NOT RUN
- build: NOT RUN
- focused notification runtime: NOT RUN / NOT OBSERVED

### W02

`f02fa502ba4ab61c79a0d2f622a359d691feea75`

Review:

`SUITABLE WITH RECORDED LIMITATIONS`

Execution evidence remains:

- TypeScript: NOT RUN
- build: NOT RUN
- focused Feature: NOT RUN
- desktop/mobile/theme browser evidence: NOT OBSERVED

## Updated cadence

For each W-series candidate:

1. exact base and remote HEAD verification;
2. bounded implementation;
3. ownership/collision inspection;
4. independent source Review;
5. record missing executable evidence honestly;
6. do not individually spend the full integrated validation cost unless a Reviewer finds a reason to require immediate proof.

After the authorized W-series is integrated into one exact candidate:

1. TypeScript;
2. production build;
3. focused Feature/regression tests for touched behavior;
4. W01 notification replay runtime proof;
5. W02 organization/reference viewport/theme proof;
6. W03 Work Queue/transaction density and workflow smoke;
7. W04 Correspondence/Announcements/Memoranda clarity and interaction smoke;
8. Messages regression smoke;
9. any separately authorized Calendar/Meetings verification;
10. exact-candidate final Review;
11. Acceptance;
12. promotion;
13. narrow post-promotion smoke.

## CI/CD boundary

CI/build/test execution is deferred to the exact integrated MP5 candidate.

CD/deployment is **not** bundled into that gate.

Deployment remains a separate Technical Authority decision after final Review, Acceptance, promotion, and post-promotion smoke.

## Safety boundaries

This decision does not authorize:

- ignoring source-review defects;
- integrating a candidate with a confirmed defect;
- calling NOT RUN evidence PASS;
- widening writer scope;
- more than two active Code Writers;
- backend/security/workflow rewrites;
- deployment.

## Immediate consequence

The prior Batch 1 execution-validation handoff remains historical pending evidence, but it is no longer a blocker to opening Batch 2.

W03 and W04 may now proceed in parallel, maximum two writers.
