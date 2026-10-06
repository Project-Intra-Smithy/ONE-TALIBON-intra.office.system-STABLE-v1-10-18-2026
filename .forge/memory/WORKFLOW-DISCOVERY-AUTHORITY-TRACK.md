# KIRION FORGE MEMORY — WORKFLOW DISCOVERY & AUTHORITY TRACK

## Purpose

This track prevents department-specific business truth from contaminating common-system engineering.

It runs in parallel with P1-P7.

---

# 1. Source classes

Possible workflow evidence:

- current LGU workflow package;
- current forms/templates;
- Citizens' Charter;
- office manuals;
- legal/policy basis;
- process-owner interview;
- organizational/role records;
- existing system screenshots/exports;
- historical source code;
- stakeholder correction/approval.

No single documentary source automatically equals current implementation authority.

---

# 2. Citizens' Charter classification

Source:

`TALIBON-BOHOL_CITIZENS-CHARTER-HANDBOOK`

State:

`SUPPORTING MUNICIPAL PROCESS REFERENCE — VALIDATION REQUIRED`

Use it to seed discovery of:

- services;
- offices/divisions;
- requirements;
- client steps;
- agency actions;
- responsible personnel;
- fees;
- processing times;
- cross-office handoffs;
- outputs/releases;
- recurring workflow patterns.

Do not convert Charter rows directly into:

- backend states;
- permissions;
- routing rules;
- approval authority;
- SLA logic;
- confidentiality;
- official KPI;
- schema;
- implementation acceptance.

---

# 3. Workflow status machine

Every department/service workflow entering Engineering Hub must use this state model:

`DOCUMENTED / RECEIVED`

-> `COMPLETENESS REVIEW`

-> `CLARIFICATION REQUIRED` when needed

-> `TECHNICALLY MODELED`

-> `PROCESS-OWNER CORRECTION` when needed

-> `PROCESS-OWNER VALIDATED`

-> `BASELINE READY`

-> `IMPLEMENTATION AUTHORIZED`

-> `TECHNICALLY ACCEPTED`

-> `UAT VALIDATED` where applicable

A workflow may not skip from documentary evidence directly to implementation authority.

---

# 4. Required discovery matrix fields

For each workflow/service record:

## Identity
- workflow/service ID;
- office/division;
- process owner;
- public/internal classification;
- source documents;
- source dates/versions.

## Trigger / intake
- trigger;
- initiating actor;
- intake channel;
- required fields;
- required documents;
- prerequisites.

## Responsibility
- receiving office;
- responsible role/person class;
- assignment authority;
- custody rules;
- reassignment authority.

## Processing
- steps/actions;
- review;
- validation;
- inspection;
- return/correction;
- exceptions;
- escalation.

## Approval / output
- reviewer;
- approver/signatory;
- output/release;
- evidence/record produced;
- acknowledgement requirements.

## Time / money / policy
- documented processing time;
- official SLA if separately validated;
- fees/payment evidence;
- confidentiality;
- retention;
- legal/policy basis.

## Reporting
- required reports;
- official KPI if any;
- audit expectations.

## Validation
- current-owner confirmation;
- changed/obsolete/unclear items;
- open clarifications.

## Technical mapping
Choose only after sufficient truth:
- `CONFIGURE EXISTING COMMON ENGINE`
- `SHARED EXTENSION CANDIDATE`
- `SPECIALIZED DOMAIN`
- `EXTERNAL INTEGRATION`
- `OUTSIDE SCOPE`
- `INPUT REQUIRED`

---

# 5. Configure -> extend -> specialize decision law

Question 1:

Can the validated workflow be represented truthfully using accepted common capabilities?

YES -> `CONFIGURE`

NO -> Question 2:

Does the missing behavior recur across multiple validated workflows/offices and belong naturally in shared architecture?

YES -> `SHARED EXTENSION CANDIDATE`

NO -> Question 3:

Does validated business truth require a unique lifecycle/domain?

YES -> `SPECIALIZED DOMAIN`

Otherwise:

`CLARIFICATION / INPUT REQUIRED`

Do not build abstractions merely because several Charter tables look superficially similar.

---

# 6. Known current authority/input records

At common-program lock preparation, preserve at least:

- `ORG-001` authoritative office/employee roster;
- `ROLE-001` final municipal role/permission matrix;
- `MEET-001` Meeting lifecycle/ownership/participants/minutes/action authority;
- `ANN-001` Announcement publisher/audience/lifecycle/acknowledgement authority;
- `KPI-001` official management indicators;
- `VICE-001` Vice Mayor requirements;
- `PROC-001` Procurement cross-office lifecycle;
- `PROJ-001` Project Monitoring lifecycle/data/KPI;
- `WF-001` departmental workflow packages;
- `WF-002` workflow ambiguities/clarifications.

These are not automatically common-program blockers.

Their blocking effect must be linked to the specific Series/work package that actually consumes them.

---

# 7. Frontend handoff authority block

Any frontend package touching an input-gated workflow must contain:

`COMMON CONTRACT STATUS`

and:

`DEPARTMENT-SPECIFIC BUSINESS DATA STATUS`

If department-specific truth is missing:

`BLOCKED — LGU / PROCESS-OWNER INPUT REQUIRED`

Frontend may implement only the approved common shell/contract and must not manufacture missing process behavior.
