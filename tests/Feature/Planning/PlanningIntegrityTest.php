<?php

declare(strict_types=1);

namespace Tests\Feature\Planning;

use App\Models\AuditLog;
use App\Models\DesignatedPlanningStaff;
use App\Models\DevelopmentPlan;
use App\Models\PlanningAttachment;
use App\Models\PpaRecord;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\Planning\PlanningAuthorizationService;
use App\Services\Planning\PlanningSuiteInitializer;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Tests\TestCase;

final class PlanningIntegrityTest extends TestCase
{
    use RefreshDatabase;

    private function actor(string $email): User
    {
        return User::query()->where('email', $email)->firstOrFail();
    }

    private function proposal(User $owner): PpaRecord
    {
        $this->actingAs($owner)->post('/ppas', [
            'ppa_code' => 'INTEGRITY-001', 'title' => 'Synthetic proposal',
            'sector' => 'Infrastructure', 'year' => 2027,
            'related_development_plan' => 'Synthetic reference',
            'funding_source' => 'Synthetic source', 'status' => 'Draft',
        ])->assertRedirect();

        return PpaRecord::query()->where('ppa_code', 'INTEGRITY-001')->firstOrFail();
    }

    public function test_retained_attachment_blocks_parent_deletion_and_identifier_reuse_even_after_archival(): void
    {
        $this->seed();
        Storage::fake('documents');
        $owner = $this->actor('engineering@talibon.demo');
        $ppa = $this->proposal($owner);
        $this->actingAs($owner)->post('/planning/attachments', [
            'parent_type' => 'ppa', 'parent_code' => $ppa->ppa_code,
            'title' => 'Custody evidence', 'category' => 'working_draft', 'visibility' => 'lgu_internal',
            'file' => UploadedFile::fake()->createWithContent('custody.pdf', "%PDF-1.4\n%%EOF"),
        ])->assertRedirect();
        $attachment = PlanningAttachment::query()->firstOrFail();
        $this->assertSame($ppa->id, $attachment->parent_record_id);
        $this->actingAs($owner)->delete("/ppas/{$ppa->id}")->assertSessionHasErrors('attachment');
        $this->assertNotNull($ppa->fresh());
        $this->actingAs($owner)->delete("/planning/attachments/{$attachment->public_id}")->assertRedirect();
        $this->actingAs($owner)->delete("/ppas/{$ppa->id}")->assertSessionHasErrors('attachment');
        // Simulate historical out-of-band parent loss; application writes must not reassociate it.
        $ppa->delete();
        $this->actingAs($owner)->post('/ppas', [
            'ppa_code' => $ppa->ppa_code, 'title' => 'Replacement', 'sector' => 'Infrastructure',
            'year' => 2027, 'related_development_plan' => 'Synthetic', 'funding_source' => 'Synthetic', 'status' => 'Draft',
        ])->assertSessionHasErrors('ppa_code');
        Storage::disk('documents')->assertExists($attachment->storage_path);
    }

    public function test_replacement_parent_cannot_archive_bound_or_unreconciled_historical_attachment(): void
    {
        $this->seed();
        Storage::fake('documents');
        $owner = $this->actor('engineering@talibon.demo');
        $ppa = $this->proposal($owner);
        $this->actingAs($owner)->post('/planning/attachments', [
            'parent_type' => 'ppa', 'parent_code' => $ppa->ppa_code,
            'title' => 'Original evidence', 'category' => 'working_draft', 'visibility' => 'lgu_internal',
            'file' => UploadedFile::fake()->createWithContent('custody.pdf', "%PDF-1.4\n%%EOF"),
        ])->assertRedirect();
        $attachment = PlanningAttachment::query()->firstOrFail();
        $ppa->delete();
        $replacement = $ppa->replicate();
        $replacement->implementing_department_id = $this->actor('budget@talibon.demo')->employee->department_id;
        $replacement->save();
        $this->actingAs($this->actor('budget@talibon.demo'))->delete("/planning/attachments/{$attachment->public_id}")->assertForbidden();
        $this->assertNull($attachment->fresh()->archived_at);
        // Legacy associations are preserved for reads, never silently upgraded by code match.
        DB::table('planning_attachments')->where('id', $attachment->id)->update(['parent_record_id' => null]);
        $this->actingAs($this->actor('budget@talibon.demo'))->delete("/planning/attachments/{$attachment->public_id}")->assertForbidden();
        $this->actingAs($owner)->get("/planning/attachments/{$attachment->public_id}/download")->assertOk();
    }

