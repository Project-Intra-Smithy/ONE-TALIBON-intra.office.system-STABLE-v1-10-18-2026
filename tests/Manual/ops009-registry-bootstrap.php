<?php

declare(strict_types=1);

// One targeted partial-custody-column/PDF regression against the actual
// disposable synthetic N03 schema, not a production or hosted database.
require dirname(__DIR__, 2).'/vendor/autoload.php';

use Illuminate\Foundation\Testing\RefreshDatabaseState;

if (getenv('GITHUB_ACTIONS') !== 'true'
    || getenv('APP_ENV') !== 'testing'
    || getenv('OPS009_DISPOSABLE_CI') !== '1'
    || getenv('OPS009_REGISTRY_BASELINE') !== '1'
    || getenv('N03_DISPOSABLE_LEASE') !== 'EXCLUSIVE_PG16_SYNTHETIC_ONLY'
    || getenv('DB_DATABASE') !== 'talibon_portal_test') {
    throw new RuntimeException('OPS009 registry regression bootstrap refused an unleased or non-test database.');
}
$pdo = new PDO(
    sprintf(
        'pgsql:host=%s;port=%s;dbname=talibon_portal_test',
        (string) getenv('DB_HOST'), (string) getenv('DB_PORT'),
    ),
    (string) getenv('DB_USERNAME'),
    (string) getenv('DB_PASSWORD'),
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
);
$check = $pdo->query(<<<'SQL'
    SELECT current_database() AS database_name,
           current_setting('server_version_num')::integer AS version,
           current_setting('is_superuser') AS superuser,
           to_regnamespace('legacy_custody') IS NOT NULL AS registry_present,
           to_regclass('legacy_custody.operations') IS NOT NULL AS operations_present,
           (SELECT count(*) FROM pg_catalog.pg_roles
            WHERE rolname IN ('n03_stage', 'n03_command', 'n03_reconcile')) AS role_count,
           (SELECT count(*) FROM public.migrations
            WHERE migration = '2026_11_22_150000_ops009_close_command_compatibility') AS migration_count,
           (SELECT pg_get_constraintdef(oid)
            FROM pg_catalog.pg_constraint
            WHERE conrelid = 'legacy_custody.operations'::regclass
              AND conname = 'operations_check') AS command_policy
    SQL)->fetch(PDO::FETCH_ASSOC);

if (! is_array($check)
    || $check['database_name'] !== 'talibon_portal_test'
    || (int) $check['version'] < 160000 || (int) $check['version'] >= 170000
    || $check['superuser'] !== 'on'
    || ! in_array($check['registry_present'], [true, 't', 'true', 1, '1'], true)
    || ! in_array($check['operations_present'], [true, 't', 'true', 1, '1'], true)
    || (int) $check['role_count'] !== 3
    || (int) $check['migration_count'] !== 1
    || ! str_contains((string) $check['command_policy'], "'close'")) {
    throw new RuntimeException('OPS009 synthetic registry regression schema or migration ledger drift.');
}
$pdo = null;
RefreshDatabaseState::$migrated = true;
fwrite(STDOUT, "OPS009_REGISTRY_REGRESSION_BASELINE=VERIFIED_N03_PG16\n");
