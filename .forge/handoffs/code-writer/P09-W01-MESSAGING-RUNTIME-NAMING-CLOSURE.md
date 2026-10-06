# KIRION FORGE: CODE WRITER — P09-W01 MESSAGING RUNTIME NAMING CLOSURE

## Authority

Series: `P SERIES — CANONICAL BASELINE HARDENING`

Slice: `P09 — PRE-FREEZE RESIDUE CLOSURE`

Work package: `P09-W01 — MESSAGING RUNTIME NAMING CLOSURE`

Technical Authority: **Kirch Ivan Balite**

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

P09 coordination branch:

`KIRCH-TALIBON-P09-PROTOTYPE-SHOWCASE-RESIDUE-AUDIT`

Authorized writer branch ONLY:

`KIRCH-TALIBON-P09-W01-MESSAGING-RUNTIME-NAMING-CLOSURE`

Exact product/runtime source SHA:

`a73d305962344041fb617ddc9276f1352bae8444`

That SHA is one governance-only commit beyond the exact P08 green runtime candidate:

`fe50036366e4faf20f10b7deff007eb6d33ec1e4`

P08 exact-head acceptance:

- workflow Run #26;
- run ID `37404052881`;
- conclusion `SUCCESS`;
- exact validated SHA `fe50036366e4faf20f10b7deff007eb6d33ec1e4`.

The P09 source adds only the Maintainer residue-audit handoff over that green candidate. No product behavior change is inherited from the P09 governance commit.

Do not merge `main`.
Do not promote.
Do not deploy.
Do not create another branch.

---

## Mission

Complete the **already-authorized P06 Messaging canonical naming contract** that remains partially unfinished in the active canonical runtime.

This is not a new redesign and not a new P09 interpretation.

The prior P06 Messaging handoff explicitly required accepted Messaging to stop using active transitional `PrototypeMessaging` / `PrototypeMessage` contract names while preserving behavior exactly. The current P09 source already has:

- canonical controllers under `App\Http\Controllers\Messaging`;
- canonical model `App\Models\Message`;
- canonical routes `messages.feed.index` and `messages.feed.store`;
- canonical frontend Messaging contracts.

But the active backend runtime still imports:

- `App\Http\Requests\PrototypeMessaging\StorePrototypeMessageRequest`;
- `App\Http\Resources\PrototypeMessaging\PrototypeMessageResource`;
- `App\Prototype\Messaging\PrototypeMessagingChannels`.

P09-W01 closes only that residual active runtime naming debt and the directly affected **blocking current-contract tests**.

Behavior must remain identical.

---

## Current exact runtime contract

At the source SHA, the active routes are:

`GET /messages/feed -> App\Http\Controllers\Messaging\ListMessagesController`

`POST /messages/feed -> App\Http\Controllers\Messaging\StoreMessageController`

with route names:

- `messages.feed.index`
- `messages.feed.store`

The active persistence model is:

`App\Models\Message`

mapped intentionally to the retained historical table:

`prototype_messages`

That table mapping is **not** a P09-W01 defect.

---

## Owned source

P09-W01 may modify only the minimum files required to canonicalize these remaining active Messaging runtime names.

Primary owned files:

- `app/Http/Controllers/Messaging/ListMessagesController.php`
- `app/Http/Controllers/Messaging/StoreMessageController.php`
- `app/Http/Requests/PrototypeMessaging/StorePrototypeMessageRequest.php`
- replacement canonical request path under `app/Http/Requests/Messaging/**`
- `app/Http/Resources/PrototypeMessaging/PrototypeMessageResource.php`
- replacement canonical resource path under `app/Http/Resources/Messaging/**`
- `app/Prototype/Messaging/PrototypeMessagingChannels.php`
- replacement canonical channel-definition path under an existing or straightforward canonical Messaging namespace

Directly affected current-contract tests only:

- `tests/Feature/PrototypeMessaging/PrototypeMessageListTest.php`
- `tests/Feature/PrototypeMessaging/PrototypeMessageStoreTest.php`
- `tests/Feature/PrototypeMessaging/PrototypeMessagingAccessTest.php`

The writer MAY move/rename those three current-contract tests into a canonical `tests/Feature/Messaging/**` namespace/path if this can be done without changing assertions or behavior.

The writer MAY move the generic current `TestEnvironmentIsolationTest.php` out of the `PrototypeMessaging` directory only if required to leave a truthful current-test structure. Its test behavior must not change.

If any materially different file is required, STOP and return the dependency instead of widening scope silently.

---

## Explicitly frozen / prohibited scope

Do NOT modify:

- `routes/web.php` route paths, route names, middleware or throttle semantics;
- `app/Models/Message.php` table mapping unless a compilation-only import adjustment is proven necessary;
- `prototype_messages` table name;
- historical migrations;
- database schema;
- `database/seeders/PrototypeMessagingDemoSeeder.php`;
- `tests/Feature/PrototypeMessaging/PrototypeMessagingDemoSeederTest.php`;
- any `DeferredAndSpecialized` test solely to make it green;
- frontend Messaging behavior or UI;
- channel membership semantics;
- message ordering;
- polling behavior;
- sender identity semantics;
- payload shape;
- authorization;
- MFA;
- account-state rules;
- `routes/console.php` / `about:prototype`;
- `.env.example` / `SHOWCASE_MODE` / `PROTOTYPE_DEMO_PASSWORD`;
- public portal prototype/reference truth labels;
- Future Systems reference surfaces;
- payroll/HRIS prototype labels;
- Procurement or Project Monitoring behavior;
- Full HRIS;
- Property, Legislative or Travel Order behavior;
- `.github/**`;
- `.forge/**` except the writer return evidence if separately authorized;
- Docker;
- repository separation;
- deployment;
- `main`.

No dependency upgrades.
No broad refactor.
No schema cleanup.

---

## Required implementation outcomes

### A. Canonical request contract

Replace the active `StorePrototypeMessageRequest` runtime type with a canonical Messaging request name/namespace.

Preserve exactly:

- authorization result;
- Unicode-aware body trimming;
- required channel;
- required body;
- 2,000-character maximum;
- channel validation against the existing exact channel set.

### B. Canonical resource contract

Replace the active `PrototypeMessageResource` runtime type with a canonical Messaging resource name/namespace.

Preserve exactly the current JSON contract:

- `publicId`
- `cursor`
- `channel`
- `body`
- `createdAt`
- `sender.name`
- `sender.office`
- `isMine`

Do not expose private database/user identifiers.

### C. Canonical channel-definition contract

Replace active `PrototypeMessagingChannels` naming with neutral canonical Messaging terminology.

Preserve the exact channel list and order:

1. `General`
2. `Department Heads`
3. `MPDO Planning`
4. `Project Monitoring`
5. `Mayor's Office`
6. `Inter-Office Coordination`

Do not infer or redesign municipal channel membership/authority.

### D. Canonical current-contract tests

The three current blocking Messaging Feature tests must continue proving the same behavior while no longer presenting current accepted Messaging itself as a prototype contract.

Test data strings may remain synthetic/test-only where that is truthful; do not waste scope cosmetically rewriting every literal containing the word `prototype`.

The deferred demo-seeder test remains untouched and explicitly non-blocking under P08.

---

## Required negative behavior preservation

The returned candidate must continue proving:

- unauthenticated users cannot list/send messages;
- inactive users cannot access the feed;
- users subject to MFA cannot bypass assurance;
- invalid channel values are rejected;
- blank / whitespace-only bodies are rejected;
- bodies over 2,000 characters are rejected;
- client-supplied sender identity cannot spoof the authenticated sender;
- response payload does not expose `sender_user_id`;
- channel isolation remains intact;
- cursor/list ordering remains unchanged.

---

## Required self-validation

Run the smallest deterministic validation that proves this naming-only repair.

Minimum required:

1. the renamed/current Messaging list Feature tests;
2. the renamed/current Messaging store Feature tests;
3. the renamed/current Messaging access Feature tests;
4. any directly affected generic test moved by this lane;
5. route inspection confirming `messages.feed.index` and `messages.feed.store` remain unchanged;
6. repository/source search proving no active `app/**` import/use remains for:
   - `PrototypeMessagingChannels`
   - `StorePrototypeMessageRequest`
   - `PrototypeMessageResource`

Do not claim the full P08 acceptance pipeline passed unless it actually runs on the returned exact candidate.

The Maintainer will decide the final exact-candidate revalidation cadence before P0-H freeze.

---

## Acceptance invariants

The candidate is acceptable only if all are true:

- accepted Messaging behavior is unchanged;
- routes and middleware are unchanged;
- persistence remains on `prototype_messages` with no migration/history rewrite;
- no active runtime import/use remains for the three transitional names owned by this lane;
- current blocking tests retain equivalent positive and negative coverage;
- deferred demo/prototype fixtures remain honestly deferred rather than rewritten to force green;
- no unrelated `Prototype` / `Showcase` cleanup was attempted;
- no business rule was invented;
- no product surface was redesigned.

---

## Stop conditions

STOP and return to Maintainer if:

- canonical naming requires a schema/table migration;
- an external/integration contract depends on one of the old PHP class names;
- behavior changes are required to complete the rename;
- route paths/names would need to change;
- frontend behavior would need redesign;
- the work expands into demo seeders, environment/showcase retirement, specialized domains, CI/platform work or repository separation.

---

## Required writer return

Return:

1. exact branch name;
2. exact source SHA;
3. exact candidate SHA;
4. commit list;
5. changed-file list;
6. old -> new class/path mapping;
7. validation commands actually run;
8. exact PASS/FAIL results;
9. any remaining `PrototypeMessaging` occurrences and their classification;
10. confirmation that routes, middleware, payload, channel list, table/schema, frontend, auth/MFA, deferred tests, `.github/**`, deployment and `main` were untouched;
11. any blocker requiring Maintainer disposition.

Do not merge.
Do not promote.
Do not deploy.
