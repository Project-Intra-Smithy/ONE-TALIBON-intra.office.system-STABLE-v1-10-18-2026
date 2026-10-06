# KIRION FORGE MEMORY — FRONTEND INTEGRATION REGISTRY

## Registry purpose

The frontend team already has an existing working repository and established Login/Dashboard/shell assets.

The common-system program must reuse that asset deliberately rather than pretending frontend is blank or pretending it is already synchronized to the current backend.

---

# FRONTEND-REG-001 — Current registration

Repository:

`Kirch-Nairu/Talibon-Intra-Office-Portal`

Observed default branch:

`main`

Observed current main SHA:

`a7d7be17feb435b50c52cacd063e11d92ad047e1`

Observed commit message:

`chore(reproducibility): freeze baseline build inputs`

Repository classification:

`EXISTING FRONTEND ASSET — CONTRACT ONBOARDING / RECONCILIATION REQUIRED`

Backend authority it must eventually consume:

`Kirch-Nairu/Talibon-Sales-Prototype`

Backend common-program source at registration:

`main@4bac88d22e1fb3f808c024888845503922c41683`

---

# Existing frontend assets observed

Representative established assets include:

- `resources/js/pages/Auth/Login.tsx`
- `resources/js/pages/Dashboard.tsx`
- `resources/js/layouts/AppLayout.tsx`
- portal shell/navigation components;
- dashboard components;
- Transactions pages;
- Records pages;
- Calendar page;
- Correspondence pages;
- Employees pages;
- Administration page;
- shared filters/work-queue components;
- responsive/frontend build infrastructure.

Program implication:

`DO NOT REBUILD LOGIN / DASHBOARD / SHELL WITHOUT A CONCRETE CONTRACT OR DEFECT REASON`

---

# Synchronization status

The frontend repository main predates the backend P0-H authority.

Therefore:

`FRONTEND SYNCHRONIZED TO CURRENT BACKEND = NOT YET PROVEN`

Do not issue an A01 frontend implementation handoff until the Maintainer records the exact integration base and consumed backend contract.

---

# Required A01 frontend onboarding record

Before frontend A01 work begins, update this registry with:

- frontend owner(s);
- exact frontend source SHA;
- exact branch strategy;
- current package/build versions;
- route/API assumptions;
- auth/session/MFA assumptions;
- backend contract release SHA/version;
- shared types/DTO source;
- error/validation response semantics;
- pagination/filter semantics;
- file/upload/download semantics if relevant;
- known incompatible/stale assumptions;
- migration/deprecation treatment;
- exact files/surfaces owned by frontend;
- exact files/surfaces reserved to backend/Maintainer;
- frontend validation command set;
- return contract.

Only after that record is complete may Forge mark:

`A01 FRONTEND = AUTHORIZED`

---

# Frontend ownership model

Frontend owns, within an approved contract:

- information hierarchy;
- interaction design;
- page/component composition;
- loading/empty/error/permission presentation;
- accessibility presentation;
- responsive behavior;
- visual design/system consistency;
- frontend tests/build/browser evidence.

Frontend does not own:

- database/domain lifecycle;
- server authorization;
- municipal routing;
- role authority;
- SLA;
- approval/signature semantics;
- official KPI;
- department-specific workflow truth.

---

# Backend contract harness rule

Backend/Technical Authority may create a minimal interactive/reference surface solely to prove:

- requests can be submitted;
- authorization behaves correctly;
- state transitions work;
- response shape is coherent;
- errors/validation are usable;
- persistence/events/audit work.

Such a surface is:

`ENGINEERING CONTRACT HARNESS`

not:

`CANONICAL FRONTEND DESIGN`

Frontend may replace the presentation completely while preserving the released contract.

---

# Contract drift rule

If frontend implementation discovers that the released backend contract is insufficient:

1. stop the affected path;
2. return a contract-gap report;
3. classify whether the gap is engineering, authority/input or frontend-only;
4. Backend/Technical Authority decides whether to amend the contract;
5. if backend executable source changes, create a new backend candidate and revalidate affected gates;
6. frontend resumes only from the amended released contract.

Frontend may not silently compensate for missing server authority with client-only logic.
