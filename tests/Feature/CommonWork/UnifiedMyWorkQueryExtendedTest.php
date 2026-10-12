<?php

namespace Tests\Feature\CommonWork;

use App\Domain\Tasks\TaskLifecycleState;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Task;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\CommonWork\CommonWorkItem;
use App\Services\CommonWork\UnifiedMyWorkQuery;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

final class UnifiedMyWorkQueryExtendedTest extends TestCase
{
    use RefreshDatabase;

    private const FROM = '2026-10-10T00:00:00Z';

    private const BEFORE = '2026-10-11T00:00:00Z';

    public function test_summary_returns_integer_zeroes_for_empty_personal_work(): void
    {
        $actor = $this->person($this->office());
        $this->actingAs($actor);
        $this->assertSame($this->counts(0, 0), $this->service()->summary($actor));
    }

    public function test_summary_includes_all_native_states_and_is_not_changed_by_other_filters(): void
    {
        $office = $this->office();
        $actor = $this->person($office);
        $this->actingAs($actor);
        foreach (TaskLifecycleState::cases() as $state) {
            $this->task($actor, $state->value, due: null);
        }
        foreach ($this->requestStates() as $state) {
            $this->workRequest($actor, $office, $office, $state, due: null);
        }
        $expected = $this->counts(count(TaskLifecycleState::cases()), count($this->requestStates()));
        $this->assertSame($expected, $this->service()->summary($actor));
        $this->assertSame(0, $this->service()->dueWindow($actor, self::FROM, self::BEFORE)->total());
        $this->assertSame(1, $this->service()->nativeState($actor, 'individual_task', 'open')->total());
        $this->assertSame($expected, $this->service()->summary($actor));
    }

    public function test_summary_uses_one_sql_aggregate_without_enumerating_work_rows_as_volume_grows(): void
    {
        $office = $this->office();
        $actor = $this->person($office);
        $this->actingAs($actor);
        $this->task($actor);
        $this->workRequest($actor, $office, $office);
        [$small, $smallQueries] = $this->captureQueries(fn () => $this->service()->summary($actor));
        $this->assertSame($this->counts(1, 1), $small);
        foreach (range(1, 60) as $unused) {
            $this->task($actor);
            $this->workRequest($actor, $office, $office);
        }
        [$large, $largeQueries] = $this->captureQueries(fn () => $this->service()->summary($actor));
        $this->assertSame($this->counts(61, 61), $large);
        foreach ([$smallQueries, $largeQueries] as $queries) {
            $workQueries = $this->workQueries($queries);
            $this->assertCount(1, $workQueries, 'Work tables must be read by one SQL aggregate only.');
            $sql = strtolower($workQueries[0]['query']);
            $this->assertStringContainsString('union all', $sql);
            $this->assertStringContainsString('count(*) as total', $sql);
            $this->assertSame(2, substr_count($sql, 'filter (where source_type = ?)'));
            $this->assertLessThanOrEqual(12, count($queries));
        }
        $this->assertSame(count($smallQueries), count($largeQueries), 'Query count must not grow with work volume.');
        $this->observation('summary_2_rows', $smallQueries);
        $this->observation('summary_122_rows', $largeQueries);
    }

