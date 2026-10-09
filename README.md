# ONE TALIBON — Intra-Office Frontend Workspace

**Development repository for the frontend team: AJ (`@rynzz22`) and Jhayr (`@kyumw3b`).**  
**Technical lead / integration and publication authority:** Kirch Ivan Balite (`@Kirch-Nairu`).  
**Canonical backend:** [Project-Intra-Smithy/Talibon-Sales-Prototype](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype).

> **TEAM — PLEASE UPLOAD WHAT YOU HAVE ALREADY BUILT.** AJ and Jhayr: do not restart from zero or wait for another general audit. Put your existing login, dashboard, layouts, navigation, components, pages, assets, styles, fixes and any real tests into **your own named working branches and pull requests in this repository**. Include the original source and author credit, show actual builds, and explain what is incomplete. [Follow the upload instructions below](#how-aj-and-jhayr-should-upload-their-existing-work).

## 1. Read this before changing anything

This repository contains a **real, selectively imported Laravel/Inertia + React frontend codebase**, no longer an empty docs-only bootstrap. It is a **shared development baseline**, **not** a production-ready, backend-compatible or security-certified integrated application.

| Item | Current meaning |
| --- | --- |
| `main` | Shared frontend source + technical reference documents for continued development |
| Original frontend source | `Kirch-Nairu/Talibon-Intra-Office-Portal@a7d7be17feb435b50c52cacd063e11d92ad047e1` — historical source/provenance, **not a replacement backend** |
| Backend contract authority | `Project-Intra-Smithy/Talibon-Sales-Prototype@7b4ebb838982f6262b9fef65d18ba57488ebf941` — source anchor used for the current producer reconciliation; **re-verify before integration** |
| Contract documentation | [Frontend contract reference pack](docs/contracts/ONE_TALIBON_FRONTEND_CONTRACT_PACK_R1/CONTRACT_MANIFEST.md) — source-backed **reference/draft**, with explicit publication holds |
| C23 / A01-C1 `/tasks` | Formally released **backend** individual-Task HTTP contract; **no accepted frontend Task consumer** |
| Earlier frontend CI | [Push run 37924165911](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/actions/runs/37924165911) and [PR run 37924238397](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/actions/runs/37924238397): `npm ci`, type-check, Vite build passed on the initial staging SHA |
| Runtime/browser QA | **NOT PASSED / NOT YET EXECUTED** against an accepted canonical-backend + frontend tuple |
| Production readiness | **NO**. Do not deploy or describe staged UI as an approved municipal operations system |

**Merging development code into `main` establishes a shared starting point. It does not override the unresolved REWORK findings** in [staging PR #5](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/pull/5#issuecomment-6080532978) or grant permission to invent municipal workflows.

### Who owns what?

- **Jhayr (`@kyumw3b`) — frontend coordination:** collect both developers' work, reconcile overlapping files, manage the integration checklist, return working PRs and honest test evidence. Existing import issue: [FRONTEND-REG-001 #1](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/1).
- **AJ (`@rynzz22`) — frontend contributor:** **upload your actual existing project files and changes**; provide original repository/commit or archive and what you personally built, rather than having your work guessed or credited to somebody else. Repository access was previously recorded as deferred: ask Kirch for access rather than assuming you can push.
- **Kirch (`@Kirch-Nairu`) — accountable Tech Lead:** resolves backend contract ambiguity, protects branch/merge authority, reviews the final compatibility and test evidence, and decides acceptance.
- **Backend engineers / specialists:** verify or change backend producers through their own approved backend repo workflows. **Frontend PRs do not rewrite the Laravel server.**

## 2. Repository map

```text
resources/
  js/
    app.tsx                    # Inertia React page resolver / browser entry
    types.ts                   # Existing shared prop / navigation types; NEED RECONCILIATION
    pages/
      Auth/                    # Login, MFA challenge, enrollment, settings, recovery
      Dashboard.tsx            # Actor-specific dashboard
      Transactions/            # Work Request list, create, show
      Correspondence/          # Inbox and workspace detail
      Records/                 # Access-scoped records list
      Memoranda/               # Read, create, acknowledge UI
      Calendar/                # Existing event display; NEEDS NEW BACKEND SHAPE
      Departments/             # Directory-only screen
      Employees/               # Directory-only screen
      Errors/                  # Error surface
    components/                # Shared portal, dashboard, document, work UI
    layouts/AppLayout.tsx      # Shell; notification initial state NEEDS FIX
    navigation/                # Source-backed nav; missing targets NEED SAFEGUARDS
    theme/ hooks/ branding/    # Appearance, polling, temporary graphic paths
  css/                         # Tailwind and municipal shared styles
public/                        # PLACEHOLDER brand/landscape SVG assets only
docs/
  FRONTEND_IMPORT_REGISTER.md  # Owner, source, compatibility and evidence log
  BACKEND_CONTRACT_INTAKE.md   # A01-C1 status and frontend integration gates
  contracts/ONE_TALIBON_FRONTEND_CONTRACT_PACK_R1/
    CONTRACT_MANIFEST.md
    BACKEND_PRODUCER_VERIFICATION.md
    PUBLICATION_REVIEW_R1.md
    AUTHORITY_AND_INTEGRATION_HOLDS.md
    ...
.github/workflows/frontend-staging.yml
package.json package-lock.json tsconfig.json vite.config.ts
```

**Intentionally not copied into this frontend repository:** old PHP `app/`, Laravel `routes/`, `database/`, migrations, backend auth/middleware, HRIS/Payroll/DTR, Property, Legislative, Travel Order operational pages, public sample-data homepage, static Procurement/Plans/PPAs mock workflows, and authority-pending municipal process screens. The canonical backend may still render some of these server routes; **missing page consumers are a known integration limitation**, not permission to silently reintroduce mock or specialized UI.

## 3. Technology and local setup

The frontend presently uses **React 19, Inertia React 3, TypeScript, Vite 8, Tailwind 4, Node 22.16.0 (`.nvmrc`) and npm**. The source is a *Laravel-integrated frontend asset bundle*, **not a standalone React SPA**, independent API server, or mock login backend.

### Clone and verify the working tree

You need access to this **private repository**, Git, and a compatible Node/npm toolchain. In a terminal (PowerShell works as well):

```sh
git clone https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE.git
cd FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE
git switch main
git pull --ff-only origin main
node --version
npm --version
npm ci --no-audit --no-fund
npm run types:check
npm run build
```

Expected: npm install, TypeScript check and Vite asset build exit with code 0. If a command fails, **keep the logs and report the error**. Do not state PASS without an actual run. The historical GitHub runs are evidence for the *old staging SHA*, not automatically proof for later edits.

Development asset command:

```sh
npm run dev
```

This starts **Vite's asset/dev server only**; it does **not** implement login, sessions, municipal database, routes, or an Inertia HTTP server. A production asset build produces Vite bundles; it does **not** prove authenticated page rendering.

### Actual backend-mounted browser testing

To run login, Work Requests or any other real route in a browser, use an **approved disposable/dev instance of the canonical Laravel backend** with the correct database fixtures, its own PHP/Composer and web server setup, session/CSRF configuration, and its Inertia/Vite entrypoint connected to the frontend asset branch. Coordinate the exact approach and filesystem paths with Kirch/backend maintainers; **there is no supported drop-in standalone `npm run dev` authentication demo**. Do not wire a personal `.env` into version control, point a test script at production, or copy the obsolete PHP server from the original frontend source.

## 4. How AJ and Jhayr should upload their existing work

**Upload the real files you already made.** This is the immediate team request. Each person should deliver an attributable source submission **even if parts are unfinished**. No need to rewrite the entire UI or wait for the other person's work.

### Preferred: Git branches and pull requests

1. **Ensure you have access** to the private frontend workspace. If AJ cannot push, ask Kirch/Jhayr to grant the appropriate access through GitHub. Until then, provide a private source repository + exact commit or a securely shared archive to the coordinator. Do **not** post private LGU data, credentials, or sensitive archives publicly.
2. Clone/update the repo and start **your own issue-scoped branch from current `main`**. Example branch names: `AJ-FRONTEND-REG-001-EXISTING-WORK` and `JHAYR-FRONTEND-REG-001-EXISTING-WORK`. These are suggestions; use an existing authorized branch if one is already owned.
3. **Copy or port the actual UI files** you wrote into the correct `resources/js/**`, `resources/css/**`, `public/**` paths. Preserve original work where practical; reconcile duplicates intentionally. Include source tests, relevant SVG/image assets and package changes **only when actually needed**. Do not overwrite another developer's work without reviewing the diff.
4. Update [`docs/FRONTEND_IMPORT_REGISTER.md`](docs/FRONTEND_IMPORT_REGISTER.md) with **your name/handle, original source URL + exact commit/archive, included files, framework versions, changes relative to `main`, known gaps, and proof**.
5. Run `npm ci`, `npm run types:check`, `npm run build`, plus any actual tests available. Record results, not predictions.
6. Push **your branch**, open a **pull request into `main`**, link [FRONTEND-REG-001 #1](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/1) or a scoped follow-up issue, tag Jhayr for coordination and Kirch for final review. Give screenshots/recordings from a permitted non-production environment where possible.
7. Jhayr compares AJ's and his own PRs, resolves file conflicts without losing either person's features or authorship, and reports the combined integration candidate to Kirch.

Example commands **after you have added your files**:

```sh
git switch main
git pull --ff-only origin main
git switch -c AJ-FRONTEND-REG-001-EXISTING-WORK
# Copy your existing UI files into the correct resources/js, resources/css, public paths.
git status --short
git diff --check
npm ci --no-audit --no-fund
npm run types:check
npm run build
git add resources/js resources/css public docs/FRONTEND_IMPORT_REGISTER.md
git commit -m "feat(frontend): import AJ existing UI with source attribution"
git push -u origin AJ-FRONTEND-REG-001-EXISTING-WORK
```

**Jhayr:** substitute your own branch name and truthful author/commit message. If you add no files in a listed directory, `git add` may need narrower paths. Before committing, inspect `git diff --cached`. Avoid committing `node_modules/`, `vendor/`, `.env`, browser storage, auth/session tokens, private personal records, database exports, build outputs, or secret-bearing screenshots.

**Pull request description to copy and complete:**

```md
### Purpose / owning issue
- Contributor:
- Work item: FRONTEND-REG-001 #1 (or linked scoped issue)

### Original source & ownership
- Source repository/path and exact SHA or archive:
- Files/components actually authored:
- Existing assets reused, with attribution:

### Files added / changed
- ...

### Backend compatibility
- Canonical backend SHA checked:
- Inertia page/route/prop contracts used:
- Known missing/backlogged consumers:
- Mock/reference-only behavior (if any, clearly labeled):

### Verified commands (paste actual outcomes)
- npm ci:
- npm run types:check:
- npm run build:
- Backend-mounted browser smoke: PASS / FAIL / NOT RUN
- Screenshots/logs (no sensitive credentials or employee data):

### Limitations / requested review
- Conflicts and unresolved issues:
- Exact submitted commit SHA:
- What needs Kirch's decision:
```

### Alternative: GitHub's web interface

If a small number of files must be uploaded without the Git CLI: on GitHub, open **this private repo**, select **your own new working branch (not `main`)**, choose **Add file → Upload files** (or **Create new file** for a single text file), maintain the correct paths, commit **to that branch**, and open a PR. Prefer Git for larger component trees and renamed files. GitHub access permissions still apply; a web upload is **not** a substitute for source provenance or passing tests.

**If you cannot push:** post a brief update to [import issue #1](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/1) with **where your existing work can be accessed by authorized team members and what is inside**, then request access/transfer help. Do not upload a public ZIP of client code or misrepresent another person's work as your own.

## 5. Use existing, verified backend producers — do not invent new endpoints

The canonical backend controls actual Laravel routing, authorization, response fields, domain rules, and data access. Read these **existing repository** documents in order:

1. [Contract family manifest](docs/contracts/ONE_TALIBON_FRONTEND_CONTRACT_PACK_R1/CONTRACT_MANIFEST.md) — what each family is and what is excluded.
2. [Backend producer verification register](docs/contracts/ONE_TALIBON_FRONTEND_CONTRACT_PACK_R1/BACKEND_PRODUCER_VERIFICATION.md) — exact-source route/serializer/permission/transport observations.
3. [24-family publication review](docs/contracts/ONE_TALIBON_FRONTEND_CONTRACT_PACK_R1/PUBLICATION_REVIEW_R1.md) — import reference vs restricted/held vs excluded. **Source-observed does not equal contract accepted.**
4. [Contract/authority holds](docs/contracts/ONE_TALIBON_FRONTEND_CONTRACT_PACK_R1/AUTHORITY_AND_INTEGRATION_HOLDS.md), [mock exclusions](docs/contracts/ONE_TALIBON_FRONTEND_CONTRACT_PACK_R1/SHOWCASE_REFERENCE_EXCLUSIONS.md) and [frontend adoption map](docs/contracts/ONE_TALIBON_FRONTEND_CONTRACT_PACK_R1/FRONTEND_STARTER_MAP.md).
5. [Backend intake register](docs/BACKEND_CONTRACT_INTAKE.md) for **the one formally released backend Task contract**, and its still-missing frontend integration tests.

| UI area | Existing backend source / transport | Practical instruction |
| --- | --- | --- |
| Login + MFA | `/login`, `/logout`, `/security/mfa/*` via Laravel web/Inertia | Reuse verified same-origin session + CSRF. Never log MFA secrets/recovery codes. |
| Dashboard | `GET /dashboard` Inertia | Adapt to actual **role-discriminated** props, including office/executive/system variations; test each role. |
| Work Requests / My Work | `/transactions`, `/transactions/{id}/live` | **NOT** personal `/tasks`. List is 25-per-page, actor-scoped; live endpoint is JSON. |
| Correspondence | `/correspondence`, workspace redirects; separate direct JSON lifecycle | Never conflate camelCase Inertia DTOs, snake_case JSON or redirecting form submissions. |
| Records + Documents | `/records`, `/documents`, protected file download | Keep actor-scope and protected document rules. Staged UI does **not** cover every later Documents page. |
| Memoranda | `/memoranda` | Read `authority.canPublish`, server-issued suggested number and allowed audiences. |
| Calendar | `/calendar` | Backend emits `events,calendar` — **not** legacy `summary`; adapt before calling feature working. |
| Messaging | `/messages/feed` JSON | Membership/privacy enforcement is not established; do **not** describe channels as confidential. UI not imported. |
| Notifications | `/notifications/feed` JSON | Shared props **do not** supply the old notification feed; fetch safely, handle timeout/session expiry, support heterogeneous items. |
| Personal Tasks | `/tasks` JSON, formally released A01-C1 backend only | No accepted UI consumer; do not conflate with Work Requests or invent Task delegation. |
| `/api/v1` | Machine-only integration | **Never** use machine tokens or credentials from the browser. |

**Outside current common frontend integration scope:** public reference portal, Procurement/Plans/PPAs prototype collections, unresolved department operational workflows, HRIS/private employee profiles, specialized Travel Orders/Property/Legislative, privileged Mayor/Administration/Audit/Reports pending individual authority. Presence of backend routes or an old UI mock is not permission to claim an official live module.

When an accepted backend page name has no corresponding `resources/js/pages/<Name>.tsx`, **identify it and coordinate the missing consumer**. Don't “fix” the gap by inventing an endpoint or inserting static sample records.

## 6. Known quality issues: fix these before calling the integrated frontend ready

The previous [source-level REWORK review on PR #5](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/pull/5#issuecomment-6080532978) identified the following concrete defects **even though Node CI passed**:

| Priority | File / behavior | Required rework |
| --- | --- | --- |
| **P0** | `resources/js/layouts/AppLayout.tsx`: assumes `pageProps.notifications`, `pendingMemo`, count fields exist | Backend no longer shares the old feed. Initialize safe defaults, fetch `/notifications/feed`, handle 401/MFA/errors; no `undefined.filter` crash. |
| **P0** | `resources/js/pages/Calendar/Index.tsx`: reads `summary.*` | Canonical returns `{events,calendar}`; adapt prop schema/view and date handling. |
| **P1** | `resources/js/navigation/portalNavigation.ts` and Dashboard quick actions | Excluded/not-imported Admin, Audit, Reports, Mayor Office, Travel Orders and department workspace can still be linked by legitimate backend permissions. Separate available vs not-yet-imported consumers, coordinate server/asset compatibility. |
| **P1** | `resources/js/pages/Memoranda/Index.tsx` | Use `authority.canPublish` rather than nonexistent top-level `canPublish`. |
| **P1** | `resources/js/pages/Memoranda/Create.tsx` | Use **server `suggestedMemoNumber`** and `authority.allowedAudienceTypes`; do not generate a random reference or default department users to all-employees audience. |
| **P1** | `resources/js/pages/Correspondence/Index.tsx` | Server's default overview has an intentionally empty `records` paginator. Show actual `overview` or verified alternate list view; no false “zero visible correspondence”. |
| **P2** | Work Request live polling | Do not show a permanent “Live status” badge after 401/403/419/non-JSON/network failure; show stale/session-expired states. |
| **P2** | MFA settings controls | Confirm destructive/reset/recovery code regeneration actions with appropriate security UX; test back-end policy in approved environment. |

**Definition of a fixed defect:** actual source correction + relevant fixture/role case + a fresh build + an authenticated backend-mounted test when applicable, on the *same exact frontend SHA*. Merely changing types until TypeScript compiles is **not** a runtime fix. Do not remove error handling to obtain green CI.

## 7. How to coordinate work efficiently (no duplicate audits)

1. Jhayr starts from `main`, confirms what imported source exists, asks AJ to upload **all existing work**, and inventories missing items in [import register](docs/FRONTEND_IMPORT_REGISTER.md).
2. Split owned changes into focused PRs: **shell/auth/MFA/notification safety**, **Calendar/Records**, **Work Requests/Correspondence**, **Memoranda**, then route/page coverage and QA. Teams may parallelize where files do not conflict.
3. Frontend contributors adapt consumers to verified producer shapes while backend engineers handle *backend* contract bugs on independently authorized branches.
4. Changes that would invent municipal policy (finance, approvals, procurement, HRIS, channel privacy, office authority, production integration) must be marked **HOLD / needs Kirch and LGU decision**.
5. Every PR: clear scope, source/author credit, screenshot where appropriate, reproducible tests, exact frontend and backend SHAs, known defects, safe fallback behavior. Merge only after Kirch review under [CONTRIBUTING.md](CONTRIBUTING.md).

Suggested first rework: fix the **notification shared-props runtime crash** and **Calendar `summary` mismatch**. Until those are fixed, an all-green Node build must not be presented as a functional municipal portal.

## 8. Quality and acceptance checklist

Before asking Kirch to accept an integrated screen or major import, submit:

- [ ] Original work uploaded by AJ/Jhayr with exact source and actual authorship; conflict resolution documented.
- [ ] Current `main` and canonical backend SHA checked; no unrelated file changes or secrets.
- [ ] Node dependency installation, TypeScript and production build **actually passed** on the candidate commit.
- [ ] Exact Laravel route name / HTTP method, auth/CSRF/MFA/policy and Inertia/JSON/download/redirect transport verified.
- [ ] Every imported server-rendered Inertia page has a matching component, or the missing page is explicitly blocked/handled without false navigation.
- [ ] Real user-role flows tested: employee, department head, executive and admin where authorized; empty/loading/error states are safe.
- [ ] 401/403/404/419/422, ownership/office boundary, MFA pending, session expiry, upload/download and validation negatives checked where relevant.
- [ ] No placeholder “official” records, fake workflow completion, invented business rules, secret logs or unapproved machine API usage.
- [ ] Desktop and mobile screenshots/recordings from **authorized nonproduction data**; accessibility and responsive checks performed.
- [ ] Fresh CI/job links, actual logs and incomplete checks marked **NOT RUN**.
- [ ] Pull request reviewed by Kirch; approval/merge recorded without claiming an independent QA gate that did not occur.

### If something is blocked, report it like this

```text
Screen/feature:
My branch and exact commit:
Canonical backend SHA:
Verified route / contract family:
Expected vs actual payload or UI behavior:
Reproduction steps (role, environment, no credentials):
Error/log or screenshot:
What I already tried:
What I need Kirch/backend to decide:
```

**Do not stop all frontend work because one LGU decision is pending.** Work on unrelated safe components while the blocked area stays disabled and explicitly documented.

## 9. Documentation and history

- [FRONTEND-REG-001 — import and upload issue](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/1)
- [Contract publication control — Tech Lead issue #3](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/3)
- [Original frontend staging PR #5](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/pull/5) — source provenance, original passing CI and **REWORK** findings (historical)
- [Lucien producer/contract PR #4](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/pull/4) — source observations, 24-family decision matrix and exclusions (historical)
- [Developer contribution rules](CONTRIBUTING.md)
- [Original import register](docs/FRONTEND_IMPORT_REGISTER.md)
- [Source and runtime limitations](docs/STAGED_FRONTEND_RUNTIME.md) — staging-era evidence, not a current branch status tracker

**Final team instruction:** AJ and Jhayr, **upload your own completed and in-progress frontend files now**, on separate attributable branches/PRs, and continue adapting the real existing UI to canonical backend contracts. Kirch will review integration evidence; no one should have to rebuild your work from screenshots or invent the LGU's business rules.
