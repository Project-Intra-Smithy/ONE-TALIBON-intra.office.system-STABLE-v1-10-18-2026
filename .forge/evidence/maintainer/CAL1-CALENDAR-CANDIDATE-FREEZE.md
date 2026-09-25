# CAL1 — CALENDAR WORKSPACE CANDIDATE FREEZE

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Technical Authority:

Kirch Ivan Balite

Calendar branch:

`KIRCH-TALIBON-CAL1-CALENDAR-WORKSPACE`

Exact CAL1 candidate:

`9dba054d34377ce76149d8474ddeb66b5c20130e`

Immutable CAL1 base:

`01231a7ef39c4b68400816ba9f07e815067f46e9`

## Disposition

CAL1 implementation is **feature-frozen as the current calendar candidate** so backend/runtime hardening can proceed without reopening calendar presentation work.

This record is a Maintainer/Technical-Authority scope freeze only.

It is NOT:
- independent Acceptance;
- production acceptance;
- UAT;
- deployment approval;
- a claim that every runtime layer has been benchmarked.

## Frozen CAL1 implementation

The candidate contains the complete bounded Google-Calendar-style workspace introduced by the four CAL1 commits:

1. `d0e96f972790848b88d0e822d89023dee3302258`
   `KIRCH-FORGE-CAL1-CALENDAR-WINDOW-CONTRACT`
2. `55c8cb12c347c998babb30f464ce9fb0fd57eb5d`
   `KIRCH-FORGE-CAL1-MONTH-WORKSPACE-FOUNDATION`
3. `76a405b6dd20df9a6fd5a3f679f8687016afaf20`
   `KIRCH-FORGE-CAL1-TIME-GRID-SCHEDULE-VIEWS`
4. `9dba054d34377ce76149d8474ddeb66b5c20130e`
   `KIRCH-FORGE-CAL1-RESPONSIVE-ACCESSIBILITY-POLISH`

Frozen behavior includes:
- Today / previous / next period navigation;
- Month / Week / Day / Schedule views;
- month grid;
- 24-hour week/day time-grid;
- all-day lane;
- event overlap positioning;
- current-time indicator;
- schedule/agenda view;
- sidebar and mini calendar;
- Municipality / My Office / My Events visibility buckets;
- bounded server-side date windows;
- event popovers;
- responsive/mobile treatment;
- CAL1 feature coverage in `tests/Feature/CalendarWorkspaceTest.php`.

## Freeze rule

Do not reopen CAL1 for visual redesign, density tuning, new views, new interaction concepts, drag/drop, event authoring, recurrence, external-calendar integration, or unrelated feature expansion during BH1.

Calendar source may change during BH1 only when:
1. an observed performance defect is proven to originate in the calendar request/runtime path; and
2. the repair preserves the frozen UI/behavior contract.

Any such change must be called out explicitly in BH1 evidence.

## Next authority

Backend/runtime hardening starts from the exact CAL1 candidate:

`9dba054d34377ce76149d8474ddeb66b5c20130e`

Target branch:

`KIRCH-TALIBON-BH1-BACKEND-RUNTIME-HARDENING`
