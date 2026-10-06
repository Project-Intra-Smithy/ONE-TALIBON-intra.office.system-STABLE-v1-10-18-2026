# KIRION FORGE: MAINTAINER — P09 PROTOTYPE / SHOWCASE RESIDUE AUDIT

## Authority

Series: `P SERIES — CANONICAL BASELINE HARDENING`

Slice: `P09 — PROTOTYPE / SHOWCASE RESIDUE CLASSIFICATION + KNOWN-STATE PRE-FREEZE`

Technical Authority: **Kirch Ivan Balite**

Repository: `Kirch-Nairu/Talibon-Sales-Prototype`

Authorized branch ONLY:

`KIRCH-TALIBON-P09-PROTOTYPE-SHOWCASE-RESIDUE-AUDIT`

Exact immutable source SHA:

`fe50036366e4faf20f10b7deff007eb6d33ec1e4`

Source evidence:

- P08 exact-head validation Run #26: `SUCCESS`;
- P08 was `68 ahead / 0 behind` current `main@269975e1c1e61bcde78490530e5cc8e90f35ae47`;
- P09 branch was created directly from the green P08 SHA;
- no P09 product mutation is authorized until this classification pass establishes exact scope.

Do not merge `main`.
Do not promote.
Do not deploy.

---

## Governing repo-backed requirement

`.forge/evidence/acceptance/P08-BLOCKING-TEST-SCOPE.md` requires P09, before baseline freeze, to review remaining active `Prototype` / `Showcase` terminology and decide whether each occurrence is legitimate storage/provenance history, a deferred-test artifact, or active runtime residue requiring canonicalization.

The same record requires P09 to publish the P08 test-scope boundary in the known-state baseline record.

This P09 audit therefore precedes `P0-H — Known-state publication and freeze`.

---

## Mission

Produce an exact-source classification of remaining `Prototype` / `Showcase` terminology without erasing truthful reference/demo labels or rewriting historical provenance.

Each occurrence must be classified into one of these buckets:

- `REFACTOR — ACTIVE RUNTIME RESIDUE`
- `REMOVE — STALE ACTIVE CONFIG / HARNESS RESIDUE`
- `KEEP — STORAGE / SCHEMA COMPATIBILITY`
- `KEEP — REFERENCE / NON-AUTHORITATIVE PRODUCT SURFACE`
- `KEEP — TEST / DEFERRED SPECIALIZED ARTIFACT`
- `KEEP — HISTORICAL / FORGE PROVENANCE`
- `REVIEW — NEEDS TECHNICAL AUTHORITY DECISION`

Do not global-replace `prototype` or `showcase`.

---

## Initial exact-source findings

### Confirmed active runtime residue candidates

Canonical Messaging controllers still import active classes/resources under `PrototypeMessaging` namespaces:

- `app/Http/Controllers/Messaging/ListMessagesController.php`
- `app/Http/Controllers/Messaging/StoreMessageController.php`
- `app/Http/Requests/PrototypeMessaging/StorePrototypeMessageRequest.php`
- `app/Http/Resources/PrototypeMessaging/PrototypeMessageResource.php`
- `app/Prototype/Messaging/PrototypeMessagingChannels.php`

This is a strong `REFACTOR — ACTIVE RUNTIME RESIDUE` candidate because the public/controller contract is already canonical `Messaging` while internal runtime namespaces remain transitional.

`routes/console.php` still exposes `about:prototype` with `municipal workflow prototype` output. This is a `REFACTOR — ACTIVE RUNTIME RESIDUE` candidate unless explicitly retained as a historical diagnostic.

### Active configuration requiring classification

`config/prototype.php` and `.env.example` still define/use `PROTOTYPE_DEMO_PASSWORD`; `database/seeders/WorkforceDemoSeeder.php` actively consumes that configuration.

This is not safe for blind deletion. Classify whether the current demo-seeding contract remains deliberate non-production infrastructure or should be renamed into canonical fixture terminology.

`.env.example` still contains `SHOWCASE_MODE=false`. The active Showcase provider/service/controller/config chain was removed during the P06/P08 lineage. Verify whether any exact-head runtime code still consumes this key; if not, classify it as stale configuration residue.

### Likely legitimate storage/provenance compatibility

Historical migration/table identifiers containing `prototype`, including the prototype-message migration, must not be renamed merely for terminology cleanup.

Schema/history compatibility outranks cosmetic naming.

### Likely legitimate reference/non-authoritative surfaces

The current source intentionally truth-labels several non-live/reference surfaces with `prototype`, including:

- public portal sample/reference content in `config/public_portal.php`;
- Future Systems interactive/static reference surfaces under `resources/js/components/municipal-systems/**` and `resources/js/data/municipal/futureSystemPrototypeData.ts`;
- synthetic payroll/reference notices;
- department sample/reference notices.

Do not remove those labels if they are what prevents synthetic/reference data from being mistaken for authoritative municipal data.

### Deferred / test history

Tests already classified under P08 `DeferredAndSpecialized` may legitimately retain historical `Prototype` / `Showcase` terminology until their owning domain receives dedicated authority.

P09 must not rewrite deferred tests merely to make terminology look clean.

### Historical provenance

`.forge/**` evidence/directives/handoffs and historical showcase records may retain `Prototype` / `Showcase` terminology when describing actual history.

Do not rewrite historical evidence to look current.

---

## Audit scope

Inspect exact P09 source across:

- `app/**`
- `bootstrap/**`
- `config/**`
- `database/**`
- `resources/**`
- `routes/**`
- `tests/**`
- `.env.example`
- `composer.json`
- `package*.json`
- active `.github/**` workflows
- current-facing root/docs governance where terminology affects present authority

Historical `.forge/**` evidence is classification input but not cleanup ownership.

---

## Frozen / prohibited scope

Do NOT:

- change business/domain semantics;
- redesign auth/MFA;
- alter authorization;
- change Work Request / Correspondence / Document / Transaction boundaries;
- promote deferred HRIS, Property, Legislative, Travel Order, Procurement or other specialized domains;
- rename historical migrations or destructively rename persisted tables solely for terminology;
- rewrite historical Forge evidence;
- broaden CI architecture beyond terminology/residue proof;
- split repositories yet;
- merge to `main`;
- deploy.

---

## Required P09 outputs

1. Exact residue inventory with classification for each active occurrence class.
2. Bounded cleanup handoff(s) only for confirmed active residue.
3. Direct tests for any runtime renames so behavior remains unchanged.
4. Known-state baseline record that publishes:
   - exact candidate SHA;
   - P08 blocking `Feature` suite boundary;
   - `DeferredAndSpecialized` boundary;
   - known-good capabilities;
   - reference/non-authoritative capabilities;
   - deferred domains;
   - known defects / production gates;
   - repository-separation readiness.
5. Exact-candidate revalidation if any executable source changes.
6. Maintainer closeout into `P0-H — Known-state publication and freeze`.

---

## P09 exit gate

P09 is complete only when:

- no unclassified active `Prototype` / `Showcase` residue remains;
- intentional reference/provenance/storage terminology is explicitly recorded as intentional;
- confirmed active runtime residue is repaired or explicitly deferred by Technical Authority;
- P08 test-scope boundary is published in the known-state record;
- the final P09 candidate has exact-SHA validation appropriate to its mutations;
- the exact Phase 0 freeze candidate SHA is named.

Only after that may Maintainer execute the P0-H baseline freeze/promotion decision.
