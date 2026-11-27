<?php

declare(strict_types=1);

namespace Tests\Feature\Planning;

use App\Http\Controllers\Planning\PpaController;
use App\Models\AuditLog;
use App\Models\DesignatedPlanningStaff;
use App\Models\DevelopmentPlan;
use App\Models\PlanningAttachment;
use App\Models\PlanningMap;
use App\Models\PpaRecord;
use App\Models\User;
use App\Services\Planning\PlanningAuthorizationService;
use App\Services\Planning\PlanningSuiteInitializer;
use Database\Seeders\PlanningReferenceSampleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Tests\TestCase;

final class LocalDevelopmentPlanningSuiteTest extends TestCase
{
    use RefreshDatabase;

    public function test_policy_185_technical_admin_has_zero_municipal_planning_decision_authority(): void
    {
        $this->seed();
        Storage::fake('documents');

        $admin = User::query()->where('email', 'admin@talibon.demo')->firstOrFail();
        $mpdcHead = User::query()->where('email', 'planning@talibon.demo')->firstOrFail();
        $mpdcEmployee = User::query()->where('email', 'employee@talibon.demo')->firstOrFail();

        $perms = app(PlanningAuthorizationService::class)->resolve($admin);
        $this->assertFalse($perms['isMpdcHead']);
        $this->assertFalse($perms['canManagePlans']);
        $this->assertFalse($perms['canManagePpas']);
        $this->assertFalse($perms['canManageMaps']);
        $this->assertFalse($perms['canPublishOrArchive']);
        $this->assertFalse($perms['canDelete']);
        $this->assertFalse($perms['canDesignateStaff']);
        $this->assertFalse($perms['canUploadAttachments']);
        $this->assertTrue($perms['canViewExecutiveAttachments']);

        // 1. system_admin denied on Plan creation
        $this->actingAs($admin)->post('/development-plans', [
            'code' => 'ADMIN-PLAN-2026',
            'title' => 'Unauthorized Admin Plan',
            'horizon' => 'Annual',
            'lead_office' => 'Municipal Planning and Development Office',
            'coverage_start' => 2026,
            'coverage_end' => 2026,
            'status' => 'Draft',
        ])->assertForbidden();

        // 2. system_admin denied on PPA creation
        $this->actingAs($admin)->post('/ppas', [
            'title' => 'Unauthorized Admin PPA',
            'sector' => 'Infrastructure',
            'year' => 2026,
            'related_development_plan' => 'Comprehensive Development Plan',
            'funding_source' => 'General Fund',
        ])->assertForbidden();

        // 3. system_admin denied on Map creation
        $this->actingAs($admin)->post('/planning-maps', [
            'map_code' => 'MAP-ADMIN-01',
            'title' => 'Unauthorized Admin Map',
            'category' => 'Macro & Spatial',
            'plan_code' => 'CLUP 2020–2029',
            'status' => 'Draft',
        ])->assertForbidden();

        // 4. system_admin denied on MPDC Staff Designation
        $this->actingAs($admin)->post('/planning/designated-staff', [
            'employee_id' => $mpdcEmployee->employee->id,
            'can_manage_plans' => true,
        ])->assertForbidden();

        // 5. MPDC Head creates a genuine draft plan and uploads an mpdc_executive attachment; eligible system_admin retains internal read access without mutation authority
        $this->actingAs($mpdcHead)->post('/development-plans', [
            'code' => 'MPDC-EXEC-DRAFT-2027',
            'title' => 'Executive Draft Working Plan',
            'horizon' => 'Annual',
            'lead_office' => 'Municipal Planning and Development Office',
            'coverage_start' => 2027,
            'coverage_end' => 2027,
            'status' => 'Draft',
        ])->assertRedirect();

        $pdfBytes = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF";
        $this->actingAs($mpdcHead)->post('/planning/attachments', [
            'parent_type' => 'plan',
            'parent_code' => 'MPDC-EXEC-DRAFT-2027',
            'title' => 'Executive Draft Review Notes',
            'category' => 'working_draft',
            'visibility' => 'mpdc_executive',
            'file' => UploadedFile::fake()->createWithContent('exec-notes.pdf', $pdfBytes),
        ])->assertRedirect();

        $attachment = PlanningAttachment::query()->where('title', 'Executive Draft Review Notes')->firstOrFail();
        $this->actingAs($admin)->get("/planning/attachments/{$attachment->public_id}/preview")->assertOk();
        $this->actingAs($admin)->get("/planning/attachments/{$attachment->public_id}/download")->assertOk();
    }

