# KIRION FORGE — CODE WRITER — P06-W02B MESSAGING FRONTEND / CONTRACT CLEANUP

## Authority

Series: `P SERIES — CANONICAL BASELINE HARDENING`

Slice: `P06 — CROSS-LAYER CONTRACT RECONCILIATION`

Work package: `P06-W02B — MESSAGING FRONTEND / CONTRACT CLEANUP`

Technical Authority: **Kirch Ivan Balite**

Repository: `Kirch-Nairu/Talibon-Sales-Prototype`

Authorized branch ONLY:

`KIRCH-TALIBON-P06-W02B-MESSAGING-FRONTEND-CONTRACT-CLEANUP`

Exact starting SHA:

`cfde6141f3a98f30b322eac42f577a7345806d69`

This exact source already contains the accepted P06-W02A backend canonicalization.

P06-W02A froze the backend Messaging contract as:

- GET `/messages/feed` -> route `messages.feed.index`
- POST `/messages/feed` -> route `messages.feed.store`
- controllers under `App\Http\Controllers\Messaging`
- application model `App\Models\Message`
- legacy physical table `prototype_messages` intentionally retained

Do not change that backend contract unless exact inspection proves a compile/runtime defect. If such a defect exists, STOP and return it to Maintainer rather than redesigning the contract.

Use the **KIRION-KIMIFORGE GitHub connector** for repository reads/writes in this assignment.

Do not merge `main`. Do not promote or deploy.

---

## Mission

Adopt the already-frozen canonical Messaging backend contract in the frontend, remove remaining active frontend `Prototype*` Messaging terminology, preserve accepted Messaging behavior exactly, and complete the two small residual product-contract cleanups authorized by the parent P06-W02 lane.

This is a frontend/contract cleanup micro-slice, not a Messaging redesign.

---

## Immediate execution rule

Do NOT repeat the entire P06-W02 repository audit.

Re-verify branch + exact SHA once, inspect only directly affected frontend/contract files, then mutate and commit.

A durable implementation commit is the priority.

---

## Required outcomes

### A. Frontend Messaging transport adoption

Replace frontend transport use of:

`/messages/prototype/messages`

with:

`/messages/feed`

Preserve:

- polling cadence;
- cursor synchronization;
- visibility pause/resume behavior;
- AbortController behavior;
- XSRF header behavior;
- send failure categorization;
- composer retry/error behavior;
- message merge/order behavior;
- channel switching;
- rendered message payload semantics.

### B. Canonical frontend Messaging terminology

Remove active application-layer names such as, where present:

- `usePrototypeMessaging`
- `prototypeMessaging.ts`
- `PrototypeMessage`
- `PrototypeMessageBubble`
- `PrototypeMessageComposer`
- `prototypeMessagesEndpoint`
- `mergePrototypeMessages`
- `prototypeChannels.ts`

Replace with straightforward canonical Messaging names without redesigning the UI.

Do not change static channel membership semantics unless a naming-only change is sufficient. If current channel membership requires future LGU authority, preserve behavior and record the dependency.

### C. Messaging behavior preservation

Do not change:

- who can open Messages;
- visible channels/conversations;
- message ordering;
- sender identity display;
- message body rendering;
- send semantics;
- validation/error presentation;
- polling behavior;
- UI layout/design except where a symbol/file rename requires imports to change.

### D. Procurement reference prop cleanup

Remove active `showcase` terminology from the Procurement reference contract.

Current backend route/product behavior must remain reference-only.

Either:

- remove the prop if unnecessary; or
- rename it to a truthful neutral discriminator such as `referenceSurface` only if exact inspection proves the page needs it.

Do not implement Procurement lifecycle logic.

### E. Employee Directory DTO cleanup

Rename/remove the stale `featuredLogins` summary key and exact frontend consumer so the canonical DTO reflects the real active portal-account count semantics.

Do not change the underlying count logic unless an actual defect is proven.

### F. Current-contract tests

Update only directly affected browser/frontend/unit/current-contract tests necessary for the canonical names/endpoints.

Historical `.forge/**` provenance and historical migration/table names may retain `prototype` terminology.

---

## Owned source

This writer may modify only the directly affected frontend/contract surfaces, including where present:

- `resources/js/pages/Messages/**`
- `resources/js/components/messages/**`
- `resources/js/hooks/messaging/**`
- directly affected Messaging shared types/utilities
- `resources/js/pages/Employees/Index.tsx` only for DTO adoption
- `resources/js/pages/MunicipalSystems/**` only for Procurement reference-prop cleanup
- directly affected frontend/browser/unit/current-contract tests

If a required change materially falls outside this list, STOP and return the dependency to Maintainer.

---

## Prohibited scope

Do NOT modify:

- P06-W01 Showcase/Auth/MFA implementation;
- the frozen W02A backend route/controller/model contract except for a proven compile defect;
- migrations/schema;
- Full HRIS;
- Procurement lifecycle/business logic;
- Project Monitoring lifecycle/KPIs;
- department-specific routing/approval/SLA/confidentiality rules;
- `.github/**`;
- Docker/deployment;
- repository separation;
- `main`;
- dependency versions;
- unrelated visual design.

No invented municipal rules.

---

## Required proof

Run narrow self-validation where available.

At minimum return evidence that:

1. frontend Messages transport now uses `/messages/feed` only;
2. no active frontend import/use of `usePrototypeMessaging`, `prototypeMessaging`, `PrototypeMessage`, `PrototypeMessageBubble`, or `PrototypeMessageComposer` remains except explicitly retained historical/test provenance;
3. polling/send/XSRF/error handling behavior remains equivalent;
4. Procurement reference UI no longer uses `showcase` as active product terminology;
5. Employee Directory frontend/backend DTO names match;
6. typecheck/build or targeted tests are reported truthfully if run;
7. no broad CI PASS is claimed.

---

## Stop conditions

STOP and return to Maintainer if:

- frontend adoption requires changing Messaging behavior;
- the backend `/messages/feed` contract proves invalid in a way requiring redesign;
- channel membership/visibility requires new LGU truth;
- cleanup collides materially with P06-W01 Auth/Showcase changes;
- `.github/**` must change to make product source compile;
- scope expands into Procurement/Project/HRIS implementation, deployment, or repository separation.

---

## Return contract

Return exactly:

1. final candidate SHA;
2. changed-file inventory vs `cfde6141f3a98f30b322eac42f577a7345806d69`;
3. before/after frontend Messaging contract map;
4. accepted-behavior equivalence summary;
5. Procurement reference contract cleanup summary;
6. Employee Directory DTO cleanup summary;
7. tests actually run and actual results;
8. P08 CI/browser-harness follow-up items;
9. unresolved cross-layer issues;
10. confirmation P06-W01 scope, migrations/schema, main, Docker, deployment and repository separation were untouched.

Do not merge.
Do not promote.
Do not deploy.

Proceed to mutation, not another inspection-only return.
