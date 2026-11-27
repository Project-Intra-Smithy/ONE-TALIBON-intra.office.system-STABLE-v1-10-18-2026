<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('planning_reference_counters', function (Blueprint $table): void {
            $table->unsignedSmallInteger('year')->primary();
            $table->unsignedBigInteger('last_number')->default(100);
        });
        Schema::table('development_plans', function (Blueprint $table): void {
            $table->jsonb('chapters')->nullable();
            $table->date('adoption_date')->nullable();
            $table->string('adoption_reference', 255)->nullable();
            $table->string('mdc_reference', 255)->nullable();
            $table->string('higher_review_reference', 255)->nullable();
        });
        Schema::table('ppa_records', function (Blueprint $table): void {
            $table->foreignId('development_plan_id')->nullable()->constrained('development_plans')->restrictOnDelete();
            $table->foreignId('planning_map_id')->nullable()->constrained('planning_maps')->restrictOnDelete();
            $table->date('schedule_start')->nullable();
            $table->date('schedule_end')->nullable();
            $table->text('expected_outputs')->nullable();
            $table->jsonb('covered_barangays')->nullable();
        });
        Schema::table('planning_maps', function (Blueprint $table): void {
            $table->foreignId('development_plan_id')->nullable()->constrained('development_plans')->restrictOnDelete();
            $table->foreignId('plate_attachment_id')->nullable()->constrained('planning_attachments')->restrictOnDelete();
            $table->string('source_attribution', 1000)->nullable();
            $table->string('effective_period', 255)->nullable();
            $table->string('authority', 255)->nullable();
            $table->text('legend_notes')->nullable();
        });
        Schema::create('planning_attachment_reconciliations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('attachment_id')->unique()->constrained('planning_attachments')->restrictOnDelete();
            $table->unsignedBigInteger('parent_record_id');
            $table->foreignId('actor_user_id')->constrained('users')->restrictOnDelete();
            $table->text('evidence_reference');
            $table->timestampTz('created_at');
        });
        Schema::create('planning_plan_map_links', function (Blueprint $table): void {
            $table->foreignId('development_plan_id')->constrained('development_plans')->restrictOnDelete();
            $table->foreignId('planning_map_id')->constrained('planning_maps')->restrictOnDelete();
            $table->primary(['development_plan_id', 'planning_map_id']);
        });
        // Existing values are retained verbatim. Missing future facts stay unknown.
        foreach (['appropriation_amount', 'ps_amount', 'mooe_amount', 'co_amount', 'climate_adaptation_amount', 'climate_mitigation_amount'] as $column) {
            DB::statement("ALTER TABLE ppa_records ALTER COLUMN {$column} DROP NOT NULL, ALTER COLUMN {$column} DROP DEFAULT");
        }
        foreach (['scale', 'crs', 'coverage', 'updated_year', 'center_lat', 'center_lng', 'default_zoom'] as $column) {
            DB::statement("ALTER TABLE planning_maps ALTER COLUMN {$column} DROP NOT NULL, ALTER COLUMN {$column} DROP DEFAULT");
        }
        DB::unprepared("CREATE FUNCTION planning_reconciliation_immutable() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Planning reconciliation evidence is immutable'; END $$; CREATE TRIGGER planning_reconciliation_immutable BEFORE UPDATE OR DELETE ON planning_attachment_reconciliations FOR EACH ROW EXECUTE FUNCTION planning_reconciliation_immutable(); CREATE TRIGGER planning_reconciliation_no_truncate BEFORE TRUNCATE ON planning_attachment_reconciliations FOR EACH STATEMENT EXECUTE FUNCTION planning_reconciliation_immutable()");
    }

    public function down(): void
    {
        throw new RuntimeException('Forward-only retained Planning evidence; use reviewed recovery procedures.');
    }
};
