<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('google_identity_bindings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->restrictOnDelete();
            $table->string('google_subject', 255)->unique();
            $table->string('verified_email_at_link', 254);
            $table->foreignId('linked_by_user_id')->constrained('users')->restrictOnDelete();
            $table->timestampTz('linked_at');
            $table->timestampTz('revoked_at')->nullable();
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('google_identity_bindings');
    }
};
