<?php

declare(strict_types=1);

use App\Deployment\PersistentInstaller;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public $withinTransaction = true;

    public function up(): void
    {
        // This is a bounded disposable-PG16 compatibility proof, NOT a
        // production or persistent-registry migration.
        if (! PersistentInstaller::active() && (! app()->environment('testing')
            || getenv('N03_DISPOSABLE_LEASE') !== 'EXCLUSIVE_PG16_SYNTHETIC_ONLY'
            || DB::getDriverName() !== 'pgsql'
            || DB::connection()->getDatabaseName() !== 'talibon_portal_test')) {
            throw new RuntimeException('OPS009 close compatibility requires an exclusive synthetic PG16 testing lease.');
        }

        DB::transaction(static function (): void {
            $guard = DB::selectOne(<<<'SQL'
                SELECT
                    current_database() AS database_name,
                    current_setting('server_version_num')::integer AS version_number,
                    current_setting('is_superuser') AS superuser,
                    session_user AS session_role,
                    current_user AS execution_role,
                    to_regnamespace('legacy_custody') IS NOT NULL AS schema_present,
                    to_regclass('legacy_custody.operations') IS NOT NULL AS operations_present,
                    (SELECT count(*) FROM pg_catalog.pg_roles
                        WHERE rolname IN ('n03_stage', 'n03_command', 'n03_reconcile')
                          AND rolcanlogin AND NOT rolsuper) AS ordinary_roles,
                    (SELECT count(*) FROM pg_catalog.pg_constraint
                        WHERE conrelid = to_regclass('legacy_custody.operations')
                          AND conname = 'operations_check' AND contype = 'c') AS canonical_checks
                SQL);

            if ($guard === null
                || $guard->database_name !== PersistentInstaller::database()
                || (int) $guard->version_number < 160000
                || (int) $guard->version_number >= 170000
                || $guard->superuser !== 'on'
                || $guard->session_role !== PersistentInstaller::bootstrapRole()
                || $guard->execution_role !== PersistentInstaller::bootstrapRole()
                || ! $guard->schema_present
                || ! $guard->operations_present
                || (int) $guard->ordinary_roles !== 3
                || (int) $guard->canonical_checks !== 1) {
                throw new RuntimeException('OPS009 close compatibility refused PostgreSQL identity, role or N03 schema drift.');
            }

            // The lock makes the checked contract and its replacement one
            // indivisible operation for concurrent sessions.
            DB::statement('LOCK TABLE legacy_custody.operations IN ACCESS EXCLUSIVE MODE');

            // Produce the canonical expected pg_get_constraintdef() using the
            // same PostgreSQL 16 parser as the existing foundation migration.
            // Comparing generated expressions avoids brittle text whitespace
            // assumptions and fails closed if the live policy was modified.
            DB::unprepared(<<<'SQL'
                CREATE TEMP TABLE ops009_expected_before (
                    command_kind text NOT NULL,
                    command_action text NOT NULL,
                    CONSTRAINT ops009_expected_before_check CHECK (
                        (command_kind, command_action) IN (
                            ('transaction_create', 'create'),
                            ('correspondence_register', 'register'),
                            ('correspondence_classify', 'classify'),
                            ('correspondence_route', 'route'),
                            ('correspondence_act', 'act'),
                            ('travel_record', 'record'),
                            ('travel_status', 'status')
                        )
                        OR (command_kind = 'transaction_transition'
                            AND command_action IN (
                                'forward', 'send_to_mayor', 'return_origin',
                                'request_information', 'assign', 'mark_review',
                                'approve', 'disapprove'
                            ))
                    )
                ) ON COMMIT DROP
                SQL);

            DB::unprepared(<<<'SQL'
                CREATE TEMP TABLE ops009_expected_after (
                    command_kind text NOT NULL,
                    command_action text NOT NULL,
                    CONSTRAINT ops009_expected_after_check CHECK (
                        (command_kind, command_action) IN (
                            ('transaction_create', 'create'),
                            ('correspondence_register', 'register'),
                            ('correspondence_classify', 'classify'),
                            ('correspondence_route', 'route'),
                            ('correspondence_act', 'act'),
                            ('travel_record', 'record'),
                            ('travel_status', 'status')
                        )
                        OR (command_kind = 'transaction_transition'
                            AND command_action IN (
                                'forward', 'send_to_mayor', 'return_origin',
                                'request_information', 'assign', 'mark_review',
                                'approve', 'disapprove', 'close'
                            ))
                    )
                ) ON COMMIT DROP
                SQL);

            $definitions = DB::selectOne(<<<'SQL'
                SELECT
                    (SELECT pg_get_constraintdef(oid)
                        FROM pg_catalog.pg_constraint
                        WHERE conrelid = 'legacy_custody.operations'::regclass
                          AND conname = 'operations_check') AS actual_before,
                    (SELECT pg_get_constraintdef(oid)
                        FROM pg_catalog.pg_constraint
                        WHERE conrelid = 'pg_temp.ops009_expected_before'::regclass
                          AND conname = 'ops009_expected_before_check') AS expected_before,
                    (SELECT pg_get_constraintdef(oid)
                        FROM pg_catalog.pg_constraint
                        WHERE conrelid = 'pg_temp.ops009_expected_after'::regclass
                          AND conname = 'ops009_expected_after_check') AS expected_after
                SQL);

            if ($definitions === null || ! is_string($definitions->actual_before)
                || $definitions->actual_before !== $definitions->expected_before
                || ! is_string($definitions->expected_after)
                || $definitions->expected_after === $definitions->actual_before) {
                throw new RuntimeException('OPS009 refused noncanonical N03 operations_check definition.');
            }

            // One atomic ALTER TABLE; never expose a committed unguarded table.
            DB::unprepared(<<<'SQL'
                ALTER TABLE legacy_custody.operations
                    DROP CONSTRAINT operations_check,
                    ADD CONSTRAINT operations_check CHECK (
                        (command_kind, command_action) IN (
                            ('transaction_create', 'create'),
                            ('correspondence_register', 'register'),
                            ('correspondence_classify', 'classify'),
                            ('correspondence_route', 'route'),
                            ('correspondence_act', 'act'),
                            ('travel_record', 'record'),
                            ('travel_status', 'status')
                        )
                        OR (command_kind = 'transaction_transition'
                            AND command_action IN (
                                'forward', 'send_to_mayor', 'return_origin',
                                'request_information', 'assign', 'mark_review',
                                'approve', 'disapprove', 'close'
                            ))
                    )
                SQL);

            $after = DB::selectOne(<<<'SQL'
                SELECT pg_get_constraintdef(oid) AS definition
                  FROM pg_catalog.pg_constraint
                 WHERE conrelid = 'legacy_custody.operations'::regclass
                   AND conname = 'operations_check'
                SQL);

            if ($after === null || $after->definition !== $definitions->expected_after) {
                throw new RuntimeException('OPS009 close compatibility postcondition failed; rolling back.');
            }

            DB::statement('DROP TABLE pg_temp.ops009_expected_before');
            DB::statement('DROP TABLE pg_temp.ops009_expected_after');
        });
    }

    public function down(): void
    {
        throw new RuntimeException('OPS009 custody compatibility is forward-only; dispose the leased synthetic database.');
    }
};
