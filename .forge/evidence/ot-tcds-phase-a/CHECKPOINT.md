# Phase A implementation checkpoint — not a completion or acceptance receipt

Mission: OT-TCDS-FULL-PRODUCT-INTEGRATION-R1. Executor: Codex, AI-assisted under
accountable human owner Kirch-Nairu. Author review is non-accepting.

Authority: Hub #197 approved START 7149596126, reconciliation 7149551912,
writer transfer 7149645911 and paired handoff 7149661163.
Execution acknowledgment: https://github.com/Project-Intra-Smithy/engineering-hub/issues/197#issuecomment-7150634435.

Starting candidate: b23fa465d2e2a49aad3ef02419b041abe2bb9d2c.
Donor: 7afabade1fd651c2950f70006b8213ae8b7c61da.
PR70: 9869b2a23f66e0d5e4b791615a371ea49e890001.
PR71: 46f24d0f288e5584e3c45f5e8abf8466b6dc2a6a.

## Implemented so far

- Staged all 262 donor product files with blob-based baseline disposition:
  101 identical, 145 differing, 16 absent. All 63 donor pages have an isolated
  runtime entry; canonical-only Account Security and Delivery Exceptions added.
- Separate loopback preview build, output, Inertia/fixture adapters and storage
  origin. Unmatched fetches return 503; CSP denies connections and native forms.
  Operational bundler rejects preview/standalone modules; hostile entry test passes.
- Removed external map tiles; retained interactive sample overlays and reference
  plates. Escaped map tooltip content and restricted marker color interpolation.
- Restored six missing public assets. Shared shell, UI primitives, theme engine,
  corrected dashboard, login, activation and MFA presentation across runtimes.
- Adopted donor login/activation and MFA styling; preserved canonical fields and
  endpoints, disabled remember-me, removed unverified support extension. Restyled
  canonical-only security/delivery interfaces. Replaced three blocking MFA
  confirmations with the existing accessible confirmation dialog.
- Scoped Tailwind source discovery. An attempted legacy UI re-export removal was
  rejected by the compatibility suite; the exports and original tests are restored.

## Observed local checks

Builds and both typechecks passed during implementation. Frontend contracts passed
124/124 before the added bundler-negative check; that added check passed separately.
Canonical UX passed 9/9. These are working-tree results, not final frozen-SHA CI.
Initial desktop catalog smoke: 63 donor pages without page errors, fixture-boundary
errors or document overflow; not exhaustive interaction or role verification.
Dashboard responsive smoke and plan/MFA interactions: 1440/768/390, light/dark,
no page errors or document overflow. Raw local captures are not publication proof.

Protected backend comparison against PR71, and PR70-to-PR71 protected comparison,
reported zero differences for app/routes/database/config/bootstrap/Composer/PHP
tests. No database was modified. New CI copies the original 11 PG16 partitions
and aggregate job, attests unchanged protected source and tests against PR71,
and runs the original M5 witness/hostile checks on their frozen baseline. The
original matrix and verifiers remain unchanged. Hosted outcomes are pending.

## Outstanding work

W1–W6 are NOT declared complete. Much donor source remains isolated staging.
Finish shared presentation reconciliation and field-level operational adapter
review, complete interaction coverage (including Work Request/task/document/PPA/
map/staff studios), full responsive catalog and canonical-only checks, accessibility
repairs, donor/before/after comparisons, exact-SHA frontend/backend CI and durable
raw-image publication. Existing live planning and IAM behavior must remain intact.

Deferred backend: Nox N01–N13/Jane findings from the governing reconciliation,
especially planning office identity, parent/module authorization, current/target
transitions, transactional audit/rechecks, attachment reconciliation, designation
uniqueness, visibility and decimal/reference allocation contracts. Donor proposed
system-admin planning authority is not municipal policy; Policy #185 remains.

No main merge, deploy, persistent database modification, Siris activation,
independent acceptance or release. Continue the existing assignment and branch;
do not restart source discovery or describe this checkpoint as a finished migration.

## First hosted run and repair

Checkpoint e1ae9a52 hosted presentation run 45536480285 failed the legacy export
compatibility assertion. Backend run 45536480388 passed nine original partitions;
browser failed that same export assertion, and full PG16 ran 877 tests with one
source-contract failure: canonical login labels must retain `Username or email`
and `Remember me`. Labels are restored while remember-me remains disabled and
omitted from the request. No PHP test was edited. The old auth browser suite now
checks the actual login field and disabled remember-me while preserving required
fields, credentials-only payload, pending state, server errors, MFA and keyboard
assertions; 10/10 passed locally before the final wording adjustment. Contracts
passed 125/125 after export restoration. Revalidation on the next SHA is pending.

