<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\Custody\Exceptions\CustodyFenceClosedException;
use App\Domain\Custody\Exceptions\CustodyIdempotencyMismatchException;
use App\Domain\Custody\Exceptions\CustodyOperationAbortedException;
use App\Domain\Custody\Exceptions\CustodyOperationPendingException;
use App\Domain\Custody\Exceptions\CustodyViolationException;
use App\Domain\Custody\ProducedSourceEvent;
use App\Domain\Custody\VerifiedCommandActor;
use App\Domain\TravelOrders\TravelOrderStatus;
use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\Custody\LegacyCustodyCommandService;
use App\Services\Custody\LegacyCustodyReplayService;
use App\Services\TravelOrderService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PDO;
use PDOException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;
use RuntimeException;
use Tests\TestCase;

/**
 * Real-role N03 G2B Travel Order command provenance, same-connection atomicity,
 * replay, and least-privilege role boundary suite.
 *
 * Never use RefreshDatabase here: runs against a provisioned disposable PG16
 * cluster with real non-owner roles (n03_stage, n03_command, n03_reconcile,
 * kirion_g1b_app, kirion_g1b_custody).
 */
#[Group('n03-g2b-role')]
final class LegacyCustodyG2BTravelOrderCommandTest extends TestCase
{
    private PDO $root;

    private PDO $stage;

    private PDO $command;

    private PDO $reconcile;

    private PDO $ordinary;

    private PDO $plan;

    private Department $mayorOffice;

    private Department $otherOffice;

    private User $mayorActor;

    private Employee $issuedEmployee;

    private string $namespace;

    /** @var list<PDO> */
    private array $connections = [];

    protected function setUp(): void
    {
        parent::setUp();

        if (! app()->environment('testing')
            || getenv('N03_DISPOSABLE_LEASE') !== 'EXCLUSIVE_PG16_SYNTHETIC_ONLY'
            || getenv('N03_G2B_ROLE_SUITE') !== '1') {
            throw new RuntimeException('N03 G2B real-role tests require APP_ENV=testing, N03_DISPOSABLE_LEASE=EXCLUSIVE_PG16_SYNTHETIC_ONLY, and N03_G2B_ROLE_SUITE=1.');
        }

        $this->root = $this->connect('postgres', 'DB_PASSWORD');
        $this->stage = $this->connect('n03_stage', 'N03_STAGE_PASSWORD');
        $this->command = $this->connect('n03_command', 'N03_COMMAND_PASSWORD');
        $this->reconcile = $this->connect('n03_reconcile', 'N03_RECONCILE_PASSWORD');
        $this->ordinary = $this->connect('kirion_g1b_app', 'G1B_APP_PASSWORD');
        $this->plan = $this->connect('kirion_g1b_custody', 'G1B_CUSTODY_PASSWORD');

        $this->configureLaravelRoleConnections();

        $this->mayorOffice = Department::query()->firstOrCreate(
            ['code' => 'MAYOR'],
            [
                'name' => 'Office of the Municipal Mayor',
                'short_name' => 'MAYOR',
                'branch' => 'executive',
                'office_type' => 'department',
                'is_active' => true,
                'is_routable' => true,
                'sort_order' => 1,
            ],
        );
        $this->mayorOffice->forceFill(['is_active' => true, 'is_routable' => true])->save();

        $this->otherOffice = Department::query()->create([
            'code' => 'G2B-'.Str::upper(Str::random(8)),
            'name' => 'Synthetic Engineering Office',
            'short_name' => 'ENG',
            'branch' => 'executive',
            'office_type' => 'department',
            'is_active' => true,
            'is_routable' => true,
            'sort_order' => 20,
        ]);

        $this->mayorActor = $this->makeActor($this->mayorOffice, 'mayor_approver');
        $this->issuedEmployee = $this->makeActor($this->otherOffice, 'department_staff')->employee;

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
        foreach ($this->connections as $connection) {
            if ($connection->inTransaction()) {
                $connection->rollBack();
            }
        }
        $this->connections = [];
        DB::purge('n03_stage');
        DB::purge('n03_command');
        DB::purge('n03_reconcile');
        parent::tearDown();
    }

    private function configureLaravelRoleConnections(): void
    {
        $host = (string) (getenv('DB_HOST') ?: '127.0.0.1');
        $port = (string) (getenv('DB_PORT') ?: '5432');
        $db = (string) (getenv('DB_DATABASE') ?: 'talibon_portal_test');

        foreach ([
            'n03_stage' => ['n03_stage', 'N03_STAGE_PASSWORD'],
            'n03_command' => ['n03_command', 'N03_COMMAND_PASSWORD'],
            'n03_reconcile' => ['n03_reconcile', 'N03_RECONCILE_PASSWORD'],
        ] as $name => [$role, $envVar]) {
            config([
                "database.connections.{$name}.host" => $host,
                "database.connections.{$name}.port" => $port,
                "database.connections.{$name}.database" => $db,
                "database.connections.{$name}.username" => $role,
                "database.connections.{$name}.password" => (string) getenv($envVar),
            ]);
            DB::purge($name);
        }
    }

