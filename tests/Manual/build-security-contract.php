<?php

declare(strict_types=1);

use App\Deployment\CredentialBoundary;
use App\Deployment\PersistentSecurity;
use App\Deployment\SecurityCatalog;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

// Developer/CI policy derivation fixture, NEVER packaged in the persistent runtime.
// Uses the unchanged disposable authority and the six accepted canonical policies.
require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
set_exception_handler(static function (Throwable $e): void {
    fwrite(STDERR, 'Contract fixture refused: '.get_class($e).' code '.(string) $e->getCode());
    if ($e instanceof ErrorException) {
        fwrite(STDERR, ' '.substr($e->getMessage(), 0, 200));
    }
    if ($e instanceof QueryException && str_starts_with(ltrim($e->getSql()), 'SELECT')) {
        fwrite(STDERR, ' catalog SQLSTATE '.($e->errorInfo[0] ?? '').' '.explode("\n", $e->errorInfo[2] ?? '')[0]);
    }
    exit(1);
});

if (! app()->environment('testing') || getenv('N03_DISPOSABLE_LEASE') !== 'EXCLUSIVE_PG16_SYNTHETIC_ONLY'
    || DB::connection()->getDatabaseName() !== 'talibon_portal_test'
    || DB::selectOne("SELECT session_user='postgres' AND current_user='postgres' AND current_setting('server_version_num')::int BETWEEN 160000 AND 169999 AS safe")->safe !== true) {
    throw new RuntimeException('Contract fixture requires the exclusive canonical disposable PG16 lease.');
}
CredentialBoundary::verify();
$files = app('migrator')->getMigrationFiles([database_path('migrations')]);
$guarded = array_filter($files, static fn ($path) => str_contains(file_get_contents($path), 'N03_DISPOSABLE_LEASE'));
app('migrator')->getRepository()->createRepository();
app('migrator')->run(array_values(array_diff_key($files, $guarded)), ['force' => true]);
foreach (['g1b', 'g2'] as $stage) {
    DB::unprepared(file_get_contents(database_path('deployment/'.$stage.'.sql')));
}
foreach (array_slice(array_values($guarded), 0, 4) as $i => $path) {
    app('migrator')->run([$path], ['force' => true]);
    DB::unprepared(file_get_contents(database_path('deployment/'.['n03', 'g2b', 'k2', 'g3'][$i].'.sql')));
}
foreach (array_slice($guarded, 4) as $path) {
    app('migrator')->run([$path], ['force' => true]);
}
foreach (['kirion_g1b_migrator', 'kirion_g1b_app', 'kirion_g1b_custody', 'n03_stage', 'n03_command', 'n03_reconcile', 'n03_reader'] as $role) {
    DB::unprepared('ALTER ROLE '.$role.' PASSWORD '.DB::getPdo()->quote(CredentialBoundary::scram(bin2hex(random_bytes(32)))));
}
app(PersistentSecurity::class)->finalize([], ['bootstrap_role' => 'postgres', 'legacy_owner_roles' => [], 'retired_runtime_roles' => []]);
DB::unprepared(file_get_contents(database_path('deployment/registry.sql')));
echo json_encode(app(SecurityCatalog::class)->snapshot('postgres'), JSON_THROW_ON_ERROR);
