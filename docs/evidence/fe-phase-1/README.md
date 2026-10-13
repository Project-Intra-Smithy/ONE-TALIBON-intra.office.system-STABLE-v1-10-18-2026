# FE-SHELL-01 / FE-UI-01 local patch evidence ? 2026-10-13

**Provisional local patch, not released implementation or accepted frontend.** AJ, Codex-assisted. [PR #29](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/pull/29) contains only documentation and synthetic screenshots. Kirch ownership/design/FE-BASE-01 gates remain. [Continuity record](../../WORK_PACKAGE_CONTINUITY.md).

## Exact source

- Frontend main/base: `6c385ee85f3fec4325182791554b66a861cfd9f3`.
- Tested documentation head: `f45f9528fbd109d9ff6ef402be4375a48d6938bb` plus unpublished local patch.
- Patch SHA256: `1ce9c6a9f829e6d024d053b36fa7097da162fb5b72e875684923cb3190015f5c`.
- Backend reference: `b757147f4ae553af5110fe97792a981c2d6acdf0`; **no runtime tuple assembled**.
- Local worktree: `C:/Users/admin/Documents/ONE-TALIBON-PHASE-1`, branch `feat/aj-phase-1-foundation`.
- Patch: `artifacts/phase-one-shell/phase-one-foundation.patch` in that worktree, deliberately unpublished. Source remains applied locally; do not apply it a second time. On a clean authorized checkout at the tested head, `git apply --check <patch>` verifies applicability before application. A separate temporary Git index verified applicability against the tested head; reverse check verified the local tree matches.

## Actual local source/test changes

| File | Result |
| --- | --- |
| `resources/js/layouts/AppLayout.tsx` | Simple header, readable title/context, search on all widths, accessible drawer trigger, announced flash states, simpler single navigation entry point |
| `resources/js/components/shell/PortalSidebar.tsx` | Deep green navigation, 16px labels that wrap, active state, 44px controls, text branding without placeholder artwork |
| `resources/js/components/shell/MobileNavigation.tsx` | Separate Close row, native modal, explicit Tab wrapping, Escape/return, body scroll lock, desktop resize focus |
| `resources/js/components/shell/PortalTools.tsx` | Visible Search submit button and mobile search, identity styling hooks |
| `resources/css/phase-one-shell.css` | AppLayout-scoped palette/control/spacing tokens, white surfaces, 10px panels, no panel shadows, dark preference retained |
| `resources/js/components/shell/__tests__/shell-fixture.tsx` | Synthetic actual-AppLayout fixture with vertically stacked primary sections; no Dashboard implementation |
| `tests/fixtures/shell.html` | Test-only Vite entry, excluded from production inputs |
| `tests/shell-mounted-ui.test.mjs` | Ten mounted shell regressions and screenshot capture |

Existing backend navigation builder, routes, SharedProps, polling implementation and `router.post('/logout')` remain intact. The duplicate applications launcher is no longer rendered in the header; the same permitted destinations remain in sidebar/drawer. Authentication, Dashboard and F01/F02 source is unchanged. No assets fetched/generated; official branding can replace the existing sidebar brand slot later. Original unfinished login checkout remains untouched.

## Executed verification

Node 22.16.0, npm 10.9.2, Playwright 1.55.0 using system Chrome on Windows (pinned browser absent).

| Check | Result |
| --- | --- |
| `npm ci --no-audit --no-fund` | PASS |
| `npm run types:check` | PASS |
| `npm test` | PASS, 37/37; includes 10 mounted shell cases and existing regressions |
| `npm run build` | PASS, Vite 8.3.0, 2186 transformed modules |
| `git diff --check` | PASS |
| Isolated-index patch apply check / working-tree reverse check | PASS |
| 320, 390, 768, 1024, 1440 CSS px | PASS, no horizontal page overflow; screenshots visually reviewed |
| Keyboard | PASS: skip link, Enter opens drawer, initial Close focus, forward/backward wrapping, Escape/trigger return, desktop-resize focus |
| Navigation | PASS: current route, collapsed accessible name, denied flags, route visit closes drawer/updates active state |
| Transport | PASS: search GET; mobile/desktop logout POST, Inertia and synthetic XSRF headers |
| Notifications | PASS: existing polling runs, 419 state, Escape/focus return |
| Extra presentation | PASS: 390x480 drawer/logout reachability, CSS 200% zoom reflow, dark preference |

All browser data/HTTP are synthetic. No known defects observed in these checks. Initial tests exposed backward Tab escape; explicit focus wrapping fixed it before the final full pass. An initial test response was corrected to return a valid Inertia page; no production transport was changed.

## Screenshots

| Width | Workspace | Drawer |
| --- | --- | --- |
| 320 | [Workspace](shell-320.png) | [Drawer](drawer-320.png) |
| 390 | [Workspace](shell-390.png) | [Drawer](drawer-390.png) |
| 768 | [Workspace](shell-768.png) | [Drawer](drawer-768.png) |
| 1024 | [Workspace](shell-1024.png) | Desktop sidebar |
| 1440 | [Workspace](shell-1440.png) | Desktop sidebar |

[Short drawer](drawer-short-390.png), [CSS 200% zoom](zoom-200.png), [dark preference](dark-320.png), [expired notifications](notifications-320.png).

## Holds and NOT RUN

Authenticated Laravel session/CSRF/role/browser acceptance, real backend tuple, native browser 200% zoom, screen-reader audit, Firefox/WebKit, independent QA, and hosted CI of unpublished application code **NOT RUN**. Passing fixture tests/build is not production or integration approval. Existing page interiors, including Dashboard, are not redesigned by this shell package.

Kirch owns ownership acknowledgment, design reconciliation and FE-BASE-01 disposition. Runtime testing reopens when Kirch/backend QA supplies an authorized tuple/environment; assistive/cross-browser checks belong to QA after release. Official branding remains deferred until supplied. **Single NEXT: Kirch disposes those gates before AJ publishes the prepared code.** No issue or PR is merged/closed; no Phase 2 work.

## Preservation readback - 2026-10-13

Local/remote documentation head was `efcba15eb4b604658a555d7d6048534472aaeae5`; live main/base remains `6c385ee85f3fec4325182791554b66a861cfd9f3`. The eight-file applied patch is unchanged (391 insertions, 54 deletions); no source staged or published. SHA256 matches above. Reverse applicability and isolated-index applicability against HEAD PASS. Do not reapply the patch to this checkout.

TypeScript, production build (2186 modules) and whitespace check rerun PASS. The 37-test and five-viewport results above belong to the previous execution on the identical patch; tests/screenshots were not rerun for this handoff. All intervening committed changes are documentation/screenshots. Hosted application CI and real Laravel acceptance remain NOT RUN.

Backend live main is now `e530d238408eee7ff28d7f77656621903ed5e502`; original reference retained without claiming a new validated runtime tuple. PR24 remains OPEN/CHANGES_REQUESTED and all three publication gates remain. PR29 remains documentation/evidence only.

Dashboard #22 preparation is in the [continuity handoff](../../WORK_PACKAGE_CONTINUITY.md); implementation has not started. Production bundle excludes existing preview, but network isolation and complete role fixtures are prerequisites to reuse. No preview launched, authentication work, merge or issue closure.
