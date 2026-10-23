# AJ #136 integration review and validation ? 2026-10-23

Owner: AJ Rienze (`azinamouto`). Codex-assisted self-review and local execution; not an independent reviewer decision.
Owning issue: https://github.com/Project-Intra-Smithy/engineering-hub/issues/136

## Exact source and provenance

Tested candidate: `014e10a5197bd2dc92e1beb92b1222fe4d0af3cb`, on `candidate/aj-136-document-center-integration-r1`.
Integration base remains `e39c7ecc6b4b7ae6538f545a48dff57625edc478`.
This evidence publication changes documentation/artifacts only; the tested executable files are unchanged.

All 28 disjoint writer paths are present and all three pinned source histories are ancestors:
- UX `ab6cf5cec5deb06503e91ba953edfcb48e3e7ddf` (7 paths), merge `27dbb88`.
- Ingestion `956f1ce2d6801043a2580cc94ca06c0623055c4f` (6 paths), merge `4616508`.
- Custody `dd7f7ca28d61d64485a9c99dbffd7bc0fba2f21e` (15 paths), merge `2243ad9`.

Reviewed local integration commits: `6731941326ff93bc8d577366ae65fc8244b37bbc`, `67fafe996f80a79e94d88234b6fa11ca36c65feb`, `47f41458562df7194bccf8b406d8fcc807d42904`, `014e10a5197bd2dc92e1beb92b1222fe4d0af3cb`. Their existing author/committer and Copilot trailers are preserved. No additional application change was needed during this final review.

## Review outcome

Records and Files use real authorized Laravel queries, categories/scopes, filters, metadata, pagination and downloads. Newest/oldest sorting occurs before SQL pagination, with stable tie-breakers; the overview keeps its newest-first meaning. Sorting values are allowlisted. Loading, empty, HTTP/network failure and retry states are present. Existing AJ44 navigation is retained.

Imported custody evidence resolves the version from the unique import-revision ledger, verifies exact Eloquent parent identity and ledger/document SHA-256 agreement, rejects conflicting metadata versions, and hashes protected stored bytes. There is no invented default version. Legacy evidence still requires an explicit integer metadata version. The custody service separately checks the parent link, proof version/hash, exact document classification and the record classification floor. Imported revisions, replay and classification downgrade tests pass. This is a technical proof seam, not permission to ingest or perform custody operations.

`CustodyCapabilityGate`, `DocumentImportAuthorization`, and `routes/web.php` are byte-identical to their pinned sources/baseline. No unaccepted P0-A security candidate, #137 or #138 implementation was incorporated. No additional blocking defect was found within the review and tests below; this is not whole-application security acceptance.

## Executed validation

Environment: Windows; PHP 8.4.25; Node 22.16.0; PostgreSQL 16.15, disposable native cluster at `C:/Users/admin/AppData/Local/Temp/aj136-pg16/data`, listening only on `127.0.0.1:55436`; database `talibon_portal_test`, role `postgres`. The separate installed PostgreSQL service was not used. Browser origin `http://127.0.0.1:8136`; synthetic data only.

| Check | Result | Exit |
| --- | --- | --- |
| PHP lint on every changed PHP path against integration base | 26 files PASS | 0 |
| Final bounded Laravel/PHPUnit regression selection | 265 tests, 3318 assertions, zero errors/failures/skips | 0 |
| `npm run test:contracts` | 31 tests PASS (includes Document Center) | 0 |
| `npm run types:check` | PASS | 0 |
| `npm run build` | PASS; nonfatal Vite plugin-timing diagnostic | 0 |
| PG16 concurrent ingestion harness | Identical operations returned same revision; competing successors yielded one success/one conflict; versions [1,2] | 0 |
| Both new migrations down, then up | Both rolled back and reapplied successfully | 0 |
| Authenticated Chromium | Password + TOTP; 27-record pagination; oldest-first; metadata; empty search; actual protected PDF bytes; 390px mobile without horizontal overflow; network failure/retry; zero page errors | 0 |
| Provenance, default-deny/route byte comparisons, `git diff --check` | PASS | 0 |

The regression selection includes ingestion, custody denial/preflight, DocumentAccessPrecedence, attachment authorization, Records, Correspondence, Calendar, Work Requests, Travel Orders, personal Tasks and restricted-UAT/G1/G2 guards. It exercises cross-office restricted evidence concealment, revoked/changed office identity, principal mismatch and download reauthorization. See [JUnit](phpunit.xml) and [browser receipts](browser-results.json). Local logs/screenshots are inventoried by [SHA-256](local-artifact-hashes.json); fixture credentials and local environment files are excluded.

Commands (PowerShell, worktree root):
```powershell
$env:APP_ENV='testing'; $env:DB_DATABASE='talibon_portal_test'; $env:DB_PORT='55436'
& C:/Users/admin/.config/herd/bin/php84/php.exe vendor/phpunit/phpunit/phpunit -c .local/aj136/phpunit.xml --filter 'DocumentIngestionTest|DocumentAccessPrecedenceTest|CoreDocumentAttachmentsTest|RecordsSearchTest|Correspondence|CalendarWorkspaceTest|WorkRequest|TravelOrder|IndividualTaskHttpTest|TaskCoreServiceTest|TaskDomainFoundationTest|RestrictedUat' --log-junit .local/aj136/final-regressions.xml
npm run test:contracts
npm run types:check
npm run build
$env:AJ136_DISPOSABLE='1'
php tests/integration/document-center-pg16.php race
php artisan migrate:rollback --env=testing --path=database/migrations/2026_10_22_234100_create_document_import_revisions_table.php --path=database/migrations/2026_10_22_230000_create_correspondence_operation_receipts_table.php --step=2 --force
php artisan migrate --env=testing --path=database/migrations/2026_10_22_230000_create_correspondence_operation_receipts_table.php --path=database/migrations/2026_10_22_234100_create_document_import_revisions_table.php --force
node tests/Browser/document-center-integration.mjs
```

The local PHPUnit XML is a copy of the repository configuration with absolute paths, port 55436 and a generated test APP_KEY. Its safety assertions remain intact. `.env.testing` points to the same disposable instance. The browser fixture is freshly generated by the committed harness `seed` mode; its JSON includes random synthetic credentials and must remain local. Never reuse these commands with preserved databases. Initial harness attempts encountered missing process environment values and stale browser fixtures; corrected configurations were used for the final passing results. Earlier results are not substituted for the final execution.

## Remaining gates and historical wording

- **NOT_RUN / not awarded:** positive custody milestone service execution, custody transaction concurrency, independent Nox P0-A exact-candidate/41-case security review, formal Kurt CI, Siris independent QA and Kirch technical acceptance. The final custody policy gate deliberately denies before DB mutation; no bypass was introduced to obtain a positive-path PASS.
- #83 ingestion, custody, issuance, dispatch, archival, staff intake and custody retrieval remain unmounted/default-deny. No merge, deployment, production mutation, force push or hosted CI is authorized by this report.
- Canonical START `8ab2d5484b22fa73b4a60b934a923d677f61941d` retains historical `CROSSLINK_PENDING` text, with an explicit transition upon verified crosslink. That crosslink exists at #136 comment `6347509637`; candidate commit `014e10a` records START_SYNCED. This is a wording discrepancy, not a reopened START HOLD. Canonical main was not rewritten during this delivery.
- NEXT: publish this candidate and its evidence to #136 for independent review and acceptance decisions. Keep #136 open; this is a checkpoint, not CLOSE or release.
