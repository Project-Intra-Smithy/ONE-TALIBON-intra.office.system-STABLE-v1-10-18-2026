# ONE TALIBON V1 — MP5 POST-DAT FRONTEND CORRECTION PLAN

## Authority

Technical Authority: **Kirch Ivan Balite**

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Forge authority:

`Kirch-Nairu/KIRION-FORGE@44eb57e5b45b343be0033bf22a7a5e74d543c01a`

Observed MP5 source baseline:

`main@615529ce6663933dd3eeee4d504d14d1f21b626d`

Coordination branch:

`KIRCH-TALIBON-MP5-POST-DAT-FRONTEND-CORRECTION`

This program is authorized as a bounded post-DAT frontend correction wave. It is not a backend hardening restart, DA1 replay, release acceptance, deployment authorization, UAT claim, or production claim.

## Why MP5 exists

The MP4 Developer Acceptance Test exercised the current prototype from live `main` and found that the system is broadly usable but still carries several frontend clarity and density problems.

The correction target is deliberately narrow:

- fix the repeated transaction-notification toast behavior observed during normal navigation;
- reduce oversized first-frame presentation on Department Workspace and Employee Directory;
- make selected municipal reference surfaces easier to understand and scan;
- improve presentation language without changing backend/domain authority;
- preserve the working Messages experience and the current runtime/performance improvements;
- verify, rather than assume, any Calendar/Meetings relationship before authorizing a repair.

The governing design rule is:

> Preserve the same municipal system and contracts; reduce cognitive cost, wasted space, repeated noise, and unclear presentation.

## DAT finding classes

MP5 must preserve the distinction between:

### Confirmed behavioral defect

- repeated transaction approval notification/toast across unrelated navigation.

### Information-architecture / terminology confusion

- Employee Directory;
- Legislative Records;
- Local Special Bodies;
- Municipal Systems;
- later-batch Work Queue / Correspondence / Memoranda terminology.

### Density / information-hierarchy issues

- Department Workspace first frame;
- Employee Directory summary metrics;
- Local Special Bodies cards;
- Municipal Systems cards;
- transaction create/detail;
- Announcements / Memoranda.

### Needs verification before repair

- Calendar versus Meetings projection/relationship.

### Protected working areas

- Messages;
- accepted authorization/workflow behavior;
- accepted BH1/DA1/RC1/RV1 product behavior;
- current runtime improvements.

## Program constraints

1. **Maximum two Code Writers may be active at the same time.**
2. Parallel writers must have explicit non-overlapping file and behavior ownership.
3. Shared infrastructure is not "free-for-all" territory. If both lanes need the same shared file or contract, stop and return to Maintainer.
4. Writers do not merge, integrate, accept, promote, deploy, reset, rebase, or force-push.
5. No writer may reopen BH1, DA1, or historical UI/UX programs as implicit authority.
6. No backend authorization widening.
7. No schema/migration work unless a later explicit Maintainer handoff authorizes it.
8. No domain-model rename merely to improve user-facing labels.
9. No redesign of Messages.
10. No broad PageFrame/PageHeader rewrite. The repository already contains an accepted shared density foundation; MP5 should reuse it.
11. No fabricated runtime/browser evidence. Unrun checks remain `NOT RUN` / `NOT OBSERVED`.
12. Deployment remains separate.

## Execution model

MP5 runs in bounded batches. At most two implementation lanes are active.

### Batch 1 — immediate DAT correction

Two writers may run in parallel from the exact same prepared MP5 source baseline.

#### W01 — Notification Delivery Lifecycle Repair

Purpose:

Stop historical/recent transaction feed items from being re-presented as a new toast during ordinary page navigation while preserving truly new notification delivery.

Primary surface:

- authenticated shell notification lifecycle.

This is behavioral repair, not a visual redesign.

#### W02 — Organization & Reference Density / Terminology

Purpose:

Apply the minimal DAT-driven correction to:

