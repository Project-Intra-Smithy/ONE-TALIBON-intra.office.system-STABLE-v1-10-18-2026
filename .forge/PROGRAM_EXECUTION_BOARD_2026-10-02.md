# KIRION FORGE — REAL-SYSTEM PROGRAM EXECUTION BOARD

Date: 2026-10-02

Program branch: `KIRION-INTRA-REAL-SYSTEM-TRANSITION`

This board operationalizes the Tech Lead master plan. It is a planning/control artifact, not proof that any product-code lane has been executed.

---

# A. Program state

Current gate: `R0 / W0 — BASELINE AUDIT`

Product-code state: `FROZEN`

Allowed now:

- evidence gathering;
- source-path inventories;
- architecture/decision records;
- test inventories;
- migration plans;
- Code Writer handoffs;
- Reviewer/Acceptance criteria.

Forbidden now:

- broad product-code changes;
- opportunistic prototype renames;
- specialized department workflow implementation by assumption;
- merge to `main`.

---

# B. Workstream map

| ID | Workstream | Priority | Depends on | Output | Exit gate |
|---|---|---:|---|---|---|
| GOV-01 | Program governance / exact-SHA discipline | P0 | none | SSOT, master plan, board, ADR discipline | active throughout |
| AUD-01 | Active prototype/showcase inventory | P0 | none | path-by-path classification | complete R0 matrix |
| SEC-01 | Security delta vs reference repo | P0 | none | preserved/drifted/missing control matrix | accepted security audit |
| DATA-01 | Static/reference data inventory | P0 | none | source-of-truth map | all operational-looking surfaces classified |
| CI-01 | CI/workflow inventory | P0 | none | keep/replace/archive matrix | real-system CI plan accepted |
| SEC-02 | Remove showcase MFA/presentation authority | P0 | AUD-01, SEC-01 | bounded implementation candidate | negative security suite PASS |
| ID-01 | Active product identity cleanup | P0 | SEC-02 | real-system wording/config/runtime cleanup | no active false prototype/showcase context |
| TASK-01 | First-class Task domain | P0 | SEC-02 | Task backend/lifecycle/tests | same-office task accepted |
| WORK-01 | My Work aggregate | P0 | TASK-01 | Task + Work Request projections | role matrix PASS |
| OFFICE-01 | My Office workspace | P0 | WORK-01 | durable office workspace | Department Head/employee UX accepted |
| ARCH-01 | Folders / office archive | P0 | OFFICE-01 | office folder/register backend | safe create/move/archive/delete/restore tests |
| WR-01 | Work Request taxonomy/config | P1 | SEC-02 | configurable category/type/action metadata | dynamic configuration accepted |
| MEET-01 | Meeting Minutes backend | P1 | TASK-01 | meeting lifecycle/action items | Meeting -> Task flow accepted |
| NOTICE-01 | Announcements/Advisories backend | P1 | SEC-02 | audience/publish/expire domain | authorization + lifecycle PASS |
| MSG-01 | Messaging authority replacement | P1 | SEC-02 | real conversation/membership model | membership/retention/security PASS |
| RECORD-01 | Records lifecycle foundation | P1 | ARCH-01 | declaration/classification/custody/archive | no RMS overclaim; accepted lifecycle |
| LINK-01 | Cross-domain coordination | P1 | TASK-01, MEET-01, MSG-01 | safe links/events | integration tests PASS |
| SEARCH-01 | Permission-aware global search | P1 | ARCH-01, RECORD-01 | multi-domain authorized search | negative visibility tests PASS |
| REPORT-01 | Operational reports | P1 | WORK-01, RECORD-01 | authoritative projections/export | report scope tests PASS |
| MASTER-01 | Shared master-data registry | P1 | R0 findings | canonical data contracts | duplicate-source mapping accepted |
| API-01 | Integration contract hardening | P1 | MASTER-01 | scoped/versioned API rules | auth/rate/idempotency tests PASS |
| DISC-01 | Department discovery standard | P0 | generic core direction | interview artifacts/config decisions | process-owner signoff |
| SPEC-xx | Specialized domain lanes | P2 | DISC-01 | Budget/Procurement/etc. as needed | per-domain acceptance |
| OPS-01 | Deployment architecture | P0 before production | core maturity | cloud/local/hybrid decision | architecture acceptance |
| OPS-02 | Secrets/TLS/session/network hardening | P0 before production | OPS-01 | production config/runbook | security evidence PASS |
| OPS-03 | Backups/restore/DR | P0 before production | OPS-01 | tested backup/restore | restore drill PASS |
| OPS-04 | Logs/alerts/observability | P0 before production | OPS-01 | health/log/alert stack | incident drill/evidence |
| PILOT-01 | Controlled office pilot | P0 before rollout | core + OPS gates | UAT/pilot evidence | pilot acceptance |
| RELEASE-01 | Real-system promotion | P0 | all release gates | accepted candidate -> `main` | Technical Authority promotion |

