# KIRION FORGE — ONE TALIBON V1

## MP5 W04 — CORRESPONDENCE / ANNOUNCEMENTS / MEMORANDA CLARITY

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

`KIRCH-TALIBON-MP5-W04-COMMS-INFORMATION-CLARITY`

If the branch does not descend exactly from this SHA, stop.

Do not silently rebase onto W01, W02, W03, newer coordination state, or main.

## Why this writer exists

MP4 DAT showed that several communication surfaces are functional but the user-facing distinction between them is not sufficiently obvious:

- **Correspondence** is official incoming/outgoing communication routing, but the label alone is abstract;
- **Memoranda** are formal internal issuances with auditable recipient/acknowledgement behavior, but this is not obvious from the index;
- **Announcements** are general notices, but a long equal-weight card wall makes priority and recency hard to scan.

This wave improves clarity and density without changing communication-domain semantics.

## Closed presentation direction

For W04-owned pages:

- Correspondence index presentation: **Inbox & Routing**
- formal domain terminology: **Correspondence** remains explained in copy/details
- Memoranda presentation: **Official Memoranda**
- Announcements remains **Announcements**

Conceptual distinction:

- **Inbox & Routing / Correspondence** = receive, register, classify, route, assign, and track official communications;
- **Official Memoranda** = formal numbered internal issuances, optionally acknowledgement-capable;
- **Announcements** = general municipal/office notices and operational information.

### Shared-navigation boundary

Do **not** modify:

`resources/js/navigation/navigationDestinations.ts`

W02 already owns that shared file in another reviewed candidate.

The isolated W04 candidate may therefore temporarily show old sidebar labels while W04-owned page titles/copy use the new presentation language.

Final shared navigation vocabulary is reserved for Maintainer/integration.

Do not widen scope to fix that temporary candidate mismatch.

## Owned scope

Primary production ownership:

- `resources/js/pages/Correspondence/Index.tsx`
- `resources/js/pages/Correspondence/Show.tsx`
- `resources/js/pages/Announcements/Index.tsx`
- `resources/js/components/announcements/AnnouncementRegister.tsx`
- `resources/js/pages/Memoranda/Index.tsx`
- `resources/js/pages/Memoranda/Create.tsx`
- `resources/js/pages/Memoranda/Show.tsx`

You may add narrowly scoped helpers/components under:

- `resources/js/components/announcements/**`
- a new `resources/js/components/memoranda/**` directory if truly useful

Focused tests may be adjusted only when a presentation contract directly requires it:

- correspondence-focused Feature tests;
- memorandum-focused Feature tests if one already asserts copy/presentation.

Do not rewrite backend/domain tests to fit visual changes.

## Explicit non-owned scope

Do not change:

- `resources/js/navigation/**`
- `resources/js/layouts/AppLayout.tsx`
- `resources/js/notifications/**`
- `resources/js/components/PageFrame.tsx`
- `resources/js/components/PageHeader.tsx`
- `resources/js/components/workflow/RelatedWorkPanel.tsx`
- `resources/js/components/correspondence/**`
- Transactions / work-queue files
- Departments
- Employees
- Legislation
- LocalBodies
- MunicipalSystems
- Calendar
- Meetings
- Messages
- controllers/services/policies/routes
- schema/migrations
- authorization
- announcement seed/data semantics unless a presentation-only derived grouping can be computed in the page

W03 is running in parallel on Transactions. File intersection must remain zero.

## Required outcome — Inbox & Routing

Current route:

`/correspondence`

Required:

1. Present the index as **Inbox & Routing**.
2. Explain clearly that this is the official correspondence intake/routing workspace.
3. Preserve the term `Correspondence` in supporting copy where municipal/legal meaning is useful.
4. Preserve search, lifecycle, classification, office, assigned-to-me, action-required, aging filters.
5. Preserve server pagination and authorization-visible rows.
6. Preserve current correspondence references, sender, routing/accountability, lifecycle, action-required/overdue truth.
7. Improve state/recency scanability only using existing fields.
8. Do not fabricate inbox categories that the server does not supply.
9. Do not make restricted/private correspondence more visible.

### Correspondence detail

Preserve the formal record identity.

You may improve user-facing links/copy such as:

- Back to Inbox & Routing
- linked workflow wording
- Open Work Queue

but do not alter routes or the shared RelatedWorkPanel implementation.

Preserve:

- CorrespondenceActionPanel behavior;
- timeline;
- classification/lifecycle truth;
- evidence;
- current accountability;
- linked workflow;
- return context;
- authorization.

## Required outcome — Announcements

The current page has dozens of equal-weight cards.

