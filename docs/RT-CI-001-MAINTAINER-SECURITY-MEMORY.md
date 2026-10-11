# KIRION FORGE — RT-CI-001 Maintainer Security Memory

**Date:** 2026-10-11 (Asia/Manila). **Type:** bounded MAINTAINER CHECKPOINT / independent source-and-security audit. **Disposition:** `CREDENTIAL HOLD / ACTIVATION TRUST BOUNDARY NOT ESTABLISHED / NO RUNTIME ACCEPTANCE`.

**Owner and authority:** Kirch Ivan Balite (`Kirch-Nairu`) remains sole human Technical Authority and runner operator. Kirion-Lucien implemented bounded CI source; Kirion-Jane reviewed Laravel/security contract assumptions; Kirion-Nox independently reviewed source and activated a separate security HOLD. This memory record does not impersonate their decisions or grant new implementation authority.

**Owning issue:** [frontend #10](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/10); [audit START checkpoint #6106251015](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/10#issuecomment-6106251015). **Candidate:** [draft PR #11](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/pull/11). **Independent approval:** [NOX source-only review #5482015993](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/pull/11#pullrequestreview-5482015993). **Governing activation HOLD:** [NOX Issue #10 comment #6105957037](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/10#issuecomment-6105957037).

## 1. Exact live readback at takeover

| Surface | Verified state |
| --- | --- |
| Official frontend repository | `Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE` — private |
| Frontend default branch | `main@9fff20feeb647c3de140603ad76d775caeaba5db`, `protected: false` |
| CI implementation branch | `forge/frontend-reg-001-runtime-ci-r1@a00877bf6f393e835557e983aabdd20945835562` |
| CI PR | #11, OPEN / DRAFT / UNMERGED, eight authorized paths |
| Pinned reviewed frontend UI source | draft PR #9 `d66c677c830b84326765cee9046b018a7c0ab91d` |
| Pinned canonical Laravel backend | `Project-Intra-Smithy/Talibon-Sales-Prototype@92778ba06d992c278177e0354014ab1b77dbea82`; backend `main` at that SHA, untouched |
| New-head Actions activity | zero workflow runs returned for `a00877bf...`; combined commit statuses empty |
| Credential | GitHub Actions secret `RT_CI_BACKEND_CONTENTS_READ_TOKEN` presence/scope NOT VERIFIED via accessible connector |
| Human CI billing evidence | Previous operator screenshot reports Actions $0 overage hard-stop / Stop usage YES and 421 of 2,000 minutes used at capture; **not** a live billing API read |

The three older failed zero-job GitHub workflow records were due to unsupported job-level `runner.temp` interpolation. Lucien corrected that expression by setting `RTCI_REPORT_DIR` through `$GITHUB_ENV` in the first Bash step; NOX approved the corrected code SHA. **New-head workflow registration acceptance remains unproven; real Laravel/PostgreSQL/Chromium tests have NOT RUN.**

## 2. Source scope and design observations

PR #11 contains `.github/workflows/frontend-reg-001-runtime-acceptance.yml`, `docs/WORK_PACKAGE_CONTINUITY.md`, four helpers/manifest under `scripts/ci/frontend-reg-001/`, and two tests under `tests/runtime-acceptance/`.

The candidate workflow declares only `workflow_dispatch`, standard GitHub-hosted `ubuntu-latest`, `timeout-minutes: 30`, read-only default `contents`, reviewed exact source SHA gates, PostgreSQL service, disposable database preflight, and read-only private backend checkout. Its selective overlay manifest lists 33 file paths with blob/hash checks. Source-level tests verify declarations; none constitutes live integration evidence. Destructive Laravel migration is specified only against an ephemeral PostgreSQL test target after preflight; exclusive service ownership must still be confirmed by the actual run. Browser negative cases include MFA, CSRF, task-ownership and logout assertions; `RATE_LIMIT_HTTP_429` and `RECOVERY_CODE_REPLAY` are explicitly NOT RUN.

No source-level finding here reverses NOX's exact-head source approval. This checkpoint concerns **credential placement**, not permission to modify approved workflow code.

## 3. Credential trust boundary: material HOLD

GitHub documents that *repository-level Actions secrets are usable by eligible workflows in that repository*, rather than being restricted to a named workflow. This is not proof that today's other workflows actually read the proposed secret: a malicious or modified workflow would have to reference/otherwise expose it. Forked PR secret restrictions do not establish safety for untrusted **same-repository** contributors.

Live `main` contains `.github/workflows/frontend-staging.yml`, triggered by pushes to `main` and its named staging branch and by qualifying pull requests. It installs npm dependencies and executes typecheck/build. The old cleanup workflow is manual-only and non-sensitive. A workflow writer with unreviewed eligible branch access could change a job or consumed code to leak secrets after a repository credential is installed, depending on Actions permission and trigger policy. The manual-only RT-CI job guard **does not isolate the credential from other workflows**.

Live read-only permission probes under `Kirch-Nairu` reported:
- `Kirch-Nairu`: `admin`;
- `Kirion-Nox`: `admin`;
- `Kirion-Lucien`: `write`;
- `k3nchinxd`: `write`;
- `Kirion-KimiForge`: `null` / not independently confirmed (not evidence of zero access).

**This is not a complete census.** Collaborator enumeration, team permissions, inherited organization privileges, repository Actions secret list and settings were not available through the current connector. Live `main` reports `protected:false`; ruleset read returned HTTP 403 requiring plan upgrade. GitHub Free private repositories cannot use GitHub environment secrets as an isolation substitute. Never describe branch review rules, CODEOWNERS or procedural Forge instructions as server-enforced when unverified.

External rules: [GitHub secrets types](https://docs.github.com/en/code-security/reference/secret-security/secret-types), [GitHub environment availability](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments), [GitHub branch protection availability](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule).

**Decision:** do not click Generate Token or create/save a backend token in the existing frontend repository until NOX establishes and Kirch accepts a safe credential trust boundary. The previous conditional PR #11 merge authorization does not override this later HOLD.

## 4. Preferred minimal-cost isolation path

If the current contributor/workflow boundary cannot be established as exclusively trusted, use a **dedicated, private, tightly controlled runtime-CI repository**, not a new paid plan. Review its full direct/team/organization write access and Actions triggers before placing credentials. Only Kirch-approved trusted CI workflow writers may be able to alter jobs that access secrets.

Transfer/revalidate the eight approved CI artifacts as a new candidate **without claiming PR #11's prior approval transfers automatically**. Preserve exact frontend and backend source tuple and scoped overlay; use separately authorized read-only checkouts for each private repository. Prefer a short-lived fine-grained `Contents: read` backend-only token, or a properly scoped short-lived GitHub App installation token. No classic or all-repository PAT. No long-lived broad GitHub App private key exposed to untrusted workflows. Revoke/expire token after supervised use. GitHub-hosted standard runner, zero-paid-overage hard-stop, and fresh single-run Kirch consent remain mandatory.

Creation of this CI repository, credential, approval gates, source copy, billing changes and runtime tests are **not** authorized by this checkpoint.

## 5. Release and memory gates

| Gate | Disposition |
| --- | --- |
| Corrected exact-head source review | NOX APPROVED, code only |
| Candidate workflow on default branch | NO |
| Parser/registration success at corrected SHA | NOT VERIFIED |
| Repository-level backend secret scope/presence | NOT VERIFIED; provisioning HELD |
| Complete frontend collaborator/team/Actions trust | NOT VERIFIED; BLOCKER |
| Existing frontend `main` branch protection | NOT ENABLED |
| PR #11 merge | HELD; conditional approval only |
| Real Laravel/PostgreSQL/Chromium HTTP/browser suite | NOT RUN |
| QA / integrated app / production acceptance | NOT AWARDED |

**Next single action:** use an authenticated GitHub settings-capable Work browser to enumerate all eligible frontend repository workflow writers, team grants, inheritance and Actions policies **without changing anything**. Submit the non-secret evidence for independent NOX review and Kirch's disposition. If isolation fails, initiate a separately authorized dedicated CI-repository architecture lane. Do not create secrets until that gate is accepted.

**Memory consistency:** the existing draft PR #11 itself carries prior RT-CI START/source checkpoints appended to `docs/WORK_PACKAGE_CONTINUITY.md` but those are not yet merged into `main`. This independent Maintainer audit is staged on a distinct **documentation-only branch**, indexed from the owning frontend memory file, and must not be mistaken for PR #11 code acceptance or a canonical `main` mutation. Its PR is review-only; reconcile both memory streams before any future merge. Issue #10 remains OPEN; no `CLOSE` is recorded.

## 6. Explicit non-mutation report

No backend/frontend executable source, frozen source tuple, original PR #6/#7/#9/#11 head, workflow definition, token, secret, organization permission, branch protection, billing setting, default branch, runner, production resource or GitHub Project field is authorized to be changed by this memory checkpoint. No workflow was dispatched or integration PASS claimed.
