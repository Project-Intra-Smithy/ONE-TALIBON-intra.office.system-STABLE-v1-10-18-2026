<?php

namespace Tests\Feature\Tasks;

use App\Models\Department;
use App\Models\Task;
use App\Models\User;
use App\Models\WorkflowTransaction;
use Carbon\CarbonInterface;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class TaskDomainFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_migration_defines_expected_columns_nullability_and_timezone_types(): void
    {
        $this->assertTrue(Schema::hasTable('tasks'));
        $this->assertEqualsCanonicalizing([
            'id', 'title', 'instructions', 'state', 'created_by_user_id',
            'assigned_to_user_id', 'source_domain', 'source_type', 'source_id',
            'due_at', 'completed_at', 'created_at', 'updated_at',
        ], Schema::getColumnListing('tasks'));

        $columns = collect(DB::select(<<<'SQL'
            SELECT column_name, is_nullable, column_default, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_schema = current_schema() AND table_name = 'tasks'
            SQL))->keyBy('column_name');

        foreach (['id', 'title', 'state', 'created_by_user_id'] as $required) {
            $this->assertSame('NO', $columns[$required]->is_nullable, $required);
        }

        foreach (['instructions', 'assigned_to_user_id', 'source_domain', 'source_type', 'source_id', 'due_at', 'completed_at'] as $optional) {
            $this->assertSame('YES', $columns[$optional]->is_nullable, $optional);
        }

        $this->assertNull($columns['state']->column_default);
        $this->assertSame(64, (int) $columns['state']->character_maximum_length);
        $this->assertSame(64, (int) $columns['source_domain']->character_maximum_length);
        $this->assertSame(160, (int) $columns['source_type']->character_maximum_length);
        $this->assertSame('bigint', $columns['source_id']->data_type);

        foreach (['due_at', 'completed_at', 'created_at', 'updated_at'] as $column) {
            $this->assertSame('timestamp with time zone', $columns[$column]->data_type, $column);
        }
    }

    public function test_required_indexes_and_foreign_key_deletion_rules_exist(): void
    {
        $indexes = collect(DB::select(<<<'SQL'
            SELECT indexdef FROM pg_indexes
            WHERE schemaname = current_schema() AND tablename = 'tasks'
            SQL))->pluck('indexdef')->implode("\n");

        foreach (['(state)', '(due_at)', '(completed_at)', '(assigned_to_user_id, state)', '(source_domain, source_id)'] as $columns) {
            $this->assertStringContainsString($columns, $indexes);
        }

        $foreignKeys = collect(DB::select(<<<'SQL'
            SELECT c.conname, c.confdeltype, pg_get_constraintdef(c.oid) AS definition
            FROM pg_constraint c
            JOIN pg_class t ON t.oid = c.conrelid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            WHERE n.nspname = current_schema() AND t.relname = 'tasks' AND c.contype = 'f'
            SQL))->keyBy('conname');

        $this->assertCount(2, $foreignKeys);
        $this->assertSame('r', $foreignKeys['tasks_created_by_user_id_foreign']->confdeltype);
        $this->assertSame('n', $foreignKeys['tasks_assigned_to_user_id_foreign']->confdeltype);
        $this->assertStringContainsString('REFERENCES users(id)', $foreignKeys['tasks_created_by_user_id_foreign']->definition);
        $this->assertStringContainsString('REFERENCES users(id)', $foreignKeys['tasks_assigned_to_user_id_foreign']->definition);
    }

    public function test_task_persists_without_source_or_assignee_and_resolves_creator(): void
    {
        $creator = $this->user('creator');
        $task = Task::query()->create([
            'title' => 'Independent task',
            'state' => 'recorded',
            'created_by_user_id' => $creator->id,
        ]);

        $this->assertNotNull($task->id);
        $this->assertSame('Independent task', $task->fresh()->title);
        $this->assertSame('recorded', $task->fresh()->state);
        $this->assertNull($task->assigned_to_user_id);
        $this->assertNull($task->source_id);
        $this->assertNull($task->instructions);
        $this->assertTrue($task->creator->is($creator));
        $this->assertNull($task->assignee);
        $this->assertInstanceOf(CarbonInterface::class, $task->created_at);
        $this->assertInstanceOf(CarbonInterface::class, $task->updated_at);
        $this->assertSame(0, WorkflowTransaction::query()->count());
    }

    public function test_assignee_and_nullable_fields_and_timestamps_round_trip(): void
    {
        $creator = $this->user('task-creator');
        $assignee = $this->user('task-assignee');
        $dueAt = now()->addHours(8)->startOfSecond();
        $completedAt = now()->addHours(2)->startOfSecond();

        $task = Task::query()->create([
            'title' => 'Assigned task',
            'instructions' => 'Only a bounded persistence record.',
            'state' => 'provided_by_caller',
            'created_by_user_id' => $creator->id,
            'assigned_to_user_id' => $assignee->id,
            'due_at' => $dueAt,
            'completed_at' => $completedAt,
        ])->fresh();

        $this->assertTrue($task->creator->is($creator));
        $this->assertTrue($task->assignee->is($assignee));
        $this->assertSame('Only a bounded persistence record.', $task->instructions);
        $this->assertInstanceOf(CarbonInterface::class, $task->due_at);
        $this->assertInstanceOf(CarbonInterface::class, $task->completed_at);
        $this->assertSame($dueAt->getTimestamp(), $task->due_at->getTimestamp());
        $this->assertSame($completedAt->getTimestamp(), $task->completed_at->getTimestamp());
        $this->assertInstanceOf(CarbonInterface::class, $task->created_at);
        $this->assertInstanceOf(CarbonInterface::class, $task->updated_at);
    }

    public function test_optional_source_reference_has_no_foreign_key_or_lifecycle_owner(): void
    {
        $creator = $this->user('source-creator');
        $task = Task::query()->create([
            'title' => 'External reference without source record',
            'state' => 'supplied',
            'created_by_user_id' => $creator->id,
            'source_domain' => 'external_example',
            'source_type' => 'reference',
            'source_id' => 987654321,
        ])->fresh();

        $this->assertSame('external_example', $task->source_domain);
        $this->assertSame('reference', $task->source_type);
        $this->assertSame(987654321, (int) $task->source_id);
        $this->assertSame(0, DB::table('transactions')->count());
        $this->assertSame(0, DB::table('correspondence_records')->count());
    }

    public function test_task_creation_and_updates_never_change_existing_work_request(): void
    {
        $creator = $this->user('work-request-creator');
        $office = Department::query()->create(['code' => 'W01', 'name' => 'W01 Test Office']);
        $request = WorkflowTransaction::query()->create([
            'title' => 'Existing Work Request',
            'status' => 'submitted',
            'origin_department_id' => $office->id,
            'current_department_id' => $office->id,
            'created_by_user_id' => $creator->id,
        ]);

        $requestBefore = DB::table('transactions')->where('id', $request->id)->first();
        $eventCount = DB::table('transaction_events')->count();
        $task = Task::query()->create([
            'title' => 'Reference only',
            'state' => 'caller_label',
            'created_by_user_id' => $creator->id,
            'source_domain' => 'work_request',
            'source_type' => 'transaction',
            'source_id' => $request->id,
        ]);
        $task->update(['title' => 'Updated locally', 'state' => 'another_caller_label', 'completed_at' => now()]);

        $this->assertSame('another_caller_label', $task->fresh()->state);
        $this->assertEquals($requestBefore, DB::table('transactions')->where('id', $request->id)->first());
        $this->assertSame($eventCount, DB::table('transaction_events')->count());
        $this->assertSame(0, DB::table('correspondence_events')->count());
    }

    public function test_omitting_required_state_is_rejected_without_default(): void
    {
        $creator = $this->user('missing-state');
        $this->expectException(QueryException::class);
        Task::query()->create(['title' => 'Missing state', 'created_by_user_id' => $creator->id]);
    }

    public function test_omitting_required_creator_is_rejected(): void
    {
        $this->expectException(QueryException::class);
        Task::query()->create(['title' => 'Missing creator', 'state' => 'provided']);
    }

    public function test_omitting_required_title_is_rejected(): void
    {
        $creator = $this->user('missing-title');
        $this->expectException(QueryException::class);
        Task::query()->create(['state' => 'provided', 'created_by_user_id' => $creator->id]);
    }

    public function test_deleting_assignee_sets_reference_null_without_deleting_task(): void
    {
        $creator = $this->user('assignee-fk-creator');
        $assignee = $this->user('assignee-fk-assignee');
        $task = Task::query()->create([
            'title' => 'Unassignment',
            'state' => 'caller_label',
            'created_by_user_id' => $creator->id,
            'assigned_to_user_id' => $assignee->id,
        ]);

        $assignee->delete();
        $this->assertNull($task->fresh()->assigned_to_user_id);
        $this->assertSame($creator->id, $task->fresh()->created_by_user_id);
    }

    public function test_deleting_creator_is_restricted_while_task_exists(): void
    {
        $creator = $this->user('creator-fk');
        Task::query()->create([
            'title' => 'Creator still required',
            'state' => 'caller_label',
            'created_by_user_id' => $creator->id,
        ]);

        $this->expectException(QueryException::class);
        $creator->delete();
    }

    public function test_migration_rollback_and_recreation_only_toggle_tasks_table(): void
    {
        $allTablesBefore = Schema::getTableListing();
        $transactionColumnsBefore = Schema::getColumnListing('transactions');
        $this->assertContains('tasks', $allTablesBefore);
        $migration = require database_path('migrations/2026_10_08_000000_create_tasks_table.php');

        $migration->down();
        $this->assertFalse(Schema::hasTable('tasks'));
        $this->assertEqualsCanonicalizing(
            array_values(array_diff($allTablesBefore, ['tasks'])),
            Schema::getTableListing(),
        );
        $this->assertSame($transactionColumnsBefore, Schema::getColumnListing('transactions'));

        $migration->up();
        $this->assertTrue(Schema::hasTable('tasks'));
        $this->assertEqualsCanonicalizing($allTablesBefore, Schema::getTableListing());
        $this->assertSame($transactionColumnsBefore, Schema::getColumnListing('transactions'));
    }

    private function user(string $slug): User
    {
        return User::query()->create([
            'name' => 'W01 '.$slug,
            'email' => $slug.'@task-foundation.test',
            'password' => 'test-password',
        ]);
    }
}