    public function test_mpdc_head_full_crud_and_designated_staff_granular_boolean_scopes(): void
    {
        $this->seed();

        $mpdcHead = User::query()->where('email', 'planning@talibon.demo')->firstOrFail();
        $mpdcStaff = User::query()->where('email', 'employee@talibon.demo')->firstOrFail();

        // Initially, undesignated MPDC staff has zero management scopes
        $initialPerms = app(PlanningAuthorizationService::class)->resolve($mpdcStaff);
        $this->assertFalse($initialPerms['canManagePlans']);
        $this->assertFalse($initialPerms['canManagePpas']);
        $this->assertFalse($initialPerms['canManageMaps']);

        $this->actingAs($mpdcStaff)->post('/development-plans', [
            'code' => 'STAFF-PLAN-01',
            'title' => 'Undesignated Staff Plan',
            'horizon' => 'Annual',
            'lead_office' => 'Municipal Planning and Development Office',
            'coverage_start' => 2027,
            'coverage_end' => 2027,
            'status' => 'Draft',
        ])->assertForbidden();

        // MPDC Head designates staff with ONLY can_manage_plans = true (can_manage_ppas and can_manage_maps default to false)
        $this->actingAs($mpdcHead)->post('/planning/designated-staff', [
            'employee_id' => $mpdcStaff->employee->id,
            'can_manage_plans' => true,
        ])->assertRedirect();

        $designation = DesignatedPlanningStaff::query()->where('user_id', $mpdcStaff->id)->whereNull('revoked_at')->firstOrFail();
        $this->assertTrue($designation->can_manage_plans);
        $this->assertFalse($designation->can_manage_ppas);
        $this->assertFalse($designation->can_manage_maps);

        // Designated staff with can_manage_plans = true can create a Draft / For review Plan
        $this->actingAs($mpdcStaff)->post('/development-plans', [
            'code' => 'SECT-PLAN-2027',
            'title' => 'Local Cultural Heritage Conservation Plan',
            'horizon' => 'Sectoral',
            'lead_office' => 'Municipal Planning and Development Office',
            'coverage_start' => 2027,
            'coverage_end' => 2030,
            'status' => 'For review',
        ])->assertRedirect();

        $plan = DevelopmentPlan::query()->where('code', 'SECT-PLAN-2027')->firstOrFail();
        $this->assertSame('provisional_draft', $plan->provenance_status);

        // Designated staff cannot publish/adopt; Engineer #7203434407 permits scoped draft removal.
        $this->actingAs($mpdcStaff)->post("/development-plans/{$plan->id}/status", [
            'status' => 'In force',
            'authority' => 'SB Resolution No. 2027-01',
        ])->assertForbidden();

        $removable = $plan->replicate();
        $removable->code = 'SCOPED-REMOVAL';
        $removable->plan_key = 'scoped-removal';
        $removable->save();
        $this->actingAs($mpdcStaff)->delete("/development-plans/{$removable->id}")->assertRedirect();
        $this->assertNull($removable->fresh());

        // Designated staff with can_manage_ppas = false is denied on PPA creation and Map creation
        $this->actingAs($mpdcStaff)->post('/ppas', [
            'title' => 'Out of scope PPA by Plan-only Staff',
            'sector' => 'Social',
            'year' => 2027,
            'related_development_plan' => 'SECT-PLAN-2027',
            'funding_source' => 'General Fund',
        ])->assertForbidden();

        $this->actingAs($mpdcStaff)->post('/planning-maps', [
            'map_code' => 'MAP-OUT-OF-SCOPE',
            'title' => 'Out of scope Map',
            'category' => 'Macro & Spatial',
            'plan_code' => 'SECT-PLAN-2027',
            'status' => 'Draft',
        ])->assertForbidden();

        // MPDC Head can transition plan status to In force with authority reference
        $this->actingAs($mpdcHead)->post("/development-plans/{$plan->id}/status", [
            'status' => 'In force',
            'authority' => 'SB Resolution No. 2027-045',
        ])->assertRedirect();
        $this->assertSame('In force', $plan->fresh()->status);

        // MPDC Head revokes staff designation
        $this->actingAs($mpdcHead)->delete("/planning/designated-staff/{$designation->id}")->assertRedirect();
        $this->assertNotNull($designation->fresh()->revoked_at);
        $this->assertFalse(app(PlanningAuthorizationService::class)->resolve($mpdcStaff)['canManagePlans']);
    }

