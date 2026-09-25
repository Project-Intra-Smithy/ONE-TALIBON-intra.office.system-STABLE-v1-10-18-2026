# AGENTS.md — ONE TALIBON V1 GOVERNANCE

## Human authority

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

**Technical Authority: Kirch Ivan Balite**

Kirch Ivan Balite is the sole human Technical Authority for architecture, product scope, authority transitions, integration, promotion, release disposition, deployment authorization, and destructive branch cleanup.

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

Current hardened product authority entering DA1:

`KIRCH-TALIBON-BH1-BACKEND-RUNTIME-HARDENING@27824223d5169c8eadf16ab863d09aab9585db9c`

Current audit branch:

`KIRCH-TALIBON-DA1-PROTOTYPE-DAY-BLOCKER-AUDIT`

CAL1 is feature-frozen.

BH1 is reviewed and closed.

`main` is not yet the current hardened product authority and must not be promoted by force.

## Evidence precedence

When information conflicts:

1. directly observed live Git/runtime state;
2. explicit instruction from Kirch Ivan Balite as Technical Authority;
3. current repository-local governance;
4. accepted/review evidence;
5. historical documentation;
6. chat memory.

Do not silently reconcile a material conflict.

## Prototype-day program

Until the prototype-day consolidation program closes:

- no unrelated feature wave;
- no speculative backend optimization;
- no Calendar redesign;
- no deployment from stale historical branches;
- no branch deletion before validated main promotion and archival preservation;
- only confirmed blockers/material hindrances may trigger product repair.

## Branch policy

Temporary writer/audit/reconciliation branches are allowed only as necessary to reach the single-branch target.

Target end state:

```text
main
```

Before deleting non-`main` branches, preserve required historical branch tips with archival tags and verify the promoted `main` lineage.

Do not force push or rewrite accepted history.

## Product direction

ONE TALIBON should present as a dense, credible municipal digital workspace already used for day-to-day coordination.

Do not add fake actions, fake efficiency metrics, AI branding, startup marketing language, decorative product theater, or non-working controls.

Primary actions shown to stakeholders must work.

## Security boundary

Preserve authentication, authorization, sessions, CSRF, MFA, audit logging, private-file controls, and role/office visibility boundaries.

Security implementation remains functional even when security is not an ordinary presentation surface.

## Validation discipline

Only claim what actually ran.

Valid evidence states include:

`PASS`, `FAIL`, `NOT RUN`, `NOT OBSERVED`, and `UNKNOWN`.

Prototype-day readiness requires exact-SHA runtime proof, not source confidence.
