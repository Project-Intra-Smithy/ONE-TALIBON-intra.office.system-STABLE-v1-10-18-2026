# ONE TALIBON — Frontend Team Workspace

**Frontend development workspace for the ONE TALIBON Intra-Office System.**

> **Stage: FRONTEND-REG-001 — bootstrap / existing-work import pending.**
> This repository does **not** yet contain the team's login or dashboard application. A README and coordination records do not constitute an implemented feature, passing CI, authenticated login, or a production-ready frontend.

## Start here

**First delivery:** [FRONTEND-REG-001 — import existing login, dashboard and completed work](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/1).

The team should **bring in its actual existing code**, not rebuild it from scratch. Before importing, AJ and Jhayr must identify their sources, authors, commits/files, framework, dependencies and readiness. The next step is a runnable integrated **frontend baseline**, supported by reproducible build/smoke evidence.

Read [Contributing](CONTRIBUTING.md) and [Import Register](docs/FRONTEND_IMPORT_REGISTER.md) before the first source PR.

## People and decisions

| Human | Responsibility |
| --- | --- |
| **Kirch Ivan Balite** — `@Kirch-Nairu` | Technical Authority; architecture/contract decisions, review, final acceptance |
| **AJ** — `@rynzz22` | Frontend contributor; source inventory and owned UI work |
| **Jhayr** — `@kyumw3b` | Frontend contributor and first-import coordinator |
| **Siris** — `@Syris-EkzD` | LGU discovery coordination and separately gated independent QA |
| **Kurt** — `@k3nchinxd` | Separately gated CI/CD and integration validation |

AJ's repository write access can be handled separately; it **does not block** Jhayr's legitimate inventory/import work. Do not assign someone else's authorship to another contributor. No Kirion connector is selected for this team lane unless Kirch explicitly issues a bounded parallel task.

## Repository authority — do not confuse these

| Repository | Authority |
| --- | --- |
| **This repository** (`Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE`) | Team's working frontend code, UI, assets and presentation integration |
| [Talibon-Sales-Prototype](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype) | **Canonical backend/product**: application logic, real Task API, permission rules, persistence |
| `Kirch-Nairu/Talibon-Intra-Office-Portal` | Kirch's **historical original/source reference**; NOT the team working repository |

Do not copy, merge, or cherry-pick branches from the historic source as an assumed shortcut. If a component is actually reused, identify its exact origin, review its license/provenance, and import it intentionally with attribution.

## Delivery sequence

1. **NOW — FRONTEND-REG-001:** inventory existing AJ/Jhayr work, agree the shared application baseline, import login/dashboard and other complete screens via small reviewable PRs. Run only the commands verified for the **actual imported stack**.
2. **IN PARALLEL — backend W02:** Kirch prepares/implements the Task state and authorization core on the canonical backend. Unverified LGU-specific authority stays denied.
3. **W03 — verified Task API:** backend implements real endpoints, request/response shapes, errors and authorization, with exact-SHA tests.
4. **Optional C1-PARTIAL:** only an explicit, source-pinned, **tested and implemented** endpoint subset can be described as a nonproduction early-integration contract. Anything unimplemented remains disabled or local-mock only. **C1-PARTIAL is not final A01-C1.**
5. **Full A01-C1 + integration:** frontend consumes Kirch's accepted complete Task contract; exact frontend/backend tuples go to integration, Kurt CI, Siris QA, Kirch acceptance, and separate deployment gating.

For every contemplated server call, see [Backend Contract Intake](docs/BACKEND_CONTRACT_INTAKE.md). **No Task endpoint, role, department-wide visibility, returned state, or permission may be invented by frontend code.** Unresolved LGU rules remain a Track W question.

## Working agreement

- Develop on branches created from a freshly verified `main`; send scoped PRs, not unreviewed direct-to-main feature pushes.
- Preserve real source history and human commit attribution; name imported artifacts and previous source SHAs in PRs.
- Do not commit passwords, credentials, tokens, private LGU content, production exports, `.env` secrets, installed dependencies, or compiled build products.
- Demo login UI is **not** evidence of secure live authentication. Label stubs and fixture-backed behavior honestly.
- Separate **preview / partial / accepted / production** statuses. A passing check on another repository does not test this one.
- A build pipeline, CI scripts, test commands and frontend folder layout will be registered **after** the actual work/toolchain is inventoried; none is presumed to exist today.

**Maintainer staging note:** this documentation is governance/bootstrap only. Import of existing executable frontend work, automated builds and readiness must be independently demonstrated.
