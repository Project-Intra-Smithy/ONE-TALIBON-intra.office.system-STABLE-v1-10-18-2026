# FE-RC-DRAFT-01 — local integration evidence

**FRONTEND DRAFT — PENDING BACKEND WIRING, AUTHENTICATED TESTING & RELEASE APPROVAL**

2026-10-15. AJ contributions preserved; Codex-assisted local assembly. Kirch retains acceptance. [Owning issue #33](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/33) remains open.

## Run and inspect

Live URL: http://127.0.0.1:4185/visual-preview.html?screen=dashboard

```powershell
Set-Location 'C:\Users\admin\Documents\ONE-TALIBON-RC-DRAFT'
npm run preview:draft
```

The server is already running on loopback. Reuse it; the startup command intentionally fails if port 4185 is occupied. For a fresh checkout, run `npm ci --no-audit --no-fund` first. Server PID/logs are in `artifacts/rc-draft/`.

The toolbar exposes Dashboard, My Work, Correspondence, Records, Memoranda, Calendar, Employees, Offices, Login and MFA. Existing sidebar links navigate to corresponding synthetic index screens. Dashboard supports four synthetic role presentations. Reload, browser back, mobile drawer, appearance controls, dashboard sections, password visibility and MFA input controls retain their behavior. Existing canonical hrefs and production permissions are unchanged.

## Source and preservation

- Integration branch: `local/fe-rc-draft-20261015`, separate worktree above. Application commit: `a122a6f7777c885e5c463567ca76c3735f01f806` (LOCAL ONLY).
- Live frontend main at verification: `6c385ee85f3fec4325182791554b66a861cfd9f3`.
- Phase 1: `b4ffa2ce6571026c5afab62af8b7b5ac101595c6` plus original working tree.
- Phase 2: `23278cc52bc05265b2dc75e424edd459a09f3288` plus original working tree, including compact-dashboard continuation. Phase 2 retains Phase 1 MobileNavigation, PortalTools and AppLayout byte-for-byte; sidebar adds appearance disclosure; shell CSS adds the later refinements.
- Auth: `9508f0322535d05d76fb0cce5d3af2b6a7070468` plus latest Login/MFA CSS/components, photo, tests and lockfile name correction.
- Backend reference: `ef02919b3ded8d16431c40540388efd7cbb4e403`. No assembled runtime tuple.
- PR #29/#31 heads match source SHAs above, bases match verified main. PR #28 head matches Auth source; base `e6f5947ab330802f4b860b28baddc910ca32e13e`. Historical #6/#7 are merged. No new application PR or publication.

[Original copied-file SHA256 inventory](source-inventory.json) records all 40 selected source files before integration edits. All hashes were rechecked against original worktrees: unchanged. No original branch or uncommitted source was modified. Integration began from current main; only the reviewed frontend delta was copied, avoiding stale branch overlays. Original workspaces retain all their documentation, evidence and unfinished files.

## Integration-only fixes

- Development entry translates supported index links into fixture navigation while leaving canonical component routes intact. Preserves selected role; cancels backend forms and Inertia visits with an explicit unavailable status.
- Fixture history keeps the isolated HTML URL, removes duplicate initial history entries, and supports browser back/reload.
- Separate Login transport-test fixture preserves real payload/error/loading regression coverage without weakening live preview isolation. Test suite ports/caches do not collide with existing previews.
- Vite ignores generated evidence for HMR; writing test logs no longer reloads mounted tests.
- Added `preview:draft` command and repeatable 50-mount integration verification script. No Laravel files or new UI designs.

## Verification

| Check | Result / local evidence |
| --- | --- |
| `npm ci --no-audit --no-fund` | PASS, 95 packages |
| `npm run types:check` | PASS; `artifacts/rc-draft/types.txt` |
| `npm test` | PASS, 76/76, 0 failed/skipped; `artifacts/rc-draft/tests.txt` |
| `npm run build` | PASS; `artifacts/rc-draft/build.txt` |
| `node scripts/verify-dashboard-build.mjs` | PASS; manifest/assets exclude fixture data, entries, isolation and middleware |
| `node scripts/verify-rc-preview.mjs` | PASS; `artifacts/rc-draft/preview-checks.txt`, `responsive.json`, 50 screenshots |
| Responsive coverage | All ten screens at 320/390/768/1024/1440; no horizontal page overflow; representative desktop/mobile screenshots visually inspected |
| Navigation/isolation | Toolbar and desktop/mobile shell, back/reload, Login/MFA blocked submissions; zero protected/external requests, HTTP failures or page errors |
| Existing regressions | Four dashboard roles; shell permissions/focus/drawer; Tasks security states; Login exact synthetic transport, errors/loading/keyboard; contract helpers |
| Git checks | Whitespace PASS; final binary patch reverse-applicability verified during handoff |

Earlier runs exposed an obsolete blocked-navigation assertion, duplicate history entry and HMR interference; these were corrected, with final suite and live preview checks passing. The screenshot test initially blocked the local `/public/images/` photo URL; its asset allowlist was corrected. Original first-run logs are retained under `artifacts/rc-draft/`.

## Missing dependencies and held functionality

This is a synthetic frontend draft, not an authenticated system. Server-side search/filtering/pagination, detail loading, creation/routing/acknowledgment/downloads, live notifications, Login/MFA verification/recovery/logout and persistence require an approved canonical Laravel environment. Those requests are blocked with a visible explanation; no simulated successful backend operation is supplied. Individual Tasks show an empty synthetic response; parked F02 create/lifecycle work is not imported. Unsupported privileged modules, messaging membership, machine APIs and personnel/HR operations remain excluded. Employees/Offices are synthetic directories only. Calendar view/date requests require backend data. Google sign-in and account activation remain unavailable.

NOT RUN: authenticated Laravel/session/CSRF/MFA/real-role acceptance, hosted CI for local application revision, Firefox/WebKit, native browser zoom and screen-reader audit. Existing synthetic tests do not grant backend compatibility or release approval.

Next owner: Kirch with AJ/backend QA. Single NEXT: review this local draft and authorize an exact disposable backend/frontend tuple for authenticated testing. Cross-browser/accessibility follow-up belongs to QA when that tuple is available. No issues closed, no main merge, no application code pushed. Documentation-only START/CLOSE publication is separate; canonical-main memory synchronization remains HOLD under the user's no-main-merge instruction.

## Patch and changed-file inventory

Local patch: `artifacts/rc-draft/frontend-rc-draft.patch`, binary-capable diff from verified main through final local integration HEAD, including the municipal photograph and documentation. It is already applied in this worktree; do not apply it again. Final SHA, patch SHA256 and reverse-apply result are recorded in `artifacts/rc-draft/handoff.json`.

Application/verification files changed by the local integration commit:
- `package-lock.json`
- `package.json`
- `public/images/talibon/municipality-of-talibon.jpg`
- `resources/css/phase-one-shell.css`
- `resources/css/visual-system.css`
- `resources/js/components/dashboard/ActivityRail.tsx`
- `resources/js/components/dashboard/CorrespondenceOverview.tsx`
- `resources/js/components/dashboard/DashboardHeader.tsx`
- `resources/js/components/dashboard/DashboardSection.tsx`
- `resources/js/components/dashboard/ExecutiveOverview.tsx`
- `resources/js/components/dashboard/MetricGroup.tsx`
- `resources/js/components/dashboard/OfficeOverview.tsx`
- `resources/js/components/dashboard/QuickActions.tsx`
- `resources/js/components/dashboard/RecentWorkList.tsx`
- `resources/js/components/dashboard/SystemOverview.tsx`
- `resources/js/components/dashboard/dashboard.css`
- `resources/js/components/dashboard/preview-fixtures.ts`
- `resources/js/components/dashboard/preview-isolation.ts`
- `resources/js/components/dashboard/preview.css`
- `resources/js/components/shell/MobileNavigation.tsx`
- `resources/js/components/shell/PortalSidebar.tsx`
- `resources/js/components/shell/PortalTools.tsx`
- `resources/js/components/shell/__tests__/shell-fixture.tsx`
- `resources/js/layouts/AppLayout.tsx`
- `resources/js/pages/Auth/Login.tsx`
- `resources/js/pages/Auth/MfaChallenge.tsx`
- `resources/js/pages/Auth/login.css`
- `resources/js/pages/Auth/mfa-challenge.css`
- `resources/js/pages/Dashboard.tsx`
- `resources/js/visual-fixtures.ts`
- `resources/js/visual-preview.tsx`
- `scripts/verify-dashboard-build.mjs`
- `scripts/verify-rc-preview.mjs`
- `tests/dashboard-mounted-ui.test.mjs`
- `tests/fixtures/auth.html`
- `tests/fixtures/auth.tsx`
- `tests/fixtures/dashboard-preview-plugin.ts`
- `tests/fixtures/shell.html`
- `tests/login-mounted-ui.test.mjs`
- `tests/shell-mounted-ui.test.mjs`
- `tests/task-mounted-ui.test.mjs`
- `tsconfig.json`
- `visual-preview.html`
- `vite.config.ts`

Documentation additionally changes docs/WORK_PACKAGE_CONTINUITY.md and adds this README plus source-inventory.json. Generated logs/screenshots/patch remain local under artifacts/rc-draft/.
