# KIRION FORGE — WORK PACKAGE START/CLOSE MEMORY PROTOCOL

**Control:** COMMON-CORE-CTRL-001 / [Engineering Hub #63](https://github.com/Project-Intra-Smithy/engineering-hub/issues/63)  
**Status:** Mandatory for newly started, resumed, handed-off or concluded bounded Forge work packages.  
**Accountable authority:** Kirch Ivan Balite. Implementation owners, reviewers, CI and QA remain the real accountable lanes defined in each work package.  
**Applicability:** Backend, frontend, contracts, architecture, QA, CI, security, deployment, operations and program-control tasks. This is a work-continuity protocol, not a new product capability, new phase, acceptance or automatic task scheduler.

## Non-negotiable rule

**No work package starts without two linked START records. No work package is represented as accepted/closed without two linked CLOSE records.**

1. **GitHub issue record:** the existing owned work item in the Engineering Hub or task repository. Keep one issue per meaningful deliverable; avoid one issue for every command, audit pass or documentation edit.
2. **Repository memory record:** a durable, reviewable Markdown entry **in the repository that owns the work**, indexed from a known stable path. For canonical backend use [`.forge/memory/WORK-PACKAGE-REGISTER.md`](WORK-PACKAGE-REGISTER.md). For frontend, use a comparable tracked `docs/` or `.forge/memory/` index in the frontend repository, explicitly linked from its README. For Hub-only governance work, use the Engineering Hub repository's tracked control memory. A note on a disposable execution branch alone is not sufficient; the start/close index needs to be discoverable from that repository's canonical branch.

The work package owner proposes accurate updates. The **Maintainer ensures paired publication and crosslinks**. The writer must verify both before code changes. Kirch or his expressly authorized lane supplies actual release approval. A successful GitHub comment by itself is **not** durable repository memory, and a memory-only commit is **not** an issued work order.

## Start protocol (before executing a new work package)

A. **Preflight:** read the owning issue, this protocol, the owning Series plan, live repository main, applicable acceptance gates and actual relevant code. Prefer existing evidence; do not repeat a general audit if source and assumptions still hold. Name the responsible lane.

B. **Record START in the owning issue** using the template below; identify exact source SHA, target repo/branch strategy, small owned scope, exclusions, allowed backend contracts, required tests, known blockers, and the expected return. No vague promises of autonomous action.

C. **Record START in owning repository memory**: add or update a compact register entry referencing the exact issue/START comment, base SHA, scope, owner, state and single NEXT action. For a new branch, the maintained index must be visible on canonical main before calling the work package active. Documentation-only updates to canonical main need their own strict source guard and must not alter application code.

D. **Crosslink:** comment on the issue with the memory path and exact published memory commit SHA, then verify both URLs and source status. Only then mark `START_SYNCED / READY_TO_EXECUTE`. If GitHub permissions or a merge gate prevents one record, set `SYNC_REQUIRED / HOLD`, link the draft artifact, and **do not claim the work was formally started**. If code has already been written, preserve it as provisional and reconcile records immediately; do not rewrite history.

E. **Writers:** check the START pair against current Git and the issue before pushing work. Stop on scope/ownership conflict or a non-fast-forward source drift that invalidates the contract. Preserve actual Git author and committer identities.

### Minimum START record

```md
### START / <PHASE-SERIES-WORK-ID> / <UTC date>
- Owning issue + accountable owner:
- Work type: implementation / architecture / CI / QA / operations / documentation
- Canonical repository@source SHA; target branch/PR strategy:
- What exists already, with reference:
- Precise missing requirement / owned files / success criterion:
- Contracts + authority assumptions:
- Prohibited scope / preservation invariants:
- Mandatory safety/negative tests + independent acceptance gates:
- Known holds or deferred items and their owners:
- Single next executable action:
- Repo memory path and published memory SHA: <pending until synced>
```

## Mid-work handoffs and non-final stops

When switching sessions, humans, branches or agents, leave a **checkpoint on both surfaces** *if* next action, verified candidate SHA, scope, blocker or authority changes. Link the prior START and append only the delta; do not duplicate large histories.

A checkpoint must expose: current branch/PR@SHA, what actually ran, PASS/FAIL/NOT RUN, remaining uncertainty, any new deferred obligations, and who goes next. A stuck task is `BLOCKED`, not secretly closed; a review result is not a CI result. For unchanged work no new note is needed.

## Close protocol (before accepting/closing any package)

1. **Evidence first:** verify current source candidate, changes actually merged or not, exact CI/QA/browser or test run provenance, regression/rollback evidence, approvals and known limitations. Separate `NO-CODE`, `IMPLEMENTED`, `MERGED`, `CI_PASS`, `QA_PASS`, `INTEGRATED`, `ACCEPTED`, `PRODUCTION_READY`.
2. **Decision on the owning issue:** record explicit disposition `ACCEPTED / REWORK / BLOCKED / SUPERSEDED / NO-CODE`, by actual authority. Include evidence and any unfulfilled gates; do not close an issue that still needs work by describing it as complete.
3. **Repository memory CLOSE write:** same work ID, final issue and PR links, released/merged/executable SHAs, test evidence, what remains deferred/authority-held, exact next gate/owner, and *why* it is safe or not to move forward. Carry those obligations into the owning follow-on issue/P6/P7/Track R rather than letting them vanish.
4. **Crosslink and verify:** add a short issue comment with memory path and final commit SHA. Verify current state, expected SHA, recorded decision and remaining next owner. Only then close the issue if authorized and warranted.
5. **Closure consistency:** if one surface fails to publish, mark `CLOSE_SYNC_REQUIRED`, leave the issue open (or explicitly correct a prematurely closed issue), and stop declaring complete. Never fabricate a link, testing, release, independent reviewer, author or human approval.

### Minimum CLOSE record

```md
### CLOSE / <PHASE-SERIES-WORK-ID> / <UTC date>
- Owning issue / START comment / repository memory START ref:
- Disposition and actual deciding authority:
- Source baseline -> final repo@commit/PR/release tuple:
- Changed / confirmed-no-code behavior; exact accepted scope:
- Tests and evidence with full run/artifact reference (or NOT RUN):
- Mandatory gates passed; gates NOT awarded:
- Outstanding blockers, risks, deferred work + owner + reopening trigger:
- Next owning issue / next exact executable action:
- Repository memory CLOSE commit + verification:
```

**NO-CODE closure is a first-class outcome:** cite why existing behavior suffices, tests and accepted limitations. No new branch or new implementation is needed just to prove activity.

## Memory register maintenance

- Keep one short row per active or recently concluded work ID in the owning repository register. **Index, don't duplicate the full issue**. Long details belong in bounded issue, PR and linked evidence.
- Once accepted, freeze the verified CLOSE decision as historical provenance. Append later corrections/reopen records with their own date and source; never silently rewrite the acceptance conclusion.
- On reopening, use the same ID and a new `REOPEN/START` record if same scope; use a linked new issue only if a genuinely different deliverable has its own owner and acceptance.
- Do not add unverified "current main" SHAs in long-lived instructions. Each execution resolves `main` live. Record exact SHA at the time of each START/CLOSE in the corresponding row/comment.
- Commit only non-secret process and evidence references; never private employee data, auth credentials, tokens, backups or production dumps into the memory files.
- Require a read of this protocol in every Maintainer and Code Writer work-start handoff. Reviewer, CI and QA lanes must honor it when their own bounded package starts or closes.

## Drift / failure recovery

GitHub issue comments and Git commits cannot be updated as a single cross-repository transaction. **Do not claim atomic two-record publication.** If interrupted, retain whatever safely published, add `SYNC_REQUIRED` in the surviving surface, compare current SHAs, complete the missing side and crosslink. The last verified pair is authoritative. An issue marked CLOSED with no matching repository CLOSE requires a corrective sync (and, if necessary, a reopen), not a fabricated retroactive PASS.

At future resume, answer exactly: (1) owning work ID, (2) last START/CLOSE memory+issue pair, (3) verified current source versus that pair, (4) open gate/authority hold, (5) next action and owner. Avoid re-censusing the full repository unless specific drift invalidates prior evidence.

## First current anchors (do not promote their states)

- [A01-W04 #21](https://github.com/Project-Intra-Smithy/engineering-hub/issues/21): Nox's [source-backed NO-CODE review](https://github.com/Project-Intra-Smithy/engineering-hub/issues/21#issuecomment-6083235612) is complete; **Kirch human disposition still pending**, issue open. No additional `AuditLog` linkage accepted. Do not report CLOSED.
- [A01-W05 #22](https://github.com/Project-Intra-Smithy/engineering-hub/issues/22): [bounded evidence plan](https://github.com/Project-Intra-Smithy/engineering-hub/issues/22#issuecomment-6083367828) prepared; **execution not released/run**. Must START-sync before work begins; preserve historical C1 CI provenance.
- [COMMON-CORE-CTRL-001 #63](https://github.com/Project-Intra-Smithy/engineering-hub/issues/63): stewardship/control START recorded; this protocol and register are its repository memory. Its closure is a separate future issue + repo memory decision after adoption.

## Source of authority

Follow `.forge/AUTHORITY.md`, `.forge/SSOT_CURRENT.md`, accepted Series plans, and [Common Core continuity control #63](https://github.com/Project-Intra-Smithy/engineering-hub/issues/63). This protocol **governs documentation and continuity**; it does not supersede Kirch's technical decisions, human CI/QA ownership, LGU process authority, source-verified contracts, or GitHub Projects' distinct custom fields.
