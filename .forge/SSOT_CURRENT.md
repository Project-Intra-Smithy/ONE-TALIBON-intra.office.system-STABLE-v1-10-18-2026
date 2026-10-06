# ONE TALIBON — CURRENT SSOT

## Authority

Technical Authority:

**Kirch Ivan Balite**

Product repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Accepted executable/runtime anchor:

`395438674b4d2f00659eba616db760b339bb390a`

Common-program promotion / A01 Series-opening source:

`main@f2ff373113f89173016634505eb3c3943edfb35c`

Important:

`f2ff373...` remains the exact source that opened A01. Later `.forge/**` governance-only commits on `main` do not rewrite that issued source and do not inherit executable acceptance to changed product source.

Current exact `main` must always be re-verified before a new work package is issued.

---

# 1. Current program state

`P0 — CANONICAL BASELINE: COMPLETE / FROZEN`

`COMMON SYSTEM PROGRAM: ACCEPTED / PROMOTED`

`P1 / A01 — OPENED`

`A01-W01 — ISSUED / PAUSED FOR CONTROL-PLANE RECONCILIATION`

No A01-W01 implementation candidate has been returned.

The writer branch remains at its immutable issued source:

`KIRCH-TALIBON-P1-A01-W01-TASK-DOMAIN-FOUNDATION@ddbcf2a2715315c0e9998a7bcfdd9414edb3acd4`

A01-W02 remains blocked until W01 returns, is reviewed, validated as required, and accepted.

---

# 2. P0 accepted baseline

P0 accepted executable/runtime anchor:

`395438674b4d2f00659eba616db760b339bb390a`

Validation:

- workflow: `P08 Targeted Baseline Acceptance`
- run: `#28`
- attempt: `3`
- conclusion: `SUCCESS`
- artifact ID: `11418268674`
- digest: `sha256:f386d18a844c314dbeecfe3ab188195dcd0a9158bd06fd69fae4848a4282ac49`

Governance descendants from the accepted runtime anchor through the common-program promotion contain only `.forge/**` evidence/memory/governance changes.

P0 does not reopen without:

- concrete defect;
- invalidated evidence;
- changed acceptance requirement; or
- explicit Technical Authority decision.

---

# 3. Locked common-system architecture

- P1 — Common Work & Accountability
- P2 — Common Coordination Integration
- P3 — Official Information & Evidence Maturation
- P4 — Common Search
- P5 — Visibility & Control
- P6 — Cross-Domain Authorization Reconciliation & Security Regression
- P7 — Common-Core Acceptance

P1 Series:

- A01 — First-Class Task Domain
- A02 — Unified My Work Projection
- A03 — Non-Destructive Task / Work Request Integration
- A04 — P1 Integration & Contract Acceptance
- P1-H

Locked invariants:

- `Task != Work Request`
- `Work Request != Correspondence`
- `Document != Transaction`
- `Meeting != Task`
- `Executive oversight != universal routing`

Do not create a universal mutable WorkItem/domain merely to simplify integration.

---

# 4. Current source-backed architecture facts

Live backend establishes:

- Work Request / `WorkflowTransaction` is an established common engine;
- current My Work is real but transaction-backed;
- no generic canonical common `Task` model/controller/route exists;
- therefore A01 remains a real missing common domain;
- A02 must extend existing My Work rather than replace it;
- Correspondence, Documents, Records, Notifications, Calendar, Messaging, Dashboards, Reports, Audit, Auth/MFA and authorization are established foundations at varying maturity.

---

# 5. A01 current execution state

Coordination branch:

`KIRCH-TALIBON-P1-A01-FIRST-CLASS-TASK@6e926c84bc1095446d90034633f7f722552aaafb`

Series plan:

`.forge/plans/P1-A01-FIRST-CLASS-TASK-SERIES-PLAN.md`

A01-W01 writer branch:

`KIRCH-TALIBON-P1-A01-W01-TASK-DOMAIN-FOUNDATION`

Immutable issued source:

`ddbcf2a2715315c0e9998a7bcfdd9414edb3acd4`

W01 scope remains bounded to:

- `app/Models/Task.php`
- one additive `create_tasks_table` migration
- `tests/Feature/Tasks/TaskDomainFoundationTest.php`
- optional TaskFactory only if the focused test genuinely requires it

W01 is currently PAUSED while Engineering Hub / GitHub Project control-plane bootstrap is reconciled.

The pause is operational only. It does not revoke A01 authority or alter the immutable issued source.

---

# 6. Frontend authority boundary

Existing frontend/team repository:

`Kirch-Nairu/Talibon-Intra-Office-Portal`

Observed frontend source:

`main@a7d7be17feb435b50c52cacd063e11d92ad047e1`

Classification:

`EXISTING FRONTEND ASSET — CONTRACT ONBOARDING / RECONCILIATION REQUIRED`

Critical authority rule:

The repository contains both frontend assets and an older full-stack/backend copy.

Its server/backend source is **NOT** canonical product authority.

Canonical backend/domain authority remains:

`Kirch-Nairu/Talibon-Sales-Prototype`

FRONTEND-REG-001 must explicitly identify which frontend files/contracts are consumable and must prevent historical backend/routes/controllers/models from being reintroduced as authority.

A01 frontend remains blocked until:

`A01-C1 + FRONTEND-REG-001`

A01 backend/domain work is not logically blocked by frontend reconciliation, although W01 is temporarily paused for the control-plane reconciliation recorded here.

---

# 7. Engineering Hub authority

Operational control repository:

`Project-Intra-Smithy/engineering-hub`

The Hub is the current operational coordination surface for:

- work-package state;
- dependencies;
- frontend reconciliation;
- Track W;
- Track R;
- Project-control bootstrap.

Detailed executable truth remains in this product repository and exact Git evidence.

If Hub and product `.forge` current-state records conflict, the conflict must be reconciled before issuing new work.

---

# 8. LGU workflow / business authority

Citizens' Charter:

`SUPPORTING MUNICIPAL PROCESS REFERENCE — VALIDATION REQUIRED`

Process-owner validated workflow remains authoritative for municipal business truth.

Department-specific rules must not be inferred solely from:

- Charter rows;
- historical code;
- prototype/reference pages;
- menu/route existence.

Track W handles LGU/process authority in parallel.

Track R handles production readiness in parallel.

Neither track silently redefines common-domain architecture.

---

# 9. Acceptance law

For executable work:

`IMPLEMENTED + COMMITTED + SELF-VALIDATED + REVIEWED + CI PASSED + QA PASSED WHERE REQUIRED + TECHNICAL AUTHORITY ACCEPTED + INTEGRATED + RECORDED`

A PASS belongs to an exact candidate.

Executable source change after PASS creates a new candidate.

Governance-only changes do not create a new executable product candidate, but their exact Git lineage must still be recorded.

---

# 10. Immediate next action

1. finish the control-plane reconciliation;
2. complete a read-only GitHub Project inventory against the simplified bootstrap specification;
3. review that inventory before Project mutation;
4. then unpause A01-W01;
5. keep A01-W02 blocked until W01 acceptance;
6. complete FRONTEND-REG-001 before any A01 frontend issuance.

No department-specific implementation is authorized by this state.
