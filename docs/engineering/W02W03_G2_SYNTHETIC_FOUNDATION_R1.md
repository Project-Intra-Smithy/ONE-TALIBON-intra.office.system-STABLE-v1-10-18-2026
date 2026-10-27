# W02/W03 G2: synthetic catalog foundation R1

- Writer: Kirch-Nairu, sole W02/W03 integrator.
- Base: `04e188422bbbcb97a13a25426fab8c5d9ae13c4c`.
- Branch: `candidate/r13-w02w03-nairu-single-integrator-r1`.
- Authority: Kirch's 2026-10-28 explicit instruction to begin bounded synthetic implementation.
- No merge, production migration, deployment, real LGU document ingestion, or eight-worker activation.

## Implemented

Additive `plan_families` and `plan_editions` catalog tables with public UUIDs,
a restrictive family foreign key and per-family unique edition labels; Eloquent
models with corresponding relationships; synthetic-only feature tests.

No records are seeded, approved, or marked adopted. All current public-facing
Plans UI, documents, reports, CSV, storage and authentication routes remain
unchanged. These metadata records do not grant discovery or file permissions.

## Mandatory next security dependency

**This is not a protected PDF implementation.** No `plan_document_bindings`
may be introduced before verified PostgreSQL-enforced permanent `EVER_PLAN`
origin, zero generic `document_links`, immutable scanned object generation,
authoritative actor/session/MFA epoch, durable pre-byte start audit and safe
restore fencing. G1 DBA, Identity, storage and recovery decisions are still
INPUT_REQUIRED. Existing AJ custody is a separate LEGACY_CTW lineage.

Migration and feature tests are authored but NOT executed; isolated PG test
environment permission is still outstanding. Three catalog tests are not
among the 75 security acceptance cases (P01–P38/NX39–NX75); all remain NOT_RUN.

- Preserve existing B/AJ candidate isolation and P0 #128/#129.
- Preserve R4 + R4-07/NX57/NX63 source-specific Plan vs event oracle.
- Keep the independent Kirion-Nox review and eight-worker W01–W08 HOLD.
- Do not create a Plan attachment via generic legacy Document links.

Canonical mission tracker: Project-Intra-Smithy/engineering-hub#157.
