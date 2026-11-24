<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\Correspondence\CorrespondenceClassification;
use App\Domain\Custody\ProducedSourceEvent;
use App\Domain\Custody\VerifiedCommandActor;
use App\Models\CorrespondenceRecord;
use App\Models\Department;
use App\Models\DocumentLink;
use App\Models\Employee;
use App\Models\User;
use App\Services\CorrespondenceEvidenceService;
use App\Services\CorrespondenceLifecycleService;
use App\Services\CorrespondenceRoutingService;
use App\Services\Custody\LegacyCustodyCommandService;
use App\Services\TransactionWorkflowService;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PDO;
use PHPUnit\Framework\Attributes\Group;
use RuntimeException;
use Tests\TestCase;

/**
 * Real-role N03 G2B Transaction & Correspondence direct-event provenance,
 * REGISTRY_V1 non-reclassification guard, replayed-event 23505 denial, and
 * multi-file atomic commit/rollback suite.
 */
#[Group('n03-g2b-role')]
final class LegacyCustodyG2BTransactionCorrespondenceCommandTest extends TestCase
{
    private PDO $root;

    private PDO $stage;

    private PDO $ordinary;

    private Department $originOffice;

    private Department $targetOffice;

    private Department $mayorOffice;

    private User $originHead;

    private User $targetHead;

    private User $mayorApprover;

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
        $this->ordinary = $this->connect('kirion_g1b_app', 'G1B_APP_PASSWORD');

        $this->configureLaravelRoleConnections();

        $this->originOffice = Department::query()->create([
            'code' => 'ORG-'.Str::upper(Str::random(6)),
            'name' => 'Origin Department',
            'short_name' => 'ORG',
            'branch' => 'executive',
            'office_type' => 'department',
            'is_active' => true,
            'is_routable' => true,
            'sort_order' => 10,
        ]);

        $this->targetOffice = Department::query()->create([
            'code' => 'TGT-'.Str::upper(Str::random(6)),
            'name' => 'Target Department',
            'short_name' => 'TGT',
            'branch' => 'executive',
            'office_type' => 'department',
            'is_active' => true,
            'is_routable' => true,
            'sort_order' => 11,
        ]);

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