    public function test_plan_code_and_key_collision_fails_closed_for_upload_and_creation(): void
    {
        $this->seed();
        app(PlanningSuiteInitializer::class)->seedReferenceSamples(true);
        $head = $this->actor('planning@talibon.demo');
        $plans = DevelopmentPlan::query()->limit(2)->get();
        $this->assertCount(2, $plans);
        $this->actingAs($head)->post('/development-plans', [
            'code' => $plans[0]->plan_key, 'title' => 'Alias replacement', 'horizon' => 'Annual',
            'lead_office' => $head->employee->department->name,
            'coverage_start' => 2027, 'coverage_end' => 2027, 'status' => 'Draft',
        ])->assertSessionHasErrors('code');
        $plans[1]->update(['code' => $plans[0]->plan_key]);
        $this->actingAs($head);
        $this->expectException(AuthorizationException::class);
        app(PlanningAuthorizationService::class)->authorizeAttachmentUpload($head, 'plan', $plans[0]->plan_key, 'lgu_internal');
    }

    public function test_matching_office_text_never_overrides_a_foreign_or_missing_department_id(): void
    {
        $this->seed();
        $owner = $this->actor('engineering@talibon.demo');
        $foreign = $this->actor('budget@talibon.demo');
        $ppa = $this->proposal($owner);
        foreach ([$foreign->employee->department_id, null] as $departmentId) {
            $ppa->update(['implementing_department_id' => $departmentId]);
            $before = AuditLog::count();
            $this->actingAs($owner)->post("/ppas/{$ppa->id}/status", ['status' => 'Planned'])->assertForbidden();
            $this->assertSame('Draft', $ppa->fresh()->status);
            $this->assertSame($before, AuditLog::count());
        }
    }

    public function test_uploader_must_retain_parent_module_scope_to_archive(): void
    {
        $this->seed();
        Storage::fake('documents');
        $owner = $this->actor('engineering@talibon.demo');
        $ppa = $this->proposal($owner);
        $this->actingAs($owner)->post('/planning/attachments', [
            'parent_type' => 'ppa', 'parent_code' => $ppa->ppa_code,
            'title' => 'Synthetic evidence', 'category' => 'working_draft',
            'visibility' => 'office_restricted',
            'file' => UploadedFile::fake()->createWithContent('test.pdf', "%PDF-1.4\n%%EOF"),
        ])->assertRedirect();
        $attachment = PlanningAttachment::query()->firstOrFail();
        $ppa->update(['implementing_department_id' => $this->actor('budget@talibon.demo')->employee->department_id]);
        $this->actingAs($owner)->delete("/planning/attachments/{$attachment->public_id}")->assertForbidden();
        $this->assertNull($attachment->fresh()->archived_at);
        $ppa->update(['implementing_department_id' => $owner->employee->department_id]);
        $this->actingAs($owner)->delete("/planning/attachments/{$attachment->public_id}")->assertRedirect();
        $this->assertNotNull($attachment->fresh()->archived_at);
        $this->actingAs($owner)->delete("/planning/attachments/{$attachment->public_id}")->assertForbidden();
    }

    public function test_staff_cannot_demote_an_official_plan_to_bypass_publication_authority(): void
    {
        $this->seed();
        $head = $this->actor('planning@talibon.demo');
        $staff = $this->actor('employee@talibon.demo');
        $this->actingAs($head)->post('/planning/designated-staff', [
            'employee_id' => $staff->employee->id, 'can_manage_plans' => true,
        ])->assertRedirect();
        $this->actingAs($head)->post('/development-plans', [
            'code' => 'INTEGRITY-PLAN', 'title' => 'Synthetic adopted plan', 'horizon' => 'Annual',
            'lead_office' => $head->employee->department->name,
            'coverage_start' => 2027, 'coverage_end' => 2027,
            'status' => 'Adopted', 'authority' => 'Synthetic test authority',
        ])->assertRedirect();
        $plan = DevelopmentPlan::query()->where('code', 'INTEGRITY-PLAN')->firstOrFail();
        $this->actingAs($staff)->post("/development-plans/{$plan->id}/status", ['status' => 'Draft'])->assertForbidden();
        $this->assertSame('Adopted', $plan->fresh()->status);
        $this->actingAs($head)->post("/development-plans/{$plan->id}/status", ['status' => 'Draft'])->assertRedirect();
    }

