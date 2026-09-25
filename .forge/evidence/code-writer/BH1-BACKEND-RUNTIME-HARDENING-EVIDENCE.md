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

**Elapsed localhost before/after milliseconds are NOT OBSERVED in this evidence record.** No duration values are invented.

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
