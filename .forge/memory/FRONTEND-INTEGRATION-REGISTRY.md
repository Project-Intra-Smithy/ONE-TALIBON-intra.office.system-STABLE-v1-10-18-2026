# KIRION FORGE MEMORY — FRONTEND INTEGRATION REGISTRY

## Registry purpose

The frontend team has an existing repository with valuable established UI assets.

That repository is **not** treated as an independent backend authority.

This registry prevents frontend reuse from reintroducing stale server/domain behavior.

---

# FRONTEND-REG-001 — Registered source assets / completion pending

Repository:

`Kirch-Nairu/Talibon-Intra-Office-Portal`

Observed default branch:

`main`

Observed source:

`a7d7be17feb435b50c52cacd063e11d92ad047e1`

Observed commit:

`chore(reproducibility): freeze baseline build inputs`

Repository classification:

`EXISTING FRONTEND ASSET + HISTORICAL FULL-STACK COPY — CONTRACT ONBOARDING / RECONCILIATION REQUIRED`

Canonical backend/domain authority:

`Project-Intra-Smithy/Talibon-Sales-Prototype`

Common-program / A01 Series-opening backend source:

`f2ff373113f89173016634505eb3c3943edfb35c`

Current exact backend `main` must be verified before a new frontend contract release is consumed.

---

# 1. Authority boundary

The frontend repository contains both:

## Consumable frontend/team assets

Representative examples:

- `resources/js/pages/Auth/Login.tsx`
- `resources/js/pages/Dashboard.tsx`
- `resources/js/layouts/AppLayout.tsx`
- portal shell/navigation components
- dashboard components
- Transactions pages
- Records pages
- Calendar page
- Correspondence pages
- Employees pages
- Administration/shared components
- frontend styles/build/test infrastructure

## Historical server/full-stack source

The repository also contains older PHP/server authority such as:

- `routes/web.php`
- controllers
- models/domain code
- HRIS routes/features
- Property routes/features
- Legislative routes/features
- Travel Order routes/features
- other server-side implementation

These server/backend artifacts are:

`NON-AUTHORITATIVE HISTORICAL COPY`

They must not override, merge into, or silently redefine canonical backend/domain behavior.

---

# 2. Canonical-source rule

Backend/domain truth comes only from:

`Kirch-Nairu/Talibon-Sales-Prototype`

unless Technical Authority explicitly changes that source authority.

Frontend work may not infer backend authority from:

- frontend-repository routes/controllers/models;
- historical page assumptions;
- historical authorization behavior;
- stale request/response shapes;
- historical HRIS/property/legislative/travel-order implementations.

If frontend behavior conflicts with the released backend contract:

`BACKEND CONTRACT WINS UNTIL TECHNICAL AUTHORITY AMENDS IT`

---

# 3. Synchronization status

`FRONTEND-REG-001 = INCOMPLETE / RUNNABLE TEAM BASELINE NOT VERIFIED`

`FRONTEND SYNCHRONIZED TO CURRENT BACKEND = NOT YET PROVEN`

The frontend source predates current common-program authority.

Do not issue A01 frontend implementation until:

1. `FRONTEND-REG-001` publishes the exact consumable frontend integration base;
2. A01-C1 publishes the backend contract;
3. incompatible historical assumptions are explicitly recorded.

---

# 4. Required FRONTEND-REG-001 output

Before frontend A01 work begins, record:

- frontend owner(s);
- exact frontend source SHA;
- exact branch strategy;
- framework/package/build versions;
- frontend-owned path boundary;
- explicitly non-authoritative server/backend paths;
- auth/session/MFA assumptions;
- exact backend contract release SHA/version;
- route/API contract consumed;
- request/response fields;
- lifecycle/status vocabulary consumed;
- allowed-action representation;
- error/validation semantics;
- pagination/filter semantics;
- source-reference semantics;
- file/download semantics where relevant;
- stale/incompatible historical assumptions;
- migration/deprecation treatment;
- validation command set;
- browser/responsive evidence requirements;
- return contract.

Only then may Maintainer mark:

`FRONTEND-REG-001 = COMPLETE`

A01 frontend still requires:

`A01-C1 + FRONTEND-REG-001`

---

# 5. Frontend ownership

Within a released contract, frontend owns:

- information hierarchy;
- interaction design;
- page/component composition;
- loading/empty/error/permission presentation;
- accessibility presentation;
- responsive behavior;
- visual-system consistency;
- frontend tests/build/browser evidence.

Frontend does not own:

- database/domain lifecycle;
- server authorization;
- municipal routing;
- municipal roles;
- SLA;
- approval/signature semantics;
- official KPI;
- department-specific business truth.

---

# 6. Backend contract harness

Backend/Technical Authority may create a minimal interactive/reference surface solely to prove contract behavior.

