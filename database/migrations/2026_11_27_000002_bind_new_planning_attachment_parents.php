<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('planning_attachments', function (Blueprint $table): void {
            // Typed by parent_type. Historical text links are deliberately not inferred.
            $table->unsignedBigInteger('parent_record_id')->nullable()->index();
        });
    }

    public function down(): void
    {
        throw new RuntimeException('Forward-only custody binding; retain document identity.');
    }
};
