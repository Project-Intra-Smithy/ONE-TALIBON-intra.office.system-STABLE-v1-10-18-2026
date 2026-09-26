# KIRION FORGE — ONE TALIBON V1

## MP5 W03 — WORK QUEUE / TRANSACTION DENSITY & TERMINOLOGY

### CODE WRITER HANDOFF

ROLE CALL:

`KIRION FORGE: CODE WRITER`

## Forge authority

Repository:

`Kirch-Nairu/KIRION-FORGE`

Exact Forge authority:

`main@44eb57e5b45b343be0033bf22a7a5e74d543c01a`

Use the normal Forge Code Writer bootstrap. Load only the doctrine required for this bounded writer task.

This is Code Writer authority only. Do not assume Maintainer, Reviewer, Acceptance, Integration, promotion, or deployment authority.

## Target repository

`Kirch-Nairu/Talibon-Sales-Prototype`

Technical Authority:

**Kirch Ivan Balite**

Program:

`MP5 — POST-DAT FRONTEND CORRECTION`

Coordination branch:

`KIRCH-TALIBON-MP5-POST-DAT-FRONTEND-CORRECTION`

Read from current coordination authority:

- `AGENTS.md`
- `.forge/AUTHORITY.md`
- `.forge/SSOT_CURRENT.md`
- `.forge/WORK_LEDGER.md`
- `docs/MP5_POST_DAT_FRONTEND_CORRECTION_PLAN.md`
- `.forge/evidence/maintainer/MP4-DAT-FRONTEND-FINDINGS.md`
- `.forge/evidence/maintainer/MP5-VALIDATION-CADENCE-DECISION.md`

## Immutable implementation base

Start exactly from:

`KIRCH-TALIBON-MP5-POST-DAT-FRONTEND-CORRECTION@68e387a506dafc4a019252f8391b88b1a64c8df3`

Writer branch:

`KIRCH-TALIBON-MP5-W03-WORK-QUEUE-TRANSACTION-DENSITY`

If the branch does not descend exactly from this SHA, stop.

Do not silently rebase onto W01, W02, newer coordination state, or main.

## Why this writer exists

MP4 DAT found that the transaction area works but is cognitively and spatially inefficient:

- **My Work** is ambiguous because the same surface also originates new work;
- **New transaction** is backend/domain language rather than the clearest user action;
- the create form is too tall for a routine desktop task;
- the transaction detail page leaves substantial unused space;
- status and recency require too much reading effort.

This wave improves presentation and first-frame task continuity without altering workflow semantics.

## Closed presentation direction

For W03-owned surfaces:

- page concept: **Work Queue**
- create action: **New Request**
- create page: **Create Work Request**
- submit action may use **Route Request**
- backend/domain concept remains `WorkflowTransaction`
- route remains `/transactions`
- request/transition semantics remain unchanged

### Important shared-navigation boundary

Do **not** modify:

`resources/js/navigation/navigationDestinations.ts`

W02 already owns that shared file in another reviewed candidate.

Therefore the sidebar may still say `My Work` inside the isolated W03 candidate. That temporary cross-candidate mismatch is intentional and will be reconciled once during MP5 integration.

Do not widen scope to "fix" it.

## Owned scope

Primary production ownership:

- `resources/js/pages/Transactions/Index.tsx`
- `resources/js/pages/Transactions/Create.tsx`
- `resources/js/pages/Transactions/Show.tsx`
- `resources/js/components/work-queue/**`

You may add narrowly scoped helpers under:

- `resources/js/components/work-queue/**`

Focused tests may be modified only if directly required by changed presentation contracts:

- `tests/Feature/WorkQueueTest.php`
- `tests/Feature/W03ContextContinuityTest.php`

Do not change backend workflow tests merely to make a frontend copy change pass.

## Explicit non-owned scope

Do not change:

- `resources/js/navigation/**`
- `resources/js/layouts/AppLayout.tsx`
- `resources/js/notifications/**`
- `resources/js/components/PageFrame.tsx`
- `resources/js/components/PageHeader.tsx`
- `resources/js/components/workflow/RelatedWorkPanel.tsx`
- shared `resources/js/components/documents/**`
- Correspondence
- Announcements
- Memoranda
- Departments
- Employees
- Legislation
- LocalBodies
- MunicipalSystems
- Calendar
- Meetings
- Messages
- backend controllers/services/policies/routes
- schema/migrations
- authorization

W04 is running in parallel on communication/information surfaces. File intersection must remain zero.

## Required outcome — Work Queue index

Current route:

`/transactions`

Required:

1. Present the surface as **Work Queue**.
2. Preserve all current personal and office scope tabs.
3. Preserve department-head-only office views and ordinary-user boundaries.
4. Preserve filtering by status, priority, office, and search.
5. Preserve server-owned counts and pagination.
6. Change the primary creation action from developer/domain wording such as `New transaction` to **New Request**.
7. Improve state scanability without inventing statuses.
8. Add human-readable recency where the existing data already supports a timestamp.
9. Exact timestamp/detail must remain available where needed; do not discard authoritative dates.
10. Use color + text together. Do not encode status meaning by color alone.

