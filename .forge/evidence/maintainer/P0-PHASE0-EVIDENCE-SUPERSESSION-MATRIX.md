# KIRION FORGE: MAINTAINER — PHASE-0 EVIDENCE SUPERSESSION MATRIX

## Purpose

This record reconciles the original Phase-0 team deliverables in:

`Kirch-Nairu/ONE-TALIBON-TEAM-WORKSPACE`

against later, stronger KIRION Forge evidence in:

`Kirch-Nairu/Talibon-Sales-Prototype`

The objective is not to pretend blank historical templates were completed. The objective is to decide, requirement by requirement, whether later accepted evidence now satisfies the same engineering purpose.

Classification:

- `FULLY SUPERSEDED` — later evidence is materially stronger and covers the original purpose;
- `PARTIALLY SUPERSEDED` — later evidence covers most of the purpose but a meaningful residual obligation remains;
- `STILL OPEN` — later evidence does not satisfy the original requirement.

This is a governance/evidence reconciliation only. No product behavior is changed.

---

# 1. Source authorities

## Original Phase-0 completion contract

The Phase-0 Team Handoff required:

- Kirch — canonical baseline / exact SHA / known-state and known-issues report;
- AJ — core/operational frontend audit + mockups/evidence;
- Jhayr — coordination/responsive frontend audit + mockups/evidence;
- Siris — whole-system exploratory QA register + evidence;
- Kurt — self-hosted CI/CD lab report + successful/failed run evidence;
- Tech Lead review — all five outputs reviewed and accepted/recorded.

## Later governing engineering law

The Technical Audit / delivery lifecycle requires:

`IMPLEMENTED + COMMITTED + SELF-VALIDATED + SUBMITTED + CI/CD PASSED + QA PASSED + TECHNICAL LEAD ACCEPTED + INTEGRATED + RECORDED`

and prohibits PASS inheritance across changed candidate SHAs.

The Phase-0 hardening program also established that prototype/showcase evidence must not be confused with production or UAT acceptance.

---

# 2. Supersession matrix

## A. AJ — Core / Operational Frontend Audit + Mockups / Evidence

Original branch:

`P0-F01-FRONTEND-AJ`

Original deliverable state:

Template/incomplete.

### Later evidence

P04 Frontend Canonicalization materially performed the work the original audit was meant to inform:

- canonical navigation/product-surface truth;
- Work Request semantics corrected so Task != Work Request;
- Documents / Correspondence / Records / Search surfaces audited and preserved;
- Full HRIS de-exposed from immediate product scope;
- Procurement / Project Monitoring authority-pending treatment;
- explicit LGU dependency register;
- frontend extraction manifest;
- no fake municipal data/rules.

P08 and later exact-candidate runs then supplied runtime/browser/responsive proof on the integrated system.

Run #28 attempt 3 validated exact candidate:

`395438674b4d2f00659eba616db760b339bb390a`

with successful:

- TypeScript/build;
- Feature suite;
- route authority;
- browser/runtime acceptance;
- responsive smoke;
- repository hygiene.

### Disposition

`FULLY SUPERSEDED`

Rationale:

The original deliverable was an audit/mockup artifact intended to guide frontend correction. The later program produced implemented corrections plus exact-candidate runtime/browser evidence. Requiring obsolete mockups after the actual accepted implementation exists would add paperwork without increasing engineering certainty.

No AJ Phase-0 template backfill is required for P0-H.

---

## B. Jhayr — Coordination / Responsive Frontend Audit + Mockups / Evidence

Original branch:

`P0-F02-FRONTEND-JHAYR`

Original deliverable state:

Template/incomplete.

### Later evidence

P04 explicitly audited and canonicalized the coordination surface:

- accepted Messaging preserved;
- Meetings de-exposed to authority-pending state;
- Announcements de-exposed to authority-pending state;
- Calendar retained as accepted coordination foundation;
- Employee & Office Directory preserved;
- shared system states/presentation hardened through canonical product surfaces.

P08/P09 exact-candidate validation supplied stronger responsive/runtime evidence than the originally requested static mockups:

