# Contributing — ONE TALIBON Frontend Team

This guide applies to the **team workspace**, not Kirch's historical source repository or the canonical backend product.

## First contribution: import what already exists

Follow [FRONTEND-REG-001](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/1). Start by submitting the source inventory in [docs/FRONTEND_IMPORT_REGISTER.md](docs/FRONTEND_IMPORT_REGISTER.md) or in issue #1: owner, location, exact commit/archive, framework, paths, dependencies, what is functional, what is only mocked, and screenshots. Clarify shared UI/layout ownership and compatibility before importing two potentially conflicting application roots.

Do **not** copy the backend product or Kirch's old portal wholesale. Import only real, reviewed frontend deliverables and preserve their creator and source attribution.

## Git / branch controls

1. Fetch and recheck this repo's current `main` SHA before working. The initial baseline was `5278a91a453b5cea1c9cba274964469f2c8735c2` (README only), **not a forever-current starting SHA**.
2. Create a **human-owned**, issue-linked branch for one bounded import or UI package. Example names (examples, not precreated branches): `AJ-FRONTEND-REG-001-LOGIN-IMPORT`, `JHAYR-FRONTEND-REG-001-DASHBOARD-IMPORT`. Do not allocate paths or claim ownership merely from these names.
3. Preserve original files/history where practical; record precise source commits, copying strategy, and any rewrites. Never impersonate an author/committer. Work from a verified team-repo branch, not a branch of the historical original repo.
4. Open a **draft PR** early with the import register and exact intended file scope. Resolve conflicts by coordinated review, not silently overwriting the other contributor.
5. Submit real install/build/type-check/test commands and actual outputs **after the source stack is known**; provide screenshots of login/dashboard at desktop and mobile, and list known defects. No fabricated status badges or CI claims.
6. Request Kirch's technical acceptance of each bounded PR before moving any shared baseline into `main`. Kirch alone issues backend contract releases.

**AJ access may be resolved later.** Jhayr may coordinate a legitimate import now. Until AJ receives write access, AJ can provide his original source and review it, while an authorized importer must preserve original attribution and explicitly describe any copied files. This does not authorize pushing commits falsely as AJ.

## File and security boundaries

- This team repo: UI components, pages, styling, assets, local fixtures, accessibility and **approved** backend integration.
- Canonical server repo: authentication/authorization enforcement, API routes, database, Task lifecycle, audit policy.
- Do not expose credentials, session tokens, `.env` secrets, real private LGU records, internal URLs/keys, vendor directories or build outputs in Git.
- Avoid changing global shared navigation, routes, layout or package tooling in parallel without coordinating the team first.
- Frontend-only access hiding is **not authorization**. Backend decides allowed actions; an unconfirmed municipal role never becomes a frontend default.
- Create fake/mock data only with clear demo labels and no claim of actual login, work assignment, or backend persistence.

## How contracts arrive

See [Backend Contract Intake](docs/BACKEND_CONTRACT_INTAKE.md). Require a named issuing authority, version, exact backend SHA, routes, payloads, errors, auth, allowed actions, filters, compatibility notes and tests **before** coding a real integration. W02 is Task lifecycle; W03 implements real endpoints; `C1-PARTIAL` is allowed only for already verified limited endpoints, not projected ones. Full `A01-C1` is a separate release.

## Review definition of done

Imported screens run under the actual toolchain, build/check commands have recorded results, navigation behaves as described, human ownership/provenance is clear, secrets and unrelated backend files are absent, and incomplete integrations are explicitly identified. **A README change is not application acceptance.**
