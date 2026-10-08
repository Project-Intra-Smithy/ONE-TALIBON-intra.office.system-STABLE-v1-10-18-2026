# A01-W02 — Task architecture and office reference (R1)

**Status:** Design preparation approved by Kirch, 09 October 2026. Code and migration implementation not released.
**Source:** Backend `main@509ce231ca2370b40e2699f1e004b3c587b3133f`; W02 branch. Siris's returned governance guidelines remain proposed until LGU process-owner confirmation. Three office-folder screenshots supplied by Kirch are directory evidence, not permission grants.

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
| 15 | **Missing from supplied screenshots** |
| 16 | TITT (Talibon Integrated Transport Terminal) |
| 17 | MDRRMO (Municipal Disaster Risk Reduction & Management Office) |
| 18 | MENRO (Municipal Environment Natural Resource Officer) |
| 19 | General Services Office |
| 20 | TPC |

**23 visible entries.** Item 15 is absent. `TPC`, complete `LEDIPO` label and possible 01/02 suboffice hierarchies require verification. Drive folder ordinals are not DB keys.

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

Kirch has approved **preparation of this design**, not an executable W02 code release. Before implementation, freeze the exact additive columns/migrations, Task history strategy, actor capabilities, migration compatibility and negative tests. Confirm LGU office identities, delegated roles, confidentiality, return and acceptance rules before granting those privileges. W03/C1 remain gated.

[Proposed policy intake and outstanding LGU confirmations](A01-W02-TRACK-W-PROPOSED-POLICY.md).
