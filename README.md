# ONE TALIBON — Frontend Workspace

**Status:** Existing frontend source **STAGED ON A DRAFT IMPORT BRANCH ONLY** for FRONTEND-REG-001. Not merged into `main`, not yet build/browser accepted.

This is the development repository for AJ (`@rynzz22`) and Jhayr (`@kyumw3b`). Kirch (`@Kirch-Nairu`) reviews contracts and integration.

## Start

**[FRONTEND-REG-001 — Import existing frontend work](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/1)**

1. Identify existing login, dashboard, navigation and reusable UI sources.
2. Agree on a compatible app structure; import on scoped branches and PRs.
3. Demonstrate a runnable baseline with real build results and screenshots.

Jhayr can start now. AJ's direct repository access is deferred.

## Repository boundaries

- **This repository:** frontend development and UI integration.
- [Talibon-Sales-Prototype](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype): authoritative backend, authentication rules, Task domain and API.
- `Kirch-Nairu/Talibon-Intra-Office-Portal`: original source/reference, **not** this team's workspace.

Existing UI work can progress without the Task API. **Do not invent endpoints, permissions, response formats or LGU workflow rules.** Kirch publishes contracts after the corresponding backend behavior is implemented and verified.

## Reference documents

- [Contributing and work-item etiquette](CONTRIBUTING.md)
- [Existing-work import register](docs/FRONTEND_IMPORT_REGISTER.md)
- [Backend contract intake](docs/BACKEND_CONTRACT_INTAKE.md)

**Current state:** Existing Laravel/Inertia React frontend files have been staged in [FRONTEND-REG-001 draft staging branch](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/tree/KIRCH-TALIBON-FRONTEND-REG-001-EXISTING-UI-STAGING-R1). Build/CI and authenticated browser compatibility are **unverified until actual evidence appears**; `main` remains a docs-only bootstrap. A01 Task frontend integration and production release are **not** claimed.

[Staging setup, included/excluded modules and verification gates](docs/STAGED_FRONTEND_RUNTIME.md).
