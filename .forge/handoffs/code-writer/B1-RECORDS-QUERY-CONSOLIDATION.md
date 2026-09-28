# KIRION FORGE — ONE TALIBON V1

## B1 — RECORDS REGISTRY QUERY CONSOLIDATION

### CODE WRITER HANDOFF

ROLE CALL:

**KIRION FORGE: CODE WRITER**

## 1. Authority

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Technical Authority:

**Kirch Ivan Balite**

Forge authority:

`Kirch-Nairu/KIRION-FORGE@44eb57e5b45b343be0033bf22a7a5e74d543c01a`

Immutable implementation base:

`main@6481491134928413389240b9a82ff422ffc51ceb`

E0 Maintainer evidence authority:

`KIRCH-TALIBON-E0-EXACT-MACHINE-EVIDENCE@1d416c73420ff6c3beb79d47f3ef1506ac4a17e6`

Writer branch:

`KIRCH-TALIBON-B1-RECORDS-QUERY-CONSOLIDATION`

This handoff does not grant Maintainer, Reviewer, Acceptance, integration, promotion, or deployment authority.

## 2. Why B1 exists

E0 exact-machine evidence established the strongest repeatable steady-state backend signal on Records surfaces:

- `records.inertia`: 139.40 ms / 22 queries / 65.56 ms DB time / 5657 bytes;
- `documents.records`: 100.50 ms / 22 queries / 54.92 ms DB time / 6228 bytes.

The first-request Dashboard result was slower, but steady-state Dashboard was materially lower and is not the first target.

The current Records implementation performs multiple independently-derived views over the same authorized source families:

- filtered registry pagination;
- unfiltered overview recent;
- repeated family counts;
- state options;
- office options;
- page hydration.

B1 exists to reduce redundant database work while preserving the exact Records contract and authorization boundaries.

## 3. Primary implementation target

Primary service:

`app/Services/RecordsSearchQuery.php`

Supporting service may be changed only if needed:

`app/Services/RecordsResultPresenter.php`

Tests may be added or changed only for B1 proof.

Do not modify frontend source unless a backend contract defect makes it unavoidable; if that occurs, STOP and return the evidence instead of broadening scope.

## 4. Required behavior preservation

Preserve exactly:

- correspondence authorization through `CorrespondenceAccessDecider`;
- transaction visibility through `TransactionVisibilityQuery`;
- travel-order visibility through `TravelOrderAccess`;
- record family inclusion semantics;
- search semantics;
- state filtering;
- office filtering;
- date filtering;
- record ordering;
- pagination metadata;
- overview counts;
- overview recent records;
- state filter options;
- office filter options;
- result presentation shape;
- detail URLs;
- current Inertia response contracts.

No authorization broadening or narrowing is allowed.

## 5. Performance objective

Reduce redundant Records database work.

Writer must produce before/after evidence using the same seeded test fixture and the existing performance harness.

Minimum candidate target:

- `records.inertia` query count: **22 → 18 or fewer**;
- `documents.records` query count: **22 → 18 or fewer**.

A lower count is welcome only if contract/authorization parity remains exact.

Elapsed time is evidence, not a hard deterministic threshold, but there must be no material regression on the same machine/runtime.

Do not optimize by removing required data, weakening visibility checks, caching stale authority, or skipping filter/overview semantics.

## 6. Preferred technical direction

The writer may choose the implementation, but should investigate redundant query families before adding new mechanisms.

Likely opportunities include:

- consolidate repeated family counts into a bounded aggregate/union result;
- avoid separately executing equivalent source-selection work;
- reuse already-authorized source builders safely;
- avoid duplicate hydration when the same page rows can be reused without changing semantics;
- keep pagination SQL-side;
- keep result-set hydration bounded to returned rows.

Do not introduce application-level full-corpus materialization as a shortcut.

## 7. Explicitly out of scope

Do not modify or repair:

- `DocumentArchiveQuery` / PERF-01;
- Dashboard semantics / SEM-01;
- Work Queue metadata / AUTH-01;
- generic System Administration transaction authority / AUTH-02;
- executive Work Queue composition / PROD-01;
- Messaging membership authority / MSG-01;
- migrations;
- schema;
- indexes;
- cache architecture;
- Redis;
- dependencies or lockfiles;
- GitHub workflows;
- frontend redesign;
- routes unrelated to Records;
- UAT data.

No index is authorized in B1. Index work requires PostgreSQL plan evidence in a separate bounded wave.

## 8. Required proof

At minimum:

1. targeted Records feature tests pass;
2. authorization/visibility parity tests cover positive and negative cases across the three record families;
3. pagination parity is proven;
4. counts parity is proven;
5. state-option parity is proven;
6. office-option parity is proven;
7. filtered search/state/office/date behavior is proven;
8. `Bh1RuntimePerformanceTest` passes;
9. `Bh2FastRenderHardeningTest` passes;
10. candidate metrics are emitted and compared with the E0 baseline;
11. production PHP changes remain bounded to B1 services;
12. no migration/schema/dependency/frontend/workflow drift exists.

Run broader Feature regression if practical after the targeted gate, but do not spend time babysitting unrelated CI.

## 9. Failure law

If a test fails, classify it before repair:

- B1 product regression;
- existing product defect;
- stale expectation;
- fixture defect;
- test harness defect;
- environment defect;
- unrelated failure.

Do not expand B1 to repair unrelated failures.

## 10. Required Code Writer return

Return exactly:

1. writer branch;
2. immutable base;
3. final writer HEAD;
4. commits ahead / behind base;
5. changed files;
6. implementation summary;
7. authorization/contract preservation evidence;
8. targeted test results;
9. BH1 before/after metrics;
10. BH2 before/after metrics;
11. query-count disposition;
12. broader regression result if run;
13. failures/classifications;
14. known limitations;
15. explicit statement that no integration/promotion was performed.

Do not self-accept.

Do not merge.

Do not promote.
