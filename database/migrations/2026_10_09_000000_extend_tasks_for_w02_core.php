<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            // Existing W01 rows remain unclassified; never backfill them as official.
            $table->string('task_kind', 32)->nullable()->index();
            $table->foreignId('owning_department_id')->nullable()
                ->constrained('departments')->restrictOnDelete();
            $table->index(['task_kind', 'created_by_user_id', 'state'], 'tasks_kind_creator_state_index');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->dropIndex('tasks_kind_creator_state_index');
            $table->dropConstrainedForeignId('owning_department_id');
            $table->dropColumn('task_kind');
        });
    }
};
