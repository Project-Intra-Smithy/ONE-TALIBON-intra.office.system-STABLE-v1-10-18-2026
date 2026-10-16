<?php

namespace Tests\Feature;

use App\Domain\Correspondence\CorrespondenceClassification;
use App\Domain\Correspondence\CorrespondenceLifecycleState;
use App\Models\AuditLog;
use App\Models\CorrespondenceEvent;
use App\Models\CorrespondenceRecord;
use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentLink;
use App\Models\Employee;
use App\Models\OutboxMessage;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\TransactionWorkflowService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CorrespondenceWorkspaceActionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_workspace_register_generates_reference_redirects_and_is_exactly_once(): void
    {
        $office = $this->department('REGISTER');
        $registrar = $this->human('department_staff', $office);
        $record = $this->record('Fresh intake', CorrespondenceLifecycleState::Received);

        $this->actingAs($registrar)
            ->post('/correspondence/'.$record->public_id.'/workspace/register')
            ->assertRedirect('/correspondence/'.$record->public_id.'/workspace')
            ->assertSessionHas('success', 'Correspondence registered.');

        $registered = $record->fresh();
        $this->assertSame(CorrespondenceLifecycleState::Registered, $registered->lifecycle_state);
        $this->assertSame($office->id, $registered->receiving_department_id);
        $this->assertMatchesRegularExpression('/^TAL-COR-\d{4}-\d{6}$/', (string) $registered->municipal_reference_no);
        $this->assertSame(1, CorrespondenceEvent::query()->where('correspondence_record_id', $record->id)->where('event', 'registered')->count());
        $this->assertSame(1, OutboxMessage::query()->where('aggregate_id', $record->public_id)->where('event_type', 'correspondence.registered')->count());

        $this->actingAs($registrar)
            ->from('/correspondence/'.$record->public_id.'/workspace')
            ->post('/correspondence/'.$record->public_id.'/workspace/register')
            ->assertSessionHasErrors('correspondence');

        $this->assertSame(1, CorrespondenceEvent::query()->where('correspondence_record_id', $record->id)->where('event', 'registered')->count());
        $this->assertSame(1, OutboxMessage::query()->where('aggregate_id', $record->public_id)->where('event_type', 'correspondence.registered')->count());
    }

    public function test_workspace_classify_persists_classification_remarks_and_immediately_changes_visibility(): void
    {
        $office = $this->department('CLASSIFY');
        $head = $this->human('department_head', $office);
        $staff = $this->human('department_staff', $office);
        $record = $this->record(
            'Sensitive registered correspondence',
            CorrespondenceLifecycleState::Registered,
            $office,
        );

        $this->actingAs($head)
            ->post('/correspondence/'.$record->public_id.'/workspace/classify', [
                'classification' => 'restricted',
                'remarks' => 'Limited to authorized municipal officials.',
            ])
            ->assertRedirect('/correspondence/'.$record->public_id.'/workspace')
            ->assertSessionHas('success', 'Correspondence classification updated.');

        $classified = $record->fresh();
        $this->assertSame(CorrespondenceLifecycleState::Classified, $classified->lifecycle_state);
        $this->assertSame(CorrespondenceClassification::Restricted, $classified->classification);
        $this->assertDatabaseHas('correspondence_events', [
            'correspondence_record_id' => $record->id,
            'event' => 'classified',
            'remarks' => 'Limited to authorized municipal officials.',
        ]);

        $this->actingAs($staff)
            ->get('/correspondence/'.$record->public_id.'/workspace')
            ->assertForbidden();
    }

    public function test_department_staff_cannot_classify_and_invalid_classification_is_rejected(): void
    {
        $office = $this->department('CLASS-DENY');
        $staff = $this->human('department_staff', $office);
        $head = $this->human('department_head', $office);
        $record = $this->record('Registered item', CorrespondenceLifecycleState::Registered, $office);

        $this->actingAs($staff)
            ->post('/correspondence/'.$record->public_id.'/workspace/classify', [
                'classification' => 'internal',
            ])
            ->assertForbidden();

        $this->actingAs($head)
            ->from('/correspondence/'.$record->public_id.'/workspace')
            ->post('/correspondence/'.$record->public_id.'/workspace/classify', [
                'classification' => 'invented',
            ])
            ->assertSessionHasErrors('classification');

        $this->assertSame(CorrespondenceLifecycleState::Registered, $record->fresh()->lifecycle_state);
    }

    public function test_sec01_hr_officer_cannot_downgrade_registered_restricted_correspondence_via_json(): void
    {
        $office = $this->department('SEC01-HR');
        $hr = $this->human('hr_officer', $office);
        $record = $this->record('Restricted HR item', CorrespondenceLifecycleState::Registered, $office, CorrespondenceClassification::Restricted);
        $document = $this->sec01Evidence($hr, $office, $record);

        $this->actingAs($hr)
            ->postJson('/correspondence/'.$record->public_id.'/classify', [
                'classification' => 'internal',
            ])
            ->assertForbidden();

        $this->assertSec01NoClassificationSideEffects($record, $document);
    }

    public function test_sec01_legislative_staff_cannot_reclassify_or_attach_workspace_evidence(): void
    {
        config(['documents.disk' => 'documents']);
        Storage::fake('documents');

        $office = $this->department('SEC01-LEG');
        $legislative = $this->human('legislative_staff', $office);
        $record = $this->record('Restricted legislative item', CorrespondenceLifecycleState::Registered, $office, CorrespondenceClassification::Restricted);
        $document = $this->sec01Evidence($legislative, $office, $record);

        $this->actingAs($legislative)
            ->post('/correspondence/'.$record->public_id.'/workspace/classify', [
                'classification' => 'internal',
                'evidence' => [UploadedFile::fake()->create('sec01-unauthorized.pdf', 2, 'application/pdf')],
            ])
            ->assertForbidden();

        $this->assertSec01NoClassificationSideEffects($record, $document);
        $this->assertSame(1, Document::query()->count(), 'Denied upload must not create evidence.');
        $this->assertSame(1, DocumentLink::query()->count(), 'Denied upload must not create evidence links.');
    }

    public function test_sec01_foreign_department_head_cannot_classify_without_current_scope(): void
    {
        $ownerOffice = $this->department('SEC01-OWNER');
        $foreignOffice = $this->department('SEC01-FOREIGN');
        $owner = $this->human('department_head', $ownerOffice);
        $foreignHead = $this->human('department_head', $foreignOffice);
        $record = $this->record('Owner only', CorrespondenceLifecycleState::Registered, $ownerOffice, CorrespondenceClassification::Restricted);
        $document = $this->sec01Evidence($owner, $ownerOffice, $record);

        $this->actingAs($foreignHead)
            ->postJson('/correspondence/'.$record->public_id.'/classify', [
                'classification' => 'internal',
            ])
            ->assertForbidden();

        $this->assertSec01NoClassificationSideEffects($record, $document);
    }

    public function test_sec01_cleared_department_head_and_mayor_approver_can_classify_restricted_records(): void
    {
        $office = $this->department('SEC01-PRIV');
        $head = $this->human('department_head', $office);
        $mayor = $this->human('mayor_approver', $office);

        $headRecord = $this->record('Head restricted item', CorrespondenceLifecycleState::Registered, $office, CorrespondenceClassification::Restricted);
        $this->actingAs($head)
            ->postJson('/correspondence/'.$headRecord->public_id.'/classify', [
                'classification' => 'internal',
                'remarks' => 'Authorized head decision.',
            ])
            ->assertOk()
            ->assertJsonPath('correspondence.classification', 'internal')
            ->assertJsonPath('correspondence.lifecycle_state', 'classified');

        $mayorRecord = $this->record('Mayor restricted item', CorrespondenceLifecycleState::Registered, $office, CorrespondenceClassification::Restricted);
        $this->actingAs($mayor)
            ->post('/correspondence/'.$mayorRecord->public_id.'/workspace/classify', [
                'classification' => 'confidential',
                'remarks' => 'Authorized mayor decision.',
            ])
            ->assertRedirect('/correspondence/'.$mayorRecord->public_id.'/workspace')
            ->assertSessionHas('success', 'Correspondence classification updated.');

        $this->assertSame(CorrespondenceClassification::Internal, $headRecord->fresh()->classification);
        $this->assertSame(CorrespondenceClassification::Confidential, $mayorRecord->fresh()->classification);
        $this->assertSame(CorrespondenceLifecycleState::Classified, $mayorRecord->fresh()->lifecycle_state);
        $this->assertSame(2, CorrespondenceEvent::query()->where('event', 'classified')->count());
        $this->assertSame(2, OutboxMessage::query()->where('event_type', 'correspondence.classified')->count());
    }

    public function test_sec01_existing_non_restricted_classifier_clearance_is_preserved(): void
    {
        $office = $this->department('SEC01-OTHER');
        foreach (['hr_officer', 'legislative_staff'] as $role) {
            $actor = $this->human($role, $office);
            $record = $this->record('Allowed '.$role, CorrespondenceLifecycleState::Registered, $office, CorrespondenceClassification::Confidential);

            $this->actingAs($actor)
                ->postJson('/correspondence/'.$record->public_id.'/classify', [
                    'classification' => 'internal',
                ])
                ->assertOk()
                ->assertJsonPath('correspondence.classification', 'internal');

            $this->assertSame(CorrespondenceLifecycleState::Classified, $record->fresh()->lifecycle_state);
        }
    }

    private function sec01Evidence(User $actor, Department $office, CorrespondenceRecord $record): Document
    {
        $document = Document::query()->create([
            'title' => 'SEC01 existing evidence',
            'original_name' => 'sec01-existing.pdf',
            'document_type' => 'supporting_document',
            'classification' => 'restricted',
            'storage_disk' => 'documents',
            'storage_path' => 'sec01/'.Str::uuid().'.pdf',
            'owner_department_id' => $office->id,
            'uploaded_by_user_id' => $actor->id,
        ]);
        DocumentLink::query()->create([
            'document_id' => $document->id,
            'linkable_type' => $record->getMorphClass(),
            'linkable_id' => $record->id,
            'relationship' => 'supporting_document',
            'created_by_user_id' => $actor->id,
        ]);

        return $document;
    }

    private function assertSec01NoClassificationSideEffects(CorrespondenceRecord $record, Document $document): void
    {
        $fresh = $record->fresh();
        $this->assertSame(CorrespondenceClassification::Restricted, $fresh->classification);
        $this->assertSame(CorrespondenceLifecycleState::Registered, $fresh->lifecycle_state);
        $this->assertNull($fresh->classified_at);
        $this->assertNull($fresh->classified_by_user_id);
        $this->assertSame('restricted', $document->fresh()->classification);
        $this->assertSame(0, CorrespondenceEvent::query()
            ->where('correspondence_record_id', $record->id)
            ->where('event', 'classified')
            ->count());
        $this->assertSame(0, OutboxMessage::query()
            ->where('aggregate_id', $record->public_id)
            ->where('event_type', 'correspondence.classified')
            ->count());
        $this->assertSame(0, AuditLog::query()
            ->where('entity_type', 'correspondence_record')
            ->where('entity_id', $record->id)
            ->where('action', 'correspondence.classified')
            ->count());
    }

    public function test_workspace_route_creates_exactly_one_existing_document_review_workflow_with_payload(): void
    {
        $origin = $this->department('ROUTE-ORIGIN');
        $target = $this->department('ROUTE-TARGET');
        $head = $this->human('department_head', $origin);
        $targetHead = $this->human('department_head', $target);
        $record = $this->record(
            'Classified routing item',
            CorrespondenceLifecycleState::Classified,
            $origin,
            CorrespondenceClassification::Internal,
        );
        $due = now()->addDays(2)->toDateString();

        $this->actingAs($head)
            ->post('/correspondence/'.$record->public_id.'/workspace/route', [
                'target_department_id' => $target->id,
                'priority' => 'urgent',
                'due_at' => $due,
                'remarks' => 'Please review immediately.',
            ])
            ->assertRedirect('/correspondence')
            ->assertSessionHas('success', 'Correspondence routed successfully. Accountability moved to the destination office.');

        $routed = $record->fresh('workflowTransaction');
        $workflow = $routed->workflowTransaction;
        $this->assertSame(CorrespondenceLifecycleState::Routed, $routed->lifecycle_state);
        $this->assertInstanceOf(WorkflowTransaction::class, $workflow);
        $this->assertSame('document_review', $workflow->transaction_type);
        $this->assertSame($target->id, $workflow->current_department_id);
        $this->assertSame('urgent', $workflow->priority);
        $this->assertSame($due, $workflow->due_at?->toDateString());
        $this->assertDatabaseCount('transactions', 1);
        $this->assertDatabaseHas('transaction_events', [
            'transaction_id' => $workflow->id,
            'action' => 'submitted',
            'remarks' => 'Please review immediately.',
        ]);
        $this->assertSame(1, CorrespondenceEvent::query()->where('correspondence_record_id', $record->id)->where('event', 'routed')->count());

        $this->actingAs($head)
            ->get('/correspondence/'.$record->public_id.'/workspace')
            ->assertForbidden();

        $this->actingAs($targetHead)
            ->get('/correspondence/'.$record->public_id.'/workspace')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('correspondence.lifecycleState', 'routed')
                ->where('correspondence.accountability.currentOffice.code', $target->code)
                ->where('correspondence.accountability.workflow.status', 'submitted')
                ->where('capabilities.canAct', false));

        $this->actingAs($head)
            ->from('/correspondence/'.$record->public_id.'/workspace')
            ->post('/correspondence/'.$record->public_id.'/workspace/route', [
                'target_department_id' => $target->id,
                'priority' => 'normal',
            ])
            ->assertSessionHasErrors('correspondence');

        $this->assertDatabaseCount('transactions', 1);
        $this->assertSame(1, CorrespondenceEvent::query()->where('correspondence_record_id', $record->id)->where('event', 'routed')->count());
    }

    public function test_workspace_route_rejects_self_disabled_and_invalid_due_date_without_mutation(): void
    {
        $origin = $this->department('ROUTE-VALIDATION');
        $head = $this->human('department_head', $origin);
        $disabled = $this->department('ROUTE-DISABLED', active: false);
        $record = $this->record(
            'Route validation item',
            CorrespondenceLifecycleState::Classified,
            $origin,
            CorrespondenceClassification::Internal,
        );

        $this->actingAs($head)
            ->from('/correspondence/'.$record->public_id.'/workspace')
            ->post('/correspondence/'.$record->public_id.'/workspace/route', [
                'target_department_id' => $origin->id,
                'priority' => 'normal',
            ])
            ->assertSessionHasErrors('target_department_id');

        $this->actingAs($head)
            ->from('/correspondence/'.$record->public_id.'/workspace')
            ->post('/correspondence/'.$record->public_id.'/workspace/route', [
                'target_department_id' => $disabled->id,
                'priority' => 'normal',
            ])
            ->assertSessionHasErrors('target_department_id');

        $target = $this->department('ROUTE-DATE');
        $this->actingAs($head)
            ->from('/correspondence/'.$record->public_id.'/workspace')
            ->post('/correspondence/'.$record->public_id.'/workspace/route', [
                'target_department_id' => $target->id,
                'priority' => 'normal',
                'due_at' => now()->subDay()->toDateString(),
            ])
            ->assertSessionHasErrors('due_at');

        $this->assertSame(CorrespondenceLifecycleState::Classified, $record->fresh()->lifecycle_state);
        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_detail_route_options_are_active_routable_exclude_self_and_only_exist_when_routing_is_allowed(): void
    {
        $origin = $this->department('OPTIONS-ORIGIN');
        $valid = $this->department('OPTIONS-VALID');
        $this->department('OPTIONS-INACTIVE', active: false);
        $this->department('OPTIONS-NONROUTABLE', routable: false);
        $head = $this->human('department_head', $origin);
        $classified = $this->record(
            'Route option item',
            CorrespondenceLifecycleState::Classified,
            $origin,
            CorrespondenceClassification::Internal,
        );

        $this->actingAs($head)
            ->get('/correspondence/'.$classified->public_id.'/workspace')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('capabilities.canRoute', true)
                ->has('routeOptions', 1)
                ->where('routeOptions.0.id', $valid->id)
                ->where('routeOptions.0.code', $valid->code));

        $registered = $this->record('Not ready to route', CorrespondenceLifecycleState::Registered, $origin);
        $this->actingAs($head)
            ->get('/correspondence/'.$registered->public_id.'/workspace')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('capabilities.canRoute', false)
                ->where('routeOptions', []));
    }

    public function test_routed_correspondence_becomes_actionable_only_after_existing_workflow_prerequisite(): void
    {
        $origin = $this->department('ACT-FLOW-ORIGIN');
        $target = $this->department('ACT-FLOW-TARGET');
        $originHead = $this->human('department_head', $origin);
        $targetHead = $this->human('department_head', $target);
        $record = $this->record(
            'Routed action prerequisite item',
            CorrespondenceLifecycleState::Classified,
            $origin,
            CorrespondenceClassification::Internal,
        );

        $this->actingAs($originHead)
            ->post('/correspondence/'.$record->public_id.'/workspace/route', [
                'target_department_id' => $target->id,
                'priority' => 'normal',
                'remarks' => 'Route to receiving office for review.',
            ])
            ->assertRedirect('/correspondence');

        $routed = $record->fresh('workflowTransaction');
        $workflow = $routed->workflowTransaction;
        $this->assertInstanceOf(WorkflowTransaction::class, $workflow);
        $this->assertSame(CorrespondenceLifecycleState::Routed, $routed->lifecycle_state);
        $this->assertSame('submitted', $workflow->status);
        $this->assertNull($workflow->assigned_employee_id);
        $this->assertSame($target->id, $workflow->current_department_id);

        $this->actingAs($targetHead)
            ->get('/correspondence/'.$record->public_id.'/workspace')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('capabilities.canAct', false)
                ->where('correspondence.accountability.workflow.status', 'submitted')
                ->where('correspondence.accountability.workflow.currentOffice.code', $target->code));

        $workflowEventsBefore = $workflow->events()->count();
        $this->actingAs($targetHead)
            ->post('/transactions/'.$workflow->id.'/transition', [
                'action' => 'mark_review',
            ])
            ->assertRedirect('/transactions/'.$workflow->id)
            ->assertSessionHas('success', 'Transaction workflow updated.');

        $prepared = $workflow->fresh();
        $this->assertSame('for_review', $prepared->status);
        $this->assertSame($target->id, $prepared->current_department_id);
        $this->assertNull($prepared->assigned_employee_id);
        $this->assertSame($workflowEventsBefore + 1, $prepared->events()->count());

        $this->actingAs($targetHead)
            ->get('/correspondence/'.$record->public_id.'/workspace')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('capabilities.canAct', true)
                ->where('correspondence.accountability.workflow.status', 'for_review'));

        $correspondenceEventsBefore = $record->events()->count();
        $workflowEventsPrepared = $prepared->events()->count();

        $this->actingAs($targetHead)
            ->post('/correspondence/'.$record->public_id.'/workspace/act', [
                'remarks' => 'Receiving office has begun action.',
            ])
            ->assertRedirect('/correspondence/'.$record->public_id.'/workspace')
            ->assertSessionHas('success', 'Correspondence marked in action.');

        $acted = $record->fresh('workflowTransaction');
        $this->assertSame(CorrespondenceLifecycleState::InAction, $acted->lifecycle_state);
        $this->assertNotNull($acted->action_started_at);
        $this->assertSame($correspondenceEventsBefore + 1, $acted->events()->count());
        $this->assertSame('for_review', $acted->workflowTransaction->status);
        $this->assertSame($target->id, $acted->workflowTransaction->current_department_id);
        $this->assertSame($workflowEventsPrepared, $acted->workflowTransaction->events()->count());
        $this->assertSame(1, CorrespondenceEvent::query()
            ->where('correspondence_record_id', $record->id)
            ->where('event', 'in_action')
            ->count());
    }

    public function test_non_actionable_routed_workspace_act_is_rejected_without_state_change(): void
    {
        $origin = $this->department('ACT-ORIGIN');
        $target = $this->department('ACT-WAIT');
        $creator = $this->human('department_head', $origin);
        $targetHead = $this->human('department_head', $target);
        $workflow = $this->workflow($creator, $target, null, 'submitted');
        $record = $this->record(
            'Waiting routed item',
            CorrespondenceLifecycleState::Routed,
            $origin,
            CorrespondenceClassification::Internal,
            $workflow,
        );

        $this->actingAs($targetHead)
            ->from('/correspondence/'.$record->public_id.'/workspace')
            ->post('/correspondence/'.$record->public_id.'/workspace/act', [
                'remarks' => 'Attempt before assignment.',
            ])
            ->assertSessionHasErrors('workflow');

        $this->assertSame(CorrespondenceLifecycleState::Routed, $record->fresh()->lifecycle_state);
        $this->assertDatabaseMissing('correspondence_events', [
            'correspondence_record_id' => $record->id,
            'event' => 'in_action',
        ]);
    }

    public function test_actionable_workspace_act_enters_in_action_and_remains_exactly_once(): void
    {
        $origin = $this->department('ACT-READY-ORIGIN');
        $target = $this->department('ACT-READY');
        $creator = $this->human('department_head', $origin);
        $recipient = $this->human('department_head', $target);
        $workflow = $this->workflow($creator, $target, $recipient->employee, 'submitted');
        $record = $this->record(
            'Actionable routed item',
            CorrespondenceLifecycleState::Routed,
            $origin,
            CorrespondenceClassification::Internal,
            $workflow,
        );

        $this->actingAs($recipient)
            ->post('/correspondence/'.$record->public_id.'/workspace/act', [
                'remarks' => 'Work has formally started.',
            ])
            ->assertRedirect('/correspondence/'.$record->public_id.'/workspace')
            ->assertSessionHas('success', 'Correspondence marked in action.');

        $this->assertSame(CorrespondenceLifecycleState::InAction, $record->fresh()->lifecycle_state);
        $this->assertSame(1, CorrespondenceEvent::query()->where('correspondence_record_id', $record->id)->where('event', 'in_action')->count());
        $this->assertSame(1, OutboxMessage::query()->where('aggregate_id', $record->public_id)->where('event_type', 'correspondence.in_action')->count());

        $this->actingAs($recipient)
            ->from('/correspondence/'.$record->public_id.'/workspace')
            ->post('/correspondence/'.$record->public_id.'/workspace/act')
            ->assertSessionHasErrors('correspondence');

        $this->assertSame(1, CorrespondenceEvent::query()->where('correspondence_record_id', $record->id)->where('event', 'in_action')->count());
        $this->assertSame(1, OutboxMessage::query()->where('aggregate_id', $record->public_id)->where('event_type', 'correspondence.in_action')->count());
    }

    public function test_wrong_office_and_system_admin_cannot_bypass_workspace_mutation_authorization(): void
    {
        $ownerOffice = $this->department('AUTH-OWNER');
        $otherOffice = $this->department('AUTH-OTHER');
        $target = $this->department('AUTH-TARGET');
        $otherHead = $this->human('department_head', $otherOffice);
        $systemAdmin = $this->human('system_admin', $ownerOffice);
        $record = $this->record(
            'Restricted classified item',
            CorrespondenceLifecycleState::Classified,
            $ownerOffice,
            CorrespondenceClassification::Restricted,
        );

        $payload = [
            'target_department_id' => $target->id,
            'priority' => 'normal',
        ];

        $this->actingAs($otherHead)
            ->post('/correspondence/'.$record->public_id.'/workspace/route', $payload)
            ->assertForbidden();

        $this->actingAs($systemAdmin)
            ->post('/correspondence/'.$record->public_id.'/workspace/route', $payload)
            ->assertForbidden();

        $this->assertSame(CorrespondenceLifecycleState::Classified, $record->fresh()->lifecycle_state);
        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_existing_json_correspondence_mutation_and_detail_contracts_remain_intact(): void
    {
        $origin = $this->department('JSON-ORIGIN');
        $target = $this->department('JSON-TARGET');
        $head = $this->human('department_head', $origin);
        $targetHead = $this->human('department_head', $target);
        $record = $this->record('JSON lifecycle record', CorrespondenceLifecycleState::Received);

        $this->actingAs($head)
            ->postJson('/correspondence/'.$record->public_id.'/register')
            ->assertOk()
            ->assertJsonPath('correspondence.lifecycle_state', 'registered')
            ->assertJsonPath('correspondence.public_id', $record->public_id);

        $this->actingAs($head)
            ->postJson('/correspondence/'.$record->public_id.'/classify', [
                'classification' => 'internal',
                'remarks' => 'JSON classification remains supported.',
            ])
            ->assertOk()
            ->assertJsonPath('correspondence.lifecycle_state', 'classified')
            ->assertJsonPath('correspondence.classification', 'internal');

        $this->actingAs($head)
            ->postJson('/correspondence/'.$record->public_id.'/route', [
                'target_department_id' => $target->id,
                'priority' => 'normal',
                'remarks' => 'JSON routing remains supported.',
            ])
            ->assertOk()
            ->assertJsonPath('correspondence.lifecycle_state', 'routed');

        $workflow = $record->fresh()->workflowTransaction;
        app(TransactionWorkflowService::class)->transition(
            $targetHead,
            $workflow,
            'assign',
            assignedEmployeeId: $targetHead->employee->id,
        );

        $this->actingAs($targetHead)
            ->postJson('/correspondence/'.$record->public_id.'/act', [
                'remarks' => 'JSON act remains supported.',
            ])
            ->assertOk()
            ->assertJsonPath('correspondence.lifecycle_state', 'in_action');

        $this->actingAs($targetHead)
            ->getJson('/correspondence/'.$record->public_id)
            ->assertOk()
            ->assertJsonPath('correspondence.public_id', $record->public_id)
            ->assertJsonPath('correspondence.lifecycle_state', 'in_action');

        $this->assertTrue(Route::has('api.v1.correspondence.show'));
        $this->assertStringContainsString(
            '/api/v1/correspondence/'.$record->public_id,
            route('api.v1.correspondence.show', ['publicId' => $record->public_id]),
        );
    }

    private function department(
        string $suffix,
        bool $active = true,
        bool $routable = true,
    ): Department {
        return Department::query()->create([
            'code' => 'ACTION-'.Str::upper(Str::random(5)).'-'.$suffix,
            'name' => 'Action '.$suffix,
            'short_name' => 'AC-'.$suffix,
            'branch' => 'executive',
            'office_type' => 'department',
            'sort_order' => 10,
            'is_routable' => $routable,
            'is_active' => $active,
        ]);
    }

    private function human(string $role, Department $department): User
    {
        $user = User::query()->create([
            'name' => 'Action '.$role.' '.Str::random(5),
            'email' => Str::lower(Str::random(10)).'@example.test',
            'password' => 'password',
            'role' => $role,
            'is_active' => true,
        ]);

        Employee::query()->create([
            'employee_number' => 'ACTION-EMP-'.Str::upper(Str::random(10)),
            'full_name' => $user->name,
            'work_email' => $user->email,
            'user_id' => $user->id,
            'department_id' => $department->id,
            'position_title' => 'Correspondence Officer',
            'employment_status' => 'active',
        ]);

        return $user->fresh('employee.department');
    }

    private function record(
        string $subject,
        CorrespondenceLifecycleState $state,
        ?Department $department = null,
        ?CorrespondenceClassification $classification = null,
        ?WorkflowTransaction $workflow = null,
    ): CorrespondenceRecord {
        $registered = $state !== CorrespondenceLifecycleState::Received;
        $classified = in_array($state, [
            CorrespondenceLifecycleState::Classified,
            CorrespondenceLifecycleState::Routed,
            CorrespondenceLifecycleState::InAction,
        ], true);
        $routed = in_array($state, [
            CorrespondenceLifecycleState::Routed,
            CorrespondenceLifecycleState::InAction,
        ], true);

        return CorrespondenceRecord::query()->create([
            'public_id' => (string) Str::uuid(),
            'external_reference_no' => 'EXT-'.Str::upper(Str::random(18)),
            'source' => 'email',
            'channel' => 'official_email',
            'sender_name' => 'Synthetic Sender',
            'sender_organization' => 'Synthetic Office',
            'subject' => $subject,
            'summary' => 'Synthetic correspondence workspace action test.',
            'received_at' => now()->subHours(5),
            'receiving_department_id' => $department?->id,
            'registered_at' => $registered ? now()->subHours(4) : null,
            'municipal_reference_no' => $registered ? 'TAL-COR-TEST-'.Str::upper(Str::random(12)) : null,
            'classification' => $classification?->value,
            'classified_at' => $classified ? now()->subHours(3) : null,
            'routed_at' => $routed ? now()->subHours(2) : null,
            'action_started_at' => $state === CorrespondenceLifecycleState::InAction ? now()->subHour() : null,
            'lifecycle_state' => $state->value,
            'workflow_transaction_id' => $workflow?->id,
        ]);
    }

    private function workflow(
        User $creator,
        Department $currentOffice,
        ?Employee $assignee,
        string $status,
    ): WorkflowTransaction {
        return WorkflowTransaction::query()->create([
            'reference_no' => 'TX-'.Str::upper(Str::random(12)),
            'transaction_type' => 'document_review',
            'title' => 'Correspondence workspace action linked workflow',
            'priority' => 'normal',
            'origin_department_id' => $creator->employee->department_id,
            'current_department_id' => $currentOffice->id,
            'created_by_user_id' => $creator->id,
            'assigned_employee_id' => $assignee?->id,
            'status' => $status,
            'received_at' => now()->subHours(2),
            'due_at' => now()->addDay(),
        ]);
    }
}
