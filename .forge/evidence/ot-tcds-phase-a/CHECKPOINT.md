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
