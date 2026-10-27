# W02/W03 G2B — quarantined EVER_PLAN provenance and typed bindings

Writer: Kirch-Nairu, the sole W02/W03 source integrator
Starting parent: cf520175742b4170640f9bdcac07824f97a46594
Authority: Kirch's bounded source-only implementation start
Mode: unmerged isolated candidate; no DB/test-run/production/real PDF authorization

## Implementation contents

1. Add nullable documents.security_domain, leaving EVERY historic record UNKNOWN (not automatically LEGACY_CTW).
2. Seal newly classified EVER_PLAN documents with an append-only local origin receipt. PostgreSQL ordinary SQL triggers prevent modifying/deleting sealed rows or receipts.
3. Prevent generic document_links CRUD on EVER_PLAN and prevent generic morph associations to PlanFamily/PlanEdition even for unclassified source documents. Parent row locks coordinate with origin sealing; no implicit Plan links.
4. Create quarantined-only typed plan_document_bindings keyed to PlanEdition and exactly one Document. Ordinary binding mutation/deletion rejects, no ACTIVE state exists.
5. Block legacy download and ordinary blob cleanup for EVER_PLAN origin or retained origin receipt. Known Plan lookup on the legacy download route returns generic 404, not its file bytes.
6. Add synthetic-only negative tests for ordinary SQL DML, origin sealing, generic morph links and typed quarantine. NOT_RUN.

## Critical limits

Source-only transitional schema does NOT certify privileged SQL repair, DB role/grant separation, non-downgradable backups/old keys, historical backfill census, legal custody, immutable scanned blob generations, PG-authoritative actor/MFA/office epochs, durable pre-byte audit, actor-specific Plan file listings, event report/CSV field masking, or a secure PDF endpoint. These all require G1 operator clearance and independent Kirion-Nox exact-composed-SHA code/PG/HTTP verification.

The permanent migration refuses rollback to legacy provenance. DO NOT run it against production, demo or shared DB. No Plan master or annex is published; all typed associations are QUARANTINED. All W02 75 security cases remain NOT_RUN (including NX57-a/b/c and NX63-a/b/c). Existing security P0 #128/#129 stays open and the eight-worker parallel series stays ON HOLD.
