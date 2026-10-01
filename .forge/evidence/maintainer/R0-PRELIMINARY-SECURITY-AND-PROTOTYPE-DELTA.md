# R0 PRELIMINARY SECURITY + PROTOTYPE DELTA

## Scope

Read-only comparison for the staged real-system transition.

Current product baseline:

`Kirch-Nairu/Talibon-Sales-Prototype@269975e1c1e61bcde78490530e5cc8e90f35ae47`

Security/reference baseline requested by Technical Authority:

`Kirch-Nairu/Talibon-Intra-Office-Portal@a7d7be17feb435b50c52cacd063e11d92ad047e1`

Program branch:

`KIRION-INTRA-REAL-SYSTEM-TRANSITION`

No product code was mutated by this audit.

## Preliminary outcome

The current repository did **not** lose the MFA/security foundation wholesale.

Most MFA machinery survived into the current product line.

The major security regression identified in this preliminary comparison is a **showcase-session bypass inside MFA assurance**, combined with presentation-only login/session context that does not belong in the real-system path.

The correct transition is therefore:

```text
PRESERVE REAL SECURITY FOUNDATION
        +
REMOVE SHOWCASE BYPASSES / PERSONA AUTHORITY
        +
REVALIDATE NEGATIVE SECURITY TESTS
        +
HARDEN PRODUCTION DEPLOYMENT
```

not:

```text
DELETE SECURITY AND REBUILD FROM SCRATCH
```

## Exact MFA preservation findings

### MfaService

Current repository:

`app/Services/MfaService.php`

blob SHA:

`299d200293de23ff612e4ac2f434d130fa715e39`

Reference repository:

same path, same blob SHA:

`299d200293de23ff612e4ac2f434d130fa715e39`

Conclusion:

`BYTE-IDENTICAL / PRESERVED`

Capabilities present:

- TOTP secret generation;
- provisioning URI generation;
- six-digit TOTP verification;
- enrollment confirmation;
- MFA version incrementing;
- hashed recovery-code storage;
- single-use recovery-code consumption;
- recovery-code regeneration;
- reset enrollment;
- disable MFA.

### identity configuration

Current repository:

`config/identity.php`

blob SHA:

`456914625bd63ebc2f7f51f9e05f1961dabc903e`

Reference repository:

same path, same blob SHA:

`456914625bd63ebc2f7f51f9e05f1961dabc903e`

Conclusion:

`BYTE-IDENTICAL / PRESERVED`

Configured privileged roles currently include:

- system administrator;
- Mayor approver;
- Mayor staff;
- department head;
- department staff;
- HR officer;
- legislative staff.

Configured authentication limits:

- login: 5 attempts / 60 seconds;
- MFA: 5 attempts / 60 seconds.

## Authentication controller delta

Reference `AuthenticatedSessionController` performs:

- credential validation;
- login rate-limit enforcement;
- active-account requirement in authentication;
- generic failed-login behavior;
- clearing successful login limiter state;
- session regeneration after successful password authentication;
- clearing prior MFA assurance;
- privileged MFA routing;
- audit event after password success when MFA remains required;
- logout, session invalidation, CSRF-token regeneration.

Current controller preserves those behaviors but additionally injects:

- `ShowcaseSession`;
- showcase enabled state into the Login page;
- presentation personas into the Login page;
- showcase session/persona cleanup during logout.

Conclusion:

`SECURITY FOUNDATION PRESERVED; PRESENTATION CONTEXT ADDED`

Real-system target:

remove showcase/persona authentication context while preserving the reference authentication protections.

## Critical MFA assurance delta

Reference `RequireMfaAssurance`:

```text
authenticated user
-> check MFA assurance
-> if unsatisfied, preserve intended safe URL
-> audit denial
-> redirect to enrollment/challenge
```

Current `RequireMfaAssurance` adds:

```text
if ShowcaseSession is active:
    allow request without MFA assurance
```

Conclusion:

`SECURITY-CRITICAL SHOWCASE BYPASS`

This is incompatible with the real-system target.

The bypass must be removed in the first implementation security lane, with tests proving that presentation/demo/session state can no longer grant privileged application access without required MFA.

## Route protection finding

Current main still wraps the operational application under:

`auth + active + mfa.assured`

and retains dedicated MFA enrollment/challenge/settings/recovery/reset routes.

Therefore route-level MFA architecture is still present.

The security issue is not route absence; it is the showcase-aware assurance bypass beneath that route contract.

## Authentication assurance finding

Current `AuthenticationAssurance` still checks:

- whether a role requires MFA;
- confirmed enrollment;
- assurance session user identity;
- MFA version equality;
- verified-at session evidence.

MFA versioning means reset/disable/re-enrollment can invalidate older assurance state.

Conclusion:

`PRESERVE`

## Attempt limiting finding

Current `AuthenticationAttemptLimiter` still rate-limits:

