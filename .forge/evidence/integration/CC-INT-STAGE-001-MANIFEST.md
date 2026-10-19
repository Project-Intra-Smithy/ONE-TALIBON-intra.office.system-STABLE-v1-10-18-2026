# CC-INT-STAGE-001 — Exact P0–P4 Integration Staging Manifest

**STATUS: ASSEMBLED SOURCE / NOT YET VERIFIED INTEGRATED / DRAFT / NO MERGE / NO PRODUCTION**

- Governing issue: [Engineering Hub #118](https://github.com/Project-Intra-Smithy/engineering-hub/issues/118), paired START synchronized on backend main before staging.
- Immutable canonical base: `5ed21eecac447a2ebe11da96f8baf6e05d722fdf` (documentation-only memory START).
- Source-only assembled tip before adding this manifest: `ff05268451dfdd42a0557cee68718109fb9ff045`. This manifest's own commit is a later documentation-only descendant; new HEAD must be reverified for executable validation.
- Integration staging branch: `forge/integration/p0-p4-common-core-staging-20261013`.
- **Source policy:** Copy exact Git blob bytes by path from source commits; do not cherry-pick stale branch merge parents, retain canonical memory, never infer semantic interoperability from absence of textual conflicts.
- **49 paths imported:** 3 P0 + 33 P1 + 5 P2 + 5 P3 + 3 P4. **Excluded:** 1 stale P1 register and 2 P1 standalone CI workflows. No candidate path overlaps.
- **Git authorship:** staging assembly commits are created by delegated Maintainer; each original source commit is explicitly credited below and remains the source of truth. The staging commits must not be called original author commits.

## Sequential exact-source integration layers

| Lane | Original PR/source SHA | Integrated-layer commit | Imported paths |
| --- | --- | --- | ---: |
| P0 | [#76](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/pull/76) `7671000757fb489437a5eb4582660dd5ac21bbf5` | `59090325ed82c7e2744d8464c4c478adbcb1c609` | 3 |
| P1 | [#69](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/pull/69) `104b41363129590d0089a2661cd0e0a7386c8805` | `2de01349c0c7a1c7ec906015762f97931587268a` | 33 |
| P2 | [#72](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/pull/72) `21e19400e74a0b0eefb50cbd78d120dc3ad82062` | `4e21c8a4fc1bc75afa0ad43301e54d6202cabd22` | 5 |
| P3 | [#71](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/pull/71) `81cab9efca5eeaee95a022a310a2b56a8aa98129` | `809f4f708b9c6c52dc5d6ca72ad9c06765f677ea` | 5 |
| P4 | [#73](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/pull/73) `efa61eab4f4eae69e89dca2debdd9f6cbe0cb810` | `ff05268451dfdd42a0557cee68718109fb9ff045` | 3 |

## Verified per-file blob provenance

| Lane | Path | Exact copied Git blob SHA |
| --- | --- | --- |
| P0 | `app/Services/CorrespondenceAccessDecider.php` | `bf0a2bb04f9e780c36c1f1a4daa386830faff0c1` |
| P0 | `app/Services/TravelOrderAccess.php` | `6d734d79e28acb746fed2fde005729075569f3c3` |
| P0 | `tests/Feature/P0DestinationRevocation/P0DestinationRevocationTest.php` | `ab4febb8f02e58d0d939d71440c829bc3f64ac0d` |
| P1 | `.forge/contracts/A02-UNIFIED-MY-WORK-DRAFT.md` | `e9f0fcdb502b87732bde9e89887847c2091e65e1` |
| P1 | `.forge/contracts/COMMON_CORE_ACCELERATED_DELIVERY_LGU_DECISIONS.md` | `8c5cee71adfbc154c3e2c9ab94bc9016c4ae3730` |
| P1 | `app/Domain/Workflow/Authorization/TransactionAccessDecider.php` | `f010f55fa9c27bfe7f79db6bcd9cf4cfd617a778` |
| P1 | `app/Domain/Workflow/Authorization/TransactionActorEligibility.php` | `94a47d492f3a33b66d01b4e4169a8b64945c39ed` |
| P1 | `app/Domain/Workflow/Authorization/TransactionAuthorizationContextFactory.php` | `8aff3f55c5f8b586673289a4f3350a194ae4ae12` |
| P1 | `app/Http/Controllers/EmployeeProfileController.php` | `f6af31137b2a442f8b1f842bb64a2fd1eb9172fb` |
| P1 | `app/Http/Controllers/LegislativeWorkspaceController.php` | `484583ee034a2aa7439800be465dc2f244a2b0ec` |
| P1 | `app/Services/CalendarWorkspaceQueryService.php` | `f93f362aec4b6aeea680db38dacc8848bd64b773` |
| P1 | `app/Services/CommonReferences/CommonSourceReferencePresenter.php` | `b627093cdf7e4f798a0de9d2c459b364a83bce3e` |
| P1 | `app/Services/CommonReferences/CommonSourceReferenceResolver.php` | `b66f7da0584c8778933334ae244508077bed9ba9` |
| P1 | `app/Services/CommonReferences/ReferenceResolution.php` | `c4e3b1f7e8e5095a2ef718fe23b5f2509c632bfd` |
| P1 | `app/Services/CommonReferences/ReferenceStatus.php` | `85c19868b19a413bd61f886a8c99c563c98d0016` |
| P1 | `app/Services/CommonReferences/SourceKind.php` | `ec4898724a49cc99718f20a44ace90502508f761` |
| P1 | `app/Services/CommonReferences/SourceTarget.php` | `b7e67bfb386874c910f3004c41ca765167bb87f4` |
| P1 | `app/Services/CommonWork/CommonWorkItem.php` | `ad14c88b78e85e15ea0bb8a06aedd57e10275943` |
| P1 | `app/Services/CommonWork/CommonWorkSource.php` | `fecf720a7529daf7dc687a72e85626b1b8ec5d8c` |
| P1 | `app/Services/CommonWork/UnifiedMyWorkQuery.php` | `96851f9ff55647cd60db9027b35b3d1d08c82f1d` |
| P1 | `app/Services/MayorOfficeWorkspaceQuery.php` | `104c26b304b091f884b7e53bb8a961d34beccc6b` |
| P1 | `app/Services/NotificationFeedQuery.php` | `374d53bb3c622344a33cb80a68f910b04e673f75` |
| P1 | `app/Services/TaskActivity/TaskActivityFeed.php` | `5a7c88c58fd0d8e277dce0d5a7c2e3608f7fca34` |
| P1 | `app/Services/TaskActivity/TaskActivityOverview.php` | `7c451c7b9190686b6c88af48d9fdc873444d04c7` |
| P1 | `app/Services/TaskActivity/TaskActivityReader.php` | `552797d89787960d8daad8bc489727559b5488bd` |
| P1 | `app/Services/TransactionVisibilityQuery.php` | `5e4aaa17f0bfeb75eb99f512a6727e7a6445bd7a` |
| P1 | `resources/js/components/tasks/PersonalTaskMutationPanel.tsx` | `5db9779ccaed678603fec129f7e55851ce7c0c8e` |
| P1 | `resources/js/pages/Dashboard.tsx` | `9226bf8360eeb44512cd96a646ca3677da5d5152` |
| P1 | `tests/Browser/p1-task-lifecycle.mjs` | `35dfd54b181d9c2057f8a09e874fc3c15f7a3ae8` |
| P1 | `tests/Feature/CommonWork/UnifiedMyWorkQueryExtendedTest.php` | `6582f3d3be1eb4a69b9166c3940563ebe674531c` |
| P1 | `tests/Feature/CommonWork/UnifiedMyWorkQueryTest.php` | `be689b5207af910d11a638108e4b6dc3b0846d58` |
| P1 | `tests/Feature/PerformanceLiveEndpointsTest.php` | `3422ce6c3f4c671fee44d3c026c763de2b4bc9e7` |
| P1 | `tests/Feature/Tasks/TaskActivityPg16Fixture.php` | `986ff440be342a2cec36e565eb3599c033c9b245` |
| P1 | `tests/Feature/Tasks/TaskActivityPg16OverviewTest.php` | `dd8f63bd16ea4ae4c151af391672176ec9cf3bc4` |
| P1 | `tests/Feature/Tasks/TaskActivityPg16ReaderFeedTest.php` | `33149eefdc0afd556d7489860dbfdae8eb326b1c` |
| P1 | `tests/Feature/WorkRequests/WorkRequestRevocationTest.php` | `1b73e6cecad887a8cd426a1850b85ef3b7c3490c` |
| P2 | `app/Services/CommonCoordination/CalendarResponsibilityReader.php` | `ca3901320343a68e0dd9be5de623341ef4b3ae4a` |
| P2 | `app/Services/CommonCoordination/CommonCoordinationReader.php` | `2e48ed1aa796adacd8ff08a6ee66641b67c74a24` |
| P2 | `app/Services/CommonCoordination/CoordinationActor.php` | `5e274c829787d66225106ac197e6d77d5816d854` |
| P2 | `app/Services/CommonCoordination/NotificationContextReader.php` | `f66ed1f954983bec1aab0725a8a010e01c276482` |
| P2 | `tests/Feature/CommonCoordination/CommonCoordinationReaderTest.php` | `1df27d334f53e38fdb5bfbe21cdfc1a0151218e4` |
| P3 | `app/Services/CommonEvidence/AuthorizedArchiveSql.php` | `8ab2f60d88d42071b2d673600fd897aad712eda8` |
| P3 | `app/Services/CommonEvidence/CorrespondenceEvidenceScope.php` | `5df5ed73523df5e29be0f015f6e5c5df69322b10` |
| P3 | `app/Services/DocumentAccessService.php` | `2c686d33b591ff7464753a4a16b0cb57a0619f78` |
| P3 | `app/Services/DocumentArchiveQuery.php` | `4bb57d49ad9101bfb563261e5c9bd1e981796788` |
| P3 | `tests/Feature/DocumentAccessPrecedenceTest.php` | `90615128b8389c491ea1c07165dd95bbcbc39a1f` |
| P4 | `app/Services/CommonSearch/AcceptedP0Source.php` | `2c474aea254d4927abecbde1d3420b1dd4b22d13` |
| P4 | `app/Services/CommonSearch/AuthorizedSourceSearch.php` | `6f52a4c56c0a33cbf8a49e3235ea53c5c8b75017` |
| P4 | `tests/Feature/CommonSearch/AuthorizedSourceSearchTest.php` | `cf74856aaf067102c696860e40d232a8c230592d` |

## Deliberately excluded upstream paths

| Candidate | Excluded path | Reason |
| --- | --- | --- |
| P1 | `.forge/memory/WORK-PACKAGE-REGISTER.md` | Preserve canonical current-main register |
| P1 | `.github/workflows/p1-fast-security-pg16.yml` | Do not promote standalone legacy CI workflow |
| P1 | `.github/workflows/p1-task-browser.yml` | Do not promote standalone legacy CI workflow |

## Critical compatibility and negative/security gates — NOT YET PASS

- Check Laravel/PHP syntax + Laravel Pint for the **assembled HEAD**, not independent component commits.
- Composer lock install, npm lock install / Vite build; no uncommitted generated artifacts.
- Fresh disposable PostgreSQL 16 from empty DB, Laravel migrations, correct effective PHPUnit connection, no production endpoints or credentials.
- **P0 x P3/P4:** fresh active account, employment and department on every source authorization; stale-session revoked GET/POST; denied record/file/search title/count/URL leakage; restore eligible access and legitimate registrar intake.
- **P1 x P2:** Task != Work Request and source-aware notification/calendar overlays preserve actor eligibility and accepted source types; no universal lifecycle.
- **P3:** documents, evidence, denied archive, bulk-link and scoped file access; legacy direct download behavior and existing positive paths.
- **P4:** typed accepted-P0-only sources, 1000-row query count <= 12 for two 50-record pages; no unaccepted Task/Work Request/P3 source registry promotion and no new public route.
- **P1:** negative Work Request actor state and positive permitted mutation flows, UnifiedMyWork projection, Task activity and frontend JS integration where feasible.
- Use exact-source JUnit/artifact links and explicit PASS/FAIL/NOT_RUN; no old isolated branch PASS counts as integrated PASS.
- P4 writer-source peer Jane/Lucien reviews still awaiting exact-head decisions; LGU W04–W08 and P1-H remain held; release signoff remains with Kirch.

## Enforced exclusions / release holds

Original P0/P1/P2/P3/P4 PRs and original branches remain draft/open/unmerged. Do not merge to main, deploy, enable new routes, change municipal roles/permissions/policies, invent LGU decisions, alter schema, enable persistent credentials, or mark P0-H/P1-H/P2-H/P3-H/P4-H accepted.

**Source provenance check:** compared 49 staged blobs against their upstream exact original blobs, validated final staging diff against canonical base and verified canonical memory blob is unchanged.