Use only existing announcement fields:

- id;
- title;
- issuingOffice;
- date;
- audience;
- priority;
- summary;
- relatedDocument.

Do not invent:

- pinned state;
- user-specific `My Office` membership;
- acknowledgement;
- read receipts;
- publication workflow;
- live backend data.

Required direction:

1. Keep **Announcements** as the page/domain presentation.
2. Explain that these are general notices, not formal memoranda.
3. Make Urgent/Important notices visually and structurally easier to find than Routine notices.
4. Organize the page into meaningful groups derived from existing data, such as priority bands and/or recent/older date ordering.
5. Avoid one endless equal-weight card wall.
6. Long routine groups may use a bounded scroll region or progressive disclosure, but do not put an independent scrollbar inside every card.
7. Keep search and priority filtering.
8. Preserve issuing office, audience, date, summary, and related document.
9. Add obvious recency/date treatment using the actual announcement date.
10. Empty filtered states remain clear.

## Required outcome — Official Memoranda

Current route:

`/memoranda`

Required:

1. Present the index as **Official Memoranda**.
2. Explain the distinction from Announcements:
   - formal issuance;
   - issuing office;
   - numbered memo;
   - recipient delivery;
   - acknowledgement when required.
3. Preserve publishing permission behavior.
4. Preserve memo number, title, classification, issuing department, published timestamp, recipients, detail route.
5. Improve density modestly; avoid oversized rows/cards.
6. Make acknowledgement requirement visible where the existing memo data provides it.
7. Use human-readable recency as a supplement to exact publication time where useful.

### Memorandum create

Preserve the entire publication contract:

- memo number;
- classification;
- title;
- body;
- audience type;
- audience IDs;
- requires acknowledgement;
- expiry;
- publication endpoint.

You may reduce ornamental spacing and make the form more compact, but do not hide audience/acknowledgement semantics or reduce auditability.

### Memorandum detail

Preserve:

- memorandum body;
- issuing department;
- publication timestamp;
- recipient acknowledgement action;
- duplicate-click protection;
- error handling;
- delivery/viewed/acknowledged statistics when authorized.

You may compact the presentation without changing these behaviors.

## State / recency rule

Use color + text, never color alone.

Human-readable recency may be shown prominently:

- Just now
- minutes/hours ago
- Yesterday
- calendar date

Exact authoritative time must remain available in visible secondary text, title, or detail where appropriate.

Do not create a global date/status helper outside W04 ownership.

## Density rule

This is information hierarchy, not decoration.

Do:

- reduce repeated chrome;
- make important information easier to scan;
- group long notice collections;
- preserve readable typography;
- preserve keyboard/touch usability;
- preserve dark mode classes.

Do not:

- make text tiny;
- remove content to fake density;
- add marketing/promotional copy;
- create fake interactivity;
- turn announcements into memoranda;
- turn memoranda into generic announcements.

## Validation cadence

Per Technical Authority:

`EXPENSIVE EXECUTION VALIDATION DEFERRED TO INTEGRATED MP5 CANDIDATE`

This writer may return with TypeScript/build/browser evidence marked `NOT RUN / NOT OBSERVED` when unavailable.

If cheap local checks are available, run them.

Never upgrade deferred evidence into PASS.

The final integrated MP5 gate will validate accumulated compiler/build/Feature/browser behavior.

## Commit discipline

Use coherent commits by surface/concern.

No commit-count target.

No reset/rebase/squash/force-push.

## Stop conditions

STOP and return to Maintainer if:

- immutable base differs;
- W03 touches your files;
- clarity/density requires backend/query/schema/permission modification;
- Announcements would need invented user-office/pinned/read state;
- shared navigation must be edited;
- shared CorrespondenceActionPanel or RelatedWorkPanel must be changed;
- a domain behavior defect is discovered that exceeds presentation authority;
- authority becomes ambiguous.

## Writer return

Return:

# ONE TALIBON V1 — MP5 W04 CODE WRITER RETURN

## Authority
Role:
Branch:
Immutable start SHA:
Final candidate SHA:
Remote HEAD verification:
Lineage:

## Commits

## Exact changed files

## Inbox & Routing result

## Correspondence detail result

## Announcements result

## Official Memoranda result
Index:
Create:
Detail:

## State / recency treatment

## Contract preservation
Correspondence authorization:
Correspondence workflow/actions:
Announcement source truth:
Memorandum publish/acknowledgement:
Routes:
Shared-navigation boundary:

## Validation evidence
TypeScript:
Build:
Focused Feature:
Browser/runtime:
Responsive:
Light/dark:

## Collision check with W03

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