## Validated checkpoint and next slice

Exact f306430c9c16329c5c8d84dd0322741a318ef1df passed protected PG16 run
45537137809 (11 partitions plus aggregate) and presentation run 45537137777.
Raw 390-capture catalog and interaction artifact: 14987736965, 73,817,474 bytes,
90-day retention. Hub receipt: #197 comment 7151666818. Catalog role review later
found MayorOffice used department_head and could show a permission fallback;
the next revision selects executive_oversight and asserts rendered component
identity. Do not treat the older catalog as proof of every intended page.

The next slice adopts the donor Document Center register and inspection drawer
in the operational entry, retaining server date filters, mode-safe pagination,
authorized related navigation, source/responsible-person metadata and existing
private-file archive/native preview anchors. Selection derives from current
server-projected records, so removed records cannot remain in the drawer.
The preview shares this page and the unchanged canonical Work Request form.
Targeted document drawer/Escape/focus/date-query browser checks passed at all
three widths/light-dark; full contracts and build passed during implementation.

Preview Personal Task mutations now simulate create/start/complete in per-role
memory, explicitly labelled preview, with no server request and reset on reload.
Browser mutation-cycle, duplicate/invalid/denied negatives and no-network check
passed. Typecheck caught a nullable-date inference and it was repaired using the
existing IndividualTask contract. PPA targets enlarged; repeated Task/map headings
clarified and map provenance disclosed. These checks are working-tree evidence;
exact-next-SHA hosted validation is required. Six-wave completion remains pending.

## Published comparisons and audit/preview hardening

412ca310062e417060e961707a334d0c3d0a43e0 passed protected PG16 run
45540005762 and presentation run 45540005865. Artifact 14989700118 contains raw
responsive captures. The committed comparative/ gallery contains 72 raw images
for donor 7afabade, PR71 46f24d0f and presentation e1bf7b0d. Visual inspection
found tablet clipping despite zero outer-page overflow; scoped stacked record
cards repaired it and browser assertions now check Inspect button bounds.

Five loaded Forge skill files (core, dispatch, session-host, frontend and QA)
were compared to authenticated upstream Git blobs at the approved immutable pin;
all matched byte for byte. Ponytail full remains loaded from installed 5.3.3.

Next slice shares the donor audit composition while retaining the canonical
SourceReferenceLink function unchanged. All three source-link negatives/native
PDF tests pass. Preview administration now shares the canonical IAM interface.
The inherited preview Inertia adapter wrongly invoked write success callbacks;
unsupported commands now keep the current page, invoke no success callback, and
show an explicit blocked notice. Added the form transform compatibility boundary
and corrected direct routing to Delivery Exceptions. Browser checks cover login,
MFA confirmation and delivery acknowledgment, preserving form values and making
zero network requests. Desktop catalog passed 65 requested-component checks;
125 contracts, both typechecks and builds passed locally during this slice.
Exact-new-SHA hosted checks remain required. No six-wave CLOSE or acceptance.

## Resumed six-wave Phase A candidate

Codex resumed as sole implementation writer under Hub #197 comments 7155122205
and 7155138199. The withdrawn workforce branches remain provenance only. The
branch was fast-forwarded from 98f95fc4 to governance head 2f7178c1 without
discarding source; the governance delta touched only the durable work register.

This slice completes the remaining presentation adapters: Planning and Planning
Maps now share the permission-filtered workspace navigation and the map route is
the real staged `/planning-maps` entry; Work Request detail uses the shared
server-aware related-work panel; the shared evidence picker has an explicit
accessible name in both runtimes. A new browser suite exercises plan creation,
dossier tabs, PPA creation/detail, supporting-document controls, planning-map
coordinate picking and full plate zoom, plus Work Request creation, containment,
accessible control names, Escape close and focus restoration.

Observed local author validation: canonical and preview typechecks passed; 125/125
frontend contracts, 9/9 canonical responsive UX checks and 10/10 auth/browser
checks passed; both production builds passed. The isolated catalog passed all 390
combinations (65 pages, 1440/768/390, light/dark) with zero page errors, fixture
mismatches or document overflow. Preview, interaction, studio and task/write
negative suites passed, including zero external requests from the studio flow.
All 262 donor paths now have a terminal presentation disposition, and all 65 page
coverage rows identify the verified matrix and operational adaptation boundary.
Protected backend comparison to frozen PR71 remains empty. No database was used.

These are working-tree author results until the candidate is committed and the
exact SHA hosted presentation and protected-PG16 workflows pass. This checkpoint
does not grant independent acceptance, merge, deployment, persistent database
change or release; all existing holds remain.
