# KIRION FORGE: CODE WRITER — P09-W02 CURRENT-FACING RESIDUE CLOSURE

## Authority

Series: `P SERIES — CANONICAL BASELINE HARDENING`

Slice: `P09 — PRE-FREEZE RESIDUE CLOSURE`

Work package: `P09-W02 — CURRENT-FACING RESIDUE CLOSURE`

Technical Authority: **Kirch Ivan Balite**

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

P09 coordination branch:

`KIRCH-TALIBON-P09-PROTOTYPE-SHOWCASE-RESIDUE-AUDIT`

Authorized writer branch ONLY:

`KIRCH-TALIBON-P09-W02-CURRENT-FACING-RESIDUE-CLOSURE`

Exact source SHA:

`4332efdb5c275da72551861148fd7e0ae1e1e8ae`

This source contains accepted P09-W01 Messaging runtime canonicalization. P09-W01 was independently validated by:

- P08 Targeted Baseline Acceptance Run #27;
- Run ID `37427951734`;
- exact SHA `464e46fa7db7b321f4d0fbeb863acde6f025c548`;
- conclusion `SUCCESS`.

From that validated writer candidate to this P09 source, executable product code is unchanged; only Maintainer evidence was added.

Do not merge `main`.
Do not promote.
Do not deploy.
Do not create another branch.

---

## Mission

Close only the small set of **current-facing stale Prototype/Showcase identity and CI-entry residue** that would make a Phase-0 freeze misleading.

This is the final bounded source-cleanup package before known-state publication / P0-H freeze.

This is NOT authority to perform another repository-wide Prototype/Showcase cleanup.

Preserve intentional fixture, schema, reference-surface, historical, deferred-test and Forge provenance terminology.

---

## Owned files

P09-W02 may modify only:

1. `routes/console.php`
2. `composer.json`
3. `.env.example`
4. `.github/workflows/mp0-messaging-closure.yml`
5. `.github/workflows/da1-prototype-day-audit.yml`
6. `.github/workflows/bh2-fast-render-hardening.yml`

If another file becomes necessary, STOP and return the dependency to Maintainer.

---

## Required changes

### A. Current CLI product identity

Current source exposes:

`about:prototype`

and prints:

`Talibon Intra-Office Portal - municipal workflow prototype`

Replace that current-facing diagnostic with a neutral canonical portal identity.

Preferred contract:

`about:portal`

Output should identify the application as the Talibon Intra-Office Portal without presenting the accepted shared core as a prototype.

Do not add business behavior.

Repository search must show no active `about:prototype` command after the change.

### B. Composer package description

Current `composer.json` description still calls the application a prototype.

Replace only the description text with a current canonical description such as:

`Secure municipal intra-office portal for LGU Talibon.`

Do not change dependencies, scripts, package name, autoloading, versions or lockfile.

### C. Environment example truthfulness

In `.env.example`:

- KEEP `PROTOTYPE_DEMO_PASSWORD` because it remains an active fixture/demo-seeding security control used by `config/prototype.php` and `WorkforceDemoSeeder`;
- rewrite its comment so it is clearly about development/demo fixture credentials, not current product identity;
- REMOVE stale `SHOWCASE_MODE=false` from the current environment example because the active Showcase runtime subsystem was retired;
- rewrite the GIS comment from "showcase browser configuration" to truthful neutral/reference-surface wording.

Do not rename `PROTOTYPE_DEMO_PASSWORD` in this lane.
Do not modify `config/prototype.php` or seeders.

### D. Retire misleading manual execution of historical CI

The following historical workflows remain useful as provenance/branch-bound history but still expose `workflow_dispatch`, which allows operators to manually run obsolete Prototype/Showcase contracts from arbitrary refs:

- `.github/workflows/mp0-messaging-closure.yml`
- `.github/workflows/da1-prototype-day-audit.yml`
- `.github/workflows/bh2-fast-render-hardening.yml`

Remove ONLY their `workflow_dispatch` trigger.

Preserve their historical branch-bound `push.branches` triggers and existing workflow contents otherwise.

Do NOT modernize these workflows.
Do NOT change their old test paths, old environment names, showcase/prototype labels, browser scripts or historical assertions.
They are being de-exposed as manual current validation, not rewritten into new CI.

