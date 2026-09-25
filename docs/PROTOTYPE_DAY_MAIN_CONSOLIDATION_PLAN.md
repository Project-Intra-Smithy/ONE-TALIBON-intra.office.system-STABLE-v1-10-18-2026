# ONE TALIBON V1 — PROTOTYPE-DAY MAIN CONSOLIDATION PLAN

Technical Authority:

**Kirch Ivan Balite**

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

## End state

The program closes only when:

```text
remote branches:
main
```

and `main` contains the validated, hardened, prototype-day product.

Historical branch names are not retained merely for convenience. Required historical tips are preserved with archival tags before branch deletion.

## Starting authorities

Hardened product authority:

`KIRCH-TALIBON-BH1-BACKEND-RUNTIME-HARDENING@27824223d5169c8eadf16ab863d09aab9585db9c`

Audit line:

`KIRCH-TALIBON-DA1-PROTOTYPE-DAY-BLOCKER-AUDIT`

Pre-consolidation main:

`main@9cc1b50b28762402c3b24a721cd5ba7ae961817c`

Known relationship at program start:

- BH1/current hardened line and `main` are diverged;
- the hardened line contains the later internal workspace, CAL1 and BH1 work;
- `main` contains a smaller set of newer public-portal/homepage changes not yet reconciled into the hardened line.

No force push is authorized.

## Phase 0 — Governance repair

Status: ACTIVE / PARTIALLY EXECUTED.

Required:

- README must point at current authority, not the old expedited deployment branch;
- Kirch Ivan Balite must be explicit sole Technical Authority;
- all other contributors classified as Developers / Contributors unless separately delegated;
- stale cross-repository authority wording must be reduced to provenance;
- current branch/promotion/cleanup policy must be durable.

No product semantics change in this phase.

## Phase 1 — DA1 heavy prototype-day audit

Audit the exact current source and runtime.

Required source audit:

- migrations and seeders;
- auth/showcase/MFA boundaries;
- role/department authorization;
- transaction lifecycle;
- correspondence;
- memoranda;
- HR/leave;
- legislative records;
- Calendar;
- Messages;
- Records;
- Dashboard/shared props;
- public portal;
- environment/runbooks;
- build scripts;
- browser QA carriers;
- stale route/navigation contracts;
- unbounded queries or obvious 5xx failure paths relevant to demo day.

Required runtime gates:

1. clean dependency install;
2. disposable PostgreSQL database;
3. `migrate:fresh --seed`;
4. seven curated persona verification;
5. TypeScript check;
6. production Vite build;
7. route cache;
8. view cache;
9. complete Feature suite;
10. V1 showcase browser QA;
11. mutation/write-path browser QA;
12. two-user prototype messaging QA;
13. pageerror/server-5xx capture;
14. desktop/mobile presentation checks.

Only observed failures become repair authority.

The public-tunnel/showcase-exposure concern is explicitly excluded from DA1 code-defect classification by Technical Authority.

## Phase 2 — DA1R bounded blocker repair

Open only if DA1 finds confirmed BLOCKER/HIGH product defects or validation-carrier failures.

Repair priority:

1. cannot boot / cannot seed / cannot log in;
2. core demo flow cannot complete;
3. 500/browser crash/asset failure;
4. wrong authorization or stale-state behavior;
5. deterministic presentation blocker;
6. validation carrier that prevents proving the current product.

Do not spend this phase on unrelated cleanup.

Every repaired defect gets:

- exact reproduction;
- exact repair commit;
- targeted regression proof;
- rerun of the failed gate.

After the last repair, rerun the complete DA1 gate.

## Phase 3 — RC1 main reconciliation

Create a temporary reconciliation branch from the final audited/repaired hardened authority.

Suggested temporary branch:

`KIRCH-TALIBON-RC1-MAIN-CONSOLIDATION`

Do not start RC1 until DA1/DA1R is green.

Reconciliation method:

1. snapshot exact pre-reconciliation `main`;
2. compare `main`-only commits/files against the audited product;
3. classify each main-only change:
   - RETAIN;
   - SUPERSEDED;
   - REJECT;
