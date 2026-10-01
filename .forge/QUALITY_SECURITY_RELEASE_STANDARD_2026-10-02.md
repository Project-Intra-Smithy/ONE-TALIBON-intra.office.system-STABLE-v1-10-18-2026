# KIRION FORGE — QUALITY, SECURITY, AND RELEASE STANDARD

Date: 2026-10-02

Applies to: `KIRION-INTRA-REAL-SYSTEM-TRANSITION` and all bounded implementation branches derived from it.

Purpose: define the minimum engineering standard for moving ONE TALIBON INTRA from showcase/prototype lineage into a defensible real municipal system.

---

# 1. Definition of Ready

A Code Writer lane is READY only when all applicable items are known:

- exact source branch and SHA;
- exact owned files/directories or bounded domain scope;
- intended behavior;
- preserved invariants;
- prohibited scope;
- security/authorization rules;
- data/migration impact;
- required negative tests;
- required regression tests;
- acceptance evidence;
- unresolved business rules are either answered or explicitly excluded.

No lane starts from vague instructions such as “make it production” or “remove prototype everywhere.”

---

# 2. Definition of Done

A lane is DONE only when:

1. implemented behavior matches the handoff;
2. unrelated architecture was not changed;
3. migrations are safe and reviewed;
4. authorization is enforced server-side;
5. applicable audit/events are emitted;
6. negative authorization tests pass;
7. existing preserved behavior passes regression tests;
8. frontend typecheck/build passes where changed;
9. backend tests pass where changed;
10. critical browser flow passes where applicable;
11. static/reference state is not falsely presented as authoritative;
12. Reviewer inspects exact candidate SHA;
13. Acceptance records PASS on exact candidate SHA.

A green UI alone is not done.

---

# 3. Security acceptance standard

## Authentication

Required invariants:

- inactive accounts cannot authenticate;
- successful password authentication regenerates session ID;
- privileged MFA policy is enforced without showcase/demo bypass;
- MFA assurance belongs to the authenticated user and current MFA version;
- recovery codes are stored hashed and consumed once;
- login/MFA attempts are rate limited;
- logout invalidates session and regenerates CSRF token.

## Authorization

Required invariants:

- deny by default for sensitive actions;
- users cannot access another office's restricted work solely by changing URL/ID;
- Department Head authority is bounded to authorized office/resource context;
- executive authority is explicit and not universal;
- system administration actions are auditable;
- private documents require backend access decision;
- search/report endpoints apply source-domain authorization, not post-filter UI hiding.

## Security-negative test minimum

For every sensitive feature, test at least:

- anonymous access;
- authenticated but inactive account where applicable;
- authenticated wrong role;
- authenticated wrong office;
- direct URL/object-ID attempt;
- invalid lifecycle transition;
- malformed/invalid request;
- valid authorized path.

---

# 4. Data and migration standard

Every migration lane must answer:

- what tables/columns/indexes change;
- whether existing rows are preserved;
- default/backfill strategy;
- nullability during transition;
- rollback strategy;
- foreign-key/orphan risk;
- identifier/reference stability;
- document/file link impact;
- performance/index impact;
- whether synthetic prototype data needs migration, archival, or deletion.

Rules:

- no destructive drop/rename of active data without migration evidence;
- no silent reinterpretation of an existing column's meaning;
- use new fields/tables + controlled backfill when semantic meaning changes materially;
- use transactions/locking for lifecycle mutations requiring atomicity;
- add indexes for expected lookup/scope paths;
- preserve stable public/reference IDs where external or user-facing references depend on them.

---

# 5. Domain integrity standard

## Task

Must remain capable of same-office ownership without receiving-office fiction.

## Work Request

Must preserve stable routed identity, origin/current office, assignment, due/aging and event history.

## Correspondence

Must remain official communication and may link to work without becoming the same record.

## Document

Must remain reusable evidence/artifact that can be linked from multiple domains.

## Record

Must not be equated with every document. Formal records claims require formal lifecycle controls.

## Message

Must not become the accountability source of truth.

## Meeting

Must own minutes/decisions/action items when promoted to authoritative state.

Any implementation that collapses these meanings requires explicit ADR/Tech Lead approval.

---

# 6. API and integration standard

All new machine-facing integration endpoints should use applicable:

- authenticated client identity;
- scoped permissions;
- input validation;
- rate limiting;
- idempotency keys for retryable mutations;
- correlation/request IDs;
- consistent error envelopes;
- audit logging for meaningful access/mutations;
- versioned contracts where external consumers could outlive one deployment;
- no raw database credentials or direct DB coupling.

Integrations must declare source of truth for each shared entity.

---

# 7. Logging and audit standard

Operational log and municipal audit event are not the same thing.

## Application/operational logs

Used for diagnostics, failures, performance, queue/worker status, deployment health.

