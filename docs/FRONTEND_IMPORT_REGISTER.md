# FRONTEND-REG-001 — Source inventory

**State (development baseline):** Existing React/Inertia UI source was staged on PR #5 and selected for publication into shared frontend `main` by Kirch on 09 October 2026. **It is not runtime/integration accepted. AJ and Jhayr must now UPLOAD their own existing work on attributable branches and open PRs.** Contributor-by-contributor source ownership inventory is still pending; imported historical code is not evidence that either developer authored every file.

| Contributor | Existing work | Source link + exact commit/archive | Framework + commands | Ready / gaps |
| --- | --- | --- | --- | --- |
| AJ (`@rynzz22`) | To confirm | Pending | Pending | Pending |
| Jhayr (`@kyumw3b`) | To confirm | Pending | Pending | Pending |

## Compatibility decision

Before combining submissions, confirm framework, versions, routing, app entrypoint, styling, shared components and any incompatible dependencies. If the imports conflict, document the resolution for Kirch's review.

## Each import PR records

- Owner and exact source identifier;
- Imported files and attribution;
- Starting and resulting commit SHA;
- Install/build/test commands with actual results;
- Desktop/mobile proof, missing functionality and security gaps.

**Done when:** Login, dashboard and other confirmed existing UI work run in this workspace; imports are reviewed, documented and demonstrated. UI-only behavior is not proof of real backend authentication.

[Owning task #1](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/1).

## Staging candidate — Kirch's old frontend asset (not Jhayr/AJ source attribution)

- **Source:** private existing frontend asset [`Kirch-Nairu/Talibon-Intra-Office-Portal@a7d7be17feb435b50c52cacd063e11d92ad047e1`](https://github.com/Kirch-Nairu/Talibon-Intra-Office-Portal/tree/a7d7be17feb435b50c52cacd063e11d92ad047e1); selectively copied **only** `resources/js` login/MFA/dashboard/shell and common operational UI, matching CSS, Vite/TypeScript/npm lock and static placeholder assets. Source owners/authors of individual files are **not independently proven**; do not attribute all old work to AJ/Jhayr.
- **Target:** same frontend team repository, isolated branch `KIRCH-TALIBON-FRONTEND-REG-001-EXISTING-UI-STAGING-R1` / [PR #5](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/pull/5), retained as provenance; **work forward from current `main` after merge**. Backend authority stays `Project-Intra-Smithy/Talibon-Sales-Prototype@7b4ebb838982f6262b9fef65d18ba57488ebf941`, source-observed contract adoption [Lucien source-backed contract PR #4](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/pull/4), NOT an alternative backend.
- **Explicitly NOT copied:** Laravel `app/`, `routes/`, `database/`, `bootstrap/`, backend `config/`, `vendor/`, API auth/credentials, PHP controllers, and showcase `Public/*`, static procurement/plans/PPAs, HRIS/DTR/Payroll, Travel Orders, Property, Legislative, Mayor Office, privileged Admin/Audit/Reports, authority-pending department workflow and operational mock pages. Current original source did not contain every later canonical page, e.g. Documents/Messaging views; missing pages require evidence-based adaptation, not invented endpoints.
- **Staging scope:** **source import candidate, not accepted consumer tuple.** Vite bundles React assets; canonical Laravel/Inertia session backend is required for real login and page rendering. No one may infer standalone React SPA support or approved operational feature acceptance from successful compilation.
- **Prior staging build evidence:** [push CI 37924165911](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/actions/runs/37924165911) and [PR CI 37924238397](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/actions/runs/37924238397) both passed npm install, type-check and build **at old staging SHA `1172a1a7e0f4605233ab98fea9a24ac2e29fa823` only**, not at future contributor commits.
- **Next Jhayr/AJ coordination:** Each developer **uploads actual existing UI source** as a scoped GitHub PR to this frontend repo with source URL/SHA, file attribution and changed file list. Review import conflicts; inspect shared props and exact backend contract deltas; re-run `npm ci`, `npm run types:check`, `npm run build` on each new SHA. Authenticated browser desktop/mobile tests only on a disposable or approved environment; report actual evidence rather than guess. [See upload walkthrough](../README.md#how-aj-and-jhayr-should-upload-their-existing-work).
- **Known open REWORK:** AppLayout notification shared props; Calendar obsolete summary prop; missing mapped components for authorized routes; Memo list/creation props; Correspondence overview; live polling error visibility; MFA confirmation. [Exact PR #5 findings](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/pull/5#issuecomment-6080532978).