The canonical current validation authority remains:

`.github/workflows/p0-windows-self-hosted-validation.yml`

Do not modify it.

---

## Intentionally retained terminology — DO NOT CLEAN

The following categories are explicitly OUT OF SCOPE and may retain Prototype/Showcase terminology:

- `PROTOTYPE_DEMO_PASSWORD` variable itself;
- `config/prototype.php`;
- `database/seeders/PrototypeMessagingDemoSeeder.php`;
- `tests/Feature/PrototypeMessaging/PrototypeMessagingDemoSeederTest.php`;
- historical migrations/table names such as `prototype_messages`;
- payroll prototype schema history;
- `resources/js/components/municipal-systems/FutureSystemPrototype.tsx`;
- `resources/js/data/municipal/futureSystemPrototypeData.ts`;
- reference/synthetic labels that truthfully prevent non-authoritative data from appearing official;
- `scripts/showcase-*.ps1` / `showcase-*.mjs`;
- `scripts/prototype-day-audit.ps1`;
- historical `.forge/**` evidence/directives/handoffs;
- historical docs;
- deferred/specialized tests;
- branch-bound historical workflow content after manual dispatch is removed.

Do not delete or rename these merely to reduce search hits.

---

## Frozen architecture / product scope

Do NOT modify:

- Messaging runtime behavior;
- auth/MFA;
- routes/web.php;
- database schema/migrations;
- models;
- seeders;
- frontend product surfaces;
- Task / Work Request / Correspondence / Document / Transaction boundaries;
- Procurement / Project Monitoring behavior;
- HRIS / Property / Legislative / Travel Order behavior;
- P08 canonical validation workflow;
- Docker;
- repository separation;
- deployment;
- `main`.

No dependency upgrades.
No business rules.
No redesign.

---

## Required validation

Run the smallest deterministic proof appropriate to this bounded cleanup:

1. `composer validate --no-check-publish` or equivalent Composer manifest validation;
2. `php artisan list` or equivalent proof that `about:portal` is registered and `about:prototype` is absent;
3. execute `php artisan about:portal` and capture successful output;
4. source check proving `.env.example` retains `PROTOTYPE_DEMO_PASSWORD` but no longer contains `SHOWCASE_MODE`;
5. YAML syntax/parse check for the three owned workflow files;
6. source check proving each owned historical workflow retains its exact branch-bound push trigger and no longer contains `workflow_dispatch`;
7. Git diff proving only the six authorized files changed.

Do not claim full P08 exact-head acceptance unless it actually runs.

After writer return, Maintainer will independently review and trigger exact-candidate P08 acceptance if executable/source-contract changes require it before freeze.

---

## Acceptance invariants

The candidate is acceptable only if:

- current CLI identity no longer says prototype;
- composer package description no longer says prototype;
- current environment example no longer advertises retired `SHOWCASE_MODE`;
- fixture security configuration remains intact;
- historical CI remains preserved but is no longer manually dispatchable;
- canonical P08 workflow is untouched;
- no product behavior changes;
- no unrelated terminology cleanup;
- no schema/test-history rewriting;
- no main mutation.

---

## Stop conditions

STOP and return to Maintainer if:

- removing `SHOWCASE_MODE` from `.env.example` breaks active application configuration;
- `about:prototype` is consumed externally;
- historical workflows must remain manually dispatchable for an active supported operational procedure;
- validation requires changing any non-owned file;
- scope expands into actual product behavior or platform redesign.

---

## Required writer return

Return:

1. exact branch;
2. exact source SHA;
3. exact candidate SHA;
4. commit list;
5. changed-file list;
6. exact before -> after mapping for CLI identity, Composer description and environment-example lines;
7. exact workflow trigger changes;
8. validation commands actually executed;
9. PASS/FAIL results;
10. remaining Prototype/Showcase occurrences in the owned files and why they are intentionally retained;
11. confirmation that frozen product scope, P08 workflow, schema, seeders, frontend, auth/MFA, deployment and main were untouched;
12. any blocker.

Do not merge.
Do not promote.
Do not deploy.