- Department Workspace;
- Employee Directory;
- Legislative Records;
- Local Special Bodies;
- Municipal Systems.

Required direction:

- compact oversized metrics and cards;
- make directory/reference content dominate the frame;
- clarify user-facing terminology;
- keep official municipal/domain terminology available in descriptive copy where useful;
- preserve routes, data sources, authorization, and record semantics.

Batch 1 lanes must remain file-isolated.

## Batch 1 ownership strategy

### W01 owns

- `resources/js/layouts/AppLayout.tsx`;
- a new narrowly scoped notification helper under `resources/js/**` if needed;
- focused notification browser/test evidence files if added.

W01 does **not** own navigation vocabulary or any MP5 page-density surface.

### W02 owns

- `resources/js/pages/Departments/Workspace.tsx`;
- `resources/js/pages/Employees/Index.tsx`;
- `resources/js/pages/Legislation/Index.tsx`;
- `resources/js/pages/LocalBodies/Index.tsx`;
- `resources/js/pages/MunicipalSystems/Index.tsx`;
- relevant existing components under:
  - `resources/js/components/local-bodies/**`;
  - `resources/js/components/municipal-systems/**`;
- `resources/js/navigation/navigationDestinations.ts` only for the four affected reference-surface presentation labels;
- `tests/Feature/CurrentPortalNavigationTest.php` only if label expectations require correction;
- focused tests directly required by this lane.

W02 does **not** own `AppLayout.tsx`, notification state, shared shell behavior, Transactions, Correspondence, Announcements, Memoranda, Calendar, Meetings, or backend authorization.

## W02 presentation decisions

The following user-facing direction is closed for this batch:

- **Employee Directory → Staff Directory**
- **Legislative Records → Ordinances & Issuances**
- **Local Special Bodies → Councils, Boards & Committees**
- **Municipal Systems → Systems Directory**

These are presentation labels. Routes and backend/domain identifiers remain unchanged.

Where legal/municipal terminology matters, retain it in explanatory copy. Example: the Councils, Boards & Committees page may state that these are the municipality's formal local special bodies.

Department Workspace keeps its domain name, but its first-frame layout should stop treating every metric as a large equal-weight card.

## W02 density contract

### Department Workspace

Current source renders multiple large attention/flow metric cards before core workload content.

Correct direction:

- compress attention and office-flow metrics into a denser status strip / compact grid;
- zero-value metrics should not dominate the screen;
- keep warning emphasis only when attention counts are nonzero;
- move useful workload/action content higher in the first frame;
- preserve existing links, metric values, statuses, role scope, and server-owned data.

### Staff Directory

Current source renders three large summary cards before the actual directory.

Correct direction:

- turn summary counts into a compact band/strip;
- keep search/filter/results as the primary surface;
- preserve work-context-only privacy wording;
- preserve employee detail routes and server pagination/data contract.

### Ordinances & Issuances

Current layout is already comparatively strong.

Correct direction:

- change presentation title/description only where it improves comprehension;
- preserve register density, filters, pagination behavior, record type semantics, actions, and routes;
- do not redesign the whole page.

### Councils, Boards & Committees

Correct direction:

- make the page read like a reference directory rather than a card gallery;
- reduce card height/padding and repeated visual chrome;
- keep mandate, chair, membership, next meeting, recent action, and related documents available;
- preserve the underlying local-special-body data.

### Systems Directory

Correct direction:

- make this obviously an internal systems directory;
- compress four status counters;
- make system identity, owning office, operating status, record scope, and integration context easier to scan;
- avoid oversized cards;
- preserve existing filters and source data.

## Batch 1 validation

Select the smallest gates that answer the actual change risk.

Both writers must run, where available:

- `npm run types:check`;
- `npm run build`;
- focused affected Feature tests when PHP expectations change or navigation labels are asserted;
- exact diff/ownership inspection.

### W01 additionally requires

A focused runtime/browser scenario proving:

