# OT-VPS-OPERATIONAL-QA-R1 — BLOCKED / PREFLIGHT OBSERVED

Observed 2026-11-27 PHT by Codex, sole executor; accountable Engineer KIRCH, Maintainer orchestration. Not a completion, independent QA, or release receipt.

Authority recovered: [issued order](https://github.com/Project-Intra-Smithy/engineering-hub/issues/197#issuecomment-7218454111), [verified pair](https://github.com/Project-Intra-Smithy/engineering-hub/issues/197#issuecomment-7218467897), repository memory at 5333c664531826ecffb682cfcc6c8991d6bafdbd. Canonical-main propagation exception retained. OperationForge core/runtime/evidence read at 0e8765de6e0e87ea9b4503714f08fa650e1a79c6; Ponytail full. No agents assigned.

## Exact source and concrete blocker

Accepted draft/unmerged PR78 remains ad1d6d60e31e06a49c7eb15fdfbc192dc776179d, tree db89068842b9545da61b49a5777d4703963bb3fb. Live main resolved f5a74a7b648855be94809cac5ec56b60837cbf8c; not deployed or modified.

The accepted executable has no supported persistent-target migration/role installation route established. Source inspection of database/migrations/2026_11_19_200000_create_legacy_custody_foundation.php lines 12–18 requires APP_ENV=testing, N03_DISPOSABLE_LEASE=EXCLUSIVE_PG16_SYNTHETIC_ONLY, PostgreSQL 16, superuser bootstrap, absent custody schema, and database talibon_portal_test. Three subsequent N03 migrations and five OPS009 migrations retain disposable-target guards. tests/Manual/sql/G1B_DISPOSABLE_PG16_ROLE_INSTALL_R1.sql and N03_DISPOSABLE_PG16_ROLE_INSTALL_R1.sql also require the disposable database and lease; N03 installation requires the protected G1B role lattice.

Live target is staging / one_talibon_iam_20261110235520, lacks legacy_custody and all kirion_g1b_* / n03_* roles, and has only 54 migration ledger entries, ending 2026_11_20_000200_enforce_iam_identity_integrity. The guarded foundation migration has not run. These are current observations, not an inherited historical blocker. Running forward migrations would encounter an explicit refusal; bypassing it or spoofing testing is prohibited by the deployment order. No migration was attempted and no partial upgrade introduced.

Reopening requires an Engineer-qualified supported persistent upgrade/role procedure compatible with the frozen executable and existing administrator. If source changes are necessary, they require separate bounded authorization and successor qualification; this mission does not supply that authority. Maintainer owns next disposition.

## Live environment observations

Strict known-host SSH succeeded to srv2146360 at 201.18.222.47. URL: https://devtestportal.talibonbohol.com. Active directory /opt/devtestportal/releases/bf097d746836ef25a5988bfb081d22bb80122660; /opt/devtestportal/current resolves there. No .git exists in the release: directory/image identity is observed, complete served source/tree parity is unverified.

Docker containers devtestportal-app-1 (devtestportal-iam:bf097d746836), devtestportal-db-1 (postgres:16-bookworm), devtestportal-caddy-1 (caddy:2.10-alpine) were up; database healthy. App/database ports not host-published; Caddy publishes 80/443. PHP 8.4.28; PostgreSQL 16.15 Debian. No service reload or restart performed.

Laravel read-only bootstrap reports staging, debug=false, configured HTTPS URL above, secure session cookie=true, file session, log mail, sync queue, APP_KEY present (value never printed). Runtime DB role ot_devtest_runtime. php artisan migrate:status fails SQLSTATE[42501], permission denied for migrations; elevated read-only catalog inspection established the ledger instead. No runtime-role privilege escalation was made.

Database roles observed: one_talibon_app has superuser/createdb/createrole/bypassrls; ot_devtest_owner and ot_devtest_runtime have none of these flags. This is a deployment qualification gap, not authorization to substitute unrestricted roles for the required protected lattice.

curl TLS-verified GET /login: HTTP 200, ssl_verify_result=0. This proves existing-site reachability only. Accepted-source asset build/manifest/served identity, authenticated browser/MFA, workflow effects, private downloads, responsive interactions, scheduler, logs and full operational qualification are NOT_RUN.

## Existing aggregate counts (not newly populated fixtures)

| Entity | Count |
|---|---:|
| users | 15 |
| employees | 15 |
| departments | 35 |
| transactions | 5 |
| tasks | 10 |
| memoranda | 1 |
| calendar_events | 5 |
| documents | 5 |
| plan_families | 0 |
| plan_editions | 0 |
| platform_notifications | 5 |
| audit_logs | 284 |

No new QA fixtures inserted. Aggregate counts do not establish synthetic provenance or absence of production data. Engineer's no-production-data statement remains REPORTED, not independently verified. No confidential personnel/document contents or credentials were exported. Optional Drive reference discovery deferred because deployment is blocked; no credentials workbook opened.

## Preservation and compliance

All VPS actions were read-only inspection, application bootstrap/status query, or ordinary HTTPS request. No deployment writes, database DDL/DML, grants, seeders, APP_KEY generation, password reset, MFA change, account replacement, environment edit, snapshot, backup, dump, redundant environment, excluded-module activation or unrelated service mutation occurred. No secrets or secret fingerprints printed or committed.

Administrator identity/password/MFA/permissions/employee-office and account-state before/after fingerprint checks are NOT_RUN; no administrator preservation PASS is claimed. Preservation risk was avoided by stopping before mutation. Existing administrator login usability is unverified.

Evaluator package is BLOCKED: no new credentials/accounts, enrolled MFA, accepted-source scenario IDs, or authenticated smoke evidence exist. Siris #196 remains queued, not activated. No READY_FOR_SIRIS_QA claim. Application source, candidate branches and main preserved; only separate evidence/memory branch updated.