    public function test_implementing_office_head_can_propose_own_office_draft_ppa_and_is_isolated_from_other_offices(): void
    {
        $this->seed();
        Storage::fake('documents');

        $engHead = User::query()->where('email', 'engineering@talibon.demo')->firstOrFail();
        $budgetHead = User::query()->where('email', 'budget@talibon.demo')->firstOrFail();
        $ordinaryEmployee = User::query()->where('email', 'employee@talibon.demo')->firstOrFail();

        // Engineering Head submits a Planned/Draft PPA proposal
        $this->actingAs($engHead)->post('/ppas', [
            'ppa_code' => 'PPA-2027-901',
            'title' => 'Barangay San Jose Box Culvert Rehabilitation',
            'sector' => 'Infrastructure',
            'year' => 2027,
            'related_development_plan' => 'Local Development Investment Program',
            'funding_source' => '20% Development Fund',
            'status' => 'Planned',
            'ps_amount' => '0.00',
            'mooe_amount' => 150000,
            'co_amount' => 1850000,
        ])->assertRedirect();

        $ppa = PpaRecord::query()->where('ppa_code', 'PPA-2027-901')->firstOrFail();
        $this->assertSame('Municipal Engineering Office', $ppa->responsible_office);
        $this->assertSame(2000000.0, (float) $ppa->appropriation_amount);

        // Engineering Head cannot mark a PPA as Completed
        $this->actingAs($engHead)->post("/ppas/{$ppa->id}/status", [
            'status' => 'Completed',
        ])->assertForbidden();

        // Budget Head cannot edit Engineering's PPA proposal
        $this->actingAs($budgetHead)->put("/ppas/{$ppa->id}", [
            'title' => 'Tampered by Budget Head',
            'sector' => 'Infrastructure',
            'year' => 2027,
            'related_development_plan' => 'Local Development Investment Program',
            'funding_source' => '20% Development Fund',
            'status' => 'Planned',
        ])->assertForbidden();

        // Engineering Head uploads an office_restricted attachment to their own PPA
        $pdfContent = "%PDF-1.4\n% Engineering POW\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF";
        $this->actingAs($engHead)->post('/planning/attachments', [
            'parent_type' => 'ppa',
            'parent_code' => 'PPA-2027-901',
            'title' => 'Engineering Program of Works (Office Restricted)',
            'category' => 'technical_narrative',
            'visibility' => 'office_restricted',
            'file' => UploadedFile::fake()->createWithContent('eng-pow.pdf', $pdfContent),
        ])->assertRedirect();

        $attachment = PlanningAttachment::query()->where('parent_code', 'PPA-2027-901')->firstOrFail();

        // Engineering Head can preview and download exact bytes
        $preview = $this->actingAs($engHead)->get("/planning/attachments/{$attachment->public_id}/preview");
        $preview->assertOk();
        $this->assertSame($pdfContent, $preview->streamedContent());

        // Engineer #7203434407: cross-office personnel retain internal supporting-document reads.
        $this->actingAs($budgetHead)->get("/planning/attachments/{$attachment->public_id}/preview")->assertOk();
        $this->actingAs($ordinaryEmployee)->get("/planning/attachments/{$attachment->public_id}/download")->assertOk();
    }

