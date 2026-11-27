<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Http\Controllers\EmployeeProfileController;
use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentLink;
use App\Models\Employee;
use App\Models\PlanFamily;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

final class EmployeeProfileProvenanceQuarantineTest extends TestCase
{
    use RefreshDatabase;

    public function test_p07_quarantines_ever_plan_receipts_bindings_unknown_domain_and_registry_v1_while_preserving_legacy_hr_docs(): void
    {
        $department = Department::query()->create([
            'code' => 'P07-'.Str::upper(Str::random(6)),
            'name' => 'P07 Synthetic HR Office',
            'short_name' => 'P07',
            'branch' => 'executive',
            'office_type' => 'department',
            'is_active' => true,
            'is_routable' => true,
            'sort_order' => 20,
        ]);

        $hrOfficer = $this->createActor($department, 'hr_officer', 'HR Officer');
        $subjectUser = $this->createActor($department, 'department_staff', 'Subject Employee');
        $subjectEmployee = $subjectUser->employee;

        // 1. Legitimate legacy HR document MUST remain visible.
        $legitLegacy = $this->createEmployeeDocument($hrOfficer, $subjectEmployee, 'Legitimate Legacy 201 File', [
            'security_domain' => 'LEGACY_CTW',
        ]);

        // 2. EVER_PLAN document linked via trigger bypass defense-in-depth MUST remain invisible.
        $everPlanDoc = $this->createEmployeeDocument($hrOfficer, $subjectEmployee, 'Quarantined EVER_PLAN Master');
        DB::statement('ALTER TABLE documents DISABLE TRIGGER kirion_plan_document_guard_trigger');
        DB::statement('ALTER TABLE documents DISABLE TRIGGER kirion_plan_stamp_origin_trigger');
        try {
            DB::table('documents')->where('id', $everPlanDoc->id)->update(['security_domain' => 'EVER_PLAN']);
        } finally {
            DB::statement('ALTER TABLE documents ENABLE TRIGGER kirion_plan_document_guard_trigger');
            DB::statement('ALTER TABLE documents ENABLE TRIGGER kirion_plan_stamp_origin_trigger');
        }

        // 3. Plan origin receipt marker (even with LEGACY_CTW domain) MUST remain invisible.
        $receiptMarkedDoc = $this->createEmployeeDocument($hrOfficer, $subjectEmployee, 'Quarantined Plan Receipt Doc', [
            'security_domain' => 'LEGACY_CTW',
        ]);
        DB::statement('ALTER TABLE plan_document_origin_receipts DISABLE TRIGGER kirion_plan_receipt_guard_trigger');
        try {
            DB::table('plan_document_origin_receipts')->insert([
                'document_id' => $receiptMarkedDoc->id,
                'origin' => 'EVER_PLAN',
                'sealed_at' => now(),
            ]);
        } finally {
            DB::statement('ALTER TABLE plan_document_origin_receipts ENABLE TRIGGER kirion_plan_receipt_guard_trigger');
        }

        // 4. Plan typed binding marker (without origin receipt) MUST remain invisible.
        $bindingMarkedDoc = $this->createEmployeeDocument($hrOfficer, $subjectEmployee, 'Quarantined Plan Binding Doc', [
            'security_domain' => 'LEGACY_CTW',
        ]);
        $family = PlanFamily::query()->create(['title' => 'Synthetic P07 Plan Family']);
        $edition = $family->editions()->create(['edition_label' => 'Synthetic P07 Edition']);
        DB::statement('ALTER TABLE plan_document_bindings DISABLE TRIGGER kirion_plan_typed_binding_guard_trigger');
        try {
            DB::table('plan_document_bindings')->insert([
                'plan_edition_id' => $edition->id,
                'document_id' => $bindingMarkedDoc->id,
                'role' => 'master',
                'revision_no' => 1,
                'binding_state' => 'QUARANTINED',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } finally {
            DB::statement('ALTER TABLE plan_document_bindings ENABLE TRIGGER kirion_plan_typed_binding_guard_trigger');
        }

        // 5. Unknown security_domain MUST remain invisible.
        $unknownDomainDoc = $this->createEmployeeDocument($hrOfficer, $subjectEmployee, 'Quarantined Unknown Domain Doc');
        DB::statement('ALTER TABLE documents DROP CONSTRAINT documents_plan_origin_domain_check');
        DB::table('documents')->where('id', $unknownDomainDoc->id)->update(['security_domain' => 'UNKNOWN_DOMAIN']);

        // 6. REGISTRY_V1 document (if G2A columns exist) MUST remain invisible in HR profile.
        $registryDoc = null;
        $hasRegistryColumns = Schema::hasColumn('documents', 'custody_mode')
            && Schema::hasColumn('documents', 'custody_operation_id');

        try {
            if ($hasRegistryColumns) {
                $registryDoc = $this->createEmployeeDocument($hrOfficer, $subjectEmployee, 'Quarantined Registry V1 Doc');
                DB::statement('ALTER TABLE documents DISABLE TRIGGER a_n03_public_guard');
                DB::statement('ALTER TABLE documents DROP CONSTRAINT n03_document_item');
                try {
                    DB::table('documents')->where('id', $registryDoc->id)->update([
                        'security_domain' => 'LEGACY_CTW',
                        'custody_mode' => 'REGISTRY_V1',
                        'custody_operation_id' => (string) Str::uuid(),
                        'custody_ordinal' => 1,
                        'storage_disk' => 'legacy_registry_v1',
                        'storage_path' => null,
                    ]);
                } finally {
                    DB::statement('ALTER TABLE documents ENABLE TRIGGER a_n03_public_guard');
                }
            }

            // Invoke EmployeeProfileController as HR officer and as subject self.
            foreach ([$hrOfficer, $subjectUser] as $viewer) {
                $props = $this->invokeProfile($viewer, $subjectEmployee);
                $returnedDocs = collect($props['documents'] ?? []);
                $returnedIds = $returnedDocs->pluck('id')->map(static fn ($id): int => (int) $id)->all();

                $this->assertSame([$legitLegacy->id], $returnedIds);
                $this->assertNotContains($everPlanDoc->id, $returnedIds);
                $this->assertNotContains($receiptMarkedDoc->id, $returnedIds);
                $this->assertNotContains($bindingMarkedDoc->id, $returnedIds);
                $this->assertNotContains($unknownDomainDoc->id, $returnedIds);
                if ($registryDoc !== null) {
                    $this->assertNotContains($registryDoc->id, $returnedIds);
                }

                $serialized = json_encode($props, JSON_THROW_ON_ERROR);
                $this->assertStringContainsString('Legitimate Legacy 201 File', $serialized);
                $this->assertStringNotContainsString('Quarantined EVER_PLAN Master', $serialized);
                $this->assertStringNotContainsString('Quarantined Plan Receipt Doc', $serialized);
                $this->assertStringNotContainsString('Quarantined Plan Binding Doc', $serialized);
                $this->assertStringNotContainsString('Quarantined Unknown Domain Doc', $serialized);
                $this->assertStringNotContainsString('Quarantined Registry V1 Doc', $serialized);
            }

            // Non-HR peer in another role must receive zero HR documents.
            $peer = $this->createActor($department, 'department_staff', 'Peer Staff');
            $peerProps = $this->invokeProfile($peer, $subjectEmployee);
            $this->assertSame([], collect($peerProps['documents'] ?? [])->all());
        } finally {
            DB::table('documents')->where('id', $unknownDomainDoc->id)->update(['security_domain' => 'LEGACY_CTW']);
            DB::statement("ALTER TABLE documents ADD CONSTRAINT documents_plan_origin_domain_check CHECK (security_domain IN ('EVER_PLAN', 'LEGACY_CTW'))");
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function invokeProfile(User $viewer, Employee $subject): array
    {
        $this->actingAs($viewer);

        $request = Request::create('/employees/'.$subject->id, 'GET', [], [], [], [
            'HTTP_X_INERTIA' => 'true',
            'HTTP_ACCEPT' => 'application/json',
        ]);
        $request->setUserResolver(static fn (): User => $viewer);

        $controller = new EmployeeProfileController;
        $inertiaResponse = app()->call([$controller, '__invoke'], [
            'request' => $request,
            'employee' => $subject->fresh(),
        ]);

        $httpResponse = $inertiaResponse->toResponse($request);
        $this->assertSame(200, $httpResponse->getStatusCode());

        $payload = json_decode((string) $httpResponse->getContent(), true, 32, JSON_THROW_ON_ERROR);
        $this->assertIsArray($payload);
        $this->assertArrayHasKey('props', $payload);

        return $payload['props'];
    }

    private function createActor(Department $department, string $role, string $name): User
    {
        $user = User::query()->create([
            'name' => $name,
            'email' => Str::lower(Str::random(10)).'@talibon.test',
            'password' => 'password',
            'role' => $role,
            'is_active' => true,
            'account_status' => 'active',
        ]);

        Employee::query()->create([
            'employee_number' => 'P07-'.Str::upper(Str::random(8)),
            'full_name' => $name,
            'work_email' => $user->email,
            'user_id' => $user->id,
            'department_id' => $department->id,
            'position_title' => $name,
            'employment_status' => 'active',
        ]);

        return $user->fresh('employee.department');
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createEmployeeDocument(User $uploader, Employee $employee, string $title, array $overrides = []): Document
    {
        $bytes = "%PDF-1.7\n".$title."\n%%EOF\n";
        $document = Document::query()->create(array_merge([
            'title' => $title,
            'original_name' => Str::slug($title).'.pdf',
            'document_type' => 'hr_record',
            'classification' => 'confidential',
            'storage_disk' => 'documents',
            'storage_path' => 'p07-synthetic/'.Str::uuid().'.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => strlen($bytes),
            'checksum_sha256' => hash('sha256', $bytes),
            'owner_department_id' => $uploader->employee->department_id,
            'uploaded_by_user_id' => $uploader->id,
        ], $overrides));

        if (array_key_exists('security_domain', $overrides)) {
            DB::table('documents')->where('id', $document->id)->update([
                'security_domain' => $overrides['security_domain'],
            ]);
        }

        DocumentLink::query()->create([
            'document_id' => $document->id,
            'linkable_type' => Employee::class,
            'linkable_id' => $employee->id,
            'relationship' => 'employee_201',
            'created_by_user_id' => $uploader->id,
        ]);

        return $document->fresh();
    }
}
