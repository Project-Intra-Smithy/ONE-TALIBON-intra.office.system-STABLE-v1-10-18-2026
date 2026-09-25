# KIRION FORGE — ONE TALIBON V1

## DA1 — H1 CARRIER STABILIZATION + DEAD-END NAVIGATION REPAIR

### CODE WRITER HANDOFF

ROLE CALL:

**KIRION FORGE: CODE WRITER**

---

## 1. FORGE / PROJECT AUTHORITY

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Technical Authority:

**Kirch Ivan Balite**

Project:

**ONE TALIBON V1**

Development effort:

**Kirjane Labs × ALZA IT Solutions**

Technical direction:

**Kirch Ivan Balite**

Current program:

**DA1 — PROTOTYPE-DAY BLOCKER AUDIT**

Current coordination branch:

`KIRCH-TALIBON-DA1-PROTOTYPE-DAY-BLOCKER-AUDIT`

Exact product/start authority before this handoff:

`a85b09fada99faf2dc6143c9a5efec99a2df6b78`

Commit message:

`KIRCH-DA1-ALIGN-H1-CURRENT-UI-CONVERGENCE`

The handoff commit containing this file is governance-only. The writer branch must descend from the exact coordination authority containing this handoff.

Target writer branch:

`KIRCH-TALIBON-DA1-H1-CARRIER-NAVIGATION-REPAIR`

---

## 2. PURPOSE

This is a **targeted acceptance-repair wave**.

It is NOT another deep audit.

It is NOT a backend rewrite.

It is NOT a new feature wave.

It is NOT permission to redesign My Work, Correspondence, Records, Dashboard, Memoranda, or Travel Orders.

The objective is to close the remaining DA1 uncertainty efficiently by doing exactly two things:

1. stabilize the H1 browser mutation acceptance carrier so it distinguishes backend truth from UI/navigation convergence without false-negative cascades;
2. repair already-identified dead/denied/empty-looking navigation contracts that can send a valid user into a misleading destination.

The writer must avoid broad reconnaissance when current evidence already resolves the question.

---

## 3. ACCEPTED / FROZEN EVIDENCE

The following is already observed and MUST NOT be reopened without new contradictory evidence.

### V1 showcase browser

PASS:

`V1_SHOWCASE_BROWSER_PASS checks=260 matrices=6 screenshots=8`

Covers the current showcase gateway and six browser matrices, including responsive behavior.

### MP0 two-user messaging

PASS:

- production asset mode
- Department Heads initial sync
- production sends
- two-user polling
- refresh persistence
- General channel switch
- MPDO Planning channel switch
- channel isolation
- rapid channel switch sync
- failed-send text retention
- channel error isolation

Final observed result:

`MP0 TWO-USER MESSAGING: PASS`

### Environment already proven usable

Do NOT spend this wave re-diagnosing:

- PostgreSQL connectivity
- disposable test database capability
- migrations
- seed execution
- Laravel runtime startup
- system Chrome execution
- Playwright launch
- production Vite assets
- V1 showcase gateway
- MP0 messaging runtime

### Main and branch state

- `main` remains untouched.
- No remote branch cleanup is authorized.
- No force push is authorized.
- No RC1 work is authorized by this handoff.
- No deployment is authorized.

---

## 4. CURRENT H1 FAILURE STATE

The latest H1 execution completed real browser mutation work against:

`talibon_h1_mutations`

and reported:

`8 H1 failures; 0 scenarios deferred to H2`

The eight reported failing scenarios were:

1. `transactions-return-origin`
2. `transactions-request-information`
3. `correspondence-register`
4. `correspondence-classify`
5. `correspondence-route-double-click`
6. `correspondence-begin-action`
7. `memorandum-publish`
8. `travel-order-record-approved`

These eight rows MUST NOT be treated as eight independent product defects.

Current evidence collapses them into a smaller number of root causes.

---

## 5. CURRENT CLASSIFICATION — DO NOT DISCARD THIS

### A. Transaction return / request-information

Observed failures:

`transactions-return-origin`

Reason:

`interaction: page.waitForFunction: Timeout 5000ms exceeded.`

`transactions-request-information`

Reason:

`interaction: page.waitForFunction: Timeout 5000ms exceeded.`

These are currently **carrier/readiness failures until proven otherwise**.

Do not modify transaction workflow semantics merely because `appReady()` timed out.

