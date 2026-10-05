# KIRION FORGE — P05 PRODUCT SURFACE DISPOSITION

## Authority

Technical Authority: **Kirch Ivan Balite**

Series: `P SERIES — CANONICAL BASELINE HARDENING`

Slice: `P05 — PRODUCT SURFACE DISPOSITION`

Coordination branch:

`KIRCH-TALIBON-P0-CANONICAL-BASELINE-STABILIZATION`

Immutable common writer base:

`a10dca34db0509d7139ebeb4080e85dde2c0e544`

Reviewed writer returns:

- P03 backend candidate: `594950469aa82a0d85dbf86c443d32adcd7dbe09`
- P04 frontend candidate: `fb300c4a9ffc2d5d3b66ee9260e5d33a966c810a`

Primary product authority:

`ONE TALIBON — Intra Office System Technical Audit / Cross-Reference / Implementation Plan`

This slice is a Maintainer/Technical Authority disposition. It does **not** merge, promote, deploy, or claim CI/runtime acceptance.

---

## 1. P05 objective

P05 determines what the canonical product is allowed to present as active, what must remain foundation-only, what must be de-exposed or truth-labelled, what is blocked on LGU/process-owner authority, and what is outside immediate scope.

The governing rule is:

> A route, page, model, test, menu item, or historical implementation does not by itself make a capability an authoritative current product domain.

P05 exists to make backend route authority, frontend product truth, and the approved technical baseline converge before cross-layer reconciliation and integration.

---

## 2. Review findings from P03 and P04

### P03 backend return

The backend candidate is `4` commits ahead and `0` behind the immutable base.

Material bounded changes include:

- de-exposure of Full HRIS runtime routes;
- preservation of Employee & Office Directory runtime routes;
- development/test-only seeding guard;
- removal of active Employee Directory dependency on hard-coded demo accounts;
- canonicalization of correspondence lifecycle helper naming;
- `procurement.showcase` route-name canonicalization to `procurement.reference` while preserving the existing page contract;
- tests updated to verify Full HRIS is absent from active routing.

The backend candidate preserves accepted Messaging behavior and does not rewrite the accepted Messaging implementation.

### P04 frontend return

The frontend candidate is `31` commits ahead and `0` behind the immutable base.

Material bounded changes include:

- active shell/navigation now renders only `wired` destinations as normal product navigation;
- `/transactions` is presented as **Work Requests**, not as a first-class Task system;
- Full HRIS is removed from canonical product navigation while Employee & Office Directory remains active;
- Meetings, Announcements, Procurement, Project Monitoring, plans and similar incomplete/specialized surfaces are de-exposed or marked `integration_pending`;
- static municipal-looking Meetings/Announcements/Project Monitoring content is no longer presented as live municipal authority;
- shared dashboard/directory surfaces no longer rely on fake municipal-looking fallback data;
- accepted Messaging behavior is preserved;
- explicit LGU/client authority dependencies are mapped.

---

## 3. Canonical product surface disposition

