<?php

declare(strict_types=1);

/**
 * G1B disposable manual harness. Migrate as the bootstrap/migration authority,
 * install the G1B grants, then invoke this file with DB_USERNAME=kirion_g1b_app.
 * It intentionally lives outside PHPUnit discovery and always rolls back.
 */

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

if (DB::getDriverName() !== 'pgsql'
    || DB::scalar('select current_database()') !== 'talibon_portal_test'
    || DB::scalar('select current_user') !== 'kirion_g1b_app'
    || (int) DB::scalar("select current_setting('server_version_num')") < 160000
) {
    fwrite(STDERR, "TEST_ENVIRONMENT_LEASE_REQUIRED\n");
    exit(2);
}

$passed = 0;
$assert = static function (bool $condition, string $label) use (&$passed): void {
    if (! $condition) {
        throw new RuntimeException("FAIL: {$label}");
    }
    $passed++;
    fwrite(STDOUT, "PASS {$label}\n");
};

DB::beginTransaction();
try {
    $now = now();
    $departmentId = DB::table('departments')->insertGetId([
        'code' => 'G1B-QA', 'name' => 'G1B synthetic office',
        'is_active' => true, 'created_at' => $now, 'updated_at' => $now,
    ]);
    $userId = DB::table('users')->insertGetId([
        'name' => 'G1B Synthetic User', 'email' => 'g1b.synthetic@example.invalid',
        'password' => password_hash('not-a-real-credential', PASSWORD_BCRYPT),
        'role' => 'employee', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now,
    ]);
    DB::table('users')->where('id', $userId)->update(['mfa_version' => 1]);
    DB::table('password_reset_tokens')->insert([
        'email' => 'g1b.synthetic@example.invalid', 'token' => hash('sha256', 'synthetic'), 'created_at' => $now,
    ]);
    DB::table('portal_presence_sessions')->insert([
        'user_id' => $userId, 'session_hash' => hash('sha256', 'g1b-session'),
        'last_seen_at' => $now, 'created_at' => $now, 'updated_at' => $now,
    ]);
    $assert(DB::table('users')->where('id', $userId)->value('mfa_version') === 1
        && DB::table('portal_presence_sessions')->where('user_id', $userId)->exists(),
        'identity/MFA/password-reset/session writes');

    $employeeId = DB::table('employees')->insertGetId([
        'employee_number' => 'G1B-EMP-1', 'user_id' => $userId,
        'department_id' => $departmentId, 'position_title' => 'Synthetic Tester',
        'employment_status' => 'active', 'created_at' => $now, 'updated_at' => $now,
    ]);
    $assert($employeeId > 0, 'department/employee sequence and writes');

    $transactionId = DB::table('transactions')->insertGetId([
        'reference_no' => 'G1B-WF-1', 'transaction_type' => 'internal_request',
        'title' => 'G1B workflow', 'origin_department_id' => $departmentId,
        'current_department_id' => $departmentId, 'created_by_user_id' => $userId,
        'status' => 'submitted', 'created_at' => $now, 'updated_at' => $now,
    ]);
    DB::table('transaction_events')->insert([
        'transaction_id' => $transactionId, 'actor_user_id' => $userId,
        'to_department_id' => $departmentId, 'action' => 'created',
        'new_status' => 'submitted', 'created_at' => $now,
    ]);
    $assert(DB::table('transaction_events')->where('transaction_id', $transactionId)->exists(), 'workflow transaction/event writes');

    $documentId = DB::table('documents')->insertGetId([
        'public_id' => '20000000-0000-4000-8000-000000000001', 'title' => 'G1B ordinary attachment',
        'document_type' => 'supporting_document', 'classification' => 'internal',
        'storage_disk' => 'local', 'storage_path' => 'g1b/ordinary.txt',
        'owner_department_id' => $departmentId, 'uploaded_by_user_id' => $userId,
        'created_at' => $now, 'updated_at' => $now,
    ]);
    DB::table('document_links')->insert([
        'document_id' => $documentId, 'linkable_type' => 'App\\Models\\Transaction',
        'linkable_id' => $transactionId, 'relationship' => 'attachment',
        'created_by_user_id' => $userId, 'created_at' => $now, 'updated_at' => $now,
    ]);
    $assert(DB::table('document_links')->where('document_id', $documentId)->exists(), 'ordinary document attachment');

    $correspondenceId = DB::table('correspondence_records')->insertGetId([
        'public_id' => '20000000-0000-4000-8000-000000000002',
        'external_reference_no' => 'G1B-CORR-1', 'source' => 'manual',
        'sender_name' => 'Synthetic Sender', 'subject' => 'G1B correspondence',
        'received_at' => $now, 'receiving_department_id' => $departmentId,
        'registered_by_user_id' => $userId, 'registered_at' => $now,
        'lifecycle_state' => 'registered', 'created_at' => $now, 'updated_at' => $now,
    ]);
    DB::table('correspondence_events')->insert([
        'correspondence_record_id' => $correspondenceId, 'event' => 'registered',
        'new_lifecycle_state' => 'registered', 'actor_user_id' => $userId,
        'office_department_id' => $departmentId, 'occurred_at' => $now,
    ]);
    $assert(DB::table('correspondence_events')->where('correspondence_record_id', $correspondenceId)->exists(), 'correspondence record/event writes');

    $travelId = DB::table('travel_orders')->insertGetId([
        'public_id' => '20000000-0000-4000-8000-000000000003', 'reference_number' => 'G1B-TO-1',
        'issuance_date' => '2026-10-28', 'purpose' => 'Synthetic validation',
        'destination' => 'Synthetic destination', 'department_id' => $departmentId,
        'travel_start_date' => '2026-10-29', 'travel_end_date' => '2026-10-30',
        'status' => 'approved', 'recorded_by_user_id' => $userId,
        'created_at' => $now, 'updated_at' => $now,
    ]);
    DB::table('travel_order_employee')->insert([
        'travel_order_id' => $travelId, 'employee_id' => $employeeId,
        'created_at' => $now, 'updated_at' => $now,
    ]);
    DB::table('travel_order_events')->insert([
        'travel_order_id' => $travelId, 'actor_user_id' => $userId,
        'event' => 'recorded', 'to_status' => 'approved',
        'occurred_at' => $now, 'created_at' => $now,
    ]);
    $assert(DB::table('travel_order_events')->where('travel_order_id', $travelId)->exists(), 'travel order/evidence writes');

    DB::table('audit_logs')->insert([
        'actor_user_id' => $userId, 'actor_department_id' => $departmentId,
        'action' => 'g1b.synthetic', 'entity_type' => 'validation',
        'entity_id' => $transactionId, 'outcome' => 'allowed',
        'summary' => 'Synthetic G1B compatibility probe', 'created_at' => $now,
    ]);
    $assert(DB::table('audit_logs')->where('action', 'g1b.synthetic')->exists(), 'audit write/read');
    $assert(DB::table('documents')->where('id', $documentId)->whereNull('security_domain')->exists(), 'legacy Records/report projection read');

    try {
        DB::statement('CREATE TABLE public.g1b_laravel_forbidden(id integer)');
        throw new RuntimeException('FAIL: ordinary Laravel role acquired DDL');
    } catch (Throwable $e) {
        $sqlState = $e instanceof PDOException ? $e->getCode() : ($e->getPrevious()?->getCode() ?? '');
        $assert($sqlState === '42501', 'ordinary Laravel role denied DDL (42501)');
    }
} finally {
    DB::rollBack();
}

fwrite(STDOUT, "G1B_LARAVEL_COMPATIBILITY_PASS assertions={$passed}\n");
