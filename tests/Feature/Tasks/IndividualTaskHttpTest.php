<?php

namespace Tests\Feature\Tasks;

use App\Models\Department;
use App\Models\Employee;
use App\Models\Task;
use App\Models\TaskEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

final class IndividualTaskHttpTest extends TestCase
{
    use RefreshDatabase;

    public function test_anonymous_requests_are_not_authorized_to_read_or_mutate_tasks(): void
    {
        $this->getJson('/tasks')->assertUnauthorized();
        $this->getJson('/tasks/1')->assertUnauthorized();
        $this->postJson('/tasks', ['title' => 'Anonymous'])->assertUnauthorized();
        $this->postJson('/tasks/1/start')->assertUnauthorized();
        $this->postJson('/tasks/1/complete')->assertUnauthorized();
    }

    public function test_authenticated_personal_task_create_start_complete_and_event_history(): void
    {
        [$actor, $office] = $this->staff('flow');
        $this->actingAs($actor);

        $created = $this->postJson('/tasks', [
            'title' => '  Office checklist  ',
            'instructions' => 'Private checklist',
            'due_at' => '2026-11-17T15:30:00+08:00',
        ])->assertCreated()
            ->assertJsonPath('data.title', 'Office checklist')
            ->assertJsonPath('data.kind', 'individual')
            ->assertJsonPath('data.state', 'open')
            ->assertJsonPath('data.owning_department_id', $office->id);

        $id = $created->json('data.id');
        $this->assertSame($actor->id, Task::query()->findOrFail($id)->created_by_user_id);
        $this->assertNull(Task::query()->findOrFail($id)->assigned_to_user_id);
        $this->assertNotNull(Task::query()->findOrFail($id)->due_at);
        $this->getJson('/tasks/'.$id)->assertOk()->assertJsonPath('data.id', $id);

        $this->postJson('/tasks/'.$id.'/start')->assertOk()->assertJsonPath('data.state', 'in_progress');
        $this->postJson('/tasks/'.$id.'/complete')->assertOk()->assertJsonPath('data.state', 'completed');
        $this->assertNotNull(Task::query()->findOrFail($id)->completed_at);

        $events = TaskEvent::query()->where('task_id', $id)->orderBy('id')->get();
        $this->assertSame(['created', 'start', 'complete'], $events->pluck('action')->all());
        $this->assertSame([$actor->id], $events->pluck('actor_user_id')->unique()->values()->all());
        $this->assertSame(0, DB::table('transaction_events')->count());
        $this->assertSame(0, DB::table('correspondence_events')->count());
    }

    public function test_create_rejects_spoofed_creator_state_office_and_other_internal_fields(): void
    {
        [$actor] = $this->staff('spoof');
        $this->actingAs($actor);

        foreach ([
            ['created_by_user_id' => 999],
            ['state' => 'completed'],
            ['completed_at' => '2026-11-17T15:30:00+08:00'],
            ['task_kind' => 'official'],
            ['assigned_to_user_id' => $actor->id],
            ['owning_department_id' => 999],
            ['source_domain' => 'work_request'],
            ['source_id' => 999],
            ['role' => 'mayor'],
        ] as $injection) {
            $this->postJson('/tasks', ['title' => 'Forged', ...$injection])
                ->assertUnprocessable()
                ->assertJsonValidationErrors('request');
        }

        $this->assertSame(0, Task::query()->count());
        $this->assertSame(0, TaskEvent::query()->count());
    }

    public function test_transitions_reject_client_state_actor_and_timestamp_even_for_task_owner(): void
    {
        [$actor] = $this->staff('transition');
        $this->actingAs($actor);
        $id = $this->postJson('/tasks', ['title' => 'Stable'])->assertCreated()->json('data.id');

        foreach ([
            ['state' => 'completed'],
            ['actor_user_id' => 444],
            ['completed_at' => '2026-11-17T15:30:00+08:00'],
            ['action' => 'cancel'],
        ] as $injection) {
            $this->postJson('/tasks/'.$id.'/start', $injection)
                ->assertUnprocessable()->assertJsonValidationErrors('request');
        }

        $this->postJson('/tasks/'.$id.'/complete')->assertUnprocessable()->assertJsonValidationErrors('state');
        $this->assertSame('open', Task::query()->findOrFail($id)->state);
        $this->assertSame(1, TaskEvent::query()->where('task_id', $id)->count());
    }

