<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('username', 64)->nullable()->unique()->after('name');
            $table->string('account_status', 32)->default('active')->index()->after('is_active');
            $table->unsignedBigInteger('session_version')->default(1)->after('account_status');
            $table->timestampTz('suspended_at')->nullable()->after('session_version');
            $table->foreignId('suspended_by_user_id')->nullable()->after('suspended_at')->constrained('users')->nullOnDelete();
        });

        DB::statement('ALTER TABLE users ALTER COLUMN email DROP NOT NULL');
        DB::statement('ALTER TABLE employees ALTER COLUMN employee_number DROP NOT NULL');

        Schema::create('initial_admin_bootstraps', function (Blueprint $table): void {
            $table->unsignedTinyInteger('id')->primary();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('created_at')->useCurrent();
        });

        Schema::create('staff_activation_invitations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->restrictOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('department_id')->constrained('departments')->restrictOnDelete();
            $table->foreignId('created_by_user_id')->constrained('users')->restrictOnDelete();
            $table->string('username', 64);
            $table->string('contact_email')->nullable();
            $table->string('role', 64);
            $table->char('code_digest', 64)->unique();
            $table->timestampTz('expires_at');
            $table->timestampTz('consumed_at')->nullable();
            $table->timestampTz('revoked_at')->nullable();
            $table->string('revocation_reason', 255)->nullable();
            $table->timestampsTz();
            $table->index(['user_id', 'consumed_at', 'revoked_at']);
            $table->index(['employee_id', 'created_at']);
        });
    }

    public function down(): void
    {
        // IAM identity and audit history are intentionally forward-only.
    }
};
