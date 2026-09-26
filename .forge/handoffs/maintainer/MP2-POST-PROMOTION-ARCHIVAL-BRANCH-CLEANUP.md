# KIRION FORGE — ONE TALIBON V1

## MP2 — POST-PROMOTION ARCHIVAL + REMOTE BRANCH CLEANUP PLAN

Technical Authority:

**Kirch Ivan Balite**

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Planning authority snapshot:

- default branch: `main`;
- promoted main: `f6208cf082c4b1d189c70728adfdb9ddf3225990`;
- remote branches observed: **65**;
- non-main remote branches observed: **64**;
- open pull requests returned by the current GitHub search: **none**;
- deployment: **not authorized / not part of MP2**.

## Purpose

Preserve all recoverable branch-tip provenance, then remove obsolete remote branch refs so the repository reaches the consolidation target:

```text
refs/heads/main
```

This plan does not itself authorize deletion.

## Safety boundary

Execution must use the isolated Talibon QA checkout:

`D:\Dev\Talibon-DA1-Audit`

Do **not** repoint, reset, delete, prune, clean, or otherwise mutate:

`D:\Dev\Talibon-Intra-Office-Portal`

Expected GitHub remote:

`https://github.com/Kirch-Nairu/Talibon-Sales-Prototype.git`

The isolated checkout uses remote name `sales`. Do not assume `origin`.

No force push, reset, rebase, squash, or history rewrite is authorized.

## MP2 strategy

Use a two-layer archive before deleting any remote head.

### Layer A — milestone tags

Create explicit stable milestone tags for the authority chain:

- `archive/milestone/pre-promotion-main-9cc1b50b2876` -> `9cc1b50b28762402c3b24a721cd5ba7ae961817c`;
- `archive/milestone/cal1-9dba054d3437` -> `9dba054d34377ce76149d8474ddeb66b5c20130e`;
- `archive/milestone/bh1-27824223d516` -> `27824223d5169c8eadf16ab863d09aab9585db9c`;
- `archive/milestone/da1-reviewed-repair-f48fb9381fee` -> `f48fb9381fee81490f43635ff289cce67ff7779b`;
- `archive/milestone/da1-h1-final-9fa1ec1a00be` -> `9fa1ec1a00be72984db651c5b251b36183444d64`;
- `archive/milestone/da1-closeout-2410bb739993` -> `2410bb739993366bdb0e214754343011cc0bed7a`;
- `archive/milestone/rc1-promoted-f6208cf082c4` -> `f6208cf082c4b1d189c70728adfdb9ddf3225990`;
- `archive/governance/rv1-post-promotion-<short-sha>` -> the **live execution-time tip** of `KIRCH-TALIBON-RV1-RELEASE-VALIDATION`.

The RV1 governance tag is mandatory because post-promotion evidence/governance commits are intentionally not part of the exact validated RC1 product commit on `main`. The planning branch itself advances while this MP2 plan/SSOT are written, so its row in the snapshot below is historical planning input only. At execution, tag the freshly fetched live RV1 tip before deletion.

### Layer B — one archival tag for every non-main branch tip

For every current non-main remote branch, create an annotated tag:

`archive/branch/<sanitized-branch-name>-<12-char-tip-sha>`

A branch is not eligible for deletion until its generated archival tag resolves to the exact same commit as the **fresh execution-time branch inventory**. The table below is the planning snapshot; execution must regenerate it before any tag or delete operation.

## Current branch-tip inventory

Main is excluded from cleanup.

