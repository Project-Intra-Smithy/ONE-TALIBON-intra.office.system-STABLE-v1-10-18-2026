<?php

namespace Tests\Feature;

use App\Domain\Correspondence\CorrespondenceClassification;
use App\Domain\Correspondence\CorrespondenceLifecycleState;
use App\Domain\Workflow\Listeners\NotifyWorkflowTransactionMutation;
use App\Models\CalendarEvent;
use App\Models\CorrespondenceRecord;
use App\Models\Department;
use App\Models\Employee;
use App\Models\PlatformNotification;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\CorrespondenceRoutingService;
use App\Services\TransactionVisibilityQuery;
use App\Services\TransactionWorkflowService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Tests\TestCase;

class CorrespondenceLinkedTransactionParityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Isolated synthetic test only; shipped G1/G2 containment remains on.
        config()->set('messaging_release.restricted_uat', false);
    }

    public function test_restricted_correspondence_never_enters_prelink_workflow_event_or_calendar_metadata(): void
    {
        [$record, $origin, $router, $target, $secret] = $this->fixture();

        $routed = app(CorrespondenceRoutingService::class)->route(
            $router,
            $record,
            [
                'target_department_id' => $target->id,
                'priority' => 'normal',
                'due_at' => now()->addDay(),
                'remarks' => 'Routing instruction '.$secret,
            ],
            (string) Str::uuid(),
        );

        $workflow = $routed->fresh('workflowTransaction')->workflowTransaction;
        $this->assertNotNull($workflow);
        $this->assertSame('document_review', $workflow->transaction_type);
        $this->assertSame('Correspondence review', $workflow->title);
        $this->assertNull($workflow->description);

        $created = $workflow->events()->where('action', 'submitted')->firstOrFail();
        $this->assertNull($created->remarks);
        $this->assertStringNotContainsString($secret, (string) $workflow->title);
        $this->assertSame(0, PlatformNotification::query()->where('message', 'like', '%'.$secret.'%')->count());
        $this->assertSame(0, PlatformNotification::query()
            ->where('source_domain', 'transaction')->where('source_id', $workflow->id)->count());
        $this->assertSame(0, CalendarEvent::query()->where('title', 'like', '%'.$secret.'%')->count());
        $this->assertSame($origin->id, $workflow->origin_department_id);
    }

    public function test_restricted_correspondence_uses_source_clearance_in_policy_and_list_scope(): void
    {
        [$record, , $router, $target] = $this->fixture();
        $staff = $this->human('department_staff', $target);
        $head = $this->human('department_head', $target);

        $linked = app(CorrespondenceRoutingService::class)->route(
            $router,
            $record,
            ['target_department_id' => $target->id, 'priority' => 'normal'],
            (string) Str::uuid(),
        );
        $workflow = $linked->fresh('workflowTransaction')->workflowTransaction;

        $this->assertFalse(Gate::forUser($staff)->allows('view', $workflow));
        $this->assertFalse(Gate::forUser($staff)->allows('transition', $workflow));
        $this->assertTrue(Gate::forUser($head)->allows('view', $workflow));
        $this->assertFalse(app(TransactionVisibilityQuery::class)->scope($staff)->whereKey($workflow->id)->exists());
        $this->assertTrue(app(TransactionVisibilityQuery::class)->scope($head)->whereKey($workflow->id)->exists());
    }

    public function test_restricted_assignment_notification_is_delivered_only_to_cleared_head(): void
    {
        [$record, , $router, $target] = $this->fixture();
        $head = $this->human('department_head', $target);
        $staff = $this->human('department_staff', $target);

        $linked = app(CorrespondenceRoutingService::class)->route(
            $router,
            $record,
            ['target_department_id' => $target->id, 'priority' => 'normal'],
            (string) Str::uuid(),
        );
        $workflow = $linked->fresh('workflowTransaction')->workflowTransaction;

        app(TransactionWorkflowService::class)->transition(
            $head,
            $workflow,
            'assign',
            assignedEmployeeId: $head->employee->id,
        );

        $this->assertSame(1, PlatformNotification::query()
            ->where('source_domain', 'transaction')
            ->where('source_id', $workflow->id)
            ->where('user_id', $head->id)
            ->count());
        $this->assertSame(0, PlatformNotification::query()
            ->where('source_domain', 'transaction')
            ->where('source_id', $workflow->id)
            ->where('user_id', $staff->id)
            ->count());
    }

    public function test_legacy_copied_subject_remains_unreadable_to_denied_staff(): void
    {
        [$record, , $router, $target, $secret] = $this->fixture();
        $staff = $this->human('department_staff', $target);

        $linked = app(CorrespondenceRoutingService::class)->route(
            $router,
            $record,
            ['target_department_id' => $target->id, 'priority' => 'normal'],
            (string) Str::uuid(),
        );
        $workflow = $linked->fresh('workflowTransaction')->workflowTransaction;
        $workflow->forceFill(['title' => $secret, 'description' => $secret])->save();

        $this->assertFalse(Gate::forUser($staff)->allows('view', $workflow->fresh()));
        $this->assertFalse(app(TransactionVisibilityQuery::class)->scope($staff)->whereKey($workflow->id)->exists());
    }

    public function test_standalone_document_review_keeps_ordinary_current_office_visibility(): void
    {
        $office = $this->department('STANDALONE');
        $actor = $this->human('department_staff', $office);
        $transaction = WorkflowTransaction::query()->create([
            'reference_no' => 'P0A-TX-'.Str::upper(Str::random(10)),
            'transaction_type' => 'document_review',
            'title' => 'Legitimate standalone document review',
            'priority' => 'normal',
            'origin_department_id' => $office->id,
            'current_department_id' => $office->id,
            'created_by_user_id' => $actor->id,
            'status' => 'submitted',
        ]);

        $this->assertTrue(Gate::forUser($actor)->allows('view', $transaction));
        $this->assertTrue(app(TransactionVisibilityQuery::class)
            ->scope($actor)->whereKey($transaction->id)->exists());
    }

    public function test_multiple_correspondence_links_require_clearance_to_every_source(): void
    {
        [$restricted, , $router, $target] = $this->fixture();
        $staff = $this->human('department_staff', $target);
        $head = $this->human('department_head', $target);
        $routed = app(CorrespondenceRoutingService::class)->route(
            $router,
            $restricted,
            ['target_department_id' => $target->id, 'priority' => 'normal'],
            (string) Str::uuid(),
        );
        $workflow = $routed->fresh('workflowTransaction')->workflowTransaction;

        CorrespondenceRecord::query()->create([
            'public_id' => (string) Str::uuid(),
            'external_reference_no' => 'P0A-OPEN-'.Str::upper(Str::random(8)),
            'source' => 'official_email',
            'channel' => 'official_email',
            'sender_name' => 'Synthetic Sender',
            'subject' => 'Open linked source',
            'received_at' => now(),
            'receiving_department_id' => $target->id,
            'classification' => CorrespondenceClassification::Internal->value,
            'lifecycle_state' => CorrespondenceLifecycleState::Routed->value,
            'workflow_transaction_id' => $workflow->id,
        ]);

        $this->assertFalse(Gate::forUser($staff)->allows('view', $workflow));
        $this->assertFalse(app(TransactionVisibilityQuery::class)
            ->scope($staff)->whereKey($workflow->id)->exists());
        $this->assertTrue(Gate::forUser($head)->allows('view', $workflow));
        $this->assertTrue(app(TransactionVisibilityQuery::class)
            ->scope($head)->whereKey($workflow->id)->exists());
    }

    public function test_multi_source_notifications_are_denied_regardless_of_link_order_or_legacy_type(): void
    {
        foreach (['internal_first', 'restricted_first'] as $order) {
            [$original, , $router, $target, $secret] = $this->fixture();
            $head = $this->human('department_head', $target);
            $staff = $this->human('department_staff', $target);

            if ($order === 'internal_first') {
                $original->update(['classification' => CorrespondenceClassification::Internal->value]);
            }
            $routed = app(CorrespondenceRoutingService::class)->route(
                $router,
                $original,
                ['target_department_id' => $target->id, 'priority' => 'normal'],
                (string) Str::uuid(),
            );
            $workflow = $routed->fresh('workflowTransaction')->workflowTransaction;

            CorrespondenceRecord::query()->create([
                'public_id' => (string) Str::uuid(),
                'external_reference_no' => 'SEC03-'.Str::upper(Str::random(10)),
                'source' => 'official_email',
                'channel' => 'official_email',
                'sender_name' => 'Synthetic Sender',
                'subject' => 'Additional source',
                'received_at' => now(),
                'receiving_department_id' => $target->id,
                'classification' => $order === 'internal_first'
                    ? CorrespondenceClassification::Restricted->value
                    : CorrespondenceClassification::Internal->value,
                'lifecycle_state' => CorrespondenceLifecycleState::Routed->value,
                'workflow_transaction_id' => $workflow->id,
            ]);

            // Simulate previously persisted classified titles. The second
            // order uses a malformed legacy type despite its source linkage.
            $workflow->forceFill([
                'title' => $secret,
                'transaction_type' => $order === 'restricted_first'
                    ? 'internal_request' : 'document_review',
            ])->save();

            $listener = app(NotifyWorkflowTransactionMutation::class);
            $event = $workflow->events()->firstOrFail();
            $assign = new \ReflectionMethod($listener, 'notifyAssignedEmployee');
            $assign->invoke($listener, $workflow, $event, $staff->employee->id);
            $this->assertSame(0, PlatformNotification::query()
                ->where('user_id', $staff->id)
                ->where('source_domain', 'transaction')
                ->where('source_id', $workflow->id)->count());

            $assign->invoke($listener, $workflow, $event, $head->employee->id);
            $this->assertSame(1, PlatformNotification::query()
                ->where('user_id', $head->id)
                ->where('source_domain', 'transaction')
                ->where('source_id', $workflow->id)->count());

            $notifyOffice = new \ReflectionMethod($listener, 'dispatchOffice');
            $notifyOffice->invoke($listener, $target, $workflow, [
                'event_key' => 'sec03-office-'.$workflow->id,
                'source_domain' => 'transaction',
                'source_type' => WorkflowTransaction::class,
                'source_id' => $workflow->id,
                'priority' => 'info',
                'title' => 'Confidential routing',
                'message' => $secret,
                'action_url' => '/transactions/'.$workflow->id,
            ]);

            $this->assertSame(0, PlatformNotification::query()
                ->where('user_id', $staff->id)
                ->where('source_domain', 'transaction')
                ->where('source_id', $workflow->id)->count());
            $this->assertSame(2, PlatformNotification::query()
                ->where('user_id', $head->id)
                ->where('source_domain', 'transaction')
                ->where('source_id', $workflow->id)->count());
        }
    }

    public function test_unlinked_ordinary_request_keeps_office_notification_delivery(): void
    {
        $office = $this->department('ORDINARY-NOTIFICATION');
        $actor = $this->human('department_staff', $office);
        $workflow = WorkflowTransaction::query()->create([
            'reference_no' => 'P0A-ORD-'.Str::upper(Str::random(9)),
            'transaction_type' => 'internal_request',
            'title' => 'Ordinary request',
            'priority' => 'normal',
            'origin_department_id' => $office->id,
            'current_department_id' => $office->id,
            'created_by_user_id' => $actor->id,
            'status' => 'submitted',
        ]);

        $listener = app(NotifyWorkflowTransactionMutation::class);
        $notifyOffice = new \ReflectionMethod($listener, 'dispatchOffice');
        $notifyOffice->invoke($listener, $office, $workflow, [
            'event_key' => 'sec03-ordinary-'.$workflow->id,
            'source_domain' => 'transaction',
            'source_type' => WorkflowTransaction::class,
            'source_id' => $workflow->id,
            'priority' => 'info',
            'title' => 'Ordinary receipt',
            'message' => $workflow->title,
        ]);

        $this->assertSame(1, PlatformNotification::query()
            ->where('user_id', $actor->id)
            ->where('source_id', $workflow->id)->count());
    }

    /**
     * @return array{CorrespondenceRecord, Department, User, Department, string}
     */
    private function fixture(): array
    {
        $origin = $this->department('ORIGIN');
        $target = $this->department('TARGET');
        $router = $this->human('department_head', $origin);
        $secret = 'CLASSIFIED-'.Str::upper(Str::random(12));

        $record = CorrespondenceRecord::query()->create([
            'public_id' => (string) Str::uuid(),
            'external_reference_no' => 'SECRET-EXT-'.Str::upper(Str::random(10)),
            'municipal_reference_no' => 'TAL-COR-TEST-'.Str::upper(Str::random(10)),
            'source' => 'official_email',
            'channel' => 'official_email',
            'sender_name' => 'Synthetic Sender',
            'sender_organization' => 'Synthetic Office',
            'subject' => $secret,
            'summary' => 'Restricted summary '.$secret,
            'received_at' => now()->subHour(),
            'registered_at' => now()->subMinutes(50),
            'classified_at' => now()->subMinutes(45),
            'receiving_department_id' => $origin->id,
            'classification' => CorrespondenceClassification::Restricted->value,
            'lifecycle_state' => CorrespondenceLifecycleState::Classified->value,
            'classified_by_user_id' => $router->id,
            'registered_by_user_id' => $router->id,
        ]);

        return [$record, $origin, $router, $target, $secret];
    }

    private function department(string $name): Department
    {
        return Department::query()->create([
            'code' => 'P0A-'.Str::upper(Str::random(7)).'-'.$name,
            'name' => 'Synthetic '.$name,
            'is_active' => true,
            'is_routable' => true,
        ]);
    }

    private function human(string $role, Department $office): User
    {
        $user = User::query()->create([
            'name' => 'Synthetic '.$role.' '.Str::random(4),
            'email' => Str::lower(Str::random(12)).'@example.test',
            'password' => 'password',
            'role' => $role,
            'is_active' => true,
        ]);
        Employee::query()->create([
            'employee_number' => 'P0A-'.Str::upper(Str::random(10)),
            'full_name' => $user->name,
            'work_email' => $user->email,
            'user_id' => $user->id,
            'department_id' => $office->id,
            'position_title' => 'Synthetic Officer',
            'employment_status' => 'active',
        ]);

        return $user->fresh('employee.department');
    }
}