    public function test_grant_retry_reuses_one_active_designation_and_revoked_grants_cannot_be_edited(): void
    {
        $this->seed();
        $head = $this->actor('planning@talibon.demo');
        $staff = $this->actor('employee@talibon.demo');
        for ($i = 0; $i < 2; $i++) {
            $this->actingAs($head)->post('/planning/designated-staff', [
                'employee_id' => $staff->employee->id, 'can_manage_plans' => true,
            ])->assertRedirect();
        }
        $this->assertSame(1, DesignatedPlanningStaff::query()->whereNull('revoked_at')->count());
        $grant = DesignatedPlanningStaff::query()->firstOrFail();
        $this->actingAs($head)->delete("/planning/designated-staff/{$grant->id}")->assertRedirect();
        $this->actingAs($head)->put("/planning/designated-staff/{$grant->id}", [
            'can_manage_plans' => true, 'can_manage_ppas' => true, 'can_manage_maps' => true,
        ])->assertStatus(409);
        $this->assertFalse($grant->fresh()->can_manage_plans);
    }

    public function test_audit_failure_rolls_back_plan_creation(): void
    {
        $this->seed();
        $head = $this->actor('planning@talibon.demo');
        $this->mock(AuditLogger::class)->shouldReceive('record')->once()->andThrow(new RuntimeException('Synthetic audit failure'));
        $this->withoutExceptionHandling();
        try {
            $this->actingAs($head)->post('/development-plans', [
                'code' => 'ROLLBACK-PLAN', 'title' => 'Synthetic draft', 'horizon' => 'Annual',
                'lead_office' => $head->employee->department->name,
                'coverage_start' => 2027, 'coverage_end' => 2027, 'status' => 'Draft',
            ]);
            $this->fail('Expected synthetic audit failure.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Synthetic audit failure', $exception->getMessage());
        }
        $this->assertFalse(DevelopmentPlan::query()->where('code', 'ROLLBACK-PLAN')->exists());
    }

    public function test_attachment_audit_failure_rolls_back_row_and_removes_unregistered_bytes(): void
    {
        $this->seed();
        Storage::fake('documents');
        $owner = $this->actor('engineering@talibon.demo');
        $ppa = $this->proposal($owner);
        $this->mock(AuditLogger::class)->shouldReceive('record')->once()->andThrow(new RuntimeException('Synthetic audit failure'));
        $this->withoutExceptionHandling();
        try {
            $this->actingAs($owner)->post('/planning/attachments', [
                'parent_type' => 'ppa', 'parent_code' => $ppa->ppa_code,
                'title' => 'Synthetic evidence', 'category' => 'working_draft',
                'visibility' => 'office_restricted',
                'file' => UploadedFile::fake()->createWithContent('test.pdf', "%PDF-1.4\n%%EOF"),
            ]);
            $this->fail('Expected synthetic audit failure.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Synthetic audit failure', $exception->getMessage());
        }
        $this->assertSame(0, PlanningAttachment::count());
        $this->assertSame([], Storage::disk('documents')->allFiles());
    }

    public function test_manager_records_the_selected_office_id_and_foreign_head_remains_denied(): void
    {
        $this->seed();
        $head = $this->actor('planning@talibon.demo');
        $owner = $this->actor('engineering@talibon.demo');
        $this->actingAs($head)->post('/ppas', [
            'ppa_code' => 'ASSIGNED-001', 'title' => 'Synthetic office proposal',
            'sector' => 'Infrastructure', 'year' => 2027,
            'related_development_plan' => 'Synthetic reference',
            'funding_source' => 'Synthetic source', 'status' => 'Draft',
            'responsible_office' => $owner->employee->department->name,
        ])->assertRedirect();
        $ppa = PpaRecord::query()->where('ppa_code', 'ASSIGNED-001')->firstOrFail();
        $this->assertSame((int) $owner->employee->department_id, (int) $ppa->implementing_department_id);
        $this->actingAs($owner)->post("/ppas/{$ppa->id}/status", ['status' => 'Planned'])->assertRedirect();
        $this->actingAs($this->actor('budget@talibon.demo'))->post("/ppas/{$ppa->id}/status", ['status' => 'Draft'])->assertForbidden();
    }

