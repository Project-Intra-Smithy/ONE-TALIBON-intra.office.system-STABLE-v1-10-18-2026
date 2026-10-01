# KIRION FORGE — INTRA REAL-SYSTEM TRANSITION

## Authority

Technical Authority: **Kirch Ivan Balite**

Source branch: `main`

Exact source SHA: `269975e1c1e61bcde78490530e5cc8e90f35ae47`

Program branch: `KIRION-INTRA-REAL-SYSTEM-TRANSITION`

This directive is an explicit post-showcase product expansion authorized by Kirch Ivan Balite. It does not rewrite accepted showcase history, tags, evidence, or prior promotion claims.

## Program decision

ONE TALIBON INTRA is no longer to be planned as a showcase-oriented prototype product line.

The target is a literal municipal intra-office operating system with authoritative backend behavior, durable domain ownership, traceable work, office-aware authorization, records evidence, and real coordination workflows.

This does **not** mean existing prototype labels may simply be renamed away. A module is non-prototype only when its authoritative server-side model, authorization, persistence, lifecycle, auditability, and tests are real enough to support its product claim.

## Governing product model

INTRA is not one generic transaction system.

The following domain meanings are separate and must remain separate:

- **Task / Assignment** — delegated work that may remain entirely inside one department.
- **Work Request / Workflow Transaction** — formal work crossing office boundaries or following an explicit routed workflow.
- **Correspondence** — official transmitted communication that may exist independently and may create or link operational work.
- **Document** — an authored or uploaded artifact linked to operational or institutional objects.
- **Record** — retained institutional evidence; not every document is automatically a formal record.
- **Message** — lightweight collaboration; conversation may create or link work but is not itself the accountability engine.
- **Memorandum** — official distributed instruction/information with audience and acknowledgement semantics where required.
- **Announcement** — targeted organizational information distribution.
- **Meeting** — a coordinated official activity with participants, agenda, minutes, decisions, action items, and links to resulting work when implemented.
- **Calendar Event** — a cross-cutting schedule projection published by authoritative domains where appropriate.

Do not collapse these into one generic `activity`, `item`, or `transaction` abstraction merely for implementation convenience.

## Organizational routing invariant

The municipality is hierarchical, but ordinary routing is not Mayor-centric.

Allowed normal relationships include:

- Department Head -> staff;
- staff -> Department Head;
- Department -> Department;
- Department -> Mayor's Office when executive action is actually required;
- Mayor's Office -> Department under executive authority.

The Mayor remains the chief executive / executive authority and must not become a mandatory routing node for ordinary office-to-office work.

Direct departmental workflows are first-class behavior.

## Existing foundation to preserve

Do not discard working accepted foundations merely because the product is leaving prototype status.

Preserve and evolve:

- department and employee identity;
- direct inter-office transaction routing;
- current Department Head office-queue semantics;
- assignment ownership;
- priority, due-date and overdue semantics;
- correspondence registration/classification/routing/action lifecycle;
- correspondence-to-workflow linkage;
- document linking/evidence foundation;
- records registry/search foundation;
- memorandum delivery/acknowledgement foundation;
- calendar event backend foundation;
- executive oversight as a distinct lane;
- backend authorization as the source of enforcement;
- event/audit history patterns;
- accepted S1 showcase lineage and rollback evidence.

## Mandatory domain correction

### First-class Task

A general Task / Assignment domain must exist independently from inter-office `WorkflowTransaction`.

Required capability:

- Department Head can create work for an employee in the same department;
- authorized employees can receive, act on, update, complete, or return tasks according to policy;
- tasks have stable ownership, status, priority, due date, creator, assignee, department context, history, comments/evidence links, and completion evidence as appropriate;
- same-department work must not require a fake receiving department;
- Task does not become an alias for Transaction.

### My Work becomes an aggregate workspace

`My Work` is a user experience, not a single database entity.

It must eventually aggregate authoritative projections from multiple work-producing domains, at minimum:

- Tasks assigned to me;
- inter-office work assigned to me;
- requests I created;
- work waiting on another office;
- due soon / overdue;
- recently completed;
- Department Head office queue;
- unassigned office work;
- staff workload;
- escalations;
- executive approvals where authorized.

Existing transaction-backed queue behavior should be preserved while Task becomes a first-class contributor.

## Prototype-only areas that must mature

### Messaging

The current prototype messaging bridge must not be relabeled as production messaging without replacement or explicit migration.

A real messaging domain requires, at minimum:

