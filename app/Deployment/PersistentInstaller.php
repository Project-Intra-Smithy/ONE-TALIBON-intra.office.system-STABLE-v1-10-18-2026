<?php

declare(strict_types=1);

namespace App\Deployment;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

/** Offline, target-bound bootstrap authority. Never enabled by a web/runtime env flag. */
final class PersistentInstaller
{
    public string $phase = 'preflight';

    private static ?array $target = null;

    private const GUARDED = [
        '2026_11_19_200000_create_legacy_custody_foundation',
        '2026_11_20_010000_extend_legacy_custody_g2b_command_provenance',
        '2026_11_20_020000_create_legacy_custody_k2_tombstones',
        '2026_11_20_030000_create_legacy_custody_g3_g5_extensions',
        '2026_11_22_150000_ops009_close_command_compatibility',
        '2026_11_22_170000_ops009_g2b_close_audit_compatibility',
        '2026_11_22_190000_ops009_r3_close_audit_provenance',
        '2026_11_22_191000_ops009_r3_origin_notice_effect',
        '2026_11_23_020000_ops009_origin_delivery_exception_queue',
    ];

    public static function active(): bool
    {
        if (self::$target === null) {
            return false;
        }
        $identity = DB::selectOne('SELECT current_database() AS db, session_user AS role, current_user AS execution');
        if ($identity->db !== self::$target['database'] || $identity->role !== self::$target['bootstrap_role']
            || $identity->execution !== $identity->role || DB::transactionLevel() < 1) {
            throw new RuntimeException('Persistent installation authority lost its target or transaction.');
        }

        return true;
    }

    public static function database(): string
    {
        return self::active() ? self::$target['database'] : 'talibon_portal_test';
    }

    public static function bootstrapRole(): string
    {
        return self::active() ? self::$target['bootstrap_role'] : 'postgres';
    }

