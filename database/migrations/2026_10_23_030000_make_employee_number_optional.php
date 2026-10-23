<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Preserve the existing unique legacy reference; PostgreSQL permits multiple NULLs.
        // employees.id remains the primary key for all account/invitation bindings.
        Schema::table('employees', function (Blueprint $table): void {
            $table->string('employee_number', 64)->nullable()->change();
        });
    }

    public function down(): void
    {
        if (DB::table('employees')->whereNull('employee_number')->exists()) {
            throw new RuntimeException('Cannot require official employee numbers while unnumbered records exist.');
        }
        Schema::table('employees', function (Blueprint $table): void {
            $table->string('employee_number', 64)->change();
        });
    }
};
