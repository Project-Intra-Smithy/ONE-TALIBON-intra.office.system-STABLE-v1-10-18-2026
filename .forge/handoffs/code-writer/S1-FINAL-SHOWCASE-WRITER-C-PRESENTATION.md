# KIRION FORGE: CODE WRITER — S1 FINAL SHOWCASE WRITER C
## PUBLIC HOMEPAGE / LIGHT-ONLY / LGU WORDING

ROLE: KIRION FORGE: CODE WRITER

LANE: C — PUBLIC PRESENTATION / APPEARANCE / PRODUCT LANGUAGE

Human Technical Authority: Kirch Ivan Balite

## SOURCE

Start only from the exact SHA supplied by the sprint Maintainer after Gate G0.

Required base branch family:

`KIRCH-TALIBON-S1-FINAL-SHOWCASE-INTEGRATED`

Create one lane branch only:

`KIRCH-TALIBON-S1-FINAL-SHOWCASE-PRESENTATION`

No merge to `main`. No promotion. No deployment. No rebase/reset/force-push.

## DONORS

Public-homepage design donor:

`AJ-TALIBON-PUBLIC-HOMEPAGE-GREEN-REFINEMENT@f89996823cb7e6bb5f188897586682a0dd141b52`

Light-only intent donor:

`EliminateDarkMode@4539302043b035e51fa068da2adb3963f191314f`

Both are donors only.

DO NOT merge either branch wholesale.

## GOAL

Deliver a polished, credible public entry and light-only showcase presentation without destabilizing authenticated workspace architecture.

Use the strong AJ/Kikiam public-homepage composition while preserving current product truth, current secure access, and current S1 authenticated app.

## REQUIRED AUDIT FIRST

Before mutation:

1. inspect current public homepage implementation on the sprint base;
2. compare the exact donor homepage components/CSS/config/assets against the sprint base;
3. list donor claims that are unsupported or stale;
4. inspect current appearance architecture:
   - `resources/js/theme/appearance.ts`
   - `resources/js/theme/useAppearance.ts`
   - `AppearanceControl.tsx`
   - Login appearance behavior
   - public header appearance behavior
   - sidebar appearance behavior
   - `resources/views/app.blade.php`
5. inspect `EliminateDarkMode` only to identify the minimum intent needed;
6. identify exact files that can be transplanted without touching Writer B's persona selector or operational product files.

Do not begin broad deletion until this audit is complete.

## PART 1 — PUBLIC HOMEPAGE SELECTIVE TRANSPLANT

Use the donor's strongest public-homepage composition and local municipal assets selectively.

Expected donor concepts may include:

- public municipal hero;
- civic dashboard/operations preview;
- action strip;
- public side rail;
- institutional panel;
- latest memoranda/events/calendar previews where already supported;
- secure Employee Login call-to-action;
- municipal footer.

### Product truth law

The public homepage may preview employee convenience and municipal coordination, but it must not claim unimplemented live capabilities.

Specifically remove/rewrite unsupported claims such as broad:

- full HRIS;
- live leave workflow;
- attendance/DTR as public-homepage proof;
- payroll as a delivered public-facing capability;
- other live-service claims unsupported by the current portal.

HR remains personnel-reference only unless current accepted application behavior proves more.

Future systems may be described as planned/future integrations, not live modules.

### Public/internal boundary

Do not expose authenticated employee data, internal counts, private records, private messages, private attachments, or actual workflow details on `/`.

Public previews must come from the existing safe public content/config contract or static presentation-safe data.

### Secure access

Employee Login must remain obvious and functional.

Do not break the login route or Showcase session entry.

## PART 2 — LIGHT-ONLY SHOWCASE

Implement the smallest reliable light-only policy.

Required behavior:

- root does not activate `.dark` for showcase use;
- appearance resolves to light;
- appearance controls are removed/hidden where applicable;
- public and authenticated showcase surfaces render light consistently;
- no system-theme flip during load;
- no flash into dark mode from localStorage/system preference.

Preferred approach:

- simplify appearance resolver to a light result for the current showcase product path;
- remove/hide user-facing appearance controls;
- leave dormant `dark:` utility classes in components rather than rewriting hundreds of files;
- remove obsolete theme initialization only where necessary to prevent root dark activation.