    public function test_unrelated_mayor_role_cannot_enumerate_show_or_transition_personal_tasks(): void
    {
        [$owner] = $this->staff('owner');
        $this->actingAs($owner);
        $id = $this->postJson('/tasks', ['title' => 'Private'])->assertCreated()->json('data.id');

        [$stranger] = $this->staff('stranger');
        // TestCase::actingAs fulfills MFA for privileged test users. Exercise
        // the *real* configured role; it grants no cross-person Task rights.
        $stranger->forceFill(['role' => 'mayor_approver'])->save();
        $this->actingAs($stranger);

        $this->getJson('/tasks')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/tasks/'.$id)->assertNotFound();
        $this->postJson('/tasks/'.$id.'/start')->assertNotFound();
        $this->assertSame(1, TaskEvent::query()->where('task_id', $id)->count());
        $this->assertSame('open', Task::query()->findOrFail($id)->state);
    }

    public function test_legacy_official_and_assigned_records_are_not_exposed_or_mutated(): void
    {
        [$actor, $office] = $this->staff('legacy');
        $this->actingAs($actor);

        $official = Task::query()->create(['title' => 'Official', 'state' => 'open', 'created_by_user_id' => $actor->id]);
        $official->forceFill(['task_kind' => 'official', 'owning_department_id' => $office->id])->save();
        $legacy = Task::query()->create(['title' => 'Old', 'state' => 'old_custom', 'created_by_user_id' => $actor->id]);
        $assigned = Task::query()->create([
            'title' => 'Assigned',
            'state' => 'open',
            'created_by_user_id' => $actor->id,
            'assigned_to_user_id' => $actor->id,
        ]);
        $assigned->forceFill(['task_kind' => 'individual'])->save();

        $this->getJson('/tasks')->assertOk()->assertJsonCount(0, 'data');
        foreach ([$official, $legacy, $assigned] as $task) {
            $this->getJson('/tasks/'.$task->id)->assertNotFound();
            $this->postJson('/tasks/'.$task->id.'/start')->assertForbidden();
        }
        $this->assertSame(0, TaskEvent::query()->count());
    }

