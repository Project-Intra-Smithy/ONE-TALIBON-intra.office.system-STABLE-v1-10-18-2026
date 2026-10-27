<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Synthetic-only metadata schema, not an approved municipal records migration.
 * No Document binding, grant, approval state, PDF path or public route.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('plan_families', function (Blueprint $table): void {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->string('title');
            $table->timestampsTz();
        });

        Schema::create('plan_editions', function (Blueprint $table): void {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->foreignId('plan_family_id')
                ->constrained('plan_families')
                ->restrictOnDelete();
            $table->string('edition_label');
            $table->timestampsTz();
            $table->unique(
                ['plan_family_id', 'edition_label'],
                'plan_editions_family_label_unique',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_editions');
        Schema::dropIfExists('plan_families');
    }
};