Earlier authoritative database evidence already showed transaction mutations succeeding in other H1 scenarios, including correct:

- status
- current office
- assignment clearing
- event action
- from/to office
- event count

### B. Correspondence chain

Observed:

`correspondence-register`

failed only at reload consistency with:

`page.waitForFunction: Timeout 6000ms exceeded.`

The mutation had already advanced the correspondence to the next lifecycle state before reload evaluation.

`correspondence-classify`

then failed after the unstable register/reload state.

`correspondence-route-double-click`

failed with:

`No option matched /Budget/i`

`correspondence-begin-action`

failed with:

`Dependency failed: correspondence lifecycle is registered`

Treat route and begin-action as **dependency cascades**, not independent defects, unless targeted execution proves otherwise.

### C. Memorandum publish

Database evidence:

- count = 1
- recipientCount = 350
- acknowledgedCount = 0
- targetAcknowledged = false
- ackAuditCount = 0

Browser remained at:

`/memoranda/create`

The backend store controller is already known to redirect to `memoranda.show`.

Current classification:

**authoritative mutation succeeded; browser redirect/convergence verdict is stale or premature until targeted proof says otherwise.**

Do not rewrite memorandum persistence.

### D. Travel Order record-approved

Database evidence:

- count = 1
- status = `approved`
- eventCount = 1
- issuedToCount = 1
- latest event = `recorded_approved`

Browser remained at:

`/travel-orders/create`

The backend controller already redirects to `travel-orders.show`.

Current classification:

**authoritative mutation succeeded; browser redirect/convergence verdict is stale or premature until targeted proof says otherwise.**

Do not rewrite Travel Order persistence.

---

## 6. ROOT PROBLEM IN H1 CARRIER

The current H1 harness conflates:

1. request emission,
2. authoritative backend state,
3. Inertia navigation settlement,
4. visible UI convergence,
5. reload consistency.

It also permits dependent correspondence failures to multiply after an earlier prerequisite failure.

The current `appReady()` helper is suitable for catastrophic render readiness, but it must NOT be the primary proof that a mutation redirect or lifecycle transition has settled.

A successful mutation must not be reported as an undifferentiated H1 failure merely because the browser is still on the old page when a short fixed wait expires.

---

## 7. WORK PACKAGE W1 — H1 CARRIER STABILIZATION

Primary file:

`tests/Browser/h1-mutation-readiness.mjs`

Supporting test-only files may be changed only when required.

### W1.1 — semantic convergence waits

Replace fixed/generic post-mutation readiness assumptions with scenario-specific semantic waits.

Examples:

Memorandum publish must wait for the actual expected destination/state:

- URL resolves to `/memoranda/{id}` or equivalent authoritative show route;
- memorandum reference is visible;
- backend probe says exactly one published record exists.

Travel Order record-approved must wait for:

- URL resolves to `/travel-orders/{publicId}`;
- expected order reference/heading is visible;
- backend probe says exactly one approved order/event exists.

Correspondence register must wait for:

- register POST completes;
- lifecycle probe is `registered`;
- current workspace exposes the Classify state/action.

Correspondence classify must wait for:

- classify POST completes;
- lifecycle probe is `classified`;
- Route action and valid route options are visible.

Transaction handoff scenarios must wait for the expected authorized destination or explicit denied-origin/destination boundary, not merely generic page readiness.

### W1.2 — keep appReady narrow

`appReady()` should remain a catastrophic-render guard only.

It may answer:

- app root exists;
- meaningful DOM exists;
- page is not blank;
- basic shell/semantic marker rendered.

It must not substitute for:

- mutation completion;
- redirect completion;
- authoritative state completion;
- route-specific action availability.

### W1.3 — scenario isolation

Each root scenario must start from an explicit known page/state.

Do not rely on the previous scenario leaving a shared Page object at the expected location.

Reusing authenticated BrowserContext is allowed.

Before each targeted scenario:

- navigate explicitly to the required starting route;
- wait for the starting semantic marker;
- then perform the mutation.

No relogin is required if the authenticated context remains valid.

### W1.4 — dependency-aware correspondence chain

Model correspondence as an explicit dependency chain:

`register -> classify -> route -> begin action`

If a prerequisite fails, dependent scenarios MUST NOT be counted as new H1 product defects.

Use an explicit result such as:

`SKIPPED_DEPENDENCY`

or equivalent machine-readable classification.

