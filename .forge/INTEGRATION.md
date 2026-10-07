# ONE TALIBON — CURRENT INTEGRATION POLICY

## Authority

Technical Authority: **Kirch Ivan Balite**

## Source-resolution rule

Before preparing, accepting or integrating executable work, resolve live product `main` directly from Git.

A dated audit SHA is historical evidence, not a permanent current-source pointer.

Accepted anchors may remain recorded for provenance:

P0 accepted executable/runtime anchor:

`395438674b4d2f00659eba616db760b339bb390a`

Common-program / A01 opening source:

`f2ff373113f89173016634505eb3c3943edfb35c`

Neither anchor substitutes for current source resolution.

For current candidate/work state, read:

- `.forge/SSOT_CURRENT.md`
- `.forge/WORK_LEDGER.md`
- the current Series plan
- the explicitly current issued handoff, when one exists

## Series integration law

A Series is integrated only after its required human lanes and evidence are satisfied.

Standard path where applicable:

`HUMAN IMPLEMENTATION`
-> `DEVELOPER SELF-VALIDATION`
-> `EXACT CANDIDATE / RELEASE TUPLE`
-> `KURT CI/CD`
-> `SIRIS QA`
-> `KIRCH TECH LEAD ACCEPTANCE`
-> `CONTROLLED INTEGRATION`
-> `RECORDED KNOWN STATE`

CI or QA alone does not authorize integration.

Maintainer/AI does not self-promote a candidate.

Executable source changes after validation create a new candidate and require affected revalidation.

## Cross-repository integration

When backend and frontend live in separate repositories, integration evidence must identify:

- backend repository + exact SHA;
- frontend repository + exact SHA;
- backend contract/version consumed;
- relevant schema/config state;
- CI/CD evidence;
- QA evidence;
- Kirch disposition.

## A01 integration boundary

A01-W01 is a backend sub-package inside A01, not a Series integration event.

Its current release/block state is owned by the current SSOT and work ledger.

The historical W01 branch is provenance only and must not be resumed. Any later W01 release requires a fresh exact source from then-current product `main`.

Frontend integration remains contract-gated by:

`A01-C1 / BACKEND CONTRACT RELEASE + FRONTEND-REG-001`

This file does not itself release backend or frontend implementation.

## Collision rule

If two active packages require the same owned source or conflicting contract changes:

- stop;
- do not merge competing interpretations opportunistically;
- return to Maintainer / Technical Authority;
- re-sequence or reissue ownership.

## Historical integration evidence

Historical RC1, MP-series, Phase-0 and other prior integration records remain provenance only. They do not define the current A01 integration state unless explicitly re-adopted by current authority.
