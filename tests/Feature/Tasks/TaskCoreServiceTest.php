<?php

namespace Tests\Feature\Tasks;

use App\Domain\Tasks\TaskCoreService;
use App\Models\CorrespondenceRecord;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Task;
use App\Models\TaskEvent;
use App\Models\User;
use App\Models\WorkflowTransaction;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Tests\TestCase;

class TaskCoreServiceTest extends TestCase
{
    use RefreshDatabase;

    private function service(): TaskCoreService
    {
        return app(TaskCoreService::class);
    }

    public function test_individual_creation_derives_identity_office_state_and_atomic_history(): void
    {
        [$actor, $office] = $this->staff('one');

        $task = $this->service()->createIndividual($actor, '  My task  ', 'A private todo.');

        $this->assertSame('My task', $task->title);
        $this->assertSame('individual', $task->task_kind);
        $this->assertSame('open', $task->state);
        $this->assertSame($actor->id, $task->created_by_user_id);
        $this->assertSame($office->id, $task->owning_department_id);
        $this->assertNull($task->assigned_to_user_id);
        $this->assertNull($task->completed_at);
        $this->assertSame(1, TaskEvent::query()->where('task_id', $task->id)->count());
        $event = $task->events()->firstOrFail();
        $this->assertSame('created', $event->action);
        $this->assertNull($event->previous_state);
        $this->assertSame('open', $event->new_state);
        $this->assertSame($actor->id, $event->actor_user_id);
        $this->assertSame(0, WorkflowTransaction::query()->count());
        $this->assertSame(0, CorrespondenceRecord::query()->count());
    }

    public function test_owner_start_and_complete_are_guarded_and_audited(): void
    {
        [$actor] = $this->staff('flow');
        $task = $this->service()->createIndividual($actor, 'Finish notes');

        $started = $this->service()->transitionIndividual($actor, $task->id, 'start');
        $this->assertSame('in_progress', $started->state);
        $this->assertNull($started->completed_at);

        $completed = $this->service()->transitionIndividual($actor, $task->id, 'complete');
        $this->assertSame('completed', $completed->state);
        $this->assertNotNull($completed->completed_at);

        $events = TaskEvent::query()->where('task_id', $task->id)->orderBy('id')->get();
        $this->assertSame(['created', 'start', 'complete'], $events->pluck('action')->all());
        $this->assertSame(['open', 'in_progress', 'completed'], $events->pluck('new_state')->all());
        $this->assertSame(['open', 'in_progress'], $events->skip(1)->pluck('previous_state')->all());
        $this->assertEqualsCanonicalizing(
            [$actor->id],
            $events->pluck('actor_user_id')->unique()->all(),
        );
    }

    public function test_unapproved_return_cancel_reopen_and_invalid_transitions_fail_without_side_effects(): void
    {
        [$actor] = $this->staff('invalid');
        $task = $this->service()->createIndividual($actor, 'Guarded task');
        foreach (['complete', 'return', 'cancel', 'reopen', 'assign', 'unknown'] as $action) {
            try {
                $this->service()->transitionIndividual($actor, $task->id, $action);
                $this->fail('Unexpected action: '.$action);
            } catch (ValidationException $e) {
                $this->assertArrayHasKey('state', $e->errors());
            }
        }

        $this->assertSame('open', $task->fresh()->state);
        $this->assertSame(1, $task->events()->count());
        $this->service()->transitionIndividual($actor, $task->id, 'start');
        $this->service()->transitionIndividual($actor, $task->id, 'complete');

        try {
            $this->service()->transitionIndividual($actor, $task->id, 'start');
            $this->fail('Completed Task was reopened');
        } catch (ValidationException $e) {
            $this->assertSame('completed', $task->fresh()->state);
            $this->assertSame(3, $task->events()->count());
        }
    }

