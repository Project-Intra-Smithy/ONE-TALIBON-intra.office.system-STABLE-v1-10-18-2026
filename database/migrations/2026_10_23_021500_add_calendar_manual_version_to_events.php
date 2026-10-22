<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('calendar_events', function (Blueprint $table): void {
            // Monotonic revision prevents same-second stale-edit collisions.
            // Generated source records are never mutable via manual endpoints.
            $table->unsignedInteger('manual_version')->default(1);
        });
    }

    public function down(): void
    {
        Schema::table('calendar_events', function (Blueprint $table): void {
            $table->dropColumn('manual_version');
        });
    }
};