    public function test_csv_export_neutralizes_spreadsheet_formula_injection_and_streams_aip_columns(): void
    {
        $this->seed();

        $mpdcHead = User::query()->where('email', 'planning@talibon.demo')->firstOrFail();

        $this->assertSame("'=cmd|' /C calc'!A0", PpaController::sanitizeCsvCell("=cmd|' /C calc'!A0"));
        $this->assertSame("'+SUM(A1:A2)", PpaController::sanitizeCsvCell('+SUM(A1:A2)'));
        $this->assertSame("'-100+200", PpaController::sanitizeCsvCell('-100+200'));
        $this->assertSame("'@IMPORTXML()", PpaController::sanitizeCsvCell('@IMPORTXML()'));

        $this->actingAs($mpdcHead)->post('/ppas', [
            'ppa_code' => 'PPA-2027-999',
            'title' => '=HYPERLINK("http://evil.invalid","Click")',
            'sector' => 'Infrastructure',
            'year' => 2027,
            'related_development_plan' => 'AIP 2027',
            'funding_source' => '20% Development Fund',
            'status' => 'Planned',
            'co_amount' => 500000,
        ])->assertRedirect();

        $response = $this->actingAs($mpdcHead)->get('/ppas/export/csv?year=2027');
        $response->assertOk();
        $csv = $response->streamedContent();
        $this->assertStringContainsString('PPA-2027-999', $csv);
        $this->assertStringContainsString("'=HYPERLINK(", $csv);
    }

    public function test_planning_maps_crud_and_provenance_disclosure(): void
    {
        $this->seed();

        $mpdcHead = User::query()->where('email', 'planning@talibon.demo')->firstOrFail();

        $this->assertSame(0, PlanningMap::query()->count());
        $this->actingAs($mpdcHead)->get('/planning-maps')->assertOk();
        $this->assertSame(0, PlanningMap::query()->count());

        $this->actingAs($mpdcHead)->post('/planning-maps', [
            'map_code' => 'MAP-ZONING-2027',
            'title' => 'Updated Poblacion Commercial Overlay Plate',
            'category' => 'Macro & Spatial',
            'plan_code' => 'CLUP 2020–2029',
            'status' => 'Draft',
            'barangays' => ['Poblacion', 'San Jose'],
        ])->assertRedirect();

        $map = PlanningMap::query()->where('map_code', 'MAP-ZONING-2027')->firstOrFail();
        $this->assertSame('awaiting_official_gis', $map->provenance_status);

        $this->actingAs($mpdcHead)->delete("/planning-maps/{$map->id}")->assertRedirect();
        $this->assertDatabaseMissing('planning_maps', ['map_code' => 'MAP-ZONING-2027']);
    }

    public function test_read_only_planning_routes_and_csv_export_never_create_synthetic_rows(): void
    {
        $this->seed();

        $mpdcHead = User::query()->where('email', 'planning@talibon.demo')->firstOrFail();
        $engHead = User::query()->where('email', 'engineering@talibon.demo')->firstOrFail();
        $employee = User::query()->where('email', 'employee@talibon.demo')->firstOrFail();
        $admin = User::query()->where('email', 'admin@talibon.demo')->firstOrFail();

        $this->assertSame(0, DevelopmentPlan::query()->count());
        $this->assertSame(0, PpaRecord::query()->count());
        $this->assertSame(0, PlanningMap::query()->count());

        // Repeated reads across multiple actors must leave all empty tables untouched
        foreach ([$mpdcHead, $engHead, $employee, $admin, $mpdcHead] as $actor) {
            $this->actingAs($actor)->get('/development-plans')->assertOk();
            $this->actingAs($actor)->get('/ppas')->assertOk();
            $this->actingAs($actor)->get('/planning-maps')->assertOk();

            $csvResponse = $this->actingAs($actor)->get('/ppas/export/csv');
            $csvResponse->assertOk();
            $csvContent = $csvResponse->streamedContent();
            $this->assertStringContainsString('AIP Reference Code', $csvContent);
            $this->assertStringNotContainsString('PPA-2025-001', $csvContent);
        }

        $this->assertSame(0, DevelopmentPlan::query()->count());
        $this->assertSame(0, PpaRecord::query()->count());
        $this->assertSame(0, PlanningMap::query()->count());
        $this->assertSame(0, DevelopmentPlan::query()->whereIn('status', ['In force', 'Adopted'])->count());
    }

