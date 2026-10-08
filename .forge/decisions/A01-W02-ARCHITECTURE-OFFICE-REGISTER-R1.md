# A01-W02 — Task architecture and office reference (R1)

**Status:** W02 CORE EXECUTION CANDIDATE DEFINED / KIRCH RELEASE REQUIRED. Design preparation approved 09 October 2026; executable code and migrations not yet released.
**Source:** Backend `main@509ce231ca2370b40e2699f1e004b3c587b3133f`; W02 branch. LGU consultation was completed through Siris; returned guidelines are the development baseline. Actual office/head/delegate account activation and formal adoption evidence remain separately verifiable. Three office-folder screenshots supplied by Kirch are directory evidence, not permission grants.

## Existing foundation

- `Task` stores `state` as unrestricted text, creator/assignee User IDs, source reference and timestamps. It has no official/personal classification, office ownership, delegated issuer or Task event history.
- `Department` already has `branch`, `office_type`, `parent_department_id`, `is_active` and `is_routable`. `Employee` links to `User` and `Department`. Reuse these before creating another department structure.
- General `AuditLogger` and `audit_logs` already exist. Assess whether Task transitions require an additional append-only domain event stream; do not build a redundant global audit log.
- Keep W01 migration intact and preserve Work Request/Correspondence independence.

## Proposed additive design (schema subject to separate approval)

| Need | Candidate implementation | Constraint |
| --- | --- | --- |
| Official vs individual | `tasks.task_kind` service-validated `official/individual` | Backfill existing Tasks explicitly; no assumed defaults |
| Owning office | `tasks.owning_department_id` FK; consider issuing office separately only if essential | Official department comes from approved DB registry, not Drive folder number |
| Issuing authority | `issued_by_user_id` or event-level `acting_for_user_id` | Encode actor and accountable issuer separately; avoid duplicate fields |
| Confidentiality | Task classification and narrowly scoped access decision | No blanket Department Head or Mayor access without confirmed scope |
| Delegation | Candidate scoped grants: issuer/grantee, department, actions, valid window, revocation, approval source | Least privilege; verifiable and revocable |
| History | Candidate Task event: actor, action, time, before/after, authority reference and reason | One transactional append-only Task history, compatible with existing audit service |
| Lifecycle | Guarded state transitions with server-owned timestamps | Return, supervisory acceptance, cancellation and reopening need final semantics |

**Security baseline:** authenticate active actor; default deny unknown office/delegate/executive capabilities; verify source and current DB state in transaction; lock before transitions; reject forged IDs, stale updates, confidentiality leaks and cross-office actions. Personal Tasks cannot issue official instructions. A return request is not automatic cancellation or supervisor approval. No Task HTTP endpoints in W02; W03 owns the API.

**Validation:** invalid/terminal transitions, creator forgery, unauthorized assignment, cross-office enumeration, revoked delegation, inactive actors, confidential/executive access, concurrent updates, audit integrity, source nonmutation, and W01/Work Request regressions. Executable test results pending.

## Executive directory — supplied Drive labels

These are folder labels; hierarchy and system department IDs require confirmation. Preserve the displayed names and numbering.

