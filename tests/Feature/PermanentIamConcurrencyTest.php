<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\StaffActivationInvitation;
use App\Models\User;
use App\Services\StaffActivationService;
use Illuminate\Foundation\Testing\DatabaseTruncation;
use Illuminate\Foundation\Testing\RefreshDatabaseState;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;
use Throwable;

final class PermanentIamConcurrencyTest extends TestCase
{
    use DatabaseTruncation;

    private const PASSWORD = 'Synthetic-Race-2026!';

    protected function tearDown(): void
    {
        RefreshDatabaseState::$migrated = false;
        parent::tearDown();
    }

    public function test_independent_postgresql_sessions_serialize_iam_lifecycle_operations(): void
    {
        $this->assertTrue(extension_loaded('pcntl'), 'The IAM concurrency gate requires pcntl on the Linux runner.');
        $this->assertSame('pgsql', DB::getDriverName());
        $office = Department::query()->create(['code' => 'IAM-RACE', 'name' => 'IAM Race Office', 'is_active' => true]);
        $admin = User::query()->create([
            'name' => 'Synthetic Administrator', 'username' => 'race.admin',
            'password' => self::PASSWORD, 'role' => 'system_admin', 'is_active' => true, 'account_status' => 'active',
        ]);
        $this->configureIamAdministrator($admin);
        $actorEmployee = $this->employee($office, $admin);
        $service = app(StaffActivationService::class);

        foreach ([
            ['redeem', 'redeem', 'denied', 'active', 1, 0],
            ['issue', 'redeem', 'denied', 'pending', 0, 1],
            ['redeem', 'suspend', 'ok', 'suspended', 2, 0],
            ['redeem', 'recover', 'ok', 'pending', 2, 1],
            ['revoke', 'redeem', 'denied', 'pending', 0, 0],
            ['issue', 'issue', 'ok', 'pending', 0, 1],
            ['suspend', 'reactivate', 'ok', 'active', 2, 0],
            ['suspend', 'suspend', 'denied', 'suspended', 1, 0],
        ] as $index => [$first, $second, $expected, $state, $increment, $usable]) {
            $employee = $this->employee($office);
            $input = ['employee_id' => $employee->id, 'username' => 'race.staff'.$index, 'role' => 'department_staff'];
            $issued = $service->issue($this->iamActorRequest($admin), $admin, $input);
            $user = $employee->fresh()->user;
            if ($first === 'suspend') {
                $service->redeem($issued['code'], self::PASSWORD);
            }
            $version = (int) $user->fresh()->session_version;
            $run = function (string $operation) use ($admin, $input, $issued, $user): void {
                $service = app(StaffActivationService::class);
                match ($operation) {
                    'redeem' => $service->redeem($issued['code'], self::PASSWORD),
                    'issue' => $service->issue($this->iamActorRequest($admin), $admin, $input),
                    'revoke' => $service->revoke($this->iamActorRequest($admin), $admin, $issued['invitation']),
                    'suspend' => $service->suspend($this->iamActorRequest($admin), $admin, $user, 'Synthetic race'),
                    'reactivate' => $service->reactivate($this->iamActorRequest($admin), $admin, $user),
                    'recover' => $service->recover($this->iamActorRequest($admin), $admin, $user),
                };
            };
            $this->contend(
                [(int) $actorEmployee->id, (int) $employee->id],
                fn () => $run($first),
                fn () => $run($second),
                $expected,
            );
            $fresh = $user->fresh();
            $this->assertSame($state, $fresh->account_status, "$first/$second state");
            $this->assertSame($state === 'active', $fresh->is_active);
            $this->assertSame($version + $increment, (int) $fresh->session_version, "$first/$second version");
            $this->assertSame($usable, StaffActivationInvitation::query()->where('user_id', $user->id)
                ->whereNull('consumed_at')->whereNull('revoked_at')->where('expires_at', '>', now())->count());
            $this->assertSame(1, Employee::query()->where('user_id', $user->id)->count());
        }
    }


