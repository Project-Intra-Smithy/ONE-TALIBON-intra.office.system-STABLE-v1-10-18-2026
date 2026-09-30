<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table): void {
            $table->index(
                ['assigned_employee_id', 'status', 'due_at'],
                'transactions_assignee_status_due_idx',
            );
            $table->index(
                ['current_department_id', 'status', 'due_at'],
                'transactions_office_status_due_idx',
            );
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table): void {
            $table->dropIndex('transactions_assignee_status_due_idx');
            $table->dropIndex('transactions_office_status_due_idx');
        });
    }
};