| Remote branch | Observed tip | Required archive tag |
|---|---|---|
| `KIRCH-SELFHOST-VALIDATE-9CC1B50` | `d3b7eef9d3d1e58b81100f7baba88c50cfb0624f` | `archive/branch/KIRCH-SELFHOST-VALIDATE-9CC1B50-d3b7eef9d3d1` |
| `KIRCH-SELFHOST-VALIDATE-HOMEPAGE-PRESENTATION` | `0ec7a16a8f147d9da628ca7b55837b70286ab181` | `archive/branch/KIRCH-SELFHOST-VALIDATE-HOMEPAGE-PRESENTATION-0ec7a16a8f14` |
| `KIRCH-SELFHOST-VALIDATE-HOMEPAGE-RUNTIME-REPAIR` | `37cc69e03722561f38c756d792e35d031f962dbd` | `archive/branch/KIRCH-SELFHOST-VALIDATE-HOMEPAGE-RUNTIME-REPAIR-37cc69e03722` |
| `KIRCH-SELFHOST-VALIDATE-HOMEPAGE-RUNTIME-REPAIR-V2` | `c5acdf6743eae420ab1f471b87324fc2342368c1` | `archive/branch/KIRCH-SELFHOST-VALIDATE-HOMEPAGE-RUNTIME-REPAIR-V2-c5acdf6743ea` |
| `KIRCH-SELFHOST-VALIDATE-HOMEPAGE-TARGET-POLISH` | `178b275aed684e2bc094147ab5cfb13fed154fb2` | `archive/branch/KIRCH-SELFHOST-VALIDATE-HOMEPAGE-TARGET-POLISH-178b275aed68` |
| `KIRCH-TALIBON-ACCOUNT-TRANSFER-2026-09-21` | `2deef076d932f86deed69c2c9b666435adeed71f` | `archive/branch/KIRCH-TALIBON-ACCOUNT-TRANSFER-2026-09-21-2deef076d932` |
| `KIRCH-TALIBON-BH1-BACKEND-RUNTIME-HARDENING` | `27824223d5169c8eadf16ab863d09aab9585db9c` | `archive/branch/KIRCH-TALIBON-BH1-BACKEND-RUNTIME-HARDENING-27824223d516` |
| `KIRCH-TALIBON-CAL1-CALENDAR-WORKSPACE` | `9dba054d34377ce76149d8474ddeb66b5c20130e` | `archive/branch/KIRCH-TALIBON-CAL1-CALENDAR-WORKSPACE-9dba054d3437` |
| `KIRCH-TALIBON-DA1-H1-CARRIER-NAVIGATION-REPAIR` | `9fa1ec1a00be72984db651c5b251b36183444d64` | `archive/branch/KIRCH-TALIBON-DA1-H1-CARRIER-NAVIGATION-REPAIR-9fa1ec1a00be` |
| `KIRCH-TALIBON-DA1-PROTOTYPE-DAY-BLOCKER-AUDIT` | `2410bb739993366bdb0e214754343011cc0bed7a` | `archive/branch/KIRCH-TALIBON-DA1-PROTOTYPE-DAY-BLOCKER-AUDIT-2410bb739993` |
| `KIRCH-TALIBON-GOVERNANCE-AUTHORITY-RECONCILIATION-2026-09-21` | `10c4a73f38bfb5328fcb25f74b40441446d22bff` | `archive/branch/KIRCH-TALIBON-GOVERNANCE-AUTHORITY-RECONCILIATION-2026-09-21-10c4a73f38bf` |
| `KIRCH-TALIBON-INTRA-HOMEPAGE-IDENTITY-FOUNDATION` | `5f93a880e3cab1869b6a87fbd7dc3c7b9f11f24d` | `archive/branch/KIRCH-TALIBON-INTRA-HOMEPAGE-IDENTITY-FOUNDATION-5f93a880e3ca` |
| `KIRCH-TALIBON-INTRA-OFFICE-HOMEPAGE-GREEN-REDESIGN` | `568ceaf11cd22927437fc83831c9b91301f13bd7` | `archive/branch/KIRCH-TALIBON-INTRA-OFFICE-HOMEPAGE-GREEN-REDESIGN-568ceaf11cd2` |
| `KIRCH-TALIBON-INTRA-OFFICE-LOGIN-GREEN-REDESIGN` | `c03d6c57488126da8b0a064616f6e9d4f26c2bd2` | `archive/branch/KIRCH-TALIBON-INTRA-OFFICE-LOGIN-GREEN-REDESIGN-c03d6c574881` |
| `KIRCH-TALIBON-INTRA-OFFICE-M1-MESSAGES-WORKSPACE` | `99401a80be020f2c4c8146e6ed0a8d7f1227d8b7` | `archive/branch/KIRCH-TALIBON-INTRA-OFFICE-M1-MESSAGES-WORKSPACE-99401a80be02` |
| `KIRCH-TALIBON-INTRA-OFFICE-WORKSPACE-GREEN-FOUNDATION` | `066f5945975a1911c2d38ca5ef7adfc3a51f1d2d` | `archive/branch/KIRCH-TALIBON-INTRA-OFFICE-WORKSPACE-GREEN-FOUNDATION-066f5945975a` |
| `KIRCH-TALIBON-ME0-MESSAGING-ENGINE-ARCHITECTURE-FREEZE` | `aa11c57a3614eb1548c96089ab3860d656713a75` | `archive/branch/KIRCH-TALIBON-ME0-MESSAGING-ENGINE-ARCHITECTURE-FREEZE-aa11c57a3614` |
| `KIRCH-TALIBON-MP0-CI-VERIFICATION` | `abb7dcfabbebf5ecdab005b34685310a4a243573` | `archive/branch/KIRCH-TALIBON-MP0-CI-VERIFICATION-abb7dcfabbeb` |
| `KIRCH-TALIBON-MP0-MESSAGING-RUNTIME-UI-REWORK` | `01231a7ef39c4b68400816ba9f07e815067f46e9` | `archive/branch/KIRCH-TALIBON-MP0-MESSAGING-RUNTIME-UI-REWORK-01231a7ef39c` |
| `KIRCH-TALIBON-MP0-PROTOTYPE-MESSAGING-BRIDGE` | `70945b6506edf3e32af2bd24dfc5fb312edf71ee` | `archive/branch/KIRCH-TALIBON-MP0-PROTOTYPE-MESSAGING-BRIDGE-70945b6506ed` |
| `KIRCH-TALIBON-MP0-SELFHOST-VALIDATION` | `204de4b46e69a571b58b071377231661c5c4be59` | `archive/branch/KIRCH-TALIBON-MP0-SELFHOST-VALIDATION-204de4b46e69` |
| `KIRCH-TALIBON-RC1-MAIN-CONSOLIDATION` | `f6208cf082c4b1d189c70728adfdb9ddf3225990` | `archive/branch/KIRCH-TALIBON-RC1-MAIN-CONSOLIDATION-f6208cf082c4` |
| `KIRCH-TALIBON-RV1-RELEASE-VALIDATION` | `7d1d568cb56f0432c06eeecd7db55403e5dffbcd` | `archive/branch/KIRCH-TALIBON-RV1-RELEASE-VALIDATION-7d1d568cb56f` |
| `KIRCH-TALIBON-SALES-V1` | `fdb7f5a272bad3c0f3efc352951a9746c544012a` | `archive/branch/KIRCH-TALIBON-SALES-V1-fdb7f5a272ba` |
| `KIRCH-TALIBON-UIUX-SPRINT-LANE-A-W03-W04` | `eb985fe5da8f2f7c63c987680a22583f2067b85b` | `archive/branch/KIRCH-TALIBON-UIUX-SPRINT-LANE-A-W03-W04-eb985fe5da8f` |
| `KIRCH-TALIBON-UIUX-SPRINT-LANE-B-W05-W06-W07` | `af417bab384ad066814ba32145be83c00396ff69` | `archive/branch/KIRCH-TALIBON-UIUX-SPRINT-LANE-B-W05-W06-W07-af417bab384a` |
| `KIRCH-TALIBON-UIUX-W01-SHELL-DENSITY` | `fa9fadf137c200081f2b96c2b87ca7dd4137aa2d` | `archive/branch/KIRCH-TALIBON-UIUX-W01-SHELL-DENSITY-fa9fadf137c2` |
| `KIRCH-TALIBON-UIUX-W01-SHELL-DENSITY-REWORK` | `8bcdb18441e3cdc071a96921ac29616d9391052c` | `archive/branch/KIRCH-TALIBON-UIUX-W01-SHELL-DENSITY-REWORK-8bcdb18441e3` |
| `KIRCH-TALIBON-UIUX-W02-DASHBOARD-HIERARCHY` | `cac9cef03354eb58d66a24809c9f702c0d78af51` | `archive/branch/KIRCH-TALIBON-UIUX-W02-DASHBOARD-HIERARCHY-cac9cef03354` |
| `KIRCH-TALIBON-UIUX-W02-DASHBOARD-HIERARCHY-REWORK` | `3a5fc4768f6ae786fc38a2beb433d1a9fae159b4` | `archive/branch/KIRCH-TALIBON-UIUX-W02-DASHBOARD-HIERARCHY-REWORK-3a5fc4768f6a` |
| `KIRCH-TALIBON-UIUX-W-VALIDATE-9CC1B50` | `9cc1b50b28762402c3b24a721cd5ba7ae961817c` | `archive/branch/KIRCH-TALIBON-UIUX-W-VALIDATE-9CC1B50-9cc1b50b2876` |
| `KIRCH-TALIBON-V1-C1-BOUNDED-PANELS` | `c43518932739283b12ed22b6283ba4edab248e25` | `archive/branch/KIRCH-TALIBON-V1-C1-BOUNDED-PANELS-c43518932739` |
| `KIRCH-TALIBON-V1-C2-DEPARTMENTS` | `95ad8fc315018ff4539fcbd8336b87cc00b9a0dd` | `archive/branch/KIRCH-TALIBON-V1-C2-DEPARTMENTS-95ad8fc31501` |
| `KIRCH-TALIBON-V1-C2-MAIN-PROMOTION` | `ba29610849c46e0100aba8264854158cd6a81bc5` | `archive/branch/KIRCH-TALIBON-V1-C2-MAIN-PROMOTION-ba29610849c4` |
| `KIRCH-TALIBON-V1-C3-LEGISLATIVE-UX` | `cf39528180262241c7d1fe3bbcd68d2b5ce14444` | `archive/branch/KIRCH-TALIBON-V1-C3-LEGISLATIVE-UX-cf3952818026` |
| `KIRCH-TALIBON-V1-C4-LOCAL-SPECIAL-BODIES` | `cf39528180262241c7d1fe3bbcd68d2b5ce14444` | `archive/branch/KIRCH-TALIBON-V1-C4-LOCAL-SPECIAL-BODIES-cf3952818026` |
| `KIRCH-TALIBON-V1-DIRECT-RELEASE-STABILIZATION` | `c1dbb9de6cd4873a232bb65584080e972e1a3162` | `archive/branch/KIRCH-TALIBON-V1-DIRECT-RELEASE-STABILIZATION-c1dbb9de6cd4` |
| `KIRCH-TALIBON-V1-DIRECT-UX-RECOVERY-V2-INTEGRATED` | `651acb1e31d93555be361e6b8193048292b34ad6` | `archive/branch/KIRCH-TALIBON-V1-DIRECT-UX-RECOVERY-V2-INTEGRATED-651acb1e31d9` |
| `KIRCH-TALIBON-V1-DIRECT-UX-RECOVERY-V2` | `d384ceed4e8cda86551c78b2943dffb49431c5c8` | `archive/branch/KIRCH-TALIBON-V1-DIRECT-UX-RECOVERY-V2-d384ceed4e8c` |
| `KIRCH-TALIBON-V1-EXPEDITED-DEPLOYMENT` | `804bdbfe242846c0423e528bd10ed52b911eaa7e` | `archive/branch/KIRCH-TALIBON-V1-EXPEDITED-DEPLOYMENT-804bdbfe2428` |
| `KIRCH-TALIBON-V1-SHOWCASE-ACCESS` | `0913a37f96affd2c2a681697bdf6fdb6c381a99e` | `archive/branch/KIRCH-TALIBON-V1-SHOWCASE-ACCESS-0913a37f96af` |
| `KIRCH-TALIBON-V1-UIUX-CORRECTION` | `d03e90c3b7a675670ecbe94414593558b7f78be8` | `archive/branch/KIRCH-TALIBON-V1-UIUX-CORRECTION-d03e90c3b7a6` |
| `KIRCH-TALIBON-V1-UIUX-CORRECTION-REVIEW-EVIDENCE` | `8f69c51d4dbaebe2821f83227f7c81a7edf637ce` | `archive/branch/KIRCH-TALIBON-V1-UIUX-CORRECTION-REVIEW-EVIDENCE-8f69c51d4dba` |
| `KIRCH-TALIBON-V1-UIUX-CORRECTION-REVIEW-RECORD-TEMP` | `8f69c51d4dbaebe2821f83227f7c81a7edf637ce` | `archive/branch/KIRCH-TALIBON-V1-UIUX-CORRECTION-REVIEW-RECORD-TEMP-8f69c51d4dba` |
| `KIRCH-TALIBON-V1-UX-POLISH-V3` | `6982e7d93050ce0c940f81dbfba83ef61a6d2d1b` | `archive/branch/KIRCH-TALIBON-V1-UX-POLISH-V3-6982e7d93050` |
| `KIRCH-TALIBON-V1-UX-YOLO-A-SHELL` | `bda5d8e5d07cb70a44f66c6706c4ce3aa38d0732` | `archive/branch/KIRCH-TALIBON-V1-UX-YOLO-A-SHELL-bda5d8e5d07c` |
| `KIRCH-TALIBON-V1-UX-YOLO-B-OPERATIONS` | `cc1f3f9b699eaae0c0eeb1743cba80adb0dca69a` | `archive/branch/KIRCH-TALIBON-V1-UX-YOLO-B-OPERATIONS-cc1f3f9b699e` |
| `KIRCH-TALIBON-V1-W01-SHELL-NAV` | `f6b086a28152a2e78b8ed70ac9e7af6e40cf0366` | `archive/branch/KIRCH-TALIBON-V1-W01-SHELL-NAV-f6b086a28152` |
| `KIRCH-TALIBON-V1-W02-DASHBOARD` | `18ac57b6e11724f189a9e767c24a1ceb7ed11602` | `archive/branch/KIRCH-TALIBON-V1-W02-DASHBOARD-18ac57b6e117` |
| `KIRCH-TALIBON-V1-W03-PLANS` | `f24663350a24f32271833a262442a7bebc86fb7e` | `archive/branch/KIRCH-TALIBON-V1-W03-PLANS-f24663350a24` |
| `KIRCH-TALIBON-V1-W04-PPAS` | `559fe8aca400bed13d602494cc47e7b4647b5ae5` | `archive/branch/KIRCH-TALIBON-V1-W04-PPAS-559fe8aca400` |
| `KIRCH-TALIBON-V1-W05-PROJECTS` | `6279c3027a1e23f8419f0c6be903213ac8abbe44` | `archive/branch/KIRCH-TALIBON-V1-W05-PROJECTS-6279c3027a1e` |
| `KIRCH-TALIBON-V1-W06-DEPARTMENTS` | `94d1c07330f0197d7176876c1204de98c4b45aa4` | `archive/branch/KIRCH-TALIBON-V1-W06-DEPARTMENTS-94d1c07330f0` |
| `KIRCH-TALIBON-V1-W07-LEGISLATIVE-LSB` | `67d374e3b5a876b81e659e90541c07ec6eb34aba` | `archive/branch/KIRCH-TALIBON-V1-W07-LEGISLATIVE-LSB-67d374e3b5a8` |
| `KIRCH-TALIBON-V1-W08-FORGE-QUALITY-ASSURANCE` | `5bbfd48611b3f65e279048faa0fa1d246ba89789` | `archive/branch/KIRCH-TALIBON-V1-W08-FORGE-QUALITY-ASSURANCE-5bbfd48611b3` |
| `KIRCH-TALIBON-V1-W08-QA-GOVERNANCE` | `39f68b778d136aadf2113ccfe5531d7a346eda37` | `archive/branch/KIRCH-TALIBON-V1-W08-QA-GOVERNANCE-39f68b778d13` |
| `KIRCH-TALIBON-V1-W08-W06-MESSAGES-A11Y-REWORK` | `7af2a0b2162f8359df8b3061f60042c3446e86e3` | `archive/branch/KIRCH-TALIBON-V1-W08-W06-MESSAGES-A11Y-REWORK-7af2a0b2162f` |
| `KIRCH-TALIBON-V1-W08-WORK-CALENDAR-MEETINGS` | `ced265cf9360fcbefa99e216d5ad8afae2037a81` | `archive/branch/KIRCH-TALIBON-V1-W08-WORK-CALENDAR-MEETINGS-ced265cf9360` |
| `KIRCH-TALIBON-V1-W09-MESSAGES-ANNOUNCEMENTS` | `3470d86e44a9101fff064a7b15b77e677a5c7a8c` | `archive/branch/KIRCH-TALIBON-V1-W09-MESSAGES-ANNOUNCEMENTS-3470d86e44a9` |
| `KIRCH-TALIBON-V1-W10-RECORDS-CORRESPONDENCE` | `d2cac5e34b7f46a754c52c9a18d702aac8904b65` | `archive/branch/KIRCH-TALIBON-V1-W10-RECORDS-CORRESPONDENCE-d2cac5e34b7f` |
| `KIRCH-TALIBON-V1-W11-MUNICIPAL-SYSTEMS` | `36d5640242a09d4e426fd18c6f95e30abce5d14c` | `archive/branch/KIRCH-TALIBON-V1-W11-MUNICIPAL-SYSTEMS-36d5640242a0` |
| `KIRCH-TALIBON-V1-W12-RESPONSIVE-POLISH` | `59be90cf254f12feaf660ac7025133dbac14ad78` | `archive/branch/KIRCH-TALIBON-V1-W12-RESPONSIVE-POLISH-59be90cf254f` |
| `UI/Jr-and-Aj` | `109fa0424a56872303ab3eeb4f659b2fc7651b69` | `archive/branch/UI-Jr-and-Aj-109fa0424a56` |
| `masterlogin-UI-by-Jr-and-Aj` | `d673925233b6728794d302650d026d3d758227b9` | `archive/branch/masterlogin-UI-by-Jr-and-Aj-d673925233b6` |