1. establish a transaction notification already present in the feed;
2. navigate across multiple unrelated portal pages;
3. the same notification does not repeatedly toast;
4. bell/history visibility remains correct;
5. a genuinely new transaction notification still produces a live alert;
6. no duplicate replay appears after ordinary Inertia navigation;
7. any reload/workspace-switch behavior changed by the implementation is explicitly recorded.

If runtime/browser execution is unavailable, W01 must report that evidence as `NOT RUN`; source/build success may not be upgraded to runtime proof.

### W02 additionally requires

Visual/browser checks on the affected pages at minimum:

- desktop around 1366×768 or 1280×800;
- one narrow/mobile viewport if touched layout is responsive;
- light and dark when changed classes affect theme behavior.

The purpose is to verify first-frame density, scanability, no horizontal overflow, and no hidden actions—not to run the historical full browser carrier.

## Review and integration after Batch 1

W01 and W02 return separate candidates.

Maintainer then:

1. verifies exact branch/SHA lineage;
2. verifies ownership;
3. evaluates exact-SHA checks;
4. issues independent Reviewer handoffs;
5. routes bounded rework if needed;
6. integrates only reviewed/accepted candidates in dependency-safe order;
7. validates the combined state.

No writer self-integration.

## Batch 2 — workflow clarity and communication surfaces

Batch 2 starts only from the accepted integrated Batch 1 state.

Maximum two writers again.

### W03 — Work Queue / Transaction Density & Terminology

Planned scope:

- My Work / Work Queue presentation;
- transaction index/create/detail;
- compact request creation;
- use transaction-detail whitespace for truthful routing/activity/evidence information already available;
- clearer state/recency presentation;
- preserve workflow and authorization.

### W04 — Correspondence / Announcements / Memoranda Clarity

Planned scope:

- Correspondence presentation language and helper copy;
- Announcements information hierarchy;
- Official Memoranda distinction and density;
- preserve formal workflow semantics and existing permissions.

Before Batch 2 starts, Maintainer must close any shared navigation vocabulary in one authoritative coordination commit so W03 and W04 do not collide on shared navigation files.

## Calendar / Meetings boundary

Calendar/Meetings is not an automatic implementation wave.

The observed DAT question is:

> a meeting appeared in the Meetings register for a date inside the visible calendar week, but the Calendar screenshot did not obviously show it.

That is insufficient to authorize synchronization logic.

Maintainer/Reviewer must first inspect the current contract and classify:

- intended separation;
- missing projection;
- stale fixture/data;
- presentation-only ambiguity;
- another confirmed cause.

Only a confirmed defect may produce a later bounded writer handoff.

## Final combined gate

After all authorized MP5 corrections coexist:

- exact candidate/source identity;
- TypeScript/build;
- focused Feature regressions;
- targeted browser/runtime scenarios for changed surfaces;
- Messages regression smoke;
- core navigation smoke;
- responsive/light/dark checks where changed;
- no accidental backend/permission widening;
- independent Review;
- Acceptance only after Review.

## Promotion boundary

An accepted MP5 candidate may be promoted only under explicit Technical Authority.

Promotion must be ancestry-preserving and non-force.

After promotion, run a narrow post-promotion smoke that proves the promoted state rather than rerunning the entire historical DA1 program.

## Deployment boundary

Deployment remains a later explicit Technical Authority decision.

MP5 completion does not itself mean:

- UAT PASS;
- production-ready;
- deployed;
- commercially complete.

## Completion definition

MP5 is successful when the accepted product remains functionally the same municipal system but:

- transaction notifications no longer replay as new alerts during ordinary navigation;
- Department Workspace and Staff Directory use first-frame space more efficiently;
- Ordinances & Issuances, Councils/Boards/Committees, and Systems Directory are easier to understand and scan;
- later approved workflow/communication corrections remain bounded;
- Messages and accepted backend/security/workflow behavior remain intact;
- all claims are tied to exact candidate evidence.
