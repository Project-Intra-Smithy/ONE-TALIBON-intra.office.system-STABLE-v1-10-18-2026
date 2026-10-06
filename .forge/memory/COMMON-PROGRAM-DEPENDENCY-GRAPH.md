# KIRION FORGE MEMORY — COMMON PROGRAM DEPENDENCY GRAPH

## Program graph

```mermaid
flowchart TD
    P0["P0 — Canonical Baseline<br/>COMPLETE"] --> A01["P1 / A01<br/>First-Class Task"]
    A01 -->|Task contract release| A02["P1 / A02<br/>Unified My Work"]
    A02 --> A03["P1 / A03<br/>Non-Destructive Task / Work Request Integration"]
    A03 --> A04["P1 / A04<br/>P1 Integration & Contract Acceptance"]
    A04 --> P1H["P1-H<br/>Work & Accountability Freeze"]

    P1H --> P2["P2<br/>Common Coordination Integration"]
    P1H --> P3["P3<br/>Official Information & Evidence"]

    P2 --> P4["P4<br/>Common Search"]
    P3 --> P4
    P2 --> P5["P5<br/>Visibility & Control"]
    P3 --> P5

    P4 --> P6["P6<br/>Cross-Domain Authorization Reconciliation<br/>& Security Regression"]
    P5 --> P6

    P6 --> P7["P7<br/>Common-Core Acceptance"]
    P7 --> GH["G-H<br/>COMMON MUNICIPAL ENGINE FREEZE"]

    W["Track W<br/>LGU Workflow Intake / Authority"] -. validated inputs .-> P2
    W -. validated inputs .-> P3
    W -. approved configuration .-> P5

    R["Track R<br/>Production Readiness"] -. parallel evidence .-> P7
```

---

# Hard dependencies

Hard:

`P0 -> A01 -> A02 -> A03/A04 -> P1-H`

Reason:

- generic Task is the missing source domain;
- true Unified My Work cannot include Task until Task contract exists;
- non-destructive integration cannot be accepted until Task + My Work contracts exist.

Other hard rules:

- P4 may not expose an unaccepted source domain;
- P6 final reconciliation must include the actual domains promoted into the common release candidate;
- P7 cannot freeze a capability that has not passed its own accepted contract.

---

# Soft/program-order dependencies

P2 and P3 are sibling maturation/integration areas after P1.

They may overlap if:

- consumed P1 contracts are stable;
- file/domain ownership is bounded;
- no unresolved authority dependency is being invented.

P4 and P5 may overlap after relevant source contracts are available.

Do not interpret the graph as:

`NO P3 UNTIL ALL P2 IS COMPLETE`

or:

`NO P5 UNTIL ALL P4 IS COMPLETE`

Instead:

`NO DOWNSTREAM WORK UNTIL ITS ACTUAL CONSUMED CONTRACT IS RELEASED`

---

# Contract-release gate model

```mermaid
flowchart LR
    D["Backend Domain Truth"] --> A["Authorization / Invariants"]
    A --> C["Backend Contract"]
    C --> CR["Contract Release"]
    CR --> F["Frontend Authorized"]
    CR --> N["Next Backend Dependency May Start"]
    F --> I["Integration"]
    N --> I
    I --> V["Exact-Candidate Validation"]
    V --> H["Series / Phase Acceptance"]
```

---

# Dependency classes

Every dependency in the Engineering Hub must be labeled:

- `HARD-ENGINEERING`
- `SOFT-ENGINEERING`
- `MUNICIPAL-AUTHORITY`
- `DATA/CONFIGURATION`
- `PRODUCTION/PLATFORM`
- `EXTERNAL-INTEGRATION`

Unknown dependency type:

`STOP / CLASSIFY BEFORE SCHEDULING`