## Duplicate branch-tip observations

- `cf39528180262241c7d1fe3bbcd68d2b5ce14444`: `KIRCH-TALIBON-V1-C3-LEGISLATIVE-UX`, `KIRCH-TALIBON-V1-C4-LOCAL-SPECIAL-BODIES`
- `8f69c51d4dbaebe2821f83227f7c81a7edf637ce`: `KIRCH-TALIBON-V1-UIUX-CORRECTION-REVIEW-EVIDENCE`, `KIRCH-TALIBON-V1-UIUX-CORRECTION-REVIEW-RECORD-TEMP`

Duplicate tips do not reduce the safety requirement. Each branch name still receives its own archive tag so branch-name provenance is retained.

## Execution gates

### Gate MP2-A — remote identity / main authority

Before creating tags:

1. verify current directory is exactly the isolated checkout;
2. verify remote `sales` URL is the Talibon Sales Prototype repository;
3. `git fetch sales --prune --tags`;
4. require `sales/main` to resolve exactly to `f6208cf082c4b1d189c70728adfdb9ddf3225990`;
5. verify GitHub default branch is still `main`;
6. refresh remote branch inventory;
7. regenerate the execution inventory unconditionally before tagging; any unexpected movement outside the MP2 governance branch is a STOP condition until classified.