    public function test_unrelated_user_and_executive_role_cannot_view_or_transition_another_task(): void
    {
        [$owner] = $this->staff('owner');
        [$stranger] = $this->staff('stranger');
        $stranger->forceFill(['role' => 'mayor'])->save();
        $this->actingAs($owner);
        $task = $this->service()->createIndividual($owner, 'Only owner sees this');
        $this->actingAs($stranger);

        // The claimed actor must match the authenticated principal.
        $this->assertDenied(fn () => $this->service()->visibleIndividualTasks($owner)->get());
        $this->assertCount(0, $this->service()->visibleIndividualTasks($stranger)->get());

        try {
            $this->service()->findVisibleIndividual($stranger, $task->id);
            $this->fail('Unrelated actor read a Task');
        } catch (ModelNotFoundException $e) {
            $this->assertSame('open', $task->fresh()->state);
        }

        try {
            $this->service()->transitionIndividual($stranger, $task->id, 'start');
            $this->fail('Unrelated actor mutated a Task');
        } catch (AuthorizationException $e) {
            $this->assertSame('open', $task->fresh()->state);
            $this->assertSame(1, $task->events()->count());
        }
    }

    public function test_inactive_users_unlinked_employees_and_inactive_departments_are_denied(): void
    {
        [$owner, $office] = $this->staff('active');
        $task = $this->service()->createIndividual($owner, 'Identity checks');

        $owner->forceFill(['is_active' => false])->save();
        $this->assertDenied(fn () => $this->service()->transitionIndividual($owner, $task->id, 'start'));
        $this->assertDenied(fn () => $this->service()->visibleIndividualTasks($owner)->count());
        $this->assertDenied(fn () => $this->service()->createIndividual($owner, 'Not allowed'));

        $owner->forceFill(['is_active' => true])->save();
        $owner->employee()->update(['employment_status' => 'separated']);
        $this->assertDenied(fn () => $this->service()->transitionIndividual($owner, $task->id, 'start'));
        $owner->employee()->update(['employment_status' => 'active']);

        $office->update(['is_active' => false]);
        $this->assertDenied(fn () => $this->service()->createIndividual($owner, 'Office inactive'));

        $orphan = User::query()->create([
            'name' => 'Unlinked',
            'email' => 'unlinked@w02.test',
            'password' => 'safe-for-tests',
            'is_active' => true,
        ]);
        $this->actingAs($orphan);
        $this->assertDenied(fn () => $this->service()->createIndividual($orphan, 'No employment'));
        $this->assertSame('open', $task->fresh()->state);
        $this->assertSame(1, $task->events()->count());
    }

    public function test_official_assigned_and_legacy_task_records_remain_inaccessible_to_core(): void
    {
        [$actor, $office] = $this->staff('legacy');
        $official = Task::query()->create([
            'title' => 'No issued authority',
            'state' => 'open',
            'created_by_user_id' => $actor->id,
        ]);
        $official->forceFill(['task_kind' => 'official', 'owning_department_id' => $office->id])->save();

        $legacy = Task::query()->create([
            'title' => 'Legacy caller state',
            'state' => 'caller-defined',
            'created_by_user_id' => $actor->id,
        ]);
        $assigned = Task::query()->create([
            'title' => 'Assigned externally',
            'state' => 'open',
            'created_by_user_id' => $actor->id,
            'assigned_to_user_id' => $actor->id,
        ]);
        $assigned->forceFill(['task_kind' => 'individual', 'owning_department_id' => $office->id])->save();

        $this->assertSame(0, $this->service()->visibleIndividualTasks($actor)->count());
        foreach ([$official, $legacy, $assigned] as $task) {
            $this->assertDenied(fn () => $this->service()->transitionIndividual($actor, $task->id, 'start'));
            $this->assertSame(0, $task->events()->count());
        }
    }

    public function test_transition_rechecks_fresh_state_instead_of_trusting_stale_snapshot(): void
    {
        [$owner] = $this->staff('stale');
        $task = $this->service()->createIndividual($owner, 'Concurrent guard');
        $stale = $task->replicate();
        $this->assertSame('open', $stale->state);

        $this->service()->transitionIndividual($owner, $task->id, 'start');
        try {
            $this->service()->transitionIndividual($owner, $task->id, 'start');
            $this->fail('Stale start unexpectedly succeeded');
        } catch (ValidationException $e) {
            $this->assertSame('in_progress', $task->fresh()->state);
            $this->assertSame(2, $task->events()->count());
        }
    }

