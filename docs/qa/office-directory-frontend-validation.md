> Earlier directory validation checkpoint. The authorized logo follow-up and its current 52/52 results are recorded in [logo inventory](../assets/office-logo-inventory.md); its nine frontend-authorized mappings supersede the zero-mapping status below.

# Office Directory finalization validation

2026-10-20 (Asia/Shanghai). Review candidate only; no production acceptance, merge, deployment or issue closure.

## Source and ownership

AJ owns the presentation/logo delta; Lucien retains original directory and Records-guard attribution from backend `f0ad0ed86a1abc0189e52234845b8018e6f28b20`. Exact local source baseline: `8be1c5eff06072740dd731c8a4ba34850773ccf8`; frontend main reverified `dc5950ce73a4b6342fd8f2e4e21a4a59ae28f62c`; backend main `8a130e151fdf79e87e134a5d26e58667889f0a7e`. Proposed catalog backend assembly: `2145fcb797c4cd5e173dad24b7da876a93f2814d`; no approved running tuple.

Branch `feat/aj-ui-finalization` contains earlier AJ work absent from main. Review is therefore stacked against preserved `review/aj-directory-baseline-8be1c5e` at the exact baseline above. Do not retarget directly to main without separately reconciling those historical changes. Existing PR34/35/36/38 are dependencies/context, not merged by this patch.

## Exact application scope

- `resources/js/pages/Departments/Index.tsx`
- `resources/js/components/offices/OfficeLogo.tsx`
- `resources/js/lib/office-logo-map.ts`
- `tests/office-directory-emergency-ui.test.mjs`
- `tests/office-directory-mounted-ui.test.mjs`
- `tests/office-logo.test.mjs`

Only accompanying directory documentation and continuity are additionally committed. No Auth, MFA, Calendar, Tasks, shell, lockfile, generated build, logs, backups or logo images are included. The reported trailing-space/extra EOF line in `talibonAssets.ts` was removed as requested; it now matches HEAD, requiring no commit change. [Full inventory](office-directory-finalization-inventory.md) records excluded existing work. All unrelated input hashes were preserved except that explicitly requested whitespace correction.

## Verification actually run

Checks used disposable copies of baseline plus exactly the six application paths above, with a fresh `npm ci --no-audit --no-fund`. This avoids validating uncommitted shell/Auth edits as part of the candidate.

| Check | Result |
|---|---|
| Clean dependency install | exit 0 |
| Candidate TypeScript `npm run types:check` | exit 0 |
| Candidate production `npm run build` | exit 0 |
| Candidate full `npm test` | exit 0; 51 passed, 0 failed |
| Directory tests within full suite | 9 passed, including actual exported guard and built-entry browser |
| Untouched baseline Login suite | exit 0; 6 passed, 0 failed |
| Pre-existing dirty Auth/test snapshot without directory patch | exit 1; 7 passed, 1 failed: absent Continue with Google |
| Same dirty snapshot plus directory patch, full suite | exit 1; 52 passed, 1 failed: same Google assertion |
| Final whole-tree whitespace check | exit 0 after requested correction |

The single Google failure is a pre-existing local Auth/test requirement mismatch, not a directory regression. The committed baseline does not contain that Google expectation. No authentication behavior or assertion was modified to force PASS. AJ/Kirch must reconcile the separate Auth work under [#18](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/18) before including it in another candidate.

Actual built app.tsx/Inertia with synthetic HTTP passed Chromium checks at 320, 390, 768, 1024 and 1440: 40 cards; 14 groups plus All; search/group intersection, keyboard Tab, reset/no-match/empty states; no overflow or page errors; no Records links for null/traversal inputs; 40 accessible neutral logo placeholders. Clean-candidate 320/1440 viewport screenshots were visually inspected. This is frontend fixture evidence, not Laravel acceptance. Local logs/screenshots remain under `artifacts/aj-finalization/` and its recorded disposable workspace; they are deliberately not committed.

## Security, contract and assets

The entire `safeRecordsHref` function is text-identical to the reviewed source: only `entry.recordsHref === '/records'` yields a link. The regression executes the exported helper, permits that literal and denies 28 values covering traversal, encoded traversal, queries/fragments, foreign/malformed URLs, backslashes, NUL, case and whitespace. Backend authorization remains mandatory.

[Canonical reconciliation](office-directory-canonical-reconciliation.md) independently enumerates all 40 unique FOCAL keys and 14 group counts from the pinned backend config. The backend service projects that source; the frontend only consumes props, with no duplicate production catalog. Main's controller still lacks catalog props: shipping frontend alone does not establish the 40/14 runtime.

Zero real logo mappings are enabled. Missing/unverified codes and image errors produce an accessible fixed-size neutral icon (36/48/64px); no municipal seal is substituted. Exact-code resolution requires identity and usage evidence. Component fallback/error tests pass. [Logo inventory](../assets/office-logo-inventory.md) lists all 10 candidates awaiting LGU/Kirch approval: MPDO, MSWDO, MAO, MAccO, MAccO-IAU, MMAO, MEDIPO, MPESO, MTO, MO-TTMO. Four municipal backdrop/profile files are excluded from office mappings. No unapproved images are committed.

## Publication and remaining gates

Existing package `OT-R17-A2-LUCIEN2-FRONTEND-RUNTIME-UAT-R1` and START retained; no duplicate ownership approval. [AJ checkpoint](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/39#issuecomment-6288672461) is paired with branch memory `2cf0a33ea53e5f311729b460ee23db60b6af2245` and [reciprocal receipt](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/39#issuecomment-6288682824). Historical continuity bytes are preserved. Canonical-main amendment remains `SYNC_REQUIRED / HOLD` under the no-merge instruction; branch publication is not canonical synchronization.

1. Maintainer/Kirch: synchronize the AJ amendment/final evidence to canonical memory through review; reconcile the stacked baseline before main integration.
2. Backend runtime owner/Kirch, [#93](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/issues/93): supply approved disposable backend/frontend tuple and test identities. Herd is not running; no approved instance supplied. Authenticated Laravel/session/MFA/CSRF, real 40/14 payload and head/default Workspace versus explicit directory, role/policy and database-backed actions remain NOT RUN.
3. LGU/process owner and Kirch: identity/usage approval for ten logos; activate only after evidence. Official organizational/TOR acceptance remains unestablished.
4. AJ/Kirch, #18: reconcile the separate dirty Auth Google expectation before adopting those edits.

Hosted CI is separate from these local checks; Firefox/WebKit, screen reader/full contrast and official UAT NOT RUN. Engineering Hub #63 remains inaccessible to the current GitHub account. Existing backend #95 review is UI_ACCEPT_FOR_TEST_ASSEMBLY, not authenticated acceptance.

Single NEXT: Maintainer/Kirch reviews the scoped candidate and synchronizes canonical continuity, then selects the approved disposable runtime tuple for authenticated QA. Issue #39 remains open.
