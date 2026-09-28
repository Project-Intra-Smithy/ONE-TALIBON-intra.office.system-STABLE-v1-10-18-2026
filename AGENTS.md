# AGENTS.md — ONE TALIBON V1 GOVERNANCE

## Human authority

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Technical Authority:

**Kirch Ivan Balite**

No contributor, automated agent, branch owner, Reviewer, Writer, Acceptance role or commit volume independently grants product or promotion authority.

## Forge role model

- **Maintainer** — controls repository truth, sequencing, handoffs, evidence, acceptance/promotion coordination and anti-drift.
- **Code Writer** — implements only an exact bounded handoff.
- **Reviewer** — inspects; does not repair or promote.
- **Acceptance** — evaluates an exact promotion contract.
- **Integration Writer** — integrates only when explicitly authorized.

Writers do not self-accept or self-promote.

## Current product authority

Accepted application/runtime payload:

`314b6661b34d4a70272d2a079f7cdda238b522ae`

State:

`B1 ACCEPTED / PROMOTED`

Designation:

`PROTOTYPE BACKEND BASELINE`

Always resolve live `main` from Git because governance-only commits may advance the repository without changing the accepted product payload.

## Current mission

`SEPTEMBER 30, 2026 — 3:00 PM PROTOTYPE SHOWCASE`

Expected audience:

`16-20`

Current phase:

`S1 — LIGHT UI CORRECTIONS & PRESENTATION FLOW LOCK`

Mandatory sequence:

`BACKEND FREEZE -> LIGHT UI -> INTEGRATED VALIDATION -> TUNNEL REHEARSAL -> FULL DRESS REHEARSAL -> FREEZE -> SHOWCASE`

## Product direction

ONE TALIBON must present as a dense, credible municipal digital workspace used for real coordination.

Primary actions shown to stakeholders must work.

Do not add fake actions, fake efficiency metrics, AI branding, startup marketing language or decorative product theater.

## Showcase scope rule

Every remaining task must answer:

`Does this materially increase the probability that the showcase succeeds?`

If not, defer it.

Current authorized work is presentation-critical UI refinement, exact integrated validation, deterministic demo preparation, Cloudflare Quick Tunnel delivery rehearsal, recovery rehearsal and final presentation operations.

Broad backend work is frozen unless direct rehearsal evidence proves a blocker.

## Security boundary

Preserve authentication, authorization, sessions, CSRF, MFA, audit behavior, private-file controls and role/office visibility.

Presentation convenience does not authorize weakening security boundaries.

## Database boundary

Protected UAT:

`talibon_portal`

Disposable engineering/test:

`talibon_portal_test`

Never destructively test against UAT.

## Evidence discipline

Only claim what ran.

Valid states include:

`PASS`, `FAIL`, `NOT RUN`, `NOT OBSERVED`, `UNKNOWN`.

Build evidence is not runtime evidence.

Runtime evidence is not tunnel/deployment evidence.

Quick Tunnel presentation transport is not final production-hosting acceptance.

## Freeze discipline

After the final dress rehearsal passes, the exact known-good state is protected.

Do not perform last-minute refactors, dependency updates, schema changes, architecture work or aesthetic experiments after freeze.

Only a reproducible showstopper may break freeze.
