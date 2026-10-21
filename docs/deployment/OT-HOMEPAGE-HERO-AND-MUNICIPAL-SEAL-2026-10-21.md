# ONE TALIBON homepage hero and municipal seal update

Date: 2026-10-21 (Asia/Manila)

## Purpose

Persist the user-selected Talibon Municipal Hall photograph and Municipality of Talibon seal that were first validated in the isolated synthetic development deployment.

## Visual changes

1. `public/images/municipality/talibon-homepage-hero.jpg`
   - Replaces the earlier municipal-hall hero photograph.
   - The supplied photograph was aligned for the website hero: the municipal hall entrance and facade are centered, the roofline is level, and the primary flagpoles are vertical.
   - The public-page text, overlay, navigation, breakpoints and authorization behavior are unchanged.

2. `public/brand/municipal.logo.png`
   - Adds the user-supplied Municipality of Talibon seal.
   - Source SHA-256: `a7d1444008585c616d7176d112e054d7953c6a47b26931f84c306beba02589c0`.

3. `resources/js/branding/talibonAssets.ts`
   - Routes both shared municipal-seal keys to `/brand/municipal.logo.png`.
   - This covers the public header, public institutional panel, public footer, login/MFA municipal branding and authenticated sidebar branding.
   - Office Directory logos remain governed by `office-logo-map.ts` and were not changed.

4. Accessibility copy
   - Replaces placeholder wording with `Municipality of Talibon seal` where the image conveys content.
   - Decorative copies next to visible brand text retain empty alternative text to prevent duplicate screen-reader announcements.

## Deployment rehearsal and verification

The assets were first applied to the running synthetic developer environment without database changes. Chromium checks at 390x844 and 1440x900 confirmed:

- aligned hero rendering;
- all three public municipal-logo placements visible;
- normal application login and individual MFA;
- authenticated Department Head dashboard/sidebar branding;
- 28/28 bounded authenticated route and denial checks passing;
- zero recorded browser diagnostics or asset failures.

The test did not modify retained engineering-UAT data, synthetic database records, authorization policy, Messaging, Full HRIS, or office-specific logo mappings.

## Rollback

Deployment-host rollback copies remain outside Git under:

`C:\dev\TAL\private\one-talibon-aj-uat-20261021\hero-replacement-20261021`

and:

`C:\dev\TAL\private\one-talibon-aj-uat-20261021\municipal-logo-replacement-20261021`

Reverting the source commit restores the repository-level asset references. Private rollback files must not be committed or published.