    public function test_administrator_revocation_ordering_prevents_lifecycle_mutation(): void
    {
        $this->assertTrue(extension_loaded('pcntl'));
        $this->assertSame('pgsql', DB::getDriverName());
        $office = Department::query()->create(['code' => 'IAM-ACTOR', 'name' => 'Synthetic actor office', 'is_active' => true]);
        foreach (['epoch', 'mfa'] as $revocation) {
            $admin = User::query()->create([
                'name' => 'Synthetic Administrator', 'username' => 'actor.admin.'.$revocation,
                'password' => self::PASSWORD, 'role' => 'system_admin', 'is_active' => true, 'account_status' => 'active',
            ]);
            $this->configureIamAdministrator($admin);
            $actorEmployee = $this->employee($office, $admin);
            $employee = $this->employee($office);
            $input = ['employee_id' => $employee->id, 'username' => 'actor.staff.'.$revocation, 'role' => 'department_staff'];
            $request = $this->iamActorRequest($admin);
            $service = app(StaffActivationService::class);
            $issued = $service->issue($request, $admin, $input);
            $user = $service->redeem($issued['code'], self::PASSWORD);
            $snapshot = fn () => [
                $user->fresh()->getAttributes(), $employee->fresh()->getAttributes(),
                StaffActivationInvitation::query()->where('user_id', $user->id)->orderBy('id')->get()->map->getAttributes()->all(),
                \App\Models\AuditLog::query()->where('action', 'like', 'identity.%')->orderBy('id')->get()->map->getAttributes()->all(),
            ];
            $before = $snapshot();
            $this->contend(
                [(int) $actorEmployee->id, (int) $employee->id],
                function () use ($admin, $revocation): void {
                    $locked = User::query()->lockForUpdate()->findOrFail($admin->id);
                    $field = $revocation === 'epoch' ? 'session_version' : 'mfa_version';
                    $locked->forceFill([$field => (int) $locked->{$field} + 1])->save();
                },
                fn () => app(StaffActivationService::class)->recover($request, $admin, $user),
                'denied',
            );
            $this->assertSame($before, $snapshot(), 'Revocation before authorization must preserve target state and audit.');
            $current = $admin->fresh();
            app(StaffActivationService::class)->recover($this->iamActorRequest($current), $current, $user);
            $this->assertSame('pending', $user->fresh()->account_status);
        }
    }

    private function employee(Department $office, ?User $user = null): Employee
    {
        return Employee::query()->create([
            'employee_number' => null, 'full_name' => 'Synthetic Race Staff',
            'department_id' => $office->id, 'user_id' => $user?->id,
            'position_title' => 'Staff', 'employment_status' => 'active',
        ]);
    }

    private function contend(array $employeeIds, callable $first, callable $second, string $expected): void
    {
        $this->assertSame(0, DB::transactionLevel(), 'Fixtures must be committed before the independent connection starts.');
        $pair = stream_socket_pair(STREAM_PF_UNIX, STREAM_SOCK_STREAM, STREAM_IPPROTO_IP);
        $this->assertIsArray($pair);
        [$parentSocket, $childSocket] = $pair;
        DB::disconnect();
        $pid = pcntl_fork();
        $this->assertNotSame(-1, $pid);
        if ($pid === 0) {
            fclose($parentSocket);
            stream_set_timeout($childSocket, 15);
            try {
                DB::disconnect();
                DB::statement("SET lock_timeout = '12s'");
                DB::statement("SET statement_timeout = '15s'");
                $backend = (int) DB::selectOne('SELECT pg_backend_pid() AS pid')->pid;
                fwrite($childSocket, "PID:{$backend}\n");
                if (trim((string) fgets($childSocket)) !== 'GO') {
                    exit(3);
                }
                try {
                    $second();
                    fwrite($childSocket, "ok\n");
                } catch (\Illuminate\Auth\Access\AuthorizationException|ValidationException $exception) {
                    fwrite($childSocket, "denied\n");
                }
                fclose($childSocket);
                exit(0);
            } catch (Throwable $exception) {
                // Never export credentials, SQL parameters or exception messages.
                fwrite($childSocket, 'error:'.$exception::class."\n");
                fclose($childSocket);
                exit(4);
            }
        }

        fclose($childSocket);
        stream_set_timeout($parentSocket, 20);
        $status = 0;
        try {
            $line = fgets($parentSocket);
            $this->assertIsString($line);
            $this->assertMatchesRegularExpression('/^PID:[1-9][0-9]*\s*$/', $line);
            $backend = (int) trim(substr($line, 4));
            DB::beginTransaction();
            try {
                Employee::query()->whereIn('id', $employeeIds)->orderBy('id')->lockForUpdate()->get();
                fwrite($parentSocket, "GO\n");
                $observed = false;
                for ($attempt = 0; $attempt < 400; $attempt++) {
                    if (DB::selectOne('SELECT wait_event_type FROM pg_stat_activity WHERE pid = ?', [$backend])?->wait_event_type === 'Lock') {
                        $observed = true;
                        break;
                    }
                    usleep(20000);
                }
                $this->assertTrue($observed, 'Contender must demonstrably wait on a PostgreSQL lock.');
                $first();
                DB::commit();
            } finally {
                if (DB::transactionLevel() > 0) {
                    DB::rollBack();
                }
            }
            $this->assertSame($expected, trim((string) fgets($parentSocket)));
        } finally {
            fclose($parentSocket);
            pcntl_waitpid($pid, $status);
        }
        $this->assertTrue(pcntl_wifexited($status));
        $this->assertSame(0, pcntl_wexitstatus($status));
    }
}
