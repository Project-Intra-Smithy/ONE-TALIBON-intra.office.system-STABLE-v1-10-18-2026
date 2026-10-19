# ONE TALIBON — Whole-product candidate integration source manifest (R1)

- Technical authority: Kirch Ivan Balite.
- Mode: nontriggering source integration only; NO hosted CI, merge, deployment, production actions, or Messaging activation.
- Backend main source: `8a130e151fdf79e87e134a5d26e58667889f0a7e` (preserve current documentation and history).
- Frontend main source: `dc5950ce73a4b6342fd8f2e4e21a4a59ae28f62c`.
- Fully assembled frontend candidate: `eb0875822afe697a03c4d6781692133483710f51` (PR34 + PR35, PR38 header identical; shared Task test selectively reconciled).
- Backend PR92: `964ee473e226bcf320c7c45c44e1e06f1e3abcc8`.
- Accepted R17 application: `2145fcb797c4cd5e173dad24b7da876a93f2814d` (excludes the unexecuted CI-only child).
- Public/auth refinement PR99: `48fb7bbaab1cc9ffd8821a5de1c714b8214e0c5f`.

## File-level precedence

1. Begin at current backend main. Apply all 90 net R17 changed paths; PR92 implementation is R17's parent contribution. Do not overwrite latest main documentation.
2. From PR99 apply public homepage, Login/MFA source/CSS, photograph, static homepage CSS, public header/hero and browser test plus its evidence record. Preserve main's current work-package records; retain existing Node script semantics and register the AJ browser test as `test:aj-home-auth` only.
3. Frontend PR34 dashboard composition is mostly byte-identical to R17. Prefer R17 for `Dashboard.tsx`, `AppLayout.tsx`, sidebar and `phase-one-shell.css`: these carry accepted Task mutation, office identity and corrected UI boundary handling.
4. Preserve R17's restricted Messaging and Correspondence middleware/routes/configuration, with backend 403/no-write security authority. No Messaging activation.
5. From assembled FE port exactly four bounded, differing presentation consumers: `resources/js/components/documents/DocumentCollectionNav.tsx`, `resources/js/components/documents/documentCenterPresentation.ts`, `resources/js/components/shell/PortalTools.tsx`, `resources/js/pages/Transactions/Index.tsx`.
6. Do not port standalone FE preview fixtures or visual-preview HTML into deployable backend; fixture isolation is retained in FE candidate only. Do not replace backend `PersonalTaskMutationPanel` with FE `TaskMutationControls` without authenticated contract verification.
7. PR36 remains an independent browser harness source, not an accepted runtime result. CI-only R17 child `969b558800e6c4ca3cc6c305db24079f012595e6` is held separately.

## Mandatory HOLD gates

- Full frontend and backend TypeScript checks, Node tests, Vite production builds.
- Laravel feature and security checks, PostgreSQL 16 migrations, 33 department identities and FK integrity.
- Verified auth/MFA/CSRF, P0–P4 Task/Work Request, restricted 403/no-write behavior, desktop/mobile Q0–Q7 Chromium.
- All test commands/exits and defects must be attached to exact candidate SHAs. This manifest does not imply execution or acceptance.
- Separate independent source review, human integration approval, and postmerge verification remain required before either mainline promotion.
