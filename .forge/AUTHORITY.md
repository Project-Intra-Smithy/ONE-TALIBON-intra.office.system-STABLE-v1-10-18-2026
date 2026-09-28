# ONE TALIBON V1 — CURRENT AUTHORITY

## Technical Authority

**Kirch Ivan Balite**

Kirch Ivan Balite is the sole Technical Authority for this repository.

No contributor title, commit volume, Code Writer role, Reviewer role, Acceptance role, DevOps role, frontend/backend specialization, operator role, branch ownership, or CI execution independently grants product or promotion authority.

## Repository

`Kirch-Nairu/Talibon-Sales-Prototype`

## Forge authority

`Kirch-Nairu/KIRION-FORGE@44eb57e5b45b343be0033bf22a7a5e74d543c01a`

Forge provides operating doctrine. Repository-local exact Git state and explicit Technical Authority instruction remain binding for this product.

## Accepted product authority

Accepted branch:

`main`

Exact accepted/promoted application SHA:

`0e57508cab1a86bf4eabc1637e39b2dae6d32716`

Commit:

`test(rc2): open account tools before guided tour replay`

Frozen RC2 pre-repair authority:

`826d0bf735c848fdc21f8484d70491b056337da6`

Final RC2 repair candidate and current main are identical.

## Current transition authority

Current transition:

`FB0 — FRONTEND / UIUX CLOSEOUT → BACKEND / RUNTIME HARDENING`

Transition coordination branch:

`KIRCH-TALIBON-FB0-FRONTEND-BACKEND-TRANSITION`

FB0 is governance/documentation/maintainer authority only.

FB0 does **not** authorize application implementation, backend repair, branch deletion, schema mutation, deployment promotion, UAT database mutation, or production acceptance.

## Frontend / UIUX disposition

The Technical Authority has completed the current UI/UX-focused local UAT pass and considers the presentation phase sufficient to transition into backend/runtime hardening.

This means:

- frontend presentation is no longer the primary engineering program;
- current UI/UX behavior remains subject to targeted regression fixes when backend semantics require it;
- UI/UX UAT PASS does not imply backend architecture closure, production acceptance, or commercial completion.

Current product direction remains:

> ONE TALIBON is a dense, coherent, credible municipal digital workspace used for real day-to-day coordination, not a marketing dashboard.

Current visual direction remains the established green municipal workspace.

## Backend program direction

The next engineering program is backend-focused.

Primary goals:

1. route/controller/service/policy authority consistency;
2. truthful role/scope semantics across Dashboard, Work Queue, Records, Correspondence, Documents and department/executive surfaces;
3. faster initial load and server response;
4. lower query cost and bounded pagination/materialization;
5. stable PostgreSQL behavior and test/runtime reproducibility;
6. render/runtime stability;
7. measurable performance hardening rather than speculative optimization;
8. Windows-native self-hosted validation without touching UAT state;
9. governance/current-state reconciliation before new implementation waves.

## Current known audit findings

Known confirmed or evidence-backed findings entering the backend program:

- Dashboard attention composition can mix personal attention into office/executive-labeled cards, creating cross-surface semantic mismatch.
- `DocumentArchiveQuery` materializes the full document corpus before authorization/filtering/pagination and requires backend performance redesign.
- System Administration Work Queue metadata still describes `scope="municipal"` while the repaired Work Queue query is personal-scoped.
- System Administration still has historical municipality-wide transaction capabilities in the generic transaction authorization layer; policy intent requires Technical Authority decision before redesign.
- Executive Work Queue currently uses executive-only composition; additive personal accountability is a product decision, not an automatic defect.
- Prototype Messaging channel names do not currently enforce per-channel participant membership.
- Current CI workflows are Linux/GitHub-hosted oriented and are not directly portable to the new Windows self-hosted runner.

These findings do not authorize repair by themselves.

## Self-hosted runner

Registered repository runner:

`DEVKRTZ`

Labels:

`self-hosted, Windows, X64`

Installation observed during setup:

`C:\WINDOWS\system32\actions-runner`

The runner was registered interactively and was not installed as a Windows service.

Registration is not equivalent to runner readiness.

Before this runner can become validation authority, an exact-machine preflight must prove the runner process can access the required toolchain and the disposable test database.

The previously exposed registration token must never be reused.

## Database authority

Local UAT database:

`talibon_portal`

Engineering/test database:

`talibon_portal_test`

Absolute rule:

`talibon_portal` is never a destructive test target.

Destructive verification commands such as `migrate:fresh`, reset, wipe, truncate, reseed, or database recreation are authorized only against an explicitly verified disposable test database.

## Anti-drift gate

Before every phase transition:

1. re-read live Git authority;
2. state exact SHA;
3. state current Forge role;
4. state allowed mutations;
5. state forbidden mutations;
6. state inherited evidence and why it remains applicable;
7. stop if repository truth contradicts the handoff.

Do not infer missing authority from chat memory.

Do not use historical branch names as current authority unless live Git and current governance agree.

## Authority precedence

1. observed live Git/runtime truth;
2. explicit Technical Authority instruction from Kirch Ivan Balite;
3. current repository-local governance at the exact working SHA;
4. durable Reviewer / Acceptance / Maintainer evidence;
5. historical documentation;
6. conversation memory.

## Mutation policy

- no reset/rebase/force-push of accepted history for convenience;
- no silent scope expansion;
- no implementation from conversation prose alone;
- no writer self-acceptance or self-promotion;
- no destructive UAT database mutation;
- no branch cleanup until ancestry/evidence classification is complete;
- no self-hosted workflow trusted as a release gate until exact-machine evidence exists;
- no unrelated cleanup inside bounded repair waves.

## Claim boundaries

UI/UX UAT, backend validation, deployment, production acceptance, and commercial completion remain separate claims.

Only observed evidence may support each claim.