    public function test_active_designation_database_constraint_retains_revoked_history(): void
    {
        $this->seed();
        $head = $this->actor('planning@talibon.demo');
        $staff = $this->actor('employee@talibon.demo');
        $this->actingAs($head)->post('/planning/designated-staff', [
            'employee_id' => $staff->employee->id, 'can_manage_plans' => true,
        ])->assertRedirect();
        $grant = DesignatedPlanningStaff::query()->firstOrFail();
        $duplicate = $grant->replicate();
        try {
            DB::transaction(fn () => $duplicate->save());
            $this->fail('Expected active designation uniqueness violation.');
        } catch (QueryException $exception) {
            $this->assertSame('23505', $exception->errorInfo[0]);
        }
        $this->actingAs($head)->delete("/planning/designated-staff/{$grant->id}")->assertRedirect();
        $this->actingAs($head)->post('/planning/designated-staff', [
            'employee_id' => $staff->employee->id, 'can_manage_maps' => true,
        ])->assertRedirect();
        $this->assertSame(2, DesignatedPlanningStaff::count());
        $this->assertSame(1, DesignatedPlanningStaff::query()->whereNull('revoked_at')->count());
    }

    public function test_engineer_internal_visibility_includes_foreign_drafts_and_executive_attachments_without_designation(): void
    {
        $this->seed();
        Storage::fake('documents');
        $head = $this->actor('planning@talibon.demo');
        $reader = $this->actor('employee@talibon.demo');
        $reader->employee->update(['department_id' => $this->actor('budget@talibon.demo')->employee->department_id]);
        $this->assertSame(0, DesignatedPlanningStaff::count());
        $ppa = $this->proposal($this->actor('engineering@talibon.demo'));
        $this->actingAs($head)->post('/development-plans', [
            'code' => 'VISIBLE-DRAFT', 'title' => 'Synthetic cross-office draft', 'horizon' => 'Annual',
            'lead_office' => $head->employee->department->name,
            'coverage_start' => 2027, 'coverage_end' => 2027, 'status' => 'Draft',
        ])->assertRedirect();
        $this->actingAs($head)->post('/planning-maps', [
            'map_code' => 'VISIBLE-MAP', 'title' => 'Synthetic draft map',
            'category' => 'Macro & Spatial', 'plan_code' => 'VISIBLE-DRAFT', 'status' => 'Draft',
        ])->assertRedirect();
        $this->actingAs($head)->post('/planning/attachments', [
            'parent_type' => 'ppa', 'parent_code' => $ppa->ppa_code,
            'title' => 'Executive synthetic evidence', 'category' => 'working_draft',
            'visibility' => 'mpdc_executive',
            'file' => UploadedFile::fake()->createWithContent('executive.pdf', "%PDF-1.4\n%%EOF"),
        ])->assertRedirect();
        $attachment = PlanningAttachment::query()->firstOrFail();
        foreach (['/development-plans', '/ppas', '/planning-maps', '/ppas/export/csv'] as $route) {
            $this->actingAs($reader)->get($route)->assertOk();
        }
        $this->actingAs($reader)->get('/development-plans')->assertInertia(fn ($page) => $page
            ->component('Plans/Index')->where('plans.0.code', 'VISIBLE-DRAFT')->where('planningPermissions.canManagePlans', false));
        $this->actingAs($reader)->get('/ppas')->assertInertia(fn ($page) => $page
            ->component('PPAs/Index')->where('ppaRecords.0.id', $ppa->ppa_code));
        $this->actingAs($reader)->get("/planning/attachments/{$attachment->public_id}/preview")->assertOk();
        $this->actingAs($reader)->get("/planning/attachments/{$attachment->public_id}/download")->assertOk();
        $this->actingAs($reader)->post("/ppas/{$ppa->id}/status", ['status' => 'Planned'])->assertForbidden();
        $this->actingAs($reader)->delete("/planning/attachments/{$attachment->public_id}")->assertForbidden();
        $this->app['auth']->guard()->logout();
        foreach (['/development-plans', '/ppas', '/planning-maps', "/planning/attachments/{$attachment->public_id}/preview"] as $route) {
            $this->get($route)->assertRedirect('/login');
        }
    }

