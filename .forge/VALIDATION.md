# ONE TALIBON V1 — Validation & Evidence Policy

## Evidence law

Only claim what was actually observed.

`SOURCE INSPECTED`, `NOT RUN`, `NOT OBSERVED`, and `UNKNOWN` are valid states.

Build success does not prove runtime usability. Runtime success does not prove accessibility. Browser success does not prove deployment. CI absence is not a failure or a pass.

## Current baseline evidence state

At Nest birth:

- `npm ci`: NOT RUN by Reviewer/Acceptance;
- `npm run types:check`: NOT RUN by Reviewer/Acceptance;
- `npm run build`: NOT RUN by Reviewer/Acceptance;
- PHP tests: NOT RUN by Reviewer/Acceptance;
- Playwright/browser harness: NOT RUN by Reviewer/Acceptance;
- exact-SHA CI: NOT OBSERVED;
- responsive acceptance: NOT PERFORMED;
- accessibility acceptance: NOT PERFORMED.

## Writer candidate minimum

Each handoff must define its own focused checks. Unless explicitly unavailable, frontend waves should normally include:

- dependency install state established honestly;
- TypeScript/type check;
- production frontend build;
- focused PHP tests if PHP-backed behavior changed;
- focused browser/task checks for changed user journeys.

## Final correction acceptance matrix

Personas:

- Municipal Executive;
- Department Head — Engineering;
- Department Head — Budget;
- Employee;
- Human Resources;
- Legislative Office;
- System Administration.

Viewport targets:

- 1440×900;
- 1280-class laptop;
- 768-class tablet where affected;
- 430-class mobile;
- 390×844;
- 360-class narrow phone for high-risk layouts.

Appearance:

- light;
- dark.

Task checks include:

- Planning: identify record → open detail → return without horizontal action hunting;
- detail flows: open → inspect related context → return while preserving useful list/filter context;
- sidebar: navigate → switch workspace → sign out without awkward nested scrolling;
- dashboard: identify attention/overdue/next work in the first meaningful viewport;
- utility access: Calendar/Messages/announcements remain usable without crushing the primary canvas.

Accessibility checks include:

- keyboard-only path;
- visible focus;
- dialog focus trap and focus restoration;
- programmatic control names;
- meaningful `h1`/landmark structure;
- zoom/reflow;
- contrast on changed surfaces;
- status not communicated by color alone;
- inner-scroll/task reachability.

## Promotion rule

Acceptance must name the exact promotion being evaluated. Source-baseline acceptance, candidate acceptance, release acceptance, UAT, deployment, and production are separate transitions and must not be conflated.


## DA1 closeout evidence — 2026-09-26

DA1 repair-wave Reviewer disposition:

`SUITABLE WITH RECORDED LIMITATIONS`

Observed component evidence:

- Full H1: PASS, 20 scenarios at `5883d703924921bf5baed587eba01df9c57b6f54`;
- exact review candidate `9fa1ec1a00be72984db651c5b251b36183444d64` has the identical Git tree as `5883d703...`;
- V1 showcase: PASS / frozen evidence;
- MP0 targeted reproduction: PASS after one transient aggregate timeout;
- full Feature suite: PASS before later carrier-stage failure;
- NAV-01 through NAV-04: Reviewer source/regression disposition PASS.

Not observed:

- aggregate `=== DA1 FULL AUDIT PASS ===` marker;
- exact-SHA runtime rerun at `9fa1ec1...`.

Evidence rule:

Do not rewrite content-equivalent runtime evidence as exact-SHA execution. Do not claim full DA1 aggregate PASS. These limitations carry into RC1 / RV1.
