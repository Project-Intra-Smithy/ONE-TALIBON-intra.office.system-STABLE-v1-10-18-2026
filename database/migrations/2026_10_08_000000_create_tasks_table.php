<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table): void {
            $table->id();
            $table->string('title');
            $table->text('instructions')->nullable();
            $table->string('state', 64)->index();
            $table->foreignId('created_by_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('assigned_to_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('source_domain', 64)->nullable();
            $table->string('source_type', 160)->nullable();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->timestampTz('due_at')->nullable()->index();
            $table->timestampTz('completed_at')->nullable()->index();
            $table->timestampsTz();

            $table->index(['assigned_to_user_id', 'state']);
            $table->index(['source_domain', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
