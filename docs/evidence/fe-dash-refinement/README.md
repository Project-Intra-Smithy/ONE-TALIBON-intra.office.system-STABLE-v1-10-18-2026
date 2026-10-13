# FE-DASH-01 refinement and runtime verification

AJ, Codex-assisted, 2026-10-14. Application changes remain local. [START](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/22#issuecomment-6149847264), memory `42e7147d26365e769eb8f57152e001463f02095d`; [runtime checkpoint](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/22#issuecomment-6154613047), memory `1d2d91ebcd386d55ae9dc5927c12e264bca1d58f`.

## Runtime diagnosis

Correct preview: http://127.0.0.1:4179/visual-preview.html?screen=dashboard . From `C:/Users/admin/Documents/ONE-TALIBON-PHASE-2`, use `npm run dev -- --host 127.0.0.1 --port 4179 --strictPort` when that port is free.

At verification PID 29504 serves Phase 2 on 127.0.0.1:4179. PID 23000 serves the original FRONTEND-TEAM checkout on 0.0.0.0:5173; its command also contains an extra positional `0.0.0.0`. That server returned HTTP 404 for the preview HTML and was left unchanged. The user confirmed the reported error occurred on 4179, so the other server does not establish its cause.

Reproduced defect: Inertia changed the address to `/dashboard`; refreshing returned the Vite/Laravel fallback with HTTP 404. Development-only isolation now preserves the HTML URL and query while retaining Inertia page state for active navigation. Reload preserves the selected role. Failed isolation handshakes display an alert instead of an unexplained blank page; protected requests remain blocked.

The reported `(index):1911 ... isFeatureEnabled` error was NOT reproduced in clean system Chrome. App sources, installed dependencies (excluding source maps), production assets and loaded response bodies contain no match. The served HTML is 22 lines; 96 script responses across mount/reload contain no match. No JavaScript runtime errors were observed. This is evidence against the currently served app being the source, but does not identify an injected script, extension or browser integration. Attribution remains unconfirmed without the failing browser's script contents. [Original readback](runtime-before.json), [successful mount/reload and script inventory](runtime-verification.json).

## Delivered refinement

White sidebar/cards, neutral canvas, green actions and pale selected states; desktop collapse and independent mobile navigation scrolling; appearance settings disclosure. Compact aggregate bars/quick actions, section buttons that move focus, optional routed-correspondence details. Four role experiences, server URLs/permissions, DashboardProps, Task consumer and attribution retained. No Login, MFA or backend changes.

Bars show supplied counts and accessible labels, not invented trends or percentages. Supported metric tiles/bars activate the supplied links. Unstaged administrative metrics remain plain summaries. Historical series and missing totals are unavailable. Admin/audit, mayor-office and report destinations retain existing staged-route and authority gates; no new filter URLs or backend capability were invented.

## Verification

| Command | Final result |
| --- | --- |
| `npm run types:check` | [PASS](types.txt) |
| `npm test` | [68 tests, 68 passed, 0 failed, 0 skipped](tests.txt) |
| `npm run build` | [PASS](build.txt) |
| `node scripts/verify-dashboard-build.mjs` | [PASS](build-exclusion.txt) |
| Git whitespace and local patch reverse-applicability checks | PASS |

Coverage: all four roles at 320/390/768/1024/1440; labels/destinations; pointer and Enter activation; every jump's focus target; empty/nullable/absent/long fixtures; collapse, drawer/focus trap, settings/dark mode; table keyboard scrolling; no overflow; CSS 200% zoom; preview isolation and production exclusion. Actual Calendar component checked at all five widths. Representative screenshots visually inspected.

Earlier failures are retained locally: Calendar test expected the wrong H1; hidden details counted as visible short controls; repeated metric labels lacked group scoping; notification interception raced initial mount. Corrections preserve assertions and install the expired response before mount. Parallel Vite suites now use separate dependency caches. A transient scroll protocol failure was addressed using native instant scrolling before pointer activation.

## Screenshots

Before: [desktop](before-1440.png), [mobile](before-390.png), retained from original Phase 2 evidence.

| Experience | 320 | 390 | 768 | 1024 | 1440 |
| --- | --- | --- | --- | --- | --- |
| Employee | [320](employee-320.png) | [390](employee-390.png) | [768](employee-768.png) | [1024](employee-1024.png) | [1440](employee-1440.png) |
| Department Head | [320](department_head-320.png) | [390](department_head-390.png) | [768](department_head-768.png) | [1024](department_head-1024.png) | [1440](department_head-1440.png) |
| Executive Oversight | [320](executive_oversight-320.png) | [390](executive_oversight-390.png) | [768](executive_oversight-768.png) | [1024](executive_oversight-1024.png) | [1440](executive_oversight-1440.png) |
| System Administration | [320](system_administration-320.png) | [390](system_administration-390.png) | [768](system_administration-768.png) | [1024](system_administration-1024.png) | [1440](system_administration-1440.png) |
| Calendar | [320](calendar-320.png) | [390](calendar-390.png) | [768](calendar-768.png) | [1024](calendar-1024.png) | [1440](calendar-1440.png) |

[Mobile drawer](drawer-390.png), [dark dashboard](refinement-dark-390.png), [live Phase 2 after reload](verified-live-preview.png).

## Source and remaining gates

Exact provisional source tree: `a4883e1c9ba132bbca57132113e697425b93bb9d` (a local Git tree, not a published application commit). Prior Phase 2 tree: `e11167f71ef609774ffff4f125fd83d82f71a1ff`. [Exact 13-file refinement inventory](source-manifest.json). Local, already-applied delta: `artifacts/fe-dash-refinement/refinement.patch`, SHA256 `3f3ae774b1e8769902c02511198649e69770d0b6d41a9ede2085034232a8e034`. Do not apply it again. No application source was committed or pushed.

Frontend main `6c385ee85f3fec4325182791554b66a861cfd9f3`; PR29 docs-only `b4ffa2ce6571026c5afab62af8b7b5ac101595c6` / base main; PR24 `1257c6cceb316da5200e99c612eb0c361e5e1ff0` / base `e6f5947ab330802f4b860b28baddc910ca32e13e`. Prior C04 producer `c1ba7d4795a61647116577641203e43821e985ed`; latest backend main readback `408ffcb78ec57fd5df5916fcb4b10dad66efdf8c`. No assembled backend or contract-equivalence claim for the newer SHA; no authenticated runtime tuple.

NOT RUN: authenticated Laravel/session/CSRF/MFA/real-role acceptance, hosted CI of unpublished code, native browser zoom, screen-reader audit, Firefox/WebKit. Kirch/backend QA owns runtime follow-up after an approved tuple; QA owns assistive/cross-browser checks. Browser-specific isFeatureEnabled provenance remains unconfirmed; reopen with offending script contents if it recurs.

NEXT: Kirch reviews evidence and resolves Phase 1 ownership/design/FE-BASE-01 publication holds before AJ publishes application code. No merge/issue closure. Stop after dashboard verification; no Login/MFA follow-on.
