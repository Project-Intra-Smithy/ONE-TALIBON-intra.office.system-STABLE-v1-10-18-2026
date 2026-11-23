<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\Custody\ProducedSourceEvent;
use App\Domain\Custody\VerifiedCommandActor;
use App\Domain\Custody\Exceptions\CustodyViolationException;
use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\Custody\LegacyCustodyCommandService;
use App\Services\TransactionWorkflowService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use PDO;
use PHPUnit\Framework\Attributes\Group;
use RuntimeException;
use Tests\TestCase;

/**
 * Exact-PR60, CI-only N03 concurrency witness. Two independent PHP processes
 * hold distinct n03_command PG16 sessions and race different staged operations
 * against one Work Request. A must hold an actual uncommitted source row lock;
 * pg_blocking_pids must independently observe B waiting on A before release.
 *
 * This is command-path concurrency proof, complemented by the existing C02
 * actual HTTP -> N03 broker integration test, not a claim of concurrent HTTP QA.
 */
#[Group('ops009-c01')]
final class OPS009C01N03SimultaneousCloseTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (! app()->environment('testing')
            || getenv('GITHUB_ACTIONS') !== 'true'
            || getenv('OPS009_DISPOSABLE_CI') !== '1'
            || getenv('N03_DISPOSABLE_LEASE') !== 'EXCLUSIVE_PG16_SYNTHETIC_ONLY'
            || getenv('N03_G2B_ROLE_SUITE') !== '1'
            || config('database.connections.pgsql.database') !== 'talibon_portal_test') {
            throw new RuntimeException('C01 witness refuses non-disposable PG16 execution.');
        }

        foreach ([
            'n03_stage' => 'N03_STAGE_PASSWORD',
            'n03_command' => 'N03_COMMAND_PASSWORD',
            'n03_reconcile' => 'N03_RECONCILE_PASSWORD',
        ] as $role => $envName) {
            $password = getenv($envName);
            if (! is_string($password) || $password === '') {
                throw new RuntimeException('Missing disposable N03 role secret.');
            }
            config([
                "database.connections.{$role}.host" => getenv('DB_HOST') ?: '127.0.0.1',
                "database.connections.{$role}.port" => getenv('DB_PORT') ?: '5432',
                "database.connections.{$role}.database" => 'talibon_portal_test',
                "database.connections.{$role}.username" => $role,
                "database.connections.{$role}.password" => $password,
            ]);
            DB::purge($role);
        }

        $identity = DB::connection('n03_command')->selectOne(
            "SELECT session_user AS role, current_database() AS db, current_setting('server_version_num') AS version"
        );
        $this->assertSame('n03_command', $identity->role);
        $this->assertSame('talibon_portal_test', $identity->db);
        $this->assertGreaterThanOrEqual(160000, (int) $identity->version);
        $this->assertLessThan(170000, (int) $identity->version);
    }

    protected function tearDown(): void
    {
        foreach (['n03_stage', 'n03_command', 'n03_reconcile'] as $role) {
            DB::purge($role);
        }
        parent::tearDown();
    }

    public function test_two_real_n03_sessions_commit_one_close_and_one_eligible_origin_notice(): void
    {
        $this->proveCompetingClose(false);
    }

    public function test_two_real_n03_sessions_commit_one_close_and_one_zero_recipient_exception(): void
    {
        $this->proveCompetingClose(true);
    }

    public function test_two_real_n03_sessions_reject_suspended_requester_with_one_exception(): void
    {
        $this->proveCompetingClose(true, true);
    }

    public function test_suspended_requester_without_eligible_origin_head_rolls_back_entire_close(): void
    {
        $originOffice = $this->makeOffice('SR');
        $receivingOffice = $this->makeOffice('SRR');
        $requester = $this->makeActor($originOffice);
        $receivingHead = $this->makeActor($receivingOffice);
        $workflow = app(TransactionWorkflowService::class);
        $transaction = $workflow->create($requester, [
            'transaction_type' => 'internal_request',
            'title' => 'SEC-R2-01 suspended origin no custodian',
            'priority' => 'normal',
            'target_department_id' => $receivingOffice->id,
            'action_required' => 'For Information',
        ]);
        $transaction = $workflow->transition($receivingHead, $transaction, 'mark_review');
        DB::table('users')->where('id', $requester->id)->update(['suspended_at' => now()]);
        $this->assertSame('active', (string) $requester->fresh()->account_status);
        $this->assertTrue((bool) $requester->fresh()->is_active);
        $this->assertNotNull($requester->fresh()->suspended_at);

        $namespace = (string) Str::uuid();
        DB::table('legacy_custody.namespaces')->insert([
            'namespace_id' => $namespace,
            'backend_kind' => 'synthetic',
            'provider_identity' => $namespace,
            'root_claim' => 'fixture:'.$namespace,
        ]);
        $operation = $this->stageOperation($this->stageConnection(), $namespace, $receivingHead);

        $rejected = false;
        try {
            app(LegacyCustodyCommandService::class)->execute(
                operationId: $operation,
                businessCommand: fn (
                    ConnectionInterface $connection,
                    VerifiedCommandActor $actor,
                    string $correlation,
                ): ProducedSourceEvent => $workflow->transitionWithEventOnConnection(
                    $connection, $actor, (int) $transaction->id, 'close',
                    $correlation, remarks: 'SEC-R2-01 must roll back without origin custodian.',
                ),
                expectedSessionVersion: (int) $receivingHead->session_version,
                expectedRole: (string) $receivingHead->role,
            );
        } catch (CustodyViolationException $e) {
            $this->assertStringContainsString('No eligible origin recipient', $e->getMessage());
            $rejected = true;
        }
        $this->assertTrue($rejected, 'Close committed despite suspended origin and no eligible custodian.');
        $this->assertSame('for_review', $transaction->fresh()->status);
        $this->assertSame(0, $transaction->events()->where('action', 'close')->count());
        $this->assertSame(0, DB::table('audit_logs')
            ->where('entity_type', WorkflowTransaction::class)
            ->where('entity_id', $transaction->id)
            ->where('action', 'transaction.close')->count());
        $this->assertSame(0, DB::table('legacy_custody.command_results')
            ->where('operation_id', $operation)->count());
        $this->assertSame(0, DB::table('legacy_custody.terminal_receipts')
            ->where('operation_id', $operation)->count());
        $this->assertSame(0, DB::table('documents')
            ->where('custody_operation_id', $operation)->count());
        $this->assertSame(0, DB::table('platform_notifications')
            ->where('source_domain', 'transaction')
            ->where('source_id', $transaction->id)
            ->where('title', 'Transaction completed')->count());
        $this->assertSame(0, DB::table('ops009_origin_delivery_exceptions')
            ->where('transaction_id', $transaction->id)->count());
    }

    private function proveCompetingClose(bool $deliveryGap, bool $suspendedRequester = false): void
    {
        $originOffice = $this->makeOffice('OO');
        $receivingOffice = $this->makeOffice('RC');
        $requester = $this->makeActor($originOffice);
        $head = $this->makeActor($receivingOffice);

        $workflow = app(TransactionWorkflowService::class);
        $transaction = $workflow->create($requester, [
            'transaction_type' => 'internal_request',
            'title' => 'OPS009 C01 synthetic command concurrency',
            'priority' => 'normal',
            'target_department_id' => $receivingOffice->id,
            'action_required' => 'For Information',
        ]);
        $transaction = $workflow->transition($head, $transaction, 'mark_review');

        if ($deliveryGap) {
            // A different legitimate origin office Head owns the restricted queue.
            $this->makeActor($originOffice);
            if ($suspendedRequester) {
                // SEC-R2-01: retain every *other* eligibility flag so that
                // only the suspended_at predicate can exclude the requester.
                DB::table('users')->where('id', $requester->id)->update(['suspended_at' => now()]);
                $this->assertTrue((bool) $requester->fresh()->is_active);
                $this->assertSame('active', (string) $requester->fresh()->account_status);
                $this->assertSame('active', (string) $requester->employee->employment_status);
                $this->assertNull($requester->employee->separation_date);
                $this->assertNotNull($requester->fresh()->suspended_at);
            } else {
                $requester->update(['is_active' => false]);
            }
        }

        $namespace = (string) Str::uuid();
        DB::table('legacy_custody.namespaces')->insert([
            'namespace_id' => $namespace,
            'backend_kind' => 'synthetic',
            'provider_identity' => $namespace,
            'root_claim' => 'fixture:'.$namespace,
        ]);

        $stage = $this->stageConnection();
        $operationA = $this->stageOperation($stage, $namespace, $head);
        $operationB = $this->stageOperation($stage, $namespace, $head);
        $stage = null;

        $dir = sys_get_temp_dir().'/ops009-c01-n03-'.bin2hex(random_bytes(8));
        if (! mkdir($dir, 0700) && ! is_dir($dir)) {
            throw new RuntimeException('Unable to allocate private C01 barrier directory.');
        }

        $processes = [];
        try {
            $observed = null;
            try {
                $processes['A'] = $this->startWorker('A', $transaction, $head, $operationA, $dir);
                $this->waitFor($dir.'/A.locked', 20);
                $processes['B'] = $this->startWorker('B', $transaction, $head, $operationB, $dir);
                $this->waitFor($dir.'/B.ready.json', 20);

                $a = $this->readJson($dir.'/A.ready.json');
                $b = $this->readJson($dir.'/B.ready.json');
                $this->assertSame('n03_command', $a['role']);
                $this->assertSame('n03_command', $b['role']);
                $this->assertSame('talibon_portal_test', $a['database']);
                $this->assertSame('talibon_portal_test', $b['database']);
                $this->assertNotSame($a['pid'], $b['pid'], 'C01 requires two distinct live PostgreSQL backends.');

                $deadline = microtime(true) + 16;
                while (microtime(true) < $deadline) {
                    $wait = DB::selectOne(
                        'SELECT wait_event_type, wait_event, pg_blocking_pids(pid)::text AS blockers
                         FROM pg_stat_activity WHERE pid = ?',
                        [(int) $b['pid']],
                    );
                    if ($wait !== null && $wait->wait_event_type === 'Lock'
                        && str_contains((string) $wait->blockers, (string) $a['pid'])) {
                        $observed = [
                            'a_pid' => $a['pid'],
                            'b_pid' => $b['pid'],
                            'lock' => (string) $wait->wait_event,
                            'b_blocked_by_a' => true,
                        ];
                        break;
                    }
                    usleep(30000);
                }
            } finally {
                // Always unblock A even when the independent PG wait
                // observation or a subprocess launch fails.
                file_put_contents($dir.'/A.release', '1');
                foreach ($processes as $process) {
                    $this->waitProcess($process, 25);
                }
            }

            $this->assertNotNull($observed, 'No B blocked by A in pg_stat_activity: C01 race NOT PROVEN.');
            $aResult = $this->readJson($dir.'/A.result.json');
            $bResult = $this->readJson($dir.'/B.result.json');
            $this->assertTrue($aResult['success'], 'A must commit its N03 close.');
            $this->assertSame('COMMITTED', $aResult['outcome']);
            $this->assertFalse($bResult['success'], 'B must not commit a duplicate N03 close.');
            $this->assertContains($bResult['exception'], [
                AuthorizationException::class,
                ValidationException::class,
                CustodyViolationException::class,
            ]);

            $this->assertSame('closed', $transaction->fresh()->status);
            $this->assertNotNull($transaction->fresh()->completed_at);
            $event = $transaction->events()->where('action', 'close')->sole();
            $this->assertSame((int) $head->id, (int) $event->actor_user_id);
            $this->assertSame('for_review', $event->previous_status);
            $this->assertSame('closed', $event->new_status);
            $this->assertSame(1, $transaction->events()->where('action', 'close')->count());
            $this->assertSame(1, DB::table('audit_logs')
                ->where('entity_type', WorkflowTransaction::class)
                ->where('entity_id', $transaction->id)
                ->where('action', 'transaction.close')->count());

            $binding = DB::table('ops009_close_audit_bindings')
                ->where('transaction_id', $transaction->id)
                ->where('transaction_event_id', $event->id)->sole();
            $this->assertSame($operationA, (string) $binding->operation_id);
            $this->assertSame(1, DB::table('legacy_custody.command_results')
                ->where('operation_id', $operationA)
                ->where('event_id', $event->id)->count());
            $this->assertSame(1, DB::table('legacy_custody.terminal_receipts')
                ->where('operation_id', $operationA)->where('outcome', 'COMMITTED')->count());
            $this->assertSame(0, DB::table('legacy_custody.terminal_receipts')
                ->where('operation_id', $operationB)->count());
            $this->assertSame(0, DB::table('legacy_custody.command_results')
                ->where('operation_id', $operationB)->count());
            $this->assertSame(1, DB::table('documents')
                ->where('custody_operation_id', $operationA)->count());
            $this->assertSame(0, DB::table('documents')
                ->where('custody_operation_id', $operationB)->count());

            $notices = DB::table('platform_notifications')
                ->where('event_key', 'transaction-event-'.$event->id)->get();
            $exceptions = DB::table('ops009_origin_delivery_exceptions')
                ->where('transaction_id', $transaction->id)->get();

            if ($deliveryGap) {
                $this->assertCount(0, $notices);
                $this->assertCount(1, $exceptions);
                $this->assertSame($operationA, (string) $exceptions[0]->operation_id);
                $this->assertSame((int) $event->id, (int) $exceptions[0]->transaction_event_id);
                $this->assertSame('department_head', $exceptions[0]->custodian_role);
            } else {
                $this->assertCount(1, $notices);
                $this->assertSame((int) $requester->id, (int) $notices[0]->user_id);
                $this->assertSame('transaction', $notices[0]->source_domain);
                $this->assertCount(0, $exceptions);

                // SEC-R2-01 direct PostgreSQL guard proof: after a valid
                // receipt, suspend the original recipient and attempt an
                // otherwise identical n03_command notice. BEFORE INSERT
                // must reject it even with ON CONFLICT DO NOTHING.
                DB::table('users')->where('id', $requester->id)->update(['suspended_at' => now()]);
                $this->assertNotNull($requester->fresh()->suspended_at);
                $guardRejected = false;
                try {
                    DB::connection('n03_command')->insert(<<<'SQL'
                        INSERT INTO public.platform_notifications
                            (user_id, department_id, event_key, source_domain, source_type,
                             source_id, priority, title, message, action_url,
                             requires_acknowledgement, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, now(), now())
                        ON CONFLICT (user_id, event_key) DO NOTHING
                        SQL, [
                        $notices[0]->user_id, $notices[0]->department_id,
                        $notices[0]->event_key, $notices[0]->source_domain,
                        $notices[0]->source_type, $notices[0]->source_id,
                        $notices[0]->priority, $notices[0]->title,
                        $notices[0]->message, $notices[0]->action_url,
                    ]);
                } catch (QueryException $e) {
                    $this->assertSame('23514', (string) $e->getCode());
                    $guardRejected = true;
                }
                $this->assertTrue($guardRejected, 'PostgreSQL guard permitted an ineligible suspended recipient.');
                $this->assertSame(1, DB::table('platform_notifications')
                    ->where('event_key', 'transaction-event-'.$event->id)->count());
            }

            // A third N03 execution attempt using B's same staged operation
            // must remain negative after the race; no new event or receipt.
            $replayRejected = false;
            try {
                app(LegacyCustodyCommandService::class)->execute(
                    operationId: $operationB,
                    businessCommand: fn (
                        ConnectionInterface $connection,
                        VerifiedCommandActor $actor,
                        string $correlation,
                    ): ProducedSourceEvent => $workflow->transitionWithEventOnConnection(
                        $connection, $actor, (int) $transaction->id, 'close',
                        $correlation, remarks: 'Forbidden N03 terminal replay.',
                    ),
                    expectedSessionVersion: (int) $head->session_version,
                    expectedRole: (string) $head->role,
                );
            } catch (AuthorizationException|ValidationException|CustodyViolationException) {
                $replayRejected = true;
            }
            $this->assertTrue($replayRejected, 'Already-closed source allowed replay.');
            $this->assertSame(1, $transaction->events()->where('action', 'close')->count());
            $this->assertSame(0, DB::table('legacy_custody.terminal_receipts')
                ->where('operation_id', $operationB)->count());

            fwrite(STDOUT, 'OPS009_C01_N03_WITNESS='.json_encode($observed + [
                'delivery_gap' => $deliveryGap,
                'suspended_requester' => $suspendedRequester,
                'winner' => 'A',
                'loser_exception' => $bResult['exception'],
                'close_events' => 1,
                'close_audits' => 1,
                'committed_receipts' => 1,
                'recipient_notices' => $notices->count(),
                'event_linked_exceptions' => $exceptions->count(),
                'replay_rejected' => true,
                'role' => 'n03_command',
            ], JSON_THROW_ON_ERROR)."\n");
        } finally {
            file_put_contents($dir.'/A.release', '1');
            foreach (glob($dir.'/*') ?: [] as $file) {
                @unlink($file);
            }
            @rmdir($dir);
        }
    }

    private function makeOffice(string $prefix): Department
    {
        return Department::query()->create([
            'code' => $prefix.'-'.Str::upper(Str::random(8)),
            'name' => 'OPS009 C01 synthetic '.$prefix,
            'short_name' => $prefix,
            'branch' => 'executive',
            'office_type' => 'department',
            'is_active' => true,
            'is_routable' => true,
            'sort_order' => 10,
        ]);
    }

    private function makeActor(Department $office): User
    {
        $name = 'OPS009 C01 '.Str::random(8);
        $email = Str::random(12).'@example.test';
        $user = User::query()->create([
            'name' => $name, 'email' => $email,
            'password' => 'synthetic-only',
            'role' => 'department_head',
            'is_active' => true, 'account_status' => 'active',
            'session_version' => 1,
        ]);
        Employee::query()->create([
            'employee_number' => 'C1-'.Str::upper(Str::random(10)),
            'full_name' => $name, 'work_email' => $email,
            'user_id' => $user->id, 'department_id' => $office->id,
            'position_title' => 'Synthetic Head',
            'employment_status' => 'active',
        ]);
        return $user->fresh('employee.department');
    }

    private function stageConnection(): PDO
    {
        return new PDO(
            'pgsql:host='.(getenv('DB_HOST') ?: '127.0.0.1')
            .';port='.(getenv('DB_PORT') ?: '5432').';dbname=talibon_portal_test',
            'n03_stage',
            (string) getenv('N03_STAGE_PASSWORD'),
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false],
        );
    }

    private function stageOperation(PDO $stage, string $namespace, User $head): string
    {
        $id = (string) Str::uuid();
        $generation = (string) Str::uuid();
        $op = [
            'operation_id' => $id,
            'namespace_id' => $namespace,
            'epoch' => 1,
            'actor_user_id' => $head->id,
            'office_id' => $head->employee->department_id,
            'service_identity' => 'ops009-c01-n03-witness',
            'command_kind' => 'transaction_transition',
            'command_action' => 'close',
            'correlation_id' => (string) Str::uuid(),
            'idempotency_hash' => hash('sha256', $id.':idem'),
            'item_count' => 1,
            'manifest_digest' => hash('sha256', $id.':manifest'),
        ];
        $item = [
            'operation_id' => $id, 'ordinal' => 1, 'generation_id' => $generation,
            'namespace_id' => $namespace, 'epoch' => 1,
            'locator' => 'objects/'.substr($generation, 0, 2).'/'.$generation.'.blob',
            'size_bytes' => 2048, 'sha256' => hash('sha256', 'ops009-'.$id),
            'mime_type' => 'application/pdf',
        ];
        $stage->beginTransaction();
        try {
            $this->insert($stage, 'legacy_custody.operations', $op);
            $this->insert($stage, 'legacy_custody.operation_items', $item);
            $this->insert($stage, 'legacy_custody.operation_gates', ['operation_id' => $id]);
            $stage->commit();
        } catch (\Throwable $error) {
            $stage->rollBack();
            throw $error;
        }
        $this->insert($stage, 'legacy_custody.generations', $item + [
            'provider_object_identity' => 'local_v1:2:'.random_int(1000, 9999999).':'.$generation,
            'staged_fence' => 1,
            'staging_receipt_id' => (string) Str::uuid(),
        ]);
        return $id;
    }

    private function insert(PDO $pdo, string $table, array $columns): void
    {
        $keys = implode(',', array_keys($columns));
        $slots = implode(',', array_fill(0, count($columns), '?'));
        $statement = $pdo->prepare("INSERT INTO {$table} ({$keys}) VALUES ({$slots})");
        $statement->execute(array_values($columns));
    }

    private function startWorker(
        string $mode, WorkflowTransaction $transaction, User $head, string $operationId, string $dir,
    ): mixed {
        $process = proc_open(
            [PHP_BINARY, base_path('tests/Manual/ops009-c01-n03-worker.php'), $mode,
                (string) $transaction->id, (string) $head->id, $operationId, $dir],
            [
                0 => ['pipe', 'r'],
                1 => ['file', $dir.'/'.$mode.'.stdout', 'w'],
                2 => ['file', $dir.'/'.$mode.'.stderr', 'w'],
            ],
            $pipes, base_path(), null, ['bypass_shell' => true],
        );
        if (! is_resource($process)) {
            throw new RuntimeException('C01 could not launch real independent N03 PHP process.');
        }
        fclose($pipes[0]);
        return $process;
    }

    private function waitFor(string $path, int $seconds): void
    {
        $until = microtime(true) + $seconds;
        while (! file_exists($path) && microtime(true) < $until) {
            usleep(30000);
        }
        $this->assertFileExists($path, 'Timed out waiting for C01 barrier '.$path);
    }

    private function waitProcess(mixed $process, int $seconds): void
    {
        $deadline = microtime(true) + $seconds;
        while (microtime(true) < $deadline) {
            if (! proc_get_status($process)['running']) {
                proc_close($process);
                return;
            }
            usleep(50000);
        }
        proc_terminate($process, 9);
        proc_close($process);
        throw new RuntimeException('N03 C01 child exceeded barrier timeout.');
    }

    private function readJson(string $path): array
    {
        $content = file_get_contents($path);
        if ($content === false) {
            throw new RuntimeException('Missing N03 C01 child evidence.');
        }
        return json_decode($content, true, 512, JSON_THROW_ON_ERROR);
    }
}
