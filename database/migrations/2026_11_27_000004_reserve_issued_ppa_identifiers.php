<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('planning_ppa_identifiers', function (Blueprint $table): void {
            $table->string('code', 100)->primary();
            $table->string('observation_source', 64);
            $table->timestampTz('observed_at');
        });
        // Reserve only observed identifiers. No claim to reconstruct absent deleted history.
        DB::statement("INSERT INTO planning_ppa_identifiers(code, observation_source, observed_at) SELECT ppa_code, 'existing_record', CURRENT_TIMESTAMP FROM ppa_records ON CONFLICT DO NOTHING");
        DB::statement("INSERT INTO planning_ppa_identifiers(code, observation_source, observed_at) SELECT DISTINCT parent_code, 'retained_attachment', CURRENT_TIMESTAMP FROM planning_attachments WHERE parent_type = 'ppa' ON CONFLICT DO NOTHING");
        DB::unprepared("CREATE FUNCTION planning_ppa_identifiers_immutable() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF TG_OP = 'TRUNCATE' AND NOT EXISTS (SELECT 1 FROM planning_ppa_identifiers) THEN RETURN NULL; END IF; RAISE EXCEPTION 'Issued Planning identifiers remain reserved'; END $$; CREATE TRIGGER planning_ppa_identifiers_immutable BEFORE UPDATE OR DELETE ON planning_ppa_identifiers FOR EACH ROW EXECUTE FUNCTION planning_ppa_identifiers_immutable(); CREATE TRIGGER planning_ppa_identifiers_no_truncate BEFORE TRUNCATE ON planning_ppa_identifiers FOR EACH STATEMENT EXECUTE FUNCTION planning_ppa_identifiers_immutable()");
    }

    public function down(): void
    {
        throw new RuntimeException('Issued Planning identifiers are retained; use reviewed recovery procedures.');
    }
};
