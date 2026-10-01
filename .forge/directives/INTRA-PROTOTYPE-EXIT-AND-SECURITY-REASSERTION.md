# KIRION FORGE — INTRA PROTOTYPE EXIT + SECURITY REASSERTION

## Authority

Technical Authority: **Kirch Ivan Balite**

Program branch:

`KIRION-INTRA-REAL-SYSTEM-TRANSITION`

Accepted source baseline:

`main@269975e1c1e61bcde78490530e5cc8e90f35ae47`

Legacy/reference repository reviewed for security posture:

`Kirch-Nairu/Talibon-Intra-Office-Portal@a7d7be17feb435b50c52cacd063e11d92ad047e1`

This directive supplements:

- `.forge/directives/INTRA-REAL-SYSTEM-TRANSITION.md`
- `.forge/SSOT_INTRA_REAL_SYSTEM_TRANSITION.md`

## Program intent

ONE TALIBON INTRA is transitioning from a showcase/prototype-shaped product line into a real municipal intra-office system.

The governing goal is not cosmetic renaming.

The active product must progressively remove **prototype/showcase wording, prototype/showcase runtime behavior, prototype/showcase data assumptions, and prototype/showcase-only context** from the real-system path.

Historical Forge evidence, tags, old directives, commit history, and archived showcase records remain historical truth and must not be falsified or rewritten merely to remove the words `prototype` or `showcase` from history.

The purge applies to the **active application/runtime/product contract**, not to immutable history.

## Critical finding — MFA was not actually lost

The current repository still contains the original MFA architecture.

Verified retained controls include:

- MFA database fields and versioning;
- TOTP enrollment and verification;
- hashed recovery codes;
- MFA recovery-code regeneration;
- MFA reset/disable lifecycle;
- privileged-role MFA policy;
- MFA subject and MFA assurance middleware;
- login/MFA rate limiting;
- session regeneration after password authentication;
- session invalidation/token regeneration on logout;
- MFA security UI routes and pages;
- MFA feature/browser tests;
- audit events for authentication and assurance failures.

`app/Services/MfaService.php` is byte-identical between the current repository and the reviewed legacy/reference repository.

`config/identity.php` is also byte-identical between those two reviewed baselines.

Therefore the real-system transition MUST NOT reimplement MFA from scratch.

It must preserve the retained MFA foundation and remove the showcase-era bypasses that weaken or obscure it.

## Critical security drift — showcase MFA bypass

Current `RequireMfaAssurance` injects `ShowcaseSession` and permits the request to continue when a showcase session is active.

The reviewed legacy/reference `RequireMfaAssurance` has no showcase-session bypass.

For the real-system product, this bypass is prohibited.

Required target invariant:

```text
privileged authenticated user
        +
active account
        +
required MFA enrollment/challenge
        =
authorized application access
```

No presentation persona, demo mode, showcase session, training shortcut, seeded account convention, or UI context may bypass MFA assurance on the real-system path.

## Security baseline to preserve and harden

The reviewed security model establishes these principles and they remain governing for the transition:

1. Least privilege.
2. Deny by default for sensitive functions.
3. Department-aware authorization.
4. No direct database access from employee workstations.
5. No shared administrator credentials in production.
6. Workflow and security events are auditable.
7. Sensitive information is not exposed merely because a user knows a URL.
8. UI hiding is never sufficient authorization; protected actions require server-side enforcement.

The real-system security baseline must include, at minimum:

- active-account enforcement;
- password authentication with generic failure behavior;
- login attempt rate limiting;
- MFA for privileged roles according to approved policy;
- TOTP enrollment/challenge/recovery lifecycle;
- MFA attempt rate limiting;
- session ID regeneration after authentication;
- session invalidation and CSRF token regeneration on logout;
- server-side policies/gates/middleware/service authorization;
- office/department scoping;
- negative authorization tests;
- audit events for allowed/denied/failed security-relevant mutations;
- request correlation where applicable;
- private document/file authorization;
- CSRF protection;
- HTTPS-only production transport;
- secure/HttpOnly/SameSite session-cookie configuration appropriate to deployment;
- secrets management outside source control;
- database network isolation;
- encrypted backup strategy;
- tested backup/restore procedure;
- centralized operational/security logging and alerting;
- dependency/vulnerability review;
- privacy, retention, and records-governance review;
- disaster-recovery plan;
- production audit retention/tamper-resistance strategy.

