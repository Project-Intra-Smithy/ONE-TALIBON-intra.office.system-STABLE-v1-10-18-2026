<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\Correspondence\CorrespondenceClassification;
use App\Domain\Correspondence\CorrespondenceLifecycleState;
use App\Models\CorrespondenceRecord;
use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentLink;
use App\Models\Employee;
use App\Models\Memorandum;
use App\Models\Task;
use App\Models\TaskEvent;
use App\Models\User;
use App\Services\CommonEvidence\DocumentTraceabilityQuery;
use App\Services\CorrespondenceEvidenceService;
use App\Services\MemorandumService;
use App\Services\TransactionEvidenceService;
use App\Services\TravelOrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Stage 5 (Issue #169) bounded whole-system traceability continuity test.
 *
 * Proves end-to-end actor/office/timestamp/action/correlation traceability and
 * strict cross-office authorization isolation across:
 *   1. Travel Order -> Document Center -> DocumentTraceabilityQuery
 *   2. Transaction -> Document Center -> DocumentTraceabilityQuery
 *   3. Correspondence -> Document Center -> DocumentTraceabilityQuery
 *   4. Memorandum publication & acknowledgement audit continuity
 *   5. Individual Task creation, start & completion event continuity
 */
final class WholeSystemTraceabilityJourneyTest extends TestCase
{
    use RefreshDatabase;

    private Department $mayorOffice;

    private Department $officeA;

    private Department $officeB;

    private User $mayorActor;

    private User $actorA;

    private User $actorB;

    protected function setUp(): void
    {
        parent::setUp();

        config(['messaging_release.restricted_uat' => false]);
        $syntheticDisk = Storage::fake('documents');
        config(['filesystems.disks.documents.root' => rtrim($syntheticDisk->path(''), '/')]);

        $this->mayorOffice = Department::query()->firstOrCreate(
            ['code' => 'MAYOR'],
            [
                'name' => 'Office of the Municipal Mayor',
                'short_name' => 'MAYOR',
                'branch' => 'executive',
                'office_type' => 'department',
                'is_active' => true,
                'is_routable' => true,
                'sort_order' => 1,
            ],
        );

        $this->officeA = Department::query()->create([
            'code' => 'TRC-A-'.Str::upper(Str::random(5)),
            'name' => 'Traceability Office Alpha',
            'short_name' => 'ALPHA',
            'branch' => 'executive',
            'office_type' => 'department',
            'is_active' => true,
            'is_routable' => true,
            'sort_order' => 10,
        ]);

        $this->officeB = Department::query()->create([
            'code' => 'TRC-B-'.Str::upper(Str::random(5)),
            'name' => 'Traceability Office Beta',
            'short_name' => 'BETA',
            'branch' => 'executive',
            'office_type' => 'department',
            'is_active' => true,
            'is_routable' => true,
            'sort_order' => 11,
        ]);

        $this->mayorActor = $this->makeActor($this->mayorOffice, 'mayor_approver', 'Mayor Trace Actor');
        $this->actorA = $this->makeActor($this->officeA, 'department_head', 'Alpha Head');
        $this->actorB = $this->makeActor($this->officeB, 'department_head', 'Beta Head');
    }

    public function test_travel_order_transaction_and_correspondence_traceability_and_cross_office_isolation(): void
    {
        $traceQuery = app(DocumentTraceabilityQuery::class);

        // --- 1. Travel Order journey ---
        $this->actingAs($this->mayorActor);
        $travelOrder = app(TravelOrderService::class)->recordApproved(
            $this->mayorActor,
            [
                'reference_number' => 'TO-TRC-'.Str::upper(Str::random(6)),
                'issuance_date' => '2026-11-19',
                'purpose' => 'Synthetic Regional Traceability Audit',
                'destination' => 'Tagbilaran City',
                'department_id' => $this->officeA->id,
                'travel_start_date' => '2026-11-21',
                'travel_end_date' => '2026-11-22',
                'employee_ids' => [$this->actorA->employee->id],
            ],
            [$this->fakePdf('travel-order-trace.pdf', 'TRAVEL-TRACE')],
        );

        $travelDoc = Document::query()
            ->whereIn('id', DocumentLink::query()
                ->where('linkable_type', $travelOrder->getMorphClass())
                ->where('linkable_id', $travelOrder->id)
                ->pluck('document_id'))
            ->firstOrFail();

        $this->actingAs($this->actorA);
        $travelTrace = $traceQuery->forAuthorizedDocument($this->actorA, $travelDoc);
        $this->assertNotNull($travelTrace);
        $this->assertSame($travelDoc->public_id, $travelTrace['documentPublicId']);
        $this->assertSame('LEGACY_PATH', $travelTrace['custody']['mode']);
        $this->assertNull($travelTrace['custody']['receiptUuid']);
        $this->assertNotEmpty($travelTrace['linkedSources']);
        $this->assertNotEmpty($travelTrace['timeline']);
        $this->assertContains('travel_order.recorded', array_column($travelTrace['timeline'], 'action'));
        $this->assertContains('document.uploaded', array_column($travelTrace['timeline'], 'action'));
        $this->assertNoPhysicalPathLeaks($travelTrace, $travelDoc);

        // Unauthorized Office Beta head cannot retrieve Office Alpha's travel order traceability.
        $this->actingAs($this->actorB);
        $this->assertNull($traceQuery->forAuthorizedDocument($this->actorB, $travelDoc));

        // --- 2. Transaction journey ---
        $this->actingAs($this->actorA);
        $transaction = app(TransactionEvidenceService::class)->create(
            $this->actorA,
            [
                'transaction_type' => 'internal_request',
                'title' => 'Alpha Internal Procurement Traceability Request',
                'description' => 'Bounded traceability verification',
                'priority' => 'normal',
                'target_department_id' => $this->mayorOffice->id,
            ],
            [$this->fakePdf('transaction-trace.pdf', 'TXN-TRACE')],
        );

        $txnDoc = Document::query()
            ->whereIn('id', DocumentLink::query()
                ->where('linkable_type', $transaction->getMorphClass())
                ->where('linkable_id', $transaction->id)
                ->pluck('document_id'))
            ->firstOrFail();

        $txnTrace = $traceQuery->forAuthorizedDocument($this->actorA, $txnDoc);
        $this->assertNotNull($txnTrace);
        $this->assertContains('transaction.created', array_column($txnTrace['timeline'], 'action'));
        $this->assertNoPhysicalPathLeaks($txnTrace, $txnDoc);

        // Document Center exposes additive selectedTraceability ONLY for authorized actor.
        $this->actingAs($this->actorA)
            ->get('/documents?mode=files&document='.$txnDoc->public_id)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Documents/Index')
                ->where('archive.selected.publicId', $txnDoc->public_id)
                ->where('selectedTraceability.documentPublicId', $txnDoc->public_id)
                ->where('selectedTraceability.custody.mode', 'LEGACY_PATH'));

        $this->actingAs($this->actorB)
            ->get('/documents?mode=files&document='.$txnDoc->public_id)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Documents/Index')
                ->where('archive.selected', null)
                ->where('selectedTraceability', null));

        // --- 3. Correspondence journey ---
        $this->actingAs($this->actorA);
        $correspondence = CorrespondenceRecord::query()->create([
            'public_id' => (string) Str::uuid(),
            'external_reference_no' => 'EXT-TRC-'.Str::upper(Str::random(6)),
            'source' => 'municipal_desk',
            'subject' => 'Synthetic Traceability Correspondence',
            'sender_name' => 'Municipal Planning Liaison',
            'channel' => 'walk_in',
            'receiving_department_id' => $this->officeA->id,
            'lifecycle_state' => CorrespondenceLifecycleState::Received->value,
            'classification' => CorrespondenceClassification::Internal->value,
            'received_at' => now(),
        ]);

        $corrService = app(CorrespondenceEvidenceService::class);
        $corrId = (string) Str::uuid();
        $correspondence = $corrService->register(
            $this->actorA,
            $correspondence,
            $corrId,
            [$this->fakePdf('correspondence-trace.pdf', 'CORR-TRACE')],
        );
        $correspondence = $corrService->classify(
            $this->actorA,
            $correspondence->fresh(),
            CorrespondenceClassification::Confidential,
            (string) Str::uuid(),
            'Escalated to confidential for audit.',
            [],
        );

        $corrDoc = Document::query()
            ->whereIn('id', DocumentLink::query()
                ->where('linkable_type', $correspondence->getMorphClass())
                ->where('linkable_id', $correspondence->id)
                ->pluck('document_id'))
            ->firstOrFail();

        $corrTrace = $traceQuery->forAuthorizedDocument($this->actorA, $corrDoc);
        $this->assertNotNull($corrTrace);
        $this->assertSame('confidential', $corrTrace['effectiveClassification']);
        $actions = array_column($corrTrace['timeline'], 'action');
        $this->assertContains('correspondence.registered', $actions);
        $this->assertContains('correspondence.classified', $actions);
        $this->assertContains('document.uploaded', $actions);
        $this->assertNoPhysicalPathLeaks($corrTrace, $corrDoc);

        $this->actingAs($this->actorB);
        $this->assertNull($traceQuery->forAuthorizedDocument($this->actorB, $corrDoc));
    }

    public function test_memorandum_and_individual_task_audit_continuity_and_isolation(): void
    {
        // --- 4. Memorandum publication & acknowledgement audit continuity ---
        $alphaStaff = $this->makeActor($this->officeA, 'department_staff', 'Alpha Staff Member');
        $this->actingAs($this->actorA);

        $memo = app(MemorandumService::class)->publish($this->actorA, [
            'memo_number' => 'MEMO-TRC-'.Str::upper(Str::random(6)),
            'title' => 'Synthetic Traceability Directive',
            'body' => 'All office files must maintain unbroken audit continuity.',
            'audience_type' => 'employees',
            'audience_ids' => [$alphaStaff->employee->id],
            'requires_acknowledgement' => true,
            'classification' => 'internal',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'actor_user_id' => $this->actorA->id,
            'actor_department_id' => $this->officeA->id,
            'action' => 'memorandum.published',
            'entity_type' => Memorandum::class,
            'entity_id' => $memo->id,
            'outcome' => 'allowed',
        ]);

        // Authorized recipient acknowledges memo -> audited.
        $this->actingAs($alphaStaff)
            ->post('/memoranda/'.$memo->id.'/acknowledge')
            ->assertRedirect();

        $this->assertDatabaseHas('audit_logs', [
            'actor_user_id' => $alphaStaff->id,
            'actor_department_id' => $this->officeA->id,
            'action' => 'memorandum.acknowledged',
            'entity_type' => Memorandum::class,
            'entity_id' => $memo->id,
            'outcome' => 'allowed',
        ]);

        // Cross-office outsider cannot inspect Office Alpha's memorandum.
        $this->actingAs($this->actorB)
            ->get('/memoranda/'.$memo->id)
            ->assertForbidden();

        // --- 5. Individual Task event traceability & strict personal isolation ---
        $createRes = $this->actingAs($alphaStaff)
            ->postJson('/tasks', [
                'title' => 'Verify archival correlation trail',
                'instructions' => 'Confirm travel, transaction, and correspondence receipts.',
            ])
            ->assertCreated();

        $taskId = (int) $createRes->json('data.id');
        $this->assertGreaterThan(0, $taskId);

        $this->actingAs($alphaStaff)->postJson('/tasks/'.$taskId.'/start')->assertOk();
        $this->actingAs($alphaStaff)->postJson('/tasks/'.$taskId.'/complete')->assertOk();

        $events = TaskEvent::query()
            ->where('task_id', $taskId)
            ->orderBy('id')
            ->get();

        $this->assertSame(['created', 'start', 'complete'], $events->pluck('action')->all());
        $this->assertSame([$alphaStaff->id, $alphaStaff->id, $alphaStaff->id], $events->pluck('actor_user_id')->map(static fn ($id): int => (int) $id)->all());
        $this->assertSame('completed', Task::query()->findOrFail($taskId)->state);

        // Cross-office / non-owner actor receives opaque 404 on individual Task.
        $this->actingAs($this->actorB)->getJson('/tasks/'.$taskId)->assertNotFound();
        $this->actingAs($this->actorB)->postJson('/tasks/'.$taskId.'/complete')->assertNotFound();
    }

    /**
     * @param  array<string, mixed>  $trace
     */
    private function assertNoPhysicalPathLeaks(array $trace, Document $document): void
    {
        $encoded = json_encode($trace, JSON_THROW_ON_ERROR);
        if (is_string($document->storage_path) && $document->storage_path !== '') {
            $this->assertStringNotContainsString($document->storage_path, $encoded);
        }
        $this->assertStringNotContainsString('storage_path', $encoded);
        $this->assertStringNotContainsString('provider_object_identity', $encoded);
        $this->assertStringNotContainsString('core-documents', $encoded);
        $this->assertStringNotContainsString((string) $document->checksum_sha256, $encoded);
    }

    private function fakePdf(string $name, string $marker): UploadedFile
    {
        $body = "%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
            ."2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
            ."3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R >> endobj\n"
            .'4 0 obj << /Length '.(strlen($marker) + 12)." >> stream\nBT ({$marker}) Tj ET\nendstream endobj\n";
        $xrefOffset = strlen($body);
        $pdf = $body."xref\n0 5\n0000000000 65535 f \ntrailer << /Size 5 /Root 1 0 R >>\nstartxref\n{$xrefOffset}\n%%EOF\n";

        return UploadedFile::fake()->createWithContent($name, $pdf);
    }

    private function makeActor(Department $department, string $role, string $name): User
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
            'employee_number' => 'TRC-'.Str::upper(Str::random(8)),
            'full_name' => $name,
            'work_email' => $user->email,
            'user_id' => $user->id,
            'department_id' => $department->id,
            'position_title' => $name,
            'employment_status' => 'active',
        ]);

        return $user->fresh('employee.department');
    }
}