- password login using normalized identity + request IP;
- MFA challenge using user ID + request IP.

Conclusion:

`PRESERVE AND REVALIDATE`

## Security principles recovered from reference repository

The reviewed reference security model requires:

1. least privilege;
2. deny by default for sensitive functions;
3. department-aware access control;
4. no direct database access from employee workstations;
5. no shared administrator credentials in production;
6. auditable workflow/security events;
7. URL knowledge alone never grants sensitive access;
8. UI hiding is not authorization; server-side enforcement is mandatory.

Its production-hardening backlog also identifies:

- HTTPS only;
- secure session-cookie configuration;
- production lockout/rate limiting;
- secrets management;
- encrypted backups;
- database network isolation;
- centralized logs/alerting;
- backup/restore drills;
- vulnerability/dependency scanning;
- privacy/records-retention review;
- disaster recovery;
- audit retention/tamper resistance.

These are security requirements for the real-system transition, but deployment-dependent claims must remain unproven until evidence exists.

## Current prototype/showcase active-context findings

Code search confirms active product/runtime references including, at minimum:

### Showcase runtime

- `config/showcase.php` with showcase mode enabled by environment/default;
- `app/Services/ShowcaseSession.php`;
- `app/Http/Controllers/ShowcaseSessionController.php`;
- `app/Providers/ShowcaseServiceProvider.php`;
- showcase-aware `AuthenticatedSessionController`;
- showcase bypass in `RequireMfaAssurance`;
- showcase session data shared through Inertia/shell types;
- showcase persona-aware onboarding/tour behavior;
- showcase shell/footer/session controls;
- showcase runtime/start/stop/load/proxy scripts.

### Prototype configuration / credentials

- `config/prototype.php`;
- prototype demo-password convention.

### Prototype messaging

- `PrototypeMessage` model;
- prototype messages migration/table;
- `app/Prototype/Messaging/*`;
- prototype messaging controllers;
- prototype messaging frontend types/hooks/components;
- prototype messaging routes.

### Static/reference operational-looking surfaces

Existing repository evidence already classifies multiple meeting, announcement, project/PPA, procurement, and municipal-system surfaces as static/reference/showcase-backed rather than authoritative server-side operational domains.

These must not be made "real" through wording changes alone.

## Historical wording boundary

Search also finds many `prototype` and `showcase` occurrences in:

- accepted Forge evidence;
- historical showcase directives;
- archived handoffs;
- historical scripts/plans;
- provenance documents;
- old scope documents.

Those are not equivalent to active product context.

Real-system cleanup must distinguish:

```text
ACTIVE PRODUCT/RUNTIME CONTEXT -> remove/replace/migrate
HISTORICAL EVIDENCE            -> preserve as history
```

Deleting or rewriting historical evidence would reduce traceability and create false history.

## R0 required next evidence

Before Code Writer mutation, R0 must produce a complete path-by-path matrix covering:

- every active runtime `showcase` dependency;
- every active runtime `prototype` dependency;
- every static/reference dataset used by operational-looking UI;
- every security bypass introduced for presentation convenience;
- every MFA/auth/security control retained from the reference repository;
- every security control that drifted;
- every deployment hardening requirement still unproven;
- exact tests that must be removed, rewritten, or added.

## First implementation priority after R0

`SECURITY / PRESENTATION-AUTHORITY DECOUPLING`

Minimum intent:

1. eliminate showcase-session MFA bypass;
2. eliminate showcase/persona authority from login/application access;
3. preserve TOTP MFA, recovery codes, version invalidation, rate limits, active-account enforcement, session hardening, and audit events;
4. replace presentation-only tests with negative real-system security tests;
5. keep the branch non-promotable until authentication and authorization regression tests pass.

## Preliminary classification

| Area | Current status | Transition action |
|---|---|---|
| MFA service | Preserved | Keep / revalidate |
| MFA config | Preserved | Keep / policy review |
| Login limiter | Preserved | Keep / revalidate |
| MFA limiter | Preserved | Keep / revalidate |
| Session regeneration/logout invalidation | Preserved | Keep |
| Active-account auth | Preserved | Keep |
| MFA route groups | Preserved | Keep |
| MFA assurance | Weakened by showcase bypass | Repair first |
| Showcase persona/session authority | Presentation-only runtime | Remove from real-system path |
| Prototype messaging | Prototype-only domain | Replace, not rename |
| Static/reference operational surfaces | Non-authoritative | Promote to real backend or remove/subordinate |
| HTTPS/secure production cookies | Deployment-dependent | Prove during production hardening |
| Backups/DR/logging/alerting/network isolation | Not proven by code alone | Implement and evidence during R6 |

## R0 status

`PRELIMINARY DELTA COMPLETE / FULL INVENTORY STILL REQUIRED`

No claim is made that this file exhausts every prototype/showcase occurrence or every security control. It records the first verified high-impact delta and establishes the correct security preservation strategy for the staged transition.
