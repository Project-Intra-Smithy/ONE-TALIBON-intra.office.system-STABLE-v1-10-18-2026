# BH1 — BACKEND / RUNTIME PERFORMANCE HARDENING

## CODE WRITER EVIDENCE

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Writer branch:

`KIRCH-TALIBON-BH1-BACKEND-RUNTIME-HARDENING`

Immutable product base:

`9dba054d34377ce76149d8474ddeb66b5c20130e`

Evidence candidate:

`57a33b56e6615a09dd4cf381c4ad49b5289310e2`

## MEASUREMENT STATUS

BH1 began with a repository-local representative request probe covering:

- first authenticated Dashboard HTML request;
- subsequent Dashboard Inertia request;
- My Work;
- Correspondence;
- Records;
- Calendar Month / Week / Day;
- Messages;
- notification feed JSON;
- elapsed request time;
- query count;
- aggregate database query time;
- payload bytes.

The initial GitHub Actions execution did not reach a runner. Run `36105052326` (BH1 Runtime Probe) and run `36105052332` (Forge UIUX Validation) both completed with `runner_id: 0` and zero executed steps. They are infrastructure-unavailable evidence, not application failures and not runtime measurements.

The unavailable Actions probe workflow and temporary BH1 validation trigger were removed. The repository-local measurement test remains at:

`tests/Feature/Bh1RuntimePerformanceTest.php`

The test was corrected to establish MFA assurance for the privileged Engineering persona before measuring protected pages.

**Initial elapsed localhost before/after milliseconds were not available during implementation. They are now supplemented by the observed local runtime probe appended below. No pre-repair elapsed milliseconds are invented.**

## PROVEN REQUEST / QUERY BOTTLENECKS

### 1. Global authenticated Inertia response work

Before BH1, `HandleInertiaRequests` attached the complete notification feed to every authenticated Inertia response. Resolving that feed performed memorandum and platform-notification database work on the navigation critical path.

BH1 removes the notification feed from global Inertia shared props. `AppLayout` requests the existing `/notifications/feed` JSON endpoint immediately and then continues visible polling. JSON requests now short-circuit the internal Inertia share payload.

Result: notification-feed database work no longer blocks normal Inertia page responses.

### 2. Repeated MFA assurance reads on safe requests

Before BH1, the MFA middleware and the Inertia shared-prop path could both call `AuthenticationAssurance::isSatisfied()` during the same safe request, and each call refreshed the current user.

BH1 stores the safe-request assurance result in the request attribute bag after the authoritative refresh.

Result: subsequent assurance checks in the same GET/HEAD request reuse the verified result without another user refresh. Mutation requests are not memoized.

### 3. My Work scope badge fan-out

Before BH1, `WorkQueueQuery::scopeGroups()` executed one `COUNT` query per visible view.

- employee profile: 8 scope-count queries;
- department-head profile: 12 scope-count queries.

BH1 replaces those per-view round trips with one conditional aggregate query over the already-authorized and already-filtered transaction scope.

Structural before/after:

- employee scope badges: **8 -> 1 query**;
- department-head scope badges: **12 -> 1 query**.

The view definitions, personal/office boundaries, terminal-status rules, filters, and response contract remain unchanged.

### 4. Records metadata fan-out

Before BH1, Records state options independently plucked values from each included source, and office options separately plucked department IDs from correspondence workflow, unlinked correspondence, workflow transactions, and travel orders.

BH1 uses authorized `UNION ALL` subqueries followed by one distinct projection per metadata category.

For the all-sources Records view, structural metadata reads change from:

- state values: **3 source reads -> 1 union read**;
- office IDs: **4 source reads + 1 department fetch -> 1 union read + 1 department fetch**.

This removes five database round trips from the all-sources metadata path while retaining the same source authorization builders.

### 5. Notification feed internal duplicate reads

The feed itself remains authoritative at `/notifications/feed`, but BH1 reduces its own query fan-out:

- unread memorandum count and the latest four unread memo recipients now share one windowed recipient query;
- platform total-history and unread count now share one aggregate query;
- platform notification rows use a selected-column bounded read.

The feed remains bounded and does not introduce persistent caching or stale municipal state.

## REGRESSION EVIDENCE ADDED

`tests/Feature/WorkQueueTest.php` now locks the Work Queue scope badges to one aggregate query containing the complete scope projection.

`tests/Feature/PerformanceLiveEndpointsTest.php` now locks the consolidated notification-feed query shape for memo-recipient and platform-notification reads.

`tests/Feature/Bh1RuntimePerformanceTest.php` emits repeatable endpoint metrics for local execution and now satisfies the real MFA boundary before measurement.

These tests are **authored but NOT EXECUTED in this environment** because no repository runner became available and this chat does not have the user's localhost process.

## CAL1 PRESERVATION