| Code | Folder label |
| --- | --- |
| 01 | MAYOR'S OFFICE |
| 01.1 | Municipal Administrator |
| 01.2 | Talibon Traffic Management Office |
| 02 | MPDC (Municipal Planning and Development Coordinator) |
| 02.1 | MPDC (Zoning Administration) |
| 02.2 | LEDIPO (Local Economic Development Investment Promotion Officer |
| 03 | MEO (Municipal Engineering Office) |
| 04 | MAssO (Municipal Assessor's Office) |
| 05 | MAO (Municipal Agriculture's Office) |
| 06 | MHO (Municipal Health Office) |
| 07 | MCR (Municipal Civil Registrar) |
| 08 | MSWDO (Municipal Social Welfare and Development Office) |
| 09 | MBO (Municipal Budget Office) |
| 10 | MAcctO (Municipal Accounting Office) |
| 11 | MTO (Municipal Treasurer's Office) |
| 12 | HRMO (Human Resource Development Office) |
| 13 | MunPESO (Municipal PESO Manager Office) |
| 14 | MunTO (Municipal Tourism Office) |
| 15 | MARKET (Talibon Market Office) |
| 16 | TITT (Talibon Integrated Transport Terminal) |
| 17 | MDRRMO (Municipal Disaster Risk Reduction & Management Office) |
| 18 | MENRO (Municipal Environment Natural Resource Officer) |
| 19 | General Services Office |
| 20 | TPC |

**24 visible Executive folder entries across all screenshots.** Kirch's supplementary screenshot identifies **15 MARKET (Talibon Market Office)** between 14 MunTO and 16 TITT. The missing label is resolved; official office-ID/role mapping is not. `TPC`, the complete `LEDIPO` label, and possible 01/02 suboffice hierarchies still require verification. Folder numbers are not database keys.

## Legislative directory — supplied Drive labels

| Code | Folder label | Caution |
| --- | --- | --- |
| 01 | VICE MAYORS OFFICE | Possible office |
| 02 | 12TH SANGGUNIANG BAYAN | Possible legislative body |
| 03 | SB SECRETARY | Possible office |
| 04 | ENACTED ORDINANCES | Likely record category |
| 05 | SB RESOLUTIONS | Likely record category |
| 06 | SB COMMITTEE HEARING | Likely records/workflow category |
| 07 | Board Member of 2nd District | Role/relationship to confirm |

Do not seed these seven as seven departments or grant cross-branch access. The screenshot does not establish official office classification.

## Office mapping and implementation gates

Reconcile `Drive label → official office name/code → departments.id → branch/office_type → approved parent → responsible User/Employee → delegation limits` with LGU process owners. The Drive owner `talibonofficial` is not the Task authorizer for each folder.

### Bounded W02 core candidate — one implementation branch, no new issue

**Source:** Recheck this existing W02 branch head before writes; `main` remains accepted baseline. **Owner/executor:** `Kirch-Nairu`; no Kirion delegation. **State:** NOT RELEASED until Kirch explicitly approves the final candidate.

| Core component | Proposed release boundary |
| --- | --- |
| Task classification | Additive nullable `task_kind` (`individual`/`official`) and nullable `owning_department_id` FK. Legacy rows remain distinguishable and readable; no inferred migration/backfill to official office authority. New individual Tasks require validated active-user/linked employee identity; official issuance remains unavailable. |
| Lifecycle | Enforce `open → in_progress → completed` for **new individual Tasks only**, under an explicit Task service. `completed_at` set by server; no Task action HTTP endpoints. `return`, `cancel`, `reopen`, supervisor acceptance and official assignment remain unavailable until frozen. Existing W01 `state` persistence fixtures are not silently reinterpreted as approved transitions. |
| Authorization | Task-specific default-deny policy and visibility query: only verified current Task actor/owner may act in approved core paths. Never import Work Request permissions, or confer manager/Mayor, delegated or cross-office access from a role string or a folder label. |
| Audit consistency | Prefer a Task event record written **atomically** with each permitted Task mutation (actor, action, state before/after, timestamp, context), after reviewing whether the existing `AuditLogger` can supply the required domain history. Schema/immutability and deletion/retention contract to be frozen before code. |
| Tests | New individual Task lifecycle happy-path plus inactive/unbound actor, forged creator, unauthorized assignee/office, stale/concurrent transition, terminal mutation, audit rollback, unknown/legacy state, source-link nonmutation and existing W01/Work Request regressions. Run PostgreSQL against a verified disposable test DB; report exact commit and evidence. |

**Expected owned paths (finalize exact names on release):** additive Task migration(s); `app/Domain/Tasks/*` for state/policy/service; optional `app/Models/TaskEvent.php` and Task model extensions; `tests/Feature/Tasks/*`. **Prohibited:** editing W01's accepted create-tasks migration, Work Request/Correspondence, shared roles/auth, frontend, live Task routes, real department seeding or production DB.

**Next control:** Kirch approves or adjusts this *single* bounded subset and issues the exact-SHA write release. No need to repeat completed LGU consultation. W03 begins only after W02 acceptance; a partial frontend API requires actual implemented and tested W03 endpoints, not a promise.

[Proposed policy intake and outstanding LGU confirmations](A01-W02-TRACK-W-PROPOSED-POLICY.md).