- H0 runtime readiness;
- responsive browser smoke;
- real-auth Messaging validation;
- two-user Messaging synchronization;
- runtime/browser acceptance lifecycle.

Run #27 and Run #28 exact candidates both completed SUCCESS.

### Disposition

`FULLY SUPERSEDED`

Rationale:

The intended audit/responsive-review purpose was overtaken by actual canonical implementation plus exact-browser/runtime proof. Static mockups are no longer the strongest evidence of the current system state.

No Jhayr Phase-0 template backfill is required for P0-H.

---

## C. Kurt — Self-Hosted CI/CD Validation Lab + Successful / Failed Run Evidence

Original branch:

`P0-CI01-CI-LAB-KURT`

Original deliverable state:

Template/incomplete.

The original template proposed Proxmox + Jenkins as a Phase-0 candidate implementation, with:

- exact candidate checkout;
- dependency installation;
- frontend checks/build;
- PHP/backend tests;
- integration/runtime validation;
- evidence archive;
- PASS/FAIL result;
- successful and failed run evidence.

### Later evidence

The project now has an operational self-hosted Windows validation runner and a repository-controlled exact-head workflow:

`.github/workflows/p0-windows-self-hosted-validation.yml`

Observed exact-candidate evidence includes:

- Run #26 — SUCCESS on `fe50036366e4faf20f10b7deff007eb6d33ec1e4`;
- Run #27 — SUCCESS on `464e46fa7db7b321f4d0fbeb863acde6f025c548`;
- Run #28 attempts 1/2 — failed/blocked validation attempts against the same W02 candidate without changing source;
- Run #28 attempt 3 — SUCCESS on `395438674b4d2f00659eba616db760b339bb390a`.

The workflow proves:

- exact SHA checkout;
- Git/P07 authority guard;
- source-contract guard;
- Node/PHP toolchains;
- PostgreSQL disposable DB safety;
- locked dependency restore;
- TypeScript/build;
- fresh migrate/seed;
- route evidence;
- full blocking Feature suite;
- browser/runtime acceptance;
- repository hygiene;
- artifact upload.

Exact W02 artifact:

`p08-baseline-acceptance-395438674b4d2f00659eba616db760b339bb390a`

Artifact ID:

`11418268674`

Digest:

`sha256:f386d18a844c314dbeecfe3ab188195dcd0a9158bd06fd69fae4848a4282ac49`

### Disposition

`FULLY SUPERSEDED`

Rationale:

The original objective was a working self-hosted exact-candidate validation environment with successful/failed-run evidence. The later GitHub Actions runner provides that result operationally and repeatedly. Proxmox/Jenkins was an implementation candidate, not a contractual requirement; replacing it with a proven repository-controlled self-hosted runner is a legitimate evolution, not a gap.

No Kurt Phase-0 template backfill is required for P0-H.

---

## D. Siris — Whole-System Exploratory QA & Familiarization Audit + Evidence

Original branch:

`P0-QA01-SYSTEM-AUDIT-SIRIS`

Original deliverable state:

Template/incomplete.

### Later evidence

P08/P09 now provide materially stronger exact-candidate functional/runtime/browser evidence than the original manual-template plan:

- authentication/MFA;
- authority/route boundaries;
- dashboards;
- organization/directory;
- Work Requests;
- correspondence;
- documents/records;
- memoranda;
- calendar;
- Messaging;
- public portal;
- reporting/audit;
- System Administration;
- H0 runtime readiness;
- responsive browser smoke;
- real-auth/two-user Messaging;
- negative validation/authorization cases in the blocking Feature suite.

Run #28 attempt 3 validates exact candidate:

`395438674b4d2f00659eba616db760b339bb390a`

The exact artifact contains H0 runtime, responsive, route-list and runtime-log evidence.

### Engineering correction

A separate manual QA runtime/bootstrap is **not required** and should not be created merely to duplicate the already-proven CI/CD environment.

Doing so adds a second environment, second dependency/bootstrap path and additional failure modes without materially increasing certainty for this Phase-0 baseline.

The independent QA gate remains distinct, but its residual responsibility is now **independent evidence review**, not redundant re-execution.

