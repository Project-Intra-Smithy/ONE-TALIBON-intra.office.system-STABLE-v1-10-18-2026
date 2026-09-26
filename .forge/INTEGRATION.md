# ONE TALIBON V1 — CURRENT INTEGRATION POLICY

## Technical Authority

**Kirch Ivan Balite**

## Current integration state

The prior UI/UX correction integration branch is historical context.

Current hardened product authority:

`KIRCH-TALIBON-BH1-BACKEND-RUNTIME-HARDENING@27824223d5169c8eadf16ab863d09aab9585db9c`

Current DA1 reviewed repair integration:

`KIRCH-TALIBON-DA1-PROTOTYPE-DAY-BLOCKER-AUDIT@f48fb9381fee81490f43635ff289cce67ff7779b`

DA1 disposition:

`CLOSED — SUITABLE WITH RECORDED LIMITATIONS`

Current promoted `main`:

`f6208cf082c4b1d189c70728adfdb9ddf3225990`

## Next integration target

The next integration is a bounded reconciliation into a temporary RC1 candidate after the reviewed DA1 repair-wave closeout.

Suggested temporary branch:

`KIRCH-TALIBON-RC1-MAIN-CONSOLIDATION`

RC1 must begin from the final DA1 closeout coordination authority containing the reviewed integration and closeout governance.

## Main reconciliation rules

1. inventory `main`-only changes;
2. classify them RETAIN / SUPERSEDED / REJECT;
3. integrate only intentional retained work;
4. preserve CAL1, BH1, and DA1 behavior;
5. use normal ancestry-preserving Git;
6. no force push;
7. no squash/rebase reconstruction of accepted product history;
8. validate the exact RC1 candidate before main promotion.

The currently observed effective main-only product diff is bounded to public-portal files. That observation must be reverified immediately before RC1.

## Promotion prerequisites

Before `main` may move:

- DA1 complete;
- confirmed blockers repaired;
- RC1 complete;
- exact RC1 candidate passes full release/browser/mutation validation;
- pre-promotion main tip preserved;
- Technical Authority authorizes promotion.

## Main promotion

Promotion must be non-force.

The preferred topology makes current `main` an ancestor of the validated RC1 candidate before promotion.

After promotion:

- verify remote `main` exact SHA;
- rerun smoke validation on exact `main`;
- declare `main` the sole continuing branch only after that proof.

## Branch cleanup

Branch deletion is a post-promotion operation.

Before deletion:

- refresh remote branch inventory;
- preserve required tips with archival tags;
- verify tags;
- verify final main authority;
- delete every non-main branch;
- re-enumerate refs and require only `refs/heads/main`.

## Developer boundary

Developers / Contributors do not independently promote `main`, delete remote branches, rewrite history, or authorize deployment.

Those transitions require Kirch Ivan Balite as Technical Authority.


## MP1 main promotion

Technical Authority explicitly authorized main promotion.

Observed post-promotion authority:

`main@f6208cf082c4b1d189c70728adfdb9ddf3225990`

Promotion was non-force and ancestry-preserving.

Post-promotion comparison with the exact RC1 branch was identical: 0 ahead / 0 behind.

Deployment remains unauthorized.

Branch cleanup remains a separate post-promotion transition.
