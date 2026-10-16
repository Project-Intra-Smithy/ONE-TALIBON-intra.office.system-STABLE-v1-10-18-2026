# Login test audit — 2026-10-16

FE-UX-REFINE-01, AJ/Codex-assisted; Kirch retains acceptance. [Owning START](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/37#issuecomment-6207393911), paired START memory `9e9e58873b5ea6a9449391d775ebf4f907bfe1d3`.

Source: `feat/aj-ui-finalization@278edf0d052c4b98937749312c315c6bdd950720` plus existing uncommitted Auth, test, lockfile and evidence changes. Live frontend main `6c385ee85f3fec4325182791554b66a861cfd9f3`. Backend reference inherited `5416da97611a7dd6fee15f9275bee4a24c7a4db1`; no assembled backend/frontend runtime. No PR for this branch. PR28 head `9508f0322535d05d76fb0cce5d3af2b6a7070468`, base `e6f5947ab330802f4b860b28baddc910ca32e13e`; separate PR34 head `3f9c63030a2e391ae6c4b6bc60e2148361dbff3b`, base live main. PR6/7 merged.

## Findings and changes

The eight initial failures were all setup timeouts waiting for `Welcome back`, before behavioral assertions ran. This did not establish that behavior passed. Only three test lines changed relative to the supplied working tree; see [exact audit delta](assertions.patch):

- Heading now requires the exact accessible name `Sign in to your workspace`, matching the existing h2.
- Email lookup now requires `Email address`, matching the existing associated label; email type, autocomplete, required validation and payload assertions remain intact.
- Photo lookup follows `.employee-login__backdrop` instead of the removed composition pseudo-element; HTTP 200 and JPEG content-type requirements remain intact.

One deeper failure remains: the behavioral test requires a disabled `Continue with Google` button, but current Login contains no Google control. [FE-AUTH-01 issue #18](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/18) explicitly requires preserving disabled Google login as unavailable. No superseding decision was found in that issue. This is a UI requirement mismatch, not evidence of a broken credential or SSO transport. Removing that assertion or accepting either absence or disabled state would relax the documented requirement without justification. It remains unchanged and failing. The user's approved Login UI remains unchanged as requested; AJ/Kirch must reconcile this requirement with the approved design.

## Exact local results

Node 22.16.0, npm 10.9.2, existing browser fixture harness (no new preview created).

| Command | Result | Evidence |
| --- | --- | --- |
| `node --experimental-strip-types --test tests/login-mounted-ui.test.mjs` before edits | Exit 1; 0 pass / 8 fail / 0 skipped; 247733.9964 ms | [baseline.log](baseline.log) |
| `npm test` after three assertion corrections | Exit 1; 36 pass / 1 fail / 0 skipped / 0 cancelled; 50029.5238 ms | [tests.log](tests.log) |
| `npm run types:check` | Exit 0 | [types.log](types.log) |
| `npm run build` | Exit 0; Vite 8.3.0, 2189 modules, built in 1.12 s | [build.log](build.log) |
| `git diff --check` | Exit 0; line-ending advisories only | [diff-check.log](diff-check.log) |

All seven responsive/fallback/short-viewport Login cases pass, including the five 320/390/768/1024/1440 px cases. All 29 non-Login cases pass. The failing behavioral case reaches its final Google assertion after required-field rejection, keyboard order, Enter/Space password visibility, remember state, exact POST /login payload, one-request count, disabled pending controls/status, and associated server errors all pass. Its screenshot after the Google assertion is not reached. No skips, weakened behavioral checks, timeout increases, application changes, backend edits, or new preview pages were introduced.

Login.tsx, login.css, MfaChallenge.tsx and mfa-challenge.css SHA256 values match the audit's initial values; see [preserved hashes](preserved-auth-hashes.json). Existing local edits remain local. Only documentation/evidence is published; the three-line test delta is preserved locally and in the patch so unrelated pre-existing test work is not attributed to this audit.

## Disposition and remaining gates

Audit performed; suite remains FAIL / review held. The remaining mismatch was masked by the initial stale heading and cannot be attributed to FE-UX-REFINE-01, which preserved existing Auth changes. No credential-flow regression was observed in exercised synthetic tests. This does not establish authenticated Laravel acceptance.

NOT RUN: genuine Laravel login/session/CSRF/MFA/recovery end-to-end, standalone MFA browser acceptance, Firefox/WebKit, screen reader/native zoom, hosted CI for this dirty working-tree tuple. Existing tests exercise Task MFA redirect boundaries, not full MFA authentication. The existing CSS also contains a machine-specific absolute photo path; it resolves/builds here, but cross-machine portability is unverified and is not a failure observed in this run.

Canonical-main documentation synchronization remains HOLD; branch START/CLOSE evidence is paired, not technical acceptance. Hub #63 remains inaccessible. No merge, issue closure, or production promotion.

NEXT: AJ/Kirch reconcile issue #18's disabled-Google requirement with the approved Login design, then authorize the corresponding assertion or UI correction and rerun the full suite. Authenticated QA remains deferred to Kirch's approved backend/frontend assembly.