    #[DataProvider('readOperations')]
    public function test_each_operation_excludes_cross_actor_and_unauthorized_work(string $operation): void
    {
        $a = $this->office();
        $b = $this->office();
        $c = $this->office();
        // Offset Employee IDs from User IDs to exercise assignment identity.
        Employee::query()->create([
            'employee_number' => 'A02-'.Str::random(12), 'full_name' => 'Unlinked fixture',
            'department_id' => $a->id, 'position_title' => 'Fixture', 'employment_status' => 'active',
        ]);
        $actor = $this->person($a);
        $colleague = $this->person($a);
        $outsider = $this->person($b);
        $this->assertNotSame($actor->id, $actor->employee->id);
        $this->actingAs($actor);
        $owned = $this->task($actor);
        $this->task($colleague);
        $this->task($actor, kind: 'official');
        $this->task($actor, kind: 'legacy');
        $this->task($actor, assignee: $colleague);
        $this->task($outsider, assignee: $actor);
        $created = $this->workRequest($actor, $a, $b);
        $assigned = $this->workRequest($outsider, $b, $a, assignee: $actor->employee);
        $both = $this->workRequest($actor, $a, $a, assignee: $actor->employee);
        $this->workRequest($colleague, $a, $a); // Office visibility is insufficient.
        $this->workRequest($outsider, $b, $c);
        $this->workRequest($actor, $b, $c); // Creator, but outside source visibility.
        $this->workRequest($outsider, $b, $c, assignee: $actor->employee);
        $result = $this->readOperation($operation, $actor);
        if ($operation === 'summary') {
            $this->assertSame($this->counts(1, 3), $result);
        } else {
            $expected = match ($operation) {
                'native_task' => ['individual_task:'.$owned->id],
                'native_request' => ['work_request:'.$created->id, 'work_request:'.$assigned->id, 'work_request:'.$both->id],
                default => ['individual_task:'.$owned->id, 'work_request:'.$created->id, 'work_request:'.$assigned->id, 'work_request:'.$both->id],
            };
            $this->assertEqualsCanonicalizing($expected, $this->keys($result));
            $this->assertSame(count($expected), $result->total());
        }
        $this->actingAs($colleague);
        $reciprocal = $this->readOperation($operation, $colleague);
        if ($operation === 'summary') {
            $this->assertSame($this->counts(1, 1), $reciprocal);
        } else {
            $this->assertSame($operation === 'due' ? 2 : 1, $reciprocal->total());
            $this->assertNotContains('individual_task:'.$owned->id, $this->keys($reciprocal));
            $this->assertNotContains('work_request:'.$created->id, $this->keys($reciprocal));
        }
    }

    public function test_due_window_includes_start_excludes_end_and_omits_nulls_in_both_sources(): void
    {
        $office = $this->office();
        $actor = $this->person($office);
        $this->actingAs($actor);
        $expected = [];
        foreach ([null, '2026-10-09T23:59:59Z', self::FROM, '2026-10-10T23:59:59Z', self::BEFORE, '2026-10-11T00:00:01Z'] as $due) {
            $task = $this->task($actor, due: $due);
            $request = $this->workRequest($actor, $office, $office, due: $due);
            if (in_array($due, [self::FROM, '2026-10-10T23:59:59Z'], true)) {
                $expected[] = 'individual_task:'.$task->id;
                $expected[] = 'work_request:'.$request->id;
            }
        }
        $result = $this->service()->dueWindow($actor, self::FROM, self::BEFORE);
        $this->assertSame(4, $result->total());
        $this->assertEqualsCanonicalizing($expected, $this->keys($result));
    }

    public function test_due_window_normalizes_positive_negative_and_fractional_offsets(): void
    {
        $office = $this->office();
        $actor = $this->person($office);
        $this->actingAs($actor);
        $task = $this->task($actor);
        $request = $this->workRequest($actor, $office, $office, due: '2026-10-10T23:59:59Z');
        $expected = ['individual_task:'.$task->id, 'work_request:'.$request->id];
        foreach ([
            [self::FROM, self::BEFORE],
            ['2026-10-10T08:00:00+08:00', '2026-10-11T08:00:00+08:00'],
            ['2026-10-09T19:00:00-05:00', '2026-10-10T19:00:00-05:00'],
            ['2026-10-10T00:00:00.000000Z', '2026-10-11T00:00:00.000000Z'],
        ] as [$from, $before]) {
            $this->assertEqualsCanonicalizing($expected, $this->keys($this->service()->dueWindow($actor, $from, $before)));
        }
        $this->assertSame(['work_request:'.$request->id], $this->keys($this->service()->dueWindow($actor, '2026-10-10T00:00:00.000001Z', self::BEFORE)));
    }

