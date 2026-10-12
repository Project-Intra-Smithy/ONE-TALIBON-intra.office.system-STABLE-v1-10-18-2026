<?php

namespace Tests\Feature\CommonWork;

use App\Models\Department;
use App\Models\Employee;
use App\Models\Task;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\CommonWork\CommonWorkItem;
use App\Services\CommonWork\UnifiedMyWorkQuery;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Tests\TestCase;

final class UnifiedMyWorkQueryTest extends TestCase
{
    use RefreshDatabase;

    public function test_sources_keep_distinct_ids_states_and_responsibilities(): void
    {
        $office = $this->office();
        $actor = $this->person($office);
        $this->actingAs($actor);
        $task = $this->task($actor, 'Personal task', 'in_progress');
        // PostgreSQL sequences do not roll back with per-test transactions.
        // Construct the collision explicitly so this test is order-independent.
        $request = $this->request($actor, $office, $office, 'My request', 'for_review', id: $task->id);
        $this->assertSame($task->id, $request->id, 'Fixtures must exercise cross-domain numeric ID collision.');

        $items = $this->unifiedMyWorkQuery()->paginate($actor)->getCollection()->map->jsonSerialize()->keyBy('key');
        $this->assertCount(2, $items);
        $this->assertSame('in_progress', $items['individual_task:'.$task->id]['source_state']);
        $this->assertSame('task_owner', $items['individual_task:'.$task->id]['responsibility']);
        $this->assertSame('individual', $items['individual_task:'.$task->id]['source_kind']);
        $this->assertSame('for_review', $items['work_request:'.$request->id]['source_state']);
        $this->assertSame('request_creator', $items['work_request:'.$request->id]['responsibility']);
        $this->assertSame('internal_request', $items['work_request:'.$request->id]['source_kind']);
        $this->assertFalse($items['work_request:'.$request->id]['is_terminal']);
    }

    public function test_same_office_and_executive_visibility_never_grant_another_persons_task(): void
    {
        $office = $this->office();
        $owner = $this->person($office);
        $head = $this->person($office, 'department_head');
        $mayor = $this->person($this->office(), 'mayor_approver');
        $admin = $this->person($this->office(), 'system_admin');
        $task = $this->task($owner, 'Other person private task');
        $official = $this->task($owner, 'Unreleased official', kind: 'official');
        $delegated = $this->task($owner, 'Unreleased assigned', assignee: $head);
        foreach ([$head, $mayor, $admin] as $viewer) {
            $this->actingAs($viewer);
            $this->assertSame([], $this->unifiedMyWorkQuery()->paginate($viewer)->getCollection()->all());
        }
        $this->actingAs($owner);
        $keys = $this->keys($owner);
        $this->assertSame(['individual_task:'.$task->id], $keys);
        $this->assertNotContains('individual_task:'.$official->id, $keys);
        $this->assertNotContains('individual_task:'.$delegated->id, $keys);
    }

    public function test_work_requests_preserve_source_visibility_and_personal_responsibility(): void
    {
        $a = $this->office();
        $b = $this->office();
        $c = $this->office();
        $actor = $this->person($a);
        $sameOffice = $this->person($a);
        $elsewhere = $this->person($b);
        $this->actingAs($actor);

        $sent = $this->request($actor, $a, $b, 'Origin request at another office');
        $assigned = $this->request($elsewhere, $b, $a, 'Assigned here', assignee: $actor->employee);
        $officeOnly = $this->request($sameOffice, $a, $a, 'Visible in office queue but not personal');
        $unrelated = $this->request($elsewhere, $b, $c, 'Not in my visibility');
        $keys = $this->keys($actor);
        $this->assertContains('work_request:'.$sent->id, $keys);
        $this->assertContains('work_request:'.$assigned->id, $keys);
        $this->assertNotContains('work_request:'.$officeOnly->id, $keys);
        $this->assertNotContains('work_request:'.$unrelated->id, $keys);
        $rows = $this->unifiedMyWorkQuery()->paginate($actor)->getCollection()->map->jsonSerialize()->keyBy('key');
        $this->assertSame('request_assignee', $rows['work_request:'.$assigned->id]['responsibility']);

        // Executive global Work Request access must not expand a personal feed.
        $executive = $this->person($c, 'mayor_approver');
        $this->actingAs($executive);
        $this->assertSame([], $this->keys($executive));
    }

    public function test_guest_spoof_stale_account_and_inactive_employment_fail_closed(): void
    {
        $office = $this->office();
        $actor = $this->person($office);
        $stranger = $this->person($office);
        $this->task($actor, 'Private');
        $this->request($actor, $office, $office, 'Request');
        $this->expectDenied(fn () => $this->unifiedMyWorkQuery()->paginate($actor));
        $this->actingAs($stranger);
        $this->expectDenied(fn () => $this->unifiedMyWorkQuery()->paginate($actor));
        $this->actingAs($actor);
        $actor->forceFill(['is_active' => false])->save();
        $this->expectDenied(fn () => $this->unifiedMyWorkQuery()->paginate($actor));
        $actor->forceFill(['is_active' => true])->save();
        $actor->employee()->update(['employment_status' => 'separated']);
        $this->expectDenied(fn () => $this->unifiedMyWorkQuery()->paginate($actor));
    }

