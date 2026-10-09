<?php

namespace Tests\Feature\Tasks;

use App\Domain\Tasks\TaskCoreService;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Task;
use App\Models\TaskEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Tests\TestCase;
use Throwable;

/**
 * Real PostgreSQL lock contention between independently connected processes.
 *
 * DatabaseMigrations is intentional: RefreshDatabase's outer transaction
 * would hide new rows from the second PostgreSQL session. This test requires
 * the existing TestCase hard gate APP_ENV=testing / talibon_portal_test and
 * must run only on a disposable CI database.
 */
final class TaskConcurrentConnectionTest extends TestCase
{
    use DatabaseMigrations;

    public function test_two_postgresql_sessions_cannot_both_start_the_same_task(): void
    {
        $this->assertTrue(extension_loaded('pcntl'), 'The Linux CI runner must provide pcntl.');
        $this->assertTrue(extension_loaded('sockets'), 'The Linux CI runner must provide sockets.');
        $this->assertSame('pgsql', DB::getDriverName());

        $actor = User::query()->create([
            'name' => 'Concurrent W03 Owner',
            'email' => 'w03-concurrent@example.test',
            'password' => 'tests-only',
            'is_active' => true,
        ]);
        $department = Department::query()->create([
            'code' => 'W03-RACE',
            'name' => 'W03 Concurrency Office',
            'is_active' => true,
        ]);
        Employee::query()->create([
            'employee_number' => 'W03-RACE',
            'full_name' => 'Concurrent W03 Owner',
            'user_id' => $actor->id,
            'department_id' => $department->id,
            'position_title' => 'Staff',
            'employment_status' => 'active',
        ]);

        auth()->guard('web')->login($actor);
        $task = app(TaskCoreService::class)->createIndividual($actor, 'Race for start');
        $taskId = (int) $task->id;

        $pair = stream_socket_pair(STREAM_PF_UNIX, STREAM_SOCK_STREAM, STREAM_IPPROTO_IP);
        $this->assertIsArray($pair, 'Could not create CI coordination socket.');
        [$parentSocket, $childSocket] = $pair;

        // Never share a fork-inherited PDO socket between processes.
        DB::disconnect();
        $childPid = pcntl_fork();
        $this->assertNotSame(-1, $childPid, 'pcntl_fork failed.');

        if ($childPid === 0) {
            fclose($parentSocket);
            $this->runContender($childSocket, $actor, $taskId);
            exit(98); // Unreachable if the contender exits correctly.
        }

        fclose($childSocket);
        stream_set_timeout($parentSocket, 12);

        $waitedOnPostgresLock = false;
        $parentCommitted = false;
        $childResponse = null;
        $childStatus = 0;

        try {
            DB::beginTransaction();
            try {
                // Parent deliberately holds the Task row while the child
                // starts the same service transition on its own DB session.
                $locked = DB::table('tasks')
                    ->where('id', $taskId)
                    ->lockForUpdate()
                    ->first();
                $this->assertNotNull($locked);

                $identification = fgets($parentSocket);
                $this->assertIsString($identification, 'Child DB connection did not report its PostgreSQL PID.');
                $this->assertMatchesRegularExpression('/^PID:[1-9][0-9]*\s*$/', $identification);
                $postgresPid = (int) trim(substr($identification, 4));

                fwrite($parentSocket, "GO\n");

                // Detect actual PostgreSQL lock contention rather than
                // inferring concurrency from two sequential service calls.
                for ($attempt = 0; $attempt < 400; $attempt++) {
                    $observed = DB::selectOne(
                        'SELECT wait_event_type FROM pg_stat_activity WHERE pid = ?',
                        [$postgresPid],
                    );

                    if ($observed?->wait_event_type === 'Lock') {
                        $waitedOnPostgresLock = true;
                        break;
                    }

                    usleep(20000);
                }

                $this->assertTrue(
                    $waitedOnPostgresLock,
                    'Second PostgreSQL session did not demonstrably wait on the parent row lock.',
                );

                // Nested transaction saves into the parent transaction; the
                // child resumes only after the parent COMMIT releases the lock.
                $updated = app(TaskCoreService::class)
                    ->transitionIndividual($actor, $taskId, 'start');
                $this->assertSame('in_progress', $updated->state);
                DB::commit();
                $parentCommitted = true;
            } finally {
                if (! $parentCommitted && DB::transactionLevel() > 0) {
                    DB::rollBack();
                }
            }

            $childResponse = fgets($parentSocket);
            $this->assertSame(
                'REJECTED_INVALID_TRANSITION',
                trim((string) $childResponse),
                'Contending service call should reject start after the first committed.',
            );
        } finally {
            fclose($parentSocket);
            // Reap the independently running process even when an assertion
            // fails. The DB lock is released by commit/rollback above.
            pcntl_waitpid($childPid, $childStatus);
        }

        $this->assertTrue(pcntl_wifexited($childStatus));
        $this->assertSame(0, pcntl_wexitstatus($childStatus));
        $this->assertTrue($waitedOnPostgresLock);
        $this->assertSame('in_progress', Task::query()->findOrFail($taskId)->state);
        $events = TaskEvent::query()
            ->where('task_id', $taskId)
            ->orderBy('id')
            ->get();
        $this->assertSame(['created', 'start'], $events->pluck('action')->all());
        $this->assertSame(2, $events->count());
    }

    /**
     * This child runs a real TaskCoreService transition in a different
     * process / PostgreSQL backend, not an artificial SQL-only stand-in.
     *
     * @param resource $socket
     */
    private function runContender($socket, User $actor, int $taskId): never
    {
        try {
            DB::disconnect();
            $backendPid = (int) DB::selectOne('SELECT pg_backend_pid() AS pid')->pid;
            fwrite($socket, "PID:{$backendPid}\n");

            if (trim((string) fgets($socket)) !== 'GO') {
                throw new RuntimeException('Parent did not authorize race start.');
            }

            try {
                app(TaskCoreService::class)->transitionIndividual($actor, $taskId, 'start');
                fwrite($socket, "UNEXPECTED_SUCCESS\n");
                fclose($socket);
                exit(2);
            } catch (ValidationException $exception) {
                if (! array_key_exists('state', $exception->errors())) {
                    throw $exception;
                }
                fwrite($socket, "REJECTED_INVALID_TRANSITION\n");
                fclose($socket);
                exit(0);
            }
        } catch (Throwable $error) {
            fwrite($socket, 'CHILD_ERROR:'.$error::class."\n");
            fclose($socket);
            exit(3);
        }
    }
}
