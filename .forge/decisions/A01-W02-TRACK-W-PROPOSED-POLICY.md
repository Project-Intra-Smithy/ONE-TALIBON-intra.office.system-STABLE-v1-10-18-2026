# A01-W02 — Track W policy intake

**Status:** DISCOVERY RETURNED / PROPOSED POLICY / LGU APPROVAL PENDING  
**Source:** W02 discovery response forwarded by Kirch after Siris's intake assignment, 09 October 2026. Original respondent's name, position, issuing office, evidence reference and approval are **not supplied**. The response expressly says these are **proposed operational guidelines subject to process-owner confirmation and LGU approval**.  
**Execution:** Engineering decisions remain under Kirch. This document records inputs; it is **not an implementation release or authorization grant**.

## Proposed operating rules

| Area | Returned guidance | Implementation significance |
| --- | --- | --- |
| Enrollment | Department Heads initially; designated coordinators/encoders/users; admin approval required | Verify head/employee roster, approving office and provisioned capabilities |
| Official vs individual | Heads issue official office tasks; designated staff may encode under authority; staff manage individual work without issuing official instructions | Distinguish official/personal tasks and creator vs issuing authority |
| Visibility | Heads see office tasks; confidential work restricted; cross-office participation bounded; Mayor has qualified executive oversight | Explicit office scope, confidentiality restrictions and named executive permissions; **no global read grant** |
| Delegation | Heads primarily assign/reassign; delegated actions within scope; cross-office routing coordinated; OIC/head handles absent/transferred staff | Persist/verify delegation, office participation and acting-authority provenance |
| Return/closure | Staff may return for clarification/inability with reason; cannot independently cancel official work; head/supervisor resolves return, reassignment, cancellation, reopening and final acceptance | Separate employee request/report from authorized disposition; define completion vs final acceptance |
| Audit | Significant creation, assignment, delegation, reassignment, return, completion, cancellation and reopening recorded with actor/action/time | Task action history and attribution are required by **proposed** policy; decide retention, remarks, files, notification and approval details |

**Do not treat informal “department heads first” or this response as a verified access grant.** These are initial business-rule candidates.

## Existing code boundary (reviewed at product main 509ce231ca2370b40e2699f1e004b3c587b3133f)

- `Task` currently has title, instructions, unrestricted `state`, creator/assignee **User** IDs, optional source reference, due/completed timestamps.
- `Employee` has `department_id`, `supervisor_employee_id` and optional `user_id`; `Department` has hierarchy and active/routable fields; `User` has free-text `role` and `is_active`.
- **Not present in the W01 Task model:** official/personal classification, owning/issuing office, actor-on-behalf-of, bounded delegation grants, confidential visibility, task action/audit records, explicit final-acceptance status or lifecycle service.
- Existing Work Request/Correspondence policy must **not** be reused as Task authority without its own approved design. Passive source references must never mutate source workflows.

## W02 engineering core — safe to specify before LGU ratification

- Authorize operations from authenticated active actor identity and checked, scoped capabilities; **default deny** any unspecified head, executive or cross-office privilege.
- Validate Task state changes, immutable creator, fresh-record authorization and row-locked atomic transitions. Reject stale and forged state/assignee/timestamp input.
- Plan an append-only Task action log with actor, action, timestamp, previous/new values and context. The **schema, event set and retention rules still need architecture approval** before writes.
- Partition official Task permissions from individual Task permissions; **do not select storage columns, lifecycle vocabulary or grant staff privileges without Kirch's explicit architecture decision**.
- Tests to design: inactive/unknown actor, forged head/delegate, office-crossing, confidential data leak, invalid transition, unauthorized cancellation/reopen, stale assignment race, lost delegation, altered audit record, source-domain mutation, Work Request regressions.
- No routes/frontend integration, experimental migration, domain role seeding, actual API contract, executable change or test PASS is authorized by this intake alone.

## Required confirmation before organizational permissions go live

| ID | Required decision / evidence |
| --- | --- |
| L0 | LGU policy owner, issuing office, date, approval and authoritative version of these guidelines |
| L1 | Approved department-head, Mayor, Officer-in-Charge and staff enrollment / identification rules |
| L2 | Delegation scope, eligible actors, duration, revocation, proof and on-behalf-of action accountability |
| L3 | Definition and storage responsibilities for official vs individual Tasks and issuing/owning office |
| L4 | Cross-office assignment/oversight, confidentiality classes and permitted Mayor visibility |
| L5 | Exact return, clarification, completion, supervisor acceptance, cancellation and reopening outcomes |
| L6 | Audit event minimums, reason/evidence/notification thresholds, retention and privacy controls |

**Decision owner:** Kirch approves technical scope and design; appropriate LGU authority confirms municipal rules. Siris coordinates return and evidence, not policy ratification. Update this document's decision status when verified; avoid duplicating narrative comments.

**Next:** Kirch reviews schema/action-history impact, freezes a bounded W02 execution manifest and tests, then explicitly releases implementation. Until then, W02 code/branch remains staged and A01-W03/C1 remain gated.