    public function test_due_window_filters_each_source_and_returns_empty_nonmatching_intervals(): void
    {
        $office = $this->office();
        $actor = $this->person($office);
        $this->actingAs($actor);
        $task = $this->task($actor);
        $request = $this->workRequest($actor, $office, $office);
        foreach (['individual_task' => $task, 'work_request' => $request] as $source => $record) {
            $result = $this->service()->dueWindow($actor, self::FROM, self::BEFORE, source: $source);
            $this->assertSame([$source.':'.$record->id], $this->keys($result));
            $this->assertSame(1, $result->total());
        }
        $empty = $this->service()->dueWindow($actor, '2027-01-01T00:00:00Z', '2027-01-02T00:00:00Z');
        $this->assertSame(0, $empty->total());
        $this->assertSame([], $this->keys($empty));
    }

    #[DataProvider('invalidBoundaries')]
    public function test_due_window_rejects_invalid_rfc3339_at_either_boundary(string $invalid): void
    {
        $actor = $this->person($this->office());
        $this->actingAs($actor);
        $this->assertInvalid(fn () => $this->service()->dueWindow($actor, $invalid, self::BEFORE));
        $this->assertInvalid(fn () => $this->service()->dueWindow($actor, self::FROM, $invalid));
    }

    #[DataProvider('nonIncreasingIntervals')]
    public function test_due_window_rejects_empty_and_reversed_intervals(string $from, string $before): void
    {
        $actor = $this->person($this->office());
        $this->actingAs($actor);
        $this->assertInvalid(fn () => $this->service()->dueWindow($actor, $from, $before));
    }

    #[DataProvider('paginatedOperations')]
    public function test_filtered_pagination_is_bounded_deterministic_and_has_no_duplicates(string $operation): void
    {
        $office = $this->office();
        $actor = $this->person($office);
        $this->actingAs($actor);
        $expected = [];
        foreach (range(1, 51) as $unused) {
            if ($operation === 'native_request') {
                $record = $this->workRequest($actor, $office, $office);
                $expected[] = 'work_request:'.$record->id;
            } else {
                $record = $this->task($actor);
                $expected[] = 'individual_task:'.$record->id;
            }
        }
        DB::table('tasks')->update(['updated_at' => self::FROM]);
        DB::table('transactions')->update(['updated_at' => self::FROM]);
        [$first, $queries] = $this->captureQueries(fn () => $this->readOperation($operation, $actor, 1, 50));
        $second = $this->readOperation($operation, $actor, 2, 50);
        $this->assertSame(51, $first->total());
        $this->assertSame(50, $first->perPage());
        $this->assertCount(50, $first->getCollection());
        $this->assertCount(1, $second->getCollection());
        $keys = array_merge($this->keys($first), $this->keys($second));
        $this->assertSame(array_reverse($expected), $keys);
        $this->assertCount(51, array_unique($keys));
        $this->assertSame($this->keys($first), $this->keys($this->readOperation($operation, $actor, 1, 50)));
        $this->assertSame([], $this->keys($this->readOperation($operation, $actor, 3, 50)));
        $this->assertSame([], $this->keys($this->readOperation($operation, $actor, 10000, 50)));
        $this->assertCount(1, $this->readOperation($operation, $actor, 1, 1)->getCollection());
        $this->assertCount(2, $this->workQueries($queries));
        $this->assertLessThanOrEqual(12, count($queries));
        $this->assertStringContainsString('limit 50', strtolower($this->workQueries($queries)[1]['query']));
        $this->observation($operation.'_51_rows_page_50', $queries);
    }

    #[DataProvider('invalidPagination')]
    public function test_due_and_native_filters_reject_out_of_bounds_pagination(int $page, int $perPage): void
    {
        $actor = $this->person($this->office());
        $this->actingAs($actor);
        foreach (['due', 'native_task', 'native_request'] as $operation) {
            $this->assertInvalid(fn () => $this->readOperation($operation, $actor, $page, $perPage));
        }
    }

