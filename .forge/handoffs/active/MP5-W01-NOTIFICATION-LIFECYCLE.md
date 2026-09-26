# KIRION FORGE — ONE TALIBON V1

## MP5 W01 — NOTIFICATION DELIVERY LIFECYCLE REPAIR

### CODE WRITER HANDOFF

ROLE CALL:

`KIRION FORGE: CODE WRITER`

## Forge authority

Repository:

`Kirch-Nairu/KIRION-FORGE`

Exact Forge authority:

`44eb57e5b45b343be0033bf22a7a5e74d543c01a`

Use the normal Forge Code Writer bootstrap. Load only the doctrine required for this bounded implementation task.

Do not reinterpret this handoff as Maintainer, Reviewer, Acceptance, Integration, promotion, or deployment authority.

## Target repository

`Kirch-Nairu/Talibon-Sales-Prototype`

Technical Authority:

**Kirch Ivan Balite**

Program:

`MP5 — POST-DAT FRONTEND CORRECTION`

Coordination branch:

`KIRCH-TALIBON-MP5-POST-DAT-FRONTEND-CORRECTION`

Read:

- `AGENTS.md`
- `.forge/AUTHORITY.md`
- `.forge/SSOT_CURRENT.md`
- `.forge/WORK_LEDGER.md`
- `docs/MP5_POST_DAT_FRONTEND_CORRECTION_PLAN.md`
- `.forge/evidence/maintainer/MP4-DAT-FRONTEND-FINDINGS.md`

## Immutable writer source

Start exactly from:

`KIRCH-TALIBON-MP5-POST-DAT-FRONTEND-CORRECTION@ee06d97e896e988527314ebbdacc5cf02625d52e`

Writer branch:

`KIRCH-TALIBON-MP5-W01-NOTIFICATION-LIFECYCLE`

If the branch does not descend exactly from this SHA, stop.

Do not silently rebase onto newer coordination/main state.

## Why this writer exists

During the MP4 Developer Acceptance Test, the same transaction-approved live alert was observed reappearing while navigating across unrelated pages.

Current source in `resources/js/layouts/AppLayout.tsx`:

- polls `/notifications/feed`;
- stores known workflow notification keys in component-local refs;
- initializes those refs from the current feed;
- may also promote a recently-created workflow notification to `liveAlert` during initialization.

The DAT proves the replay symptom. The source suggests a lifecycle/dedupe boundary worth inspecting, but you must verify the actual mount/navigation behavior before selecting the repair.

Do not assume the implementation mechanism merely from the handoff prose.

## Owned scope

Primary ownership:

- `resources/js/layouts/AppLayout.tsx`

You may add a narrowly scoped helper only when it reduces lifecycle/dedupe complexity, under one of:

- `resources/js/notifications/**`
- `resources/js/components/shell/notification*.ts`
- `resources/js/components/shell/notification*.tsx`

You may add one focused browser proof under:

- `tests/Browser/mp5-notification-replay.mjs`

You may change an existing notification-specific test only if directly required by the repair.

## Explicit non-owned scope

Do not change:

- `resources/js/navigation/**`
- `resources/js/pages/Departments/**`
- `resources/js/pages/Employees/**`
- `resources/js/pages/Legislation/**`
- `resources/js/pages/LocalBodies/**`
- `resources/js/pages/MunicipalSystems/**`
- Transactions page UX/layout
- Correspondence
- Memoranda
- Announcements
- Calendar
- Meetings
- Messages UI/behavior
- backend authorization
- database schema/migrations
- notification feed backend contract unless a confirmed blocker is returned to Maintainer

W02 is running in parallel on organization/reference presentation. No shared-file collision is permitted.

## Required behavior

The completed candidate must satisfy all of the following at implementation/source level:

1. A transaction notification already present in feed/history must not repeatedly present as a new live toast merely because the user navigates between portal pages.
2. A genuinely new transaction notification arriving after the session has established its baseline must still surface as a live alert.
3. Bell/history visibility and unread behavior must remain truthful.
4. Do not hide or delete notifications merely to stop the toast.
5. Do not solve replay by globally suppressing all initial/new alerts.
6. Dedupe state must not leak incorrectly across authenticated users or showcase personas.
7. If browser storage is used, namespace/expiry/session semantics must be deliberate and resilient when storage is unavailable.
8. If the repair instead changes component/layout persistence behavior, do not broaden into an application-shell rewrite.
9. Preserve the existing 8-second visible polling cadence unless direct evidence shows cadence itself is the defect.
10. Preserve Messages and unrelated shell utilities.

Local implementation judgment is allowed. Project-wide architecture expansion is not.

## Validation

Required before return:

- exact branch/source ancestry verification;
- `npm run types:check`;
- `npm run build`;
- exact diff/ownership inspection.

Runtime/browser proof is materially important for this defect.

Preferred focused scenario:

1. log in to a representative authorized persona;
2. establish an existing transaction notification in the feed;
3. navigate through at least three unrelated pages;
4. verify the same notification does not re-toast;
5. cause or inject a genuinely new transaction notification through an existing legitimate workflow/test fixture;
6. verify the new notification alerts once;
7. continue navigation and verify that exact alert does not replay;
8. verify notification history/bell remains usable.

If this runtime/browser proof cannot be executed, return it as:

`NOT RUN / NOT OBSERVED`

Do not upgrade typecheck/build/source inspection into runtime PASS.

Do not run the full historical DA1 carrier for this task.

## Commit discipline

Prefer coherent commits.

No artificial commit-count target.

Do not rewrite shared history.

No force push.

## Stop conditions

STOP and return to Maintainer if:

- immutable source SHA does not match;
- W02 changes collide with your owned files/contracts;
- repair requires backend notification-contract redesign;
- repair requires auth/session architecture changes;
- a test failure indicates an unrelated product defect outside this handoff;
- you would need to alter Messages behavior;
- authority becomes ambiguous.

## Writer return

Return exactly enough evidence for Maintainer to reconstruct the candidate:

- role: CODE WRITER;
- branch;
- immutable start SHA;
- final candidate SHA;
- remote HEAD verification;
- commit list;
- exact changed files;
- implementation summary;
- dedupe/lifecycle design used;
- `npm run types:check` result;
- `npm run build` result;
- browser/runtime scenario and result, or `NOT RUN`;
- remaining limitations/unknowns;
- collision check with W02;
- force-push status;
- deployment status.

End with:

`WRITER AUTHORITY RETURNED TO MAINTAINER.`

Do not merge.
Do not integrate.
Do not accept.
Do not promote.
Do not deploy.
