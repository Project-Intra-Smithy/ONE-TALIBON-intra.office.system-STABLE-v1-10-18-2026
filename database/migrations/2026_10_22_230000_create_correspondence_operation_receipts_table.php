<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('correspondence_operation_receipts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('correspondence_record_id')
                ->constrained('correspondence_records')->restrictOnDelete();
            $table->uuid('operation_key');
            $table->string('operation_type', 64);
            $table->char('payload_digest', 64);
            $table->foreignId('correspondence_event_id')
                ->unique()->constrained('correspondence_events')->restrictOnDelete();
            $table->foreignId('actor_user_id')->constrained('users')->restrictOnDelete();
            $table->timestampTz('created_at');
            $table->unique(['correspondence_record_id', 'operation_key'], 'correspondence_custody_idempotency_unique');
            $table->index(['correspondence_record_id', 'operation_type'], 'correspondence_custody_type_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('correspondence_operation_receipts');
    }
};
