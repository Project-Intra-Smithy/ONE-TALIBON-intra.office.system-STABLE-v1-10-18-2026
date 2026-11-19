<?php

namespace Tests\Feature;

use App\Http\Controllers\Auth\PasswordChangeController;
use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Employee;
use App\Models\StaffActivationInvitation;
use App\Models\User;
use App\Services\AccountSessionEligibility;
use App\Services\AuditLogger;
use App\Services\AuthenticationAssurance;
use App\Services\MfaService;
use App\Services\StaffActivationService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\DatabaseTruncation;
use Illuminate\Foundation\Testing\RefreshDatabaseState;
use Illuminate\Http\Request;
use Illuminate\Session\ArraySessionHandler;
use Illuminate\Session\Store;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;
use Throwable;

final class PermanentIamPasswordConcurrencyTest extends TestCase
{
    use DatabaseTruncation;

    private const PASSWORD = 'Synthetic-Race-2026!';
    private const NEW = 'Synthetic-Changed-2026!';

    protected function tearDown(): void
    {
        RefreshDatabaseState::$migrated = false;
        parent::tearDown();
    }

    public function test_password_lifecycle_and_mfa_mutations_serialize_on_independent_postgresql_sessions(): void
    {
        $this->assertTrue(extension_loaded('pcntl'));
        $this->assertSame('pgsql', DB::getDriverName());
        $office = Department::query()->create(['code' => 'G2-RACE', 'name' => 'G2 Race Office', 'is_active' => true]);
        $admin = User::query()->create([
            'name' => 'Synthetic Administrator', 'username' => 'g2.race.admin', 'password' => self::PASSWORD,
            'role' => 'system_admin', 'is_active' => true, 'account_status' => 'active',
        ]);
        $this->configureIamAdministrator($admin);
        $actorEmployee = $this->employee($office, $admin);
        $service = app(StaffActivationService::class);

        foreach ([
            ['password', 'password', 'denied', 'active', 1, 1],
            ['recover', 'password', 'denied', 'pending', 1, 0],
            ['suspend', 'password', 'denied', 'suspended', 1, 0],
            ['reset', 'password', 'denied', 'active', 0, 0],
            ['password', 'reset', 'denied', 'active', 1, 1],
            ['password', 'recover', 'ok', 'pending', 2, 1],
            ['password', 'suspend', 'ok', 'suspended', 2, 1],
        ] as $index => [$first, $second, $expected, $state, $increment, $passwordAudits]) {
            $employee = $this->employee($office);
            $issued = $service->issue($this->iamActorRequest($admin), $admin, [
                'employee_id' => $employee->id, 'username' => 'g2.race.staff'.$index, 'role' => 'department_staff',
            ]);
            $user = $service->redeem($issued['code'], self::PASSWORD);
            $user->forceFill([
                'mfa_secret' => app(Google2FA::class)->generateSecretKey(), 'mfa_confirmed_at' => now(),
                'mfa_version' => 4, 'mfa_recovery_codes' => [], 'remember_token' => Str::random(60),
            ])->save();
            $user = $user->fresh();
            $epoch = (int) $user->session_version;
            $snapshot = fn () => [
                $user->fresh()->getAttributes(),
                $employee->fresh()->getAttributes(),
                StaffActivationInvitation::query()->where('user_id', $user->id)->orderBy('id')->get()->map->getAttributes()->all(),
                AuditLog::query()->where('action', 'like', 'identity.%')->orderBy('id')->get()->map->getAttributes()->all(),
            ];

            $run = function (string $operation) use ($admin, $user, $epoch): void {
                $request = Request::create('/security/password', 'PUT', [
                    'current_password' => self::PASSWORD, 'password' => self::NEW, 'password_confirmation' => self::NEW,
                ]);
                $session = new Store('g2-race', new ArraySessionHandler(120));
                $session->start();
                $session->put([
                    'auth_session_version' => $epoch,
                    AuthenticationAssurance::SESSION_USER_KEY => (int) $user->id,
                    AuthenticationAssurance::SESSION_VERSION_KEY => (int) $user->mfa_version,
                    AuthenticationAssurance::SESSION_VERIFIED_AT_KEY => now()->getTimestamp(),
                ]);
                $request->setLaravelSession($session);
                $request->setUserResolver(fn () => $user);
                match ($operation) {
                    'password' => app(PasswordChangeController::class)($request, app(AuditLogger::class), app(AccountSessionEligibility::class), app(AuthenticationAssurance::class)),
                    'recover' => app(StaffActivationService::class)->recover($this->iamActorRequest($admin), $admin, $user),
                    'suspend' => app(StaffActivationService::class)->suspend($this->iamActorRequest($admin), $admin, $user, 'Synthetic G2 race'),
                    'reset' => app(MfaService::class)->resetEnrollment($user, $request),
                };
            };
            $afterFirst = null;
            $this->contend(
                [(int) $actorEmployee->id, (int) $employee->id],
                function () use ($run, $first, $snapshot, &$afterFirst): void {
                    $run($first);
                    $afterFirst = $snapshot();
                },
                fn () => $run($second),
                $expected,
            );
            if ($expected === 'denied') {
                $this->assertSame($afterFirst, $snapshot(), 'Denied contender must not mutate credentials, links, invitations or identity audit.');
            }
            $fresh = $user->fresh();
            $this->assertSame($state, $fresh->account_status);
            $this->assertSame($state === 'active', $fresh->is_active);
            $this->assertSame($epoch + $increment, (int) $fresh->session_version);
            $this->assertSame($passwordAudits, AuditLog::query()->where('actor_user_id', $user->id)->where('action', 'identity.password.changed')->where('outcome', 'allowed')->count());
            $this->assertSame($state === 'pending' ? 1 : 0, StaffActivationInvitation::query()->where('user_id', $user->id)
                ->whereNull('consumed_at')->whereNull('revoked_at')->where('expires_at', '>', now())->count());
            $this->assertSame(1, Employee::query()->where('user_id', $user->id)->count());
            if ($first === 'reset') {
                $this->assertNull($fresh->mfa_confirmed_at);
                $this->assertTrue(Hash::check(self::PASSWORD, $fresh->password));
            }
            if ($passwordAudits === 1 && $state === 'active') {
                $this->assertTrue(Hash::check(self::NEW, $fresh->password));
                $this->assertNull($fresh->remember_token);
            }
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
                } catch (AuthorizationException|ValidationException $exception) {
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
