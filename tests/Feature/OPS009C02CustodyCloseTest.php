<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\Custody\ProducedSourceEvent;
use App\Domain\Custody\VerifiedCommandActor;
use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\Custody\LegacyCustodyCommandService;
use App\Services\Custody\LegacyCustodyStageService;
use App\Services\Custody\Broker\ProcessStorageBrokerClient;
use App\Services\Custody\Broker\BrokerRootAttestation;
use App\Services\AuditLogger;
use App\Domain\Custody\Exceptions\CustodyViolationException;
use App\Services\Reports\TransactionOperationalReportQuery;
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
use Throwable;

/**
 * The protected G2B custody command path, not a mocked workflow/service call.
 * This test deliberately fails if no origin notification is produced.
 */
#[Group('ops009-c02')]
final class OPS009C02CustodyCloseTest extends TestCase
{
    private PDO $root;
    private PDO $stage;
    private Department $originOffice;
    private Department $receivingOffice;
    private Department $foreignOffice;
    private User $origin;
    private User $head;
    private User $staff;
    private User $admin;
    private User $foreignHead;
    private string $namespace;
    /** @var list<PDO> */
    private array $connections = [];

    protected function setUp(): void
    {
        parent::setUp();
        if (! app()->environment('testing')
            || getenv('OPS009_DISPOSABLE_CI') !== '1'
            || getenv('N03_DISPOSABLE_LEASE') !== 'EXCLUSIVE_PG16_SYNTHETIC_ONLY'
            || getenv('N03_G2B_ROLE_SUITE') !== '1'
            || config('database.connections.pgsql.database') !== 'talibon_portal_test') {
            throw new RuntimeException('OPS009 C02 requires isolated PG16 with exclusive N03 G2B role lease');
        }
        $this->root = $this->connect('postgres', 'DB_PASSWORD');
        $this->stage = $this->connect('n03_stage', 'N03_STAGE_PASSWORD');
        foreach ([
            'n03_stage' => 'N03_STAGE_PASSWORD',
            'n03_command' => 'N03_COMMAND_PASSWORD',
            'n03_reconcile' => 'N03_RECONCILE_PASSWORD',
        ] as $role => $env) {
            config([
                "database.connections.{$role}.host" => getenv('DB_HOST') ?: '127.0.0.1',
                "database.connections.{$role}.port" => getenv('DB_PORT') ?: '5432',
                "database.connections.{$role}.database" => 'talibon_portal_test',
                "database.connections.{$role}.username" => $role,
                "database.connections.{$role}.password" => (string) getenv($env),
            ]);
            DB::purge($role);
        }
        $this->assertSame('n03_command', DB::connection('n03_command')->selectOne('SELECT session_user AS role')->role);
        $this->assertSame('talibon_portal_test', $this->scalar('SELECT current_database()'));
        $this->assertStringStartsWith('16', (string) $this->scalar("SELECT current_setting('server_version')"));
        // A canonical N03 G2A constraint must accept the new close command
        // before any G2B staged custody test can reach the business service.
        // Keep one actual positive attempt to prove the hard prerequisite failure.
        // Do not call unrelated negatives PASS/FAIL when reservation cannot begin.
        $contract = (string) $this->scalar(
            "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname='operations_check' AND conrelid='legacy_custody.operations'::regclass",
        );
        if (! str_contains($contract, "'close'")
            && $this->name() !== 'test_real_receiving_head_custody_close_produces_atomic_event_audit_and_report') {
            $this->markTestSkipped('BLOCKED_CUSTODY_COMMAND_SCHEMA: canonical operations_check excludes transaction_transition/close');
        }

        $this->originOffice = $this->makeOffice('OO');
        $this->receivingOffice = $this->makeOffice('RC');
        $this->foreignOffice = $this->makeOffice('FO');
        $this->origin = $this->makeActor($this->originOffice, 'department_head');
        $this->head = $this->makeActor($this->receivingOffice, 'department_head');
        $this->staff = $this->makeActor($this->receivingOffice, 'department_staff');
        $this->admin = $this->makeActor($this->receivingOffice, 'system_admin');
        $this->foreignHead = $this->makeActor($this->foreignOffice, 'department_head');

        $this->namespace = (string) Str::uuid();
        $this->insert($this->root, 'legacy_custody.namespaces', [
            'namespace_id' => $this->namespace,
            'backend_kind' => 'synthetic',
            'provider_identity' => $this->namespace,
            'root_claim' => 'fixture:'.$this->namespace,
        ]);
    }

