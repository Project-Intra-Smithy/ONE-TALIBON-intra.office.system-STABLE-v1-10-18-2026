# KIRION FORGE: CODE WRITER — P06-W02 MESSAGING / CONTRACT CLEANUP

## Authority

Series: `P SERIES — CANONICAL BASELINE HARDENING`

Slice: `P06 — CROSS-LAYER CONTRACT RECONCILIATION`

Work package: `P06-W02 — MESSAGING / CONTRACT CLEANUP`

Technical Authority: **Kirch Ivan Balite**

Repository: `Kirch-Nairu/Talibon-Sales-Prototype`

Authorized branch ONLY:

`KIRCH-TALIBON-P06-W02-MESSAGING-CONTRACT-CLEANUP`

Exact common source SHA:

`6dc0b599f3b4b79d9dee45091ad2379de235b21c`

This source is the Maintainer-controlled convergence of accepted P03 backend canonicalization and accepted P04 frontend canonicalization.

Do not change branch strategy. Do not merge `main`. Do not promote or deploy.

---

## Mission

Canonicalize the already accepted Messaging feature away from transitional `Prototype*` naming while preserving its accepted behavior exactly, and clean the small remaining cross-layer contract names that still present prototype/showcase semantics in the canonical product.

This is a naming/contract reconciliation lane, not a Messaging redesign.

The accepted Messaging feature remains protected. No new messaging lifecycle, membership, permission, delivery, notification, retention, or municipal business rules may be invented here.

---

## Product / PDF authority

The governing implementation plan records Messaging as an accepted later feature delta and requires exact-candidate preservation. It also states that prototype/showcase maturity is not production authority and that code/route existence does not itself establish final municipal semantics.

Therefore:

- Messaging behavior is accepted and must remain functionally equivalent;
- active runtime naming must stop presenting accepted Messaging as a prototype bridge;
- legacy storage/schema names may be retained where renaming would introduce avoidable data risk;
- unrelated client/LGU workflow truth remains blocked rather than guessed.

---

## Known exact common-source residue

At `6dc0b599f3b4b79d9dee45091ad2379de235b21c`, active product/runtime code still includes transitional Messaging contracts including:

- namespace/directory `App\Http\Controllers\PrototypeMessaging`;
- `ListPrototypeMessagesController`;
- `StorePrototypeMessageController`;
- model `PrototypeMessage`;
- route path `/messages/prototype/messages`;
- route names `messages.prototype.index` and `messages.prototype.store`;
- frontend hook `usePrototypeMessaging`;
- frontend source such as `prototypeMessaging.ts` and `prototypeChannels.ts`;
- tests/evidence using PrototypeMessaging terminology.

The shared source also contains two smaller residual cross-layer naming issues:

1. Procurement reference route still renders `MunicipalSystems/Index` with a prop named `showcase` even though the surface is classified as reference/pending authority.
2. Employee Directory summary still uses the stale key `featuredLogins` even though the value now represents active portal-account count rather than showcase/demo featured users.

These are in scope only to the extent necessary to align the current backend/frontend contract.

---

## Primary target contract

### Messaging before

`/messages` page -> frontend PrototypeMessaging hook/contracts -> `/messages/prototype/messages` -> PrototypeMessaging controllers -> PrototypeMessage persistence`

### Messaging required after

`/messages` page -> canonical Messaging hook/contracts -> canonical Messaging endpoint/controller naming -> existing accepted persistence/behavior`

The observable accepted behavior must remain unchanged.

Do not use the rename as an excuse to change message ordering, membership, visibility, send semantics, read semantics, channel behavior, payload meaning, authorization, or UI design.

---

## Required investigation before mutation

Search the exact common source for at least:

- `PrototypeMessaging`
- `PrototypeMessage`
- `prototypeMessaging`
- `usePrototypeMessaging`
- `prototypeChannels`
- `/messages/prototype/messages`
- `messages.prototype`
- database table/migration names containing `prototype`
- tests containing `PrototypeMessaging`
- `featuredLogins`
- `['showcase' => 'procurement']`
- frontend consumers of Procurement reference props
- frontend consumers of Employee Directory summary DTO