### Gate MP2-B — archive creation

1. create all mandatory milestone tags;
2. create one annotated `archive/branch/*` tag per non-main remote branch from the freshly regenerated execution inventory;
3. refuse to overwrite any existing tag;
4. if a requested tag already exists, require it to resolve to the expected commit;
5. push tags without force.

### Gate MP2-C — archive verification

After tag push:

1. fetch tags from `sales`;
2. resolve every archival tag with `git rev-parse <tag>^{}`;
3. require each resolved commit to equal the snapshotted branch tip;
4. require all mandatory milestone aliases to resolve correctly;
5. retain a local machine-readable manifest for the cleanup run.

Any mismatch stops cleanup.

### Gate MP2-D — final deletion authorization

Branch deletion remains destructive and requires a separate explicit Technical Authority instruction after MP2-C passes.

Suggested exact authority phrase:

`DELETE ARCHIVED REMOTE BRANCHES`

Do not interpret this planning request as deletion authority.

### Gate MP2-E — remote cleanup

After explicit deletion authority:

1. refresh `sales` heads once more;
2. require no newly authorized non-main work;
3. delete non-main remote branches only;
4. never delete `main`;
5. delete in bounded batches;
6. after every batch, fetch/prune;
7. stop on any failed deletion;
8. do not use force to compensate.

