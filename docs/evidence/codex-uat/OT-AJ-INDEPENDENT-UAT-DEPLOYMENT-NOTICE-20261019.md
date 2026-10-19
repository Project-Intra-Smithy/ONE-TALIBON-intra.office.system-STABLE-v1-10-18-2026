# ONE TALIBON independent UAT deployment notice — AJ UI composition

**Status:** Executed independent UAT deployment; not a merge, production release, or claim of PR acceptance.
**Executor:** Codex on the previously established Windows UAT host, under Kirch Ivan Balite's direct instruction.
**Deployment time:** 2026-10-19 05:28:52Z (2026-10-19 13:28:52 Asia/Manila).
**Live UAT:** https://onetalibon-uat.shares.zrok.io/

## Why this notice exists

The live UAT was updated independently of GitHub merge/CI state. Maintainers and frontend owners need an exact record of what was composed and what was *not* composed. This deployment must not be inferred to equal the current head of PR92, PR99, or frontend PR34.

## Exact source tuple

1. Runtime/application baseline: `Project-Intra-Smithy/Talibon-Sales-Prototype@88f3d6bd6258d502f1b5e6bf323bcf22619f5f8d` (the previously deployed PR92-era frozen application).
2. AJ backend-repository PR: `Project-Intra-Smithy/Talibon-Sales-Prototype#99`.
3. PR99 current head at verification: `48fb7bbaab1cc9ffd8821a5de1c714b8214e0c5f`.
4. PR99 executable UI commit actually composed: `54b0cafe62243e6505ffbc1ca22ef263c08e1ce0`.
5. PR99 commits after `54b0cafe...` are documentation/work-package records; they do not add later application files.
6. Frontend consolidated candidate inspected after deployment: `Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE#34@e172840cd7104b9902f107cb95ba8f7e3889b9e0`.
7. PR92 current remote head at notice time is `964ee473e226bcf320c7c45c44e1e06f1e3abcc8`; it is **not** the frozen live baseline and was not deployed by this action.

## Cross-repository scope clarification

The executor initially cross-read PR99 against the frozen PR92 application/runtime baseline to create a usable Laravel composition. That comparison covered the backend-composed repository and detected four conflicts in Login/MFA files. It did **not initially include the full frontend repository PR34 candidate**.

After the user challenged the scope, the frontend repository was inspected separately. PR34 contains additional AJ work that is not included in the live deployment: dashboard component redesigns, application shell/sidebar/mobile-navigation changes, role-specific dashboard metrics/activity layouts, preview infrastructure, and the final mobile dashboard-header correction `e172840...`.

Therefore the live UAT is accurately described as:

> Frozen PR92 application/runtime + AJ PR99 public homepage/Login/MFA overlay.

It must **not** be described as the complete AJ frontend PR34 release candidate.

## Files overlaid

The following reviewed files were copied from the PR92-based integration candidate. No PHP controllers, routes, models, migrations, seeders, authorization policies, database configuration, Composer lockfile, or npm lockfile were replaced.

| Runtime path | SHA-256 |
|---|---|
| `package.json` | `cb99fe7fc5710cd2092c9d38ab355077ef2ddbe02cf134caeed47d35e4735b4b` |
| `public/images/talibon/municipality-of-talibon.jpg` | `bda46d5acbe46ec7c991ea7bdf7285f5f660665fbc69102c7368cde8424b4444` |
| `resources/css/public-homepage-refinement.css` | `ef6e7ca583475c53ff7726ee1e4073debb4962036b0f15acec0d4cbf885f8a33` |
| `resources/js/components/public/PublicHeader.tsx` | `ab06bffc80128d82ee6edbd6855a7b1ce01e952caf5cdee60ae562fc299dd6b3` |
| `resources/js/components/public/PublicHero.tsx` | `7026fb462c98beccb49e207b2f19ce28da2247b35211f1d40da2b82f7607c3c2` |
| `resources/js/pages/Auth/Login.tsx` | `b7a6e37e81ddd5c5428c10efcb5ca18e4de4511f145b67e658a132af0d4b7259` |
| `resources/js/pages/Auth/MfaChallenge.tsx` | `afb6c2ed0aaac43832eafac57093e1de8c47859f19765a130aa8e691ceaa7981` |
| `resources/js/pages/Auth/login.css` | `e6ba6a18d3da1dcb5db9814a1c0d9181506b37ca5ee87284d50dce7868b2f66f` |
| `resources/js/pages/Auth/mfa-challenge.css` | `f49816742ce3f6e40e840c59336235ba81fcb42307d85f1eced040f30a80096a` |
| `resources/js/pages/Public/Home.tsx` | `fee95e841476a10655297e669a7ec8e46d7acc345f247f92e29f7aa5e8bb1f54` |
| `tests/Browser/aj-home-auth.test.mjs` | `b4663fb5b12a86e4637ddb2575ab98b2a8d8160636929de896212de51cd9bc94` |

