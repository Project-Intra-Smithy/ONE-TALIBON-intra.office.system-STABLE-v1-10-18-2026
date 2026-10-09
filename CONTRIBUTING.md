# Contribution and task documentation rules

## Work items

Use **one issue per deliverable**. Title: `[ID] Action + result` (example: `[FRONTEND-REG-001] Import login UI`).

Each issue contains only:

| Field | Required content |
| --- | --- |
| **Outcome** | One sentence describing what will exist |
| **Owner** | GitHub account responsible for delivery |
| **Scope** | Specific files/components, or `TBD after inventory` |
| **Done when** | Measurable acceptance checks |
| **Dependencies** | Only genuine blockers; link the owning issue |
| **Evidence** | PR, source SHA, commands/results or screenshots |

Keep issue bodies short. Put design details in one linked document, not repeated in every issue. **No repeated authority statements, status essays, ornamental headings or copied histories.** GitHub state/assignee fields show the current status/owner; comments record only decisions, blockers, or test evidence. Update the issue body when scope changes; do not append another summary comment. Avoid duplicating the same plan across repositories.

## Branches and PRs

- Recheck this repository's `main` before branching. Branches are scoped to an issue.
- Import the existing work; do not rewrite it without a documented reason.
- Preserve actual source/author attribution. Record source repository and commit/archive.
- Keep PRs small: **purpose, changed files, tests/evidence, risks, linked issue**.
- Do not merge directly to `main` without Kirch's review.
- Never commit credentials, `.env` secrets, private LGU data, dependencies or build output.
- Report real commands and outputs. Do not copy another repository's CI result.

## Integration rule

UI-only login is not validated authentication. A01-C1 individual Task HTTP is **formally released on the canonical backend**, but this frontend has **no accepted Task consumer**; unknown Task screen actions remain unavailable, not invented or silently mocked as production. See [backend contract intake](docs/BACKEND_CONTRACT_INTAKE.md) and the [source-backed frontend reference pack](docs/contracts/ONE_TALIBON_FRONTEND_CONTRACT_PACK_R1/CONTRACT_MANIFEST.md). Integration requires verified route/contract, exact backend+frontend SHAs and actual authenticated tests.

**Current first task:** [FRONTEND-REG-001 #1](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/1). **AJ and Jhayr must upload what they have already built** on separate attributed branches/PRs (see the [README contributor upload guide](README.md#how-aj-and-jhayr-should-upload-their-existing-work)). Jhayr can proceed; AJ's access is not a blocker to Jhayr's work. The imported development baseline was build-verified but has outstanding runtime REWORK defects; merge to main does **not** mark those repaired.
