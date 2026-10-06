# KIRION FORGE: QA HANDOFF — P0-QA02 PHASE-0 CLOSEOUT

## Authority

Series: `P0 — CANONICAL BASELINE STABILIZATION`

Work package: `P0-QA02 — BOUNDED CURRENT-CANDIDATE EXPLORATORY QA`

QA owner: **Siris / assigned QA lane**

Technical Authority: **Kirch Ivan A. Balite**

Product repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Exact product/runtime candidate under QA:

`395438674b4d2f00659eba616db760b339bb390a`

That exact candidate has already passed KIRION Forge technical acceptance:

- P08 Targeted Baseline Acceptance Run #28
- successful attempt: 3
- conclusion: SUCCESS
- exact SHA: `395438674b4d2f00659eba616db760b339bb390a`

The purpose of this QA lane is NOT to repeat CI/CD. It is to provide the remaining independent human exploratory QA evidence required before P0-H Phase-0 freeze.

Do not modify product source.
Do not create fixes.
Do not merge.
Do not promote.
Do not deploy.

If a defect is found, record it and return it to Maintainer.

---

## Mission

Perform one bounded independent exploratory QA pass against the exact current candidate.

This is **Phase-0 engineering QA**, not LGU UAT and not final contractual acceptance.

The QA pass should answer:

- Can representative users enter the system correctly?
- Are the main shared-core surfaces understandable and reachable?
- Do representative allowed/denied paths behave correctly?
- Are the accepted core work, records and coordination surfaces usable?
- Does the system remain usable at one representative mobile viewport?
- Are obvious empty/error/permission states truthful rather than misleading?

Do not test every historical/deferred/specialized domain.

---

## Required scope

### 1. Authentication / account-state smoke

Verify representative:

- valid login;
- invalid credentials;
- logout;
- inactive-account denial if a fixture/account exists for it;
- MFA-assured flow where applicable to the provided QA identities.

### 2. Main navigation / direct-route authority

Verify:

- normal authenticated navigation;
- one representative allowed route;
- one representative denied/unauthorized route;
- direct-route entry does not bypass server authority.

### 3. Work & accountability

Verify representative Work Request behavior:

- list/queue visible;
- open one item;
- state/office/assignee information is understandable;
- no current screen falsely presents Work Requests as first-class Tasks.

Do not invent or test a Task lifecycle; first-class Task is post-Phase-0 work.

### 4. Official information / evidence

Exercise representative:

- Correspondence;
- Documents / attachments;
- Records / Search;
- Memoranda.

Check that the user can understand what is available, what is empty, and what is permission-bounded.

### 5. Coordination

Exercise:

- Calendar;
- accepted Messaging.

For Messaging, confirm at minimum:

- feed loads;
- current user can send where authorized;
- message appears after send;
- channel switching does not visibly cross-contaminate messages.

Do not redesign or expand Messaging.

### 6. Responsive/mobile check

Use one representative mobile viewport.

Verify:

- navigation remains usable;
- primary shared-core page shell does not become unusable;
- at least one work surface and Messaging remain operable.

This is not a full device certification matrix.

### 7. Shared states

Where naturally reachable, observe at least representative:

- loading;
- empty;
- validation error;
- unauthorized / permission denied;
- unavailable/blocked/reference surface.

Do not manufacture destructive error conditions.

---

## Explicitly out of scope

Do NOT reopen:

- Full HRIS;
- Property;
- Legislative;
- Travel Order;
- Procurement final lifecycle;
- Project Monitoring final lifecycle/KPIs;
- deferred `DeferredAndSpecialized` suite;
- prototype/showcase historical artifacts;
- production deployment;
- backup/restore;
- infrastructure;
- formal LGU UAT;
- final contractual acceptance.

Do not treat a reference/deferred surface as a defect merely because it is intentionally non-authoritative.

---

## Allowed result states

Use only:

- `PASS`
- `FAIL`
- `PARTIAL`
- `BLOCKED`
- `NOT RUN`

Every FAIL/PARTIAL/BLOCKED item must include concise evidence and whether it appears to be:

- product defect;
- test/QA procedure issue;
- environment/runner issue;
- authority/input dependency.

Do not guess.

---

## Required return

Return one concise QA closeout containing:

1. exact product SHA tested;
2. environment/browser/device viewport;
3. persona/account roles used;
4. checklist with PASS/FAIL/PARTIAL/BLOCKED/NOT RUN;
5. screenshots or concise evidence references for any non-PASS item;
6. highest-priority defects, if any;
7. explicit statement whether any finding blocks P0-H;
8. explicit statement:
   `THIS IS PHASE-0 ENGINEERING QA, NOT LGU UAT OR FINAL ACCEPTANCE`.

If every tested item is PASS and no blocker is observed, return:

`QA DISPOSITION: PASS FOR PHASE-0 CLOSEOUT`

If any material current shared-core defect is found, return:

`QA DISPOSITION: REWORK`

Do not mutate source.
