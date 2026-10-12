<?php

namespace Tests\Feature\Tasks;

use App\Models\Department;
use App\Models\Employee;
use App\Models\Task;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Disposable PostgreSQL 16 fixtures for engineering-hub #94.
 *
 * All records are synthetic. The inherited TestCase requires APP_ENV=testing
 * and DB_DATABASE=talibon_portal_test across all environment sources.
 * Kirch must independently verify the unique Windows PostgreSQL cluster before
 * starting PHPUnit; these tests do not provision or select a database.
 */
trait TaskActivityPg16Fixture
{
    protected function setUp(): void
    {
        parent::setUp();

        self::assertSame('pgsql', DB::connection()->getDriverName());

        $identity = DB::selectOne(
            "SELECT current_database() AS db_name, current_setting('server_version_num')::integer AS version_num"
        );
        self::assertSame('talibon_portal_test', $identity->db_name);
        self::assertGreaterThanOrEqual(160000, (int) $identity->version_num);
        self::assertLessThan(170000, (int) $identity->version_num);
    }

    /** @return array{0: User, 1: Department} */
    private function makeStaff(string $slug, ?Department $existingOffice = null): array
    {
        $user = User::query()->create([
            'name' => 'T94 synthetic '.$slug,
            'email' => 't94-'.$slug.'@example.invalid',
            'password' => 'disposable-test-only',
            'role' => 'employee',
            'is_active' => true,
        ]);

        $office = $existingOffice ?? Department::query()->create([
            'code' => 'T94-'.strtoupper(substr($slug, 0, 18)),
            'name' => 'T94 synthetic '.$slug.' office',
            'is_active' => true,
        ]);

        Employee::query()->create([
            'employee_number' => 'T94-'.$slug,
            'full_name' => 'T94 synthetic '.$slug,
            'user_id' => $user->id,
            'department_id' => $office->id,
            'position_title' => 'Synthetic staff',
            'employment_status' => 'active',
        ]);

        return [$user, $office];
    }

    private function makePersonalTask(
        User $creator,
        Department $office,
        string $label,
        ?string $kind = 'individual',
        ?User $assignedTo = null
    ): Task {
        $task = new Task();
        $task->forceFill([
            'title' => 'T94 '.$label,
            'state' => 'open',
            'task_kind' => $kind,
            'created_by_user_id' => $creator->id,
            'owning_department_id' => $office->id,
            'assigned_to_user_id' => $assignedTo?->id,
        ]);
        $task->save();

        return $task;
    }

    private function makeEvent(
        Task $task,
        User $actor,
        string $action,
        string $timestamp = '2026-10-12T09:00:00+00:00',
        ?string $previous = null,
        string $next = 'open'
    ): int {
        return (int) DB::table('task_events')->insertGetId([
            'task_id' => $task->id,
            'actor_user_id' => $actor->id,
            'action' => $action,
            'previous_state' => $previous,
            'new_state' => $next,
            'created_at' => $timestamp,
        ]);
    }

    /** Insert bounded fixture batches without invoking TaskCoreService writes. */
    private function makeEvents(Task $task, User $actor, int $count): void
    {
        $rows = [];

        for ($i = 0; $i < $count; $i++) {
            $rows[] = [
                'task_id' => $task->id,
                'actor_user_id' => $actor->id,
                'action' => 'fixture',
                'previous_state' => null,
                'new_state' => 'open',
                'created_at' => '2026-10-12T09:00:00+00:00',
            ];

            if (count($rows) === 200) {
                DB::table('task_events')->insert($rows);
                $rows = [];
            }
        }

        if ($rows !== []) {
            DB::table('task_events')->insert($rows);
        }
    }

    private function assertAuthorizationDenied(callable $operation): void
    {
        try {
            $operation();
            self::fail('Expected the live authenticated-actor guard to deny access.');
        } catch (AuthorizationException $exception) {
            self::assertNotSame('', $exception->getMessage());
        }
    }

    private function assertConcealed(callable $operation): void
    {
        try {
            $operation();
            self::fail('Expected owner-filtered 404 concealment.');
        } catch (ModelNotFoundException $exception) {
            self::assertNotSame('', $exception->getModel());
        }
    }

    private function assertRejected(callable $operation, string $field): void
    {
        try {
            $operation();
            self::fail('Expected validation rejection for '.$field);
        } catch (ValidationException $exception) {
            self::assertArrayHasKey($field, $exception->errors());
        }
    }

    /**
     * Record only statements performed by the read operation. Fixture inserts,
     * schema migrations and later assertions are deliberately excluded.
     *
     * @return array{0: mixed, 1: list<array<string, mixed>>}
     */
    private function traceRead(callable $operation): array
    {
        $connection = DB::connection();
        $connection->flushQueryLog();
        $connection->enableQueryLog();

        try {
            $result = $operation();
            $log = $connection->getQueryLog();
        } finally {
            $connection->disableQueryLog();
            $connection->flushQueryLog();
        }

        return [$result, $log];
    }

    /** @param list<array<string, mixed>> $queries */
    private function assertReadOnlySql(array $queries): void
    {
        self::assertNotEmpty($queries);

        foreach ($queries as $query) {
            $sql = ltrim(strtolower((string) $query['query']));
            self::assertStringStartsWith('select', $sql, 'Reader issued a non-SELECT statement.');
            self::assertStringNotContainsString('join "users"', $sql, 'Event actor profiles must not be joined.');
        }
    }
}
