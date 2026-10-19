# AJ-HOME-AUTH-01 validation and handoff

Owner AJ, Codex-assisted. Kirch retains review/integration. [Issue #98](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/issues/98).

Base: `8a130e151fdf79e87e134a5d26e58667889f0a7e` (origin/main reverified before publication).
Application/test candidate: `54b0cafe62243e6505ffbc1ca22ef263c08e1ce0` on `feat/aj-homepage-auth-refinement`.
Same canonical checkout supplies backend reference and built frontend; no authenticated runtime assembly tested.

## Scope and source

Existing GET / -> PublicPortalController -> Public/Home preserved. Scoped white/forest-green presentation, readable typography, responsive footer/navigation, missing public base stylesheet restored; decorative hero photograph removed. Existing props, public content and links retained.

AJ Login/MFA selectively copied from frontend `8be1c5eff06072740dd731c8a4ba34850773ccf8` plus uncommitted candidates below. No whole-branch merge. Fixed local Windows image path, supplied existing municipal photo, used opaque white Login surface with readable text and kept disabled Google control. Existing useForm/payload/routes retained; MFA error associations and pending guards added. Dashboard, shell, PHP routes/controllers/config unchanged (verified by exact-base diff). Original dirty checkout and PR34/PR92 untouched.

Source SHA256 (uncommitted AJ candidates before this port):

| Source | SHA256 |
| --- | --- |
| Auth/Login.tsx | 50c1aa4b07f08cf731ae96f082b07cad4b9de8e9605713d8350da5828163ce85 |
| Auth/MfaChallenge.tsx | 029d178fd567021ce64076366984ad7f86efef095035cbe43f32f395e636a73e |
| Auth/login.css | 7b9c800effdbea44232c84ae38c15627e777ec5faec9f0d91d3051b9ecb15d9d |
| Auth/mfa-challenge.css | 31e704a7e6f46d77b08bb17b6a5de1519b1560df3575289efba4e0804d678855 |
| municipality-of-talibon.jpg | bda46d5acbe46ec7c991ea7bdf7285f5f660665fbc69102c7368cde8424b4444 |

## Executed checks

- npm ci --no-audit --no-fund: PASS (95 packages).
- npm run types:check: PASS.
- npm run build: PASS.
- npm test: PASS, 9 tests, 0 failures/skips. Real compiled app.tsx/Inertia with synthetic local HTTP responses, not Laravel authentication.
- git diff --check and staged whitespace check: PASS.
- Homepage, Login, MFA and Dashboard at 320, 390, 768, 1024, 1440: mounted without runtime errors or horizontal overflow. Screenshots generated for all 20 combinations.
- Public content/anchors, Login navigation, mobile Escape/focus, skip link, authenticated homepage Dashboard destination, desktop menu visibility, required Login fields/password toggle/remember/exact payload/pending/server errors, MFA initial focus/challenge/recovery/pending/errors/logout checked.
- Short 320x360 auth viewport and homepage white surface under dark class checked. Screenshot review included desktop/mobile homepage, Login and MFA; corrected Login contrast and menu visibility findings.

Reproduce: npm ci, npm run types:check, npm run build, npm test. Requires Chrome or Playwright Chromium and PHP CLI (only to read checked-in public config). On Windows with a PHP .bat shim, set PHP_BINARY to the actual php.exe before npm test. No database, credentials, .env or Laravel server required.

Local screenshots/logs: ignored storage/app/qa/aj-home-auth/ (build.log, test.log). Not committed as generated artifacts. New npm test script runs this focused suite; it does not run existing backend/runtime suites.

## Limitations and next owner

Real authenticated Laravel E2E: NOT RUN. Session/CSRF/redirect/MFA backend acceptance, PHPUnit (vendor absent), hosted CI, independent QA, other browser engines, screen reader and full contrast audit: NOT RUN.

Existing about-description encoding artifact is supplied by config; no server content edit in this UI package. Kirch/backend owns correction when public copy changes are authorized. Existing project capability filtering is preserved.

[START crosslink](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/issues/98#issuecomment-6259867015); [CLOSE proposal](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/issues/98#issuecomment-6259946780).
Canonical-main memory synchronization and technical acceptance remain HOLD until Kirch review. No merge/deployment or issue closure.

NEXT: Kirch reviews the focused PR and selects an approved runtime tuple for authenticated QA.