Such a surface is:

`ENGINEERING CONTRACT HARNESS`

not:

`CANONICAL FRONTEND DESIGN`

Frontend may replace presentation while preserving the accepted contract.

---

# 7. Contract drift

If frontend discovers an insufficient backend contract:

1. stop the affected path;
2. return a contract-gap report;
3. classify the gap;
4. Backend/Technical Authority decides whether to amend;
5. executable backend changes create a new exact candidate and revalidation obligation;
6. frontend resumes only from the amended released contract.

Frontend must not compensate for missing server authority with client-only logic.

---

# 8. A01-C1 technical contract release / current frontend execution gate (09 October 2026)

**Released backend:** `Project-Intra-Smithy/Talibon-Sales-Prototype@b9a4ad3ed6e72ae3a5cb1a4108ebae06eedaec26` (PR #34 merged; Kurt exact-main CI run 37898947831 PASS, 78 tests/655 assertions). [Contract](../../.forge/contracts/A01-C1-INDIVIDUAL-TASK-HTTP-CONTRACT.md).

**Verified existing frontend asset:** `Kirch-Nairu/Talibon-Intra-Office-Portal@a7d7be17feb435b50c52cacd063e11d92ad047e1`, React 19 / Inertia React 3 / TypeScript 5.7 / Vite 8 / Tailwind 4, `npm@10.9.2` package manager. Its historical Laravel PHP/backend is non-authoritative. Asset-only checks: `npm ci --no-audit --no-fund`, `npm run types:check`, `npm run build`, plus separate real browser smoke/screenshots; execution **NOT YET CLAIMED**.

**Canonical frontend team workspace:** `Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE@bab1f4563b903d7d9810590cd0e3ce6628db8611` (bootstrap docs only). [Import owner/work issue](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/1) assigned to Jhayr `kyumw3b`, with Kirch review; [Hub coordination #3](https://github.com/Project-Intra-Smithy/engineering-hub/issues/3) open. Exact import branches/PRs are **NOT YET ISSUED**. The asset SHA does not magically become an importable or runnable team workspace SHA.

**Frontend/transport boundary already released:** Five JSON-only same-origin personal Task endpoints `GET /tasks`, `POST /tasks`, `GET /tasks/{id}`, `POST /tasks/{id}/start`, `POST /tasks/{id}/complete`; browser session cookie + required CSRF on POST, `Accept: application/json`, `credentials: same-origin`. Task GET is JSON, **not an Inertia navigation target**. Any Task presentation route/shell must be grounded in the canonical backend web route inventory or separately proposed for authority review. Frontend cannot invent it.

**Data/lifecycle:** creator-owned only; `kind=individual`, `state=open|in_progress|completed`, fields `id,title,instructions,owning_department_id,due_at,completed_at,created_at,updated_at`. Create accepts only `title,instructions,due_at`; no client role/actor/assignee/department/source/state grants. Pagination `page 1–10000`, `per_page 1–50`, optional `state`, server-supplied `meta`. No authoritative `allowed_actions` claim in the C1 JSON; frontend display hints do not grant server rights. Error handling: 401 guest/inactive; 403 MFA-required with relative `next_url`, or linked actor disabled; concealed 404 for foreign/inaccessible tasks; 419 CSRF (do not blind-retry writes); 422 validation/state; 429 throttle; 500/503 incident. No source-linking nor file/download contract in C1. Existing legacy My Work/transaction behavior must not be silently recast as a Task API.

**Observed compatibility risks to resolve in Jhayr import:** older full-stack PHP auth/routes/controllers/models are stale; existing Inertia shared props and navigation assumptions require reconciliation; request/response typing must be derived from C1 not old routes; no existing runnable team workspace screenshot/build evidence. Import only authored frontend paths and approved build inputs, preserving contributor attribution.

**Owner and implementation split:** Jhayr owns initial runnable workspace import / build / browser-smoke handoff; Kirch reviews. AJ `rynzz22` and Jhayr `kyumw3b` remain intended non-overlapping A01-F01/F02 human owners **after** successful registration, at which time exact branch strategy, owned paths, integrations, build/browser validation and return contracts are separately issued. See [Hub #23](https://github.com/Project-Intra-Smithy/engineering-hub/issues/23) and [#24](https://github.com/Project-Intra-Smithy/engineering-hub/issues/24). Do not represent these staged assignments as started.

**FRONTEND-REG-001 completion requirements remain open:** (1) Jhayr source/attribution inventory and reviewed import PRs, (2) runnable login/dashboard/navigation baseline in team workspace, (3) real install/build/type-check/browser desktop/mobile evidence, (4) current approved exact frontend integration base SHA, (5) verification of backend/foreground authority boundary. The F01/F02 release tuple, QA/CI and deployment remain separate.
