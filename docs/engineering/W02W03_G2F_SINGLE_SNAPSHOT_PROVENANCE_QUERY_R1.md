# KIRION FORGE — G2F Single-Statement Plan Provenance Optimization R1

**Mission:** `OT-R13-W02W03-G2F-SINGLE-SNAPSHOT-PROVENANCE-READ-R1`. **Owner:** Kirch-Nairu (291564617), single authorized application writer. **Source parent:** `65ee3f7011b90c5c3a02e0cf8356cf4fdbd15ed2`. **Authority:** #157, W02 R4 amended R4-07 (#156); W03 official authority (#155). **Mode:** one narrow application code change + one measured test + detailed evidence, no retained DB, merge or deploy.

## Evidence and exact defect boundary

Codex's [G2D PG16 receipt](https://github.com/Project-Intra-Smithy/engineering-hub/issues/157#issuecomment-6453267239) measured four SQL queries per ordinary provenance guard call; 100 calls used 400 SQL queries and approximately 955.8 ms locally. An injected connection failure correctly denied access but took approximately 4.07 seconds. [G2E exact-SHA PG16 receipt](https://github.com/Project-Intra-Smithy/engineering-hub/issues/157#issuecomment-6458876017) validates seven caller side-effect cases (26 assertions), six G2D cases plus eight original Plan cases (44 assertions), and 157 legacy cases (1,768 assertions): 178 tests / 1,838 assertions. **All such PASS results apply only to the G2E parent SHA, not G2F.**

The G2D guard's ordinary check issues two schema probes, then a current document-domain query, then a separate permanent origin-receipt existence query. This G2F patch conservatively combines only the two **data** reads into one `LEFT JOIN` SQL statement, preserving the two schema probes and their existing test mocks.

## Exact implementation contract

**`app/Services/PlanDocumentOriginGuard.php`** retains loaded EVER_PLAN immediate exclusion, unsaved/keyless denial, partial-schema denial, genuine pre-G2B dual-absent compatibility and catch-all DB/schema failure denial.

For an existing document under the present Plan schema, execute **one** query equivalent to:

```sql
SELECT d.security_domain, r.document_id AS origin_receipt_id
FROM documents AS d
LEFT JOIN plan_document_origin_receipts AS r ON r.document_id = d.id
WHERE d.id = ? LIMIT 1;
```

Return protected for a missing row, current EVER_PLAN domain or any permanent origin receipt. Only an existing non-Plan row with **no** receipt passes the origin exclusion to the separate legacy authorization decision. This guard never grants access. A single PostgreSQL statement sees domain/receipt from one statement snapshot, but does not lock future writes or pin storage bytes.

**`tests/Feature/PlanLegacyOriginGuardHardeningTest.php`** retains the six previously passing regression methods and adds `test_persisted_legacy_check_reads_domain_and_receipt_in_one_sql_statement`, instrumented via Laravel connection query log. It asserts a legitimate legacy record remains unprotected, exactly three SQL queries (two schema probes and the one join) and exactly one receipt-table join. This is an expected test design, **NOT_RUN at G2F SHA**.

## QA contract: exact-sha disposable PG16

Run `php -l` on both changed files, then on a freshly attested disposable PG16 instance only:

```bash
php vendor/bin/phpunit --configuration ../phpunit.disposable.xml tests/Feature/PlanLegacyOriginGuardHardeningTest.php tests/Feature/PlanLegacyCallerBoundaryTest.php tests/Feature/PlanCatalogFoundationTest.php tests/Feature/PlanDocumentOriginIsolationTest.php --testdox
```

Rerun the exact G2E 15-file / 157-method legacy regression selection. Independently count calls and latency on 100 persisted legacy checks. **Expected based on source shape:** normal path four→three queries; 100-call SQL count 400→300. This is NOT an observed G2F measurement and must not be reported as a performance PASS before execution. Investigate test failures and rerun the exact SHA. Capture disposable lease, exit codes, assertions, source cleanliness and teardown.

## Security exclusions and remaining owner gates

- **G4 TOCTOU still OPEN:** the domain/receipt statement snapshot does not make later storage open atomic with actor authorization, immutable object pinning, or required durable pre-byte audit. No protected Plan gateway exists.
- **Restore downgrade OPEN:** dual-absent pre-G2B schema cannot reattest protected-origin history following stale restore. G1 external monotonic fence and old-key revocation still required.
- **G1 DBA OPEN:** PostgreSQL function owners/grants, default PUBLIC EXECUTE, privileged repair and migration/restore privileges require accountable role architecture; no speculative REVOKEs or retained migration in this batch.
- **G1 identity/storage/audit OPEN:** authoritative MFA/office/revocation epochs, immutable scanned generations, storage object integrity, pre-byte audit transport and failure behavior remain independent requirements.
- **G1 municipal authority OPEN:** no official Plan edition/master/custody/actor classification inferred from synthetic records.
- **G3–G7 OPEN:** R4-07 NX57/NX63 source-specific projections, secure PDF gateway, frontend/retention/recovery and 75 formal security cases remain outstanding; Kirion-Nox must independently review implementation at exact tested SHA.
- **P0 #128/#129 OPEN; eight-worker series ON HOLD.** No production data, migration, merge, deploy, real Plan PDFs or release action.

**Disposition:** `G2F_SOURCE_IMPLEMENTED / PHP_LINT_PASS / EXACT_SHA_PG16_TESTS_NOT_RUN / NO_MERGE_NO_DEPLOY`.