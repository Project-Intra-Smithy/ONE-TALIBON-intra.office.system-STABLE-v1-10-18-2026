# AGENTS.md — ONE TALIBON FRONTEND

## Start here

- [Frontend README](README.md), [contribution rules](CONTRIBUTING.md), [work package memory index](docs/WORK_PACKAGE_CONTINUITY.md).
- [Common Core START/CLOSE protocol](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/main/.forge/memory/WORK-PACKAGE-START-CLOSE-PROTOCOL.md) and [stewardship issue #63](https://github.com/Project-Intra-Smithy/engineering-hub/issues/63).
- Reverify live frontend `main` and the current head/base of any pending PR before editing. Never describe dated SHA examples as the live state.

## Mandatory documentation gate

For **each newly issued, resumed or completed bounded frontend package**, maintain a crosslinked START/CLOSE pair: (1) owning GitHub issue decision with owner/scope/current source SHA/tests/holds and (2) `docs/WORK_PACKAGE_CONTINUITY.md` commit with the same ID and evidence. Crosslink both before execution and before declaring completion. An incomplete pair is `SYNC_REQUIRED / HOLD`. At meaningful cross-session handoff, update both with the delta, next owner, current PR SHA and blockers.

## Current boundaries

- Canonical backend: [Talibon-Sales-Prototype](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype); backend contract/authorization semantics control, not fixture previews.
- Existing [frontend task #1](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/1); compatibility [draft PR #6](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/pull/6), visual [stacked draft PR #7](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/pull/7). Recheck their live state; no implied merge/acceptance.
- Build/typecheck/fixture screens are not authenticated Laravel browser acceptance. No production promotion from passing fixture CI.
- Keep excluded/privileged LGU workflow, HR/personnel data, messaging membership and machine API operations behind explicit authority. Do not replace backend decisions with browser state.
- AJ/Jhayr own their frontend contributions; Kirch makes technical acceptance/integration decisions. Preserve actual authorship and requested scope. No new repo/general audits as a substitute for finishing the assigned work.

## Close and handoff

Record exact backend/frontend tuple, CI/QA/browser evidence, items NOT RUN, remaining defects, deferrals with owner/reopen trigger and single NEXT action **in issue and repo memory**. Crosslink final committed memory SHA before closing an issue. When one write fails, preserve evidence and mark `SYNC_REQUIRED` instead of inventing completion.
