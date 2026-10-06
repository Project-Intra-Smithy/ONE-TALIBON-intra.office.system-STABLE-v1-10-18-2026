# KIRION FORGE MEMORY — FRONTEND INTEGRATION REGISTRY

## Registry purpose

The frontend team has an existing repository with valuable established UI assets.

That repository is **not** treated as an independent backend authority.

This registry prevents frontend reuse from reintroducing stale server/domain behavior.

---

# FRONTEND-REG-001 — Current registration

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

`Kirch-Nairu/Talibon-Sales-Prototype`

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
