# KIRION FORGE — ONE TALIBON V1

## MP5 W02 — ORGANIZATION & REFERENCE DENSITY / TERMINOLOGY

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

`KIRCH-TALIBON-MP5-W02-ORG-REFERENCE-DENSITY`

If the branch does not descend exactly from this SHA, stop.

Do not silently rebase onto newer coordination/main state.

## Why this writer exists

MP4 DAT showed that the following pages are functionally useful but unnecessarily large or cognitively unclear:

- Department Workspace;
- Employee Directory;
- Legislative Records;
- Local Special Bodies;
- Municipal Systems.

This writer performs a **minimal operational-density and presentation-language correction**.

This is not a broad redesign.

## Closed presentation decisions

User-facing labels for this batch:

- `Employee Directory` → **Staff Directory**
- `Legislative Records` / sidebar `Legislative` → **Ordinances & Issuances**
- `Local Special Bodies` → **Councils, Boards & Committees**
- `Municipal Systems` → **Systems Directory**

These are frontend presentation labels only.

Do not rename:

- routes;
- database/schema concepts;
- controllers/services;
- permissions;
- domain identifiers;
- fixture object names solely for cosmetic consistency.

Keep official terminology in explanatory copy where useful.

## Primary ownership

You own only the MP5 behavior in:

- `resources/js/pages/Departments/Workspace.tsx`
- `resources/js/pages/Employees/Index.tsx`
- `resources/js/pages/Legislation/Index.tsx`
- `resources/js/pages/LocalBodies/Index.tsx`
- `resources/js/pages/MunicipalSystems/Index.tsx`
- `resources/js/components/local-bodies/**`
- `resources/js/components/municipal-systems/**`
- `resources/js/navigation/navigationDestinations.ts` for these affected labels only
- `tests/Feature/CurrentPortalNavigationTest.php` only if current label assertions require correction
- focused tests directly required for this lane

## Explicit non-owned scope

Do not change:

- `resources/js/layouts/AppLayout.tsx`
- `resources/js/components/shell/**`
- `resources/js/components/PageFrame.tsx`
- `resources/js/components/PageHeader.tsx`
- Transactions
- Correspondence
- Memoranda
- Announcements
- Calendar
- Meetings
- Messages
- Dashboard
- backend authorization
- server query/data contracts
- schema/migrations

W01 is running in parallel on notification delivery lifecycle. Do not touch W01 files/contracts.

The existing shared PageFrame/PageHeader density foundation is accepted. Reuse it; do not reopen it.

## Required outcome — Department Workspace

Current source presents attention and office-flow metrics as large equal-weight cards.

Correction target:

1. Reduce first-frame vertical/visual cost.
2. Zero-value metrics must remain visible/truthful but should not dominate.
3. Nonzero overdue/unassigned/escalation states keep stronger warning emphasis.
4. Recently completed may retain positive emphasis without becoming oversized.
5. Current routed-work flow remains legible.
6. Staff workload/actionable operational content should move higher into the usable frame when practical.
7. Existing metric links, labels, counts, role scope, and server data remain unchanged.

Do not invent new metrics or workflow actions.

## Required outcome — Staff Directory

1. Change page presentation title to **Staff Directory**.
2. Preserve explicit work-context-only privacy language.
3. Compress Employees / Municipal Offices / Portal Accounts summary into a narrow strip or similarly restrained summary.
4. Search, office filter, results, pagination, employee links, and current data contract remain primary.
5. Avoid horizontal overflow and preserve current mobile result behavior.

## Required outcome — Ordinances & Issuances

The current legislative register is already comparatively strong.

1. Change presentation language to **Ordinances & Issuances**.
2. Description should explain that the register includes ordinances, resolutions, executive/office/administrative orders, circulars, and related controlled issuances.
3. Preserve current filter behavior, record types, register density, pagination behavior, actions, and routes.
4. Do not redesign this page simply for visual novelty.

## Required outcome — Councils, Boards & Committees

1. Change presentation title to **Councils, Boards & Committees**.
2. Explain that these are formal municipal local special bodies.
3. Reduce card height/padding and repeated chrome.
4. Keep mandate, chair role, membership context, next meeting, related documents, and recent action available.
5. Search remains.
6. Prefer scanability over decorative equal-height cards.

## Required outcome — Systems Directory

1. Change presentation title to **Systems Directory**.
2. Explain that this is the internal directory/map of municipal systems.
3. Compress the four status counters.
4. Make system name, owning office, status, record scope, and integration context fast to scan.
5. Preserve group/status/search filters.
6. Do not alter source data or pretend integrations are enabled.

## Navigation boundary

Only update these destination labels:

- `employeeDirectory`
- `legislative`
- `localSpecialBodies`
- `municipalSystems`

Do not rename My Work, Correspondence, Records, Memoranda, or any Batch 2 vocabulary in this candidate.

That prevents hidden scope expansion and keeps Batch 1 reviewable.

## Visual discipline

This wave is **operational compression**, not indiscriminate shrinking.

Do:

- reduce ornamental padding;
- compress summary metrics;
- reduce equal weighting of unequal information;
- preserve readable typography;
- preserve touch/keyboard target usability;
- preserve dark mode;
- preserve truthful empty states.

Do not:

- tiny-font the interface;
- hide useful context;
- remove accessible names;
- invent new cards to replace old cards;
- add marketing copy;
- add non-working controls.

## Validation

Required:

- exact ancestry verification;
- `npm run types:check`;
- `npm run build`;
- affected `CurrentPortalNavigationTest.php` or focused equivalent if navigation labels are changed;
- exact diff/ownership inspection.

Browser/visual evidence should cover the changed surfaces at minimum:

- desktop around 1366×768 or 1280×800;
- one narrow/mobile viewport for pages whose responsive structure changed;
- light and dark for touched theme classes.

Verify:

- no horizontal overflow;
- primary content appears earlier in the frame;
- labels are understandable;
- no action/filter disappeared;
- dark mode remains readable.

If browser evidence cannot be run, report it `NOT RUN / NOT OBSERVED`.

Do not run the full historical DA1 carrier.

## Commit discipline

Prefer coherent, reviewable commits by surface or tightly related concern.

No numeric commit target.

Do not force push.

## Stop conditions

STOP and return to Maintainer if:

- immutable source SHA does not match;
- you require `AppLayout.tsx` or shell notification changes;
- a page requires backend/query/permission changes to meet the requested correction;
- W01 collides with your owned surface;
- a shared PageFrame/PageHeader rewrite appears necessary;
- a terminology change would require domain/schema renames;
- authority becomes ambiguous.

## Writer return

Return:

- role: CODE WRITER;
- branch;
- immutable start SHA;
- final candidate SHA;
- remote HEAD verification;
- commits;
- exact changed files;
- per-surface summary;
- exact navigation-label changes;
- `npm run types:check` result;
- `npm run build` result;
- focused Feature test result;
- browser/viewport/theme evidence or `NOT RUN`;
- collision result with W01;
- remaining limitations/unknowns;
- force-push status;
- deployment status.

End with:

`WRITER AUTHORITY RETURNED TO MAINTAINER.`

Do not merge.
Do not integrate.
Do not accept.
Do not promote.
Do not deploy.
