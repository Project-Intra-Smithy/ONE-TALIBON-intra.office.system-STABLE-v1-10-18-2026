<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prototype_messages', function (Blueprint $table): void {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->string('channel', 64);
            $table->foreignId('sender_user_id')->constrained('users')->restrictOnDelete();
            $table->text('body');
            $table->timestamps();
            $table->index(['channel', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prototype_messages');
    }
};
