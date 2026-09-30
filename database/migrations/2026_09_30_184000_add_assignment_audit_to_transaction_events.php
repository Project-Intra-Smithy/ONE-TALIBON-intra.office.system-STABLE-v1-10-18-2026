<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('transaction_events', function (Blueprint $table): void {
            $table->foreignId('from_assigned_employee_id')
                ->nullable()
                ->constrained('employees')
                ->nullOnDelete();
            $table->foreignId('to_assigned_employee_id')
                ->nullable()
                ->constrained('employees')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('transaction_events', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('from_assigned_employee_id');
            $table->dropConstrainedForeignId('to_assigned_employee_id');
        });
    }
};