    public function test_filters_pagination_and_strict_query_validation(): void
    {
        [$actor] = $this->staff('pages');
        $this->actingAs($actor);
        $id1 = $this->postJson('/tasks', ['title' => 'First'])->assertCreated()->json('data.id');
        $id2 = $this->postJson('/tasks', ['title' => 'Second'])->assertCreated()->json('data.id');
        $this->postJson('/tasks/'.$id1.'/start')->assertOk();

        $this->getJson('/tasks?per_page=1&page=1')
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $id2)
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.per_page', 1);
        $this->getJson('/tasks?per_page=1&page=2')
            ->assertOk()->assertJsonPath('data.0.id', $id1);
        $this->getJson('/tasks?state=in_progress')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $id1);

        $this->getJson('/tasks?state=official')->assertUnprocessable()->assertJsonValidationErrors('state');
        $this->getJson('/tasks?per_page=999')->assertUnprocessable()->assertJsonValidationErrors('per_page');
        $this->getJson('/tasks?created_by_user_id=1')->assertUnprocessable()->assertJsonValidationErrors('request');
        $this->getJson('/tasks/'.$id1.'?include=all')->assertUnprocessable()->assertJsonValidationErrors('request');
    }

    public function test_invalid_title_dates_and_instruction_limits_are_rejected_without_writes(): void
    {
        [$actor] = $this->staff('validation');
        $this->actingAs($actor);

        $this->postJson('/tasks', ['title' => ' '])->assertUnprocessable()->assertJsonValidationErrors('title');
        $this->postJson('/tasks', ['title' => str_repeat('a', 256)])->assertUnprocessable()->assertJsonValidationErrors('title');
        $this->postJson('/tasks', ['title' => 'Example', 'due_at' => 'tomorrow'])->assertUnprocessable()->assertJsonValidationErrors('due_at');
        $this->postJson('/tasks', ['title' => 'Example', 'instructions' => str_repeat('a', 10001)])
            ->assertUnprocessable()->assertJsonValidationErrors('instructions');
        $this->assertSame(0, Task::query()->count());
    }

    public function test_inactive_or_unlinked_employees_cannot_use_task_http_surface(): void
    {
        [$actor, $office] = $this->staff('inactive');
        $this->actingAs($actor);
        $id = $this->postJson('/tasks', ['title' => 'Saved'])->assertCreated()->json('data.id');

        $actor->employee()->update(['employment_status' => 'separated']);
        $this->getJson('/tasks')->assertForbidden();
        $this->postJson('/tasks/'.$id.'/start')->assertForbidden();
        $this->postJson('/tasks', ['title' => 'No'])->assertForbidden();

        $actor->employee()->update(['employment_status' => 'active']);
        $office->update(['is_active' => false]);
        $this->getJson('/tasks')->assertForbidden();
        $office->update(['is_active' => true]);

        $orphan = User::query()->create([
            'name' => 'Unlinked Staff',
            'email' => 'unlinked-w03@example.test',
            'password' => 'testing-only',
            'is_active' => true,
        ]);
        $this->actingAs($orphan);
        $this->getJson('/tasks')->assertForbidden();
    }

    public function test_personal_tasks_follow_creator_when_employee_changes_department(): void
    {
        [$actor, $original] = $this->staff('transfer');
        $this->actingAs($actor);
        $id = $this->postJson('/tasks', ['title' => 'Personal'])->assertCreated()->json('data.id');

        $replacement = Department::query()->create([
            'code' => 'W03-NEW',
            'name' => 'New Employee Office',
            'is_active' => true,
        ]);
        $actor->employee()->update(['department_id' => $replacement->id]);

        $this->getJson('/tasks/'.$id)->assertOk()
            ->assertJsonPath('data.owning_department_id', $original->id);
        $this->postJson('/tasks/'.$id.'/start')->assertOk()->assertJsonPath('data.state', 'in_progress');
        $this->assertSame($original->id, Task::query()->findOrFail($id)->owning_department_id);
    }

    public function test_mfa_required_role_is_not_allowed_to_bypass_assurance(): void
    {
        [$actor] = $this->staff('mfa');
        $actor->forceFill(['role' => 'department_head'])->save();
        // Tests\\TestCase::actingAs() deliberately auto-satisfies privileged MFA.
        // Use the guard directly for a password-authenticated, MFA-pending session.
        auth()->guard('web')->login($actor);
        $this->getJson('/tasks')->assertRedirect(route('mfa.enroll'));
        $this->postJson('/tasks', ['title' => 'No MFA'])->assertRedirect(route('mfa.enroll'));
        $this->assertSame(0, Task::query()->count());
    }

    public function test_no_unreleased_mutation_routes_exist(): void
    {
        [$actor] = $this->staff('noextra');
        $this->actingAs($actor);
        $id = $this->postJson('/tasks', ['title' => 'Allowed'])->assertCreated()->json('data.id');
        $this->putJson('/tasks/'.$id, ['state' => 'completed'])->assertStatus(405);
        $this->postJson('/tasks/'.$id.'/cancel')->assertNotFound();
        $this->postJson('/tasks/'.$id.'/reopen')->assertNotFound();
        $this->assertSame('open', Task::query()->findOrFail($id)->state);
    }

    /** @return array{User, Department} */
    private function staff(string $slug): array
    {
        $actor = User::query()->create([
            'name' => 'W03 '.$slug,
            'email' => 'w03-'.$slug.'@example.test',
            'password' => 'test-password',
            'is_active' => true,
        ]);
        $office = Department::query()->create([
            'code' => 'W03-'.strtoupper(substr($slug, 0, 20)),
            'name' => 'W03 '.$slug.' Office',
            'is_active' => true,
        ]);
        Employee::query()->create([
            'employee_number' => 'W03-'.$slug,
            'full_name' => 'W03 '.$slug,
            'user_id' => $actor->id,
            'department_id' => $office->id,
            'position_title' => 'Staff',
            'employment_status' => 'active',
        ]);

        return [$actor, $office];
    }
}