    protected function tearDown(): void
    {
        foreach ($this->connections as $pdo) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
        }
        $this->connections = [];
        foreach (['n03_stage', 'n03_command', 'n03_reconcile'] as $role) {
            DB::purge($role);
        }
        parent::tearDown();
    }

    public function test_n03_role_rejects_unpaired_and_forged_close_audits(): void
    {
        // Test with a real n03_command session; ROLLBACK preserves synthetic
        // database integrity even if the current G2B guard incorrectly accepts.
        $tx = $this->makeReviewedTransaction('For Information');
        $connection = DB::connection('n03_command');
        $this->assertSame('n03_command', $connection->selectOne('SELECT current_user AS role')->role);
        $this->assertSame(0, $tx->events()->where('action', 'close')->count());
        $this->assertSame(0, (int) $this->scalar('SELECT count(*) FROM legacy_custody.operations'));
        $accepted = [];
        $rejected = [];
        $cases = [
            'orphan-without-operation' => [(int) $this->head->id, (int) $this->receivingOffice->id, (int) $tx->id],
            'foreign-office' => [(int) $this->head->id, (int) $this->foreignOffice->id, (int) $tx->id],
            'foreign-actor' => [(int) $this->foreignHead->id, (int) $this->receivingOffice->id, (int) $tx->id],
            'forged-entity' => [(int) $this->head->id, (int) $this->receivingOffice->id, (int) $tx->id + 1000000],
            'forged-correlation' => [(int) $this->head->id, (int) $this->receivingOffice->id, (int) $tx->id],
        ];
        foreach ($cases as $name => [$actorId, $officeId, $entityId]) {
            $connection->beginTransaction();
            try {
                $correlation = (string) Str::uuid();
                app(AuditLogger::class)->recordOnConnection(
                    connection: $connection,
                    actorUserId: $actorId,
                    actorDepartmentId: $officeId,
                    action: 'transaction.close',
                    summary: 'Synthetic OPS009 provenance probe',
                    correlationId: $correlation,
                    entityType: WorkflowTransaction::class,
                    entityId: $entityId,
                );
                $isDuplicateCase = $name === 'orphan-without-operation';
                if ($isDuplicateCase) {
                    app(AuditLogger::class)->recordOnConnection(
                        connection: $connection,
                        actorUserId: $actorId,
                        actorDepartmentId: $officeId,
                        action: 'transaction.close',
                        summary: 'Synthetic duplicate OPS009 audit probe',
                        correlationId: $correlation,
                        entityType: WorkflowTransaction::class,
                        entityId: $entityId,
                    );
                }
                // Trigger is initially deferred because the legitimate
                // command receipt arrives later. Force its *database*
                // integrity check without ever committing an invalid probe.
                $connection->statement('SET CONSTRAINTS ops009_close_audit_integrity IMMEDIATE');
                $accepted[] = $name;
                if ($isDuplicateCase) {
                    $accepted[] = 'duplicate-audit';
                }
            } catch (QueryException $e) {
                $rejected[$name] = (string) $e->getCode();
            } finally {
                $connection->rollBack();
            }
        }
        fwrite(STDOUT, 'OPS009_N03_AUDIT_NEGATIVE_EVIDENCE='.json_encode([
            'role' => 'n03_command',
            'accepted' => $accepted,
            'rejected' => $rejected,
            'close_events' => $tx->events()->where('action', 'close')->count(),
            'persisted_probe_audits' => $this->auditCount($tx->id),
            'cleanup' => 'rollback_per_probe',
        ], JSON_THROW_ON_ERROR)."\n");
        $this->assertSame(0, $this->auditCount($tx->id));
        $this->assertSame([], $accepted,
            'PROVENANCE_BINDING_MISSING: n03_command accepted orphan/forged/duplicate close audit inserts');
    }

    public function test_actual_stage_reservation_accepts_close_and_rejects_wrong_kind(): void
    {
        $id = (string) Str::uuid();
        $result = app(LegacyCustodyStageService::class)->reserve(
            namespaceId: $this->namespace,
            epoch: 1,
            actorUserId: (int) $this->head->id,
            officeId: (int) $this->receivingOffice->id,
            serviceIdentity: 'ops009-ci-test',
            commandKind: 'transaction_transition',
            commandAction: 'close',
            correlationId: (string) Str::uuid(),
            idempotencyHash: hash('sha256', $id),
            items: [[
                'size_bytes' => 2048,
                'sha256' => hash('sha256', 'ops009-stage-test-'.$id),
                'mime_type' => 'application/pdf',
            ]],
            operationId: $id,
        );
        $this->assertSame($id, $result['operation_id']);
        $this->assertSame('close', (string) $this->scalar(
            'SELECT command_action FROM legacy_custody.operations WHERE operation_id=?', [$id],
        ));
        $this->assertSame(1, (int) $this->scalar(
            "SELECT count(*) FROM legacy_custody.operation_events WHERE operation_id=? AND kind='RESERVED'", [$id],
        ));
        fwrite(STDOUT, "OPS009_REAL_STAGE_RESERVE=PASS;role=n03_stage;command=transaction_transition/close\n");
        $this->expectException(CustodyViolationException::class);
        app(LegacyCustodyStageService::class)->reserve(
            namespaceId: $this->namespace,
            epoch: 1,
            actorUserId: (int) $this->head->id,
            officeId: (int) $this->receivingOffice->id,
            serviceIdentity: 'ops009-ci-test',
            commandKind: 'correspondence_route',
            commandAction: 'close',
            correlationId: (string) Str::uuid(),
            idempotencyHash: hash('sha256', 'invalid-'.$id),
            items: [[
                'size_bytes' => 2048,
                'sha256' => hash('sha256', 'ops009-invalid-'.$id),
                'mime_type' => 'application/pdf',
            ]],
        );
    }

    public function test_real_receiving_head_custody_close_produces_atomic_event_audit_and_report(): void
    {
        $tx = $this->makeReviewedTransaction('For Information');
        $op = $this->reserveAndStage($this->head);
        $result = $this->executeClose($op, $tx, $this->head);
        $this->assertSame('COMMITTED', $result->outcome);
        $this->assertSame('close', $result->eventAction);
        $this->assertSame($tx->id, $result->sourceId);
        $this->assertCount(1, $result->documents);
        $tx->refresh();
        $this->assertSame('closed', $tx->status);
        $this->assertNotNull($tx->completed_at);
        $event = $tx->events()->where('action', 'close')->sole();
        $this->assertSame($result->eventId, $event->id);
        $this->assertSame($this->head->id, $event->actor_user_id);
        $this->assertSame('Custody case completed.', $event->remarks);
        $this->assertSame(1, $this->auditCount($tx->id));
        $this->assertSame(1, (int) $this->scalar(
            'SELECT count(*) FROM legacy_custody.command_results WHERE operation_id=? AND event_id=? AND correlation_id=?',
            [$op['operation_id'], $event->id, $op['correlation_id']],
        ));
        $this->assertSame(1, (int) $this->scalar(
            'SELECT count(*) FROM legacy_custody.terminal_receipts WHERE operation_id=? AND outcome=?',
            [$op['operation_id'], 'COMMITTED'],
        ));
        $this->assertSame(1, app(TransactionOperationalReportQuery::class)->rows('completed-work', $this->origin, [], false)
            ->filter(fn (array $row): bool => $row['reference'] === $tx->reference_no)->count());
        $this->assertSame(0, app(TransactionOperationalReportQuery::class)->rows('transaction-aging', $this->origin, [], false)
            ->filter(fn (array $row): bool => $row['reference'] === $tx->reference_no)->count());
        fwrite(STDOUT, 'OPS009_C02_SOURCE='.json_encode([
            'kind' => 'connection_bound', 'db_role' => 'n03_command',
            'transaction_id' => $tx->id, 'event_id' => $event->id,
            'audit_count' => $this->auditCount($tx->id),
            'completed_rows' => 1, 'custody_receipts' => 1,
        ], JSON_THROW_ON_ERROR)."\n");
    }

    public function test_c02_audit_refuses_missing_terminal_receipt_at_deferred_check(): void
    {
        $tx = $this->makeReviewedTransaction('For Information');
        $op = $this->reserveAndStage($this->head);
        $before = $this->delta($tx);
        $forcedCheckReached = false;
        try {
            app(LegacyCustodyCommandService::class)->execute(
                operationId: $op['operation_id'],
                businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $verified, string $correlation): ProducedSourceEvent =>
                    app(TransactionWorkflowService::class)->transitionWithEventOnConnection(
                        $conn, $verified, (int) $tx->id, 'close', $correlation, remarks: 'Synthetic incomplete receipt.',
                    ),
                expectedSessionVersion: (int) $this->head->session_version,
                expectedRole: $this->head->role,
                cutPointHook: static function (string $point) use (&$forcedCheckReached): void {
                    if ($point === 'after_command_result') {
                        $forcedCheckReached = true;
                        DB::connection('n03_command')->statement(
                            'SET CONSTRAINTS ops009_close_audit_integrity IMMEDIATE',
                        );
                    }
                },
            );
            $this->fail('OPS009 unreceipted close audit was accepted.');
        } catch (QueryException $e) {
            $this->assertSame('23514', (string) $e->getCode());
        }
        $this->assertTrue($forcedCheckReached);
        $this->assertSame($before, $this->delta($tx));
        $this->assertSame(0, (int) $this->scalar(
            'SELECT count(*) FROM public.ops009_close_audit_bindings WHERE operation_id=?',
            [$op['operation_id']],
        ));
        fwrite(STDOUT, "OPS009_R3_MISSING_RECEIPT_REJECTION=23514;rollback=verified\n");
    }

    public function test_uncommitted_origin_notice_is_invisible_and_cutpoint_rolls_back(): void
    {
        $tx = $this->makeReviewedTransaction('For Information');
        $op = $this->reserveAndStage($this->head);
        $before = $this->delta($tx);
        $eventId = null;
        $observedBeforeCommit = null;
        $external = $this->root;

        try {
            app(LegacyCustodyCommandService::class)->execute(
                operationId: $op['operation_id'],
                businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $verified, string $correlation): ProducedSourceEvent =>
                    app(TransactionWorkflowService::class)->transitionWithEventOnConnection(
                        $conn, $verified, (int) $tx->id, 'close', $correlation, remarks: 'Synthetic notice rollback.',
                    ),
                expectedSessionVersion: (int) $this->head->session_version,
                expectedRole: $this->head->role,
                cutPointHook: static function (string $point, array $context) use (
                    &$eventId, &$observedBeforeCommit, $external,
                    $tx
                ): void {
                    if ($point === 'after_business') {
                        $eventId = (int) $context['event_id'];
                    }
                    if ($point === 'after_receipt') {
                        if ($eventId === null) {
                            throw new RuntimeException('Missing close event at after_receipt.');
                        }
                        $stmt = $external->prepare(
                            'SELECT count(*) FROM public.platform_notifications
                             WHERE event_key=? AND source_id=?',
                        );
                        $stmt->execute(['transaction-event-'.$eventId, (int) $tx->id]);
                        $observedBeforeCommit = (int) $stmt->fetchColumn();
                        throw new RuntimeException('OPS009_R3_AFTER_RECEIPT_TEST_CUTPOINT');
                    }
                },
            );
            $this->fail('Injected after_receipt failure did not occur.');
        } catch (RuntimeException $e) {
            $this->assertSame('OPS009_R3_AFTER_RECEIPT_TEST_CUTPOINT', $e->getMessage());
        }
        $this->assertNotNull($eventId);
        $this->assertSame(0, $observedBeforeCommit);
        $this->assertSame($before, $this->delta($tx));
        $this->assertSame(0, (int) DB::table('platform_notifications')
            ->where('event_key', 'transaction-event-'.$eventId)->count());
        fwrite(STDOUT, 'OPS009_R3_NOTICE_PRECOMMIT_VISIBILITY='.json_encode([
            'external_session_count' => $observedBeforeCommit,
            'after_rollback_count' => 0,
            'event_id' => $eventId,
        ], JSON_THROW_ON_ERROR)."\n");
    }

    public function test_continuous_process_broker_reserve_stage_execute_and_verify_bytes(): void
    {
        $tx = $this->makeReviewedTransaction('For Information');
        $tmp = realpath(sys_get_temp_dir());
        $this->assertIsString($tmp);
        $base = $tmp.'/ot_ops009_r3_'.bin2hex(random_bytes(8));
        $vault = $base.'/vault';
        $this->assertTrue(mkdir($vault, 0750, true));

        try {
            $bytes = "%PDF-1.4\n%OPS009-R3-REAL-BROKER-".bin2hex(random_bytes(16))."\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n";
            $src = $base.'/source.pdf';
            $this->assertSame(strlen($bytes), file_put_contents($src, $bytes));
            $namespace = strtolower((string) Str::uuid());
            $id = strtolower((string) Str::uuid());
            $broker = new ProcessStorageBrokerClient(
                brokerRoot: $vault,
                hmacKey: hash('sha256', 'r3-subprocess-'.bin2hex(random_bytes(16))),
                brokerBinary: base_path('bin/legacy-custody-broker'),
                disallowedRoots: BrokerRootAttestation::collectApplicationDisallowedRoots(),
            );

            $rootClaim = $broker->attestRoot($namespace);
            $this->assertSame('local_broker_v1', $rootClaim['backend_kind']);
            $this->assertNotSame(getmypid(), $broker->lastBrokerPid());
            $this->insert($this->root, 'legacy_custody.namespaces', [
                'namespace_id' => $namespace,
                'backend_kind' => $rootClaim['backend_kind'],
                'provider_identity' => $rootClaim['provider_identity'],
                'root_claim' => $rootClaim['root_claim'],
            ]);

            $stage = new LegacyCustodyStageService($broker);
            $staged = $stage->reserveAndStage(
                namespaceId: $namespace,
                epoch: 1,
                actorUserId: (int) $this->head->id,
                officeId: (int) $this->receivingOffice->id,
                serviceIdentity: 'ops009-r3-broker-execution',
                commandKind: 'transaction_transition',
                commandAction: 'close',
                correlationId: strtolower((string) Str::uuid()),
                idempotencyHash: hash('sha256', $id),
                items: [[
                    'source_path' => $src,
                    'size_bytes' => strlen($bytes),
                    'sha256' => hash('sha256', $bytes),
                    'mime_type' => 'application/pdf',
                ]],
                operationId: $id,
            );
            $this->assertSame($id, $staged['reservation']['operation_id']);
            $this->assertCount(1, $staged['receipts']);
            $this->assertSame(1, (int) $this->scalar(
                "SELECT count(*) FROM legacy_custody.operation_events WHERE operation_id=? AND kind='STAGED'",
                [$id],
            ));

            $result = $this->executeClose($staged['reservation'], $tx, $this->head);
            $this->assertSame('COMMITTED', $result->outcome);
            $this->assertCount(1, $result->documents);
            $this->assertSame(1, $this->auditCount((int) $tx->id));
            $this->assertSame(1, (int) $this->scalar(
                'SELECT count(*) FROM legacy_custody.terminal_receipts WHERE operation_id=? AND outcome=?',
                [$id, 'COMMITTED'],
            ));
            $this->assertSame(1, (int) DB::table('platform_notifications')
                ->where('event_key', 'transaction-event-'.$result->eventId)
                ->where('user_id', $this->origin->id)->count());

            $receipt = $staged['receipts'][0];
            $read = $broker->readGeneration(
                namespaceId: $namespace,
                generationId: $receipt->generationId,
                locator: $receipt->locator,
                expectedProviderObjectIdentity: $receipt->providerObjectIdentity,
                expectedSize: strlen($bytes),
                expectedSha256: hash('sha256', $bytes),
            );
            $this->assertSame($bytes, $read->bytes);
            $this->assertSame(hash('sha256', $bytes), $read->sha256);
            $this->assertNotSame(getmypid(), $broker->lastBrokerPid());
            $this->assertSame('legacy_registry_v1', DB::table('documents')
                ->where('custody_operation_id', $id)->value('storage_disk'));
            fwrite(STDOUT, 'OPS009_R3_FULL_BROKER_EVIDENCE='.json_encode([
                'stage_role' => 'n03_stage',
                'command_role' => 'n03_command',
                'broker' => 'separate_php_subprocess',
                'reservation_id' => $id,
                'staged_count' => 1,
                'receipt_count' => 1,
                'close_event' => $result->eventId,
                'close_audit_count' => 1,
                'origin_notice_count' => 1,
                'sealed_sha256_match' => true,
                'document_count' => 1,
            ], JSON_THROW_ON_ERROR)."\n");
        } finally {
            if (is_dir($base)) {
                $walk = new \RecursiveIteratorIterator(
                    new \RecursiveDirectoryIterator($base, \FilesystemIterator::SKIP_DOTS),
                    \RecursiveIteratorIterator::CHILD_FIRST,
                );
                foreach ($walk as $file) {
                    if ($file->isDir() && ! $file->isLink()) {
                        @rmdir($file->getPathname());
                    } else {
                        @unlink($file->getPathname());
                    }
                }
                @rmdir($base);
            }
        }
    }

    public function test_actual_http_close_uses_verified_separate_process_n03_broker(): void
    {
        $tx = $this->makeReviewedTransaction('For Information');
        $base = sys_get_temp_dir().'/ot_ops009_http_'.bin2hex(random_bytes(8));
        $vault = $base.'/vault';
        $this->assertTrue(mkdir($vault, 0750, true));

        try {
            $broker = new ProcessStorageBrokerClient(
                brokerRoot: $vault,
                hmacKey: hash('sha256', 'http-custody-'.bin2hex(random_bytes(16))),
                brokerBinary: base_path('bin/legacy-custody-broker'),
                disallowedRoots: BrokerRootAttestation::collectApplicationDisallowedRoots(),
            );
            $namespace = strtolower((string) Str::uuid());
            $rootClaim = $broker->attestRoot($namespace);
            $this->insert($this->root, 'legacy_custody.namespaces', [
                'namespace_id' => $namespace,
                'backend_kind' => $rootClaim['backend_kind'],
                'provider_identity' => $rootClaim['provider_identity'],
                'root_claim' => $rootClaim['root_claim'],
            ]);

            config([
                'work_requests.n03_namespace_id' => $namespace,
                'work_requests.n03_epoch' => 1,
            ]);
            app()->instance(\App\Services\Custody\Contracts\StorageBrokerClient::class, $broker);

            $response = $this->actingAs($this->head)->post('/transactions/'.$tx->id.'/transition', [
                'action' => 'close',
                'remarks' => 'Synthetic HTTP Work Request evidence-based completion',
            ]);
            $response->assertRedirect();

            $this->assertSame('closed', $tx->fresh()->status);
            $event = $tx->events()->where('action', 'close')->sole();
            $this->assertSame(1, $this->auditCount((int) $tx->id));
            $this->assertSame(1, (int) DB::table('platform_notifications')
                ->where('user_id', $this->origin->id)
                ->where('event_key', 'transaction-event-'.$event->id)->count());
            $binding = DB::table('ops009_close_audit_bindings')
                ->where('transaction_id', $tx->id)
                ->where('transaction_event_id', $event->id)->sole();
            $this->assertSame(1, (int) $this->scalar(
                'SELECT count(*) FROM legacy_custody.terminal_receipts WHERE operation_id=? AND outcome=?',
                [$binding->operation_id, 'COMMITTED'],
            ));
            $this->assertSame(1, DB::table('documents')
                ->where('custody_operation_id', $binding->operation_id)->count());
            $this->assertNotSame(getmypid(), $broker->lastBrokerPid());
        } finally {
            app()->forgetInstance(\App\Services\Custody\Contracts\StorageBrokerClient::class);
            if (is_dir($base)) {
                $walk = new \RecursiveIteratorIterator(
                    new \RecursiveDirectoryIterator($base, \FilesystemIterator::SKIP_DOTS),
                    \RecursiveIteratorIterator::CHILD_FIRST,
                );
                foreach ($walk as $item) {
                    if ($item->isDir() && ! $item->isLink()) {
                        @rmdir($item->getPathname());
                    } else {
                        @unlink($item->getPathname());
                    }
                }
                @rmdir($base);
            }
        }
    }

    public function test_custody_close_emits_one_safe_origin_notification(): void
    {
        $tx = $this->makeReviewedTransaction('For Information');
        $op = $this->reserveAndStage($this->head);
        $result = $this->executeClose($op, $tx, $this->head);
        $notice = DB::table('platform_notifications')
            ->where('event_key', 'transaction-event-'.$result->eventId)
            ->where('user_id', $this->origin->id)
            ->get();
        fwrite(STDOUT, 'OPS009_C02_NOTIFICATION='.json_encode([
            'event_id' => $result->eventId,
            'origin_notice_count' => $notice->count(),
            'expected' => 1,
        ], JSON_THROW_ON_ERROR)."\n");
        // FAIL, rather than pass source-only coverage, if connection-bound completion omits notice.
        $this->assertCount(1, $notice, 'CUSTODY_NOTIFICATION_PARITY_DEFECT: no originating-office completion notice');
        $this->assertSame('transaction', $notice[0]->source_domain);
        $this->assertStringNotContainsString('Custody case completed.', $notice[0]->message);
    }

    public function test_committed_close_rejects_duplicate_unpaired_audit_and_forged_notice(): void
    {
        $tx = $this->makeReviewedTransaction('For Information');
        $op = $this->reserveAndStage($this->head);
        $result = $this->executeClose($op, $tx, $this->head);
        $this->assertSame('COMMITTED', $result->outcome);
        $this->assertSame(1, (int) DB::table('ops009_close_audit_bindings')
            ->where('operation_id', $op['operation_id'])
            ->where('transaction_id', $tx->id)
            ->where('transaction_event_id', $result->eventId)->count());

        $connection = DB::connection('n03_command');
        $connection->beginTransaction();
        try {
            app(AuditLogger::class)->recordOnConnection(
                connection: $connection,
                actorUserId: (int) $this->head->id,
                actorDepartmentId: (int) $this->receivingOffice->id,
                action: 'transaction.close',
                summary: 'Synthetic duplicate after a committed close',
                correlationId: $op['correlation_id'],
                entityType: WorkflowTransaction::class,
                entityId: (int) $tx->id,
            );
            $connection->statement('SET CONSTRAINTS ops009_close_audit_integrity IMMEDIATE');
            $this->fail('Duplicate close audit was not rejected by PostgreSQL.');
        } catch (QueryException $e) {
            $this->assertSame('23514', (string) $e->getCode());
        } finally {
            $connection->rollBack();
        }
        $this->assertSame(1, $this->auditCount((int) $tx->id));

        $valid = [
            'user_id' => (int) $this->origin->id,
            'department_id' => (int) $this->originOffice->id,
            'event_key' => 'transaction-event-'.$result->eventId,
            'source_domain' => 'transaction',
            'source_type' => WorkflowTransaction::class,
            'source_id' => (int) $tx->id,
            'priority' => 'action_required',
            'title' => 'Transaction completed',
            'message' => $tx->reference_no.' · '.$tx->title,
            'action_url' => '/transactions/'.$tx->id,
            'requires_acknowledgement' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        $probes = [
            'foreign-recipient' => array_replace($valid, ['user_id' => (int) $this->foreignHead->id]),
            'forged-event-key' => array_replace($valid, ['event_key' => 'transaction-event-999999999']),
            'forged-source' => array_replace($valid, ['source_id' => (int) $tx->id + 100000]),
            'forged-title' => array_replace($valid, ['title' => 'Private text injected']),
            'forged-department' => array_replace($valid, ['department_id' => (int) $this->foreignOffice->id]),
        ];
        $denied = [];
        foreach ($probes as $name => $payload) {
            $connection->beginTransaction();
            try {
                $connection->table('platform_notifications')->insert($payload);
                $this->fail('Forged origin notice accepted: '.$name);
            } catch (QueryException $e) {
                $this->assertSame('23514', (string) $e->getCode(), $name);
                $denied[] = $name;
            } finally {
                $connection->rollBack();
            }
        }
        $this->assertCount(count($probes), $denied);
        $this->assertSame(1, (int) DB::table('platform_notifications')
            ->where('event_key', $valid['event_key'])
            ->where('user_id', (int) $this->origin->id)->count());

        // The existing (user_id,event_key) constraint rejects a duplicate,
        // independently of the idempotent ON CONFLICT used by the real effect.
        $connection->beginTransaction();
        try {
            $connection->table('platform_notifications')->insert($valid);
            $this->fail('Duplicate notice unexpectedly inserted.');
        } catch (QueryException $e) {
            $this->assertSame('23505', (string) $e->getCode());
        } finally {
            $connection->rollBack();
        }
        fwrite(STDOUT, 'OPS009_R3_DIRECT_NEGATIVES='.json_encode([
            'audit_duplicate' => '23514',
            'forged_notices_denied' => $denied,
            'notice_duplicate' => '23505',
            'valid_origin_notice_count' => 1,
        ], JSON_THROW_ON_ERROR)."\n");
    }

    public function test_denied_actors_classifications_missing_outcome_and_replay_have_no_side_effects(): void
    {
        $workflow = app(TransactionWorkflowService::class);
        foreach ([$this->staff, $this->admin, $this->foreignHead, $this->origin] as $actor) {
            $tx = $this->makeReviewedTransaction('For Information');
            $op = $this->reserveAndStage($actor);
            $before = $this->delta($tx);
            try {
                $this->executeClose($op, $tx, $actor);
                $this->fail('Unauthorized custody closer unexpectedly succeeded: '.$actor->role);
            } catch (AuthorizationException $expected) {
                $this->assertSame($before, $this->delta($tx));
            }
        }
        foreach (['For Approval', 'For Signature', 'for information', null] as $label) {
            $tx = $this->makeReviewedTransaction($label);
            $op = $this->reserveAndStage($this->head);
            $before = $this->delta($tx);
            try {
                $this->executeClose($op, $tx, $this->head);
                $this->fail('Forbidden classification closed');
            } catch (AuthorizationException $expected) {
                $this->assertSame($before, $this->delta($tx));
            }
        }
        $tx = $this->makeReviewedTransaction('For Information');
        $op = $this->reserveAndStage($this->head);
        try {
            $this->executeClose($op, $tx, $this->head, '  ');
            $this->fail('Empty closure outcome accepted');
        } catch (ValidationException $expected) {
            $this->assertSame('for_review', $tx->fresh()->status);
        }

        $tx = $this->makeReviewedTransaction('For Information');
        $op = $this->reserveAndStage($this->head);
        $this->executeClose($op, $tx, $this->head);
        $events = $tx->events()->where('action', 'close')->count();
        $other = $this->reserveAndStage($this->head);
        try {
            $this->executeClose($other, $tx, $this->head);
            $this->fail('Terminal close replay accepted');
        } catch (AuthorizationException|ValidationException $expected) {
            $this->assertSame($events, $tx->events()->where('action', 'close')->count());
            $this->assertSame(1, $this->auditCount($tx->id));
        }
    }

    public function test_live_inactive_and_stale_actor_state_denied_on_n03_command(): void
    {
        $tx = $this->makeReviewedTransaction('For Information');
        $op = $this->reserveAndStage($this->head);
        $old = (int) $this->head->session_version;
        $this->head->increment('session_version');
        try {
            $this->executeClose($op, $tx, $this->head, 'Custody case completed.', $old);
            $this->fail('Stale session accepted');
        } catch (AuthorizationException $expected) {
            $this->assertSame('for_review', $tx->fresh()->status);
        }

        $tx2 = $this->makeReviewedTransaction('For Information');
        $op2 = $this->reserveAndStage($this->head);
        $this->head->update(['is_active' => false]);
        try {
            $this->executeClose($op2, $tx2, $this->head);
            $this->fail('Inactive account accepted');
        } catch (AuthorizationException $expected) {
            $this->assertSame('for_review', $tx2->fresh()->status);
        }
    }

    public function test_cutpoint_failure_rolls_back_status_event_audit_document_and_custody_receipt(): void
    {
        $tx = $this->makeReviewedTransaction('For Information');
        $op = $this->reserveAndStage($this->head);
        $before = $this->delta($tx);
        $sentinel = 'OPS009_ROLLBACK_'.Str::uuid();
        try {
            $this->executeClose($op, $tx, $this->head, 'Custody case completed.', null, $sentinel);
            $this->fail('Custody cut-point unexpectedly committed');
        } catch (RuntimeException $e) {
            $this->assertSame($sentinel, $e->getMessage());
        }
        $this->assertSame($before, $this->delta($tx));
        $this->assertSame('for_review', $tx->fresh()->status);
        $this->assertNull($tx->fresh()->completed_at);
        $this->assertSame(0, (int) $this->scalar('SELECT count(*) FROM legacy_custody.terminal_receipts WHERE operation_id=?', [$op['operation_id']]));
    }

    public function test_no_eligible_requester_with_real_origin_head_creates_exactly_one_atomic_delivery_gap(): void
    {
        $transaction = $this->makeReviewedTransaction('For Information');
        // A non-separated, currently active office head exists independently
        // from the original requester. Do not invent a municipal designation.
        $custodian = $this->makeActor($this->originOffice, 'department_head');
        $this->origin->update(['is_active' => false]);

        $op = $this->reserveAndStage($this->head);
        $result = $this->executeClose($op, $transaction, $this->head);

        $this->assertSame('COMMITTED', $result->outcome);
        $this->assertSame('closed', $transaction->fresh()->status);
        $this->assertSame(0, (int) DB::table('platform_notifications')
            ->where('event_key', 'transaction-event-'.$result->eventId)->count());

        $exception = DB::table('ops009_origin_delivery_exceptions')
            ->where('operation_id', $op['operation_id'])->sole();
        $this->assertSame((int) $transaction->id, (int) $exception->transaction_id);
        $this->assertSame((int) $result->eventId, (int) $exception->transaction_event_id);
        $this->assertSame((int) $this->originOffice->id, (int) $exception->origin_department_id);
        $this->assertSame('department_head', $exception->custodian_role);
        $this->assertSame(1, $this->auditCount((int) $transaction->id));
        $this->assertSame(1, (int) $this->scalar(
            'SELECT count(*) FROM legacy_custody.terminal_receipts WHERE operation_id=? AND outcome=?',
            [$op['operation_id'], 'COMMITTED'],
        ));

        // A foreign legitimate Head may access their OWN empty office queue,
        // but must never see or mutate an exception belonging to this origin.
        $this->actingAs($this->foreignHead)
            ->get('/work-requests/origin-delivery-exceptions')
            ->assertOk()->assertDontSee($transaction->reference_no);
        $this->actingAs($this->admin)
            ->get('/work-requests/origin-delivery-exceptions')->assertForbidden();

        $this->actingAs($custodian)->get('/work-requests/origin-delivery-exceptions')
            ->assertOk();
        $path = '/work-requests/origin-delivery-exceptions/'.$exception->id.'/actions';
        $this->actingAs($this->foreignHead)->post($path, [
            'action' => 'acknowledge', 'note' => 'Foreign office must not acknowledge',
        ])->assertNotFound();
        $this->actingAs($custodian)->post($path, [
            'action' => 'resolve', 'note' => 'Attempted premature resolution',
        ])->assertSessionHasErrors('action');
        $this->actingAs($custodian)->post($path, [
            'action' => 'acknowledge', 'note' => 'Synthetic owner accepted delivery gap case',
        ])->assertRedirect();
        $this->actingAs($custodian)->post($path, [
            'action' => 'resolve', 'note' => 'Synthetic follow-up documented for audit',
        ])->assertRedirect();
        $this->assertSame(2, DB::table('ops009_origin_delivery_exception_actions')
            ->where('exception_id', $exception->id)->count());
        $this->actingAs($custodian)->post($path, [
            'action' => 'resolve', 'note' => 'Attempted duplicate resolution',
        ])->assertSessionHasErrors('action');
    }

    public function test_no_recipient_and_no_authorized_origin_head_cannot_commit_close(): void
    {
        $transaction = $this->makeReviewedTransaction('For Information');
        // The only originating Head is also the now-inactive requester.
        $this->origin->update(['is_active' => false]);

        $op = $this->reserveAndStage($this->head);
        $before = $this->delta($transaction);
        try {
            $this->executeClose($op, $transaction, $this->head);
            $this->fail('Close committed with neither eligible recipient nor actionable escalation custodian.');
        } catch (CustodyViolationException $expected) {
            $this->assertStringContainsString('no active authorized office escalation', strtolower($expected->getMessage()));
        }
        $this->assertSame($before, $this->delta($transaction));
        $this->assertSame('for_review', $transaction->fresh()->status);
        $this->assertSame(0, DB::table('ops009_origin_delivery_exceptions')
            ->where('operation_id', $op['operation_id'])->count());
        $this->assertSame(0, (int) $this->scalar(
            'SELECT count(*) FROM legacy_custody.terminal_receipts WHERE operation_id=?',
            [$op['operation_id']],
        ));
    }

    private function makeReviewedTransaction(?string $classification): WorkflowTransaction
    {
        $workflow = app(TransactionWorkflowService::class);
        $tx = $workflow->create($this->origin, [
            'transaction_type' => 'internal_request',
            'title' => 'OPS009 synthetic custody close',
            'priority' => 'normal',
            'target_department_id' => $this->receivingOffice->id,
            'action_required' => $classification,
        ]);
        return $workflow->transition($this->head, $tx, 'mark_review');
    }

    private function executeClose(
        array $operation,
        WorkflowTransaction $tx,
        User $actor,
        ?string $remarks = 'Custody case completed.',
        ?int $expectedSessionVersion = null,
        ?string $failure = null,
    ): mixed {
        return app(LegacyCustodyCommandService::class)->execute(
            operationId: $operation['operation_id'],
            businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $verified, string $correlation): ProducedSourceEvent =>
                app(TransactionWorkflowService::class)->transitionWithEventOnConnection(
                    $conn, $verified, (int) $tx->id, 'close', $correlation, remarks: $remarks,
                ),
            expectedSessionVersion: $expectedSessionVersion ?? (int) $actor->session_version,
            expectedRole: $actor->role,
            cutPointHook: $failure === null ? null : static function (string $point) use ($failure): void {
                if ($point === 'after_receipt') {
                    throw new RuntimeException($failure);
                }
            },
        );
    }

    private function delta(WorkflowTransaction $tx): array
    {
        return [
            'events' => $tx->events()->where('action', 'close')->count(),
            'audit' => $this->auditCount($tx->id),
            'notices' => DB::table('platform_notifications')->where('source_domain', 'transaction')
                ->where('source_id', $tx->id)->count(),
            'documents' => DB::table('documents')->count(),
            'links' => DB::table('document_links')->count(),
            'receipts' => (int) $this->scalar('SELECT count(*) FROM legacy_custody.terminal_receipts'),
        ];
    }

    private function auditCount(int $transactionId): int
    {
        return (int) DB::table('audit_logs')->where('entity_type', WorkflowTransaction::class)
            ->where('entity_id', $transactionId)->where('action', 'transaction.close')->count();
    }

    private function makeOffice(string $prefix): Department
    {
        return Department::query()->create([
            'code' => $prefix.'-'.Str::upper(Str::random(8)),
            'name' => 'OPS009 Synthetic '.$prefix,
            'short_name' => $prefix,
            'branch' => 'executive',
            'office_type' => 'department',
            'is_active' => true,
            'is_routable' => true,
            'sort_order' => 10,
        ]);
    }

    private function makeActor(Department $office, string $role): User
    {
        $user = User::query()->create([
            'name' => 'OPS009 '.Str::random(8),
            'email' => Str::random(12).'@example.test',
            'password' => 'synthetic-only',
            'role' => $role,
            'is_active' => true,
            'account_status' => 'active',
            'session_version' => 1,
        ]);
        Employee::query()->create([
            'employee_number' => 'O9-'.Str::upper(Str::random(10)),
            'full_name' => $user->name,
            'work_email' => $user->email,
            'user_id' => $user->id,
            'department_id' => $office->id,
            'position_title' => 'Synthetic Officer',
            'employment_status' => 'active',
        ]);
        return $user->fresh('employee.department');
    }

    private function connect(string $role, string $env): PDO
    {
        $password = (string) getenv($env);
        if ($password === '') {
            throw new RuntimeException('Disposable role credential missing: '.$env);
        }
        $db = 'pgsql:host='.(getenv('DB_HOST') ?: '127.0.0.1')
            .';port='.(getenv('DB_PORT') ?: '5432').';dbname=talibon_portal_test';
        $pdo = new PDO($db, $role, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        $this->assertSame($role, $pdo->query('SELECT session_user')->fetchColumn());
        $pdo->exec("SET lock_timeout='2000ms'; SET statement_timeout='15s'");
        $this->connections[] = $pdo;
        return $pdo;
    }

    private function insert(PDO $db, string $table, array $cols): void
    {
        $keys = implode(',', array_keys($cols));
        $vars = implode(',', array_fill(0, count($cols), '?'));
        $stmt = $db->prepare("INSERT INTO {$table} ({$keys}) VALUES ({$vars})");
        $stmt->execute(array_values($cols));
    }

    private function scalar(string $query, array $values = []): mixed
    {
        $stmt = $this->root->prepare($query);
        $stmt->execute($values);
        return $stmt->fetchColumn();
    }

    private function reserveAndStage(User $actor): array
    {
        $id = (string) Str::uuid();
        $generation = (string) Str::uuid();
        $op = [
            'operation_id' => $id,
            'namespace_id' => $this->namespace,
            'epoch' => 1,
            'actor_user_id' => $actor->id,
            'office_id' => $actor->employee->department_id,
            'service_identity' => 'ops009-ci-test',
            'command_kind' => 'transaction_transition',
            'command_action' => 'close',
            'correlation_id' => (string) Str::uuid(),
            'idempotency_hash' => hash('sha256', $id.':idem'),
            'item_count' => 1,
            'manifest_digest' => hash('sha256', $id.':manifest'),
        ];
        $item = [
            'operation_id' => $id,
            'ordinal' => 1,
            'generation_id' => $generation,
            'namespace_id' => $this->namespace,
            'epoch' => 1,
            'locator' => 'objects/'.substr($generation, 0, 2).'/'.$generation.'.blob',
            'size_bytes' => 2048,
            'sha256' => hash('sha256', 'ops009-'.$id),
            'mime_type' => 'application/pdf',
        ];
        $this->stage->beginTransaction();
        try {
            $this->insert($this->stage, 'legacy_custody.operations', $op);
            $this->insert($this->stage, 'legacy_custody.operation_items', $item);
            $this->insert($this->stage, 'legacy_custody.operation_gates', ['operation_id' => $id]);
            $this->stage->commit();
        } catch (Throwable $e) {
            $this->stage->rollBack();
            throw $e;
        }
        $this->insert($this->stage, 'legacy_custody.generations', $item + [
            'provider_object_identity' => 'local_v1:2:'.random_int(1000, 9999999).':'.$generation,
            'staged_fence' => 1,
            'staging_receipt_id' => (string) Str::uuid(),
        ]);
        return $op;
    }
}