    public function test_native_state_preserves_every_committed_task_and_request_state(): void
    {
        $office = $this->office();
        $actor = $this->person($office);
        $this->actingAs($actor);
        $taskCases = TaskLifecycleState::cases();
        $this->assertSame(['open', 'in_progress', 'completed'], array_column($taskCases, 'value'));
        $requestStates = $this->requestStates();
        $this->assertEqualsCanonicalizing(['submitted', 'for_review', 'for_approval', 'returned', 'information_requested', 'approved', 'disapproved', 'closed'], $requestStates);
        $this->assertSame([], config('workflow.types'), 'This baseline has no type-specific workflow overrides.');
        $records = [];
        foreach ($taskCases as $state) {
            $records['individual_task'][$state->value] = $this->task($actor, $state->value);
        }
        foreach ($requestStates as $state) {
            $records['work_request'][$state] = $this->workRequest($actor, $office, $office, $state);
        }
        foreach ($records as $source => $states) {
            foreach ($states as $state => $record) {
                $result = $this->service()->nativeState($actor, $source, $state);
                $this->assertSame(1, $result->total());
                $this->assertSame([$source.':'.$record->id], $this->keys($result));
                $item = $result->getCollection()->first()->jsonSerialize();
                $this->assertSame($state, $item['source_state']);
                $this->assertSame($source, $item['source']);
                $this->assertSame($source === 'individual_task' ? 'task_owner' : 'request_creator', $item['responsibility']);
                $this->assertSame($source === 'individual_task' ? $state === 'completed' : in_array($state, config('workflow.default.terminal_statuses'), true), $item['is_terminal']);
            }
        }
    }

    public function test_native_state_rejects_cross_source_lifecycle_labels(): void
    {
        $actor = $this->person($this->office());
        $this->actingAs($actor);
        foreach (TaskLifecycleState::cases() as $taskState) {
            $this->assertInvalid(fn () => $this->service()->nativeState($actor, 'work_request', $taskState->value));
        }
        foreach ($this->requestStates() as $requestState) {
            $this->assertInvalid(fn () => $this->service()->nativeState($actor, 'individual_task', $requestState));
        }
    }

    #[DataProvider('invalidStates')]
    public function test_native_state_requires_exact_known_state(string $source, string $state): void
    {
        $actor = $this->person($this->office());
        $this->actingAs($actor);
        $this->assertInvalid(fn () => $this->service()->nativeState($actor, $source, $state));
    }

    #[DataProvider('invalidSources')]
    public function test_due_and_native_filters_reject_unknown_or_ambiguous_source(string $source): void
    {
        $actor = $this->person($this->office());
        $this->actingAs($actor);
        $this->assertInvalid(fn () => $this->service()->dueWindow($actor, self::FROM, self::BEFORE, source: $source));
        $this->assertInvalid(fn () => $this->service()->nativeState($actor, $source, 'open'));
    }

    public function test_native_state_returns_empty_when_valid_state_has_no_personal_matches(): void
    {
        $office = $this->office();
        $actor = $this->person($office);
        $this->actingAs($actor);
        $this->task($actor, 'open');
        $this->workRequest($actor, $office, $office, 'submitted');
        foreach (['individual_task' => 'completed', 'work_request' => 'approved'] as $source => $state) {
            $result = $this->service()->nativeState($actor, $source, $state);
            $this->assertSame(0, $result->total());
            $this->assertSame([], $this->keys($result));
        }
    }