    public function test_explicit_opt_in_demo_seeder_enforces_non_production_guard_and_never_claims_official_adoption(): void
    {
        $this->seed();

        $initializer = app(PlanningSuiteInitializer::class);

        // 1. Calling without explicit opt-in fails closed and writes 0 rows
        try {
            $initializer->seedReferenceSamples(explicitOptIn: false);
            $this->fail('Expected RuntimeException when explicitOptIn is false.');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('explicit opt-in', $e->getMessage());
        }
        $this->assertSame(0, DevelopmentPlan::query()->count());

        // 2. Calling in production environment fails closed even with explicit opt-in
        $originalEnv = config('app.env');
        $this->app->detectEnvironment(static fn (): string => 'production');
        config()->set('app.env', 'production');
        try {
            $initializer->seedReferenceSamples(explicitOptIn: true);
            $this->fail('Expected RuntimeException when environment is production.');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('forbidden outside local or testing', $e->getMessage());
        } finally {
            $this->app->detectEnvironment(static fn (): string => 'testing');
            config()->set('app.env', $originalEnv);
        }
        $this->assertSame(0, DevelopmentPlan::query()->count());
        $this->assertSame(0, PpaRecord::query()->count());
        $this->assertSame(0, PlanningMap::query()->count());

        // 3. Explicit opt-in demo seeder in testing populates visibly marked reference samples with zero In force/Adopted claims
        app(PlanningReferenceSampleSeeder::class)->run();

        $this->assertGreaterThan(0, DevelopmentPlan::query()->count());
        $this->assertGreaterThan(0, PpaRecord::query()->count());
        $this->assertGreaterThan(0, PlanningMap::query()->count());

        $this->assertSame(0, DevelopmentPlan::query()->whereIn('status', ['In force', 'Adopted'])->count());
        $this->assertSame(0, DevelopmentPlan::query()->where('provenance_status', '!=', 'reference_sample')->count());
        $this->assertSame(0, DevelopmentPlan::query()->where('authority', '!=', PlanningSuiteInitializer::SAMPLE_AUTHORITY_DISCLOSURE)->count());
        $this->assertSame(0, PpaRecord::query()->where('provenance_status', '!=', 'reference_sample')->count());
        $this->assertSame(0, PlanningMap::query()->where('provenance_status', '!=', 'awaiting_official_gis')->count());
    }