- conversation/room identity;
- membership/participants;
- authorization by membership and organizational policy;
- read state;
- message persistence and retention rules;
- attachment/link semantics;
- audit/deletion/moderation policy;
- notifications;
- a defined transport/realtime strategy;
- links from Message -> Task / Transaction / Record where authorized.

### Meetings

A frontend/reference meeting register is not the final meeting system.

A real Meeting domain should support:

- meeting identity;
- organizer;
- participants/offices;
- schedule/location;
- agenda;
- attachments;
- minutes;
- decisions;
- action items;
- resulting Task/Transaction links;
- Calendar publication;
- completion/cancellation/reschedule lifecycle;
- authorization and audit history.

### Announcements

Announcements must become an authoritative publishing/distribution domain rather than static reference data.

Required direction:

- author/issuing office;
- audience targeting;
- priority;
- publish/expire lifecycle;
- visibility enforcement;
- acknowledgement/read semantics only where product policy requires them;
- audit history.

### Records

The current operational records register is a valid foundation but is not yet a complete records-management system.

Mature incrementally toward:

- formal record declaration;
- classification;
- custodian / responsible office;
- relationships to source objects and documents;
- retention code / schedule integration;
- archival state;
- disposition authorization and evidence;
- immutable audit trail for lifecycle actions.

Do not claim full electronic records management until these controls are implemented and accepted.

## Coordination model

Communication and scheduling support operational work; they do not replace it.

Target link patterns include:

- Message -> create/link Task;
- Message -> link Transaction;
- Meeting -> action items -> Tasks/Transactions;
- Meeting -> Calendar Event;
- Approved Travel / official schedule -> Calendar Event;
- Correspondence -> linked Work Request when action is required;
- operational object -> Documents;
- completed/declared evidence -> Records.

## Non-prototype claim gate

A domain may be presented as production-grade / operational only when all applicable gates pass:

1. authoritative backend persistence;
2. server-side authorization;
3. explicit lifecycle and terminal states;
4. ownership / responsibility semantics;
5. validation and negative authorization tests;
6. audit/event history for meaningful mutations;
7. deterministic user-visible failure behavior;
8. no dependence on static reference/demo data for authoritative state;
9. migration strategy for prior prototype data where applicable;
10. accepted Forge Reviewer / Acceptance evidence.

Passing a UI demo is not sufficient.

## Program lanes

### R0 — Real-System Baseline Audit

Re-audit current live code against this directive. Produce a domain-by-domain matrix of authoritative, partial, prototype-only, static/reference, missing, and unsafe-to-claim behavior.

No redesign by assumption. Exact source paths and tests are required.

### R1 — First-Class Task + My Work Aggregation

Introduce the Task domain and integrate it into My Work without weakening existing WorkflowTransaction routing.

### R2 — Messaging Authority Replacement

Replace/migrate the temporary messaging bridge with a real membership/authorization/persistence model.

### R3 — Meetings + Announcements Authority

Replace reference/static operational surfaces with authoritative backend domains and lifecycle tests.

### R4 — Records Lifecycle Foundation

Add formal record declaration/classification/custody/retention/archive groundwork without pretending to complete all records-governance law/policy in one lane.

### R5 — Cross-Domain Coordination

Add safe links and projections among Messages, Tasks, Transactions, Correspondence, Meetings, Records, Documents, Notifications, and Calendar.

### R6 — Production Hardening + Deployment Architecture

Address deployment, queueing, storage, backups, observability, secrets, environment separation, notification transport, concurrency, failure recovery, security review, and operational runbooks.

No production deployment claim is allowed merely because product domains mature.

## Explicitly prohibited shortcuts

- do not rename `Prototype*` classes and declare the problem solved;
- do not convert all domain objects into one generic table/model;
- do not route ordinary Department -> Department work through the Mayor;
- do not model intra-department Task as a fake inter-office Work Request;
- do not make Messages the system of accountability;
- do not treat every uploaded file as a formal municipal Record;
- do not expose static/reference data as authoritative production state;
- do not make frontend visibility the only authorization control;
- do not destroy accepted showcase/UAT data while developing migrations;
- do not merge broad lanes without Reviewer and Acceptance evidence.

## Immediate next transition

The next implementation transition is **R0 — Real-System Baseline Audit**.

R0 is read-only against product code. It must enumerate the exact changes needed for R1-R6 before implementation begins.

The purpose of R0 is to prevent another prototype-shaped implementation from being promoted by terminology alone.