| Capability / surface | P05 disposition | Canonical treatment now | Required next authority/control |
|---|---|---|---|
| Public portal | KEEP — ACTIVE | Product entry surface; no live private operational data | P06 removes remaining transitional/showcase contract residue where safe |
| Login / authentication / MFA | KEEP — ACTIVE | Security foundation | P06 reconciles remaining showcase-session coupling; P08 exact-candidate security tests |
| Dashboard | KEEP — ACTIVE FOUNDATION | Role-safe projection only; no invented KPI truth | `KPI-001` for official management indicators |
| Search Portal | KEEP — ACTIVE FOUNDATION | Authorization-safe shared search foundation | `SEARCH-001` expansion only across accepted domains |
| Document Center / attachments | KEEP — ACTIVE FOUNDATION | Shared official-evidence capability | `REC-001` deeper lifecycle/retention/storage controls |
| Municipal Records | KEEP — ACTIVE FOUNDATION | Authorization-aware records/search foundation | `REC-001` lifecycle maturation |
| Correspondence | KEEP — ACTIVE / CENTRAL | Shared official correspondence foundation | `WF-001/WF-002` for process-specific configuration |
| Memoranda | KEEP — ACTIVE FOUNDATION | Shared issuance/acknowledgement foundation | authority/audience validation where required |
| Work Requests / Transactions | KEEP — ACTIVE / CENTRAL | Formal inter-office responsibility/custody | Do not rename as Task; validate municipal routes/process rules via `WF-001/WF-002` |
| First-Class Task | MISSING — ENGINEERING GAP | Must not be implied by Work Requests | `TASK-001` later engineering slice |
| Unified My Work | MISSING — ENGINEERING GAP | Must not be falsely represented as complete | `WORK-001` after Task foundation |
| Employee & Office Directory | KEEP — ACTIVE / CENTRAL | Identity, office assignment and routing support | `ORG-001` authoritative roster/leadership validation |
| Departments / Offices | KEEP — ACTIVE FOUNDATION | General office discovery/work context | `ORG-001`; no invented heads/acting officers |
| Calendar | KEEP — ACTIVE FOUNDATION | Persisted shared calendar foundation | authority/workspace maturation; no fabricated meeting authority |
| Messaging | KEEP — ACCEPTED FEATURE | Preserve accepted behavior | P06 atomic naming cleanup only; runtime regression at P08 |
| Notifications | KEEP — ACTIVE FOUNDATION | Shared event/notification mechanism | policy/reminder matrix maturation |
| Reports | KEEP — FOUNDATION | Generic role-safe projections | `KPI-001` before official management indicator claims |
| Audit | KEEP — ACTIVE FOUNDATION | Cross-domain accountability foundation | expand with promoted domains |
| System Administration | KEEP — ACTIVE | Administrative product capability under permissions | final role matrix `ROLE-001` |
| Mayor / executive oversight | KEEP — FOUNDATION, BOUNDED | Role-specific oversight only | `KPI-001`, `VICE-001`; never universal routing |
| Meetings | DE-EXPOSE / AUTHORITY PENDING | No static meeting data presented as live lifecycle | `MEET-001` |
| Announcements | DE-EXPOSE / AUTHORITY PENDING | No fake publishing lifecycle | `ANN-001` |
| Procurement / PR Tracking | DE-EXPOSE / SPECIALIZED INPUT REQUIRED | Reference/integration-pending only | `PROC-001`, `WF-001`, `WF-002` |
| Project Monitoring | DE-EXPOSE / SPECIALIZED INPUT REQUIRED | Reference/integration-pending only; no fake KPI/progress truth | `PROJ-001`, `KPI-001` |
| Full HRIS | EXCLUDED IMMEDIATE SCOPE | Active runtime routes removed; historical source may remain provenance | Separate approval required for future HRIS work |
| Legislative workspace / records | PRESERVE SOURCE / NOT PROMOTED | Existing source retained; not normal active navigation | `LEG-001` process/authority validation before promotion |
| Property / asset lifecycle | PRESERVE SOURCE / NOT PROMOTED | Existing source retained; not canonical active navigation | `PROP-001` process/authority validation before promotion |
| Travel Orders | PRESERVE SOURCE / NOT PROMOTED | Existing specialized workflow remains non-canonical product surface | validate owning office/process/routing/authority before promotion |
| Local Special Bodies | INTEGRATION PENDING | Do not present as completed authoritative domain | validated council/body authority and workflow data |
| Development Plans / PPAs | INTEGRATION PENDING | Planning/reference surface only until data authority exists | authoritative planning data/process contract |
| Future Integrations / Municipal Systems | INTEGRATION PENDING | Explicit future-integration surface only | separate authorized integration work packages |

---

## 4. Frozen architecture boundaries

P05 reaffirms these as mandatory:

```text
Task != Work Request
Work Request != Correspondence
Document != Transaction
Meeting != Task
Executive oversight != universal routing
```

Consequences:

- `/transactions` remains **Work Requests** until a real Task domain exists.
- correspondence may link to work but is not itself the work object.
- attachments/documents support operational work but do not become the workflow object.
- meeting action items may later create Tasks; Meetings are not Tasks.
- Mayor/Vice Mayor/executive involvement must be based on validated authority, not a universal routing assumption.

