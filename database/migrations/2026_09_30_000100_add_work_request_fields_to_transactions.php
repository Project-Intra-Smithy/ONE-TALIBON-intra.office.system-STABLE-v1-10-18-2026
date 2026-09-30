<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table): void {
            $table->string('request_category', 80)->nullable()->index();
            $table->string('request_type', 120)->nullable()->index();
            $table->string('action_required', 80)->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table): void {
            $table->dropColumn(['request_category', 'request_type', 'action_required']);
        });
    }
};