    public function test_m5_app_r2_01_reference_sample_plan_cannot_be_promoted_or_have_authority_forged_via_either_update_route(): void
    {
        $this->seed();
        app(PlanningReferenceSampleSeeder::class)->run();

        $mpdcHead = User::query()->where('email', 'planning@talibon.demo')->firstOrFail();
        $admin = User::query()->where('email', 'admin@talibon.demo')->firstOrFail();
        $sample = DevelopmentPlan::query()->where('provenance_status', 'reference_sample')->firstOrFail();

        $originalTitle = $sample->title;
        $originalStatus = $sample->status;
        $originalAuthority = $sample->authority;
        $originalProvenance = $sample->provenance_status;
        $originalUpdatedBy = $sample->updated_by_user_id;
        $auditCountBefore = AuditLog::query()->count();

        // 1. POST /development-plans/{id}/status to In force with forged resolution -> 403, zero DB/audit mutation
        $this->actingAs($mpdcHead)->post("/development-plans/{$sample->id}/status", [
            'status' => 'In force',
            'authority' => 'SB Resolution No. 2026-999 (Forged)',
        ])->assertForbidden();

        // 2. PUT /development-plans/{id} to Adopted with forged authority and altered title -> 403, zero partial mutation
        $this->actingAs($mpdcHead)->put("/development-plans/{$sample->id}", [
            'title' => 'Forged Official Title',
            'horizon' => $sample->horizon,
            'lead_office' => $sample->lead_office,
            'coverage_start' => $sample->coverage_start,
            'coverage_end' => $sample->coverage_end,
            'status' => 'Adopted',
            'authority' => 'Sangguniang Bayan Ordinance No. 2026-888',
        ])->assertForbidden();

        // 3. Forged authority-only overwrite via PUT (keeping Draft status) -> 403, zero mutation
        $this->actingAs($mpdcHead)->put("/development-plans/{$sample->id}", [
            'title' => $sample->title,
            'horizon' => $sample->horizon,
            'lead_office' => $sample->lead_office,
            'coverage_start' => $sample->coverage_start,
            'coverage_end' => $sample->coverage_end,
            'status' => 'Draft',
            'authority' => 'Forged Official Adoption Record',
        ])->assertForbidden();

        // 4. Forged authority-only overwrite via POST status (keeping For review status) -> 403, zero mutation
        $this->actingAs($mpdcHead)->post("/development-plans/{$sample->id}/status", [
            'status' => 'For review',
            'authority' => 'Forged Resolution Reference',
        ])->assertForbidden();

        // 5. Clearing authority disclosure via empty string -> 403, zero mutation
        $this->actingAs($mpdcHead)->put("/development-plans/{$sample->id}", [
            'title' => $sample->title,
            'horizon' => $sample->horizon,
            'lead_office' => $sample->lead_office,
            'coverage_start' => $sample->coverage_start,
            'coverage_end' => $sample->coverage_end,
            'status' => 'Draft',
            'authority' => '',
        ])->assertForbidden();

        // 6. Replay / repeated attempts also denied with zero mutation
        $this->actingAs($mpdcHead)->post("/development-plans/{$sample->id}/status", [
            'status' => 'In force',
            'authority' => 'SB Resolution No. 2026-999 (Replay)',
        ])->assertForbidden();

        $freshSample = $sample->fresh();
        $this->assertSame($originalTitle, $freshSample->title);
        $this->assertSame($originalStatus, $freshSample->status);
        $this->assertSame($originalAuthority, $freshSample->authority);
        $this->assertSame($originalProvenance, $freshSample->provenance_status);
        $this->assertSame($originalUpdatedBy, $freshSample->updated_by_user_id);
        $this->assertSame($auditCountBefore, AuditLog::query()->count());

        // 7. Positive control: genuine non-sample plan can still be transitioned to In force by MPDC Head,
        // while system_admin remains denied
        $this->actingAs($mpdcHead)->post('/development-plans', [
            'code' => 'GENUINE-CDP-2027',
            'title' => 'Genuine Provisional Development Plan',
            'horizon' => 'Six-year',
            'lead_office' => 'Municipal Planning and Development Office',
            'coverage_start' => 2027,
            'coverage_end' => 2032,
            'status' => 'Draft',
        ])->assertRedirect();

        $genuine = DevelopmentPlan::query()->where('code', 'GENUINE-CDP-2027')->firstOrFail();
        $this->assertSame('provisional_draft', $genuine->provenance_status);

        $this->actingAs($admin)->post("/development-plans/{$genuine->id}/status", [
            'status' => 'In force',
            'authority' => 'Admin Attempt',
        ])->assertForbidden();

        $this->actingAs($mpdcHead)->post("/development-plans/{$genuine->id}/status", [
            'status' => 'In force',
            'authority' => 'SB Resolution No. 2027-012',
        ])->assertRedirect();

        $this->assertSame('In force', $genuine->fresh()->status);
        $this->assertSame('SB Resolution No. 2027-012', $genuine->fresh()->authority);
    }
}
