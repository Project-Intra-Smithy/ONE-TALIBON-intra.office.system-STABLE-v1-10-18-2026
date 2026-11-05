# AJ portal visual redesign R1 ? implementation and validation

Owner: AJ (`azinamouto`), Codex-assisted. Candidate delivery only; independent QA and Kirch acceptance remain pending.

- Branch: `feat/aj-portal-visual-redesign-r1`.
- Exact base: `5786359a964e2ff926fd611317f02d105c475ea9`.
- Existing canonical START: `691f74cfcea30705f4adc976e345f48eeacb879a`; [issue #19 START crosslink](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/issues/19#issuecomment-6432340818).
- Resumed existing work; no new branch or START was created on resume. Main advanced independently to `0d0c3653015a42f16ae74ddbb3d1948208077980` when checked; it was not imported or changed. PR #18's branch remains at the base SHA.

## Presentation delivered

The Dashboard uses a civic welcome banner with the existing municipal photograph, gold accent rule, forest-green section headers, mint shortcuts, readable work metadata, and responsive one/two/three-column composition. Lower sections use two spacious columns rather than cramped four-column tiles; empty panels fit their actual content. Dark mode preserves contrast.

Nineteen existing pages opt into a scoped presentation stylesheet: lists, Document Center, offices, directory profile, Search, Plans/PPAs, and existing work/correspondence/memorandum/travel forms and details. Page changes are limited to CSS imports and outer classes; a source comparison verified no page behavior changes. Document Center retains category navigation, Records/Files modes, search, filters, metadata preview and existing links. Its category rail accommodates long names. Search discovery tiles received an additional dark-mode contrast correction after visual review.

No new municipal content, routes, actions, statistics or workflow rules were added. Existing Plans/PPA reference disclosures remain. Dashboard event/document preview limitations are shown truthfully. Calendar source is unchanged and its month/week/day/schedule interactions were validated.

## Validation

| Check | Observed result | Evidence |
|---|---|---|
| TypeScript `npm run types:check` | PASS, exit 0 | `types-final.log` |
| Frontend contracts `npm run test:contracts` | PASS, 100/100 | `contracts-final.log` |
| UX `npm run test:ux` | PASS, 9/9 | `ux.log` |
| Production `npm run build` | PASS, exit 0 | `build-final.log` |
| Six browser suites | PASS, 80/80 cases, 290 renders | `browser-final.log` |
| Final Search contrast affected suite | PASS, 10/10 cases, 100 renders after CSS-only correction | `search-contrast-final.log` |
| Whitespace and protected-path audit | PASS | `source-manifest.json`, Git diff |

Browser matrix: 390/768/1024/1280/1440px, light/dark, reduced motion. Dashboard includes four role fixtures. Checks include viewport overflow, responsive composition, visible keyboard focus, Calendar event dialog Escape/focus return, Records/Travel filters and return links, Document Center modes/search/preview, searchable receiving-office keyboard selection and dependent assignment behavior, notifications, denied memorandum publishing controls, and form/detail rendering.

Commands used for the combined matrix (after a successful build):

```powershell
$env:REDESIGN_USE_EXISTING_BUILD='1'
node --experimental-strip-types --test --test-concurrency=2 tests/Browser/full-ui-refinement.test.mjs tests/Browser/full-ui-documents.test.mjs tests/Browser/full-ui-pages.test.mjs tests/Browser/full-ui-registries.test.mjs tests/Browser/full-ui-priorities.test.mjs tests/Browser/portal-redesign.test.mjs
```

After the final Search-only CSS correction: rebuild, then rerun `tests/Browser/portal-redesign.test.mjs` with the same explicit build-reuse flag. Reuse is optional; the harnesses build by default. `source-manifest-initial-matrix.json` preserves the first complete matrix source hashes; `source-manifest.json` identifies final source and tests. No affected behavior was waived.

Initial failures are retained as history: `contracts.log` required exact CSS class ordering (corrected to retain required scope classes while allowing additional classes); `pages-browser.log` contains the incomplete Search synthetic fixture (missing `archiveActivity`, corrected in the test only). These are superseded by the passing final logs, not hidden or reported as product failures.

## Screenshots and visual comparison

Selected screenshots are in `screenshots/`, with a browsable `screenshots/index.html`. Full local evidence remains under `storage/app/qa/full-ui/screenshots` (190 images) and `storage/app/qa/redesign-r1/screenshots` (100 images). These use synthetic test transport, visibly labeled sample records; none were added to production sources or a database.

Reviewed against both supplied references: civic banner hierarchy, forest-green section headers, mint accents, whitespace, readable metadata and page composition. The first reference informs document navigation and listings; the second informs Dashboard hierarchy. Sidebar and mobile navigation visible in screenshots are unchanged. Full-page mobile captures include the fixed navigation at its viewport position; that capture placement is not a content-flow change. Keyboard focus rings are intentionally visible in several captures.

## Preserved boundaries and remaining gates

Protected Sidebar, AppLayout, mobile navigation, navigation configuration, Task internals, backend/API/routes, permissions/authentication/database, HRIS, and lockfiles are unchanged against the exact base. Existing dirty worktrees are preserved. No PR was created or updated; no merge or deployment occurred.

Browser evidence uses the real built React/Inertia entry with synthetic HTTP props. It is not authenticated Laravel/session/database integration, independent QA, live municipal data validation, or production acceptance. No new authenticated environment was provisioned. Privileged HR/auth/public screens and authority-pending modules remain outside this presentation scope. NEXT: AJ review of the pushed exact candidate; independent QA and Kirch technical disposition remain separate. Reopen for a proven regression, changed upstream contracts, new integration candidate or human review findings.

## Changed application and test files

- `resources/css/aj-dashboard-workspace.css`
- `resources/css/portal-visual-redesign.css`
- `resources/js/pages/Correspondence/Index.tsx`
- `resources/js/pages/Correspondence/Show.tsx`
- `resources/js/pages/Departments/Index.tsx`
- `resources/js/pages/Documents/Index.tsx`
- `resources/js/pages/Employees/DirectoryProfile.tsx`
- `resources/js/pages/Employees/Index.tsx`
- `resources/js/pages/Memoranda/Create.tsx`
- `resources/js/pages/Memoranda/Index.tsx`
- `resources/js/pages/Memoranda/Show.tsx`
- `resources/js/pages/PPAs/Index.tsx`
- `resources/js/pages/Plans/Index.tsx`
- `resources/js/pages/Records/Index.tsx`
- `resources/js/pages/Search/Index.tsx`
- `resources/js/pages/Transactions/Create.tsx`
- `resources/js/pages/Transactions/Index.tsx`
- `resources/js/pages/Transactions/Show.tsx`
- `resources/js/pages/TravelOrders/Create.tsx`
- `resources/js/pages/TravelOrders/Index.tsx`
- `resources/js/pages/TravelOrders/Show.tsx`
- `tests/Browser/full-ui-documents.test.mjs`
- `tests/Browser/full-ui-pages.test.mjs`
- `tests/Browser/full-ui-priorities.test.mjs`
- `tests/Browser/full-ui-refinement.test.mjs`
- `tests/Browser/full-ui-registries.test.mjs`
- `tests/Browser/portal-redesign.test.mjs`
- `tests/Frontend/ot-r6-module-ux.test.mjs`
- `tests/Frontend/r8-a1-search-contract.test.mjs`
- `tests/Frontend/r8-b1-plans-library.test.mjs`
