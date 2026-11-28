<?php

declare(strict_types=1);

// This bootstrap is intentionally limited to legacy-only PDF/HTTP regressions
// on the pre-migrated, disposable synthetic PG16 database. Their RefreshDatabase
// trait must not accidentally run the separately guarded N03/OPS009 registry
// migrations in this legacy-only phase. Nothing is disabled in app source.
require dirname(__DIR__, 2).'/vendor/autoload.php';

use Illuminate\Foundation\Testing\RefreshDatabaseState;

if (getenv('GITHUB_ACTIONS') !== 'true'
    || getenv('APP_ENV') !== 'testing'
    || getenv('OPS009_DISPOSABLE_CI') !== '1'
    || getenv('OPS009_LEGACY_BASELINE') !== '1'
    || getenv('DB_DATABASE') !== 'talibon_portal_test') {
    throw new RuntimeException('OPS009 legacy-only baseline bootstrap requires an exclusive disposable CI context.');
}

$pdo = new PDO(
    sprintf(
        'pgsql:host=%s;port=%s;dbname=talibon_portal_test',
        (string) getenv('DB_HOST'),
        (string) getenv('DB_PORT'),
    ),
    (string) getenv('DB_USERNAME'),
    (string) getenv('DB_PASSWORD'),
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
);
$check = $pdo->query(<<<'SQL'
    SELECT current_database() AS database_name,
           current_setting('server_version_num')::integer AS version,
           current_setting('is_superuser') AS superuser,
           to_regnamespace('legacy_custody') IS NULL AS schema_absent,
           (SELECT count(*) FROM pg_catalog.pg_roles
             WHERE rolname LIKE 'kirion_g1b_%' OR rolname LIKE 'n03_%') AS role_count,
           (SELECT count(*) FROM public.migrations) AS baseline_migrations,
           (SELECT count(*) FROM public.migrations
             WHERE migration LIKE '%ops009%close%') AS ops009_migration_count
    SQL)->fetch(PDO::FETCH_ASSOC);
if (! is_array($check)
    || $check['database_name'] !== 'talibon_portal_test'
    || (int) $check['version'] < 160000 || (int) $check['version'] >= 170000
    || $check['superuser'] !== 'on'
    || ! in_array($check['schema_absent'], [true, 't', 'true', 1, '1'], true)
    || (int) $check['role_count'] !== 0
    || (int) $check['baseline_migrations'] < 1
    || (int) $check['ops009_migration_count'] !== 0) {
    throw new RuntimeException('OPS009 legacy-only regression database identity or schema was not verified.');
}
$pdo = null;

RefreshDatabaseState::$migrated = true;
fwrite(STDOUT, "OPS009_LEGACY_REGRESSION_BASELINE=VERIFIED_WITHOUT_N03\n");