    #[DataProvider('deniedCallers')]
    public function test_all_read_operations_reject_ineligible_or_spoofed_actors(string $operation, string $condition): void
    {
        $office = $this->office();
        $actor = $this->person($office);
        $this->task($actor);
        $this->workRequest($actor, $office, $office);
        if ($condition !== 'guest') {
            $this->actingAs($condition === 'spoofed' ? $this->person($office) : $actor);
        }
        // Database updates leave the claimed actor and loaded relationships stale.
        match ($condition) {
            'disabled' => DB::table('users')->where('id', $actor->id)->update(['is_active' => false]),
            'separated' => DB::table('employees')->where('id', $actor->employee->id)->update(['employment_status' => 'separated']),
            'inactive_department' => DB::table('departments')->where('id', $office->id)->update(['is_active' => false]),
            default => null,
        };
        $before = $this->workSnapshot();
        try {
            $this->readOperation($operation, $actor);
            $this->fail('An unauthorized caller received personal work.');
        } catch (AuthorizationException $exception) {
            $this->assertSame('Task access denied.', $exception->getMessage());
        }
        $this->assertSame($before, $this->workSnapshot());
    }

    #[DataProvider('privilegedRoles')]
    public function test_privileged_roles_do_not_expand_personal_work_or_bypass_actor_eligibility(string $role): void
    {
        $office = $this->office();
        $owner = $this->person($office);
        $viewer = $this->person($office, $role);
        $this->task($owner);
        $this->workRequest($owner, $office, $office);
        $this->actingAs($viewer);
        foreach (['summary', 'due', 'native_task', 'native_request'] as $operation) {
            $result = $this->readOperation($operation, $viewer);
            $this->assertSame($operation === 'summary' ? $this->counts(0, 0) : [], $operation === 'summary' ? $result : $this->keys($result));
        }
        DB::table('employees')->where('id', $viewer->employee->id)->update(['employment_status' => 'separated']);
        foreach (['summary', 'due', 'native_task', 'native_request'] as $operation) {
            try {
                $this->readOperation($operation, $viewer);
                $this->fail('Privileged actor bypassed live eligibility.');
            } catch (AuthorizationException) {
                $this->assertTrue(true);
            }
        }
    }

    #[DataProvider('readOperations')]
    public function test_each_operation_preserves_full_records_states_timestamps_and_existing_events(string $operation): void
    {
        $office = $this->office();
        $actor = $this->person($office);
        $this->actingAs($actor);
        $task = $this->task($actor);
        $request = $this->workRequest($actor, $office, $office);
        $this->task($actor, 'completed');
        $this->workRequest($actor, $office, $office, 'approved');
        // Seed events so deletion/rewriting cannot hide behind empty tables.
        DB::table('task_events')->insert([
            'task_id' => $task->id, 'actor_user_id' => $actor->id, 'action' => 'created',
            'previous_state' => null, 'new_state' => 'open', 'created_at' => self::FROM,
        ]);
        DB::table('transaction_events')->insert([
            'transaction_id' => $request->id, 'actor_user_id' => $actor->id, 'action' => 'created',
            'previous_status' => null, 'new_status' => 'submitted', 'created_at' => self::FROM,
        ]);
        $before = $this->workSnapshot();
        [$result, $queries] = $this->captureQueries(fn () => $this->readOperation($operation, $actor));
        $this->assertSame($operation === 'summary' ? 4 : ($operation === 'due' ? 4 : 1), $operation === 'summary' ? $result['total'] : $result->total());
        foreach ($queries as $query) {
            $this->assertMatchesRegularExpression('/^\s*select\b/i', $query['query'], 'Projection must issue read-only SQL.');
        }
        $this->assertSame($before, $this->workSnapshot(), 'Every stored column and event must remain unchanged.');
    }

    public static function readOperations(): array
    {
        return ['summary' => ['summary'], 'dueWindow' => ['due'], 'nativeState Task' => ['native_task'], 'nativeState Work Request' => ['native_request']];
    }

    public static function paginatedOperations(): array
    {
        return array_diff_key(self::readOperations(), ['summary' => true]);
    }

