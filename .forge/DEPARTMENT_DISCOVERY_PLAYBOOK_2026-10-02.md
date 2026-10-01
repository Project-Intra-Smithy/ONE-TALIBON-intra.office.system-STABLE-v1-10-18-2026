# KIRION FORGE — DEPARTMENT DISCOVERY PLAYBOOK

Date: 2026-10-02

Purpose: capture real per-office municipal workflow truth only after the generic INTRA core is stable enough to configure it.

This playbook prevents the engineering team from inventing department-specific workflows from examples, chat discussions, folder names, or assumptions.

---

# 1. Discovery principle

The LGU/problem owner defines and validates real process truth.

The IT team translates that truth into:

```text
LGU Problem
-> Proposed IT Solution
-> Assigned Lead / Team
-> Deliverable
-> Expected Result
```

The generic platform is the default implementation target. A specialized module is justified only when the generic Task / Work Request / Correspondence / Document / Meeting / Record primitives cannot faithfully represent required domain state.

---

# 2. People required in each discovery session

At minimum:

- Department Head or formally delegated process owner;
- one frontline/processing employee who performs the work;
- one records/admin employee where records handling is material;
- Tech Lead / analyst;
- implementation representative when needed.

For cross-office processes, include representatives from both origin and receiving offices before freezing the workflow.

For legally/financially sensitive processes, obtain validation from the appropriate authorized municipal/legal/finance owner rather than inferring statutory rules.

---

# 3. Evidence to request

Where available and authorized:

- current forms;
- routing slips;
- logbooks/registers;
- spreadsheets;
- sample incoming/outgoing documents;
- office orders/memoranda defining authority;
- checklists;
- report templates;
- service standards/SLA documents;
- folder structures;
- current system screenshots;
- recurring reports;
- examples of returned/rejected/problem transactions.

Do not copy sensitive personal/confidential data into design artifacts unless necessary. Prefer redacted examples and structural descriptions.

---

# 4. Core interview

## A. Office identity

1. What is the official office name/code?
2. Is the office routable directly?
3. Does it contain sections/units?
4. Who is the Department Head/process owner?
5. Who may receive incoming work?
6. Who may assign work?
7. Who may review/approve/sign?
8. Who may view office-wide queues/reports?

## B. Incoming work

For each common incoming transaction:

1. What is it called by staff?
2. Who normally sends it?
3. How does it arrive today?
4. Who first receives it?
5. Who checks completeness?
6. What required documents/fields exist?
7. What happens if incomplete?
8. Who assigns the responsible employee?
9. Can it be forwarded to another office?
10. Can multiple offices work in parallel?
11. Is executive approval/signature required?
12. What event means the office has completed its part?
13. What evidence/output is produced?
14. What is the normal deadline/SLA?
15. What makes it urgent/escalated?

## C. Outgoing work

1. What requests does this office commonly send to other offices?
2. Which office receives each request?
3. What expected action is requested?
4. What documents/data accompany it?
5. How does the origin office know it is complete?
6. Does it return to the origin office before final closure?

## D. Internal tasks

1. What work is assigned entirely within the office?
2. Who creates/assigns it?
3. Can staff delegate/reassign?
4. Is review required before completion?
5. What completion evidence is needed?
6. What should appear on Department Head workload views?

## E. Correspondence

1. What official incoming/outgoing correspondence does the office handle?
2. How is it registered/classified?
3. Which correspondence requires resulting operational work?
4. Who may route it?
5. What closes the correspondence lifecycle?
6. What becomes an institutional record?

## F. Meetings

1. What recurring meetings/committees/LSBs does the office support?
2. Who organizes?
3. Who approves minutes?
4. What decisions/resolutions are recorded?
5. How are action items assigned/tracked today?

## G. Files and records

1. Which of the 15 default office categories apply?
2. What additional office-specific categories exist?
3. Which files are active working documents versus official records?
4. What confidentiality categories apply?
5. Who may access each category?
6. What is archived yearly/project-wise?
7. What retention/disposition rules are actually approved?

## H. Calendar / whereabouts

1. Which schedules need office-wide visibility?
2. Which office-head whereabouts/OIC details are useful?
3. Which details are private/restricted?
4. Which events originate from Task/Work Request/Meeting/Travel/Training domains?

## I. Reports and monitoring

