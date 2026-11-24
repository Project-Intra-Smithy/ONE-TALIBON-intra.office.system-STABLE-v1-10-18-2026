<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function (): void {
            // Serialize preflight and index installation against concurrent writers.
            DB::statement('LOCK TABLE users, staff_activation_invitations IN SHARE ROW EXCLUSIVE MODE');

            foreach (['username', 'email'] as $field) {
                if (DB::table('users')->selectRaw('1')->whereNotNull($field)
                    ->groupByRaw("lower(btrim({$field}))")->havingRaw('count(*) > 1')->exists()) {
                    throw new RuntimeException('IAM identity integrity preflight failed: ambiguous normalized login. Resolve through authorized identity reconciliation before migration.');
                }
            }
            if (DB::table('staff_activation_invitations')->selectRaw('1')->whereNull('consumed_at')->whereNull('revoked_at')
                ->groupBy('user_id')->havingRaw('count(*) > 1')->exists()) {
                throw new RuntimeException('IAM identity integrity preflight failed: multiple outstanding invitations. Resolve through authorized invitation reconciliation before migration.');
            }

            // Historical pre-IAM inactive accounts defaulted to status active.
            // Correct only the contradiction that was already access-denied;
            // never reactivate, merge, move, or reassign an existing identity.
            DB::table('users')->where('is_active', false)->where('account_status', 'active')->update([
                'account_status' => 'deactivated',
                'session_version' => DB::raw('session_version + 1'),
                'remember_token' => null,
                'updated_at' => now(),
            ]);

            DB::statement('CREATE UNIQUE INDEX users_iam_username_normalized_unique ON users (lower(btrim(username))) WHERE username IS NOT NULL');
            DB::statement('CREATE UNIQUE INDEX users_iam_email_normalized_unique ON users (lower(btrim(email))) WHERE email IS NOT NULL');
            DB::statement('CREATE UNIQUE INDEX staff_activation_one_outstanding_per_user ON staff_activation_invitations (user_id) WHERE consumed_at IS NULL AND revoked_at IS NULL');
        });
    }

    public function down(): void
    {
        // Forward-only identity integrity; do not silently remove protections.
    }
};