    public function test_state_labels_stay_native_and_read_does_not_write_events(): void
    {
        $office = $this->office();
        $actor = $this->person($office);
        $this->actingAs($actor);
        $task = $this->task($actor, 'Done task', 'completed');
        $request = $this->request($actor, $office, $office, 'Approved request', 'approved');
        $before = [DB::table('tasks')->count(), DB::table('transactions')->count(), DB::table('task_events')->count(), DB::table('transaction_events')->count()];
        $items = $this->unifiedMyWorkQuery()->paginate($actor)->getCollection()->map->jsonSerialize()->keyBy('key');
        $this->assertSame('completed', $items['individual_task:'.$task->id]['source_state']);
        $this->assertTrue($items['individual_task:'.$task->id]['is_terminal']);
        $this->assertSame('approved', $items['work_request:'.$request->id]['source_state']);
        $this->assertTrue($items['work_request:'.$request->id]['is_terminal']);
        $this->assertSame($before, [DB::table('tasks')->count(), DB::table('transactions')->count(), DB::table('task_events')->count(), DB::table('transaction_events')->count()]);
    }

    public function test_paginated_union_is_bounded_deterministic_and_has_no_duplicate_keys(): void
    {
        $office = $this->office();
        $actor = $this->person($office);
        $this->actingAs($actor);
        foreach (range(1, 55) as $i) {
            $this->task($actor, 'Task '.$i);
        }
        foreach (range(1, 9) as $i) {
            $this->request($actor, $office, $office, 'Request '.$i);
        }
        // Equal updated_at values demand a source-qualified tie-breaker.
        DB::table('tasks')->update(['updated_at' => '2026-10-11 10:00:00+00']);
        DB::table('transactions')->update(['updated_at' => '2026-10-11 10:00:00+00']);

        $first = $this->unifiedMyWorkQuery()->paginate($actor, 1, 20);
        $second = $this->unifiedMyWorkQuery()->paginate($actor, 2, 20);
        $third = $this->unifiedMyWorkQuery()->paginate($actor, 3, 20);
        $fourth = $this->unifiedMyWorkQuery()->paginate($actor, 4, 20);
        $keys = collect([$first, $second, $third, $fourth])
            ->flatMap(fn ($page) => $page->getCollection()->map(fn (CommonWorkItem $item) => $item->jsonSerialize()['key']))
            ->all();
        $this->assertSame(64, $first->total());
        $this->assertCount(64, $keys);
        $this->assertCount(64, array_unique($keys));
        $this->assertSame($keys, collect(range(1, 4))->flatMap(fn (int $page) => $this->keys($actor, $page))->all());
        $this->assertSame(20, $first->perPage());
        foreach ([[0, 20], [1, 0], [1, 51], [10001, 20]] as [$page, $limit]) {
            try {
                $this->unifiedMyWorkQuery()->paginate($actor, $page, $limit);
                $this->fail('Unbounded pagination accepted.');
            } catch (InvalidArgumentException) {
                $this->assertTrue(true);
            }
        }
        DB::flushQueryLog();
        DB::enableQueryLog();
        $this->unifiedMyWorkQuery()->paginate($actor);
        $queries = DB::getQueryLog();
        DB::disableQueryLog();
        DB::flushQueryLog();
        $this->assertLessThanOrEqual(12, count($queries));
        $this->assertCount(2, collect($queries)->filter(fn (array $query) => str_contains(strtolower($query['query']), 'union all')));
    }

    private function unifiedMyWorkQuery(): UnifiedMyWorkQuery
    {
        return app(UnifiedMyWorkQuery::class);
    }

    /** @return list<string> */
    private function keys(User $actor, int $page = 1): array
    {
        return $this->unifiedMyWorkQuery()->paginate($actor, $page)->getCollection()
            ->map(fn (CommonWorkItem $item): string => $item->jsonSerialize()['key'])->all();
    }

    private function expectDenied(callable $operation): void
    {
        try {
            $operation();
            $this->fail('An unauthorized caller received the projection.');
        } catch (AuthorizationException) {
            $this->assertTrue(true);
        }
    }

    private function office(): Department
    {
        return Department::query()->create([
            'code' => 'A02-'.Str::upper(Str::random(9)),
            'name' => 'A02 Test Office',
            'is_active' => true,
        ]);
    }

    private function person(Department $office, string $role = 'department_staff'): User
    {
        $user = User::query()->create([
            'name' => 'A02 Staff',
            'email' => Str::lower(Str::random(15)).'@a02.test',
            'password' => 'test-password',
            'role' => $role,
            'is_active' => true,
        ]);
        Employee::query()->create([
            'employee_number' => 'A02-'.Str::upper(Str::random(12)),
            'full_name' => 'A02 Staff',
            'user_id' => $user->id,
            'department_id' => $office->id,
            'position_title' => 'Tester',
            'employment_status' => 'active',
        ]);

        return $user->fresh('employee.department');
    }

    private function task(User $owner, string $title, string $state = 'open', string $kind = 'individual', ?User $assignee = null): Task
    {
        $task = Task::query()->create([
            'title' => $title,
            'state' => $state,
            'created_by_user_id' => $owner->id,
            'assigned_to_user_id' => $assignee?->id,
        ]);
        $task->forceFill(['task_kind' => $kind, 'owning_department_id' => $owner->employee->department_id])->save();

        return $task;
    }

    private function request(User $creator, Department $origin, Department $current, string $title, string $state = 'submitted', ?Employee $assignee = null, ?int $id = null): WorkflowTransaction
    {
        $request = new WorkflowTransaction([
            'reference_no' => 'A02-'.Str::upper(Str::random(12)),
            'transaction_type' => 'internal_request',
            'title' => $title,
            'priority' => 'normal',
            'origin_department_id' => $origin->id,
            'current_department_id' => $current->id,
            'created_by_user_id' => $creator->id,
            'assigned_employee_id' => $assignee?->id,
            'status' => $state,
        ]);
        if ($id !== null) {
            $request->forceFill(['id' => $id]);
        }
        $request->save();

        return $request;
    }
}
