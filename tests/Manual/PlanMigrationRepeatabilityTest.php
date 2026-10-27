<?php

namespace Tests\Manual;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;
use Tests\TestCase;

/**
 * Destructive opt-in QA, outside default PHPUnit suites.
 *
 * The caller MUST independently verify that the PostgreSQL service is newly
 * provisioned, disposable and has no retained/demo/municipal data. Environment
 * flags below are guardrails, NOT substitute evidence for that human lease.
 *
 * Run this file ALONE against an attested disposable PostgreSQL 16 service.
 * It intentionally wipes the entire selected database schema TWICE.
 */
final class PlanMigrationRepeatabilityTest extends TestCase
{
    public function test_two_disposable_migrate_fresh_cycles_recreate_triggers_without_collisions(): void
    {
        if (getenv('KIRION_W02W03_DISPOSABLE_LEASE') !== 'EXCLUSIVE_PG16_THROWAWAY_QA_ONLY') {
            throw new RuntimeException('Refusing destructive test without verified disposable DB lease.');
        }

        if (DB::connection()->getDriverName() !== 'pgsql') {
            throw new RuntimeException('PostgreSQL is required.');
        }

        $database = (string) DB::selectOne('SELECT current_database() AS database_name')->database_name;

        if ($database !== 'talibon_portal_test') {
            throw new RuntimeException('Refusing migration reset on unexpected database.');
        }

        $version = (int) DB::selectOne('SHOW server_version_num')->server_version_num;

        if ($version < 160000 || $version >= 170000) {
            throw new RuntimeException('This receipt requires a disposable PostgreSQL 16 server.');
        }

        foreach ([1, 2] as $pass) {
            $exit = Artisan::call('migrate:fresh', [
                '--force' => true,
                '--no-interaction' => true,
            ]);

            $this->assertSame(0, $exit, 'migrate:fresh pass '.$pass.': '.Artisan::output());
            $this->assertTrue(Schema::hasTable('plan_document_bindings'));
            $this->assertTrue(Schema::hasTable('plan_document_origin_receipts'));

            $count = DB::selectOne(
                "SELECT count(*) AS n FROM pg_catalog.pg_proc
                 WHERE pronamespace = 'public'::regnamespace
                 AND proname IN (
                    'kirion_plan_document_guard',
                    'kirion_plan_origin_receipt_guard',
                    'kirion_plan_stamp_origin',
                    'kirion_plan_generic_link_guard',
                    'kirion_plan_typed_binding_guard'
                 )",
            );

            $this->assertSame(5, (int) $count->n, 'All five functions must survive repeatable schema setup.');
        }
    }
}