    public static function invalidBoundaries(): array
    {
        return [
            'empty' => [''], 'relative' => ['tomorrow'], 'date only' => ['2026-10-10'],
            'timezone missing' => ['2026-10-10T00:00:00'], 'SQL timestamp' => ['2026-10-10 00:00:00Z'],
            'rollover day' => ['2026-02-30T00:00:00Z'], 'nonleap day' => ['2026-02-29T00:00:00Z'],
            'bad month' => ['2026-13-10T00:00:00Z'], 'bad hour' => ['2026-10-10T24:00:00Z'],
            'bad minute' => ['2026-10-10T00:60:00Z'], 'bad second' => ['2026-10-10T00:00:60Z'],
            'bad offset' => ['2026-10-10T00:00:00+15:00'], 'trailing input' => [self::FROM.' trailing'],
        ];
    }

    public static function nonIncreasingIntervals(): array
    {
        return [
            'equal' => [self::FROM, self::FROM], 'reversed' => [self::BEFORE, self::FROM],
            'equal instants different zones' => ['2026-10-10T08:00:00+08:00', self::FROM],
            'reversed after normalization' => [self::FROM, '2026-10-10T00:00:00+08:00'],
        ];
    }

    public static function invalidPagination(): array
    {
        return ['zero page' => [0, 20], 'negative page' => [-1, 20], 'over max page' => [10001, 20], 'zero limit' => [1, 0], 'negative limit' => [1, -1], 'over max limit' => [1, 51]];
    }

    public static function invalidStates(): array
    {
        return [
            'empty Task' => ['individual_task', ''], 'unknown Task' => ['individual_task', 'not_a_state'],
            'Task case' => ['individual_task', 'OPEN'], 'Task whitespace' => ['individual_task', 'open '],
            'empty request' => ['work_request', ''], 'unknown request' => ['work_request', 'not_a_state'],
            'request case' => ['work_request', 'APPROVED'], 'request whitespace' => ['work_request', 'submitted '],
            'SQL-looking state' => ['work_request', "submitted' OR 1=1 --"],
        ];
    }

    public static function invalidSources(): array
    {
        return ['empty' => [''], 'alias' => ['task'], 'wrong case' => ['Individual_Task'], 'universal' => ['all'], 'SQL-looking' => ["work_request' OR 1=1 --"]];
    }

    public static function deniedCallers(): iterable
    {
        foreach (self::readOperations() as $label => [$operation]) {
            foreach (['guest', 'spoofed', 'disabled', 'separated', 'inactive_department'] as $condition) {
                yield $label.' / '.$condition => [$operation, $condition];
            }
        }
    }

    public static function privilegedRoles(): array
    {
        return ['department head' => ['department_head'], 'executive' => ['mayor_approver'], 'administrator' => ['system_admin']];
    }

    private function service(): UnifiedMyWorkQuery
    {
        return app(UnifiedMyWorkQuery::class);
    }

    private function readOperation(string $operation, User $actor, int $page = 1, int $perPage = 20): array|LengthAwarePaginator
    {
        return match ($operation) {
            'summary' => $this->service()->summary($actor),
            'due' => $this->service()->dueWindow($actor, self::FROM, self::BEFORE, $page, $perPage),
            'native_task' => $this->service()->nativeState($actor, 'individual_task', 'open', $page, $perPage),
            'native_request' => $this->service()->nativeState($actor, 'work_request', 'submitted', $page, $perPage),
        };
    }

    private function keys(LengthAwarePaginator $page): array
    {
        return $page->getCollection()->map(fn (CommonWorkItem $item): string => $item->jsonSerialize()['key'])->all();
    }

    private function counts(int $tasks, int $requests): array
    {
        return ['total' => $tasks + $requests, 'by_source' => ['individual_task' => $tasks, 'work_request' => $requests]];
    }

    private function assertInvalid(callable $operation): void
    {
        try {
            $operation();
            $this->fail('Invalid filter was accepted.');
        } catch (InvalidArgumentException) {
            $this->assertTrue(true);
        }
    }

