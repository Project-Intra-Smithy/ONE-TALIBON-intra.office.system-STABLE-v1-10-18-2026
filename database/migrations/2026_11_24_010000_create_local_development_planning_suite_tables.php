<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('development_plans', function (Blueprint $table): void {
            $table->id();
            $table->string('plan_key', 120)->unique();
            $table->string('code', 100)->unique();
            $table->string('title', 255);
            $table->string('horizon', 64);
            $table->string('lead_office', 255);
            $table->foreignId('lead_department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->jsonb('coordinating_offices')->default('[]');
            $table->unsignedSmallInteger('coverage_start');
            $table->unsignedSmallInteger('coverage_end');
            $table->string('status', 64)->default('For review');
            $table->unsignedSmallInteger('sections_complete')->default(0);
            $table->unsignedSmallInteger('sections_total')->default(10);
            $table->string('last_action', 255)->nullable();
            $table->string('last_action_date', 32)->nullable();
            $table->string('next_milestone', 255)->nullable();
            $table->string('next_milestone_date', 32)->nullable();
            $table->text('required_action')->nullable();
            $table->string('authority', 255)->nullable();
            $table->string('document_ref', 120)->nullable();
            $table->string('provenance_status', 64)->default('provisional_draft');
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampsTz();
        });

        Schema::create('ppa_records', function (Blueprint $table): void {
            $table->id();
            $table->string('ppa_code', 100)->unique();
            $table->string('title', 255);
            $table->string('sector', 100);
            $table->string('responsible_office', 255);
            $table->foreignId('implementing_department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->unsignedSmallInteger('year');
            $table->string('related_development_plan', 255);
            $table->string('funding_source', 120);
            $table->string('status', 64)->default('Planned');
            $table->unsignedSmallInteger('related_project_count')->default(0);
            $table->string('priority', 64)->default('Routine');
            $table->text('implementation_context')->nullable();
            $table->string('location', 255)->nullable();
            $table->string('barangay', 120)->nullable();
            $table->decimal('appropriation_amount', 15, 2)->default(0);
            $table->decimal('ps_amount', 15, 2)->default(0);
            $table->decimal('mooe_amount', 15, 2)->default(0);
            $table->decimal('co_amount', 15, 2)->default(0);
            $table->decimal('climate_adaptation_amount', 15, 2)->default(0);
            $table->decimal('climate_mitigation_amount', 15, 2)->default(0);
            $table->boolean('gad_attributed')->default(false);
            $table->boolean('drrm_tagged')->default(false);
            $table->string('aip_reference_code', 120)->nullable();
            $table->string('target_quarter', 32)->nullable();
            $table->string('map_code', 100)->nullable();
            $table->string('provenance_status', 64)->default('provisional_draft');
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampsTz();
        });

        Schema::create('planning_maps', function (Blueprint $table): void {
            $table->id();
            $table->string('map_code', 100)->unique();
            $table->string('title', 255);
            $table->string('category', 100);
            $table->string('plan_code', 100);
            $table->string('scale', 64)->default('1:25,000');
            $table->string('crs', 64)->default('PRS92 / Luzon 1911');
            $table->string('coverage', 255)->default('Municipality-wide (25 Barangays)');
            $table->unsignedSmallInteger('updated_year')->default(2026);
            $table->string('status', 64)->default('For Review');
            $table->string('provenance_status', 64)->default('awaiting_official_gis');
            $table->text('summary')->nullable();
            $table->decimal('center_lat', 10, 6)->default(10.153100);
            $table->decimal('center_lng', 10, 6)->default(124.326800);
            $table->unsignedSmallInteger('default_zoom')->default(12);
            $table->jsonb('barangays')->default('[]');
            $table->jsonb('related_plan_codes')->default('[]');
            $table->jsonb('related_ppa_codes')->default('[]');
            $table->foreignId('lead_department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampsTz();
        });

        Schema::create('designated_planning_staff', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('department_id')->constrained('departments')->cascadeOnDelete();
            $table->boolean('can_manage_plans')->default(false);
            $table->boolean('can_manage_ppas')->default(false);
            $table->boolean('can_manage_maps')->default(false);
            $table->foreignId('designated_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->timestampTz('revoked_at')->nullable();
            $table->foreignId('revoked_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampsTz();

            $table->index(['user_id', 'revoked_at']);
        });

        Schema::create('planning_attachments', function (Blueprint $table): void {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->string('parent_type', 32); // plan | ppa | map
            $table->string('parent_code', 100);
            $table->string('title', 255);
            $table->string('file_name', 255);
            $table->string('mime_type', 120);
            $table->unsignedBigInteger('size_bytes');
            $table->string('checksum_sha256', 64);
            $table->string('storage_disk', 64)->default('documents');
            $table->string('storage_path', 512);
            $table->string('category', 64)->default('technical_narrative');
            $table->string('visibility', 64)->default('lgu_internal');
            $table->foreignId('owner_department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->foreignId('uploaded_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->timestampTz('archived_at')->nullable();
            $table->timestampsTz();

            $table->index(['parent_type', 'parent_code', 'archived_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('planning_attachments');
        Schema::dropIfExists('designated_planning_staff');
        Schema::dropIfExists('planning_maps');
        Schema::dropIfExists('ppa_records');
        Schema::dropIfExists('development_plans');
    }
};
