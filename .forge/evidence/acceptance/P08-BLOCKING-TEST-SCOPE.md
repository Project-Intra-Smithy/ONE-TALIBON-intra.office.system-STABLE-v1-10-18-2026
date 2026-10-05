# P08 Blocking Test Scope

## Status

P08 canonical baseline acceptance distinguishes the municipality-wide shared product from preserved but non-canonical historical, full-HRIS, and specialized-domain work.

The PHPUnit `Feature` suite is the blocking P08 backend suite. Tests explicitly listed in `DeferredAndSpecialized` remain in the repository and remain executable, but they do not decide acceptance of the current shared baseline.

This is a classification boundary, not a claim that deferred tests pass.

## Why this boundary exists

Run #21 proved that the previous undifferentiated `tests/Feature` gate mixed several different authority states:

- current shared-core product behavior;
- retired or de-exposed full-HRIS behavior;
- specialized Property, Legislative, and Travel Order domains that are preserved but not promoted as canonical shared product;
- old demo/showcase fixture contracts;
- broad legacy acceptance tests whose assumptions predate the P03-P07 canonicalization.

It also allowed specialized Travel Order and Property regressions to consume a large share of the exact-candidate acceptance window even though those domains are not current municipality-wide acceptance authority.

P08 must prove the exact integrated shared baseline. It must not resurrect retired HRIS routes or silently promote specialized domain behavior merely to make an old test green.

## Blocking `Feature` suite

The blocking suite keeps current shared-core coverage, including authentication/MFA, authority and route boundaries, dashboard, organization/directory, Work Requests, correspondence, documents and records, memoranda, calendar, Messaging, public portal, shared reporting/audit boundaries, current System Administration, and other current cross-layer contracts.

Two current navigation tests were reconciled in this same commit so they assert destination-specific authority state and current municipal labels instead of stale global readiness counts.

## `DeferredAndSpecialized` suite

The following tests are preserved and executable through:

```text
php artisan test --testsuite=DeferredAndSpecialized
```

They are non-blocking for P08 for one or more of these reasons: full HRIS is outside immediate shared scope; the file mixes current behavior with retired HRIS assumptions; the domain is specialized and awaits/depends on dedicated authority; the contract is demo/showcase fixture history; or the suite is an old broad acceptance surface that no longer maps one-to-one to the canonical product.

- H4SystemAdminActionCompletenessTest.php — mixed current System Administration proof plus retired HR health-route assumption; current System Administration remains covered by dedicated backend/navigation tests.
- LeaveCreditTest.php — full-HRIS leave-credit lifecycle.
- M6ExecutivePrototypeTest.php — broad prototype-era executive test including retired payroll assumptions.
- Phase1DevelopmentHealthSecurityTest.php — full-HRIS development/health surface.
- Phase1DtrPayrollIntegrationTest.php — full-HRIS DTR/payroll integration.
- Phase1ExecutiveLegislativeWorkspaceTest.php — specialized legislative surface.
- Phase1IntegratedAcceptanceTest.php — broad pre-canonicalization Phase 1 acceptance assumptions.
- Phase1LifecyclePropertyDomainTest.php — specialized property lifecycle.
- Phase1LifecyclePropertyHttpTest.php — specialized property/legacy HR lifecycle HTTP assumptions.
- Phase1OffboardingTest.php — full-HRIS offboarding lifecycle.
- Phase1PropertyInventoryIntegrityTest.php — specialized property inventory integrity and long-running regression coverage.
- Phase1PropertyLifecycleTest.php — specialized property lifecycle.
- PrototypeMessagingDemoSeederTest.php — historical demo-fixture contract; canonical Messaging API and UI behavior remain blocking elsewhere.
- TravelOrderDomainTest.php — specialized Travel Order domain.
- TravelOrderRecordsFederationTest.php — specialized Travel Order/records federation.
- TravelOrderRepresentativeRoleTest.php — specialized Travel Order authority matrix and very long-running regression coverage.
- TravelOrderWorkspaceTest.php — specialized Travel Order workspace and protected-download regression coverage.
- WorkforceShowcasePersonaTest.php — retired Showcase/demo fixture terminology and behavior.

## Non-greenwashing rule

No deferred test is deleted, rewritten merely to force a pass, or represented as accepted. Known failures or obsolete assumptions remain visible in the deferred suite until the owning domain receives authority and a dedicated reconciliation/validation pass.

A P08 PASS therefore means only: the exact candidate satisfies the defined current shared-core acceptance contract, plus its runtime/browser gates. It does not mean every preserved historical or specialized subsystem is accepted for production scope.

## P09 follow-up

Before baseline freeze, P09 must review remaining active `Prototype` / `Showcase` terminology and decide whether each occurrence is legitimate storage/provenance history, a deferred-test artifact, or active runtime residue requiring canonicalization. P09 must also publish this test-scope boundary in the known-state baseline record.
