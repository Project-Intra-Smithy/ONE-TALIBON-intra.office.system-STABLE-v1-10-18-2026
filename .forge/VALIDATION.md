# ONE TALIBON — CURRENT VALIDATION & EVIDENCE POLICY

## Evidence law

Only claim what was observed.

Allowed states:
PASS / FAIL / PARTIAL / BLOCKED / SOURCE INSPECTED / NOT RUN / NOT OBSERVED / UNKNOWN / CARRIED only with proven executable-source boundary

## Current accepted executable/runtime anchor

Repository (canonical):
Project-Intra-Smithy/Talibon-Sales-Prototype

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

## Current A01 evidence state — 09 October 2026

- W01/W02/W03: **ACCEPTED / MERGED / BOUNDED CI PASS**; they are not separate formal A01 Series QA.
- A01-C1 source: `219bcc6f09ae8366063293c9364bd896b707f328` (Jane R2).
- Integrated product: `main@b9a4ad3ed6e72ae3a5cb1a4108ebae06eedaec26` (normal merge PR #34; same candidate tree).
- Kurt exact-candidate CI: **PASS**, run `37897162733`, 78 tests / 655 assertions.
- Kurt exact-integrated-main CI: **PASS**, run `37898947831`, 78 tests / 655 assertions, non-testing authenticated cookie/CSRF/genuine MFA Task HTTP integration. **Not browser automation E2E.**
- Postmerge artifact `11601582854`, digest `sha256:7e1379f93aac7e937073be809f10357ebde3533c77dbac588b62f40056795c8d`.
- Evidence hygiene: exploratory artifacts `11600975206`, `11601125194` removed by successful one-shot run `37898725108`; redacted original retained.
- C1 bounded contract technical acceptance: **ACCEPTED through Kirch-authorized AI-assisted execution**; it does not imply Kirch manually produced independent source or runner evidence.
- FRONTEND-REG-001 / runnable workspace: **INCOMPLETE**; Task F01/F02 implementation still staged.
- Formal A01-I01 exact backend/frontend release tuple: **NOT ESTABLISHED**.
- Formal A01-CI01: **NOT RUN**. Siris A01-QA01: **NOT RUN**.
- Final Kirch A01 Series acceptance, LGU UAT and production readiness: **NOT AWARDED**.

Earlier Phase-0 baseline anchor above remains historical provenance; it is not the newest integrated backend commit.