---

## 5. P03 / P04 integration compatibility

### File ownership

No application-source file collision is present between the writer returns:

- P03 changed backend/routes/database/backend-feature-test surfaces.
- P04 changed frontend/browser-facing source plus its Forge evidence.

This means P03/P04 are structurally suitable for later Maintainer integration.

### Cross-layer contract debt that MUST be resolved before P07 freeze

The returns deliberately expose several contracts that neither writer was authorized to resolve unilaterally:

1. **Showcase/session/auth transition contract**
   - active naming/logic still exists across backend auth/session/MFA/provider props and frontend workspace/session UI;
   - determine what is genuinely needed for normal product operation;
   - remove obsolete showcase/demo behavior atomically;
   - preserve MFA/security behavior.

2. **Messaging transitional naming**
   - accepted behavior is frozen, but names such as `PrototypeMessaging`, `PrototypeMessage`, route names under `messages.prototype.*`, and `/messages/prototype/messages` remain transitional residue;
   - if renamed, backend route/controller/model/test and frontend fetch consumers must move atomically;
   - behavior must remain identical.

3. **Procurement transitional contract**
   - backend route is now `procurement.reference`, but the Inertia payload still uses `['showcase' => 'procurement']`;
   - frontend treats Procurement as non-authoritative/integration-pending;
   - remove or canonicalize the `showcase` prop atomically without promoting Procurement.

4. **Employee Directory compatibility residue**
   - backend still emits a `featuredLogins` summary key for compatibility, now mapped to portal-account count rather than demo-persona accounts;
   - active frontend does not need demo-persona semantics;
   - remove the legacy compatibility key only when both sides agree on the final DTO/prop shape.

5. **CurrentPortalNavigation test contract**
   - P03 updated backend Feature expectations;
   - P04 changed navigation readiness/labels;
   - final integrated test expectations must be regenerated from the canonical product surface, not from either writer branch in isolation.

6. **First-Class Task / Unified My Work contract**
   - P04 correctly stopped calling Work Requests `Tasks`;
   - P06 must preserve this boundary and must NOT fabricate Task API/UI to close a naming gap.

7. **Dormant/excluded source policy**
   - Full HRIS runtime is de-exposed but historical source remains;
   - Property/Legislative/Travel Order specialized code remains non-canonical;
   - P06 decides only cross-layer exposure/contract residue, not destructive historical-code deletion unless dependency evidence proves safe.

---

## 6. Client/LGU authority wall

The canonical baseline may continue engineering on client-independent shared mechanics, but the following remain blocked from authoritative specialization until supplied/validated:

- `ORG-001` authoritative office/employee/leadership roster;
- `WF-001` departmental workflows, forms, routing, approvals/signatures, SLA, reports, confidentiality, exceptions;
- `WF-002` process-owner validation/correction;
- `KPI-001` official role-specific management indicators;
- `VICE-001` Vice Mayor requirements;
- `MEET-001` meeting lifecycle/ownership/minutes/action-item authority;
- `ANN-001` publishing/audience/lifecycle authority;
- `PROC-001` procurement lifecycle/process truth;
- `PROJ-001` project lifecycle/data/KPI truth;
- `ROLE-001` final municipal role/permission matrix;
- specialized Property/Legislative/Travel Order authority where those domains are later promoted.

No P06 repair may invent these rules.

---

## 7. P05 disposition

`P05 — PRODUCT SURFACE DISPOSITION: COMPLETE`

P03 and P04 are **accepted as inputs to reconciliation**, not yet accepted as integrated production candidates.

The next authorized slice is:

`P06 — CROSS-LAYER CONTRACT RECONCILIATION`

P06 is limited to resolving the explicit contract debt listed above and preparing the system for one P07 integrated exact candidate.

No broad CI/CD is authorized yet. P08 remains the principal exact-candidate validation event.

No merge, promotion, deployment, repository split, Dockerization, or `main` mutation is authorized by this record.