State direction on W03 surfaces:

- green: approved/completed/resolved;
- blue: active/submitted/in progress;
- amber: waiting/for review/due soon;
- red: overdue/rejected/escalated;
- gray: closed/inactive/neutral.

Map only existing real statuses. Do not fabricate a new workflow state merely to fit this palette.

## Required outcome — Create Work Request

Current route:

`/transactions/create`

The DAT target is routine desktop task continuity.

At approximately 1366×768, the primary fields and primary submit action should require materially less scrolling than the current form.

Preserve fields and posting contract:

- transaction type;
- subject/title;
- description;
- priority;
- receiving office;
- due date;
- routing remarks;
- evidence/files.

Required direction:

1. Title: **Create Work Request**.
2. Reduce ornamental page/form spacing and oversized rounded-card treatment.
3. Keep transaction type + priority in a compact row where practical.
4. Keep receiving office + due date compact.
5. Reduce textarea default height where safe; do not remove content capability.
6. Evidence remains available but must not dominate the form when no files are selected.
7. Primary submit action remains clearly visible and truthful.
8. Preserve validation errors, disabled/processing behavior, multipart upload, CSRF/Inertia behavior, and target office options.
9. Do not hide required fields behind surprising interaction.
10. Do not shrink typography/touch targets into cramped UI.

Use the existing shared EvidenceFields component. Do not mutate that shared component in this wave.

## Required outcome — Transaction detail

Current route shape:

`/transactions/{id}`

DAT observed substantial unused space.

Use **existing already-provided transaction data only** to make the frame more operationally useful.

Preferred information priorities:

- transaction identity/status/accountability;
- routing/activity event history;
- current office / assignee / due state;
- remarks already present in events;
- existing evidence;
- existing actions;
- existing Related Work rail.

Required:

1. Reduce dead whitespace.
2. Bring activity/routing history into the primary operational reading flow.
3. Keep Related Work as a secondary rail; do not modify the shared component.
4. Preserve all existing transition/assignment/mayor-decision behavior.
5. Preserve visible polling/live refresh.
6. Preserve evidence upload/download behavior.
7. Preserve return context.
8. Do not invent timeline events, comments, attachments, approvals, or audit fields that the backend did not provide.
9. Humanized recency may supplement exact timestamps but must not replace authoritative date access.
10. Status/due-state presentation should be easier to scan while retaining text labels.

## Density rule

This is **operational compression**, not a redesign.

Do:

- reduce ornamental spacing;
- improve information grouping;
- prioritize current action and routing history;
- make common work understandable in one frame where realistic;
- preserve accessible focus/touch targets;
- preserve light/dark behavior.

Do not:

- make text tiny;
- remove context;
- hide actions;
- introduce fake accordions around required workflow;
- alter workflow semantics to simplify the screen;
- broaden backend payloads.

## Validation cadence

Per Technical Authority:

`EXPENSIVE EXECUTION VALIDATION DEFERRED TO INTEGRATED MP5 CANDIDATE`

Therefore this writer is **not required** to wait for full CI/browser execution before returning.

However, if the local environment is available, run cheap focused checks that materially help.

At minimum the Writer Return must include:

- exact ancestry;
- changed-file ownership;
- source-level preservation check;
- any tests actually run;
- TypeScript/build state as PASS/FAIL/NOT RUN;
- browser state as OBSERVED/NOT OBSERVED.

Never report deferred evidence as PASS.

The final integrated MP5 gate will run the accumulated compiler/build/Feature/browser workflow.

## Commit discipline

Use coherent commits by concern.

No commit-count target.

No reset/rebase/squash/force-push.

## Stop conditions

STOP and return to Maintainer if:

- immutable base differs;
- W04 touches your files;
- the requested density change requires backend/query/schema modification;
- transaction workflow or authorization must change;
- shared navigation must be modified;
- shared EvidenceFields or RelatedWorkPanel must be modified;
- a source defect outside W03 becomes necessary to repair;
- authority becomes ambiguous.

## Writer return

Return:

# ONE TALIBON V1 — MP5 W03 CODE WRITER RETURN

## Authority
Role:
Branch:
Immutable start SHA:
Final candidate SHA:
Remote HEAD verification:
Lineage:

## Commits

## Exact changed files

## Work Queue result

## Create Work Request result

## Transaction detail result

## State / recency treatment

## Contract preservation
Workflow:
Authorization:
Routes:
Polling:
Evidence/files:
Return context:
Shared-navigation boundary:

## Validation evidence
TypeScript:
Build:
Focused Feature:
Browser/runtime:
Responsive:
Light/dark:

## Collision check with W04

## Remaining limitations / deferred evidence

## History safety
Force push:
Rebase:
Reset/squash:

## Deployment/integration
Integration:
Acceptance:
Promotion:
Deployment:

End exactly:

`WRITER AUTHORITY RETURNED TO MAINTAINER.`

Do not merge.
Do not integrate.
Do not accept.
Do not promote.
Do not deploy.
