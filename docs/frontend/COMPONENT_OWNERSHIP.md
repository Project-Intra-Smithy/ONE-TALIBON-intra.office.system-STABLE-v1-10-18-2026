# FE-BASE-01 — component ownership and coordination

Initial workstream boundaries for [#17](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/17), 12 October 2026 (Asia/Shanghai). Based on frontend `49ba8cafd7ad14e85984466907bc573f42d1d659`; live main at preflight `e6f5947ab330802f4b860b28baddc910ca32e13e`. See [architecture/evidence](ARCHITECTURE_BASELINE.md) and [START/CLOSE memory](../WORK_PACKAGE_CONTINUITY.md).

These are the user's intended delivery boundaries, not claims of GitHub assignment, permission, authorship or technical acceptance. AJ (`rynzz22`) and Jhayr (`kyumw3b`) retain their actual contributions; Codex is the documentation executor. Kirch retains technical acceptance/integration authority.

| Owner | Workstream | Initial file boundary / coordination |
| --- | --- | --- |
| AJ | FE-BASE-01 #17 | This baseline, this ownership map, the maintained consumer-contract traceability supplement and append-only continuity. Documentation only. |
| AJ | FE-AUTH-01 #18 | `resources/js/pages/Auth/Login.tsx`; coordinate any shared CSS/brand primitive request with Jhayr before edits. Preserve `useForm` fields, POST `/login`, errors and processing semantics. |
| AJ | FE-AUTH-02 #19 | `resources/js/pages/Auth/MfaChallenge.tsx`, `MfaEnrollment.tsx`, `MfaRecoveryCodes.tsx`, `MfaSettings.tsx`; presentation within its scoped START, no MFA lifecycle/security change. |
| AJ | FE-DASH-01 #22 | `resources/js/pages/Dashboard.tsx` and `resources/js/components/dashboard/`; agree shared types, navigation and notification context changes with shell owner. |
| Jhayr | FE-UI-01 #21 | `resources/css/{app,municipal,municipal-controls,visual-system}.css`, `resources/js/components/{PageFrame,PageHeader,MunicipalBrand,AppearanceControl}.tsx`, `resources/js/theme/` and `resources/js/branding/` as scoped by that issue. Preserve all consumers. |
| Jhayr | FE-SHELL-01 #20 | `resources/js/layouts/AppLayout.tsx`, `resources/js/components/shell/`, `resources/js/navigation/`; contract/type/polling edits require an agreed file owner and separate scope where needed. |
| Shared | FE-QA-01 #23 | Existing `tests/*.test.mjs`, `scripts/verify-visual-preview.mjs`, fixture/browser evidence. Assign one editor per shared file before work; evidence must identify exact source and frontend-only versus backend-mounted checks. |

The rows identify likely touch points, not blanket permission to edit every listed file. F01/F02 Task implementation and unrelated domain pages remain outside these workstreams unless separately authorized. No changes to GitHub assignees are made.

## Collision map

| Likely conflict paths | Workstreams | Coordination requirement |
| --- | --- | --- |
| `resources/css/*.css` | #18/#19/#22 with #21 | Jhayr owns shared token/control edits; AJ agrees narrowly scoped selectors or submits a separate coordinated patch. Do not independently rewrite auth/global styles. |
| `resources/js/components/PageFrame.tsx`, `PageHeader.tsx` | #21 with #20/#22 | Preserve exported props, density and existing caller behavior; review all touched consumers before changing shared APIs. |
| `resources/js/types.ts`, `components/dashboard/types.ts` | #20/#22/#23 | Identify producer evidence before narrowing/adding fields. One agreed editor; no fixture-derived server contracts. |
| `resources/js/layouts/AppLayout.tsx`, `components/shell/NotificationContext.ts`, `compat/notificationFeed.ts`, `hooks/useVisiblePolling.ts` | #20/#22/#23 | Jhayr coordinates shared feed semantics; AJ consumes context. Server permissions and error/session behavior remain authoritative. |
| `resources/js/navigation/portalNavigation.ts`, `stagedRoutes.ts` | #20/#22 and separately owned Task lanes | Preserve destination identities/readiness and permission associations; recheck live main/PR changes before touching. No Task routing changes through these workstreams. |
| `resources/js/app.tsx`, `theme/`, `branding/` | #18/#20/#21 | Agree entrypoint, appearance and asset integration once; avoid competing initialization or resolver changes. |
| `resources/js/visual-fixtures.ts`, `visual-preview.tsx`, `tests/*.test.mjs`, `scripts/verify-visual-preview.mjs` | #18–#23 | One writer per file per checkpoint. Keep synthetic labels and no real credentials/MFA secrets; fixtures never override backend truth. |
| `package.json`, `package-lock.json`, `vite.config.ts`, `.github/workflows/frontend-staging.yml` | All | No changes in BASE-01. Dependency/CI edits need an explicit scoped need and coordinated ownership; don't add a script just to hide the requested `types` mismatch. |
| `docs/WORK_PACKAGE_CONTINUITY.md`, maintained contract pack | All | Append package-specific records; preserve history, recheck remote before push, resolve overlapping additions without dropping either record. |

## Working agreement and remaining gates

1. Use each package's owning issue and reciprocal START memory; check live main and relevant PR head/base before edits. This branch is deliberately not silently updated to main during BASE-01.
2. State files being edited and the receiving owner on the issue before overlapping work. Handoff includes exact SHA, preserved changes, tests and blockers; one active writer per shared file.
3. Keep source attribution. Do not copy another contributor's uncommitted changes, rewrite author identity, force-push over their work or infer account permission from these names.
4. Review narrowly scoped diffs together; retain server contract references and rerun relevant existing checks. Resolve shared-file conflicts with the other owner before submission; Kirch decides integration, and this package performs no merge.
5. AJ/Jhayr traceability review, exact runtime tuple and Kirch acceptance remain outstanding. Engineering Hub #63 could not be read with current CLI access; canonical START/CLOSE protocol was read. No authority decision is inferred from that access gap.

Single next development task after baseline review: AJ **FE-AUTH-01 #18**, with Jhayr coordinating any shared CSS. Deferred browser/keyboard/mobile/session evidence belongs to #18/#19/#20/#22 as appropriate and shared #23; reopen when an authorized nonproduction backend-mounted candidate is available. No backend auth lifecycle or F01/F02 work is released by this document.
