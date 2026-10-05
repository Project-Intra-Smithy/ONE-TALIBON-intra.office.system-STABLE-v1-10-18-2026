# KIRION FORGE: P03 / W01 BACKEND TARGET MAP

Technical Authority: **Kirch Ivan Balite**

Series: `P — CANONICAL BASELINE HARDENING`

Slice: `P03 — BACKEND CANONICALIZATION`

Writer lane: `W01`

Immutable implementation base: `a10dca34db0509d7139ebeb4080e85dde2c0e544`

This addendum narrows the existing W01 handoff. It does not broaden owned scope.

## Execution order

### P03-A — Route & Surface Authority

Start here.

Inventory and classify `routes/web.php` and `routes/api.php`.

Explicitly inspect:

- static Meetings/Announcements routes;
- prototype Messaging endpoints;
- Procurement showcase;
- `/operations` versus Project Monitoring presentation;
- Property routes;
- Legislative routes;
- HRIS/DTR/payroll/leave/health/development/onboarding/offboarding route families.

For each family return one disposition: authoritative core / verified foundation / partial / reference / deferred / outside immediate scope / historical / blocked.

Do not delete based on scope mismatch alone. Prefer isolation/truthful exposure when provenance must be preserved.

### P03-B — Identity/Auth/Authorization

Inspect `app/Domain/Authorization/**`, `app/Domain/Identity/**`, Policies, middleware, MFA/account-active enforcement and negative tests.

Repair only evidence-backed permissive or stale assumptions.

### P03-C — Workflow/Correspondence/Records

Inspect `app/Domain/Workflow/**`, transaction/work-request lifecycle, `app/Domain/Correspondence/**`, document/records/search/file behavior and duplicated lifecycle paths.

Preserve domain invariants.

### P03-D — Coordination/Eventing/Integration

Inspect Calendar, Memoranda, Notifications, accepted Messaging preservation, `app/Domain/Integration/**`, `app/Domain/Outbox/**`, jobs/events/listeners and current v1 integration API.

Do not design the future frontend API here.

### P03-E — Schema/Seed/Runtime Authority

Inspect migrations, seeders, demo fixtures, backend config defaults, environment coupling and stale backend test assumptions.

No destructive migration-history changes.

### P03-F — Backend Extraction Manifest

Record backend-owned code, frontend-dependent contracts, shared decisions, historical/reference/deferred code and future API requirements.

## Commit discipline

Prefer one bounded commit per sub-slice when actual source changes exist:

- `KIRCH-FORGE-P03A-...`
- `KIRCH-FORGE-P03B-...`
- etc.

A sub-slice may legitimately return `NO SOURCE CHANGE — CLASSIFICATION ONLY` when evidence does not justify mutation.

## Validation cadence

Code first. Run focused local tests only for changed behavior/security boundaries. Broad CI/CD belongs to P08 after integrated P07 candidate construction.

## Stop rule

Stop for Maintainer disposition if a required repair crosses into frontend files, root dependency/build configuration, CI/Docker, unclear schema intent, or missing LGU business authority.