The report must state which prerequisite blocked execution.

Do not record a dependency skip as `failH1`.

### W1.5 — layered verdicts

Each mutation scenario must record separate evidence for at least:

- `requestVerdict`
- `backendVerdict`
- `uiConvergenceVerdict`
- `reloadVerdict`

Equivalent structured fields are acceptable.

A scenario may still fail overall, but the report must make the failing layer explicit.

Example:

```text
REQUEST          PASS
BACKEND STATE    PASS
UI CONVERGENCE   FAIL
RELOAD           NOT_RUN
```

### W1.6 — targeted scenario filter

Add a test-only environment selector:

`QA_H1_SCENARIOS`

It must support a comma-separated exact scenario allowlist.

Example:

`QA_H1_SCENARIOS=memorandum-publish,travel-order-record-approved`

When set:

- only selected scenarios and their mandatory prerequisites execute;
- unselected scenarios do not count as failures;
- the report records that execution was targeted.

When absent:

- the complete H1 suite behavior remains available.

Do not create multiple new harness files unless technically necessary.

### W1.7 — sanitized failure diagnostics

On convergence failure record only safe diagnostics:

- current pathname/query
- expected pathname/pattern
- HTTP status where available
- `document.readyState`
- `#app` exists
- app child count
- app text length
- body text length
- visible `h1` count
- visible `main` count
- pageerror count
- HTTP 5xx count
- expected semantic marker present/absent

Do NOT emit:

- passwords
- MFA/TOTP
- cookies
- CSRF tokens
- authorization headers
- private document bodies
- private HR payloads
- full HTML responses

---

## 8. WORK PACKAGE W2 — TARGETED ROOT PROOFS

After W1 compiles/syntax-checks, run only targeted H1 roots.

### Root set A — transaction handoff

Run:

- `transactions-return-origin`
- `transactions-request-information`

If backend state and event truth are correct but UI settlement fails, fix the carrier.

If targeted execution proves product state or authorization is wrong, stop and classify the exact product defect before editing production code.

### Root set B — correspondence prerequisite

Run:

- `correspondence-register`
- `correspondence-classify`

Do not execute route/begin-action as independent defect probes until these two are green.

### Root set C — create-to-show redirects

Run:

- `memorandum-publish`
- `travel-order-record-approved`

Expected:

- exactly one authoritative record;
- expected event/recipient truth;
- browser settles on the existing show route;
- visible created record;
- reload remains consistent.

No persistence/domain rewrite is authorized merely to satisfy a timing assertion.

---

## 9. WORK PACKAGE W3 — CORRESPONDENCE DEPENDENTS

ONLY after register + classify pass:

Run:

- `correspondence-route-double-click`
- `correspondence-begin-action`

Expected route proof:

- valid Budget destination is actually available;
- exactly one route request;
- exactly one effective route mutation;
- origin redirect remains authorized;
- direct origin reopen after handoff truthfully denies if ownership moved;
- destination office can open the routed record;
- linked workflow exists in the expected state.

Expected begin-action proof:

- legitimate linked-workflow prerequisite is performed through the browser;
- Start Action becomes visible only when allowed;
- one act request;
- correspondence becomes `in_action`;
- `action_started_at` populated;
- exactly one correspondence event appended;
- linked workflow remains internally consistent.

Do not weaken correspondence authorization.

---

## 10. WORK PACKAGE W4 — DEAD / DENIED / EMPTY-LOOKING NAVIGATION REPAIR

This is a production UX/navigation repair, but tightly bounded.

### NAV-01 — Transaction detail “Open office work”

Current defect:

`resources/js/pages/Transactions/Show.tsx`

emits:

`/transactions?view=office_queue`

for every actor able to view a transaction.

But `office_queue` is only allowed for the Department Head work-queue experience.

Current tests already establish non-Department-Head actors are forbidden from that view.

Required outcome:

- never emit a My Work view the current actor is not authorized to use;
- Department Head may retain office queue behavior;
- non-office-scope actors must receive a truthful authorized alternative such as their canonical My Work destination;
- do not widen WorkQueue authorization simply to keep the old link.

Prefer server-authoritative capability/profile data over frontend role-name authorization.

### NAV-02 — Executive municipal metrics must not drill into personal semantics

Current defect:

`DashboardExecutiveQuery`

contains municipality-wide metrics such as:

- Active Municipal Work
- Municipal Overdue
- Due Soon
- Recently Completed