Classify every occurrence as:

- `RENAME — ACTIVE CONTRACT`
- `REFACTOR — ACTIVE CONTRACT`
- `KEEP — LEGACY STORAGE / MIGRATION HISTORY`
- `KEEP — HISTORICAL FORGE EVIDENCE`
- `KEEP — TEST PROVENANCE ONLY`
- `REMOVE — STALE CONTRACT`
- `P08 FOLLOW-UP — CI HARNESS ONLY`

Do not blindly global-replace.

---

## Owned source

This work package may modify only the bounded Messaging and residual cross-layer contract surfaces required for canonicalization, including where present:

### Backend Messaging

- `app/Http/Controllers/PrototypeMessaging/**`
- replacement canonical Messaging controller namespace/files
- `app/Models/PrototypeMessage.php`
- replacement canonical model facade/name where safe
- `routes/web.php` only for Messaging route imports/paths/names and the Procurement reference prop cleanup
- directly affected Messaging services/policies/resources if exact inspection proves a naming dependency
- directly affected Feature tests

### Frontend Messaging

- `resources/js/pages/Messages/**`
- `resources/js/components/messages/**`
- `resources/js/hooks/messaging/**`
- directly affected shared Messaging types/utilities
- directly affected browser/unit tests

### Residual contract cleanup

- `app/Http/Controllers/EmployeeDirectoryController.php` only for stale summary-key naming
- `resources/js/pages/Employees/Index.tsx` only for corresponding DTO consumption
- `resources/js/pages/MunicipalSystems/**` or the exact Procurement-reference consumer only if required to replace/remove the stale `showcase` prop

If a necessary file falls materially outside this bounded list, stop and record it instead of expanding scope silently.

---

## Frozen / prohibited scope

Do NOT modify:

- Showcase/Auth/MFA subsystem — P06-W01 owns it;
- accepted Messaging behavior or municipal messaging rules;
- Full HRIS;
- Procurement lifecycle/business semantics;
- Project Monitoring lifecycle/KPIs;
- department-specific routing, approval/signature, SLA or confidentiality rules;
- `.github/**` workflows in this writer lane;
- Docker/runtime deployment topology;
- repository separation;
- `main`;
- broad dependency versions;
- unrelated visual design.

Do not invent a new API architecture in this lane.

Do not introduce WebSockets/realtime transport changes unless they already exist and only require a symbol rename.

---

## Database / migration safety law

Historical migrations are provenance and must not be destructively rewritten merely to remove the word `prototype`.

If the physical table or migration uses a legacy prototype name:

1. inspect whether the current accepted feature depends on that storage name;
2. prefer a canonical application-layer model/class/table mapping when this safely removes runtime terminology without data migration risk;
3. do NOT rename a populated table or rewrite migration history without explicit Maintainer authority;
4. document every retained legacy storage name and why it is safe/necessary;
5. if a clean schema rename is materially beneficial but requires data migration, return it as a P07/P08 or later bounded migration decision instead of improvising.

No destructive schema operations.

---

## Required implementation outcomes

### A. Canonical Messaging backend names

Replace active `PrototypeMessaging` controller/class naming with canonical Messaging naming.

Use straightforward names representing existing behavior, e.g. canonical list/store message controllers or an equivalent bounded namespace consistent with the repository.

Do not over-architect.

### B. Canonical Messaging route contract

Remove `/messages/prototype/messages` and `messages.prototype.*` from active runtime.

Choose the smallest non-conflicting canonical route contract under the existing `/messages` product surface.

The frontend and backend must agree exactly.

Document the before/after route names and paths in the return.

### C. Canonical Messaging application model naming

Remove active application-layer `PrototypeMessage` terminology where safely possible.

If legacy table naming must remain, map the canonical model explicitly to the retained table and document it.

Behavior and persisted data shape must remain equivalent.

### D. Canonical frontend Messaging names

Replace active frontend symbols/files/hooks such as `usePrototypeMessaging` / `prototypeMessaging` with neutral canonical Messaging terminology.

