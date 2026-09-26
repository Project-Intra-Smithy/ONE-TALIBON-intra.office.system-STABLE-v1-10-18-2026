# KIRION FORGE — ONE TALIBON V1

## MP5 BATCH 1 — EXACT-CANDIDATE EXECUTION VALIDATION

### MAINTAINER VALIDATION HANDOFF

## Authority

Technical Authority:

**Kirch Ivan Balite**

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Forge authority:

`Kirch-Nairu/KIRION-FORGE@44eb57e5b45b343be0033bf22a7a5e74d543c01a`

MP5 coordination branch:

`KIRCH-TALIBON-MP5-POST-DAT-FRONTEND-CORRECTION`

This validation gate exists because both Batch 1 candidates passed source review with recorded limitations but both Reviewers explicitly blocked Acceptance on missing execution evidence.

This handoff does not authorize implementation, rework, integration, Acceptance, promotion, or deployment.

## Reviewed candidates

### W01 — Notification Delivery Lifecycle

Exact candidate:

`a31aacc620d8dae448f0fdd1239408c17f74aaf2`

Reviewer verdict:

`SUITABLE WITH RECORDED LIMITATIONS`

Reviewer disposition:

`SUITABLE ONLY AFTER MISSING EXECUTION EVIDENCE IS OBTAINED`

### W02 — Organization & Reference Density / Terminology

Exact candidate:

`f02fa502ba4ab61c79a0d2f622a359d691feea75`

Reviewer verdict:

`SUITABLE WITH RECORDED LIMITATIONS`

Reviewer disposition:

`SUITABLE ONLY AFTER MISSING EXECUTION EVIDENCE IS OBTAINED`

## Validation law

Validate the exact candidate SHA, not merely the branch name.

Before each gate:

`git rev-parse HEAD`

must equal the exact candidate under test.

Do not repair while validating.

If a gate fails:

1. stop that candidate;
2. preserve exact output;
3. classify whether the failure is candidate defect, environment/harness defect, or unrelated infrastructure issue;
4. return to Maintainer;
5. do not edit the reviewed candidate in place.

## W01 required execution evidence

Exact head:

`a31aacc620d8dae448f0fdd1239408c17f74aaf2`

Required:

1. `npm run types:check`
2. `npm run build`
3. focused runtime:
   `node tests/Browser/mp5-notification-replay.mjs`

The browser proof must run only against an isolated testing environment/database accepted by its own hard guards.

Required runtime success marker:

`MP5_NOTIFICATION_REPLAY_QA_PASS sha=a31aacc620d8dae448f0fdd1239408c17f74aaf2`

Also preserve:

`storage/app/qa/mp5-notification-replay-report.json`

Acceptance-critical W01 behavior:

- historical transaction notification does not initially/repeatedly toast;
- unrelated navigation does not replay it;
- genuinely new transaction notification alerts;
- that exact new notification does not replay after further navigation;
- direct reload does not replay;
- both notifications remain in bell/history;
- page errors = 0;
- server 5xx = 0;
- navigation failures = 0.

The Reviewer-recorded storage-unavailable reload limitation and hypothetical future in-place identity-switch risk remain recorded unless separately disproven. They do not need speculative repair for this validation gate.

## W02 required execution evidence

Exact head:

`f02fa502ba4ab61c79a0d2f622a359d691feea75`

Required compiler/build/test gates:

1. `npm run types:check`
2. `npm run build`
3. `php artisan test tests/Feature/CurrentPortalNavigationTest.php`

Required browser/visual surfaces:

- `/departments`
- `/employees`
- `/legislation`
- `/local-special-bodies`
- `/municipal-systems`

Required presentation evidence:

### Desktop

At least one of:

- 1366×768
- 1280×800

Verify:

- no horizontal overflow;
- compact summaries materially reduce first-frame cost;
- primary content/actionable rows appear earlier;
- no filters/actions/data disappear;
- long real municipal strings do not visibly break the layout.

### Narrow/mobile

At least one representative narrow viewport around:

- 390×844
- 430-class equivalent

Verify:

- controls remain reachable;
- row/card stacks remain understandable;
- no horizontal overflow;
- no inaccessible hidden action;
- long text wraps without destroying task continuity.

### Theme

Observe affected surfaces in both Light and Dark.

Verify:

- text/status contrast remains readable;
- no light-only or dark-only broken panel/border state;
- status semantics remain readable as text, not color alone.

## W02 truth checks

The following labels must render truthfully:

- Staff Directory
- Ordinances & Issuances
- Councils, Boards & Committees
- Systems Directory

Underlying routes and domain behavior must remain:

- `/employees`
- `/legislation`
- `/local-special-bodies`
- `/municipal-systems`

No Batch 2 vocabulary is part of this gate.

## Combined evidence policy

W01 and W02 may be validated independently.

Do not integrate them merely to make validation easier.

Their exact reviewed SHAs are the validation subjects.

A PASS result must identify:

- exact SHA;
- environment;
- command/scenario;
- outcome;
- relevant output/report;
- limitations.

## Validation return

Return:

# ONE TALIBON V1 — MP5 BATCH 1 EXECUTION VALIDATION RETURN

## W01 exact candidate
SHA:
TypeScript:
Build:
Focused notification runtime:
Runtime success marker:
Report path/result:
Environment:
Limitations:

## W02 exact candidate
SHA:
TypeScript:
Build:
Focused Feature:
Desktop browser:
Narrow/mobile:
Light:
Dark:
Horizontal overflow:
Environment:
Limitations:

## Failure classification
List any failure and classify:
- candidate defect;
- harness/environment defect;
- unrelated infrastructure issue.

## Acceptance gate disposition

For each candidate state exactly one:

- EXECUTION EVIDENCE COMPLETE — MAY PROCEED TO ACCEPTANCE
- EXECUTION EVIDENCE INCOMPLETE — HOLD
- VALIDATION FAILURE — RETURN TO MAINTAINER

## Authority return

No implementation performed.

No integration performed.

No Acceptance performed.

No promotion performed.

No deployment performed.