    private function connect(string $role, string $envVar): PDO
    {
        $password = getenv($envVar);
        if (! is_string($password) || $password === '') {
            throw new RuntimeException("Missing disposable credential [{$envVar}] for {$role}.");
        }

        $host = (string) (getenv('DB_HOST') ?: '127.0.0.1');
        $port = (string) (getenv('DB_PORT') ?: '5432');
        $db = (string) (getenv('DB_DATABASE') ?: 'talibon_portal_test');

        $pdo = new PDO("pgsql:host={$host};port={$port};dbname={$db}", $role, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        $this->assertSame($role, $pdo->query('SELECT session_user')->fetchColumn());
        $this->assertSame($role, $pdo->query('SELECT current_user')->fetchColumn());
        $pdo->exec("SET lock_timeout='2000ms'; SET statement_timeout='15s'");
        $this->connections[] = $pdo;

        return $pdo;
    }

    private function makeActor(Department $department, string $role): User
    {
        $actor = User::query()->create([
            'name' => 'G2B '.Str::random(8),
            'email' => Str::random(12).'@example.test',
            'password' => 'synthetic-password',
            'role' => $role,
            'is_active' => true,
            'account_status' => 'active',
            'session_version' => 1,
        ]);

        Employee::query()->create([
            'employee_number' => 'G2B-'.Str::upper(Str::random(10)),
            'full_name' => $actor->name,
            'work_email' => $actor->email,
            'user_id' => $actor->id,
            'department_id' => $department->id,
            'position_title' => 'Synthetic Officer',
            'employment_status' => 'active',
        ]);

        return $actor->fresh('employee.department');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function insert(PDO $pdo, string $table, array $data, ?string $returning = null): mixed
    {
        $cols = implode(',', array_keys($data));
        $params = implode(',', array_fill(0, count($data), '?'));
        $stmt = $pdo->prepare("INSERT INTO {$table} ({$cols}) VALUES ({$params})".($returning ? " RETURNING {$returning}" : ''));
        $stmt->execute(array_values($data));

        return $returning ? $stmt->fetchColumn() : null;
    }

    /**
     * @param  array<int, mixed>  $params
     */
    private function scalar(string $sql, array $params = []): mixed
    {
        $stmt = $this->root->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchColumn();
    }

    /**
     * @return array{0: array<string, mixed>, 1: list<array<string, mixed>>}
     */
    private function reserveAndStage(
        User $actor,
        string $kind,
        string $action,
        int $itemCount = 1,
        ?int $officeOverride = null,
    ): array {
        $operationId = (string) Str::uuid();
        $officeId = $officeOverride ?? (int) $actor->employee->department_id;

        $op = [
            'operation_id' => $operationId,
            'namespace_id' => $this->namespace,
            'epoch' => 1,
            'actor_user_id' => (int) $actor->id,
            'office_id' => $officeId,
            'service_identity' => 'g2b-travel-test',
            'command_kind' => $kind,
            'command_action' => $action,
            'correlation_id' => (string) Str::uuid(),
            'idempotency_hash' => hash('sha256', $operationId.':idem'),
            'item_count' => $itemCount,
            'manifest_digest' => hash('sha256', $operationId.':manifest'),
        ];

        $items = [];
        for ($i = 1; $i <= $itemCount; $i++) {
            $genId = (string) Str::uuid();
            $items[] = [
                'operation_id' => $operationId,
                'ordinal' => $i,
                'generation_id' => $genId,
                'namespace_id' => $this->namespace,
                'epoch' => 1,
                'locator' => 'objects/'.substr($genId, 0, 2).'/'.$genId.'.blob',
                'size_bytes' => 1024 * $i,
                'sha256' => hash('sha256', "payload-{$operationId}-{$i}"),
                'mime_type' => $i % 2 === 1 ? 'application/pdf' : 'image/png',
            ];
        }

        $this->stage->beginTransaction();
        $this->insert($this->stage, 'legacy_custody.operations', $op);
        foreach ($items as $item) {
            $this->insert($this->stage, 'legacy_custody.operation_items', $item);
        }
        $this->insert($this->stage, 'legacy_custody.operation_gates', ['operation_id' => $operationId]);
        $this->stage->commit();

        foreach ($items as $item) {
            $this->insert($this->stage, 'legacy_custody.generations', $item + [
                'provider_object_identity' => 'local_v1:1:'.random_int(1000, 9999999).':'.$item['generation_id'],
                'staged_fence' => 1,
                'staging_receipt_id' => (string) Str::uuid(),
            ]);
        }

        return [$op, $items];
    }

    /**
     * @return array<string, int>
     */
    private function tableCounts(): array
    {
        $tables = [
            'public.travel_orders',
            'public.travel_order_employee',
            'public.travel_order_events',
            'public.documents',
            'public.document_links',
            'public.audit_logs',
            'legacy_custody.command_results',
            'legacy_custody.bindings',
            'legacy_custody.ownership_links',
            'legacy_custody.terminal_receipts',
        ];
        $counts = [];
        foreach ($tables as $table) {
            $counts[$table] = (int) $this->scalar("SELECT count(*) FROM {$table}");
        }

        return $counts;
    }

    /**
     * @return array<string, mixed>
     */
    private function travelPayload(): array
    {
        return [
            'reference_number' => 'TO-G2B-'.Str::upper(Str::random(8)),
            'issuance_date' => '2026-11-20',
            'purpose' => 'Attend provincial fiscal planning conference',
            'destination' => 'Tagbilaran City, Bohol',
            'department_id' => $this->otherOffice->id,
            'travel_start_date' => '2026-11-21',
            'travel_end_date' => '2026-11-22',
            'employee_ids' => [$this->issuedEmployee->id],
        ];
    }

    public function test_b01_b02_travel_order_record_and_status_commit_atomically_on_real_n03_command(): void
    {
        $commandService = app(LegacyCustodyCommandService::class);
        $travelService = app(TravelOrderService::class);

        [$recordOp, $recordItems] = $this->reserveAndStage($this->mayorActor, 'travel_record', 'record', 2);

        $recordOutcome = $commandService->execute(
            operationId: $recordOp['operation_id'],
            businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $travelService->recordApprovedOnCustodyConnection($conn, $actor, $this->travelPayload(), $corr),
            itemMetadataByOrdinal: [
                1 => ['title' => 'Approved TO Scan.pdf', 'original_name' => 'Approved TO Scan.pdf'],
                2 => ['title' => 'Mayor Signature Page.png', 'original_name' => 'Mayor Signature Page.png'],
            ],
        );

        $this->assertFalse($recordOutcome->replayed);
        $this->assertSame('COMMITTED', $recordOutcome->outcome);
        $this->assertSame('travel', $recordOutcome->sourceKind);
        $this->assertSame('recorded_approved', $recordOutcome->eventAction);
        $this->assertCount(2, $recordOutcome->documents);

        $this->assertSame(1, (int) $this->scalar('SELECT count(*) FROM public.travel_orders WHERE id=?', [$recordOutcome->sourceId]));
        $this->assertSame(1, (int) $this->scalar('SELECT count(*) FROM public.travel_order_employee WHERE travel_order_id=? AND employee_id=?', [$recordOutcome->sourceId, $this->issuedEmployee->id]));
        $this->assertSame(1, (int) $this->scalar("SELECT count(*) FROM public.travel_order_events WHERE id=? AND event='recorded_approved'", [$recordOutcome->eventId]));
        $this->assertSame(1, (int) $this->scalar("SELECT count(*) FROM public.audit_logs WHERE entity_type='travel_order' AND entity_id=? AND action='travel_order.recorded' AND custody_operation_id IS NULL AND correlation_id=?", [$recordOutcome->sourceId, $recordOp['correlation_id']]));
        $this->assertSame(2, (int) $this->scalar("SELECT count(*) FROM public.documents WHERE custody_operation_id=? AND custody_mode='REGISTRY_V1' AND security_domain='LEGACY_CTW' AND storage_disk='legacy_registry_v1' AND storage_path IS NULL AND document_type='supporting_document'", [$recordOp['operation_id']]));
        $this->assertSame(2, (int) $this->scalar("SELECT count(*) FROM public.audit_logs WHERE custody_operation_id=? AND entity_type='document' AND action='document.uploaded'", [$recordOp['operation_id']]));
        $this->assertSame(2, (int) $this->scalar('SELECT count(*) FROM legacy_custody.bindings WHERE operation_id=?', [$recordOp['operation_id']]));

        foreach ($recordOutcome->documents as $doc) {
            $this->assertSame(2, (int) $this->scalar('SELECT count(*) FROM public.document_links WHERE document_id=?', [$doc['document_id']]));
            $this->assertSame(2, (int) $this->scalar('SELECT count(*) FROM legacy_custody.ownership_links WHERE binding_document_id=?', [$doc['document_id']]));
        }

        // Now perform travel_status transition on the same Travel Order with 1 evidence file.
        [$statusOp] = $this->reserveAndStage($this->mayorActor, 'travel_status', 'status', 1);

        $statusOutcome = $commandService->execute(
            operationId: $statusOp['operation_id'],
            businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $travelService->changeStatusOnCustodyConnection(
                $conn,
                $actor,
                $recordOutcome->sourceId,
                TravelOrderStatus::Completed,
                $corr,
                'Returned from official travel.',
            ),
        );

        $this->assertSame('COMMITTED', $statusOutcome->outcome);
        $this->assertSame('status_changed', $statusOutcome->eventAction);
        $this->assertSame('completed', $this->scalar('SELECT status FROM public.travel_orders WHERE id=?', [$recordOutcome->sourceId]));
        $this->assertSame(1, (int) $this->scalar("SELECT count(*) FROM public.audit_logs WHERE entity_type='travel_order' AND entity_id=? AND action='travel_order.status_changed' AND custody_operation_id IS NULL AND correlation_id=?", [$recordOutcome->sourceId, $statusOp['correlation_id']]));
        $this->assertSame('action_evidence', $this->scalar('SELECT document_type FROM public.documents WHERE id=?', [$statusOutcome->documents[0]['document_id']]));
        $this->assertSame(1, (int) $this->scalar('SELECT count(*) FROM public.document_links WHERE document_id=?', [$statusOutcome->documents[0]['document_id']]));
        $this->assertSame(1, (int) $this->scalar('SELECT count(*) FROM legacy_custody.ownership_links WHERE binding_document_id=?', [$statusOutcome->documents[0]['document_id']]));
    }

    public static function actorDenialScenarios(): array
    {
        return [
            ['inactive_user'],
            ['suspended_user'],
            ['separated_status'],
            ['separation_date_set'],
            ['moved_office'],
            ['inactive_department'],
            ['wrong_role'],
            ['stale_session_version'],
        ];
    }

    #[DataProvider('actorDenialScenarios')]
    public function test_g2b_n01_fresh_actor_and_office_denials_abort_cleanly(string $scenario): void
    {
        $office = Department::query()->create([
            'code' => 'MAYOR-'.Str::upper(Str::random(6)),
            'name' => 'Temporary Office',
            'short_name' => 'TMP',
            'branch' => 'executive',
            'office_type' => 'department',
            'is_active' => true,
            'is_routable' => true,
            'sort_order' => 30,
        ]);

        $actor = $scenario === 'inactive_department'
            ? $this->makeActor($office, 'mayor_approver')
            : ($scenario === 'wrong_role'
                ? $this->makeActor($this->mayorOffice, 'department_head')
                : $this->makeActor($this->mayorOffice, 'mayor_approver'));

        [$op] = $this->reserveAndStage($actor, 'travel_record', 'record', 1);

        $expectedSessionVersion = null;
        if ($scenario === 'inactive_user') {
            $actor->forceFill(['is_active' => false])->save();
        } elseif ($scenario === 'suspended_user') {
            $actor->forceFill(['account_status' => 'suspended', 'suspended_at' => now()])->save();
        } elseif ($scenario === 'separated_status') {
            $actor->employee->forceFill(['employment_status' => 'separated'])->save();
        } elseif ($scenario === 'separation_date_set') {
            $actor->employee->forceFill(['separation_date' => '2026-11-19'])->save();
        } elseif ($scenario === 'moved_office') {
            $actor->employee->forceFill(['department_id' => $this->otherOffice->id])->save();
        } elseif ($scenario === 'inactive_department') {
            $office->forceFill(['is_active' => false])->save();
        } elseif ($scenario === 'stale_session_version') {
            $actor->forceFill(['session_version' => 2])->save();
            $expectedSessionVersion = 1;
        }

        $before = $this->tableCounts();
        $commandService = app(LegacyCustodyCommandService::class);
        $travelService = app(TravelOrderService::class);

        try {
            $commandService->execute(
                operationId: $op['operation_id'],
                businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $verified, string $corr): ProducedSourceEvent => $travelService->recordApprovedOnCustodyConnection($conn, $verified, $this->travelPayload(), $corr),
                expectedSessionVersion: $expectedSessionVersion,
            );
            $this->fail("Scenario [{$scenario}] unexpectedly succeeded.");
        } catch (AuthorizationException $e) {
            $this->assertNotEmpty($e->getMessage());
        }

        $this->assertSame($before, $this->tableCounts());
    }

    public function test_g2b_n02_n03_default_connection_bypass_and_least_privilege_sql_denials(): void
    {
        [$op] = $this->reserveAndStage($this->mayorActor, 'travel_record', 'record', 1);

        // 1. Refuses pinning command service to default connection.
        $badPinService = new LegacyCustodyCommandService(app(AuditLogger::class), 'pgsql');
        $this->expectException(CustodyViolationException::class);
        try {
            $badPinService->execute(
                operationId: $op['operation_id'],
                businessCommand: fn (): ProducedSourceEvent => throw new RuntimeException('Should never execute'),
            );
        } finally {
            // Also test real SQL denials on n03_command directly.
            $this->assertSqlDenied($this->command, '23514', fn () => $this->insert($this->command, 'public.audit_logs', [
                'actor_user_id' => $this->mayorActor->id,
                'actor_department_id' => $this->mayorOffice->id,
                'action' => 'document.uploaded',
                'entity_type' => 'document',
                'entity_id' => 999999,
                'outcome' => 'allowed',
                'summary' => 'Forged unmarked upload audit',
                'correlation_id' => (string) Str::uuid(),
                'integration_client_id' => null,
                'custody_operation_id' => null,
            ]));

            $this->assertSqlDenied($this->command, '23514', fn () => $this->insert($this->command, 'public.audit_logs', [
                'actor_user_id' => $this->mayorActor->id,
                'actor_department_id' => $this->mayorOffice->id,
                'action' => 'user.escalated',
                'entity_type' => 'user',
                'entity_id' => $this->mayorActor->id,
                'outcome' => 'allowed',
                'summary' => 'Unlisted audit action',
                'correlation_id' => (string) Str::uuid(),
                'integration_client_id' => null,
                'custody_operation_id' => null,
            ]));

            $this->assertSqlDenied($this->command, '42501', fn () => $this->command->exec("UPDATE public.users SET role='system_admin' WHERE id={$this->mayorActor->id}"));
            $this->assertSqlDenied($this->command, '42501', fn () => $this->command->exec('DELETE FROM public.travel_orders'));
            $this->assertSqlDenied($this->command, '42501', fn () => $this->command->exec('TRUNCATE public.travel_orders'));
            $this->assertSqlDenied($this->command, '42501', fn () => $this->command->exec('SELECT password FROM public.users LIMIT 1'));
            $this->assertSqlDenied($this->ordinary, '42501', fn () => $this->ordinary->query('SELECT * FROM legacy_custody.command_results'));
        }
    }

    public function test_g2b_n04_replayed_travel_event_binding_denied_with_23505(): void
    {
        $commandService = app(LegacyCustodyCommandService::class);
        $travelService = app(TravelOrderService::class);

        [$op1] = $this->reserveAndStage($this->mayorActor, 'travel_record', 'record', 1);
        $first = $commandService->execute(
            operationId: $op1['operation_id'],
            businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $travelService->recordApprovedOnCustodyConnection($conn, $actor, $this->travelPayload(), $corr),
        );

        [$op2] = $this->reserveAndStage($this->mayorActor, 'travel_record', 'record', 1);
        $before = $this->tableCounts();

        try {
            $commandService->execute(
                operationId: $op2['operation_id'],
                businessCommand: static fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => new ProducedSourceEvent(
                    sourceKind: 'travel',
                    sourceId: $first->sourceId,
                    eventId: $first->eventId,
                    eventAction: 'recorded_approved',
                    actorUserId: $actor->userId,
                    officeId: $actor->officeId,
                    correlationId: $corr,
                ),
            );
            $this->fail('Replayed travel_order_events binding unexpectedly succeeded.');
        } catch (QueryException $e) {
            $this->assertSame('23505', (string) ($e->errorInfo[0] ?? $e->getCode()));
            $this->assertStringContainsString('n03_command_results_unique_travel_event', $e->getMessage());
        }

        $this->assertSame($before, $this->tableCounts());
    }

    public function test_b03_g2b_n05_replay_returns_persisted_outcome_zero_rows_and_denies_mismatches_and_noncommitted(): void
    {
        $commandService = app(LegacyCustodyCommandService::class);
        $replayService = app(LegacyCustodyReplayService::class);
        $travelService = app(TravelOrderService::class);

        [$op, $items] = $this->reserveAndStage($this->mayorActor, 'travel_record', 'record', 2);

        $expectedItems = array_map(
            static fn (array $item): array => [
                'ordinal' => (int) $item['ordinal'],
                'size_bytes' => (int) $item['size_bytes'],
                'sha256' => (string) $item['sha256'],
                'mime_type' => (string) $item['mime_type'],
            ],
            $items,
        );

        // Pending OPEN operation must throw CustodyOperationPendingException.
        try {
            $replayService->lookupOrVerify(
                $op['namespace_id'],
                $op['actor_user_id'],
                $op['office_id'],
                $op['service_identity'],
                $op['command_kind'],
                $op['idempotency_hash'],
                $op['epoch'],
                $op['command_action'],
                $op['item_count'],
                $op['manifest_digest'],
                $expectedItems,
            );
            $this->fail('Pending operation did not throw CustodyOperationPendingException.');
        } catch (CustodyOperationPendingException) {
            // expected
        }

        // Commit operation cleanly.
        $committed = $commandService->execute(
            operationId: $op['operation_id'],
            businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $travelService->recordApprovedOnCustodyConnection($conn, $actor, $this->travelPayload(), $corr),
        );

        $beforeReplay = $this->tableCounts();

        // Exact replay succeeds with zero new rows.
        $replayed = $replayService->lookupOrVerify(
            $op['namespace_id'],
            $op['actor_user_id'],
            $op['office_id'],
            $op['service_identity'],
            $op['command_kind'],
            $op['idempotency_hash'],
            $op['epoch'],
            $op['command_action'],
            $op['item_count'],
            $op['manifest_digest'],
            $expectedItems,
        );

        $this->assertNotNull($replayed);
        $this->assertTrue($replayed->replayed);
        $this->assertSame($committed->operationId, $replayed->operationId);
        $this->assertSame($committed->receiptUuid, $replayed->receiptUuid);
        $this->assertSame($committed->sourceId, $replayed->sourceId);
        $this->assertSame($committed->eventId, $replayed->eventId);
        $this->assertSame($committed->documents, $replayed->documents);
        $this->assertSame($beforeReplay, $this->tableCounts());

        // Unknown key returns null.
        $this->assertNull($replayService->lookupOrVerify(
            $op['namespace_id'],
            $op['actor_user_id'],
            $op['office_id'],
            $op['service_identity'],
            $op['command_kind'],
            hash('sha256', 'brand-new-key'),
            $op['epoch'],
            $op['command_action'],
            $op['item_count'],
            $op['manifest_digest'],
            $expectedItems,
        ));

        // Fieldwise mismatch checks: epoch, manifest_digest, item size_bytes, item sha256, item mime_type.
        $mutatedCases = [
            ['epoch' => 2, 'manifest' => $op['manifest_digest'], 'items' => $expectedItems],
            ['epoch' => 1, 'manifest' => str_repeat('f', 64), 'items' => $expectedItems],
            ['epoch' => 1, 'manifest' => $op['manifest_digest'], 'items' => [$expectedItems[0], array_replace($expectedItems[1], ['size_bytes' => 9999])]],
            ['epoch' => 1, 'manifest' => $op['manifest_digest'], 'items' => [$expectedItems[0], array_replace($expectedItems[1], ['sha256' => str_repeat('0', 64)])]],
            ['epoch' => 1, 'manifest' => $op['manifest_digest'], 'items' => [$expectedItems[0], array_replace($expectedItems[1], ['mime_type' => 'image/jpeg'])]],
        ];
        foreach ($mutatedCases as $idx => $case) {
            try {
                $replayService->lookupOrVerify(
                    $op['namespace_id'],
                    $op['actor_user_id'],
                    $op['office_id'],
                    $op['service_identity'],
                    $op['command_kind'],
                    $op['idempotency_hash'],
                    $case['epoch'],
                    $op['command_action'],
                    $op['item_count'],
                    $case['manifest'],
                    $case['items'],
                );
                $this->fail("Mismatch case #{$idx} unexpectedly passed.");
            } catch (CustodyIdempotencyMismatchException) {
                // expected
            }
        }

        // CLOSED gate without terminal receipt -> CustodyFenceClosedException; ABORTED -> CustodyOperationAbortedException.
        [$abortOp, $abortItems] = $this->reserveAndStage($this->mayorActor, 'travel_record', 'record', 1);
        $abortExpected = [[
            'ordinal' => 1,
            'size_bytes' => (int) $abortItems[0]['size_bytes'],
            'sha256' => (string) $abortItems[0]['sha256'],
            'mime_type' => (string) $abortItems[0]['mime_type'],
        ]];

        $stmt = $this->reconcile->prepare("UPDATE legacy_custody.operation_gates SET state='CLOSED', fence_no=2 WHERE operation_id=?");
        $stmt->execute([$abortOp['operation_id']]);

        try {
            $replayService->lookupOrVerify(
                $abortOp['namespace_id'],
                $abortOp['actor_user_id'],
                $abortOp['office_id'],
                $abortOp['service_identity'],
                $abortOp['command_kind'],
                $abortOp['idempotency_hash'],
                $abortOp['epoch'],
                $abortOp['command_action'],
                $abortOp['item_count'],
                $abortOp['manifest_digest'],
                $abortExpected,
            );
            $this->fail('CLOSED gate did not throw CustodyFenceClosedException.');
        } catch (CustodyFenceClosedException) {
            // expected
        }

        $this->insert($this->reconcile, 'legacy_custody.terminal_receipts', [
            'operation_id' => $abortOp['operation_id'],
            'outcome' => 'ABORTED',
            'fence_no' => 2,
            'receipt_uuid' => (string) Str::uuid(),
            'manifest_digest' => $abortOp['manifest_digest'],
            'evidence_ref' => 'g2b-test-abort',
            'actor_user_id' => $abortOp['actor_user_id'],
            'service_identity' => $abortOp['service_identity'],
        ]);

        try {
            $replayService->lookupOrVerify(
                $abortOp['namespace_id'],
                $abortOp['actor_user_id'],
                $abortOp['office_id'],
                $abortOp['service_identity'],
                $abortOp['command_kind'],
                $abortOp['idempotency_hash'],
                $abortOp['epoch'],
                $abortOp['command_action'],
                $abortOp['item_count'],
                $abortOp['manifest_digest'],
                $abortExpected,
            );
            $this->fail('ABORTED operation did not throw CustodyOperationAbortedException.');
        } catch (CustodyOperationAbortedException) {
            // expected
        }
    }

    public static function cutPoints(): array
    {
        return [
            ['after_business'],
            ['after_command_result'],
            ['after_document'],
            ['after_audit'],
            ['after_binding'],
            ['after_link'],
            ['after_ownership_link'],
            ['after_receipt'],
        ];
    }

    #[DataProvider('cutPoints')]
    public function test_g2b_n06_deterministic_rollback_at_every_cut_point_leaves_zero_deltas(string $cutPoint): void
    {
        $commandService = app(LegacyCustodyCommandService::class);
        $travelService = app(TravelOrderService::class);

        [$op] = $this->reserveAndStage($this->mayorActor, 'travel_record', 'record', 2);
        $before = $this->tableCounts();
        $sentinel = "CUT_SENTINEL:{$cutPoint}:".Str::uuid();

        try {
            $commandService->execute(
                operationId: $op['operation_id'],
                businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $travelService->recordApprovedOnCustodyConnection($conn, $actor, $this->travelPayload(), $corr),
                cutPointHook: static function (string $point) use ($cutPoint, $sentinel): void {
                    if ($point === $cutPoint) {
                        throw new RuntimeException($sentinel);
                    }
                },
            );
            $this->fail("Cut point [{$cutPoint}] did not trigger rollback.");
        } catch (RuntimeException $e) {
            $this->assertSame($sentinel, $e->getMessage());
        }

        // Exact zero row deltas across every table.
        $this->assertSame($before, $this->tableCounts());
        $this->assertSame('OPEN', $this->scalar('SELECT state FROM legacy_custody.operation_gates WHERE operation_id=?', [$op['operation_id']]));
        $this->assertSame(2, (int) $this->scalar('SELECT count(*) FROM legacy_custody.generations WHERE operation_id=?', [$op['operation_id']]));

        // Clean retry on the same OPEN operation commits cleanly.
        $committed = $commandService->execute(
            operationId: $op['operation_id'],
            businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $travelService->recordApprovedOnCustodyConnection($conn, $actor, $this->travelPayload(), $corr),
        );
        $this->assertSame('COMMITTED', $committed->outcome);
        $this->assertCount(2, $committed->documents);
    }

    public function test_g2b_n07_no_file_legacy_and_plan_paths_remain_intact(): void
    {
        // Zero-file Travel Order path on default connection still succeeds.
        $travel = app(TravelOrderService::class)->recordApproved($this->mayorActor, $this->travelPayload(), []);
        $this->assertSame(TravelOrderStatus::Approved, $travel->status);
        $this->assertSame(1, (int) $this->scalar('SELECT count(*) FROM public.travel_orders WHERE id=?', [$travel->id]));

        // Legacy document + Plan EVER_PLAN transition remain unaffected.
        $legacyDocId = (int) $this->insert($this->ordinary, 'public.documents', [
            'public_id' => (string) Str::uuid(),
            'title' => 'G2B Legacy Continuity Check',
            'storage_disk' => 'documents',
        ], 'id');

        $updatePlan = $this->plan->prepare("UPDATE public.documents SET security_domain='EVER_PLAN' WHERE id=?");
        $updatePlan->execute([$legacyDocId]);
        $this->assertSame('EVER_PLAN', $this->scalar('SELECT security_domain FROM public.documents WHERE id=?', [$legacyDocId]));
        $this->assertSame(1, (int) $this->scalar('SELECT count(*) FROM public.plan_document_origin_receipts WHERE document_id=?', [$legacyDocId]));
    }

    public function test_nox_g2b_001_002_003_regressions_null_entity_type_classification_shadowing_and_active_session_checks(): void
    {
        // NOX-G2B-001: SQL three-valued logic NULL entity_type bypass must fail with SQLSTATE 23514.
        foreach (['travel_order.recorded', 'transaction.approve'] as $allowlistedAction) {
            $this->assertSqlDenied($this->command, '23514', function () use ($allowlistedAction): void {
                $stmt = $this->command->prepare(
                    'INSERT INTO public.audit_logs (actor_user_id, actor_department_id, action, entity_type, entity_id, outcome, summary, correlation_id, integration_client_id, custody_operation_id) '
                    ."VALUES (?, ?, ?, NULL, 999999, 'allowed', 'Forged NULL entity_type audit', ?, NULL, NULL)"
                );
                $stmt->execute([$this->mayorActor->id, $this->mayorOffice->id, $allowlistedAction, (string) Str::uuid()]);
            });
        }

        // NOX-G2B-002: Caller cannot downgrade/override authoritative classification or shadow source/relationships metadata.
        [$opOverride] = $this->reserveAndStage($this->mayorActor, 'travel_record', 'record', 1);
        $beforeOverride = $this->tableCounts();
        $commandService = app(LegacyCustodyCommandService::class);
        $travelService = app(TravelOrderService::class);

        try {
            $commandService->execute(
                operationId: $opOverride['operation_id'],
                businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $travelService->recordApprovedOnCustodyConnection($conn, $actor, $this->travelPayload(), $corr),
                itemMetadataByOrdinal: [1 => ['classification' => 'public']],
            );
            $this->fail('Classification override unexpectedly succeeded.');
        } catch (CustodyViolationException $e) {
            $this->assertStringContainsString('classification', strtolower($e->getMessage()));
        }
        $this->assertSame($beforeOverride, $this->tableCounts());

        $committed = $commandService->execute(
            operationId: $opOverride['operation_id'],
            businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $travelService->recordApprovedOnCustodyConnection($conn, $actor, $this->travelPayload(), $corr),
            itemMetadataByOrdinal: [1 => ['metadata' => ['source' => 'spoofed', 'relationships' => ['forged'], 'custom' => 'kept']]],
        );
        $storedMeta = json_decode((string) $this->scalar('SELECT metadata::text FROM public.documents WHERE id=?', [$committed->documents[0]['document_id']]), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame('legacy_custody_registry_v1', $storedMeta['source']);
        $this->assertSame(['supporting_document', 'action_evidence'], $storedMeta['relationships']);
        $this->assertSame('kept', $storedMeta['custom']);

        // NOX-G2B-003: Active HTTP session Auth::id() mismatch, implicit stale auth_session_version, and explicit expectedRole mismatch must deny.
        [$opSession] = $this->reserveAndStage($this->mayorActor, 'travel_record', 'record', 1);
        $otherActor = $this->makeActor($this->otherOffice, 'department_head');
        $beforeSession = $this->tableCounts();

        $this->actingAs($otherActor);
        try {
            $commandService->execute(
                operationId: $opSession['operation_id'],
                businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $travelService->recordApprovedOnCustodyConnection($conn, $actor, $this->travelPayload(), $corr),
            );
            $this->fail('Auth::id() mismatch unexpectedly succeeded.');
        } catch (AuthorizationException $e) {
            $this->assertStringContainsString('authenticated session', strtolower($e->getMessage()));
        }

        $this->actingAs($this->mayorActor);
        app('session.store')->put('auth_session_version', 1);
        $this->mayorActor->forceFill(['session_version' => 2])->save();
        try {
            $commandService->execute(
                operationId: $opSession['operation_id'],
                businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $travelService->recordApprovedOnCustodyConnection($conn, $actor, $this->travelPayload(), $corr),
            );
            $this->fail('Implicit stale auth_session_version unexpectedly succeeded.');
        } catch (AuthorizationException $e) {
            $this->assertStringContainsString('session version', strtolower($e->getMessage()));
        }
        $this->mayorActor->forceFill(['session_version' => 1])->save();
        app('session.store')->put('auth_session_version', 1);

        try {
            $commandService->execute(
                operationId: $opSession['operation_id'],
                businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $travelService->recordApprovedOnCustodyConnection($conn, $actor, $this->travelPayload(), $corr),
                expectedRole: 'department_head',
            );
            $this->fail('Explicit expectedRole mismatch unexpectedly succeeded.');
        } catch (AuthorizationException $e) {
            $this->assertStringContainsString('role', strtolower($e->getMessage()));
        } finally {
            app('session.store')->forget('auth_session_version');
        }
        $this->assertSame($beforeSession, $this->tableCounts());
    }

    private function assertSqlDenied(PDO $pdo, string $expectedState, callable $fn): void
    {
        try {
            $fn();
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            $actual = (string) ($e->errorInfo[0] ?? $e->getCode());
            $this->assertSame($expectedState, $actual, $e->getMessage());

            return;
        }
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        $this->fail("Expected SQLSTATE {$expectedState} was not raised.");
    }
}
