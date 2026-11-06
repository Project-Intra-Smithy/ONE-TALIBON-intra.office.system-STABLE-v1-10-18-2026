# ONE TALIBON — Decision, drift, parked-work and knowledge lineage for Siris

**Owning issue:** [Engineering Hub #162](https://github.com/Project-Intra-Smithy/engineering-hub/issues/162). **Intake source:** application `main@ec17cbfab2a52b55e4f3f45bd5ec199df3858d66` on Nov 6, 2026. This is a **dated historical synthesis**, not a new authorization or assertion that every old branch/test is current.

## Timeline of material engineering work

| Period | Provenance / decision | What must persist |
|---|---|---|
| Aug–Sep 2026 | Original wide Laravel municipal prototype: departments, employees, HRIS/payroll/property/legislative, Work Requests, shared records and prototype demonstrations | Existence of schema/pages/seed is NOT approval of municipal workflows; distinguish synthetic demo from official records |
| Sep–Oct 7 | Common Municipal Engine phase lock; Forge evidence law; unified projections across Tasks, Work Requests, correspondence without destructive domain fusion | `Task != Work Request != Correspondence`, `Document != Transaction`, `Meeting != Task`, oversight ≠ universal routing; common first, specialize after policy |
| Oct 7–12 | A01 personal Task core+HTTP bounded acceptance and exact-SHA CI in historical Talibon-Sales-Prototype; paired [START/CLOSE protocol Hub #63](https://github.com/Project-Intra-Smithy/engineering-hub/issues/63) | Historical acceptance is scoped to exact ancestor/changed file tree; do not silently grant current whole-app QA or production |
| Oct 20–22 | LGU forms/Drive audit and [OPS-001..022 Hub #128](https://github.com/Project-Intra-Smithy/engineering-hub/issues/128); current policy-source Track-W [Hub #83](https://github.com/Project-Intra-Smithy/engineering-hub/issues/83) | Cross-domain classified metadata, normal non-mayoral closure, correspondence release/archive and manual inbound/outbound require current-SHA security/role test and real LGU authority |
| Oct 24–28 | R13 nine-branch UI/source reconciliation, responsive documents, Plans/PPA read-only presentation, Calendar, directory, common Work Queries | Strong bounded workers but weak central maintainer continuity; one issue per deliverable, in-repo memory per START/CLOSE, no branch bulk merge |
| Oct 27–Nov 4 | G1B PG16 privilege lattice; G2 PlanEdition–Document private-origin/custody foundation, replay/scanner checks; independent Nox validations; [Hub #157](https://github.com/Project-Intra-Smithy/engineering-hub/issues/157) | G2 foundation != G3/G4 infra/official PDF publication; keep provenance, deny-default and no generic-link leaks |
| Nov 5 | Curated AJ frontend + G2 merged [app PR #27](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/pull/27); scoped Pint cleanup merged [PR #34](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/pull/34) | Donor PR18/22 still OPEN as provenance; integrated source is PR27; older Pint 41/42 failure must be rechecked on current main rather than repeated as unwaived current fail |
| Nov 5–6 | Gerry client screenshot/menu baseline, 224 historical screenshots in private Hub PR160; [app #35](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/issues/35) one-writer correction; [PR37](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/pull/37) merged | 350px desktop upper Dashboard, municipal sidebar terms, exact Available Planning Maps anchored empty state. STOP general redesign; Gerry reference and acceptance still separate |
| Nov 6 | [Siris QA #161](https://github.com/Project-Intra-Smithy/engineering-hub/issues/161) assigned on merged main; Kirch appoints Siris Acting Technical Lead; [handoff #162](https://github.com/Project-Intra-Smithy/engineering-hub/issues/162) | Exact local 4-role QA and screenshot return, scope freeze and directory/policy owners before Nov20. Leadership needs issue+repo-memory pair; source code and permissions are unchanged by this appointment |

## Paused / intentionally excluded — do not turn on for a deadline

- **Messaging:** server `DenyUnapprovedMessaging` 403; no municipal audience/channel authorization. No “chat room” invented to match a mock.
- **Correspondence mutations:** restricted synthetic UAT release control defaults to deny until G1/G2 classification/privacy parity and official intake/dispatch process authority. No developer-only bypass.
- **G2 protected PDF:** custody-only foundation; official Plan editions, real PDF preview/downloading, WORM/scanner/mount/ACL, G3/G4 and LGU disposition are separate.
- **Plans/PPAs/maps:** front reference-only cards; Available Planning Maps says no official assets supplied, not GIS; no phantom plan/document.
- **HRIS/payroll/health/biometric/property/legislation:** source broad, privacy and office lifecycle approval not established for Nov20 just by page presence.
- **Procurement, project monitoring, announcements, meetings, integrations:** some navigation `integration_pending` and code stubs; no dead fake links or premature activation.
- **Normal Work Request completion and final correspondence disposition:** OPS-009/010/017 policy+test blockers historically; must be reclassified on exact current main before release claims.
- **Direct staging/VPS/production:** no verified live rollback, backup/restore, TLS, DNS, monitoring, secret custody and municipal UAT; separate Track-R and owner approval needed.

## Four drift traps worth correcting

**Stale current-source references:** legacy `.forge/SSOT_CURRENT.md`, `WORK_LEDGER.md`, `VALIDATION.md` and `COMMON-SYSTEM-MEMORY-INDEX.md` retain Oct snapshots. This file and the Nov6 [Siris memory overlay](../../.forge/memory/SIRIS_ACTING_TECH_LEAD_TAKEOVER_2026-11-06.md) supersede *current state only*, never rewrite prior provenance.

**Worker concurrency without integration owner:** the prior multi-branch frontend and 41-file formatting debt created repeated reconciliation work. Use one active source integration lane, direct narrow writer scopes and independent nonauthor reviews.

**Evidence conflation:** PR/contract PASS, hosted CI, human four-role QA, Gerry visual acceptance, municipal process approval and production readiness are six different attestations. Require SHA, test version, real execution receipts, negative cases, owner and next gate. No phantom automated green.

**Municipal inference:** a 40-card focal catalog, 33 backend seeded units or old blank forms never establishes 40 workflow actors or signatory rules. Source-certified office and employee directory belongs to HRMO/office custodians; routing to records/process owners.

## Maintainer behavior Siris should adopt
An existing issue is the rendezvous and immutable source/evidence links live inside its discussion. A short current in-repo `.forge/memory` entry provides a resumption cache: `work ID | latest source SHA | last START/CLOSE pair | exact changed paths | what ran | hold | next owner/one action`. Read that first, then the relevant code and focused tests. Audit again broadly only when source or authority actually drifts. Do not let an “active” folder name resurrect historical lanes. Do not silently rebase/close/supersede a worker's original authored history.

**Remaining immediate Kirch input:** Gerry actual reference; declared Nov20 evaluation vs production scope; named HRMO/Records/office signatories and official roster/correspondence samples; hosting and recovery authority; staff/training/demo acceptance participants. **Remaining immediate Siris duty:** secure current SHA, independently run QA #161, reclassify historical #128, freeze only a doable signed Core Portal subset, and publish a precise status daily.

**Next gate:** [Hub #162](https://github.com/Project-Intra-Smithy/engineering-hub/issues/162) owner decision and reviewed docs PR; then Siris acknowledgment. This document never releases a worker or authorizes deployment.
