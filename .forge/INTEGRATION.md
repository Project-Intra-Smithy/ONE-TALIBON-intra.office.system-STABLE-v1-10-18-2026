# ONE TALIBON V1 — CURRENT INTEGRATION POLICY

## Technical Authority

**Kirch Ivan Balite**

## Current integration state

The historical RC1 integration program is complete.

Accepted product branch:

`main`

Observed MP5 source baseline:

`615529ce6663933dd3eeee4d504d14d1f21b626d`

Active MP5 coordination branch:

`KIRCH-TALIBON-MP5-POST-DAT-FRONTEND-CORRECTION`

No MP5 product candidate is integrated yet. Writer branches remain candidates until independent Review/Acceptance and explicit integration authority.

Maximum concurrent Code Writers: **2**.

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

MP3 closeout and MP4 field rehearsal are complete.

Current transition:

`MP5 — POST-DAT FRONTEND CORRECTION`

Batch 1 W01/W02 are designed as non-overlapping candidates. Integration order will be chosen from reviewed evidence; writers must not merge each other or the coordination branch.

Any shared-file or semantic collision stops parallel treatment and returns to Maintainer.

## Deployment boundary

Deployment remains unauthorized until a separate Technical Authority decision after MP5 acceptance/promotion.

## Developer boundary

Developers / Contributors do not independently promote `main`, rewrite history, delete archival refs, or authorize deployment.

Those transitions require Kirch Ivan Balite as Technical Authority.
