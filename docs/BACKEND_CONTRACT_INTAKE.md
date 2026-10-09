# Backend contract intake — A01

**State (09 October 2026 producer source):** **A01-C1 individual Task HTTP backend contract formally released** on canonical backend `7b4ebb838982f6262b9fef65d18ba57488ebf941`. The frontend workspace is **not** imported, and no accepted frontend Task consumer or A01 Series integration/QA exists. All other listed common-system interfaces are **source-observed/draft**, not automatically formally released. This remains an intake register, not an alternative endpoint specification.

Backend authority: [Talibon-Sales-Prototype](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype). Frontend implementation lives in this workspace.

| Required before real integration | Status |
| --- | --- |
| A01-C1 version, issuer, exact backend SHA | **Released on backend**; see [authoritative C1 contract](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/7b4ebb838982f6262b9fef65d18ba57488ebf941/.forge/contracts/A01-C1-INDIVIDUAL-TASK-HTTP-CONTRACT.md) |
| A01-C1 routes, methods, authentication | Backend released; **frontend integration pending** |
| A01-C1 request/response schemas | Backend released; consumer test against imported frontend pending |
| A01-C1 filters, pagination, states/actions | Backend released, individual-only, not Work Request |
| A01-C1 authorization, validation, error behavior | Backend released; negative consumer tests still pending |
| Evidence and compatibility with frontend workspace | Historical bounded backend CI PASS; frontend import/compatibility tests **NOT RUN** |

UI imports can proceed without these fields. Do not guess routes, roles or server behavior. Unknown actions remain disabled or locally mocked.

**Current sequence:** A01-C1 backend implementation + accepted bounded CI (complete) → FRONTEND-REG-001 runnable import (incomplete) → scoped F01/F02 consumption/compatibility → later formal CI/QA/Kirch integration/Series acceptance (not awarded). See [Lucien's draft catalog](contracts/ONE_TALIBON_FRONTEND_CONTRACT_PACK_R1/CONTRACT_MANIFEST.md) and [producer source review](contracts/ONE_TALIBON_FRONTEND_CONTRACT_PACK_R1/BACKEND_PRODUCER_VERIFICATION.md) for **non-authoritative, source-observed** other interfaces.

## Report a contract gap

```text
Frontend screen/action:
Required behavior:
Current contract/version:
Missing or contradictory detail:
Decision needed from Kirch:
```

LGU-specific department authority remains subject to Track W confirmation.