but several links target personal My Work views:

- `/transactions`
- `/transactions?view=overdue`
- `/transactions?view=due_soon`
- `/transactions?view=recently_completed`

`WorkQueueQuery` applies personal scope to those views.

This can produce:

`municipal metric > 0 -> click -> empty personal list`

Required outcome:

- municipal aggregate metrics must not deep-link into a query with different semantics;
- use an already-existing semantically truthful municipal/executive/report surface where one exists;
- if there is no truthful existing destination, make the metric non-drillable rather than inventing a fake route;
- do NOT add a new broad My Work query mode solely to preserve clickability;
- do NOT widen transaction visibility beyond existing authority.

### NAV-03 — System Administration correspondence exposure mismatch

Current state:

`PortalNavigationAccess` exposes Correspondence for any active operational identity.

Current Correspondence authorization intentionally does not give `system_admin` universal correspondence-content authority.

Administrative dashboard shortcuts also include Correspondence.

This can expose a destination that legitimately returns no content.

Required outcome:

- visible navigation/shortcut capability must agree with actual correspondence content authority;
- do NOT grant `system_admin` correspondence-content access merely to make the link useful;
- prefer hiding/removing an inaccessible or semantically empty shortcut for that profile;
- preserve all existing correspondence classification/privacy boundaries.

### NAV-04 — Post-handoff destination clarity

Affected workflows include:

- transaction Forward
- transaction Return to Origin
- correspondence Route

The actor may lose access to the moved record immediately after a correct handoff.

Required outcome:

- post-handoff redirect must land on an authorized, renderable page;
- no 403 as the intended redirect target;
- no white/blank React root;
- visible success confirmation must explain that accountability moved;
- when the resulting list is empty, the page must still present a meaningful empty state and success context;
- do not keep access to a record solely to avoid an empty list;
- authorization truth wins.

---

## 11. TARGETED TESTING RULES

This wave is explicitly optimized for speed.

### DO NOT do this after every edit

Do NOT repeatedly run:

- full Feature suite
- full H1
- full DA1 carrier
- V1 browser
- MP0 messaging

### Required targeted sequence

After carrier changes:

1. syntax-check H1 harness;
2. run only selected H1 scenario(s) through `QA_H1_SCENARIOS`.

After NAV-01 / NAV-02 / NAV-03 / NAV-04 production changes:

Run only the smallest relevant Feature tests first.

Likely relevant existing tests include:

- `WorkQueueTest`
- `RepresentativeRoleExperienceTest`
- `DashboardWorkspaceTest`
- `CorrespondenceDetailWorkspaceTest`
- `CorrespondenceWorkspaceActionsTest`
- `W03ContextContinuityTest`

Add focused regression tests where current coverage does not directly prove the repaired link contract.

### Failure rule

If a targeted test fails:

**DO NOT run a broader suite.**

Instead:

1. inspect that exact failure;
2. classify `PRODUCT` vs `CARRIER`;
3. make one bounded repair;
4. rerun only that failed target.

---

## 12. FINAL VERIFICATION ORDER

Only after all targeted roots and navigation regressions are green:

### Gate A — targeted H1 root set

PASS required.

### Gate B — correspondence dependent set

PASS required.

### Gate C — targeted navigation Feature/browser regression

PASS required.

### Gate D — one complete H1 run

Run the complete H1 mutation suite exactly once from a fresh isolated `talibon_h1_mutations` database.

Required:

- no H1 failures;
- no dependency failures;
- no pageerror;
- no HTTP 5xx;
- exact SHA proven;
- final report completed.

### Gate E — one complete DA1 carrier

Only after full H1 is green.

Run the complete DA1 carrier exactly once.

Do not repeatedly rerun earlier expensive gates during repair.

---

## 13. PRODUCT-CODE CHANGE BOUNDARY

Production code may change only for NAV-01 through NAV-04 or for a newly proven targeted product defect.

Without targeted proof, do NOT change:

- transaction workflow business rules;
- correspondence lifecycle semantics;
- correspondence classification/privacy rules;
- memorandum delivery/persistence semantics;
- Travel Order persistence/status semantics;
- auth/session/MFA boundaries;
- schema/migrations;
- package dependencies;
- Calendar;
- Messages;
- unrelated Dashboard hierarchy;
- public portal;
- deployment configuration.

No new migration.

No dependency upgrade.