---

# C. R0 audit matrix required columns

Every path/domain finding must include:

1. Area/domain.
2. Exact source path(s).
3. Exact current behavior.
4. Classification: authoritative / partial / projection / prototype bridge / static-reference / missing / deployment-only.
5. User-facing claim currently made.
6. Intended real-system behavior.
7. Gap.
8. Security impact.
9. Data/migration impact.
10. Test impact.
11. Recommended action: KEEP / EXTEND / PROMOTE / REPLACE DATA SOURCE / REMOVE ACTIVE CONTEXT / DEFER / PRESERVE HISTORY.
12. Owning implementation lane.
13. Blocking dependency.
14. Reviewer evidence required.

---

# D. First implementation lane — SEC-02

## Scope floor

Inspect and, after R0 acceptance, remove from real-system runtime authority:

- `config/showcase.php` where active runtime behavior is no longer valid;
- `ShowcaseSession` authorization/authentication coupling;
- `ShowcaseSessionController` access shortcuts;
- `ShowcaseServiceProvider` active routes where presentation-only;
- showcase data shared by `HandleInertiaRequests` where it drives authority;
- showcase/persona state in shared frontend types where active product depends on it;
- showcase-aware login payloads;
- showcase MFA bypass in `RequireMfaAssurance`;
- presentation persona session controls in shell/footer/layout;
- demo/shared credential contracts from `config/prototype.php` if still active;
- tests validating showcase authentication bypass.

## Must preserve

- `MfaService` behavior;
- MFA migrations/data fields/versioning;
- `AuthenticationAssurance` core checks;
- `AuthenticationAttemptLimiter`;
- `RequireMfaSubject`;
- login active-account enforcement;
- login/MFA rate limits;
- session regeneration;
- logout invalidation + CSRF token regeneration;
- audit logger/security events;
- backend authorization and private-document controls.

## Required tests

- privileged user redirected to enroll/challenge if not assured;
- active showcase/session residue has no authority;
- valid TOTP grants assurance;
- invalid TOTP rate-limits;
- recovery code accepted once only;
- MFA reset invalidates prior session proof;
- inactive user denied;
- logout destroys authenticated/assurance state;
- protected application routes require `auth + active + mfa.assured` as intended.

---

# E. Core-domain lane acceptance summaries

## TASK-01

PASS only if:

- same-office work can be created without a fake receiving office;
- assignee belongs to permitted organizational scope;
- task lifecycle is server-authoritative;
- due/overdue and history are deterministic;
- evidence/doc links work;
- unauthorized users cannot read/mutate;
- Work Request behavior remains unchanged.

## WORK-01

PASS only if:

- My Work aggregates Tasks and routed Work Requests without conflating IDs/lifecycles;
- employee, Department Head, executive and admin views remain correctly scoped;
- counts/previews and detailed registers agree;
- waiting-on-others and due/overdue semantics remain correct.

## OFFICE-01 / ARCH-01

PASS only if:

- every office uses the same generic workspace foundation;
- access follows office/role policy;
- default 15 categories are available as organizational views/registers;
- documents are linked/reused rather than copied unnecessarily;
- folder deletion cannot silently delete institutional records;
- archive/recycle/restore behavior is explicit and audited.

## WR-01

PASS only if:

- category/type/action lists are configurable;
- receiving office options derive from authoritative routable offices;
- assignee selection obeys office/policy scope;
- extended metadata is conditional;
- one reference identity survives routing;
- no department-specific controller explosion is introduced.

## MEET-01

PASS only if:

- meetings are backend-authoritative;
- agenda/participants/minutes/decisions/action items persist;
- Draft/For Review/Approved states are enforced;
- action items can produce Tasks/Work Requests without duplicating accountability;
- calendar projection is linked, not duplicated ownership.