No Calendar controller, Calendar query service, Calendar React page/component, Calendar route contract, or Calendar migration is changed by the BH1 candidate.

CAL1 remains feature-frozen. Month / Week / Day / Schedule behavior and Municipality / My Office / My Events visibility contracts are not redesigned.

## SECURITY / AUTHORIZATION PRESERVATION

- no authentication architecture replacement;
- no permission bypass;
- no authorization scope broadening;
- no MFA removal;
- MFA request memoization occurs only after an authoritative refresh and only on safe requests;
- mutation requests continue to re-evaluate assurance;
- Records query consolidation reuses the existing authorized source builders;
- Work Queue aggregation operates on the existing authorized/filtered builder.

## PACKAGE / MIGRATION / CONFIG IMPACT

None.

No migration, database index, package, lockfile, environment contract, or application configuration change is introduced by the final BH1 diff.

## LOCAL PROBE REQUIRED BEFORE MAINTAINER ACCEPTANCE

From an updated checkout of the writer branch, run:

`php artisan test tests/Feature/Bh1RuntimePerformanceTest.php`

Retain every `BH1_METRIC` line. This is the missing server-duration/query-count/payload observation needed to determine whether the localhost latency reduction is materially visible and to complete the exact before/after runtime record.

BH1 must not be called Accepted solely from this Code Writer evidence.


## OBSERVED LOCAL RUNTIME PROBE — 2026-09-25

The previously missing localhost runtime evidence was executed successfully on Windows from an isolated BH1 worktree at the exact candidate SHA:

`58f2b8e82020b6072591ff619e6ff268ed2148c2`

The probe first failed only because the isolated worktree had no PostgreSQL password. After loading the existing local ignored `.env` into the isolated worktree and clearing Laravel config cache, the exact repository-local performance test completed successfully.

Command:

`php artisan test tests/Feature/Bh1RuntimePerformanceTest.php`

Result:

`1 passed / 10 assertions`

Observed metrics:

| Path | Elapsed | Queries | DB time | Payload | Status |
| --- | ---: | ---: | ---: | ---: | ---: |
| dashboard.first_html | 227.09 ms | 17 | 29.82 ms | 7,982 B | 200 |
| dashboard.inertia | 45.13 ms | 15 | 23.94 ms | 6,612 B | 200 |
| my_work.inertia | 70.42 ms | 10 | 19.85 ms | 5,359 B | 200 |
| correspondence.inertia | 17.20 ms | 3 | 3.83 ms | 4,842 B | 200 |
| records.inertia | 65.05 ms | 10 | 37.04 ms | 3,884 B | 200 |
| calendar.month.inertia | 27.72 ms | 2 | 15.58 ms | 1,183 B | 200 |
| calendar.week.inertia | 9.08 ms | 2 | 1.70 ms | 1,181 B | 200 |
| calendar.day.inertia | 9.65 ms | 2 | 1.70 ms | 1,179 B | 200 |
| messages.inertia | 7.43 ms | 1 | 0.86 ms | 960 B | 200 |
| notifications.feed | 22.38 ms | 5 | 12.55 ms | 117 B | 200 |

### Runtime interpretation

The persistent authenticated navigation paths no longer show the multi-hundred-millisecond behavior that motivated BH1.

All measured warm Inertia paths are below 71 ms in this local probe.

The only 200+ ms observation is `dashboard.first_html` at 227.09 ms. Because the subsequent Dashboard Inertia request is 45.13 ms and its database time is 23.94 ms, the first-request cost is not evidence of a persistent page-query bottleneck. It remains a cold/request-bootstrap observation and is not decomposed further by this probe.

The two heaviest warm paths are:

- My Work: 70.42 ms total / 19.85 ms DB / 10 queries;
- Records: 65.05 ms total / 37.04 ms DB / 10 queries.

Those values do not establish a pathological remaining bottleneck requiring another speculative repair. Any further optimization of those surfaces should be driven by a reproduced user-visible delay or a later targeted profile, not by BH1 scope expansion.

Calendar remains especially bounded after CAL1 freeze:

- Month: 27.72 ms / 2 queries;
- Week: 9.08 ms / 2 queries;
- Day: 9.65 ms / 2 queries.

Messages is 7.43 ms / 1 query. Correspondence is 17.20 ms / 3 queries.

### BH1 disposition from Code Writer evidence

The local runtime probe now closes the missing measurement gap.

BH1 has:
- observed local runtime evidence;
- proven query-shape reductions;
- successful representative endpoint execution;
- no Calendar implementation changes;
- no migration/index/package/config impact;
- preserved authorization and MFA boundaries.

No additional Code Writer repair is justified by the observed metrics before independent Maintainer review.

This is still not a self-Acceptance claim. The candidate should proceed to Maintainer review at the exact post-evidence HEAD.
