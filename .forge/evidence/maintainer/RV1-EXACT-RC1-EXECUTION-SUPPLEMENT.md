# ONE TALIBON V1 — RV1 EXACT RC1 EXECUTION SUPPLEMENT

Technical Authority:

**Kirch Ivan Balite**

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Exact RC1 candidate:

`f6208cf082c4b1d189c70728adfdb9ddf3225990`

Pre-promotion main:

`9cc1b50b28762402c3b24a721cd5ba7ae961817c`

## Purpose

This record supplements the prior RV1 Reviewer return, which was:

`VALIDATED WITH RECORDED LIMITATIONS`

The Reviewer had no local authenticated checkout and therefore could not execute the exact-SHA release gates.

The Technical Authority subsequently executed the required local validation from the isolated Talibon QA worktree against the exact RC1 candidate.

## Exact candidate identity

Observed local exact SHA:

`f6208cf082c4b1d189c70728adfdb9ddf3225990`

Observed output:

`EXACT RC1 SHA: PASS`

The remote RC1 branch was re-verified after execution and still resolves to the same SHA.

## Static / build / focused PHP execution

The Technical Authority ran the fail-fast RV1 validation block in this order:

1. `npm ci --no-audit --no-fund`
2. `npm run types:check`
3. `npm run build`
4. `php artisan test tests/Feature/PublicPortalTest.php tests/Feature/RepresentativeRoleExperienceTest.php`
5. isolated database preparation
6. Playwright browser installation / runtime phase

Execution reached the Playwright installation phase. Because the script hard-stopped after each non-zero command through `Assert-Native` with `$ErrorActionPreference = "Stop"`, progression to the Playwright phase is evidence that the preceding npm, TypeScript, production build, and focused PHPUnit gates completed without a non-zero exit.

Detailed stdout totals for those preceding gates were not preserved in the chat transcript. Do not invent assertion/test counts.

## Playwright environment issue

The Playwright browser download completed, but the normal installer stalled after transfer.

This was handled without product mutation by:

- downloading the Playwright 1.55.0 / Chromium build 1187 archives;
- extracting them into the expected local Playwright cache;
- locating the actual executable:
  `C:\Users\kirch\AppData\Local\ms-playwright\chromium_headless_shell-1187\chrome-win\headless_shell.exe`;
- running a direct Playwright launch probe.

Observed:

`PLAYWRIGHT_CHROMIUM_LAUNCH_PASS`

`PLAYWRIGHT BROWSER IS READY.`

This was a local validation-tooling condition, not a product defect.

## PHP server launcher issue

The first direct PHP server wrapper started successfully on port 8000 but used the repository root as its working directory.

Laravel's development router therefore attempted to require:

`D:\Dev\Talibon-DA1-Audit\index.php`

instead of:

`D:\Dev\Talibon-DA1-Audit\public\index.php`

Current PHP stderr proved the exact cause.

The corrected validation launcher used:

`D:\Dev\Talibon-DA1-Audit\public`

as the working directory.

Observed:

`SERVER_READY_PASS`

and previously:

`SERVER /login: HTTP 200`

This was a validation-launcher defect, not an application defect.

## Stale H0 carrier note

The repository's historical `tests/Browser/h0-runtime-readiness.mjs` expects the older email/password login surface.

The exact RC1 candidate uses the current Showcase workspace gateway on `/login`.

Therefore the historical H0 carrier was not used to manufacture a false pass.

Instead, the Technical Authority executed a temporary non-repository current-contract narrow smoke against the exact candidate.

No tracked repository file was changed by that smoke.

## Exact-SHA current-contract runtime proof

Observed exact output:

```text
SERVER_READY_PASS
PUBLIC_DESKTOP_PASS
PUBLIC_MOBILE_PASS
SHOWCASE_GATEWAY_PASS
EMPLOYEE_DASHBOARD_PASS
EMPLOYEE_MY_WORK_PASS
EMPLOYEE_RECORDS_PASS
RV1_NARROW_RUNTIME_PASS sha=f6208cf082c4b1d189c70728adfdb9ddf3225990 pageerrors=0 server5xx=0

RV1 EXACT RC1 RUNTIME: PASS
SHA: f6208cf082c4b1d189c70728adfdb9ddf3225990
```

The exact candidate therefore proved:

- public homepage renders on desktop;
- public homepage renders on mobile;
- current Showcase gateway renders and is actionable;
- Employee enters Dashboard;
- Employee My Work renders;
- Employee Records renders;
- no observed browser page errors;
- no observed server 5xx responses during the narrow smoke.

## False-negative harness assertions encountered

During validation, several temporary harness assumptions were corrected without product changes:

- direct PHP server wrapper used the wrong working directory;
- an early browser probe used incorrect `node -e` quoting;
- an early public smoke expected visible `ONE TALIBON` text although the reconciled public hero contract renders `TALIBON`;
- an early masthead assertion compared mixed-case source content against browser-rendered uppercase text while CSS explicitly applies `text-transform: uppercase`.

These are validation-harness defects and must not be recorded as product defects.

## Product disposition after supplemental execution

Confirmed product defects:

`NONE`

Confirmed RC1 integration defects:

`NONE`

Exact-SHA static/build/focused execution:

`PASS BY FAIL-FAST EXECUTION PROGRESSION`

Exact-SHA current-contract browser runtime:

`PASS`

Historical DA1 aggregate marker:

`NOT OBSERVED`

Historical H0 exact marker:

`NOT OBSERVED — CARRIER STALE AGAINST CURRENT SHOWCASE CONTRACT`

The missing historical markers are retained as historical limitations. They do not negate the exact RC1 current-contract execution evidence above.

## Maintainer disposition

The prior RV1 missing-execution blocker is closed by Technical Authority local execution evidence.

Exact RC1 candidate:

`f6208cf082c4b1d189c70728adfdb9ddf3225990`

is suitable to proceed to a separate **Technical Authority main-promotion decision**.

This record does NOT itself move `main`, deploy, or authorize branch cleanup.
