<?php

namespace Tests\Feature;

use App\Domain\Correspondence\CorrespondenceClassification;
use App\Domain\Correspondence\CorrespondenceLifecycleState;
use App\Models\CalendarEvent;
use App\Models\CorrespondenceRecord;
use App\Models\Department;
use App\Models\Employee;
use App\Models\PlatformNotification;
use App\Models\User;
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
