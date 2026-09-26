# AGENTS.md — ONE TALIBON V1 GOVERNANCE

## Human authority

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

**Technical Authority: Kirch Ivan Balite**

Kirch Ivan Balite is the sole human Technical Authority for architecture, product scope, authority transitions, integration, promotion, release disposition, deployment authorization, and destructive repository operations.

All other contributors are **Developers / Contributors** unless Kirch explicitly issues a repository-local bounded delegation.

A contributor may perform implementation, frontend, backend, DevOps, QA, review, documentation, or operator work. Those functions do not independently grant Technical Authority.

## Forge operating roles

Forge roles are bounded working roles, not ownership titles.

- Maintainer coordinates under Technical Authority.
- Code Writer implements a bounded handoff.
- Reviewer inspects evidence and reports defects/disposition.
- Acceptance evaluates a stated promotion contract when explicitly authorized.
- Integration Writer performs an explicitly authorized integration.

No operating role may silently override the Technical Authority.

Writers do not self-promote. Review is not promotion. Build evidence is not runtime evidence. Runtime evidence is not deployment evidence.

## Current authority

The repository has completed DA1 → RC1 → RV1 → main promotion → archival preservation → remote branch cleanup.

Sole continuing remote branch:

`main`

Exact RV1-validated and promoted product payload:

`f6208cf082c4b1d189c70728adfdb9ddf3225990`

Historical non-main branch tips are preserved under verified `archive/branch/*` tags.

Deleted historical branch names in evidence records remain provenance and must not be treated as live refs.

## Current transition

MP3 governance closeout and MP4 final prototype-day rehearsal / Developer Acceptance Test are complete as bounded pre-deployment work.

Current authorized program:

`MP5 — POST-DAT FRONTEND CORRECTION`

MP5 source baseline:

`main@615529ce6663933dd3eeee4d504d14d1f21b626d`

Coordination branch:

`KIRCH-TALIBON-MP5-POST-DAT-FRONTEND-CORRECTION`

MP5 is limited to DAT-backed frontend behavior, density, information architecture, and presentation corrections. Maximum active Code Writers: **2**. Deployment remains separately authorized.

## Evidence precedence

When information conflicts:

1. directly observed live Git/runtime state;
2. explicit instruction from Kirch Ivan Balite as Technical Authority;
3. current repository-local governance;
4. accepted/review evidence;
5. historical documentation;
6. chat memory.

Do not silently reconcile a material conflict.

## Branch policy

`main` remains the accepted product branch.

MP5 explicitly authorizes temporary coordination and writer branches that descend from the exact MP5 baseline or a later exact accepted MP5 integration baseline. At most two writer branches may be active concurrently.

Do not recreate historical branches merely because older evidence references them.

Every temporary MP5 branch requires a repository-local bounded handoff.

Do not force push or rewrite accepted history.

## Product direction

ONE TALIBON should present as a dense, credible municipal digital workspace used for day-to-day coordination.

Do not add fake actions, fake efficiency metrics, AI branding, startup marketing language, decorative product theater, or non-working controls.

Primary actions shown to stakeholders must work.

## Security boundary

Preserve authentication, authorization, sessions, CSRF, MFA, audit logging, private-file controls, and role/office visibility boundaries.

Security implementation remains functional even when security is not an ordinary presentation surface.

## Validation discipline

Only claim what actually ran.

Valid evidence states include:

`PASS`, `FAIL`, `NOT RUN`, `NOT OBSERVED`, and `UNKNOWN`.

The historical aggregate DA1 pass marker and historical H0 exact marker were not observed and must not be invented.

Prototype rehearsal, deployment, UAT, production readiness, and commercial completion remain separate claims.
