# R3 SLOT 05 — Official delegated Task design, authority held

Source baseline: integration/one-talibon-complete-r1 @ e39c7ecc6b4b7ae6538f545a48dff57625edc478

Owning issue: https://github.com/Project-Intra-Smithy/engineering-hub/issues/133
Policy authority: https://github.com/Project-Intra-Smithy/engineering-hub/issues/83
Cross-domain evidence: OPS-014 and OPS-022 in engineering-hub issue #126.

## Current scope

Individual Tasks remain creator-owned and may transition open -> in_progress -> completed via TaskCoreService. Work Requests separately own office routing, employee assignment, decisions and terminal states. Generic Task source fields are not an authoritative parent relationship.

This candidate adds a separate, deliberately unwired OfficialTaskIssuancePolicy that denies every attempt. No role, title, office, or existing Work Request assignee confers authority to issue an official Task. This is a safe design gate, not official Task functionality.

## Required policy before activation

1. Validated municipal issuer and permissible delegations; provenance and revocation.
2. Assignee identity, active employment, owning office and explicitly allowed cross-office instructions.
3. Parent Work Request identity and effective confidentiality inheritance, including restricted subject/metadata denial.
4. Issuance, acceptance/decline, start, completion-result/evidence, verification and cancellation authority.
5. Per-transition append-only auditable event semantics, immutable identity, replay and concurrent-write handling.
6. Notification visibility and safe representations of classified child/parent links.
7. Explicit rule for whether completed child work may inform a parent decision. It must never independently approve, release, archive, or close the Work Request.

## Later implementation proposal (not approved)

Use an isolated official Task domain service, access policy, and tested lifecycle. Add an additive FK/association only after parent cardinality and authorization are confirmed. Do not retrofit the individual Task controller or allow client-submitted acting-user IDs. Respect SLOT02 Work Request terminal ownership and AJ44 PR #2 UI ownership.

## Validation and limits

Proposed negative tests: unauthorized issuer, cross-office assignment, inactive assignee, restricted parent visibility, forged issuer, duplicate/replayed event, stale parent reassignment and no parent status change on child completion.

In this candidate, only unconditional issuance denial is executable. The two tests in OfficialTaskDelegationTest are source-authored and have NOT been executed by the GitHub connector. No DB, browser, hosted CI or runtime actions were performed.

Release status: DISABLED_DESIGN / LGU_POLICY_HOLD / NO_ROUTE / NO_SCHEMA / NO_MERGE.
