<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Forward-only synthetic custody foundation. Do not run on a retained database.
 * It creates no Document, Plan binding, publication state, route, or byte access.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            throw new RuntimeException('Protected Plan custody requires PostgreSQL.');
        }

        Schema::create('plan_custody_generations', function (Blueprint $table): void {
            $table->id();
            $table->uuid('generation_id')->unique();
            $table->string('storage_disk', 64);
            $table->text('storage_locator')->unique();
            $table->char('sha256', 64);
            $table->unsignedBigInteger('size_bytes');
            $table->string('media_type', 96);
            $table->string('custody_state', 24)->default('QUARANTINED');
            $table->string('integrity_status', 24)->default('VERIFIED');
            $table->char('idempotency_key_hash', 64)->unique();
            $table->string('actor_id', 128);
            $table->string('office_id', 128);
            $table->string('service_identity', 128);
            $table->timestampTz('created_at')->useCurrent();
        });

        Schema::create('plan_custody_scan_evidence', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('plan_custody_generation_id')
                ->constrained('plan_custody_generations')->restrictOnDelete();
            $table->uuid('evidence_id')->unique();
            $table->string('decision', 24);
            $table->string('scanner_identity', 128);
            $table->string('engine_version', 128);
            $table->string('signature_version', 128);
            $table->char('scanned_sha256', 64);
            $table->unsignedBigInteger('scanned_size_bytes');
            $table->char('evidence_signature_hash', 64);
            $table->boolean('trusted')->default(true);
            $table->timestampTz('scanned_at');
            $table->timestampTz('received_at')->useCurrent();
            $table->unique(
                ['plan_custody_generation_id', 'evidence_id'],
                'plan_custody_scan_generation_evidence_unique',
            );
        });

        Schema::create('plan_custody_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('plan_custody_generation_id')
                ->constrained('plan_custody_generations')->restrictOnDelete();
            $table->uuid('event_id')->unique();
            $table->string('event_type', 64);
            $table->string('actor_id', 128);
            $table->string('office_id', 128);
            $table->string('service_identity', 128);
            $table->jsonb('details')->nullable();
            $table->timestampTz('occurred_at')->useCurrent();
        });

        DB::statement("ALTER TABLE plan_custody_generations ADD CONSTRAINT plan_custody_generation_sha_check CHECK (sha256 ~ '^[0-9a-f]{64}$')");
        DB::statement('ALTER TABLE plan_custody_generations ADD CONSTRAINT plan_custody_generation_size_check CHECK (size_bytes > 0)');
        DB::statement("ALTER TABLE plan_custody_generations ADD CONSTRAINT plan_custody_generation_media_check CHECK (media_type = 'application/pdf')");
        DB::statement("ALTER TABLE plan_custody_generations ADD CONSTRAINT plan_custody_generation_state_check CHECK (custody_state = 'QUARANTINED')");
        DB::statement("ALTER TABLE plan_custody_generations ADD CONSTRAINT plan_custody_generation_integrity_check CHECK (integrity_status = 'VERIFIED')");
        DB::statement("ALTER TABLE plan_custody_scan_evidence ADD CONSTRAINT plan_custody_scan_decision_check CHECK (decision IN ('CLEAN', 'REJECTED', 'ERROR'))");
        DB::statement("ALTER TABLE plan_custody_scan_evidence ADD CONSTRAINT plan_custody_scan_sha_check CHECK (scanned_sha256 ~ '^[0-9a-f]{64}$')");
        DB::statement('ALTER TABLE plan_custody_scan_evidence ADD CONSTRAINT plan_custody_scan_size_check CHECK (scanned_size_bytes > 0)');
        DB::statement('ALTER TABLE plan_custody_scan_evidence ADD CONSTRAINT plan_custody_scan_trusted_check CHECK (trusted = true)');

        DB::unprepared(<<<'SQL'
CREATE OR REPLACE FUNCTION kirion_plan_custody_generation_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
    RAISE EXCEPTION 'Plan custody generation metadata is immutable' USING ERRCODE = '23514';
END;
$$;

CREATE TRIGGER kirion_plan_custody_generation_guard_trigger
BEFORE UPDATE OR DELETE ON public.plan_custody_generations
FOR EACH ROW EXECUTE FUNCTION kirion_plan_custody_generation_guard();

CREATE OR REPLACE FUNCTION kirion_plan_custody_append_only_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
    RAISE EXCEPTION 'Plan custody evidence is append-only' USING ERRCODE = '23514';
END;
$$;

CREATE TRIGGER kirion_plan_custody_scan_append_only_trigger
BEFORE UPDATE OR DELETE ON public.plan_custody_scan_evidence
FOR EACH ROW EXECUTE FUNCTION kirion_plan_custody_append_only_guard();

CREATE TRIGGER kirion_plan_custody_event_append_only_trigger
BEFORE UPDATE OR DELETE ON public.plan_custody_events
FOR EACH ROW EXECUTE FUNCTION kirion_plan_custody_append_only_guard();

CREATE OR REPLACE FUNCTION kirion_plan_custody_scan_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE
    generation record;
BEGIN
    SELECT sha256, size_bytes, custody_state INTO generation
      FROM public.plan_custody_generations
     WHERE id = NEW.plan_custody_generation_id;
    IF NOT FOUND
       OR generation.custody_state IS DISTINCT FROM 'QUARANTINED'
       OR generation.sha256 IS DISTINCT FROM NEW.scanned_sha256
       OR generation.size_bytes IS DISTINCT FROM NEW.scanned_size_bytes
    THEN
        RAISE EXCEPTION 'scanner evidence must pin the quarantined generation digest and size'
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER kirion_plan_custody_scan_guard_trigger
BEFORE INSERT ON public.plan_custody_scan_evidence
FOR EACH ROW EXECUTE FUNCTION kirion_plan_custody_scan_guard();
SQL);
    }

    public function down(): void
    {
        throw new LogicException('Protected custody evidence is forward-only: rollback prohibited.');
    }
};
