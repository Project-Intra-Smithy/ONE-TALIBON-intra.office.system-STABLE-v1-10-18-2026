# KIRION FORGE — ONE TALIBON V1

## RC1 — MAIN CONSOLIDATION / RECONCILIATION

### INTEGRATION WRITER HANDOFF

ROLE CALL:

**KIRION FORGE: INTEGRATION WRITER**

---

## 1. FORGE AUTHORITY

Forge repository:

`Kirch-Nairu/KIRION-FORGE`

Forge authority:

`main@44eb57e5b45b343be0033bf22a7a5e74d543c01a`

Use the normal Forge Integration Writer bootstrap.

This handoff delegates bounded reconciliation authority only.

It does NOT delegate Technical Authority, Acceptance, main promotion, deployment, branch cleanup, or history rewrite authority.

---

## 2. TARGET PROJECT

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Technical Authority:

**Kirch Ivan Balite**

Program:

`RC1 — MAIN CONSOLIDATION / RECONCILIATION`

Target RC branch:

`KIRCH-TALIBON-RC1-MAIN-CONSOLIDATION`

The commit containing this handoff is the exact RC1 start authority.

The RC1 branch must be created directly from that handoff commit.

Do not start from `main`.

---

## 3. CLOSED AUTHORITIES TO PRESERVE

CAL1 feature-frozen product state:

`9dba054d34377ce76149d8474ddeb66b5c20130e`

BH1 reviewed closeout:

`27824223d5169c8eadf16ab863d09aab9585db9c`

DA1 reviewed repair candidate:

`9fa1ec1a00be72984db651c5b251b36183444d64`

DA1 reviewed integration:

`f48fb9381fee81490f43635ff289cce67ff7779b`

DA1 closeout:

`CLOSED — SUITABLE WITH RECORDED LIMITATIONS`

Closeout evidence:

`.forge/evidence/maintainer/DA1-REPAIR-WAVE-CLOSEOUT.md`

The aggregate DA1 marker `=== DA1 FULL AUDIT PASS ===` was not observed and must not be claimed.

No DA1 product rework is authorized by RC1.

---

## 4. CURRENT PRE-PROMOTION MAIN

Current pre-promotion main authority at handoff issuance:

`main@9cc1b50b28762402c3b24a721cd5ba7ae961817c`

Before any integration mutation:

1. re-fetch remote `main`;
2. require it to still resolve to this SHA;
3. if it moved, STOP and return to Maintainer;
4. do not silently integrate a newer or different main.

---

## 5. RC1 PURPOSE

RC1 has one purpose:

**reconcile intentional current-main public-portal work into the reviewed DA1 product line without regressing CAL1, BH1, or DA1.**

RC1 is not a redesign wave.

RC1 is not a backend feature wave.

RC1 is not permission to reopen navigation, workflow, Calendar, messaging, correspondence, Records, HRIS, or Dashboard behavior unless required to resolve a direct integration conflict.

---

## 6. MAIN-ONLY INVENTORY — REVERIFY, DO NOT ASSUME

DA1 opening reconnaissance previously observed the effective intentional main-only product delta as bounded to these public-portal files:

- `config/public_portal.php`
- `resources/css/public-portal.css`
- `resources/js/components/public/PublicFooter.tsx`
- `resources/js/components/public/PublicHeader.tsx`
- `resources/js/components/public/PublicHero.tsx`
- `resources/js/components/public/PublicQuickAccess.tsx`
- `resources/js/components/public/PublicServices.tsx`
- `resources/js/components/public/types.ts`
- `resources/js/pages/Public/Home.tsx`

This is a historical observation, not current authority.

At RC1 start, independently re-derive the true main-only change set from live Git.

Do not classify changes by branch name or commit message alone.

---

## 7. REQUIRED CLASSIFICATION

For every effective main-only change, classify:

### RETAIN

Intentional main-only work that remains desired and must be reconciled into RC1.

### SUPERSEDED

Main-only work whose purpose is already satisfied by the reviewed DA1 line or later accepted implementation.

Do not reintroduce it.

### REJECT

Main-only work that is stale, contradictory, unsafe, obsolete, or outside the intended final prototype.

Do not integrate it.

Record the classification before mutation.

---

## 8. EXPECTED RETAINED SURFACE

The expected retained surface is the public ONE TALIBON portal / mobile masthead and related public presentation work already present on `main`.

That expectation is subject to live diff verification.

Public work must remain:

- read-only where designed as public;
- separated from internal municipal operational authority;
- free of private workflow, HR, employee, correspondence, audit, or document payload leakage;
- honest about available public actions;
- coherent on desktop and mobile;
- consistent with the current ONE TALIBON municipal identity.

Do not widen public data exposure to resolve a merge conflict.

---

## 9. PRESERVATION CONTRACT

RC1 must preserve the reviewed DA1 product semantics, especially:

- BH1 runtime hardening;
- CAL1 Calendar;
- NAV-01 transaction destination logic;
- NAV-02 executive metric semantics;
- NAV-03 System Administration correspondence suppression;
- NAV-04 handoff redirect/accountability messaging;
- transaction authorization;
- correspondence authorization;
- H1 carrier behavior;
- MP0 messaging behavior;
- current internal shell/navigation;
- current demo persona/auth boundaries.

If a public-main change conflicts with one of these, preserve the closed DA1 behavior and classify the conflicting main-only portion as SUPERSEDED or REJECT unless Maintainer explicitly resolves otherwise.

---

## 10. INTEGRATION METHOD

Use normal ancestry-preserving Git.

Allowed:

- merge;
- targeted conflict resolution;
- explicit file-level reconciliation;
- atomic integration commits.

Prohibited:

- force push;
- rebase of accepted history;
- squash reconstruction of accepted history;
- reset that discards accepted commits;
- replacing the DA1 line with `main`;
- broad cherry-pick of unrelated historical work;
- speculative cleanup;
- dependency upgrades;
- migrations unless separately authorized;
- main promotion.

The intended topology is for the RC1 candidate to preserve both the DA1 ancestry and the current-main retained ancestry so that later main promotion can be non-force.

---

## 11. VALIDATION DURING RC1

Do NOT rerun the full DA1 carrier.

Do NOT rerun the complete H1 mutation suite.

Do NOT rerun the full Feature suite merely as an integration ritual.

RC1 writer validation should remain bounded to integration correctness, such as:

- clean Git state;
- exact branch / ancestry proof;
- TypeScript check if the retained public files require it;
- production frontend build if public frontend files changed;
- focused public-portal tests already present in the repository;
- source verification that internal DA1 files did not drift;
- targeted browser smoke of the public portal only if already supported and proportionate.

Broad exact-candidate release validation belongs to the separate RV1 phase after RC1 candidate freeze.

Do not convert source-only checks into runtime claims.

---

## 12. STOP CONDITIONS

STOP and return to Maintainer if:

- remote `main` no longer equals `9cc1b50b28762402c3b24a721cd5ba7ae961817c`;
- main-only effective changes extend materially beyond the expected public surface;
- reconciliation requires weakening internal authorization;
- reconciliation requires changing migrations or dependencies;
- a conflict cannot be resolved without redesigning a closed DA1 surface;
- current `main` contains a product change whose RETAIN / SUPERSEDED / REJECT classification is ambiguous;
- accepted ancestry would require force, reset, squash reconstruction, or rebase.

---

## 13. REQUIRED RC1 RETURN

Return:

# ONE TALIBON V1 — RC1 INTEGRATION WRITER RETURN

## Authority

Start authority:

RC1 branch:

Current main verified:

Final RC1 candidate SHA:

## Main-only inventory

List each effective main-only file/change and classify:

RETAIN / SUPERSEDED / REJECT

## Reconciliation

Retained work integrated:

Superseded work omitted:

Rejected work omitted:

Conflict resolutions:

## Preservation

CAL1:

BH1:

DA1 NAV-01:

DA1 NAV-02:

DA1 NAV-03:

DA1 NAV-04:

Authorization boundaries:

Internal shell/navigation:

## Validation actually executed

Git/ancestry:

TypeScript:

Build:

Focused tests:

Public browser smoke:

Other:

## Scope integrity

Migrations:

Dependencies:

Unrelated product changes:

## Remaining limitations

Carry forward the DA1 aggregate-marker and exact-SHA runtime limitations accurately until RV1 supersedes them with exact RC1 evidence.

## Promotion disposition

State whether the exact RC1 candidate is suitable to return to Maintainer for a separate RV1 validation handoff.

Do not promote main.

Do not deploy.

Do not delete branches.

## Authority return

End exactly:

`INTEGRATION WRITER AUTHORITY RETURNED TO MAINTAINER.`

`No main promotion performed.`

`No deployment performed.`

`No branch cleanup performed.`