No broad refactor.

No architecture rewrite.

---

## 14. SOURCE / AUTHORITY RULES

Authority precedence:

1. live Git/runtime evidence;
2. explicit Kirch Technical Authority instruction;
3. current repo-local governance;
4. durable acceptance/review evidence;
5. historical docs;
6. chat memory.

Git wins.

Historical H1 evidence may be used to understand intended contracts, but current source/runtime truth controls.

Do not fabricate PASS evidence.

Do not claim a full suite passed unless it was actually executed and observed.

---

## 15. WORKTREE / SAFETY

Primary workstation:

`D:\Dev\Talibon-Intra-Office-Portal`

is a different/older dirty lineage and MUST NOT be reset, cleaned, repointed, or modified by this wave.

Current isolated DA1 execution worktree:

`D:\Dev\Talibon-DA1-Audit`

Do not use destructive Git operations.

Forbidden:

- `git reset --hard`
- rebase
- squash reconstruction
- force push
- branch deletion
- main promotion
- deployment

---

## 16. REQUIRED CODE WRITER RETURN

Return a concise but exact completion report containing:

```text
ROLE:
KIRION FORGE: CODE WRITER

BRANCH:
<writer branch>

START AUTHORITY:
<handoff authority sha>

FINAL WRITER HEAD:
<sha>

H1 CARRIER:
- semantic convergence waits: PASS/FAIL
- scenario isolation: PASS/FAIL
- dependency-aware skip: PASS/FAIL
- layered verdicts: PASS/FAIL
- QA_H1_SCENARIOS: PASS/FAIL
- sanitized diagnostics: PASS/FAIL

TARGETED H1 ROOTS:
- transactions-return-origin: PASS/FAIL
- transactions-request-information: PASS/FAIL
- correspondence-register: PASS/FAIL
- correspondence-classify: PASS/FAIL
- memorandum-publish: PASS/FAIL
- travel-order-record-approved: PASS/FAIL

CORRESPONDENCE DEPENDENTS:
- correspondence-route-double-click: PASS/FAIL/SKIPPED_DEPENDENCY
- correspondence-begin-action: PASS/FAIL/SKIPPED_DEPENDENCY

NAVIGATION REPAIRS:
- NAV-01 transaction detail office-work link: PASS/FAIL
- NAV-02 executive municipal metric destinations: PASS/FAIL
- NAV-03 system-admin correspondence exposure: PASS/FAIL
- NAV-04 post-handoff destination clarity: PASS/FAIL

TARGETED FEATURE TESTS:
<exact commands + observed counts/results>

TARGETED BROWSER TESTS:
<exact commands + observed results>

FULL H1:
PASS / NOT RUN
<exact result if run>

FULL DA1:
PASS / NOT RUN
<exact result if run>

PRODUCT DEFECTS CONFIRMED:
<none or exact bounded defects>

CARRIER DEFECTS CONFIRMED:
<exact bounded defects>

MIGRATIONS:
NONE

DEPENDENCIES:
UNCHANGED

MAIN:
UNTOUCHED

REMOTE BRANCH CLEANUP:
NOT PERFORMED

DEPLOYMENT:
NOT PERFORMED
```

---

## 17. STOP CONDITIONS

Stop and return to Technical Authority if any of these occur:

- a targeted failure proves a new domain/business-rule defect outside this handoff;
- a migration appears necessary;
- authorization would need to be widened to make a navigation link work;
- current DA1 coordination authority changes unexpectedly;
- main changes unexpectedly;
- test evidence contradicts the accepted V1 or MP0 state;
- the writer is tempted to solve a navigation mismatch by adding a new broad query/route/domain abstraction.

Do not broaden scope.

---

## 18. DEFINITION OF DONE

This writer wave is done when:

1. H1 no longer generates false-negative cascades from generic readiness timing;
2. the targeted H1 root scenarios are green or an exact product defect is proven;
3. correspondence dependent scenarios are run only after prerequisites and are green;
4. identified dead/denied/empty-looking navigation contracts are repaired without authorization widening;
5. targeted tests are green;
6. one final complete H1 run is green;
7. one final complete DA1 carrier is green;
8. exact final writer SHA is returned for Reviewer/Maintainer disposition.

This handoff does NOT authorize merge to `main`.

This handoff does NOT authorize RC1.

This handoff does NOT authorize branch deletion.

This handoff does NOT authorize deployment.
