<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('document_import_revisions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('document_id')->unique()->constrained('documents')->restrictOnDelete();
            $table->foreignId('supersedes_revision_id')->nullable()->unique()
                ->constrained('document_import_revisions')->restrictOnDelete();
            $table->foreignId('root_revision_id')->nullable()
                ->constrained('document_import_revisions')->restrictOnDelete();
            $table->unsignedInteger('version_number');
            $table->foreignId('owner_department_id')->constrained('departments')->restrictOnDelete();
            $table->foreignId('actor_user_id')->constrained('users')->restrictOnDelete();
            $table->string('parent_type', 160);
            $table->unsignedBigInteger('parent_id');
            $table->string('relationship', 64);
            $table->string('source_system', 32);
            $table->string('source_file_id', 255);
            $table->string('source_revision', 128);
            $table->timestampTz('source_modified_at')->nullable();
            $table->string('original_filename', 255);
            $table->char('checksum_sha256', 64);
            $table->uuid('operation_key')->unique();
            $table->char('request_fingerprint', 64);
            $table->timestampsTz();

            $table->unique(
                ['owner_department_id', 'source_system', 'source_file_id', 'source_revision'],
                'doc_import_source_revision_unique'
            );
            $table->unique(['root_revision_id', 'version_number'], 'doc_import_root_version_unique');
            $table->index(['parent_type', 'parent_id']);
            $table->index(['checksum_sha256', 'owner_department_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_import_revisions');
    }
};