## Conflict disposition

Direct application of PR99 executable commit `54b0cafe...` to frozen baseline `88f3d6bd...` returned conflicts in:

- `resources/js/pages/Auth/Login.tsx`
- `resources/js/pages/Auth/MfaChallenge.tsx`
- `resources/js/pages/Auth/login.css`
- `resources/js/pages/Auth/mfa-challenge.css`

In the disposable integration candidate those four conflicts were resolved by selecting AJ's newer PR99 versions. No line-by-line hybrid source patch was invented. Homepage files applied cleanly.

## Preserved dependency/runtime identities

- `composer.lock` SHA-256: `f7b9523f5924470bc62ccbfe097ca274ad9fb2faecdce548d7ae4d1931b0aa58`
- `package-lock.json` SHA-256: `4760f60d358be92751f420d580a0fae4e817d2a4df67fda187f7af104f4a6346`
- Docker application image/digest: `sha256:46169ee83f7e9900a9ff06e22d6a080c38a65ec3e3f40c6361c2112e2f0b8596`
- Runtime health after replacement: `healthy`
- PostgreSQL: `PostgreSQL 16.15`, database/user `talibon_uat` / `talibon_uat`
- Post-deployment record counts: `380` users; `33` departments
- Existing PostgreSQL volume was retained.
- Migrations and seeders were **not** rerun for this UI deployment.
- Existing zrok enablement/share and nginx security-header configuration were retained.

## Build and validation evidence

### Exact PR99 checkout

- `npm ci --no-audit --no-fund`: exit `0`
- `npm run types:check`: exit `0`
- `npm run build`: exit `0`
- `npm test`: exit `0`; 9 tests passed, 0 failed/skipped

### PR99 overlay on frozen PR92 baseline

- Direct cherry-pick: exit `1`, because of the four conflicts listed above
- Conflict resolution and staged whitespace check: exit `0`; no unmerged paths
- `npm ci --no-audit --no-fund`: exit `0`
- `npm run types:check`: exit `0`
- `npm run build`: exit `0`
- `npm test`: exit `0`; 9 tests passed, 0 failed/skipped

AJ's focused browser suite mounts the compiled React/Inertia application using synthetic HTTP responses. It does not itself prove Laravel session, CSRF, PostgreSQL authentication, or real MFA behavior.

### Live deployment

Executed:

```text
docker compose build app
docker compose up -d --no-deps --force-recreate app
docker compose restart uat-smoke
```

All commands returned exit `0`. `app-init` was not recreated, preventing unintended migration/seeder execution.

Live checks:

- `/login`: HTTP `200`
- `/`: HTTP `200`
- `/images/talibon/municipality-of-talibon.jpg`: HTTP `200`, `Content-Type: image/jpeg`, `Content-Length: 118913`
- Login production bundle: `assets/Login-rvJdrwkh.js`
- MFA production bundle: `assets/MfaChallenge-BXqSpwHl.js`
- Public homepage production bundle: `assets/Home-CKnfkRD5.js`
- Existing dashboard bundle: `assets/Dashboard-jBHSG_yl.js`
- Browser accessibility snapshot confirmed the new AJ login labels, password-visibility control, remember control, submit control, and disabled Google control.
- Browser accessibility snapshot confirmed the refined public homepage, navigation, capability sections, secure-access section, and employee-login links.

The Vite build emitted a non-fatal notice that `/images/talibon/municipality-of-talibon.jpg` remains runtime-resolved. Direct live retrieval proved the same-origin image exists and is served as JPEG.

## Rollback and restrictions

- A host-local timestamped backup of every overwritten file was created before replacement.
- No Git merge, push, branch mutation, PR merge, or production deployment occurred.
- No production database or credential was used.
- No password, MFA secret, cookie, zrok token, or `.env` content is included in this notice.
- This independent UAT deployment is reversible and must not be treated as approval to merge PR99 or frontend PR34.

## Maintainer action required

1. Treat this comment as the canonical live UAT composition record.
2. Do not assume frontend PR34 dashboard/shell work is live.
3. If the full PR34 candidate is desired, perform a separate cross-repository port/reconciliation against the frozen backend application, especially its real Laravel props/contracts and the runtime's hardened dependency locks.
4. Run genuine authenticated Laravel/PostgreSQL browser acceptance after any PR34 shell/dashboard composition.
5. Decide whether the independent UAT composition should be preserved, formalized into a reviewed integration commit, or rolled back.