1. What does the Department Head ask for weekly/monthly/quarterly?
2. What does the Mayor/management ask for?
3. What external/national/provincial reports are recurring?
4. Which figures are manually compiled today?
5. Which report fields already exist in operational data versus requiring specialized domain capture?

## J. Pain and exceptions

1. Where does work normally get delayed?
2. What is commonly lost/misrouted?
3. What causes repeated follow-up calls/messages?
4. What processes are frequently returned?
5. What happens when the assigned employee is absent?
6. What happens when a Department Head is unavailable?
7. What happens during urgent/emergency processing?
8. What is currently duplicated across spreadsheets/systems?

---

# 5. Workflow capture template

For each discovered process create a record with:

```text
Process Name:
Owning Office:
Origin Actor/Office:
Receiving Office:
Category:
Request Type:
Action Required:
Trigger:
Required Inputs:
Required Documents:
Initial Receiver:
Completeness Validator:
Assignment Authority:
Primary Processor:
Review Authority:
Approval/Signature Authority:
Allowed Forwarding:
Allowed Parallel Work:
Return/Correction Path:
Statuses:
SLA/Deadline:
Escalation Rule:
Confidentiality:
Output:
Completion Event:
Record/Archive Requirement:
Reports Generated:
External System Dependencies:
Known Exceptions:
Process Owner Signoff:
```

---

# 6. Configuration-vs-specialization decision

After discovery, classify the process.

## Class A — Generic Work Request configuration

Use when the process can be represented with:

- category/type/action;
- office routing;
- assignment;
- required documents/fields;
- due date/SLA;
- configurable transitions;
- approval/escalation rules;
- output/evidence.

## Class B — Generic engine extension

Use when several offices need the same missing primitive, such as:

- multi-recipient routing;
- parallel review;
- reusable approval chain;
- checklist/completeness validation;
- structured service-level timers.

Build once into the platform rather than duplicating by office.

## Class C — Specialized module

Use only when the domain owns substantial specialized state/law/calculation beyond routed work.

Examples may include:

- Budget;
- Procurement;
- Accounting/Treasury;
- HR;
- Zoning/Permits;
- Engineering project/technical records;
- GIS;
- eBOSS.

A specialized module still integrates with generic identity, documents, tasks/work requests, notifications, calendar, audit and records where appropriate.

## Class D — External integration

Use when an authoritative external/national/vendor system must remain the source of truth.

INTRA should link/synchronize through an approved integration contract rather than rebuild the external system by default.

---

# 7. Validation workshop

Before implementation, replay each mapped process with the process owner using at least:

- normal case;
- incomplete/returned case;
- urgent case;
- reassignment/absence case;
- cross-office forwarding case;
- approval/signature case;
- completion/archive case.

Ask the owner to confirm:

- who has responsibility at each stage;
- what the employee sees;
- what the Department Head sees;
- what management may see;
- what evidence proves completion;
- what should never be visible outside the authorized office/role.

No specialized workflow is frozen without process-owner validation.

---

# 8. Deliverables per office

Each completed office discovery should produce:

1. Office profile/master-data confirmation.
2. User/role/authority matrix.
3. Incoming/outgoing transaction catalog.
4. Internal Task catalog.
5. Correspondence types.
6. Workflow diagrams.
7. Required field/document matrix.
8. SLA/escalation matrix.
9. Confidentiality/access matrix.
10. Office folder/register mapping.
11. Reports/analytics requirements.
12. Integration dependencies.
13. Configuration-vs-specialization decisions.
14. Process-owner signoff/open questions.

---

# 9. Discovery anti-patterns

Do not:

- ask “what features do you want?” without observing real work;
- implement from a single manager's memory when frontline behavior differs;
- assume Google Drive folder names equal workflow states;
- infer legal approval rules from prototype examples;
- force every office into the same status labels if semantics differ;
- create a new app for every office;
- overload the generic Work Request with specialized financial/legal state;
- promise automation before required inputs/authority are known;
- expose personnel/financial/audit data because it is technically easy;
- treat current spreadsheets as automatically correct master data.

---

# 10. Recommended discovery order

Choose offices that maximize learning across workflow patterns rather than simply going alphabetically.

Suggested categories for pilot discovery:

- planning/project coordination office;
- transaction/finance-heavy office;
- engineering/field-validation office;
- executive/approval office;
- records/admin-heavy office.

Exact offices should be chosen with LGU leadership based on availability and current priority.

The purpose of early discovery is to validate the generic engine against diverse patterns before scaling configuration municipality-wide.
