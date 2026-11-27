# Persistent PostgreSQL 16 installation and forward upgrade

Scope: supported installation of this successor, including N03/G1B/OPS009. It is not municipal policy/adoption, production rollout, a data reset, or authorization to enable held modules. PR78 remains frozen. Existing disposable CI entrypoints retain their original target/lease/prerequisite checks and use the same shared privilege policies as this installer.

## Execution model

`php artisan deploy:persistent /private/target.json /private/roles.json`

Use a maintenance window, a verified source package/commit, installed locked Composer dependencies, uncached Laravel configuration, APP_ENV=staging or production, debug off, and the existing APP_KEY. Read it from the existing protected environment; never regenerate or print it. A fresh installation uses a newly generated private key before initial deployment; the installer never generates one. Do not use composer setup or DatabaseSeeder.

The offline bootstrap connection needs PG16 superuser authority for role creation and transfer of existing legacy object ownership. Its credentials must not be installed in the web/worker environment. The application uses kirion_g1b_app; N03 stage, command, reconcile and reader have separate real connections as already defined in config/database.php. No application role is superuser/createdb/createrole/bypassrls/replication or a member of the owner. kirion_g1b_owner remains NOLOGIN; the migrator alone may explicitly assume it. Maintain restricted DB ingress and SCRAM authentication. Runtime failure to read the migration ledger is intentional.

Inputs must be private regular JSON files (0600 on Unix, private ACL on Windows). The target manifest contains:

```json
{
  "database": "explicit_existing_database",
  "host": "explicit_connection_host",
  "port": "5432",
  "system_identifier": "verified_pg_control_system_identifier",
  "bootstrap_role": "explicit_offline_bootstrap_role",
  "source_sha": "exact_40_character_git_commit_sha",
  "app_key_sha256": "private_existing_app_key_fingerprint",
  "expected_migrations": ["exact_existing_migration_names"],
  "retired_runtime_roles": ["prior_runtime_role"]
}
```

For a fresh empty target expected_migrations is empty. For upgrade, independently read the live ledger and reconcile it to the installed source history; unknown/duplicate/missing expected entries are a refusal, not permission to forge the ledger. Obtain system_identifier from pg_control_system() through the offline bootstrap session. The manifest binds connection host/port/database, actual database/cluster, bootstrap identity, APP_KEY and source (Git HEAD or packaged DEPLOYMENT_SHA). postgres/template databases and talibon_portal_test are rejected. No config/env flag enables persistent migration authority: it exists only inside this command's checked transaction and disappears in finally. Ordinary artisan migrate retains its original disposable-only refusals for protected migrations.

roles.json maps each of kirion_g1b_migrator, kirion_g1b_app, kirion_g1b_custody, n03_stage, n03_command, n03_reconcile and n03_reader to a distinct randomly generated password of at least 32 characters. Do not put credentials or the private manifest in Git, issue comments, shell history or command arguments. Initial provisioning sets them within the transaction; a rerun does not rotate existing credentials. Verify actual role authentication before runtime cutover. Retired runtime roles lose grants in public/legacy_custody on this target only; they are not globally disabled, dropped or modified on unrelated databases. Independently verify they have no inherited/owner access before claiming retirement complete.

## Order and atomicity

One transaction and target advisory lock cover:

1. Exact ledger/collision preflight and in-memory existing users/employees/departments preservation digest.
2. Supported ordinary baseline migrations, excluding the nine guarded migrations. This includes the current Planning/IAM prerequisites, mirroring the accepted protected CI ordering.
3. Shared G1B ownership/app/custody policy and G2 custody extension.
4. N03 foundation, G2B, K2 and G3-G5 migrations, each followed by its corresponding shared role policy.
5. Five OPS009 migrations in their canonical order, retaining all schema/function/constraint/role checks.
6. Final object ownership, trigger execution and audit/ledger boundaries; explicitly scoped retirement of prior runtime grants.
7. Exact migration completeness, identity/credential/MFA/office preservation, APP_KEY preservation and private installation registry.

The shared SQL files in database/deployment are internal policy fragments, not standalone installation entrypoints. Disposable tests invoke them only after their unchanged SQL guards. The persistent command invokes them only after its target/schema preflight and canonical migration sequence. There is no text replacement of guards or ledger fabrication at deployment time.

Any failure rolls back DDL, role creation/grants, application migrations and ledger writes together. Existing accounts and data are never replaced. Error output omits database query text/bindings that might carry credentials. A refusal is not success; inspect the exact failing phase in an isolated synthetic rehearsal. Never retry using testing-env spoofing or relaxed guards.

Successful rerun requires a newly verified manifest reflecting the now-current ledger, registered installation and intact roles. It applies only pending migrations and verifies preservation again. A protected-role collision without this target's registered installation is refused, even if roles have matching names.

## Qualification and deployment completion

Run tests/Manual/persistent-install-rehearsal.py with local PG16 binaries and an evidence output directory. It accepts no external DSN, creates loopback-only synthetic clusters, tests fresh and exact 54-migration upgrade, password/MFA decryption, late rollback, target/cluster/source/ledger/key refusal, least privilege using authenticated connections, old runtime grant revocation and idempotent rerun. These tests are not hosted operational QA.

After exact-source CI and targeted independent deployment-control acceptance, classify/preserve existing VPS records and administrator, build locked PHP/frontend assets, run the supported command against the explicitly verified target, privately configure the runtime role connections, private storage and existing custody broker/namespace prerequisites, and perform authenticated HTTPS/MFA multi-role workflow smoke tests. Do not claim deployment readiness from an installer PASS or /login 200. Record asset identity, services/queues/scheduler, synthetic provenance/counts, administrator preservation and evaluator access privately. Existing mission forbids backups/snapshots/redundant deployed instances, main integration and public rollout. Siris activation remains with Maintainer/Engineer.
