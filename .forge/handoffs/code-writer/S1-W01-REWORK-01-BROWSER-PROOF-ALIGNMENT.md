# KIRION FORGE — ONE TALIBON V1

## S1-W01 — SHELL HIERARCHY & NAVIGATION BEHAVIOR

### REWORK-01 — BROWSER PROOF CARRIER ALIGNMENT

ROLE CALL:

**KIRION FORGE: CODE WRITER**

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Technical Authority:

**Kirch Ivan Balite**

Forge authority:

`Kirch-Nairu/KIRION-FORGE@44eb57e5b45b343be0033bf22a7a5e74d543c01a`

Original W01 branch:

`KIRCH-TALIBON-S1-W01-SHELL-HIERARCHY-NAVIGATION`

Original W01 candidate:

`370d0802df3166aacef8507cfbe4dca195c594e3`

Rework branch:

`KIRCH-TALIBON-S1-W01-SHELL-HIERARCHY-NAVIGATION-REWORK-01`

Immutable rework base:

`370d0802df3166aacef8507cfbe4dca195c594e3`

## Maintainer disposition

The W01 product-source direction is bounded and structurally consistent with the handoff.

However, source audit found two **deterministic stale browser-proof assumptions** introduced by the intentional W01 shell behavior change.

This is a test-carrier alignment rework.

It is **not** authorization to change W01 product behavior.

## Blocking proof defect 1 — WorkspaceSwitcher selector is stale

W01 intentionally moves `Switch Workspace` outside:

`details.portal-account-tools`

and renders it persistently in Showcase sessions.

The existing browser suites still look for the button *inside* Account & tools:

- `tests/Browser/ow1-onboarding-tour.mjs`
- `tests/Browser/v1-showcase-readiness.mjs`

That proof code no longer matches the intended shell contract and would fail even if the product behavior is correct.

Required repair:

- locate `Switch Workspace` from the persistent shell/footer context rather than as a descendant of `details.portal-account-tools`;
- preserve the separate Account & tools flow for Guided Tour / appearance / sign-out checks where still applicable;
- do not move the product control back into Account & tools.

## Blocking proof defect 2 — showcase navigation helper assumes all collapsible groups can stay open

`tests/Browser/v1-showcase-readiness.mjs` currently contains logic equivalent to:

`while collapsed groups exist -> open the first collapsed group`

W01 introduces accordion-like controlled disclosure where opening one secondary group closes the previous one.

Under that contract, the old helper can remain in a non-terminating/open-close cycle because at least one secondary group will always be collapsed.

Required repair:

- remove the “open every collapsed group simultaneously” assumption;
- verify each expected navigation destination by opening only the owning/necessary secondary group when the destination is not already visible;
- keep role/permission expectations exactly the same;
- do not weaken expected/forbidden navigation assertions;
- do not change product navigation just to satisfy the old test.

## Authorized scope

Primary:

- `tests/Browser/ow1-onboarding-tour.mjs`
- `tests/Browser/v1-showcase-readiness.mjs`

Only if source proof needs a bounded wording/update:

- `tests/Feature/CurrentPortalNavigationTest.php`

Do not modify product source unless a new, directly proven W01 product defect is found and reported back to Maintainer first.

## Explicit non-scope

Do not modify:

- shell product files unless Maintainer separately authorizes;
- navigation definitions;
- routes;
- backend;
- auth;
- permissions;
- migrations/schema;
- dependencies/lockfiles;
- FRE copy;
- Dashboard;
- Future Integrations;
- HR presentation;
- page polish.

## Required static/source result

Final rework delta should ideally be **test-only**.

Explicitly report whether product source changed.

## Required executable gates

If execution is available, run:

`npm run types:check`

`npm run build`

`php artisan test tests/Feature/CurrentPortalNavigationTest.php`

Browser:

`$env:QA_BASE_URL='http://127.0.0.1:18000'; node tests/Browser/v1-showcase-readiness.mjs`

and, if onboarding state can be safely exercised on the isolated S1 environment:

`$env:QA_BASE_URL='http://127.0.0.1:18000'; node tests/Browser/ow1-onboarding-tour.mjs`

If execution is unavailable, return `NOT RUN` exactly. Do not fabricate PASS.

## Done definition

REWORK-01 is complete when:

- stale WorkspaceSwitcher selectors are aligned with persistent W01 placement;
- showcase navigation proof no longer assumes simultaneously expanded secondary groups;
- role/permission expectations remain unchanged;
- product source remains unchanged unless separately authorized;
- no route/backend/auth/schema/dependency drift occurs;
- exact final SHA is returned.

## Return

Return:

1. role;
2. repo;
3. rework branch;
4. immutable rework base;
5. final rework HEAD;
6. ahead/behind;
7. exact changed paths;
8. proof defect 1 repair;
9. proof defect 2 repair;
10. whether any product source changed;
11. types result;
12. build result;
13. Feature result;
14. v1 showcase browser result if run;
15. onboarding browser result if run;
16. limitations;
17. explicit statement of no merge/promotion/deployment.

Do not self-accept.
Do not self-promote.
