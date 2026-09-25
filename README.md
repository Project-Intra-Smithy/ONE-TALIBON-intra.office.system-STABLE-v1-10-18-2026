# ONE TALIBON V1 — Prototype-Day Authority

ONE TALIBON V1 is the Talibon municipal digital-workspace prototype maintained in this repository.

## Technical authority

**Kirch Ivan Balite** is the sole Technical Authority for this repository.

All other human or automated contributors are **Developers / Contributors** unless Kirch Ivan Balite explicitly delegates a narrower authority in a repository-local handoff.

Contributor implementation, review, QA, DevOps, frontend, backend, or documentation work does not independently create promotion, integration, release, deployment, or architectural authority.

## Current product authority

The hardened product line entering the prototype-day audit is:

`KIRCH-TALIBON-BH1-BACKEND-RUNTIME-HARDENING@27824223d5169c8eadf16ab863d09aab9585db9c`

State entering DA1:

- CAL1 Calendar workspace: completed and feature-frozen;
- BH1 backend/runtime hardening: reviewed and closed;
- DA1 prototype-day blocker audit: active;
- `main`: not yet promoted to the hardened product line;
- deployment: not authorized solely by BH1 closeout.

The current audit branch is temporary:

`KIRCH-TALIBON-DA1-PROTOTYPE-DAY-BLOCKER-AUDIT`

Git and observed runtime evidence outrank stale documentation.

## Current objective

Before prototype day:

1. deeply audit the exact current product for blockers and material demo hindrances;
2. repair only confirmed prototype-day defects;
3. reconcile intentional `main`-only public-portal work with the hardened product line;
4. run full release validation on the exact reconciliation candidate;
5. promote the validated product to `main`;
6. preserve historical branch tips with archival tags;
7. delete all non-`main` remote branches;
8. use `main` as the single continuing branch.

Do not delete historical branches before the promotion candidate has passed validation and their tips have been preserved.

## Prototype-day critical paths

The audit must prove, at minimum:

- application boot and database readiness;
- deterministic demo seeding;
- all seven curated showcase personas;
- Dashboard and role-aware navigation;
- Engineering -> Budget -> Mayor transaction lifecycle;
- append-only routing history;
- memorandum publication -> employee delivery/acknowledgement -> publisher statistics;
- legislative search/read;
- employee leave request -> HR review/approval;
- denied privileged access and retained audit evidence;
- Correspondence and Records;
- Calendar Month / Week / Day / Schedule;
- Messages, including two-user prototype messaging;
- System Administration and authorized Mayor workspace;
- production frontend assets;
- desktop/mobile presentation-critical layouts;
- no unexpected browser page errors or server 5xx responses.

The prototype is not release-ready merely because source inspection passes.

## Local stack

Expected stack:

- PHP 8.4+ for the current locked dependency set;
- Composer 2;
- Node 22;
- npm 10;
- PostgreSQL 16+;
- Laravel 13;
- Inertia + React 19 + TypeScript + Vite.

Install dependencies from the lockfiles:

```powershell
composer install --no-interaction --prefer-dist --optimize-autoloader
npm.cmd ci --no-audit --no-fund
```

Do not use `composer update` or regenerate dependency locks as a deployment workaround.

## Environment

Start from:

```powershell
Copy-Item .env.example .env
php artisan key:generate
```

Use a dedicated disposable prototype database for destructive validation.

For a production-mode demo seed, `PROTOTYPE_DEMO_PASSWORD` must be a private strong value of at least 16 characters. Never commit or print it.

Primary seeded showcase identities:

```text
admin@talibon.demo
mayor@talibon.demo
engineering@talibon.demo
budget@talibon.demo
hr@talibon.demo
legislative@talibon.demo
employee@talibon.demo
```

## Minimum release gate

Before promotion/deployment, record the exact SHA and execute:

```powershell
npm.cmd run types:check
npm.cmd run build
php artisan test --testsuite=Feature
php artisan route:cache
php artisan view:cache
```

Then execute the repository's current prototype-day browser/mutation audit carrier from the DA1 plan.

Do not claim PASS for anything that was not observed.

## Main-promotion rule

Do **not** overwrite `main` with a force push.

The current hardened line and `main` have diverged. Promotion must therefore use a separately validated reconciliation candidate that contains:

- the complete hardened CAL1/BH1 lineage; and
- only the intentional `main`-only product work retained by Technical Authority.

Once `main` is an ancestor of the validated reconciliation candidate, promotion may proceed by a normal non-force integration path.

## Branch-cleanup rule

The target repository state is:

```text
branches:
  main
```

Before branch deletion:

- capture every remote branch tip;
- preserve required historical tips as archival tags;
- verify the final `main` contains the promoted product candidate;
- verify CAL1, BH1, DA1, pre-promotion `main`, and unique historical lines required for provenance remain reachable from `main` or archival tags.

Only then delete non-`main` remote branches.

## Safety

Never:

- reset or force-push accepted history as a convenience;
- run `migrate:fresh` against a non-disposable database;
- commit environment secrets;
- deploy from a stale historical branch;
- treat an old README, branch name, or chat recollection as stronger authority than current Git;
- reopen CAL1 or BH1 without new evidence and explicit Technical Authority.

See:

- `.forge/AUTHORITY.md`
- `.forge/handoffs/active/DA1-PROTOTYPE-DAY-BLOCKER-AUDIT.md`
- `docs/PROTOTYPE_DAY_MAIN_CONSOLIDATION_PLAN.md`