    public function test_office_head_delegation_is_office_and_module_bound_and_revocation_preserves_reads(): void
    {
        $this->seed();
        $head = $this->actor('engineering@talibon.demo');
        $staff = $this->actor('employee@talibon.demo');
        $staff->employee->update(['department_id' => $head->employee->department_id]);
        $foreignHead = $this->actor('budget@talibon.demo');
        $this->actingAs($head)->post('/planning/designated-staff', [
            'employee_id' => $staff->employee->id, 'can_manage_plans' => true,
        ])->assertForbidden();
        $this->actingAs($foreignHead)->post('/planning/designated-staff', [
            'employee_id' => $staff->employee->id, 'can_manage_ppas' => true,
        ])->assertSessionHasErrors('employee_id');
        $this->actingAs($head)->post('/planning/designated-staff', [
            'employee_id' => $staff->employee->id, 'can_manage_ppas' => true,
        ])->assertRedirect();
        $grant = DesignatedPlanningStaff::query()->firstOrFail();
        $this->actingAs($foreignHead)->put("/planning/designated-staff/{$grant->id}", [
            'can_manage_plans' => false, 'can_manage_ppas' => true, 'can_manage_maps' => false,
        ])->assertForbidden();
        $this->actingAs($foreignHead)->delete("/planning/designated-staff/{$grant->id}")->assertForbidden();
        $ppa = $this->proposal($staff);
        $this->assertSame((int) $head->employee->department_id, (int) $ppa->implementing_department_id);
        $this->actingAs($staff)->post("/ppas/{$ppa->id}/status", ['status' => 'Planned'])->assertRedirect();
        $this->actingAs($head)->delete("/planning/designated-staff/{$grant->id}")->assertRedirect();
        $this->actingAs($staff)->post("/ppas/{$ppa->id}/status", ['status' => 'Draft'])->assertForbidden();
        $this->actingAs($staff)->delete("/ppas/{$ppa->id}")->assertForbidden();
        $this->actingAs($staff)->get('/ppas')->assertOk();
        $this->actingAs($staff)->get('/development-plans')->assertOk();
    }

    public function test_protected_plan_states_cannot_be_deleted_by_direct_request(): void
    {
        $this->seed();
        $head = $this->actor('planning@talibon.demo');
        $staff = $this->actor('employee@talibon.demo');
        $this->actingAs($head)->post('/planning/designated-staff', [
            'employee_id' => $staff->employee->id, 'can_manage_plans' => true,
        ])->assertRedirect();
        $this->actingAs($head)->post('/development-plans', [
            'code' => 'RETAIN-PLAN', 'title' => 'Synthetic retained plan', 'horizon' => 'Annual',
            'lead_office' => $head->employee->department->name,
            'coverage_start' => 2027, 'coverage_end' => 2027, 'status' => 'Draft',
        ])->assertRedirect();
        $plan = DevelopmentPlan::query()->where('code', 'RETAIN-PLAN')->firstOrFail();
        foreach (['Archived', 'Published', 'Adopted', 'In force'] as $status) {
            $plan->update(['status' => $status]);
            foreach ([$head, $staff] as $actor) {
                $this->actingAs($actor)->delete("/development-plans/{$plan->id}")->assertForbidden();
                $this->assertNotNull($plan->fresh());
            }
        }
    }

    public function test_epoch_and_mfa_revocation_after_middleware_deny_the_locked_mutation(): void
    {
        $this->seed();
        $this->app['router']->getRoutes()->getByName('development-plans.store')
            ->middleware(PlanningRevocationProbe::class);
        foreach (['session_version', 'mfa_version'] as $field) {
            PlanningRevocationProbe::$field = $field;
            $head = $this->actor('planning@talibon.demo');
            $this->actingAs($head)->post('/development-plans', [
                'code' => 'STALE-'.strtoupper($field), 'title' => 'Denied stale mutation', 'horizon' => 'Annual',
                'lead_office' => $head->employee->department->name,
                'coverage_start' => 2027, 'coverage_end' => 2027, 'status' => 'Draft',
            ])->assertForbidden();
            $this->assertFalse(DevelopmentPlan::query()->where('code', 'STALE-'.strtoupper($field))->exists());
        }
    }
}

// Runs after the ordinary route middleware to exercise the lock-time recheck.
final class PlanningRevocationProbe
{
    public static string $field = 'session_version';

    public function handle($request, $next)
    {
        User::query()->whereKey($request->user()->id)->increment(self::$field);

        return $next($request);
    }
}