### Disposition

`PARTIALLY SUPERSEDED — INDEPENDENT EVIDENCE REVIEW REQUIRED`

### Residual requirement

Siris / assigned QA independently reviews the exact Run #28 attempt-3 evidence and verifies:

- exact SHA identity;
- all required gates actually ran and passed;
- H0 report = 22/22 PASS, zero page errors/server 5xx/console diagnostics/navigation failures;
- responsive report passes 1440x900 and 390x844 for Dashboard, Work Requests, Records and Messaging;
- real-auth/two-user Messaging runtime step passed;
- route-list and runtime-log evidence exist;
- no evidence contradicts the claimed Phase-0 engineering state;
- no CI result is being overstated as LGU UAT, production acceptance or final contractual acceptance.

This preserves separation of duties because QA independently accepts or rejects the evidence; it does not require QA to rebuild the system a second time.

P0-H remains blocked until that independent QA evidence-review disposition is recorded.

---

## E. Kirch — Canonical Baseline / Exact SHA / Known-State & Known-Issues Report

Original branch:

`P0-TL01-BASELINE-KIRCH`

Original deliverable state:

Template/incomplete.

### Later evidence

The later KIRION Forge program now has:

- P03 backend canonicalization;
- P04 frontend canonicalization;
- P05 disposition evidence on the coordination lineage;
- P06 cross-layer convergence;
- P07 integrated candidate;
- P08 exact-head shared-core acceptance;
- P09 W01 accepted Messaging naming closure;
- P09 W02 accepted current-facing residue closure;
- explicit deferred/specialized test boundary;
- exact validation artifacts;
- known-state/drift reviews;
- accepted W02 exact candidate `395438674b4d2f00659eba616db760b339bb390a`;
- P09 governance-only head after acceptance evidence.

### Disposition

`PARTIALLY SUPERSEDED / FINAL PUBLICATION STILL REQUIRED`

Rationale:

The evidence needed to write the baseline record now exists and is stronger than the original blank workspace template. However, the original Tech Lead obligation includes **publishing the stabilized canonical baseline**. That publication is P0-H itself and cannot be declared superseded before it is actually issued.

Residual Kirch obligation:

After the independent QA residual closes, publish P0-H with:

- exact canonical product/runtime SHA;
- exact governance head if different;
- blocking vs deferred test boundary;
- known-good shared-core capabilities;
- reference/non-authoritative capabilities;
- deferred/specialized domains;
- known LGU/process dependencies;
- production/security gates;
- non-claims;
- next authorized Series.

---

# 3. Overall Phase-0 evidence disposition

| Original deliverable | Disposition |
|---|---|
| AJ frontend audit + mockups/evidence | FULLY SUPERSEDED |
| Jhayr coordination/responsive audit + mockups/evidence | FULLY SUPERSEDED |
| Kurt self-hosted CI/CD lab + pass/fail evidence | FULLY SUPERSEDED |
| Siris independent exploratory QA + evidence | PARTIALLY SUPERSEDED — independent exact-candidate evidence review required |
| Kirch canonical baseline/known-state publication | PARTIALLY SUPERSEDED — P0-H publication still required |

---

# 4. Maintainer conclusion

The project should NOT force contributors to fabricate retroactive completion of obsolete Phase-0 templates.

The later KIRION Forge hardening and validation program is stronger evidence for AJ, Jhayr and Kurt than the originally planned artifacts.

Independent QA remains materially distinct from CI/CD, but it need not duplicate the validated CI environment. The remaining QA control is independent review of the exact-candidate evidence.

Therefore the honest remaining Phase-0 closure path is:

`SIRIS INDEPENDENT RUN-28 EVIDENCE REVIEW -> TECH LEAD REVIEW -> P0-H KNOWN-STATE PUBLICATION -> MAIN PROMOTION DECISION -> A01 FIRST-CLASS TASK / UNIFIED MY WORK AUTHORIZATION`

No P09-W03 cleanup is authorized.

No product mutation is authorized merely to close the evidence gap.

No UAT, production or contractual acceptance is implied.
