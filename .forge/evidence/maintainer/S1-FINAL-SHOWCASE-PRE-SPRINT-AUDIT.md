# KIRION FORGE — S1 FINAL SHOWCASE PRE-SPRINT AUDIT

Date: 2026-09-30

Role: Maintainer / traffic control

Purpose: establish live Git truth before handing the final bounded sprint to a fresh sprint Maintainer.

## Live refs re-verified

- `main` -> `9b5193e3502afded5f967f412b2a1d452e433bc0`
- `KIRCH-TALIBON-S1-SHOWCASE-INTEGRATED-CANDIDATE` -> `7d7923ba83948aa1d0a8054854d9c12f74c5ab30`
- `KIRCH-TALIBON-S1-SHOWCASE-WELCOME-CREDITS` -> `798ba88d545d3d016689686904063f97c2616929`
- `KIRCH-TALIBON-S1-SHOWCASE-RUNTIME-HARDENING` -> `543419125187369e13b8fcfd2d0393ffe14a4497`
- `AJ-TALIBON-PUBLIC-HOMEPAGE-GREEN-REFINEMENT` -> `f89996823cb7e6bb5f188897586682a0dd141b52`
- `EliminateDarkMode` -> `4539302043b035e51fa068da2adb3963f191314f`

Accepted backend/runtime payload recorded by repository authority:

- `314b6661b34d4a70272d2a079f7cdda238b522ae`

## Verified S1 chain

Compare `7d7923ba... -> 798ba88d...`:

- status: ahead
- ahead by: 1
- behind by: 0
- merge base: exactly `7d7923ba...`
- files:
  - `resources/js/components/onboarding/WelcomeWizard.tsx`
  - `resources/js/components/onboarding/tourCatalog.ts`

Therefore Welcome/Credits is a clean one-commit extension of the accepted integrated S1 candidate.

Compare `798ba88d... -> 543419125...`:

- status: ahead
- ahead by: 2
- behind by: 0
- merge base: exactly `798ba88d...`
- payload:
  - seven new `scripts/showcase-*` runtime files
  - one repository execution-plan document

Therefore the current runtime branch is a clean direct extension of Welcome/Credits.

## Backend baseline inheritance

Compare accepted backend baseline `314b6661...` to the runtime spine `543419125...`:

- runtime spine reports ahead of the accepted backend baseline;
- backend baseline is therefore inherited in the S1 work line and must not be blindly re-imported from current `main`.

Repository `.forge/AUTHORITY.md` on current `main` identifies `314b6661...` as the accepted B1 Records query consolidation and current prototype backend baseline.

## Current `main`

Live `main` is `9b5193e...` and has advanced independently from the S1 showcase work line.

The final sprint must NOT merge current `main` wholesale.

Reason:

- the S1 line already contains the accepted backend baseline;
- current `main` also contains independently landed public-homepage and repository-governance changes;
- the final sprint has newer S1 presentation/FUT/onboarding/runtime work not represented by a simple fast-forward from current main;
- wholesale merge creates unnecessary conflict and regression risk under showcase time pressure.

Required action for new Maintainer:

- independently re-resolve `main`;
- enumerate main-only commits after the accepted baseline;
- classify each as already represented / selectively required / unrelated / conflicting;
- transplant only proven required payload.

## Donor branches

### AJ public homepage

`AJ-TALIBON-PUBLIC-HOMEPAGE-GREEN-REFINEMENT@f899968...`

Use as a selective visual/content donor. Do not merge wholesale.

Known risk: public content previously included broad people/HR language that can overstate current personnel-reference-only scope.

### EliminateDarkMode

`EliminateDarkMode@4539302...`

Use only as intent/reference.

The branch contains broad theme/component churn across authenticated and public surfaces. Do not merge/cherry-pick wholesale. Reproduce only the minimal light-only behavior required by the showcase.

## Runtime writer result audit

The existing runtime hardening payload at `3c12eadb...` changed exactly seven runtime files and no application/domain code.

Positive:

- 4-worker default;
- worker loopback ports 18101-18104;
- Node proxy on 18000;
- per-worker `/up` health;
- state/PID file;
- safe process-identity checks;
- prepare/start/stop/status/load split;
- build/migrations separated from restart.

Open acceptance concerns carried into Writer A:

1. explicit public-origin/APP_URL behavior when config is cached;
2. forwarded protocol under Cloudflare HTTPS;
3. preserving runtime state when a live recorded process cannot safely be terminated;
4. authenticated 30-session load evidence rather than anonymous redirect evidence.

## Product source audit

Current Work Request Create form is materially smaller than the new product requirement. It currently includes:

- transaction/request type from a five-option list;
- priority;
- subject;
- description;
- receiving office;
- due date;
- routing remarks;
- protected supporting evidence.

The existing backend already validates/stores protected transaction evidence through `TransactionEvidenceService` and `DocumentAttachmentService`, so that stack must be extended, not replaced.

Current Memorandum Create flow has no attachment field. Existing `DocumentAttachmentService` supports protected PDF/DOCX/JPEG/PNG/WebP evidence with MIME/content validation, checksum and private storage; Memoranda should reuse this architecture.

Current Showcase config has seven curated personas. `WorkforceDemoSeeder` creates those explicit accounts then fills the remaining workforce to the configured synthetic target. This supports expanding curated office personas while preserving the approximate 350-person total.

## New sprint branches created

Control/governance branch:

`KIRCH-TALIBON-S1-FINAL-SHOWCASE-FORGE-SPRINT`

Clean integration target branch:

`KIRCH-TALIBON-S1-FINAL-SHOWCASE-INTEGRATED`

Both were created from the trusted pre-sprint S1 runtime/documentation head `543419125...` before sprint handoff documentation was added.

The integration branch must be fast-forwarded to the final control-documentation head before Writer lanes are cut so all writers inherit the same repo-backed sprint authority.

## Disposition

- accepted backend baseline: inherited
- S1 integrated presentation: inherited
- Welcome/Credits: inherited
- showcase runtime implementation: inherited but requires real-machine acceptance/repairs
- Work Request redesign: not implemented
- Memorandum attachment: not implemented
- full curated office login roster: not implemented
- AJ homepage selective transplant: not yet integrated into this S1 line
- light-only final policy: not yet integrated into this S1 line
- final authenticated 30-session rehearsal: not yet performed

This evidence is preliminary. The incoming sprint Maintainer must independently reverify live refs and record Gate G0 before authorizing writer mutation.