4. reconcile only RETAIN changes;
5. preserve hardened internal behavior, CAL1, BH1, and DA1 fixes;
6. do not wholesale replace the hardened tree with `main`.

Preferred Git topology:

- RC1 begins from the final audited hardened line;
- integrate pre-promotion `main` with a normal merge/reconciliation commit so `main` becomes an ancestor of the RC1 candidate;
- resolve conflicts explicitly;
- no squash/rebase reconstruction of accepted history;
- no force push.

This makes later `main` promotion a normal non-force ancestry-preserving operation.

## Phase 4 — RV1 exact reconciliation validation

Nothing is promoted until the exact RC1 candidate passes:

- clean dependency install;
- migrate/seed in disposable DB;
- all seven personas;
- TypeScript;
- production build;
- route/view/config cacheability where applicable;
- full Feature suite;
- V1 browser showcase;
- real mutation paths;
- two-user Messages;
- Calendar;
- public homepage;
- desktop/mobile critical surfaces;
- zero unexplained server 5xx/pageerror events;
- Technical Authority manual smoke on the presentation sequence.

Record the exact candidate SHA.

If any gate fails, return to bounded repair. Do not promote around a failure.

## Phase 5 — Main promotion

Promotion prerequisites:

- DA1 complete;
- all blocking repairs closed;
- RC1 reconciliation complete;
- RV1 exact candidate green;
- Technical Authority explicitly authorizes promotion;
- pre-promotion `main` tip preserved;
- current product closeout tips preserved.

Promotion requirements:

- no force push;
- no history rewrite;
- `main` must advance through an ordinary merge or fast-forward-compatible integration;
- verify remote `main` equals the accepted promotion result;
- rerun a post-promotion smoke gate against exact `main`.

After promotion, `main` becomes the sole continuing development/release branch.

## Phase 6 — Archival preservation

Before deleting branches, preserve branch-tip provenance.

At minimum preserve named tags for:

- pre-promotion `main@9cc1b50b...`;
- CAL1 `9dba054...`;
- BH1 closeout `27824223...`;
- final DA1 audit;
- final repair candidate if DA1R occurs;
- final RC1/RV1 promotion candidate;
- any branch tip not reachable from final `main` whose history must remain recoverable.

For maximum safety, generate an archival tag for every non-`main` branch tip before deletion.

Suggested namespace:

`archive/branch/<sanitized-branch-name>-<short-sha>`

Verify tags resolve before deleting branch refs.

## Phase 7 — Remote branch cleanup

Only after promotion and archival verification:

1. fetch current remote head inventory again;
2. ensure `main` is the repository default branch;
3. verify no open work is authorized on a non-`main` branch;
4. verify all non-main tips are reachable from final main or archival tags;
5. delete every remote branch except `main`;
6. fetch/prune;
7. re-enumerate refs;
8. require exactly one `refs/heads/*` result: `refs/heads/main`.

If any delete fails, stop and report it. Do not compensate with force updates.

## Phase 8 — Final prototype-day rehearsal

Run the presentation from final `main`, not from RC1/DA1/BH1.

Required rehearsal order:

1. clean/start runtime;
2. confirm seeded data;
3. enter Engineering;
4. transaction flow Engineering -> Budget -> Mayor -> Engineering;
5. memorandum publish/acknowledge;
6. legislative lookup;
7. HR leave flow;
8. denied access/audit proof if retained in presentation script;
9. Calendar;
10. Messages;
11. public homepage if part of the presentation;
12. mobile viewport check;
13. restart/recovery smoke.

## Stop conditions

Immediately stop promotion/cleanup if:

- final candidate has an unexplained test/build/browser failure;
- a main-only change is not understood;
- branch tips have not been preserved;
- final main cannot be proven to contain the accepted candidate;
- cleanup would require force push or destructive history rewrite.

## Definition of done

```text
Technical Authority: Kirch Ivan Balite
Product authority: main@<validated SHA>
Prototype-day audit: PASS
Core demo flows: PASS
Build/type/full Feature suite: PASS
Browser/mutation/messaging QA: PASS
Historical tips: archived
Remote branches: main only
Deployment source: main only
```
