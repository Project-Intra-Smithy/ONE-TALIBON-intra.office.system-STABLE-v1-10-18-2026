# KIRION FORGE MEMORY — FRONTEND INTEGRATION REGISTRY

## FRONTEND-REG-001

Frontend/team repository:

`Kirch-Nairu/Talibon-Intra-Office-Portal`

Observed source:

`main@a7d7be17feb435b50c52cacd063e11d92ad047e1`

Classification:

`EXISTING FRONTEND ASSET + HISTORICAL FULL-STACK COPY — CONTRACT ONBOARDING / RECONCILIATION REQUIRED`

Canonical backend/domain authority:

`Kirch-Nairu/Talibon-Sales-Prototype`

A01 Series-opening backend source:

`f2ff373113f89173016634505eb3c3943edfb35c`

## Authority boundary

Consumable/frontend-owned candidates include:

- `resources/js/**`
- frontend styles/assets
- frontend package/build/test configuration where explicitly accepted

Historical server-side artifacts in the frontend repository are:

`NON-AUTHORITATIVE HISTORICAL COPY`

This includes, where present:

- `routes/web.php`
- PHP controllers
- models/domain code
- HRIS server features
- Property server features
- Legislative server features
- Travel Order server features
- other backend/server behavior

They must not redefine canonical backend contracts.

## Required before A01 frontend work

FRONTEND-REG-001 must publish:

- exact frontend source SHA;
- owners;
- branch strategy;
- frontend-owned path boundary;
- explicit non-authoritative server path boundary;
- build/package assumptions;
- auth/session/MFA assumptions;
- exact backend contract consumed;
- route/API and request/response contract;
- lifecycle/status values consumed;
- allowed-action representation;
- validation/error semantics;
- pagination/filter semantics;
- stale/incompatible assumptions;
- validation/browser/responsive commands;
- return contract.

A01 frontend remains blocked until:

`A01-C1 + FRONTEND-REG-001`

If historical frontend assumptions conflict with released backend authority:

`RELEASED BACKEND CONTRACT WINS`
