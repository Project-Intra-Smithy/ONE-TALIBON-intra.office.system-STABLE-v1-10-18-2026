<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Ambiguous historical grants need an explicit disposition; never choose a winner.
        if (DB::table('designated_planning_staff')->select('user_id')->whereNull('revoked_at')
            ->groupBy('user_id')->havingRaw('count(*) > 1')->exists()) {
            throw new RuntimeException('Resolve duplicate active planning designations before applying this migration.');
        }

        DB::statement('CREATE UNIQUE INDEX planning_staff_one_active_user ON designated_planning_staff (user_id) WHERE revoked_at IS NULL');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX planning_staff_one_active_user');
    }
};
