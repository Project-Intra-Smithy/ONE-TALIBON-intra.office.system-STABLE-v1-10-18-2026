# KIRION FORGE — ONE TALIBON V1

## MP5 W05 — RECORDS REGISTER / OPERATIONAL REPORTS CLARITY & DENSITY

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

Read:

- `AGENTS.md`
- `.forge/AUTHORITY.md`
- `.forge/SSOT_CURRENT.md`
- `.forge/WORK_LEDGER.md`
- `docs/MP5_POST_DAT_FRONTEND_CORRECTION_PLAN.md`
- `.forge/evidence/maintainer/MP4-DAT-FRONTEND-FINDINGS.md`
- `.forge/evidence/maintainer/MP5-VALIDATION-CADENCE-DECISION.md`

## Immutable implementation base

Start exactly from:

`KIRCH-TALIBON-MP5-POST-DAT-FRONTEND-CORRECTION@960df63f9e452f8846a0805cfc3d957e1c52725d`

Writer branch:

`KIRCH-TALIBON-MP5-W05-RECORDS-REPORTS-CLARITY`

If the writer branch does not descend exactly from this SHA, stop.

Do not silently rebase onto W01/W02/W03/W04 or newer coordination/main state.

## Why this writer exists

During DAT, the user questioned whether **Reports** should instead be named **Archives**.

The correct domain distinction is:

- **Records Register** = searchable authoritative operational records;
- **Operational Reports** = generated analytical/summary views over operational data;
- **Archive** = historical retention concept, which is not the same thing as Reports and is not currently a separate authorized product surface.

This wave makes that distinction obvious in the frontend and removes any remaining ambiguity without inventing a new Archive feature.

## Closed presentation decisions

User-facing page titles for this lane:

- `Records` → **Records Register**
- `Operational Reports` remains **Operational Reports**

Do **not** rename Reports to Archives.

Do **not** create a new Archive route, page, tab, database field, lifecycle, or retention workflow.

Do **not** change shared sidebar/navigation labels in this writer. Shared navigation reconciliation remains integration-owned.

## Owned production scope

You own only:

- `resources/js/pages/Records/Index.tsx`
- `resources/js/pages/Reports/Index.tsx`

Focused test ownership, only if directly needed:

- `tests/Feature/CorePortalReportsTest.php`
- `tests/Feature/TravelOrderRecordsFederationTest.php`

You may add one narrowly scoped local helper under:

- `resources/js/pages/Records/**`
- `resources/js/pages/Reports/**`

only if that materially improves local clarity and does not become a new shared framework.

## Explicit non-owned scope

Do not change:

- `resources/js/navigation/**`
- `resources/js/layouts/AppLayout.tsx`
- `resources/js/notifications/**`
- `resources/js/components/PageFrame.tsx`
- `resources/js/components/PageHeader.tsx`
- shared filters/components outside the owned pages
- Transactions / work-queue
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
- controllers/services/policies/routes
- query/result presenters
- schema/migrations
- authorization

W03 and W04 are running in parallel. File intersection must remain zero.

## Required outcome — Records Register

Current route:

`/records`

Required:

1. Present the page title as **Records Register**.
2. Explain that this is the authorized operational register spanning current correspondence, workflow transactions, and approved travel orders.
3. Make it clear that this is where users locate authoritative records—not where analytical summaries are generated.
4. Preserve:
   - search;
   - record type;
   - status/lifecycle;
   - current office;
   - date range;
   - authorized visibility;
   - result counts;
   - pagination;
   - return-context behavior;
   - detail routes;
   - record type/state/classification truth.
5. Preserve all three record sources:
   - correspondence;
   - transaction;
   - travel order.
6. Improve scanability only using fields already supplied by the current server contract.
7. If recency is added, it must supplement—not replace—the existing authoritative record date.
8. Do not expose fields currently hidden by Records federation/authorization.
9. Do not change server pagination size or query behavior.
10. Avoid turning Records Register into a dashboard.

The current page is already comparatively dense; this should be a restrained clarity pass, not a redesign.

## Required outcome — Operational Reports

Current route:

`/reports`

Required:

1. Keep the title **Operational Reports**.
2. Add clear explanatory language that reports are generated summaries/views over authorized operational data, not an archive.
3. Preserve the current report catalog and active-report selection.
4. Preserve:
   - date filters;
   - office filters;
   - status/priority/type/lifecycle/classification filters where supported;
   - result pagination;
   - CSV export;
   - detail links;
   - aggregate vs row result semantics;
   - authorization-scoped data.
5. Make the distinction between:
   - report selection;
   - filter scope;
   - results;
   easier to scan.
6. Reduce unnecessary vertical spacing or repeated chrome where safe.
7. Keep CSV export visible without making it dominate the page.
8. Preserve report descriptions and column semantics.
9. Do not fabricate charts, KPIs, archive counts, retention states, or historical snapshots.
10. Do not alter backend report definitions or export contracts.

## Reports versus Archives contract

The finished UI should make this conceptual relationship understandable:

```text
Records Register
    = authoritative individual records

Operational Reports
    = analysis / summaries / export views generated from authorized records

Archive
    = not a current separate MP5 product surface
```

Do not use wording that implies deleted/closed records disappear into a separate archive if the current backend does not implement that lifecycle.

## Density / readability rules

Do:

- preserve compact filters;
- keep result lists readable;
- improve headings/helper copy;
- reduce ornamental spacing;
- preserve desktop/mobile behavior;
- preserve light/dark classes;
- preserve text-based status meaning.

Do not:

- shrink text to fit more rows;
- remove filters;
- collapse critical result metadata;
- add nested scrollbars unnecessarily;
- create fake tabs;
- add decorative analytics.

## Validation cadence

Technical Authority has deferred expensive executable validation to the exact integrated MP5 candidate.

Therefore:

- TypeScript may remain `NOT RUN`;
- build may remain `NOT RUN`;
- Feature tests may remain `NOT RUN`;
- browser/viewport/theme may remain `NOT OBSERVED`;

when the environment is unavailable.

If cheap local checks are available, run them.

Never report deferred evidence as PASS.

## Commit discipline

Prefer coherent commits:

- Records clarity/density;
- Reports clarity/density;
- focused test-contract updates if required.

No numeric commit target.

Do not reset/rebase/squash/force-push.

## Stop conditions

STOP and return to Maintainer if:

- immutable source SHA differs;
- W03 or W04 touches an owned file;
- the requested clarification requires backend/report-query changes;
- a new Archive domain/surface appears necessary;
- shared navigation must be edited;
- shared PageHeader/filter components must be modified;
- authorization or record visibility must change;
- a source defect outside W05 becomes necessary to repair;
- authority becomes ambiguous.

## Writer return

Return:

# ONE TALIBON V1 — MP5 W05 CODE WRITER RETURN

## Authority
Role:
Branch:
Immutable start SHA:
Final candidate SHA:
Remote HEAD verification:
Lineage:

## Commits

## Exact changed files

## Records Register result

## Operational Reports result

## Reports-versus-Archive clarity

## Contract preservation
Records federation:
Authorization:
Pagination:
Return context:
Report catalog:
Filters:
CSV export:
Routes:
Shared-navigation boundary:

## Validation evidence
TypeScript:
Build:
Focused Feature:
Browser/runtime:
Responsive:
Light/dark:

## Collision check
W03:
W04:

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