Do not redesign Messages UI or change accepted channel/message semantics.

### E. Channel/reference semantics

If `prototypeChannels.ts` contains current accepted static channel definitions or user/group mappings, do not invent new membership semantics while renaming.

Canonicalize the symbol/file name only when behavior remains identical.

If authoritative channel membership requires future LGU roster/permission truth, record the dependency rather than changing behavior.

### F. Procurement reference contract cleanup

The route currently named `procurement.reference` must not pass a prop called `showcase` as active product semantics.

Either:

- replace it with a truthful neutral/reference discriminator consumed by the existing page; or
- remove the prop entirely if exact frontend inspection proves it is unnecessary.

Do not implement Procurement lifecycle logic.

### G. Employee Directory DTO cleanup

The backend summary key `featuredLogins` no longer represents featured/demo logins and must not survive as canonical DTO terminology.

Rename/remove it and align the exact frontend consumer without changing the underlying count semantics unless a defect is proven.

### H. Tests and evidence terminology

Update active current-contract tests to canonical Messaging naming where necessary.

Historical `.forge/**` evidence and old migration filenames may retain prototype terminology as provenance.

---

## Required tests / proof

Run only narrow self-validation needed for this candidate.

At minimum provide evidence for:

1. canonical Messaging list/read surface still works for the same accepted users/channels;
2. canonical send/store behavior persists the same message data and returns equivalent success/error behavior;
3. authorization/visibility behavior is unchanged;
4. frontend Messages page talks only to the canonical endpoint;
5. no active runtime route named `messages.prototype.*` remains;
6. no active runtime path `/messages/prototype/messages` remains;
7. repository search proves no active application import/use of `PrototypeMessaging`, `PrototypeMessage`, `usePrototypeMessaging`, or `prototypeMessaging` except explicitly retained storage/history/test provenance;
8. Employee Directory frontend/backend DTO names match;
9. Procurement reference surface no longer uses `showcase` as active prop terminology;
10. frontend typecheck/build succeeds if practical in the writer environment;
11. targeted Messaging Feature tests pass.

Do not claim broad CI PASS.

---

## Accepted-behavior preservation law

Messaging was accepted before this cleanup. A rename is not authority to reinterpret it.

The writer must return a before/after behavior map showing that these remain equivalent where present:

- who can access Messages;
- which channels/conversations are visible;
- message list ordering;
- message payload fields;
- sender identity semantics;
- create/send success behavior;
- validation/error behavior;
- authorization boundaries;
- frontend rendered message content.

If any of these cannot remain equivalent, STOP and return the conflict to Maintainer.

---

## P08 CI-harness follow-up map

Do not edit `.github/**` here.

Record any P08 workflow/browser-test references to old Messaging names, paths, selectors or scripts that must be synchronized after P07 integration.

This is evidence for P08, not authority to modify CI now.

---

## Stop conditions

STOP and return to Maintainer if:

- a canonical route rename would break an external/integration contract not owned by this repo;
- table/schema rename would require a destructive or risky migration;
- behavior changes are required to complete naming cleanup;
- Messaging membership/permissions require new LGU business truth;
- cleanup collides with P06-W01 Auth/Showcase files in a non-trivial way;
- `.github/**` must change to make product source compile;
- scope expands into Procurement/Project/HRIS business implementation, deployment or repository separation.

---

## Return contract

Return exactly:

1. final candidate SHA;
2. changed-file inventory vs `6dc0b599f3b4b79d9dee45091ad2379de235b21c`;
3. complete before/after Messaging contract map: namespaces, classes, model names, route names, route paths, frontend hook/client names;
4. accepted-behavior equivalence proof;
5. every legacy storage/migration name retained and why;
6. Procurement reference contract cleanup summary;
7. Employee Directory DTO cleanup summary;
8. tests actually run and actual results;
9. P08 CI/browser harness cleanup items;
10. unresolved cross-layer issues;
11. confirmation Auth/Showcase W01 scope, main, Docker, deployment and repository separation were untouched.

Do not merge.
Do not promote.
Do not deploy.

Proceed.