## NOTICE-01

PASS only if:

- notices are backend-authoritative;
- issuing office/audience/priority/publish/expiry persist;
- unauthorized audience cannot access;
- acknowledgement/read behavior is explicit when enabled.

## MSG-01

PASS only if:

- membership controls visibility;
- channels/conversations are authoritative;
- persistence/read state/retention are defined;
- attachments are authorized;
- messages can link/create formal work but are not themselves the work record.

## RECORD-01

PASS only if:

- record declaration/classification/custodian/archive state exists;
- source object/document links are durable;
- lifecycle actions are audited;
- retention/disposition claims do not exceed implemented policy.

---

# F. UI/IA execution notes

The backend domain model must stay independent from menu labels.

Current operational shell candidate:

- Dashboard
- My Office
- Work Requests & Document Tracking
- Document Archives
- Meeting Minutes
- Tasks & Projects
- Calendar & Whereabouts
- Budget & Procurement
- Office Directory
- Messages & Advisories
- Reports
- Administration

Broader areas such as PPAs, Development Plans, Project Monitoring, LSBs, Data & Analytics, Forms/Templates, Knowledge Hub and Systems/Apps may remain reachable through workspaces/apps/quick links according to authorization.

Do not reintroduce an overloaded 20+ item sidebar simply because reference data contains those categories.

---

# G. Data-source truthfulness board

Every visible screen must eventually be tagged internally as one of:

- AUTHORITATIVE LIVE
- AUTHORITATIVE DERIVED / PROJECTION
- REFERENCE ONLY
- HISTORICAL
- PLANNED / UNAVAILABLE

Forbidden: a static fixture presented with no indication as if it were live municipal truth.

Priority known surfaces for R0 classification:

- Meetings
- Announcements
- Project Monitoring
- PPAs
- Procurement
- Municipal Systems
- Development Plans
- Local Special Bodies
- dashboard cards derived from reference arrays
- showcase personas/sample accounts

---

# H. Security backlog board

## Application security

- [ ] Remove showcase MFA bypass.
- [ ] Remove presentation persona authority.
- [ ] Revalidate privileged-role MFA policy.
- [ ] Revalidate active-account middleware.
- [ ] Revalidate login/MFA rate limits.
- [ ] Revalidate session fixation protections.
- [ ] Revalidate CSRF coverage.
- [ ] Review authorization for every mutation route.
- [ ] Review query scoping for every list/search/report route.
- [ ] Review private file download authorization.
- [ ] Review classification-aware document/record access.
- [ ] Review admin impersonation/support behavior if any.
- [ ] Review integration credential scopes/rate/idempotency.

## Deployment security

- [ ] HTTPS/TLS termination defined.
- [ ] `SESSION_SECURE_COOKIE=true` in production.
- [ ] cookie SameSite/domain policy defined.
- [ ] production secrets stored outside repo.
- [ ] production debug disabled.
- [ ] database not publicly exposed.
- [ ] backup encryption/access policy defined.
- [ ] restore drill performed.
- [ ] application/security logs centralized.
- [ ] alerting thresholds defined.
- [ ] dependency/vulnerability scan gate active.
- [ ] production audit retention strategy defined.
- [ ] DR/contact/runbook documented.

---

# I. Release evidence packet

Every candidate release must carry:

- exact base SHA;
- exact candidate SHA;
- changed-file list;
- migration list;
- rollback notes;
- test commands/results;
- failed-test explanation if any;
- security negative-test results;
- screenshots/browser evidence for critical UX;
- migration/data validation evidence;
- performance/smoke evidence where applicable;
- Reviewer verdict;
- Acceptance verdict;
- known residual risks;
- release notes;
- deployment/runbook delta.

---

# J. Stop conditions

Stop and return to Tech Lead if any lane discovers:

- a required business rule not supported by collected evidence;
- an approval/signature rule requiring Department Head/legal validation;
- a migration that could destroy or orphan accepted data;
- a security change that weakens current backend controls;
- a cross-domain change that collapses Task/Work Request/Correspondence/Record meanings;
- a need to alter public-site scope or unrelated backend;
- a deployment assumption not accepted by Technical Authority;
- branch/source SHA drift from the handoff.

The correct response to uncertainty is not invention; it is a bounded decision request.
