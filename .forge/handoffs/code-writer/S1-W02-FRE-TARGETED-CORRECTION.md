# KIRION FORGE — ONE TALIBON V1

## S1-W02 — FRE / GUIDED TOUR TARGETED CORRECTION

### CODE WRITER HANDOFF

ROLE CALL:

**KIRION FORGE: CODE WRITER**

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Technical Authority:

**Kirch Ivan Balite**

Forge authority:

`Kirch-Nairu/KIRION-FORGE@44eb57e5b45b343be0033bf22a7a5e74d543c01a`

Immutable base:

`main@fb510417a4aeba56ac7278e43f33228754e6c352`

Writer branch:

`KIRCH-TALIBON-S1-W02-FRE-TARGETED-CORRECTION`

Current implementation authority:

`.forge/directives/S1-CORRECTED-SHOWCASE-IMPLEMENTATION-PLAN-2026-09-29.md`

## Mission

Fix only the First Run Experience / Guided Tour defects already observed.

Do not redesign onboarding.

Do not touch Dashboard.

Do not touch Future Integrations / HR presentation.

## Confirmed defects

1. stale / engineering-facing stakeholder copy;
2. Project Monitoring tour target is hidden inside collapsed Planning and required browser resizing/minimizing;
3. current Project Monitoring body says:
   `without implying municipality-wide authority`
   which is technically defensive rather than stakeholder-facing;
4. current Messages body says:
   `current prototype messaging workspace`;
5. Switch Workspace ending must target the W01 persistent control cleanly;
6. hidden secondary targets must be revealed before spotlight positioning.

## Repo-backed source

Primary:

- `resources/js/components/onboarding/tourCatalog.ts`
- `resources/js/components/onboarding/GuidedTour.tsx`

Only if strictly required:

- bounded onboarding helper/type files under `resources/js/components/onboarding/**`

Do not modify shell product files unless a direct contradiction is proven first.

## Required behavior

### Copy cleanup

Preserve current persona tour order.

For Department Head:

1. Home / office context
2. Work Queue
3. Correspondence
4. Project Monitoring
5. Calendar
6. Messages
7. Switch Workspace

Rewrite only stale/problematic copy into plain municipal operational language.

Examples of required direction:

- Project Monitoring:
  `Review project status, progress, milestones, and implementation information available to this workspace.`

- Messages:
  `Coordinate with available municipal channels for day-to-day internal communication.`

- Switch Workspace:
  clear wording that lets the presenter switch role/office context.

Do not add marketing filler.

### Hidden target reveal

Current `GuidedTour.tsx` only resolves targets with `offsetParent !== null`.

When the current target exists inside a collapsed secondary sidebar section:

1. detect the hidden target by `data-tour`;
2. find the owning collapsed secondary section;
3. activate the existing group toggle;
4. allow layout to settle;
5. scroll target into view if needed;
6. then place the spotlight.

Do not resize the browser.

Do not hard-code Project Monitoring-only behavior if a small generic hidden-target reveal solves the issue for future secondary targets too.

Do not create a global state store.

### W01 compatibility

Preserve:

- controlled accordion behavior;
- active-group behavior;
- persistent `Switch Workspace`;
- current server-derived navigation visibility.

## Forbidden

No:

- Dashboard changes;
- Municipal Systems changes;
- employee page changes;
- backend/PHP;
- routes;
- schema/migrations;
- permissions;
- dependency/lockfile changes;
- CI changes.

## Validation

Time-boxed.

Do not run full Feature.

Do not run broad browser suites.

Writer may run:

- `npm run types:check` if fast;
- `npm run build` if fast.

Maximum validation effort: **5 minutes**.

Maintainer will do a short manual tour check.

## Return

Return only:

1. role;
2. branch;
3. immutable base;
4. final HEAD;
5. exact changed paths;
6. copy changes;
7. hidden-target reveal behavior;
8. W01 compatibility statement;
9. typecheck/build result or NOT RUN;
10. limitations;
11. explicit no backend/route/schema/auth/dependency/merge/promotion/deployment statement.

Do not self-accept.
Do not self-promote.
