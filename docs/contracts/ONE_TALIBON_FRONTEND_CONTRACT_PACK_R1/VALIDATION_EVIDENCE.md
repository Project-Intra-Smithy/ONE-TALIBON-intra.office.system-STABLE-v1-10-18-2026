# Validation evidence and falsification plan — read-only source audit
**Exact source examined:** backend `7b4ebb838982f6262b9fef65d18ba57488ebf941`; frontend `bab1f4563b903d7d9810590cd0e3ce6628db8611`. **Execution in this task:** GitHub connector GET/file/tree/issue inspection; documentation-only draft commit. No live browser, environment mutation, local clone, database seeding, application execution or test jobs triggered.

## What was actually verified
- Resolved both `main` branch SHAs live before work; backend recursive tree returned `truncated:false`, 984 blobs; destination frontend tree was five files, documentation-only.
- Inspected source authority: [AGENTS](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/AGENTS.md), [SSOT](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/.forge/SSOT_CURRENT.md), [ledger](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/.forge/WORK_LEDGER.md), [integration](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/.forge/INTEGRATION.md), [P0 freeze](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/.forge/evidence/acceptance/P0-H-CANONICAL-PHASE0-BASELINE-FREEZE.md), [P09](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/.forge/handoffs/active/P09-PROTOTYPE-SHOWCASE-RESIDUE-AUDIT.md), [capability register](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/.forge/memory/COMMON-CAPABILITY-BASELINE-REGISTER.md), [program lock](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/.forge/memory/COMMON-SYSTEM-PROGRAM-LOCK.md), [A01 plan](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/.forge/plans/P1-A01-TEAM-EXECUTION-PLAN.md), [C1](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/.forge/contracts/A01-C1-INDIVIDUAL-TASK-HTTP-CONTRACT.md).
- Read [web routes](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/routes/web.php), [machine routes](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/routes/api.php), [route boot](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/bootstrap/app.php), [shared props](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/app/Http/Middleware/HandleInertiaRequests.php), navigation/types, representative controllers and request validators for major shared domains.
- Traced public, Procurement/Future Integrations, Plans/PPA, Local Bodies, pending Project Monitoring/Departments, and current HRIS source against route existence.
- Confirmed composite fixture seeding local/testing guard, but **did not** prove arbitrary direct seeder invocations are impossible or that other environments lack synthetic historical rows.
- Previous documented C1 CI ([exact-integrated-main run 37898947831](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/actions/runs/37898947831)) recorded **78 tests / 655 assertions** and a cookie/CSRF/MFA HTTP exercise. This is **pre-existing cited evidence, not tests run by Lucien here** and not browser E2E.
- Existing [phpunit.xml](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/phpunit.xml) separates `Feature` from `DeferredAndSpecialized`; suite selection matters. Browser scripts are present, not newly executed.

## Executed tests and non-executed tests
| Test/evidence | This task | Note |
|---|---|---|
| GitHub HEAD and recursive tree inspection | **EXECUTED / source-only PASS** | repository/file inventory established |
| Route/controller/consumer and data-origin inspection | **EXECUTED / source-only**, open gaps | source checks, no runtime assertions |
| npm install/build/typecheck/lint | **NOT EXECUTED** | no checkout/build runtime via GitHub connector |
| PHPUnit Feature/Unit or specialized suites | **NOT EXECUTED** | no PHP/test DB runtime |
| Browser automation / keyboard / mobile | **NOT EXECUTED** | no authenticated browser/environment provided |
| Exact-backend-plus-imported-frontend integration | **NOT EXECUTED** | frontend repository has no imported app |
| Live deployment/production data provenance | **NOT EXECUTED** | production data intentionally not accessed |
| Siris independent QA | **NOT EXECUTED** | never claim |
| Previous C1 bounded CI | **HISTORICAL documented success** | separate SHA/run, cited above |

