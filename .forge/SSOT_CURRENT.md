# ONE TALIBON V1 — CURRENT SSOT

## Technical Authority

**Kirch Ivan Balite**

All other contributors are Developers / Contributors unless explicitly delegated a bounded operating role.

## Repository

`Kirch-Nairu/Talibon-Sales-Prototype`

## Current product authority

Hardened closeout:

`KIRCH-TALIBON-BH1-BACKEND-RUNTIME-HARDENING@27824223d5169c8eadf16ab863d09aab9585db9c`

DA1 reviewed repair integration:

`KIRCH-TALIBON-DA1-PROTOTYPE-DAY-BLOCKER-AUDIT@f48fb9381fee81490f43635ff289cce67ff7779b`

DA1 closeout evidence:

`.forge/evidence/maintainer/DA1-REPAIR-WAVE-CLOSEOUT.md`

Active program:

`MP2 — POST-PROMOTION ARCHIVAL / REMOTE BRANCH CLEANUP PREPARATION`

Current governance / cleanup planning branch:

`KIRCH-TALIBON-RV1-RELEASE-VALIDATION`

Current promoted main:

`f6208cf082c4b1d189c70728adfdb9ddf3225990`

## State

- MP0 messaging/runtime cleanup: historical completed ancestry;
- CAL1 Calendar workspace: completed and feature-frozen;
- BH1 backend/runtime hardening: reviewed and closed;
- DA1 repair wave: closed with recorded validation limitations;
- aggregate `=== DA1 FULL AUDIT PASS ===` marker: not observed and must not be claimed;
- next transition: MP2 archival preservation, then separately authorized remote branch deletion;
- main promotion: complete at `f6208cf082c4b1d189c70728adfdb9ddf3225990`;
- branch cleanup: planned under MP2 but not yet performed;
- branch deletion: not yet authorized;
- deployment from final consolidated main: not yet authorized.

## Program objective

Before prototype day:

1. preserve the closed CAL1 / BH1 / DA1 product state;
2. reconcile intentional main-only public-portal work through RC1;
3. validate the exact RC1 candidate through RV1;
4. promote only the validated candidate to `main` without force/history rewrite;
5. archive required historical tips;
6. delete non-main remote branches only after promotion and archival proof;
7. rehearse the exact prototype flow from final `main`.

## Product direction

ONE TALIBON is a dense, credible municipal digital workspace, not a marketing dashboard.

Primary presentation surfaces must be functional and honest.

Do not introduce unrelated feature work during DA1.

Do not reopen CAL1/BH1 without new evidence.

## Prototype-day critical proof

Required evidence includes:

- clean dependency install;
- deterministic PostgreSQL migration/seed;
- all seven showcase personas;
- TypeScript;
- production frontend build;
- route/view/config cacheability where applicable;
- full Feature suite;
- Dashboard/My Work/Correspondence/Records;
- Calendar Month/Week/Day/Schedule;
- Messages and two-user send/polling;
- Engineering -> Budget -> Mayor transaction lifecycle;
- memorandum publish/acknowledge;
- legislative read/search;
- HR leave flow;
- authorization-denial proof;
- browser pageerror/server-5xx monitoring;
- desktop/mobile presentation checks.

## Authority precedence

1. observed Git/runtime state;
2. explicit Technical Authority instruction from Kirch Ivan Balite;
3. current repository-local governance;
4. durable review/acceptance evidence;
5. historical documents;
6. chat memory.

## Historical records

Older UI/UX correction records, handoffs, and accepted baseline SHAs remain valid historical provenance.

They do not define current branch authority merely because their documents still name historical branches.

## Consolidation plan

See:

`docs/PROTOTYPE_DAY_MAIN_CONSOLIDATION_PLAN.md`

Target branch topology after closeout:

```text
main
```
