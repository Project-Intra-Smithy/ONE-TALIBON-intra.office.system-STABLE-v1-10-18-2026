# ONE TALIBON — CURRENT VALIDATION & EVIDENCE POLICY

## Evidence law

Only claim what was observed.

Allowed states:
PASS / FAIL / PARTIAL / BLOCKED / SOURCE INSPECTED / NOT RUN / NOT OBSERVED / UNKNOWN / CARRIED only with proven executable-source boundary

## Current accepted executable/runtime anchor

Repository:
Kirch-Nairu/Talibon-Sales-Prototype

Exact accepted runtime anchor:
395438674b4d2f00659eba616db760b339bb390a

Validation:
- workflow: P08 Targeted Baseline Acceptance
- run: #28
- successful attempt: 3
- conclusion: SUCCESS
- artifact ID: 11418268674
- digest: sha256:f386d18a844c314dbeecfe3ab188195dcd0a9158bd06fd69fae4848a4282ac49

Current main may advance through governance-only changes without changing this executable anchor.

## Human validation ownership for post-P0 Series

Assigned human developer owns implementation and self-validation.

Kurt Shine Khase Halasan owns the standard CI/CD validation lane unless another human CI owner is explicitly authorized.

Siris owns the standard independent QA lane unless another human QA owner is explicitly authorized.

Kirch Ivan Balite owns final technical acceptance and integration disposition.

AI may analyze logs or prepare evidence but may not self-award these human gates.

## Exact-candidate law

Evidence belongs to an exact candidate SHA or exact cross-repository release tuple.

Any executable change after PASS creates a new candidate and requires affected downstream revalidation.

## Claim boundaries

- build PASS != runtime PASS;
- runtime PASS != authorization completeness;
- CI PASS != QA PASS;
- QA PASS != Kirch acceptance;
- engineering acceptance != LGU UAT;
- UAT != final contractual acceptance;
- P0 acceptance != production readiness.

## Phase-0 QA waiver

Any Phase-0 Technical-Authority assumption/waiver is historical and does not silently generalize to A01 or later Series.

## Current A01 evidence state

A01 implementation candidate: NONE
A01-W01 validation: NOT RUN
A01 post-P0 CI/CD: NOT RUN
A01 QA: NOT RUN
A01 technical acceptance: NOT RUN
