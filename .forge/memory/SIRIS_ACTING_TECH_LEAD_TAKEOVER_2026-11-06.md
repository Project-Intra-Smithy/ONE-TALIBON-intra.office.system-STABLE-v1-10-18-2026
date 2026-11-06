# ONE TALIBON — SIRIS ACTING TECHNICAL LEAD / HANDOFF CONTROL

**Control ID:** `OT-SIRIS-ACTING-TECH-LEAD-TAKEOVER-20261106-R1`  
**Owner appointment:** Kirch Ivan Balite, effective 2026-11-06 PHT  
**Receiving Acting Technical Lead:** Osiris Kedigadash Palac (`Syris-EkzD`)  
**Owning GitHub issue:** [Engineering Hub #162](https://github.com/Project-Intra-Smithy/engineering-hub/issues/162)  
**Existing QA:** [Hub #161](https://github.com/Project-Intra-Smithy/engineering-hub/issues/161)  
**Exact verified source at START:** `Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026@ec17cbfab2a52b55e4f3f45bd5ec199df3858d66`  
**Target date:** 2026-11-20 PHT, approved and independently tested Core Portal **subset**, not entire historical municipality prototype.  
**State until reviewed and merged:** `ISSUE_START_PUBLISHED / MEMORY_PR_PROPOSED / CANONICAL_PAIR_UNVERIFIED / SIRIS_ACK_PENDING`. Do not claim `START_SYNCED` from this PR alone.

## Scope of delegation
Siris coordinates day-to-day technical work: requirements to engineering translation within approved program contracts, source integration/readiness, maintenance lanes, issue consolidation, defect triage, exact-SHA QA/CI/reviewer orchestration, and evidence-backed release recommendations. Kirch retains ownership, release scope and final merge/deploy approval, live credentials, municipal policy/escalation and security exception decisions unless a separate explicit bounded delegation says otherwise. Sir Gerry and authorized LGU/HRMO/Records process owners determine client acceptance, verified office/staff identity and official workflow policy. Repository/org access is **not automatically modified**.

Nox independent nonauthor security; Jane independent frontend/integration; Kurt CI/operations under assigned authorization. Siris cannot independently approve security or QA for changes he authored. Existing single-writer frontend freeze, clean-source controls and review boundaries remain unless separately amended.

## START issue ↔ memory pairing
- Issue START: https://github.com/Project-Intra-Smithy/engineering-hub/issues/162
- Repo memory: this file, proposed on `docs/siris-acting-tech-lead-takeover-20261106-r1`.
- Source base before docs: `ec17cbfab2a52b55e4f3f45bd5ec199df3858d66`.
- Scope: **documentation and governance readback only**; directory reconciliation and validation plan. No app/runtime source changes or municipal data.
- Exclusions: no code changes, security-hold removal, route, migration, DB, CI workflow, deployment, permissions or production secrets.
- Next: independent docs-only review → Kirch merge decision → actual main SHA and file readback → issue crosslink → Siris readback + existing QA #161.
- Required human result: a bounded exact-SHA delivery contract/issue ledger with owners, official input, P0/P1 and release exclusions by Nov 8.
- STOP if Git main moves or documentation conflicts with authority: recompare/reconcile; no silent merge.

## Current state verified 2026-11-06 (not perpetual)
App main: `ec17cbfab2a52b55e4f3f45bd5ec199df3858d66`. 1,280 paths from nontruncated recursive tree (170 Forge, 314 app, 365 resources, 165 tests). PRs [#27](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/pull/27) curated frontend/G2, [#34](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/pull/34) Pint, [#37](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/pull/37) Dashboard/sidebar/Planning Maps **merged**. PR #37 approved candidate head `e29bd395f0f2924f65d14f8dc716fb3270ae52b5`, merged main SHA as above. Original donor PRs [#18](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/pull/18) and [#22](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/pull/22) remain OPEN but must **not be bulk merged** again. Historical CI witness PR #28 and private Hub PR #160 preserved.

PR37 developer reported TypeScript, 103 contracts, 9 UX, build and browser refinement PASS; Nox source reviewed without full independent visual/runtime replay. No hosted workflow/status observed at current merged main. [Hub #161](https://github.com/Project-Intra-Smithy/engineering-hub/issues/161) Siris local 4-role QA **assigned but no completed report** at START. Sir Gerry's private visual reference needs direct authorized transfer; exact client acceptance is pending. No production deployment claimed.

## Live-stale reconciliation — DO NOT DELETE HISTORY
| Older/current surface | Last observed discrepancy | Superseding source / action |
|---|---|---|
| `.forge/SSOT_CURRENT.md`, `.forge/WORK_LEDGER.md`, `.forge/VALIDATION.md` | Historical Talibon-Sales-Prototype SHA/Oct A01 anchors; old “Kirch Tech Lead / Siris QA” role matrix | This appointment is an **overlay** for ONE TALIBON app; keep Oct provenance but read live app Git, Hub #162 and current Forge control first |
| `.forge/memory/COMMON-SYSTEM-MEMORY-INDEX.md` | Oct 12 “ACTIVE” sprint and older feature-first maintainer status | Treat as dated history; this overlay is the 2026-11-06 leadership/readback anchor |
| `.forge/memory/WORK-PACKAGE-REGISTER.md` | Nov 4–5 entries refer to PR27 integration and PR34 Pint still pending | GitHub confirms PR27/PR34 merged; preserve old issue state, add current pointer, do not retroactively overwrite test receipts |
| App [#35](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/issues/35) | Owner “single-writer M0–M4” plan precedes PR37 merge; issue open | PR37 merged; no further redesign; client acceptance and QA #161 remain open |
| Hub [#159](https://github.com/Project-Intra-Smithy/engineering-hub/issues/159) | R13 Nov 5 coordination predates client merge | Preserve as historical lineage, not fresh executable start |
| Hub [#128](https://github.com/Project-Intra-Smithy/engineering-hub/issues/128) | OPS-001–022 P0-A/B/C/D audit from older source | Reproduce/reclassify on exact new main; do **not** assert these fixed or still exploitable without current tests |
| App PR #18/#22 | Donors remain open despite curated integration | Preserve attribution/evidence; no replay without a newly scoped delta |
| Previous master handoff R1 ZIP | Local artifact says “GitHub read-only, not published”; its README repeats a line | Issue #162 is now published. Archive remains immutable evidence; supplement with this live erratum, do not silently change its hash |

## Must-preserve holds
- `DenyUnapprovedMessaging` returns 403 server-side. `config/messaging_release.php` defaults `restricted_uat=true`; `DenyUnverifiedCorrespondenceMutations` is fail-closed. No bypass/disablement to satisfy demonstration.
- G2 `EVER_PLAN` provenance, idempotency, scanner receipt and custody constraints are a foundation; **not** official PDF publication, WORM/backup/restore/ACL/mount acceptance or G3/G4.
- Available Planning Maps is a focused/scrolling link to truthful **no municipality-approved map assets supplied**, not GIS.
- Plans/PPAs are reference-only; HRIS/payroll/property/legislative/meeting/procurement/system areas are not automatically approved for production by the presence of routes or pages.
- `Task != Work Request != Correspondence`; `Document != Transaction`; `Meeting != Task`; executive oversight ≠ universal routing.
- No historical mock/demo records or guessed LGU roles can become official business policy.

## Directory revalidation
`config/office_directory.php` 40 provisional focal display entries; `database/seeders/MunicipalityStructureSeeder.php` 33 backend department seeds; `config/office_identity.php` 0 approved office emails. `OfficeDirectoryCatalog` is display-only, while `Department::activeRoutable()` is operational. Obtain HRMO/Records/office-owner validated roster, office hierarchy, branch, code, active status, approved work-email, visibility and routing policy, with source/effective date. Preserve real personnel roster only in private controlled storage. The independent display catalog is **not** an authorization list.

## Nov 20 fixed evidence calendar (PHT)
- **Nov 6–7:** Siris intake, frozen current source and isolated PostgreSQL 16 legitimate MFA QA; private Gerry reference.
- **Nov 8:** Kirch's written scope IN/OUT, P0/P1, office/process-owner decisions and explicit held modules.
- **Nov 9–11:** Siris real 4-role QA #161 plus historical P0 current-SHA differential, no self-certified passes.
- **Nov 12–15:** only demonstrated P0/P1 fixes on bounded authorized START; tests, directory intake and restore rehearsal.
- **Nov 16:** owner-authorized exact RC SHA freeze.
- **Nov 17–18:** Nox/Jane nonauthor reviews, Kurt CI, four-role browser and Gerry client checks.
- **Nov 19:** operations, backup/rollback, go/no-go.
- **Nov 20:** deliver evidence-qualified agreed subset or explicit held release; no blanket full municipal-system acceptance.

## Siris first return
`DATE | EXACT_HEAD | CURRENT_ISSUE_AND_MEMORY | RELEASE_IN_OUT | P0/P1 | QA_161_REAL_STATUS | MUNICIPAL_INPUT_MISSING | CI/SECURITY_STATUS | NEXT_ONE_ACTION_AND_OWNER`.
Use the existing [Forge paired START/CLOSE protocol / Hub #63](https://github.com/Project-Intra-Smithy/engineering-hub/issues/63). After docs merge publish exact canonical SHA and verified issue↔memory link; until then **START_SYNC_REQUIRED**.
