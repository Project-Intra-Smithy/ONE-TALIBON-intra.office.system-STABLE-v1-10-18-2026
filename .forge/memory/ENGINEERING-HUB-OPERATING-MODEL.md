# KIRION FORGE MEMORY — ENGINEERING HUB OPERATING MODEL

## Purpose

The Engineering Hub is the durable program-control layer for a ONE TALIBON engineering team.

It coordinates repositories, Phases, Series, human-owned work packages, candidates, dependencies, evidence and integration state.

It is not a replacement for Technical Authority, product repositories, or human ownership.

## Human authority

### Kirch Ivan Balite
Technical Lead / Systems Architecture / Backend authority / integration / final technical acceptance.

### AJ Rienze Josol
Frontend Developer.

### Jhayr
Frontend Developer.

### Kurt Shine Khase Halasan
CI/CD / Development Operations.

### Siris
Quality Assurance.

## Maintainer function

The Maintainer may be AI-assisted.

It may reconcile current state, register work, structure backlog, prepare/issue already-authorized handoffs, verify exact source/branch/ownership, reconcile human returns, track candidate SHAs/release tuples, track dependencies/risks/decisions, track Kurt CI evidence and Siris QA evidence, prepare integration state and surface blockers.

It may not invent municipal business rules, redefine architecture, broaden scope, substitute for a human work owner, award CI PASS for Kurt, award QA PASS for Siris, accept/promote over Kirch, or turn Project Status into implementation authority.

## Work hierarchy

PROGRAM -> PHASE -> SERIES -> HUMAN LANE WORK PACKAGE -> CANDIDATE / RELEASE TUPLE -> CI/CD -> QA -> KIRCH ACCEPTANCE -> INTEGRATION -> KNOWN STATE

Example:
COMMON SYSTEM -> P1 -> A01 -> A01-W01 (Kirch backend) -> contract -> A01-Fxx (AJ/Jhayr) -> Kurt CI -> Siris QA -> Kirch acceptance

## Series record

Every Series states:
- capability ID/name;
- TOR/requirement/evidence basis;
- source maturity classification;
- exact source authority;
- dependencies;
- human lane ownership;
- consumed/released contracts;
- prohibited scope;
- authority/input blockers;
- frontend release point;
- migration/compatibility;
- validation;
- Kurt CI gate where required;
- Siris QA gate where required;
- Kirch acceptance;
- integration/freeze;
- next unlock.

## Work-package handoff

Every executable package states:
- Series;
- human lane;
- human owner;
- exact repository/branch/SHA;
- owned scope;
- required work;
- prohibited scope;
- architecture/security rules;
- tests;
- stop conditions;
- return contract.

AI assistance may be noted separately from human ownership.

## Candidate/evidence rules

PASS belongs to the exact candidate.
Changed executable source creates a new candidate.
A cross-repo feature may use a release tuple.
Do not accept vague progress without source/evidence.

## Parallelism

Safe non-conflicting lanes/Series may run in parallel when explicitly authorized. Canonical integration remains gated.

## Anti-drift

Forge exists to finish ONE TALIBON. Do not build more governance after ambiguity is removed and engineering can safely proceed.