        $this->originHead = $this->makeActor($this->originOffice, 'department_head');
        $this->targetHead = $this->makeActor($this->targetOffice, 'department_head');
        $this->mayorApprover = $this->makeActor($this->mayorOffice, 'mayor_approver');

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
    private function reserveAndStage(User $actor, string $kind, string $action, int $itemCount = 1): array
    {
        $operationId = (string) Str::uuid();
        $op = [
            'operation_id' => $operationId,
            'namespace_id' => $this->namespace,
            'epoch' => 1,
            'actor_user_id' => (int) $actor->id,
            'office_id' => (int) $actor->employee->department_id,
            'service_identity' => 'g2b-tx-corr-test',
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
                'size_bytes' => 2048 * $i,
                'sha256' => hash('sha256', "tx-corr-{$operationId}-{$i}"),
                'mime_type' => 'application/pdf',
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
                'provider_object_identity' => 'local_v1:2:'.random_int(1000, 9999999).':'.$item['generation_id'],
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
            'public.transactions',
            'public.transaction_events',
            'public.correspondence_records',
            'public.correspondence_events',
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

    private function createReceivedCorrespondence(): CorrespondenceRecord
    {
        return CorrespondenceRecord::query()->create([
            'public_id' => (string) Str::uuid(),
            'external_reference_no' => 'EXT-G2B-'.Str::upper(Str::random(10)),
            'source' => 'manual',
            'sender_name' => 'Provincial Office',
            'subject' => 'Synthetic G2B Correspondence Provenance Subject',
            'summary' => 'Synthetic correspondence summary for G2B testing.',
            'received_at' => now(),
            'lifecycle_state' => 'received',
        ]);
    }

    public function test_transaction_create_and_transitions_with_direct_event_provenance_and_replay_23505_denial(): void
    {
        $commandService = app(LegacyCustodyCommandService::class);
        $workflowService = app(TransactionWorkflowService::class);

        // 1. Multi-file (3 items) transaction_create on n03_command.
        [$createOp] = $this->reserveAndStage($this->originHead, 'transaction_create', 'create', 3);
        $created = $commandService->execute(
            operationId: $createOp['operation_id'],
            businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $workflowService->createWithEventOnConnection($conn, $actor, [
                'transaction_type' => 'internal_request',
                'title' => 'G2B Multi-File Transaction',
                'description' => 'Testing 3-item atomic custody creation.',
                'priority' => 'high',
                'target_department_id' => $this->targetOffice->id,
                'remarks' => 'Initial route with 3 evidence files.',
            ], $corr),
        );

        $this->assertSame('COMMITTED', $created->outcome);
        $this->assertSame('transaction', $created->sourceKind);
        $this->assertSame('submitted', $created->eventAction);
        $this->assertCount(3, $created->documents);
        $this->assertSame(1, (int) $this->scalar("SELECT count(*) FROM public.audit_logs WHERE entity_type=? AND entity_id=? AND action='transaction.created' AND custody_operation_id IS NULL AND correlation_id=?", ['App\\Models\\WorkflowTransaction', $created->sourceId, $createOp['correlation_id']]));
        $this->assertSame(3, (int) $this->scalar("SELECT count(*) FROM public.documents WHERE custody_operation_id=? AND document_type='supporting_document'", [$createOp['operation_id']]));

        // 2. Replayed transaction_event_id into a second operation must fail with 23505.
        [$replayOp] = $this->reserveAndStage($this->originHead, 'transaction_create', 'create', 1);
        $beforeReplayAttempt = $this->tableCounts();
        try {
            $commandService->execute(
                operationId: $replayOp['operation_id'],
                businessCommand: static fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => new ProducedSourceEvent(
                    sourceKind: 'transaction',
                    sourceId: $created->sourceId,
                    eventId: $created->eventId,
                    eventAction: 'submitted',
                    actorUserId: $actor->userId,
                    officeId: $actor->officeId,
                    correlationId: $corr,
                ),
            );
            $this->fail('Replayed transaction_event_id unexpectedly succeeded.');
        } catch (QueryException $e) {
            $this->assertSame('23505', (string) ($e->errorInfo[0] ?? $e->getCode()));
            $this->assertStringContainsString('n03_command_results_unique_transaction_event', $e->getMessage());
        }
        $this->assertSame($beforeReplayAttempt, $this->tableCounts());

        // 3. Transition: mark_review -> action_evidence.
        [$reviewOp] = $this->reserveAndStage($this->targetHead, 'transaction_transition', 'mark_review', 1);
        $reviewed = $commandService->execute(
            operationId: $reviewOp['operation_id'],
            businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $workflowService->transitionWithEventOnConnection(
                $conn,
                $actor,
                $created->sourceId,
                'mark_review',
                $corr,
                remarks: 'Under department review.',
            ),
        );
        $this->assertSame('mark_review', $reviewed->eventAction);
        $this->assertSame('action_evidence', $this->scalar('SELECT document_type FROM public.documents WHERE id=?', [$reviewed->documents[0]['document_id']]));

        // 4. Transition: send_to_mayor -> route_evidence.
        [$mayorRouteOp] = $this->reserveAndStage($this->targetHead, 'transaction_transition', 'send_to_mayor', 1);
        $routedToMayor = $commandService->execute(
            operationId: $mayorRouteOp['operation_id'],
            businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $workflowService->transitionWithEventOnConnection(
                $conn,
                $actor,
                $created->sourceId,
                'send_to_mayor',
                $corr,
                remarks: 'Elevated for executive approval.',
            ),
        );
        $this->assertSame('send_to_mayor', $routedToMayor->eventAction);
        $this->assertSame('route_evidence', $this->scalar('SELECT document_type FROM public.documents WHERE id=?', [$routedToMayor->documents[0]['document_id']]));

        // 5. Transition: approve by mayor_approver -> action_evidence.
        [$approveOp] = $this->reserveAndStage($this->mayorApprover, 'transaction_transition', 'approve', 1);
        $approved = $commandService->execute(
            operationId: $approveOp['operation_id'],
            businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $workflowService->transitionWithEventOnConnection(
                $conn,
                $actor,
                $created->sourceId,
                'approve',
                $corr,
                remarks: 'Approved by Municipal Mayor.',
            ),
        );
        $this->assertSame('approve', $approved->eventAction);
        $this->assertSame('approved', $this->scalar('SELECT status FROM public.transactions WHERE id=?', [$created->sourceId]));
        $this->assertSame(1, (int) $this->scalar("SELECT count(*) FROM public.audit_logs WHERE entity_type=? AND entity_id=? AND action='transaction.approve' AND custody_operation_id IS NULL", ['App\\Models\\WorkflowTransaction', $created->sourceId]));
    }

    public function test_correspondence_full_lifecycle_non_reclassification_guard_and_23505_denial(): void
    {
        $commandService = app(LegacyCustodyCommandService::class);
        $lifecycleService = app(CorrespondenceLifecycleService::class);
        $routingService = app(CorrespondenceRoutingService::class);
        $workflowService = app(TransactionWorkflowService::class);

        $record = $this->createReceivedCorrespondence();

        // 1. Register on n03_command with 2 files.
        [$regOp] = $this->reserveAndStage($this->originHead, 'correspondence_register', 'register', 2);
        $registered = $commandService->execute(
            operationId: $regOp['operation_id'],
            businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $lifecycleService->registerWithEventOnConnection($conn, $actor, $record->id, $corr),
        );
        $this->assertSame('registered', $registered->eventAction);
        $this->assertCount(2, $registered->documents);
        $registryDocId = $registered->documents[0]['document_id'];
        $this->assertSame('internal', $this->scalar('SELECT classification FROM public.documents WHERE id=?', [$registryDocId]));

        // Replayed correspondence_event_id denied with 23505.
        [$dupEventOp] = $this->reserveAndStage($this->originHead, 'correspondence_register', 'register', 1);
        $beforeDup = $this->tableCounts();
        try {
            $commandService->execute(
                operationId: $dupEventOp['operation_id'],
                businessCommand: static fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => new ProducedSourceEvent(
                    sourceKind: 'correspondence',
                    sourceId: $registered->sourceId,
                    eventId: $registered->eventId,
                    eventAction: 'registered',
                    actorUserId: $actor->userId,
                    officeId: $actor->officeId,
                    correlationId: $corr,
                ),
            );
            $this->fail('Replayed correspondence_event_id unexpectedly succeeded.');
        } catch (QueryException $e) {
            $this->assertSame('23505', (string) ($e->errorInfo[0] ?? $e->getCode()));
            $this->assertStringContainsString('n03_command_results_unique_correspondence_event', $e->getMessage());
        }
        $this->assertSame($beforeDup, $this->tableCounts());

        // 2. Verify CorrespondenceEvidenceService::classify() reclassifies ONLY LEGACY_PATH and NEVER touches REGISTRY_V1!
        $legacyDocId = (int) $this->insert($this->ordinary, 'public.documents', [
            'public_id' => (string) Str::uuid(),
            'title' => 'Legacy Correspondence Attachment',
            'classification' => 'internal',
            'storage_disk' => 'documents',
        ], 'id');
        DocumentLink::query()->create([
            'document_id' => $legacyDocId,
            'linkable_type' => CorrespondenceRecord::class,
            'linkable_id' => $record->id,
            'relationship' => 'supporting_document',
            'created_by_user_id' => $this->originHead->id,
        ]);

        // Classify via legacy CorrespondenceEvidenceService (zero new files) -> must NOT throw on REGISTRY_V1!
        app(CorrespondenceEvidenceService::class)->classify(
            $this->originHead,
            $record->fresh(),
            CorrespondenceClassification::Confidential,
            (string) Str::uuid(),
            'Confidential classification.',
            [],
        );

        $this->assertSame('confidential', $this->scalar('SELECT classification FROM public.documents WHERE id=?', [$legacyDocId]));
        $this->assertSame('internal', $this->scalar('SELECT classification FROM public.documents WHERE id=?', [$registryDocId]));

        // 3. Also prove correspondence_classify directly on n03_command with a second correspondence record.
        $secondRecord = $this->createReceivedCorrespondence();
        [$reg2Op] = $this->reserveAndStage($this->originHead, 'correspondence_register', 'register', 1);
        $commandService->execute(
            operationId: $reg2Op['operation_id'],
            businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $lifecycleService->registerWithEventOnConnection($conn, $actor, $secondRecord->id, $corr),
        );

        [$clsOp] = $this->reserveAndStage($this->originHead, 'correspondence_classify', 'classify', 1);
        $classified = $commandService->execute(
            operationId: $clsOp['operation_id'],
            businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $lifecycleService->classifyWithEventOnConnection(
                $conn,
                $actor,
                $secondRecord->id,
                CorrespondenceClassification::Confidential,
                $corr,
                'Classified via custody command.',
            ),
        );
        $this->assertSame('classified', $classified->eventAction);
        $this->assertSame('confidential', $this->scalar('SELECT classification FROM public.documents WHERE id=?', [$classified->documents[0]['document_id']]));

        // 4. Route via n03_command (spans transactions + transaction_events + correspondence_records + correspondence_events + 2 audits + documents + custody!).
        [$routeOp] = $this->reserveAndStage($this->originHead, 'correspondence_route', 'route', 2);
        $routed = $commandService->execute(
            operationId: $routeOp['operation_id'],
            businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $routingService->routeWithEventOnConnection($conn, $actor, $secondRecord->id, [
                'target_department_id' => $this->targetOffice->id,
                'priority' => 'high',
                'remarks' => 'Routed for department review.',
            ], $corr),
        );
        $this->assertSame('routed', $routed->eventAction);
        $this->assertSame('route_evidence', $this->scalar('SELECT document_type FROM public.documents WHERE id=?', [$routed->documents[0]['document_id']]));
        $linkedWorkflowId = (int) $this->scalar('SELECT workflow_transaction_id FROM public.correspondence_records WHERE id=?', [$secondRecord->id]);
        $this->assertGreaterThan(0, $linkedWorkflowId);

        // Move linked workflow into actionable state (mark_review) via n03_command.
        [$wfReviewOp] = $this->reserveAndStage($this->targetHead, 'transaction_transition', 'mark_review', 1);
        $commandService->execute(
            operationId: $wfReviewOp['operation_id'],
            businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $workflowService->transitionWithEventOnConnection($conn, $actor, $linkedWorkflowId, 'mark_review', $corr),
        );

        // 5. Mark correspondence in_action via n03_command.
        [$actOp] = $this->reserveAndStage($this->targetHead, 'correspondence_act', 'act', 1);
        $acted = $commandService->execute(
            operationId: $actOp['operation_id'],
            businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $routingService->markInActionWithEventOnConnection($conn, $actor, $secondRecord->id, $corr, 'Department actively processing.'),
        );
        $this->assertSame('in_action', $acted->eventAction);
        $this->assertSame('in_action', $this->scalar('SELECT lifecycle_state FROM public.correspondence_records WHERE id=?', [$secondRecord->id]));
        $this->assertSame('action_evidence', $this->scalar('SELECT document_type FROM public.documents WHERE id=?', [$acted->documents[0]['document_id']]));
    }

    public function test_multi_file_rollback_on_correspondence_route_and_transaction_create_leaves_zero_deltas(): void
    {
        $commandService = app(LegacyCustodyCommandService::class);
        $lifecycleService = app(CorrespondenceLifecycleService::class);
        $routingService = app(CorrespondenceRoutingService::class);
        $workflowService = app(TransactionWorkflowService::class);

        // Prepare classified correspondence for route rollback test.
        $record = $this->createReceivedCorrespondence();
        [$regOp] = $this->reserveAndStage($this->originHead, 'correspondence_register', 'register', 1);
        $commandService->execute(
            operationId: $regOp['operation_id'],
            businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $lifecycleService->registerWithEventOnConnection($conn, $actor, $record->id, $corr),
        );
        [$clsOp] = $this->reserveAndStage($this->originHead, 'correspondence_classify', 'classify', 1);
        $commandService->execute(
            operationId: $clsOp['operation_id'],
            businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $lifecycleService->classifyWithEventOnConnection($conn, $actor, $record->id, CorrespondenceClassification::Internal, $corr),
        );

        // Fail at after_receipt during multi-file correspondence_route (which also created a linked workflow transaction!).
        [$routeOp] = $this->reserveAndStage($this->originHead, 'correspondence_route', 'route', 3);
        $beforeRoute = $this->tableCounts();
        $sentinel = 'ROUTE_ROLLBACK_SENTINEL:'.Str::uuid();

        try {
            $commandService->execute(
                operationId: $routeOp['operation_id'],
                businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $routingService->routeWithEventOnConnection($conn, $actor, $record->id, [
                    'target_department_id' => $this->targetOffice->id,
                    'priority' => 'normal',
                ], $corr),
                cutPointHook: static function (string $point) use ($sentinel): void {
                    if ($point === 'after_receipt') {
                        throw new RuntimeException($sentinel);
                    }
                },
            );
            $this->fail('Expected route rollback sentinel was not thrown.');
        } catch (RuntimeException $e) {
            $this->assertSame($sentinel, $e->getMessage());
        }

        // ZERO delta in transactions, transaction_events, correspondence_events, documents, audit_logs, and custody tables!
        $this->assertSame($beforeRoute, $this->tableCounts());
        $this->assertSame('classified', $this->scalar('SELECT lifecycle_state FROM public.correspondence_records WHERE id=?', [$record->id]));
        $this->assertNull($this->scalar('SELECT workflow_transaction_id FROM public.correspondence_records WHERE id=?', [$record->id]));

        // Also verify multi-file transaction_create rollback at after_ownership_link.
        [$txOp] = $this->reserveAndStage($this->originHead, 'transaction_create', 'create', 3);
        $beforeTx = $this->tableCounts();
        $txSentinel = 'TX_ROLLBACK_SENTINEL:'.Str::uuid();

        try {
            $commandService->execute(
                operationId: $txOp['operation_id'],
                businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $workflowService->createWithEventOnConnection($conn, $actor, [
                    'transaction_type' => 'internal_request',
                    'title' => 'Rolled-back multi-file transaction',
                    'priority' => 'normal',
                    'target_department_id' => $this->targetOffice->id,
                ], $corr),
                cutPointHook: static function (string $point) use ($txSentinel): void {
                    if ($point === 'after_ownership_link') {
                        throw new RuntimeException($txSentinel);
                    }
                },
            );
            $this->fail('Expected transaction rollback sentinel was not thrown.');
        } catch (RuntimeException $e) {
            $this->assertSame($txSentinel, $e->getMessage());
        }

        $this->assertSame($beforeTx, $this->tableCounts());
    }
}
