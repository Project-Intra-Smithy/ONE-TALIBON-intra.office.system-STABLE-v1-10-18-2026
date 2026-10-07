# KIRION FORGE MEMORY — FIVE-HUMAN TEAM / SERIES DELIVERY MODEL

## Authority

Technical Authority: Kirch Ivan Balite

This memory corrects the operational interpretation of the accepted common-system program. It does not alter P0-P7 architecture.

## Human team

ONE TALIBON's current engineering delivery team is five humans:

- Kirch Ivan Balite — Tech Lead / Systems Architecture / Backend / integration / final technical acceptance
- AJ Rienze Josol — Frontend Developer
- Jhayr — Frontend Developer
- Kurt Shine Khase Halasan — CI/CD / Development Operations
- Siris — Quality Assurance

LGU/process owners supply municipal business truth. They are external authority/input participants, not engineering implementation owners.

KIRION Forge / ChatGPT is an engineering assistant and Maintainer mechanism, not a human team member.

## Series definition

A Series is a bounded product capability.

Examples:
- A01 — First-Class Task Domain
- A02 — Unified My Work Projection
- B01 — Notification Responsibility / Event Integration

A Series is not equivalent to one backend branch or one AI handoff.

## Standard Series lifecycle

Where the capability requires the applicable lanes:

1. Kirch authorizes Series scope, source, dependencies, owners and acceptance rules.
2. Backend/technical foundation is implemented by Kirch or another explicitly assigned human.
3. Backend contract is released when stable enough for frontend.
4. AJ/Jhayr implement assigned frontend slices against that contract.
5. Each developer self-validates their owned work.
6. Exact candidate SHA or cross-repository release tuple is fixed.
7. Kurt executes CI/CD validation and records evidence.
8. Siris executes independent functional/negative/regression QA.
9. Kirch reviews architecture, scope, integration impact and evidence.
10. Accepted work is integrated and recorded.
11. Series is frozen; next Series is authorized.

QA PASS alone does not authorize the next Series.
CI PASS alone does not authorize integration.

## Parallelism

The workflow is gated but not globally serial.

Allowed when explicitly authorized and non-conflicting:
- AJ and Jhayr on separate frontend lanes/Series;
- backend preparation on independent Series;
- QA planning;
- CI/CD preparation;
- documentation;
- agentic repository analysis;
- LGU workflow intake;
- production-readiness work.

The rule is SAFE PARALLELISM + CONTROLLED CANONICAL INTEGRATION.

## Human ownership

Every executable work package identifies:
- human owner;
- repository;
- exact source;
- owned files/surfaces;
- prohibited scope;
- validation;
- stop conditions;
- return contract.

AI may assist the human owner but does not become the owner.

## A01 application

A01 is the whole First-Class Task Domain Series.

Current internal backend decomposition may include:
- A01-W01 — Task persistence/model foundation;
- A01-W02 — lifecycle/authorization;
- A01-W03 — application/backend contract;
- A01-W04/W05 — events/audit/backend acceptance.

Those are Kirch/backend sub-packages unless separately reassigned.

A01 frontend begins only after contract release + FRONTEND-REG-001 and is assigned to AJ/Jhayr through explicit bounded frontend work packages.

A01 then proceeds through Kurt CI/CD, Siris QA, and Kirch final acceptance/integration.

## Forge role boundary

Forge personas such as Maintainer, Code Writer, Reviewer and Acceptance are assistant/control roles.

They may draft/implement bounded work under human ownership, inspect source, prepare evidence, detect drift, prepare handoffs and propose disposition.

They may not silently replace:
- assigned human developer ownership;
- Kurt's CI/CD gate;
- Siris's QA gate;
- Kirch's technical acceptance;
- LGU/process-owner business authority.

## Anti-drift

When chat memory, a Project board, an AI handoff, or a generic lane conflicts with the five-human Series model, stop and reconcile from repository-backed authority before issuing executable work.