    public function test_event_creation_failure_rolls_back_task_and_state_changes(): void
    {
        [$owner] = $this->staff('atomic');
        $task = $this->service()->createIndividual($owner, 'Rollback task');
        $initialEvents = TaskEvent::query()->count();

        TaskEvent::creating(static function (): void {
            throw new RuntimeException('Simulated event persistence failure.');
        });

        try {
            try {
                $this->service()->transitionIndividual($owner, $task->id, 'start');
                $this->fail('Task committed without its event');
            } catch (RuntimeException $e) {
                $this->assertSame('Simulated event persistence failure.', $e->getMessage());
            }
        } finally {
            TaskEvent::flushEventListeners();
        }

        $this->assertSame('open', $task->fresh()->state);
        $this->assertNull($task->fresh()->completed_at);
        $this->assertSame($initialEvents, TaskEvent::query()->count());
    }

    public function test_source_reference_is_passive_and_never_mutates_work_request(): void
    {
        [$owner, $office] = $this->staff('source');
        $request = WorkflowTransaction::query()->create([
            'title' => 'Existing request',
            'status' => 'submitted',
            'origin_department_id' => $office->id,
            'current_department_id' => $office->id,
            'created_by_user_id' => $owner->id,
        ]);
        $snapshot = DB::table('transactions')->where('id', $request->id)->first();
        $before = DB::table('transaction_events')->count();

        $task = $this->service()->createIndividual($owner, 'Unrelated individual task');
        // Core service never accepts source-link mutation input. W01 may carry
        // reference-only source metadata on older Task records.
        $this->service()->transitionIndividual($owner, $task->id, 'start');
        $this->service()->transitionIndividual($owner, $task->id, 'complete');

        $this->assertEquals($snapshot, DB::table('transactions')->where('id', $request->id)->first());
        $this->assertSame($before, DB::table('transaction_events')->count());
        $this->assertSame(0, DB::table('correspondence_events')->count());
    }

    public function test_title_validation_rejects_missing_or_oversized_input_before_any_write(): void
    {
        [$owner] = $this->staff('title');
        foreach (['  ', str_repeat('A', 256)] as $title) {
            try {
                $this->service()->createIndividual($owner, $title);
                $this->fail('Invalid title was accepted');
            } catch (ValidationException $e) {
                $this->assertArrayHasKey('title', $e->errors());
            }
        }
        $this->assertSame(0, Task::query()->count());
        $this->assertSame(0, TaskEvent::query()->count());
    }

    public function test_claimed_actor_cannot_spoof_authenticated_session_or_anonymous_context(): void
    {
        [$owner] = $this->staff('claimed-owner');
        $task = $this->service()->createIndividual($owner, 'No actor spoofing');
        [$stranger] = $this->staff('claimed-stranger');

        $this->assertDenied(fn () => $this->service()->createIndividual($owner, 'Forged actor'));
        $this->assertDenied(fn () => $this->service()->transitionIndividual($owner, $task->id, 'start'));

        $this->actingAs($owner);
        $this->assertCount(1, $this->service()->visibleIndividualTasks($owner)->get());
        $this->assertDenied(fn () => $this->service()->createIndividual($stranger, 'Spoof another actor'));

        auth()->logout();
        $this->assertDenied(fn () => $this->service()->createIndividual($owner, 'No session'));
        $this->assertSame('open', $task->fresh()->state);
        $this->assertSame(1, $task->events()->count());
    }

    private function assertDenied(callable $operation): void
    {
        try {
            $operation();
            $this->fail('Unauthorized Task operation succeeded');
        } catch (AuthorizationException $e) {
            $this->assertNotSame('', $e->getMessage());
        }
    }

    /** @return array{User, Department} */
    private function staff(string $slug): array
    {
        $user = User::query()->create([
            'name' => 'W02 '.$slug,
            'email' => $slug.'@w02.test',
            'password' => 'safe-for-tests',
            'is_active' => true,
        ]);
        $department = Department::query()->create([
            'code' => strtoupper(substr($slug, 0, 20)),
            'name' => 'W02 '.$slug.' Office',
            'is_active' => true,
        ]);
        Employee::query()->create([
            'employee_number' => 'W02-'.$slug,
            'full_name' => 'W02 '.$slug,
            'user_id' => $user->id,
            'department_id' => $department->id,
            'position_title' => 'Staff',
            'employment_status' => 'active',
        ]);

        $this->actingAs($user);
        return [$user, $department];
    }
}