## Audit events

Used for meaningful security/business lifecycle evidence.

Audit fields should include as applicable:

- actor user ID;
- employee ID;
- department ID;
- action code;
- entity type/ID;
- outcome;
- summary;
- correlation ID;
- request IP;
- user agent/session context where policy permits;
- timestamp.

Do not log secrets, MFA codes, passwords, full recovery codes, or unnecessary sensitive content.

---

# 8. File/document security standard

- storage path is never authorization;
- download endpoint must authorize current actor;
- file names should not be trusted as safe storage identifiers;
- checksum/integrity metadata should be retained;
- MIME/type/size validation applies on upload;
- executable content policy must be explicit;
- confidentiality/classification must affect access;
- document links must not bypass source-domain restrictions;
- deletion/archive semantics must preserve institutional evidence where required.

---

# 9. UI/UX quality standard

Every critical operational page should show the information needed to act, not just decorative metrics.

For routed work, prioritize:

- reference;
- subject/title;
- current office;
- current custodian;
- status;
- age/time at current stage;
- due/overdue state;
- expected next action;
- action history.

For forms:

- show only required/common fields initially;
- reveal conditional metadata when category/type requires it;
- label domain concepts correctly;
- preserve validation errors/input;
- protect destructive operations with clear confirmation/recovery;
- support keyboard/focus basics;
- maintain responsive layouts for common employee workflows.

No fake “live” counts from static arrays.

---

# 10. Performance baseline

No arbitrary performance claim is allowed without measurement.

Before pilot/production, measure representative:

- login + MFA challenge;
- Dashboard load;
- My Work overview;
- transaction list/search;
- transaction detail/history;
- document archive search;
- global search;
- report generation/export;
- file upload/download;
- notification feed.

Performance test data must be representative enough to expose query/N+1/index problems.

Targets are set after deployment topology and realistic volume assumptions are known.

---

# 11. Accessibility/responsive baseline

Critical paths should maintain:

- semantic controls/labels;
- keyboard-operable actions;
- visible focus;
- readable contrast;
- status not conveyed by color alone;
- modal/dialog focus handling where implemented;
- reasonable responsive behavior on common phone/tablet widths;
- error text associated with inputs.

This is a municipal employee tool; accessibility cannot be treated as showcase polish only.

---

# 12. CI gate standard

Every candidate lane should run the applicable subset of:

```text
composer test / php artisan test
npm run types:check
npm run build
critical Playwright/browser tests
security-negative feature tests
migration tests
```

Future real-system CI should additionally include dependency/vulnerability scanning when tooling is selected.

CI names and assumptions should describe normal engineering behavior, not one-time showcase-day operations.

---

# 13. Reviewer standard

Reviewer must verify:

- exact source SHA and candidate SHA;
- handoff scope respected;
- no hidden unrelated changes;
- architecture invariants preserved;
- authorization/server-side checks present;
- migration safety;
- negative tests meaningful;
- prototype/static data not promoted by wording only;
- error paths considered;
- rollback/recovery implications recorded.

Reviewer should not approve based only on implementer summary.

---

# 14. Acceptance standard

Acceptance verdict is one of:

- PASS — candidate satisfies bounded scope and gates.
- REWORK — direction is valid but defects must be corrected on same/replacement lane according to handoff.
- REJECT — architecture/scope is invalid and candidate is not promotable.

Acceptance must name exact candidate SHA.

No “looks good” promotion without SHA/evidence.

---

# 15. Release and deployment standard

Before a real production release, prove:

- production environment separated from local/test/showcase data;
- production debug off;
- TLS enforced;
- secure session cookie configuration;
- production secrets managed outside source;
- DB/network access constrained;
- storage permissions/private file serving validated;
- migrations tested against realistic snapshot;
- backup completed;
- restore drill completed;
- application/security logs centralized;
- health checks and alerts established;
- dependency/security review completed;
- rollback steps documented;
- incident/support contacts documented;
- launched-scope privacy/retention rules accepted;
- pilot/UAT accepted.

---

# 16. Rollback law

Every release candidate must answer:

- can application code roll back without schema mismatch;
- can schema roll back safely;
- if not, what forward-fix recovery exists;
- what data would be lost/changed;
- how files/queues/cache are handled;
- how a failed deployment is detected;
- who authorizes rollback.

Irreversible migrations require explicit Technical Authority awareness before release.

---

# 17. Production claim language

Allowed claim language must match evidence.

Examples:

- “authoritative Work Request backend” only if persisted, authorized, lifecycle-tested;
- “operational archive” if archive/search/access exists;
- “formal records management system” only after retention/disposition/legal lifecycle is implemented and accepted;
- “production-ready” only after operational/deployment gates pass.

Never use wording to outrun implementation maturity.
