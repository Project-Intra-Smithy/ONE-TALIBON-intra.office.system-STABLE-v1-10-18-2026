# Frontend ↔ Backend — API contract intake and release register

**Status: NO A01 TASK API CONTRACT RELEASED.** This file is a **release intake template**, not an API specification. Neither an HTTP endpoint nor a Task permission can be inferred from it.

## Authorities

- **Backend/product repository:** [Talibon-Sales-Prototype](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype); Kirch owns and approves backend application behavior.
- **Frontend implementation repository:** [This team workspace](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE).
- **Technical Authority/contract publisher:** Kirch (`@Kirch-Nairu`).
- **Frontend consumers:** AJ (`@rynzz22`), Jhayr (`@kyumw3b`).
- **LGU decisions:** Siris coordinates discovery; municipal process owners approve actual department/role/task authority. UI code cannot decide these rules.

## Contract release manifest — required before real API integration

| Contract field | Current status |
| --- | --- |
| Release ID / version / scope / compatibility policy | **Unreleased** |
| Human technical approver + issued date | **Unreleased** |
| Exact backend repository + tested executable SHA | **Unreleased** |
| Routes, HTTP methods, base-path and auth/session requirements | **Unreleased** |
| Request schemas, validation constraints, examples | **Unreleased** |
| Response schemas / field types / nullability / examples | **Unreleased** |
| List filters, pagination, ordering and visibility scope | **Unreleased** |
| State values, allowed transitions, conditional actor capabilities | **Unreleased** |
| Error envelopes, 401/403/404/409/422 mapping where applicable | **Unreleased** |
| Source-linked Task references (display-only vs approved behavior) | **Unreleased** |
| Existing migrations/config, backwards compatibility, deprecations | **Unreleased** |
| Automated tests / negative authZ evidence at exact backend SHA | **Unreleased** |
| Backend CI, integration tuples and reviewer decision | **Unreleased** |

Do not substitute the old portal repository's routes or current UI mocks for these missing facts. Task storage exists at accepted W01, but **Task API, lifecycle and authorization remain separately gated**.

## Consumption discipline

1. Existing login/dashboard/frontend-only work may be imported and verified without Task API release. Do not assume secure login or backend session compatibility from a visual login page.
2. Until a real endpoint manifest is issued, client code must use clearly labeled **local mock or disabled controls**, and must not send requests to guessed Task endpoints.
3. After accepted W02 technical subset and tested W03 server endpoints exist, Kirch **may issue** an explicitly scoped `A01-C1-PARTIAL` contract. State exact supported operations and **denied/unimplemented** ones; do not promote it to full A01-C1.
4. Only then may a separate reviewed frontend integration PR connect to the **exact supported** backend surface. Track frontend SHA, backend SHA, contract version and test evidence.
5. A01-C1 full contract, integration candidate, Kurt's CI, Siris's independent QA, Kirch acceptance and deployment remain **distinct release gates**.

## Contract gap report template

```text
Frontend package / branch / source SHA:
Required user interaction:
Proposed server call (if any; not assumed real):
Current released contract version / reference:
Exact gap or ambiguity:
Security / authorization implication:
Recommended UI hold or safe mock fallback:
Kirch decision requested:
```

**No LGU-specific authority may be created from a role label, incomplete discovery, or anticipated endpoint.**
