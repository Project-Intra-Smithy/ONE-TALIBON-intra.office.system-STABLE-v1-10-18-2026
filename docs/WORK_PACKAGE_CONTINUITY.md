# ONE TALIBON FRONTEND — WORK PACKAGE CONTINUITY

**Paired START/CLOSE policy:** [KIRION FORGE canonical protocol](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/blob/46b0de3dc1e994d5456f3ecc0902a3265eedcbf6/.forge/memory/WORK-PACKAGE-START-CLOSE-PROTOCOL.md). **Cross-phase stewardship:** [Engineering Hub #63](https://github.com/Project-Intra-Smithy/engineering-hub/issues/63). This file is the **frontend repo memory index** required for cross-session handoffs; backend memory and frontend memory are not substitutes for one another.

**For every new or resumed frontend task:** write an issue `START` with exact `main` SHA, scope, authorized contracts, owner, tests and single NEXT; write a matching short `START` entry below before executing, then comment the memory commit back to the issue. For each acceptance/closure: issue `CLOSE` + memory `CLOSE`, test evidence, outstanding defects and linked next owner, then verify both before closing issue. Partial writes = `SYNC_REQUIRED / HOLD`. No all-purpose audit of unrelated capability families.

## Existing work at installation (10 October 2026)

| Work | Status and actual evidence | Required continuation |
| --- | --- | --- |
| [FRONTEND-REG-001 #1](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/1) | **OPEN**; baseline `main@b018d23d4608f343d179710d4af610b4a473238c`; contributor registration and real Laravel browser integration not yet accepted | Continue with AJ/Jhayr contributions and record next milestone START/CLOSE pair; verify changed source SHA |
| [UI-STAGE-001 draft PR #6](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/pull/6) | **DRAFT/UNMERGED**, head `24105a5e54926e0eddc170b06752056b85b4d0a1`; fixture/TypeScript/build CI passed; actual authenticated integration NOT RUN | Do not overwrite or merge. At next review, checkpoint exact updated SHA and missing Laravel roles/browser evidence on owning issue and memory |
| [UI-VISUAL-001 draft stacked PR #7](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/pull/7) | **DRAFT/UNMERGED**, head `0f9a034149243c6ba599e39eb14ecf8a4022e64c`; stacks on PR #6, fixture screenshots and browser CI; not production acceptance | Resolve visual-review findings and backend-mounted UI verification separately; coordinate PR #6 ordering; sync before formal close |

**Initial entries reflect already-running historical work, not retroactively certified START/CLOSE pairs.** No source, acceptance or Project board changes are granted by this documentation.

## Template for every future row / checkpoint

```md
### START | CHECKPOINT | CLOSE — <work ID> — <UTC date>
- Owning issue / authority / accountable owner:
- Source main@SHA / candidate branch@SHA / PR:
- Actual verified implementation and contracts:
- Scope, non-goals and locked invariants:
- Run/test evidence: PASS/FAIL/NOT RUN (exact CI/screenshot URL):
- Blocking safety or authority needs:
- Deferred work + owner + next trigger:
- Next single action and receiving lane:
- Matching issue comment and memory commit URL:
```

Accepted historical records are immutable provenance. Append subsequent changes; do not silently edit source claims or assert successful browser integration from synthetic fixtures alone.


### START — FRONTEND-REG-001 / 2026-10-10 / KIRCH CONTINUATION
- **Owning issue/decision:** [FRONTEND-REG-001 #1 Kirch START #6093612346](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/1#issuecomment-6093612346). Kirch Technical Authority; human Jhayr (`kyumw3b`) coordination and human AJ (`rynzz22`) real contribution provenance; Nox independent review; Jane backend producer advisory.
- **Pinned source at START:** official frontend `main@7e8eecca4daf3cedec43f774dc8533dd0ad53219`; backend `Project-Intra-Smithy/Talibon-Sales-Prototype@92778ba06d992c278177e0354014ab1b77dbea82` READ ONLY; isolated reference `The-Kirion-Smithy/ONE-TALIBON-LUCIEN-FRONTEND@744db7b6d568dbe0e39e80ed82a244d57f33d4f8`. No code source branch created by this START.
- **Preserved candidates:** [official draft #6](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/pull/6) at `24105a5e54926e0eddc170b06752056b85b4d0a1` and its [draft stacked #7](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/pull/7) at `0f9a034149243c6ba599e39eb14ecf8a4022e64c`, both hosted build checks success; actual official authenticated integration still NOT RUN.
- **Scope released after paired readback:** coordinate true human contributions and original author/source inventory; verify contributor permissions; reconcile current baseline and existing stacked drafts; collect clean disposable authenticated Laravel desktop/mobile/negative-case proof at an exact source tuple; no unreviewed source changes.
- **Hard holds:** No F01/F02 implementation or Task route rewrites (C1 `/tasks` JSON only); no automatic PR #6/#7 merge, no backend or official production writes, no fabricated municipal flows; backend A01-W01–W05 and C1 already accepted, not reopened.
- **Access/blockers:** AJ `rynzz22` GitHub permission reported `none`; Jhayr `kyumw3b` returned `null/unconfirmed`; current #1 assignee `catzdevw` identity unverified. Resolve before human code submissions, never impersonate an owner.
- **Actual tests:** prior official #6 and #7 hosted build checks PASS; authentic official Laravel employee/admin desktop/mobile, Calendar/notifications, MFA/logout/access negatives NOT RUN. Isolated Lucien Codex reported 60 PASS/0 FAIL/3 NOT RUN on a **different scoped assembly**, not transferable as official PR acceptance.
- **Issue ↔ memory reciprocal proof:** issue START comment #6093612346 links this exact work package; after committing, append resulting memory commit SHA to issue #1 and verify. CLOSE requires independent evidence and Kirch decision; keep #1 open until then.
- **Single NEXT:** ensure memory START_SYNCED, verify AJ/Jhayr identity/permission and actual source packages, then stage genuine official PR #6/#7 disposable compatibility tests. No Task F01/F02 start.


### START — FRONTEND-REG-001-RT-CI-001 / 2026-10-11 — SHARED RUNTIME CI HANDOFF
- **Authority / owner:** Kirch Ivan Balite (`Kirch-Nairu`), human Technical Authority, [runtime acceptance Issue #10](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/10). Implementer Kirion-Lucien; canonical Laravel/security adviser Kirion-Jane (`Kirion-KimiForge`); independent reviewer Kirion-Nox; Kirch controls runner/credential permissions and final acceptance. Paired Issue #10↔memory START is necessary before G2 source code writes; this commit is documentation only.
- **Initial source tuple:** frontend official `main@9fff20feeb647c3de140603ad76d775caeaba5db` frozen, code integration review candidate `forge/frontend-reg-001-laravel-compat-fix-r2@d66c677c830b84326765cee9046b018a7c0ab91d` (draft PR #9, NOX [source approval #5480357139](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/pull/9#pullrequestreview-5480357139)); PR #7 `0f9a034149243c6ba599e39eb14ecf8a4022e64c` and PR #6 `24105a5e54926e0eddc170b06752056b85b4d0a1` are ancestors. Backend READ ONLY `Project-Intra-Smithy/Talibon-Sales-Prototype@92778ba06d992c278177e0354014ab1b77dbea82`. Separate CI lane `forge/frontend-reg-001-runtime-ci-r1` branches from above frontend main; not from PR #9. No application source mutates in this lane.
- **Actual state and evidence:** standalone frontend CI and NOX source review PASS; Codex-reported native selective assembly TypeScript 33→0 and Vite build 31.85s PASS but complete local logs not yet published or independently replayed. Real Laravel/PostgreSQL/Chromium authenticated browser/negative-security verification NOT RUN. No integration or production acceptance.
- **Runner discovery:** canonical backend historical workflow `.github/workflows/p0-windows-self-hosted-validation.yml` requests `[self-hosted, Windows, X64, talibon-p0-temp]`; no evidence yet that runner is ONLINE, safe/isolated, or visible to the official frontend repo. This is the primary H0 prerequisite. Frontend `main` existing workflow is frontend-only.
- **Bounded path authority (post H0):** `.github/workflows/frontend-reg-001-runtime-acceptance.yml`, `scripts/ci/frontend-reg-001/**`, `tests/runtime-acceptance/**`, and `docs/WORK_PACKAGE_CONTINUITY.md` only. Backend PHP/JS and frozen PR #6/#7/#9, frontend main, production assets, routes, deployment and real data are protected. STOP for specific scope expansion. Any Actions default-branch `workflow_dispatch` bootstrap/merge separately requires Kirch release.
- **Execution guards:** review exact frontend/backend SHAs, explicit selective file overlay/manifest, authentic private backend read-only checkout token, safe self-hosted runner trust, exclusive disposable loopback PostgreSQL DB/fixture, fail-closed cleanup. No privileged PR-triggered jobs, no `pull_request_target`, production credentials, personal files, or secrets in logs/artifacts. Independent NOX workflow-security review BEFORE runner execution. Browser evidence must reflect real Laravel + CSRF/MFA/session/auth and 401/403/404/419/422/429 negatives, no synthetic fixture substitution.
- **Subtasks:** Jane G1 READ ONLY runtime contract/fixtures, Lucien G2 CI implementation after H0+paired START, Nox G3 review before privileged execution plus evidence acceptance afterwards. For missing prerequisites, report BLOCKED rather than claiming PASS.
- **Current status:** `HANDOFF ISSUED / ISSUE-MEMORY PAIRING IN PROGRESS / RUNNER PREFLIGHT HOLD / NO CI CODE START / NO RUNTIME EXECUTION`.
- **NEXT:** Kirch verifies isolated self-hosted runner availability for official frontend repo and its private-backend read credential; Jane/Lucien/Nox acknowledge Issue #10; then Lucien proposes exact CI workflow to NOX without touching accepted app source.