    private function requestStates(): array
    {
        $states = [];
        foreach (array_merge([config('workflow.default')], array_values(config('workflow.types'))) as $definition) {
            $states[] = $definition['initial_status'];
            array_push($states, ...($definition['terminal_statuses'] ?? []));
            foreach ($definition['transitions'] ?? [] as $rule) {
                if (isset($rule['status'])) {
                    $states[] = $rule['status'];
                }
                array_push($states, ...($rule['allowed_from'] ?? []));
            }
        }

        return array_values(array_unique($states));
    }

    private function captureQueries(callable $operation): array
    {
        DB::flushQueryLog();
        DB::enableQueryLog();
        try {
            $result = $operation();

            return [$result, DB::getQueryLog()];
        } finally {
            DB::disableQueryLog();
            DB::flushQueryLog();
        }
    }

    private function workQueries(array $queries): array
    {
        return array_values(array_filter($queries, fn (array $query): bool => preg_match('/\b(?:from|join) "(?:tasks|transactions)"/i', $query['query']) === 1));
    }

    private function observation(string $label, array $queries): void
    {
        fwrite(STDERR, 'A02_QUERY_OBSERVATION '.json_encode([
            'case' => $label, 'queries' => count($queries), 'work_queries' => count($this->workQueries($queries)),
            'database_time_ms' => round(array_sum(array_column($queries, 'time')), 3),
        ], JSON_THROW_ON_ERROR).PHP_EOL);
    }

    private function workSnapshot(): array
    {
        $snapshot = [];
        foreach (['tasks', 'transactions', 'task_events', 'transaction_events'] as $table) {
            $snapshot[$table] = DB::table($table)->orderBy('id')->get()->map(fn (object $row): array => (array) $row)->all();
        }

        return $snapshot;
    }

    private function office(): Department
    {
        return Department::query()->create(['code' => 'A02-'.Str::upper(Str::random(9)), 'name' => 'A02 Synthetic Office', 'is_active' => true]);
    }

    private function person(Department $office, string $role = 'department_staff'): User
    {
        $user = User::query()->create([
            'name' => 'A02 Synthetic Staff', 'email' => Str::lower(Str::random(15)).'@a02.test',
            'password' => 'test-password', 'role' => $role, 'is_active' => true,
        ]);
        Employee::query()->create([
            'employee_number' => 'A02-'.Str::upper(Str::random(12)), 'full_name' => 'A02 Synthetic Staff',
            'user_id' => $user->id, 'department_id' => $office->id, 'position_title' => 'Tester', 'employment_status' => 'active',
        ]);

        return $user->fresh('employee.department');
    }

    private function task(User $owner, string $state = 'open', ?string $due = self::FROM, string $kind = 'individual', ?User $assignee = null): Task
    {
        $task = Task::query()->create([
            'title' => 'A02 synthetic Task', 'state' => $state, 'created_by_user_id' => $owner->id,
            'assigned_to_user_id' => $assignee?->id,
        ]);
        $task->forceFill(['task_kind' => $kind, 'owning_department_id' => $owner->employee->department_id])->save();
        // Write explicit instants without Eloquent converting them to local, offset-free strings.
        DB::table('tasks')->where('id', $task->id)->update(['due_at' => $due]);

        return $task;
    }

    private function workRequest(User $creator, Department $origin, Department $current, string $state = 'submitted', ?string $due = self::FROM, ?Employee $assignee = null): WorkflowTransaction
    {
        $request = WorkflowTransaction::query()->create([
            'reference_no' => 'A02-'.Str::upper(Str::random(12)), 'transaction_type' => 'internal_request',
            'title' => 'A02 synthetic request', 'priority' => 'normal', 'origin_department_id' => $origin->id,
            'current_department_id' => $current->id, 'created_by_user_id' => $creator->id,
            'assigned_employee_id' => $assignee?->id, 'status' => $state,
        ]);
        DB::table('transactions')->where('id', $request->id)->update(['due_at' => $due]);

        return $request;
    }
}
