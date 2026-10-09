# FRONTEND-REG-001 — Source inventory

**State:** Kirch-assisted staging candidate prepared on separate branch. AJ and Jhayr contribution/ownership inventory is **still pending**; staging source does not attest their individual authorship, build results or acceptance.

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
- **Target:** same frontend team repository, isolated branch `KIRCH-TALIBON-FRONTEND-REG-001-EXISTING-UI-STAGING-R1` (pending PR). Backend authority stays `Project-Intra-Smithy/Talibon-Sales-Prototype@7b4ebb838982f6262b9fef65d18ba57488ebf941`, source-observed contract adoption [Lucien DRAFT PR #4](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/pull/4), NOT an alternative backend.
- **Explicitly NOT copied:** Laravel `app/`, `routes/`, `database/`, `bootstrap/`, backend `config/`, `vendor/`, API auth/credentials, PHP controllers, and showcase `Public/*`, static procurement/plans/PPAs, HRIS/DTR/Payroll, Travel Orders, Property, Legislative, Mayor Office, privileged Admin/Audit/Reports, authority-pending department workflow and operational mock pages. Current original source did not contain every later canonical page, e.g. Documents/Messaging views; missing pages require evidence-based adaptation, not invented endpoints.
- **Staging scope:** **source import candidate, not accepted consumer tuple.** Vite bundles React assets; canonical Laravel/Inertia session backend is required for real login and page rendering. No one may infer standalone React SPA support or approved operational feature acceptance from successful compilation.
- **Next Jhayr/AJ coordination:** review attribution/per-file imports, inspect shared props and exact backend contract deltas, run `npm ci`, `npm run types:check`, `npm run build`; then authenticated browser desktop/mobile screenshots on a *disposable or approved environment*. Report actual evidence rather than guess.
