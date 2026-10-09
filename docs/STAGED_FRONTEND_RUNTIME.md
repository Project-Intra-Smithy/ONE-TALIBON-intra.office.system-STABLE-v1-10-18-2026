# FRONTEND-REG-001 — staged existing React/Inertia frontend (NOT YET ACCEPTED)

**Staging branch:** `KIRCH-TALIBON-FRONTEND-REG-001-EXISTING-UI-STAGING-R1` in the frontend team's private repo. **Canonical Laravel backend:** `Project-Intra-Smithy/Talibon-Sales-Prototype@7b4ebb838982f6262b9fef65d18ba57488ebf941`. **Original source:** `Kirch-Nairu/Talibon-Intra-Office-Portal@a7d7be17feb435b50c52cacd063e11d92ad047e1`. Human integration/release owner: Kirch. Jhayr coordinates import and adjustment; AJ supplies and verifies his existing contributions.

## This repository now has real frontend code ON THE STAGING BRANCH

The selected existing React 19 + Inertia 3 + TypeScript/Vite 8 + Tailwind 4 login, MFA, dashboard, application shell/navigation, active-directory, Work Request, Correspondence, Records, Memoranda and Calendar components/pages have been copied from the historical original frontend. The staging code is **a starting implementation**, not proof of compatibility with newer canonical backend source. Do not silently change the verified backend to conform to an older screen.

Run from this frontend repository checkout:

```sh
npm ci
npm run types:check
npm run build
```

To develop authenticated screens, run the **approved canonical Laravel backend separately** with a configured disposable/dev database, session, CSRF and Inertia rendering, and wire its Vite asset entrypoints to the staging frontend. A standalone `npm run dev` starts Vite for assets, **not** a functional login/dashboard HTTP server. Staging intentionally does not duplicate Laravel web routing, controllers, middleware, schemas, migrations or credentials. Do not copy PHP from the old repository as a shortcut.

## Backend compatibility targets and holds

- Auth `GET/POST /login`, logout, MFA enroll/challenge/settings. Exact session/MFA source contract controls; recovery secrets are one-time sensitive data, not fixtures.
- Dashboard `GET /dashboard`, shared Inertia props with actor-dependent UI projections. Missing attributes must be traced to canonical producer.
- Work Requests use `/transactions`, **not** A01-C1 `/tasks`; preserve redirects and live JSON shape differences.
- Correspondence workspace supports Inertia and redirecting mutations; direct lifecycle is separate native JSON.
- Records, Calendar and Memoranda are source-backed references with future integration tests required.
- C23 A01-C1 `/tasks` is **backend released, frontend unconsumed**. Task screen was NOT imported/implemented.
- No `/api/v1` browser tokens or machine integration credentials.
- Use [source-backed contract draft PR #4](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/pull/4) and its `PUBLICATION_REVIEW_R1.md` only as **review reference**, not blanket contract release. Family-specific approval remains Kirch's decision.

**Excluded from this candidate:** public prototype homepage, static procurement/plans/PPAs, concept future-systems, authority-pending operations/meetings/department workflow, HRIS/private profile, Property, Legislative, Travel Orders, Mayor's Office, administrative/audit/reporting workspaces. These remain reference/historical/specialized in the canonical repository; **their omission from frontend staging does not delete server behavior**. Shared dashboard/header components may include source-conditional role presentations; no extra business authority granted.

## Validation and handoff (owner: Jhayr; reviewer: Kirch)

1. Confirm exact source attribution with AJ/Jhayr; preserve actual commit authorship. Record per-file differences and adapt frontend DTO types to pinned producer evidence.
2. Run Node workflow: `npm ci`, `npm run types:check`, `npm run build`. A GitHub Actions check is prepared; pass/fail evidence must be inspected after the push.
3. Verify backend-mounted Inertia page resolution: login, MFA enrollment/challenge, dashboard for each role, errors and permitted common screens. Some canonical pages did not exist in old asset and are **not implemented by this import**.
4. Run 401/403/404/419/422 and MFA/ownership negative tests in a disposable environment; don't reuse production credentials or databases.
5. Produce reviewed scoped PR, exact integration tuple, desktop/mobile screenshots and test logs. **Only Kirch explicitly accepts FRONTEND-REG-001**. This staging PR alone is **not** accepted baseline, Task frontend delivery or deployment approval.

## Known limitations

- Existing frontend import does not itself prove compatibility with backend `7b4ebb838982f6262b9fef65d18ba57488ebf941`, which contains later behavior.
- No independent QA/CI evidence supplied at staging time; any GitHub check results must be reviewed.
- If frontend shell links to excluded or later canonical routes, hide/disable these *by authoritative available backend route/permission*, not by inventing them, and record gaps. Avoid representing showcase data as official.