    public function install(array $target, string $credentialPath): array
    {
        if (PHP_SAPI !== 'cli' || ! app()->environment(['staging', 'production']) || config('app.debug')
            || DB::getDriverName() !== 'pgsql' || app()->configurationIsCached()) {
            throw new RuntimeException('Persistent installer requires uncached staging/production CLI, debug off and PG16.');
        }
        foreach (['database', 'host', 'port', 'system_identifier', 'bootstrap_role', 'source_sha', 'app_key_sha256', 'expected_migrations', 'retired_runtime_roles', 'legacy_owner_roles', 'package_sha256', 'tree_sha'] as $field) {
            if (! isset($target[$field])) {
                throw new RuntimeException('Incomplete persistent target manifest.');
            }
        }
        $connection = config('database.connections.'.config('database.default'));
        if (! preg_match('/^[a-z][a-z0-9_]{2,62}$/D', $target['database'])
            || in_array($target['database'], ['postgres', 'template0', 'template1', 'talibon_portal_test'], true)
            || $connection['database'] !== $target['database'] || $connection['host'] !== $target['host']
            || (string) $connection['port'] !== (string) $target['port'] || ! empty($connection['url'])
            || ! is_array($target['expected_migrations']) || ! is_array($target['retired_runtime_roles']) || ! preg_match('/^[a-f0-9]{40}$/D', $target['source_sha'])
            || ! hash_equals($target['app_key_sha256'], hash('sha256', (string) config('app.key')))
            || strlen((string) config('app.key')) < 32) {
            throw new RuntimeException('Persistent target, source or application-key mismatch.');
        }
        $package = defined('ONE_TALIBON_VERIFIED_PACKAGE') ? ONE_TALIBON_VERIFIED_PACKAGE : null;
        if (! is_array($package) || realpath($package['root']) !== realpath(base_path())
            || $package['source_sha'] !== $target['source_sha'] || $package['tree_sha'] !== $target['tree_sha']
            || $package['package_sha256'] !== $target['package_sha256'] || ! array_key_exists('previous_installation', $target)) {
            throw new RuntimeException('Independently verified executable package is required.');
        }
        $identity = DB::selectOne("SELECT current_database() AS db, session_user AS role, current_user AS execution,
            current_setting('server_version_num')::int AS version, current_setting('is_superuser') AS superuser,
            (SELECT system_identifier::text FROM pg_control_system()) AS system_identifier");
        if ($identity->db !== $target['database'] || $identity->role !== $target['bootstrap_role']
            || $identity->execution !== $identity->role || $identity->superuser !== 'on'
            || $identity->version < 160000 || $identity->version >= 170000
            || $identity->system_identifier !== (string) $target['system_identifier']) {
            throw new RuntimeException('Persistent cluster or bootstrap identity mismatch.');
        }
        app(SupportedPg16::class)->verify();
        CredentialBoundary::verify();
        $passwords = json_decode(file_get_contents($credentialPath), true, 32, JSON_THROW_ON_ERROR);
        $roles = ['kirion_g1b_migrator', 'kirion_g1b_app', 'kirion_g1b_custody', 'n03_stage', 'n03_command', 'n03_reconcile', 'n03_reader'];
        foreach ($roles as $role) {
            if (! isset($passwords[$role]) || ! is_string($passwords[$role]) || ! preg_match('/^[A-Za-z0-9_-]{32,128}$/D', $passwords[$role])) {
                throw new RuntimeException('Missing private deployment role credential.');
            }
        }
        if (count(array_unique(array_intersect_key($passwords, array_flip($roles)))) !== count($roles)) {
            throw new RuntimeException('Deployment roles require distinct credentials.');
        }
        try {
            return DB::transaction(function () use ($target, $passwords, $roles, $package): array {
                CredentialBoundary::pinSession();
                DB::statement("SET LOCAL lock_timeout='5s'");
                DB::statement("SET LOCAL statement_timeout='120s'");
                $lock = DB::selectOne("SELECT pg_try_advisory_xact_lock(hashtextextended('one-talibon-persistent-install',0)) AS acquired");
                if (! $lock->acquired) {
                    throw new RuntimeException('Another persistent installer owns this target.');
                }
                self::$target = $target;
                $migrator = app('migrator');
                $files = $migrator->getMigrationFiles([database_path('migrations')]);
                $repository = $migrator->getRepository();
                // Lock before ledger writes: autovacuum can otherwise wait on our inserts
                // while ownership finalization waits on its relation lock.
                if ($repository->repositoryExists()) {
                    DB::statement('LOCK TABLE public.migrations IN ACCESS EXCLUSIVE MODE');
                }
                $existing = $repository->repositoryExists() ? $repository->getRan() : [];
                $expected = $target['expected_migrations'];
                sort($existing);
                sort($expected);
                if ($existing !== $expected || array_diff($existing, array_keys($files))) {
                    throw new RuntimeException('Unexpected migration ledger; refusing target drift.');
                }
                $installed = DB::selectOne("SELECT to_regclass('deployment_control.installations') IS NOT NULL AS ready")->ready;
                $security = app(PersistentSecurity::class);
                $authority = $security->authority($target);
                if ($installed) {
                    app(SecurityCatalog::class)->verify($target['bootstrap_role'], $security->restrictiveDefaults($target, true));
                    $rows = DB::select('SELECT * FROM deployment_control.installations');
                    $row = count($rows) === 1 ? (array) $rows[0] : null;
                    if ($row !== null) {
                        $row['authority'] = json_decode($row['authority'], true, 32, JSON_THROW_ON_ERROR);
                    }
                    $previous = $target['previous_installation'];
                    if (! is_array($previous) || $row === null || $row != $previous || $row['authority'] != $authority
                        || $row['source_sha'] !== $package['source_sha'] || $row['tree_sha'] !== $package['tree_sha']
                        || $row['package_sha256'] !== $package['package_sha256']
                        || $row['ledger_sha256'] !== hash('sha256', json_encode($existing, JSON_THROW_ON_ERROR))) {
                        throw new RuntimeException('Untrusted installation identity, package or ledger lineage.');
                    }
                    foreach ($roles as $role) {
                        CredentialBoundary::registeredPassword(config('database.connections.'.config('database.default')), $role, $passwords[$role]);
                    }
                } elseif ($target['previous_installation'] !== null) {
                    throw new RuntimeException('Unexpected prior installation lineage.');
                }
                $legacy = $security->preflight($target, $installed);
                if (! $installed && DB::selectOne("SELECT count(*) AS n FROM pg_roles WHERE rolname LIKE 'kirion_g1b_%' OR rolname LIKE 'n03_%'")->n > 0) {
                    throw new RuntimeException('Protected role collision outside registered installation.');
                }
                if (! $installed && array_intersect($existing, self::GUARDED)) {
                    throw new RuntimeException('Unregistered protected migration state.');
                }
                if (! $installed) {
                    $supported = array_values(array_filter(array_keys($files), static fn ($name) => $name <= '2026_11_20_000200_enforce_iam_identity_integrity' && ! in_array($name, self::GUARDED, true)));
                    sort($supported);
                    if ($existing !== [] && $existing !== $supported) {
                        throw new RuntimeException('Unsupported unregistered upgrade baseline.');
                    }
                    $security->clearLegacyGrants($legacy);
                }
                $before = $this->identityDigest();
                if (! $repository->repositoryExists()) {
                    $repository->createRepository();
                }
                $baseline = array_diff_key($files, array_flip(self::GUARDED));
                $this->phase = 'baseline migrations';
                $migrator->run(array_values($baseline), ['force' => true]);
                if (! $installed) {
                    $this->policy('g1b');
                    $this->policy('g2');
                }
                foreach (array_slice(self::GUARDED, 0, 4) as $i => $migration) {
                    $this->phase = $migration;
                    $migrator->run([$files[$migration]], ['force' => true]);
                    if (! $installed) {
                        $this->policy(['n03', 'g2b', 'k2', 'g3'][$i]);
                    }
                }
                foreach (array_slice(self::GUARDED, 4) as $migration) {
                    $this->phase = $migration;
                    $migrator->run([$files[$migration]], ['force' => true]);
                }
                if (! $installed) {
                    foreach ($roles as $role) {
                        // Plaintext never enters SQL. Verifiers remain sensitive: verified logging/transport is mandatory.
                        DB::unprepared('ALTER ROLE '.$role.' PASSWORD '.DB::getPdo()->quote(CredentialBoundary::scram($passwords[$role])));
                    }
                }
                $this->phase = 'complete security postflight';
                if (! $installed) {
                    $security->finalize($legacy, $target);
                }
                if ($before !== $this->identityDigest()) {
                    throw new RuntimeException('Existing identity/account/office preservation failed; rolling back.');
                }
                $ran = $repository->getRan();
                if (count($ran) !== count($files) || array_diff(array_keys($files), $ran)) {
                    throw new RuntimeException('Persistent migration postcondition failed.');
                }
                $ledger = $ran;
                sort($ledger);
                if (! $installed) {
                    DB::unprepared(file_get_contents(database_path('deployment/registry.sql')));
                    DB::statement('INSERT INTO deployment_control.installations VALUES (true,?::uuid,3,?,?,?,?,?::jsonb)', [
                        (string) Str::uuid(), $package['source_sha'], $package['tree_sha'], $package['package_sha256'], hash('sha256', json_encode($ledger, JSON_THROW_ON_ERROR)), json_encode($authority, JSON_THROW_ON_ERROR),
                    ]);
                }
                app(SecurityCatalog::class)->verify($target['bootstrap_role'], $security->restrictiveDefaults($target, true));
                $security->verifyRetired($legacy, $target);

                return ['status' => 'INSTALLED', 'installation' => json_decode(DB::selectOne('SELECT row_to_json(i)::text AS receipt FROM deployment_control.installations i')->receipt, true, 32, JSON_THROW_ON_ERROR), 'migration_count' => count($ran), 'existing_identity_preserved' => true,
                    'app_key_preserved' => hash_equals($target['app_key_sha256'], hash('sha256', (string) config('app.key')))];
            });
        } finally {
            self::$target = null;
        }
    }

    private function policy(string $stage): void
    {
        $this->phase = 'privilege policy '.$stage;
        DB::unprepared(file_get_contents(database_path('deployment/'.$stage.'.sql')));
    }

    private function identityDigest(): string
    {
        $rows = [];
        foreach (['users', 'employees', 'departments'] as $table) {
            if (DB::selectOne('SELECT to_regclass(?) IS NOT NULL AS present', ['public.'.$table])->present) {
                $rows[$table] = DB::select('SELECT to_jsonb(t)::text AS row FROM public.'.$table.' t ORDER BY id');
            } else {
                $rows[$table] = [];
            }
        }

        return hash('sha256', serialize($rows));
    }
}