## Prototype/showcase purge law

The following are different classes and must be handled differently.

### A. Runtime bypasses / demo authorities

Examples include:

- `ShowcaseSession` authentication/authorization behavior;
- showcase persona/session state;
- demo-password or prototype credential conventions;
- runtime routes/providers that exist only to simulate a presentation persona;
- any security exception that exists only because a stakeholder presentation needed easier access.

Target: **remove from the real-system runtime path**.

### B. Prototype-only domain implementations

Examples include current prototype messaging classes/routes/table/hooks.

Target: **replace with authoritative domain behavior and migration strategy; do not merely rename classes/tables**.

### C. Static/reference product surfaces

Examples include frontend-backed meeting, announcement, project/PPA, procurement, or other municipal reference datasets presented as if they were live operational state.

Target: **replace with authoritative backend state, clearly subordinate as reference-only material, or remove from the operational product until authoritative**.

### D. Product-facing wording/context

Examples include active labels such as `Prototype`, `Showcase`, `Demo`, seeded persona instructions, showcase-only onboarding copy, and presentation-specific descriptions.

Target: **remove or rewrite once the backing behavior is real**.

### E. Historical evidence

Examples include old Forge evidence, accepted showcase records, tags, and historical planning documents.

Target: **preserve as history**. Do not rewrite history to create a false impression that the showcase phase never existed.

## Current high-priority active purge targets

R0 must fully inventory these before product-code mutation begins:

- `config/showcase.php`;
- `app/Services/ShowcaseSession.php`;
- `app/Http/Controllers/ShowcaseSessionController.php`;
- `app/Providers/ShowcaseServiceProvider.php`;
- showcase session sharing in `HandleInertiaRequests`;
- showcase/persona state in shared frontend types;
- showcase-aware login payloads;
- showcase-aware onboarding/tour behavior;
- showcase UI/session controls in shell/footer/layout;
- `RequireMfaAssurance` showcase bypass;
- active showcase/prototype routes;
- `PrototypeMessage` and `app/Prototype/Messaging/*`;
- prototype messaging migrations/controllers/hooks/components;
- `config/prototype.php` and any active demo credential contract;
- static/reference data that currently drives operational-looking pages;
- tests whose only purpose is to validate presentation bypasses rather than real-system behavior.

This is an inventory floor, not a claim of completeness.

## Required security comparison during R0

R0 must compare the current repository against the reviewed security reference and classify every relevant control as:

- preserved and active;
- preserved but obscured by showcase context;
- weakened by showcase/runtime bypass;
- drifted from the reference;
- superseded by a stronger current implementation;
- missing and requiring restoration;
- deployment-only and not yet proven.

At minimum inspect:

- authentication controller;
- MFA service;
- authentication assurance service;
- authentication attempt limiter;
- active-account middleware;
- MFA subject/assurance middleware;
- user MFA fields/casts/hidden attributes;
- login and MFA UI;
- audit logger and audit queries;
- authorization policies/gates/capabilities;
- file/document access service;
- CSRF/session configuration;
- integration authentication/scope/rate/idempotency controls;
- environment defaults;
- error handling;
- backup/deployment scripts and documentation;
- security feature tests and negative authorization tests.

## Non-negotiable transition rules

- Do not remove security controls merely because they were originally documented under a prototype phase.
- Do not re-create MFA if the current implementation is already correct; remove the bypass and revalidate it instead.
- Do not remove historical evidence.
- Do not rename prototype classes/tables and call the domain real.
- Do not expose static fixtures as authoritative municipal state.
- Do not weaken authorization to simplify migration.
- Do not permit front-end visibility rules to replace backend authorization.
- Do not seed or document production shared credentials.
- Do not claim HTTPS, encrypted backups, centralized alerting, DR, tamper-resistant audits, or production network isolation without deployment evidence.

## Immediate execution state

Current phase remains:

`R0 — REAL-SYSTEM BASELINE AUDIT`

Product-code mutation remains:

`FORBIDDEN DURING R0`

Allowed work now:

- exhaustive prototype/showcase runtime inventory;
- security delta matrix against the legacy/reference repository;
- active-vs-historical wording classification;
- exact source-path removal/replacement plan;
- test and migration plan;
- bounded Code Writer handoffs for the first implementation lane.

The first implementation lane after R0 should remove real-system security bypasses and presentation-only runtime authority before broad product expansion.
