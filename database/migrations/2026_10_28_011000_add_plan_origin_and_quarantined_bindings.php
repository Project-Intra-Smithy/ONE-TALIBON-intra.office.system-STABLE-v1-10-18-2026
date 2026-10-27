<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Forward-only, synthetic-only source draft. Do NOT migrate a retained DB.
 * Binding remains QUARANTINED until G1/DBA/Identity/IT clearance.
 */
return new class extends Migration {
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            throw new RuntimeException('EVER_PLAN custody requires PostgreSQL.');
        }

        Schema::table('documents', function (Blueprint $table): void {
            $table->string('security_domain', 16)->nullable();
        });

        DB::statement("ALTER TABLE documents ADD CONSTRAINT documents_plan_origin_domain_check CHECK (security_domain IN ('EVER_PLAN', 'LEGACY_CTW'))");

        Schema::create('plan_document_origin_receipts', function (Blueprint $table): void {
            $table->unsignedBigInteger('document_id')->primary();
            $table->foreign('document_id')->references('id')->on('documents')->restrictOnDelete();
            $table->string('origin', 16)->default('EVER_PLAN');
            $table->timestampTz('sealed_at')->useCurrent();
        });
        DB::statement("ALTER TABLE plan_document_origin_receipts ADD CONSTRAINT plan_origin_receipt_only_check CHECK (origin = 'EVER_PLAN')");

        Schema::create('plan_document_bindings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('plan_edition_id')->constrained('plan_editions')->restrictOnDelete();
            $table->foreignId('document_id')->unique()->constrained('documents')->restrictOnDelete();
            $table->string('role', 16);
            $table->unsignedInteger('revision_no');
            $table->string('binding_state', 24)->default('QUARANTINED');
            $table->timestampsTz();
            $table->unique(['plan_edition_id', 'role', 'revision_no'], 'plan_bindings_edition_role_revision_unique');
        });
        DB::statement("ALTER TABLE plan_document_bindings ADD CONSTRAINT plan_bindings_role_check CHECK (role IN ('master', 'annex'))");
        DB::statement("ALTER TABLE plan_document_bindings ADD CONSTRAINT plan_bindings_revision_check CHECK (revision_no > 0)");
        DB::statement("ALTER TABLE plan_document_bindings ADD CONSTRAINT plan_bindings_quarantine_check CHECK (binding_state = 'QUARANTINED')");

        DB::unprepared(<<<'SQL'
CREATE OR REPLACE FUNCTION kirion_plan_document_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.security_domain = 'EVER_PLAN' OR EXISTS
            (SELECT 1 FROM public.plan_document_origin_receipts WHERE document_id = OLD.id)
        THEN
            RAISE EXCEPTION 'sealed Plan document cannot be deleted' USING ERRCODE = '23514';
        END IF;
        RETURN OLD;
    END IF;
    IF TG_OP = 'UPDATE' AND (
        OLD.security_domain = 'EVER_PLAN' OR EXISTS
            (SELECT 1 FROM public.plan_document_origin_receipts WHERE document_id = OLD.id)
    ) THEN
        IF to_jsonb(NEW) IS DISTINCT FROM to_jsonb(OLD) THEN
            RAISE EXCEPTION 'sealed Plan document is immutable' USING ERRCODE = '23514';
        END IF;
        RETURN NEW;
    END IF;
    IF NEW.security_domain = 'EVER_PLAN' AND EXISTS
        (SELECT 1 FROM public.document_links WHERE document_id = NEW.id)
    THEN
        RAISE EXCEPTION 'Plan origin requires zero generic document links' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER kirion_plan_document_guard_trigger
BEFORE INSERT OR UPDATE OR DELETE ON public.documents
FOR EACH ROW EXECUTE FUNCTION kirion_plan_document_guard();

CREATE OR REPLACE FUNCTION kirion_plan_origin_receipt_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE
    domain_value text;
BEGIN
    IF TG_OP <> 'INSERT' THEN
        RAISE EXCEPTION 'Plan origin is append-only' USING ERRCODE = '23514';
    END IF;
    SELECT security_domain INTO domain_value FROM public.documents
        WHERE id = NEW.document_id FOR UPDATE;
    IF domain_value IS DISTINCT FROM 'EVER_PLAN' OR EXISTS
        (SELECT 1 FROM public.document_links WHERE document_id = NEW.document_id)
    THEN
        RAISE EXCEPTION 'Plan origin requires a sealed isolated document' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER kirion_plan_receipt_guard_trigger
BEFORE INSERT OR UPDATE OR DELETE ON public.plan_document_origin_receipts
FOR EACH ROW EXECUTE FUNCTION kirion_plan_origin_receipt_guard();

CREATE OR REPLACE FUNCTION kirion_plan_stamp_origin() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
    IF NEW.security_domain = 'EVER_PLAN' THEN
        INSERT INTO public.plan_document_origin_receipts (document_id, origin)
        VALUES (NEW.id, 'EVER_PLAN') ON CONFLICT (document_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER kirion_plan_stamp_origin_trigger
AFTER INSERT OR UPDATE OF security_domain ON public.documents
FOR EACH ROW EXECUTE FUNCTION kirion_plan_stamp_origin();

CREATE OR REPLACE FUNCTION kirion_plan_generic_link_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE
    affected_id bigint;
    candidate record;
BEGIN
    -- A generic Document must never attach to a Plan-family/edition morph,
    -- even when it has not been sealed as EVER_PLAN. Review custom aliases at G1.
    IF TG_OP IN ('INSERT', 'UPDATE') AND (
        right(NEW.linkable_type, 11) = 'PlanEdition'
        OR right(NEW.linkable_type, 10) = 'PlanFamily'
        OR lower(NEW.linkable_type) IN ('plan_edition', 'plan_family', 'planedition', 'planfamily')
    ) THEN
        RAISE EXCEPTION 'Plan associations must use typed bindings only' USING ERRCODE = '23514';
    END IF;

    FOR affected_id IN
        SELECT DISTINCT doc_id FROM (
            SELECT CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN OLD.document_id ELSE NULL END AS doc_id
            UNION ALL
            SELECT CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN NEW.document_id ELSE NULL END
        ) AS ids WHERE doc_id IS NOT NULL ORDER BY doc_id
    LOOP
        SELECT id, security_domain INTO candidate FROM public.documents
            WHERE id = affected_id FOR UPDATE;
        IF FOUND AND (candidate.security_domain = 'EVER_PLAN' OR EXISTS
            (SELECT 1 FROM public.plan_document_origin_receipts WHERE document_id = affected_id))
        THEN
            RAISE EXCEPTION 'generic document link forbidden for sealed Plan' USING ERRCODE = '23514';
        END IF;
    END LOOP;
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER kirion_plan_generic_link_guard_trigger
BEFORE INSERT OR UPDATE OR DELETE ON public.document_links
FOR EACH ROW EXECUTE FUNCTION kirion_plan_generic_link_guard();

CREATE OR REPLACE FUNCTION kirion_plan_typed_binding_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE
    domain_value text;
BEGIN
    IF TG_OP <> 'INSERT' THEN
        RAISE EXCEPTION 'typed Plan association cannot be mutated by ordinary DML' USING ERRCODE = '23514';
    END IF;
    SELECT security_domain INTO domain_value FROM public.documents
        WHERE id = NEW.document_id FOR UPDATE;
    IF domain_value IS DISTINCT FROM 'EVER_PLAN'
        OR NOT EXISTS (SELECT 1 FROM public.plan_document_origin_receipts WHERE document_id = NEW.document_id)
        OR EXISTS (SELECT 1 FROM public.document_links WHERE document_id = NEW.document_id)
    THEN
        RAISE EXCEPTION 'typed binding requires exclusive sealed Plan provenance' USING ERRCODE = '23514';
    END IF;
    IF NEW.binding_state IS DISTINCT FROM 'QUARANTINED' THEN
        RAISE EXCEPTION 'protected Plan publication remains disabled' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER kirion_plan_typed_binding_guard_trigger
BEFORE INSERT OR UPDATE OR DELETE ON public.plan_document_bindings
FOR EACH ROW EXECUTE FUNCTION kirion_plan_typed_binding_guard();
SQL);
    }

    public function down(): void
    {
        // EVER_PLAN may not downgrade to ordinary legacy custody on rollback.
        throw new LogicException('EVER_PLAN origin is permanent: rollback prohibited.');
    }
};
