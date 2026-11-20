<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('staff_activation_invitations', function (Blueprint $table): void {
            $table->timestampTz('disclosed_at')->nullable();
        });
    }

    public function down(): void
    {
        // Forward-only IAM disclosure history; do not remove the replay marker.
    }
};