### Gate MP2-F — final proof

Require:

- GitHub default branch: `main`;
- `sales/main@f6208cf082c4b1d189c70728adfdb9ddf3225990`;
- `git ls-remote --heads sales` returns exactly one head;
- that head is `refs/heads/main`;
- all archival tags remain resolvable;
- no deployment occurred.

Expected end state:

```text
remote heads: main only
main: f6208cf082c4b1d189c70728adfdb9ddf3225990
historical tips: preserved by tags
deployment: not performed
```

## Local branches / worktrees

MP2 concerns remote GitHub branches.

Do not delete or rewrite the primary workstation checkout.

Local stale branches and the isolated audit worktree are a separate cleanup operation after remote cleanup evidence is recorded.

## Post-cleanup transition

After MP2-F:

1. record branch-cleanup evidence on an archival governance ref or external durable record;
2. treat `main` as sole continuing product/release branch;
3. move separately to prototype-day rehearsal from exact `main`;
4. deployment remains a separate explicit authority transition.

## Stop conditions

STOP if:

- `main` moved;
- a non-main tip moved since inventory capture;
- any tag already exists at a different commit;
- any archive tag fails verification;
- a new open PR or authorized branch appears;
- remote identity is not exact;
- cleanup would require force;
- deletion would affect `main`;
- the operation touches the primary workstation checkout.