Do NOT reproduce the broad `EliminateDarkMode` branch's component-by-component churn unless source inspection proves a specific file must change.

## PART 3 — LGU / PRODUCT WORDING

Primary identity is fixed:

- `ONE TALIBON`
- `Talibon Intra-Office Portal`
- `Municipality of Talibon, Bohol`

Use LGU/municipal language contextually, for example:

- municipal operations;
- LGU personnel;
- municipal offices;
- inter-office coordination;
- Local Government Unit of Talibon where a formal descriptor is useful.

Do not rename the product to `LGU Intra-Office Portal` or create a competing brand.

Normalize obsolete presentation language such as `Municipal Digital Workspace Prototype` where it conflicts with the established current product identity. Prototype/evaluation notices remain allowed when accurately describing showcase status.

## PART 4 — SHOWCASE EXPERIENCE

The public entry should make this clear at first glance:

- this is an intra-office municipal portal;
- it centralizes official work, correspondence/records, schedules, projects, memoranda and municipal system access;
- employees have secure access;
- future integrations are modular/planned where not yet live.

Keep it direct. No marketing essay.

## OWNED FILES

Expected ownership may include:

- `resources/js/pages/Public/Home.tsx`
- `resources/js/components/public/*`
- `resources/css/public-homepage-lane5.css`
- `resources/css/public-portal.css`
- `config/public_portal.php`
- public-safe donor assets
- `resources/js/theme/appearance.ts`
- `resources/js/theme/useAppearance.ts` if still present
- `resources/js/components/AppearanceControl.tsx` if removal is needed
- `resources/js/components/shell/SidebarAppearanceMenu.tsx` if removal is needed
- `resources/js/components/shell/SidebarFooter.tsx` only for appearance control removal
- `resources/js/components/public/PublicHeader.tsx`
- `resources/js/pages/Auth/Login.tsx` only for appearance/product wording
- `resources/views/app.blade.php` only for theme initialization cleanup
- branding copy/components strictly needed by this lane
- focused visual/source tests

## FROZEN

DO NOT TOUCH:

- `scripts/showcase-*`
- transaction/work-request PHP/React
- Memoranda PHP/React
- `config/showcase.php`
- `WorkforceDemoSeeder.php`
- `WorkspaceDialog.tsx`
- Municipal Systems hub/FUT architecture
- GuidedTour target logic
- broad backend/domain code
- `main`

If a conflict with Writer B's files appears, STOP and report exact path to Maintainer.

## VALIDATION

Source/build:

- `npm run types:check`
- clean `npm run build`

Browser/manual at minimum:

- `/` public homepage desktop
- `/login`
- authenticated `/dashboard`
- authenticated sidebar/footer
- refresh with system OS dark mode enabled: portal remains light
- refresh with prior dark localStorage preference: portal remains light
- Employee Login CTA still works
- no private authenticated data visible on `/`
- public copy does not claim unsupported live HRIS/leave/attendance functions
- product naming correct

Responsive smoke only, not a repo-wide mobile lane:

- 390px public homepage/login should remain usable and free of catastrophic overflow.

## ACCEPTANCE

Reject/repair if:

- donor overwrites authenticated dashboard architecture;
- stale HRIS/live-module claims remain;
- private data leaks to public page;
- login/showcase selector breaks;
- dark mode can still activate in showcase flow;
- broad component churn is imported from `EliminateDarkMode` without need;
- typecheck/build fails.

## RETURN

Return exactly:

BRANCH
STARTING SHA
FINAL SHA
COMMITS
EXACT CHANGED FILES

DONOR AUDIT
SELECTIVE TRANSPLANT RESULT
PUBLIC/PRIVATE BOUNDARY RESULT
EMPLOYEE LOGIN RESULT
LIGHT-ONLY RESULT
SYSTEM DARK PREFERENCE TEST
STORED DARK PREFERENCE TEST
LGU WORDING RESULT
PRODUCT NAMING RESULT
390PX SMOKE
TYPECHECK
BUILD
KNOWN LIMITATIONS

NO MAIN MUTATION
NO MERGE
NO PROMOTION
NO DEPLOYMENT

STOP.