## Mandatory negative test catalog (not executed here)
| ID | Proposed test | Expected result / decision boundary |
|---|---|---|
| N01 | Navigate `/procurement`; click filter, stage and detail; reload | no persisted PR/workflow object produced; data remains clearly demo |
| N02 | Inspect `/development-plans`, `/ppas`, `/local-special-bodies` with empty DB | static arrays still visible → prevent 'live records' labeling |
| N03 | Visit HRIS links from old components | no active HRIS route; 404 expected, no screen silently activated |
| N04 | Project Monitoring authorized role: inspect Inertia props | pending UI must not silently authorize `items/summary` as official; assess unnecessary server payload separately |
| N05 | Non-member office user GET/POST six messaging channels | establish intended privacy rule: current source does not enforce membership; if private, tests must fail until remediated |
| N06 | Draft text in Channel A, switch to B, send | draft should not leak or be sent to B accidentally; current source lacks keyed composer state |
| N07 | Work Request `GET /live` returns 500/401/HTML; inspect status indicator | should show stale/error state and cease false live claims; current source silently returns |
| N08 | Property create >500 records and compare reported totals | source summary caps counts to fetched 500; known defect, specialized lane only |
| N09 | Task missing/invalid/foreign/off-kind numeric ID on show/start/complete | indistinguishable 404; no tenant/user existence leak |
| N10 | Task POST with `assignee_id`, `state`, `source_domain`, `owning_department_id` | 422 request rejection; no silently dropped privileged fields |
| N11 | Task transition `open→complete` without start; replay start; concurrent start | 422 or authoritative conflict behavior; no optimistic mutation |
| N12 | Task unauthenticated/disabled/MFA pending/wrong Accept | native JSON 401 / disabled 401 `ACCOUNT_INACTIVE` / MFA 403 `MFA_REQUIRED`; never login HTML overwrite |
| N13 | Task session expiry, CSRF missing/mismatch, throttle | 419 JSON, 429; do not replay unsafe POST automatically |
| N14 | Auth role without operational identity GET queue/Correspondence/Admin/Audit | enforce actual route/policy 403/deny; navigation hiding insufficient |
| N15 | Download/export unauthorized document or report | response respects auth/role; file response stays native, never raw unrelated data |
| N16 | Project/department pending UI with seeded sensitive rows | verify no unwanted Inertia serialization despite pending UI; no production test on shared DB |
| N17 | Calendar invalid date/view, event scope across actors, timezone boundary | server fallback semantics, no visibility bypass, null end handling |
| N18 | Both sources drift after review or frontend copy changes field names | block release until exact new SHA and compatibility test tuple |
| N19 | Try API/v1 token from browser bundle, attempt unauthorized scope | **must be prohibited**; machine-only, no credential exposure |
| N20 | Regression across paginated Work Requests, Records, Documents and Messages | no fabricated totals; stable cursor/empty state; pagination proven via real isolated fixtures |

## Source evidence links for test planning
- [Task HTTP feature](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/tests/Feature/Tasks/IndividualTaskHttpTest.php), [Task JSON boundary](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/tests/Feature/Tasks/TaskJsonContractBoundaryTest.php), [Task concurrency](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/tests/Feature/Tasks/TaskConcurrentConnectionTest.php)
- [Current portal route and HRIS boundary](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/tests/Feature/CurrentPortalNavigationTest.php)
- [Work Request validation](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/tests/Feature/WorkRequestBackendValidationTest.php), [transaction permission](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/tests/Feature/TransactionAuthorizationNormalizationTest.php)
- [Correspondence actions](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/tests/Feature/CorrespondenceWorkspaceActionsTest.php), [traceability](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/tests/Feature/CorrespondenceTraceabilityTest.php)
- [Messages list](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/tests/Feature/Messaging/MessageListTest.php), [store](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/tests/Feature/Messaging/MessageStoreTest.php), [access](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/tests/Feature/Messaging/MessagingAccessTest.php)
- [Calendar workspace](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/tests/Feature/CalendarWorkspaceTest.php), [MFA controls](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/tests/Feature/MfaSecurityControlsTest.php)
- [Navigation](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/tests/Feature/PortalNavigationAccessTest.php), [responsive browser script](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/tests/Browser/p08-responsive-smoke.mjs)

## Source audit limitations
Source-backed registration **not** a fully exhaustively extracted OpenAPI schema; many serializer props and feature-specific policies need per-field review. No application runtime, seeded fixture transaction or browser workflow was run. No positive or negative test above should be reported as passed by this task except repository/route/source observations. Next quality gate is an isolated environment plus importer SHA, executed automated tests, screenshots and Kirch acceptance.

## Subsequent exact-source producer verification

**Source review (09 October 2026):** Source-level verification only. Runtime tests, independent QA and formal contract approval were not performed as part of this review. Backend pinned to `7b4ebb838982f6262b9fef65d18ba57488ebf941`; Lucien's pre-correction draft `76d78e68393d119dfb7b2dcbdad4cf15236b1d0f`.

**Executed source checks:** fetched branch SHAs, governed route declarations, MFA/auth controllers and assurance, common controllers/query/presenters for Dashboard/Work Requests/Correspondence/Records/Documents/Memoranda/Messaging/Notifications/Calendar/C1 Task, and privileged Employee/Department/Admin/Audit/Reports/Search/Mayor producers. Cross-checked against original Lucien draft. Findings are recorded in [producer register](BACKEND_PRODUCER_VERIFICATION.md) and [backend issue #40 checkpoint](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/issues/40#issuecomment-6079351653). This is **source inspection**, not a fresh CI run or an independent QA acceptance.

**Still NOT EXECUTED:** PHPUnit, PHP/PostgreSQL integration, authenticated HTTP, Playwright/browser, frontend build/typecheck, fixture/PII tests, real-environment policy tests, Siris independent QA, and backend-to-imported-frontend compatibility. Therefore source-observed field semantics are **not** end-to-end contract acceptance; runtime statuses, race behavior, and Inertia serialization shape variations remain subject to targeted falsification. The existing 20 negative scenarios are still proposed, NOT RUN.
