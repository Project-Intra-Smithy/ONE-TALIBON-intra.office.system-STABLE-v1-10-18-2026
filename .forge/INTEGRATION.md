# ONE TALIBON V1 — CURRENT INTEGRATION POLICY

## Technical Authority

**Kirch Ivan Balite**

## Current integration state

There is no active reconciliation/integration branch.

The RC1 integration program is complete.

Sole continuing branch:

`main`

Exact RV1-validated and promoted product payload:

`f6208cf082c4b1d189c70728adfdb9ddf3225990`

The promotion was non-force and ancestry-preserving.

## Completed chain

- CAL1: completed / frozen;
- BH1: reviewed / closed;
- DA1 repair wave: closed with recorded limitations;
- RC1 reconciliation: completed;
- RV1 exact-candidate validation: completed;
- main promotion: completed;
- archival preservation: completed;
- non-main remote branch cleanup: completed.

## Current topology

```text
refs/heads/main
```

Historical branch tips remain under verified `archive/*` tags.

## New integration work

Any future product wave must begin from live `main` unless the Technical Authority explicitly authorizes another exact source.

Temporary branches are allowed only under a new bounded handoff.

Do not recreate historical RC1/DA1/UIUX branch names as implicit authority.

## Current transition

MP3 documentation/governance closeout is complete.

Current transition:

`MP4 — FINAL PROTOTYPE-DAY REHEARSAL FROM MAIN`

No application integration is implied by the MP3 documentation commits.

## Deployment boundary

Deployment remains unauthorized until a separate Technical Authority decision after rehearsal.

## Developer boundary

Developers / Contributors do not independently promote `main`, rewrite history, delete archival refs, or authorize deployment.

Those transitions require Kirch Ivan Balite as Technical Authority.
