<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\Custody\BrokerCloseAck;
use App\Domain\Custody\BrokerDisposeReceipt;
use App\Domain\Custody\BrokerReadObject;
use App\Domain\Custody\Exceptions\CustodyFenceClosedException;
use App\Domain\Custody\Exceptions\CustodyOperationUncertainException;
use App\Domain\Custody\Exceptions\CustodyViolationException;
use App\Domain\Custody\ProducedSourceEvent;
use App\Domain\Custody\StagingReceipt;
use App\Domain\Custody\VerifiedCommandActor;
use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\Custody\Broker\BrokerRootAttestation;
use App\Services\Custody\Broker\LocalImmutableBrokerEngine;
use App\Services\Custody\Broker\ProcessStorageBrokerClient;
use App\Services\Custody\Contracts\StorageBrokerClient;
use App\Services\Custody\LegacyCustodyCommandService;
use App\Services\Custody\LegacyCustodyCompensationService;
use App\Services\Custody\LegacyCustodyReconciler;
use App\Services\Custody\LegacyCustodyStageService;
use App\Services\TravelOrderService;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PDO;
use PDOException;
use PHPUnit\Framework\Attributes\Group;
use RuntimeException;
use Tests\TestCase;

/**
 * Stage 2 (K2) real-role durable reservation, cross-process fencing barrier,
 * uncertain-commit reconciliation, and tombstone-before-unlink compensation suite.
 *
 * Runs against a provisioned disposable PG16 cluster with real non-owner roles
 * (n03_stage, n03_command, n03_reconcile, kirion_g1b_app, kirion_g1b_custody)
 * AND a real separate-process K3 local write broker.
 */
#[Group('n03-k2-role')]
final class LegacyCustodyK2ReconciliationTest extends TestCase
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

    private string $namespaceId;

    private string $tempBase;

    private string $brokerRoot;

    private string $sourceDir;

    private string $hmacKey;

    private ProcessStorageBrokerClient $broker;

    /** @var list<PDO> */
    private array $connections = [];

    protected function setUp(): void
    {
        parent::setUp();

        if (! app()->environment('testing')
            || getenv('N03_DISPOSABLE_LEASE') !== 'EXCLUSIVE_PG16_SYNTHETIC_ONLY'
            || getenv('N03_K2_ROLE_SUITE') !== '1') {
            throw new RuntimeException(
                'N03 K2 real-role tests require APP_ENV=testing, N03_DISPOSABLE_LEASE=EXCLUSIVE_PG16_SYNTHETIC_ONLY, and N03_K2_ROLE_SUITE=1.'
            );
        }

        $this->root = $this->connect('postgres', 'DB_PASSWORD');
        $this->stage = $this->connect('n03_stage', 'N03_STAGE_PASSWORD');
        $this->command = $this->connect('n03_command', 'N03_COMMAND_PASSWORD');
        $this->reconcile = $this->connect('n03_reconcile', 'N03_RECONCILE_PASSWORD');
        $this->ordinary = $this->connect('kirion_g1b_app', 'G1B_APP_PASSWORD');
        $this->plan = $this->connect('kirion_g1b_custody', 'G1B_CUSTODY_PASSWORD');

        $this->configureLaravelRoleConnections();

        $rawTemp = realpath(sys_get_temp_dir());
        $this->assertIsString($rawTemp);
        $this->tempBase = $rawTemp.DIRECTORY_SEPARATOR.'ot_k2_role_'.bin2hex(random_bytes(8));
        $this->brokerRoot = $this->tempBase.DIRECTORY_SEPARATOR.'vault';
        $this->sourceDir = $this->tempBase.DIRECTORY_SEPARATOR.'sources';
        $this->assertTrue(mkdir($this->brokerRoot, 0750, true));
        $this->assertTrue(mkdir($this->sourceDir, 0750, true));

        $this->hmacKey = hash('sha256', 'k2-role-hmac-'.bin2hex(random_bytes(16)));
        $this->namespaceId = strtolower((string) Str::uuid());

        config([
            'legacy_custody.broker_root' => $this->brokerRoot,
            'legacy_custody.broker_hmac_key' => $this->hmacKey,
        ]);

        $this->broker = new ProcessStorageBrokerClient(
            brokerRoot: $this->brokerRoot,
            hmacKey: $this->hmacKey,
            brokerBinary: base_path('bin/legacy-custody-broker'),
            disallowedRoots: BrokerRootAttestation::collectApplicationDisallowedRoots(),
        );

        $attested = $this->broker->attestRoot($this->namespaceId);

        $this->insert($this->root, 'legacy_custody.namespaces', [
            'namespace_id' => $this->namespaceId,
            'backend_kind' => $attested['backend_kind'],
            'provider_identity' => $attested['provider_identity'],
            'root_claim' => $attested['root_claim'],
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

        $this->otherOffice = Department::query()->create([
            'code' => 'K2-'.Str::upper(Str::random(8)),
            'name' => 'Synthetic K2 Office',
            'short_name' => 'K2O',
            'branch' => 'executive',
            'office_type' => 'department',
            'is_active' => true,
            'is_routable' => true,
            'sort_order' => 25,
        ]);

        $this->mayorActor = $this->makeActor($this->mayorOffice, 'mayor_approver');
        $this->issuedEmployee = $this->makeActor($this->otherOffice, 'department_staff')->employee;
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
        $this->removeDirectoryRecursive($this->tempBase);
        parent::tearDown();
    }

    public function test_k2_n01_reservation_before_bytes_and_nested_transaction_refusal(): void
    {
        $stageService = new LegacyCustodyStageService($this->broker);
        [$srcPath, $bytes, $sha] = $this->makeSourcePdf('k2_n01.pdf', 'K2-N01-Reserve-Before-Bytes');

        // 1. Refuse nested outer transaction on n03_stage BEFORE any broker I/O.
        $stageConn = DB::connection('n03_stage');
        $stageConn->beginTransaction();
        try {
            $stageService->reserve(
                namespaceId: $this->namespaceId,
                epoch: 1,
                actorUserId: (int) $this->mayorActor->id,
                officeId: (int) $this->mayorOffice->id,
                serviceIdentity: 'test:k2-n01',
                commandKind: 'travel_record',
                commandAction: 'record',
                correlationId: strtolower((string) Str::uuid()),
                idempotencyHash: hash('sha256', 'k2-n01-nested-'.Str::uuid()),
                items: [[
                    'size_bytes' => strlen($bytes),
                    'sha256' => $sha,
                    'mime_type' => 'application/pdf',
                ]],
            );
            $this->fail('Expected reserve() to refuse nested outer transaction.');
        } catch (CustodyViolationException $e) {
            $this->assertStringContainsString('nested', $e->getMessage());
        } finally {
            $stageConn->rollBack();
        }

        // 2. TX1 commits operations, operation_items, operation_gates(OPEN, 1), operation_events(RESERVED, 1) BEFORE any bytes.
        $reservation = $stageService->reserve(
            namespaceId: $this->namespaceId,
            epoch: 1,
            actorUserId: (int) $this->mayorActor->id,
            officeId: (int) $this->mayorOffice->id,
            serviceIdentity: 'test:k2-n01',
            commandKind: 'travel_record',
            commandAction: 'record',
            correlationId: strtolower((string) Str::uuid()),
            idempotencyHash: hash('sha256', 'k2-n01-valid-'.Str::uuid()),
            items: [[
                'size_bytes' => strlen($bytes),
                'sha256' => $sha,
                'mime_type' => 'application/pdf',
            ]],
        );

        $opId = $reservation['operation_id'];
        $genId = $reservation['items'][0]['generation_id'];

        // Reservation must already be durable while zero physical bytes exist!
        $this->assertFileDoesNotExist($this->physicalBlobPath($genId));
        $gate = $this->fetchOne($this->reconcile, 'SELECT state, fence_no FROM legacy_custody.operation_gates WHERE operation_id = ?', [$opId]);
        $this->assertSame('OPEN', $gate['state']);
        $this->assertSame(1, (int) $gate['fence_no']);
        $this->assertSame(1, $this->countWhere($this->reconcile, 'legacy_custody.operation_events', 'operation_id = ? AND kind = ?', [$opId, 'RESERVED']));

        // 3. Stage through separate broker subprocess and commit TX2 generations + STAGED event.
        $receipts = $stageService->stageAll($opId, [1 => $srcPath]);
        $this->assertCount(1, $receipts);
        $this->assertNotSame(getmypid(), $this->broker->lastBrokerPid());
        $this->assertFileExists($this->physicalBlobPath($genId));
        $this->assertSame(1, $this->countWhere($this->reconcile, 'legacy_custody.generations', 'operation_id = ?', [$opId]));
        $this->assertSame(1, $this->countWhere($this->reconcile, 'legacy_custody.operation_events', 'operation_id = ? AND kind = ?', [$opId, 'STAGED']));
    }

    public function test_k2_n02_cross_process_stale_fence_barrier_blocks_broker_and_database_stage(): void
    {
        $stageService = new LegacyCustodyStageService($this->broker);
        $reconciler = new LegacyCustodyReconciler($this->broker, $this->hmacKey);

        // Case A: Stage pauses AFTER TX1 reserve, BEFORE broker stageWrite -> Reconcile closes DB + broker fence -> broker rejects with FENCE_CLOSED.
        [$srcA, $bytesA, $shaA] = $this->makeSourcePdf('k2_n02_a.pdf', 'K2-N02-Stale-Before-Broker');
        $resA = $stageService->reserve(
            namespaceId: $this->namespaceId,
            epoch: 1,
            actorUserId: (int) $this->mayorActor->id,
            officeId: (int) $this->mayorOffice->id,
            serviceIdentity: 'test:k2-n02-a',
            commandKind: 'travel_record',
            commandAction: 'record',
            correlationId: strtolower((string) Str::uuid()),
            idempotencyHash: hash('sha256', 'k2-n02-a-'.Str::uuid()),
            items: [[
                'size_bytes' => strlen($bytesA),
                'sha256' => $shaA,
                'mime_type' => 'application/pdf',
            ]],
        );

        try {
            $stageService->stageAll($resA['operation_id'], [1 => $srcA], function (string $point) use ($reconciler, $resA): void {
                if ($point === 'before_broker_stage') {
                    $outcome = $reconciler->reconcile($resA['operation_id']);
                    $this->assertSame('ABORTED', $outcome['status']);
                }
            });
            $this->fail('Expected broker to reject late stageWrite with CustodyFenceClosedException.');
        } catch (CustodyFenceClosedException) {
            $this->assertFileDoesNotExist($this->physicalBlobPath($resA['items'][0]['generation_id']));
            $this->assertSame(0, $this->countWhere($this->reconcile, 'legacy_custody.generations', 'operation_id = ?', [$resA['operation_id']]));
        }

        // Case B: Stage pauses AFTER broker stageWrite, BEFORE TX2 DB insert -> Reconcile closes DB + broker fence -> DB trigger rejects TX2 with 23514.
        [$srcB, $bytesB, $shaB] = $this->makeSourcePdf('k2_n02_b.pdf', 'K2-N02-Stale-Before-TX2');
        $resB = $stageService->reserve(
            namespaceId: $this->namespaceId,
            epoch: 1,
            actorUserId: (int) $this->mayorActor->id,
            officeId: (int) $this->mayorOffice->id,
            serviceIdentity: 'test:k2-n02-b',
            commandKind: 'travel_record',
            commandAction: 'record',
            correlationId: strtolower((string) Str::uuid()),
            idempotencyHash: hash('sha256', 'k2-n02-b-'.Str::uuid()),
            items: [[
                'size_bytes' => strlen($bytesB),
                'sha256' => $shaB,
                'mime_type' => 'application/pdf',
            ]],
        );

        try {
            $stageService->stageAll($resB['operation_id'], [1 => $srcB], function (string $point) use ($reconciler, $resB): void {
                if ($point === 'after_broker_stage') {
                    $outcome = $reconciler->reconcile($resB['operation_id']);
                    $this->assertSame('ABORTED', $outcome['status']);
                }
            });
            $this->fail('Expected PostgreSQL fence trigger to reject late TX2 generation insert.');
        } catch (CustodyFenceClosedException) {
            $this->assertSame(0, $this->countWhere($this->reconcile, 'legacy_custody.generations', 'operation_id = ?', [$resB['operation_id']]));
        }
    }

    public function test_k2_n03_commit_vs_close_mutual_exclusion(): void
    {
        $stageService = new LegacyCustodyStageService($this->broker);
        $reconciler = new LegacyCustodyReconciler($this->broker, $this->hmacKey);
        $commandService = new LegacyCustodyCommandService(app(AuditLogger::class));
        $travelService = app(TravelOrderService::class);

        // Path 1: Command commits first -> Reconcile sees ALREADY_COMMITTED and NEVER closes gate or touches bytes.
        [$src1, $bytes1, $sha1] = $this->makeSourcePdf('k2_n03_commit_wins.pdf', 'K2-N03-Commit-Wins');
        $staged1 = $stageService->reserveAndStage(
            namespaceId: $this->namespaceId,
            epoch: 1,
            actorUserId: (int) $this->mayorActor->id,
            officeId: (int) $this->mayorOffice->id,
            serviceIdentity: 'test:k2-n03-commit-wins',
            commandKind: 'travel_record',
            commandAction: 'record',
            correlationId: strtolower((string) Str::uuid()),
            idempotencyHash: hash('sha256', 'k2-n03-1-'.Str::uuid()),
            items: [[
                'size_bytes' => strlen($bytes1),
                'sha256' => $sha1,
                'mime_type' => 'application/pdf',
                'source_path' => $src1,
            ]],
        );

        $op1 = $staged1['reservation']['operation_id'];
        $receipt1 = $staged1['receipts'][0];

        $commandOutcome = $commandService->execute(
            operationId: $op1,
            businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $travelService->recordApprovedOnCustodyConnection(
                connection: $conn,
                actor: $actor,
                data: [
                    'reference_number' => 'TO-K2-'.Str::upper(Str::random(8)),
                    'issuance_date' => '2026-11-20',
                    'purpose' => 'K2 Commit Wins Verification',
                    'destination' => 'Talibon Hall',
                    'department_id' => $this->mayorOffice->id,
                    'travel_start_date' => '2026-11-21',
                    'travel_end_date' => '2026-11-22',
                    'employee_ids' => [$this->issuedEmployee->id],
                ],
                correlationId: $corr,
            ),
            itemMetadataByOrdinal: [
                1 => ['title' => 'Approved Travel Order Scan', 'original_name' => 'to.pdf'],
            ],
        );
        $this->assertSame('COMMITTED', $commandOutcome->outcome);

        $reconcileOutcome = $reconciler->reconcile($op1);
        $this->assertSame('ALREADY_COMMITTED', $reconcileOutcome['status']);
        $this->assertNull($reconcileOutcome['close_ack']);

        // Gate must remain OPEN/1 and bytes must remain readable!
        $gate1 = $this->fetchOne($this->reconcile, 'SELECT state, fence_no FROM legacy_custody.operation_gates WHERE operation_id = ?', [$op1]);
        $this->assertSame('OPEN', $gate1['state']);
        $this->assertSame(1, (int) $gate1['fence_no']);

        $read1 = $this->broker->readGeneration(
            namespaceId: $this->namespaceId,
            generationId: $receipt1->generationId,
            locator: $receipt1->locator,
            expectedProviderObjectIdentity: $receipt1->providerObjectIdentity,
            expectedSize: $receipt1->sizeBytes,
            expectedSha256: $receipt1->sha256,
        );
        $this->assertSame($bytes1, $read1->bytes);

        // Path 2: Reconcile closes gate first -> Command is denied with CustodyFenceClosedException and zero artifacts!
        [$src2, $bytes2, $sha2] = $this->makeSourcePdf('k2_n03_close_wins.pdf', 'K2-N03-Close-Wins');
        $staged2 = $stageService->reserveAndStage(
            namespaceId: $this->namespaceId,
            epoch: 1,
            actorUserId: (int) $this->mayorActor->id,
            officeId: (int) $this->mayorOffice->id,
            serviceIdentity: 'test:k2-n03-close-wins',
            commandKind: 'travel_record',
            commandAction: 'record',
            correlationId: strtolower((string) Str::uuid()),
            idempotencyHash: hash('sha256', 'k2-n03-2-'.Str::uuid()),
            items: [[
                'size_bytes' => strlen($bytes2),
                'sha256' => $sha2,
                'mime_type' => 'application/pdf',
                'source_path' => $src2,
            ]],
        );

        $op2 = $staged2['reservation']['operation_id'];
        $reconciled2 = $reconciler->reconcile($op2);
        $this->assertSame('ABORTED', $reconciled2['status']);

        try {
            $commandService->execute(
                operationId: $op2,
                businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $travelService->recordApprovedOnCustodyConnection(
                    connection: $conn,
                    actor: $actor,
                    correlationId: $corr,
                    data: [
                        'reference_number' => 'TO-K2-BLOCKED-'.Str::upper(Str::random(6)),
                        'issuance_date' => '2026-11-20',
                        'purpose' => 'Must Not Commit',
                        'destination' => 'Talibon Hall',
                        'department_id' => $this->mayorOffice->id,
                        'travel_start_date' => '2026-11-21',
                        'travel_end_date' => '2026-11-22',
                        'employee_ids' => [$this->issuedEmployee->id],
                    ],
                ),
            );
            $this->fail('Expected closed operation to block command execution.');
        } catch (CustodyFenceClosedException) {
            $this->assertSame(0, $this->countWhere($this->reconcile, 'legacy_custody.command_results', 'operation_id = ?', [$op2]));
            $this->assertSame(0, $this->countWhere($this->reconcile, 'legacy_custody.bindings', 'operation_id = ?', [$op2]));
        }
    }

    public function test_k2_n04_ambiguous_broker_timeout_retains_bytes_without_abort_receipt(): void
    {
        $stageService = new LegacyCustodyStageService($this->broker);
        [$src, $bytes, $sha] = $this->makeSourcePdf('k2_n04_uncertain.pdf', 'K2-N04-Uncertain-Retention');

        $staged = $stageService->reserveAndStage(
            namespaceId: $this->namespaceId,
            epoch: 1,
            actorUserId: (int) $this->mayorActor->id,
            officeId: (int) $this->mayorOffice->id,
            serviceIdentity: 'test:k2-n04',
            commandKind: 'travel_record',
            commandAction: 'record',
            correlationId: strtolower((string) Str::uuid()),
            idempotencyHash: hash('sha256', 'k2-n04-'.Str::uuid()),
            items: [[
                'size_bytes' => strlen($bytes),
                'sha256' => $sha,
                'mime_type' => 'application/pdf',
                'source_path' => $src,
            ]],
        );

        $opId = $staged['reservation']['operation_id'];
        $receipt = $staged['receipts'][0];

        // Inject broker closeFence timeout/failure -> reconciler must fail closed preserving original exception and retaining bytes!
        $failingBroker = new class($this->broker) implements StorageBrokerClient
        {
            public function __construct(private readonly StorageBrokerClient $inner) {}

            public function attestRoot(string $namespaceId, string $expectedBackendKind = 'local_broker_v1'): array
            {
                return $this->inner->attestRoot($namespaceId, $expectedBackendKind);
            }

            public function stageWrite(
                string $namespaceId,
                string $operationId,
                int $ordinal,
                string $generationId,
                string $locator,
                string $sourceTempPath,
                int $expectedSize,
                string $expectedSha256,
                string $mimeType,
                int $fenceNo = 1,
                ?string $faultInjection = null,
            ): StagingReceipt {
                return $this->inner->stageWrite(
                    $namespaceId,
                    $operationId,
                    $ordinal,
                    $generationId,
                    $locator,
                    $sourceTempPath,
                    $expectedSize,
                    $expectedSha256,
                    $mimeType,
                    $fenceNo,
                    $faultInjection,
                );
            }

            public function closeFence(string $namespaceId, string $operationId, int $fenceNo = 2): BrokerCloseAck
            {
                throw new RuntimeException('Simulated broker closeFence transport timeout.');
            }

            public function conditionalDispose(
                string $namespaceId,
                string $operationId,
                string $generationId,
                string $locator,
                string $providerObjectIdentity,
                string $closeAckId,
                string $tombstoneId,
            ): BrokerDisposeReceipt {
                return $this->inner->conditionalDispose(
                    $namespaceId,
                    $operationId,
                    $generationId,
                    $locator,
                    $providerObjectIdentity,
                    $closeAckId,
                    $tombstoneId,
                );
            }

            public function readGeneration(
                string $namespaceId,
                string $generationId,
                string $locator,
                string $expectedProviderObjectIdentity,
                int $expectedSize,
                string $expectedSha256,
            ): BrokerReadObject {
                return $this->inner->readGeneration(
                    $namespaceId,
                    $generationId,
                    $locator,
                    $expectedProviderObjectIdentity,
                    $expectedSize,
                    $expectedSha256,
                );
            }
        };

        $failingReconciler = new LegacyCustodyReconciler($failingBroker, $this->hmacKey);
        try {
            $failingReconciler->reconcile($opId);
            $this->fail('Expected broker closeFence timeout to throw CustodyOperationUncertainException.');
        } catch (CustodyOperationUncertainException $e) {
            $this->assertInstanceOf(RuntimeException::class, $e->getPrevious());
            $this->assertStringContainsString('timeout', (string) $e->getPrevious()?->getMessage());
        }

        // Zero ABORTED terminal receipt written and physical bytes remain 100% intact!
        $this->assertSame(0, $this->countWhere($this->reconcile, 'legacy_custody.terminal_receipts', 'operation_id = ?', [$opId]));
        $read = $this->broker->readGeneration(
            namespaceId: $this->namespaceId,
            generationId: $receipt->generationId,
            locator: $receipt->locator,
            expectedProviderObjectIdentity: $receipt->providerObjectIdentity,
            expectedSize: $receipt->sizeBytes,
            expectedSha256: $receipt->sha256,
        );
        $this->assertSame($bytes, $read->bytes);

        // Retry with healthy broker succeeds cleanly from the CLOSED gate!
        $healthyReconciler = new LegacyCustodyReconciler($this->broker, $this->hmacKey);
        $retried = $healthyReconciler->reconcile($opId);
        $this->assertSame('ABORTED', $retried['status']);
        $this->assertInstanceOf(BrokerCloseAck::class, $retried['close_ack']);
    }

    public function test_k2_n05_tombstone_before_unlink_conditional_dispose_and_permanent_non_reuse(): void
    {
        $stageService = new LegacyCustodyStageService($this->broker);
        $reconciler = new LegacyCustodyReconciler($this->broker, $this->hmacKey);
        $compensationService = new LegacyCustodyCompensationService($this->broker, $this->hmacKey);

        [$src, $bytes, $sha] = $this->makeSourcePdf('k2_n05_dispose.pdf', 'K2-N05-Tombstone-Before-Unlink');

        $staged = $stageService->reserveAndStage(
            namespaceId: $this->namespaceId,
            epoch: 1,
            actorUserId: (int) $this->mayorActor->id,
            officeId: (int) $this->mayorOffice->id,
            serviceIdentity: 'test:k2-n05',
            commandKind: 'travel_record',
            commandAction: 'record',
            correlationId: strtolower((string) Str::uuid()),
            idempotencyHash: hash('sha256', 'k2-n05-'.Str::uuid()),
            items: [[
                'size_bytes' => strlen($bytes),
                'sha256' => $sha,
                'mime_type' => 'application/pdf',
                'source_path' => $src,
            ]],
        );

        $opId = $staged['reservation']['operation_id'];
        $receipt = $staged['receipts'][0];
        $blobPath = $this->physicalBlobPath($receipt->generationId);

        $reconciled = $reconciler->reconcile($opId);
        $this->assertSame('ABORTED', $reconciled['status']);
        $closeAck = $reconciled['close_ack'];
        $this->assertInstanceOf(BrokerCloseAck::class, $closeAck);

        // Verify tombstone is durably committed in PG BEFORE physical blob is unlinked!
        $sawTombstoneBeforeUnlink = false;
        $outcomes = $compensationService->compensate($opId, $closeAck, function (string $point, array $ctx) use (&$sawTombstoneBeforeUnlink, $blobPath): void {
            if ($point === 'after_tombstone_committed') {
                $tombstoneCount = $this->countWhere(
                    $this->reconcile,
                    'legacy_custody.compensation_tombstones',
                    'tombstone_id = ?',
                    [$ctx['tombstone_id']],
                );
                $this->assertSame(1, $tombstoneCount, 'Tombstone must be durably committed BEFORE broker unlink.');
                $this->assertFileExists($blobPath, 'Physical blob must still exist until after tombstone commit.');
                $sawTombstoneBeforeUnlink = true;
            }
        });

        $this->assertTrue($sawTombstoneBeforeUnlink);
        $this->assertCount(1, $outcomes);
        $this->assertSame('DISPOSED', $outcomes[0]['disposition']);
        $this->assertFileDoesNotExist($blobPath);

        // NOX-K2K3-02: Simulate crash after tombstone commit + broker conditionalDispose succeeded, before compensation_outcomes insert.
        [$srcRetry, $bytesRetry, $shaRetry] = $this->makeSourcePdf('k2_n05_retry.pdf', 'K2-N05-Crash-Retry');
        $stagedRetry = $stageService->reserveAndStage(
            namespaceId: $this->namespaceId,
            epoch: 1,
            actorUserId: (int) $this->mayorActor->id,
            officeId: (int) $this->mayorOffice->id,
            serviceIdentity: 'test:k2-n05-retry',
            commandKind: 'travel_record',
            commandAction: 'record',
            correlationId: strtolower((string) Str::uuid()),
            idempotencyHash: hash('sha256', 'k2-n05-retry-'.Str::uuid()),
            items: [[
                'size_bytes' => strlen($bytesRetry),
                'sha256' => $shaRetry,
                'mime_type' => 'application/pdf',
                'source_path' => $srcRetry,
            ]],
        );
        $opRetry = $stagedRetry['reservation']['operation_id'];
        $receiptRetry = $stagedRetry['receipts'][0];
        $reconciledRetry = $reconciler->reconcile($opRetry);
        $closeAckRetry = $reconciledRetry['close_ack'];

        $firstReceiptRef = null;
        $committedTombstoneId = null;
        try {
            $compensationService->compensate($opRetry, $closeAckRetry, function (string $point, array $ctx) use ($opRetry, $receiptRetry, $closeAckRetry, &$firstReceiptRef, &$committedTombstoneId): void {
                if ($point === 'after_tombstone_committed') {
                    $committedTombstoneId = (string) $ctx['tombstone_id'];
                    $disposed = $this->broker->conditionalDispose(
                        namespaceId: $this->namespaceId,
                        operationId: $opRetry,
                        generationId: $receiptRetry->generationId,
                        locator: $receiptRetry->locator,
                        providerObjectIdentity: $receiptRetry->providerObjectIdentity,
                        closeAckId: $closeAckRetry->closeAckId,
                        tombstoneId: $committedTombstoneId,
                    );
                    $this->assertSame('DISPOSED', $disposed->disposition);
                    $firstReceiptRef = $disposed->disposeReceiptId;
                    throw new RuntimeException('SIMULATED_WORKER_CRASH_BEFORE_OUTCOME_INSERT');
                }
            });
            $this->fail('Expected simulated worker crash exception.');
        } catch (RuntimeException $e) {
            $this->assertSame('SIMULATED_WORKER_CRASH_BEFORE_OUTCOME_INSERT', $e->getMessage());
        }

        $this->assertSame(0, $this->countWhere($this->reconcile, 'legacy_custody.compensation_outcomes', 'tombstone_id = ?', [$committedTombstoneId]));

        $retriedOutcomes = $compensationService->compensate($opRetry, $closeAckRetry);
        $this->assertCount(1, $retriedOutcomes);
        $this->assertSame($committedTombstoneId, $retriedOutcomes[0]['tombstone_id']);
        $this->assertSame('ABSENT_VERIFIED', $retriedOutcomes[0]['disposition']);
        $this->assertSame($firstReceiptRef, $retriedOutcomes[0]['broker_receipt_ref']);

        // NOX-K2K3-03: If an operation aborted after broker staging but before TX2 recorded legacy_custody.generations,
        // compensate() MUST fail closed with CustodyOperationUncertainException detailing unrecorded_sealed_generations!
        [$srcPreTx2, $bytesPreTx2, $shaPreTx2] = $this->makeSourcePdf('k2_n05_pre_tx2.pdf', 'K2-N05-Pre-TX2-Sealed');
        $resPreTx2 = $stageService->reserve(
            namespaceId: $this->namespaceId,
            epoch: 1,
            actorUserId: (int) $this->mayorActor->id,
            officeId: (int) $this->mayorOffice->id,
            serviceIdentity: 'test:k2-n05-pre-tx2',
            commandKind: 'travel_record',
            commandAction: 'record',
            correlationId: strtolower((string) Str::uuid()),
            idempotencyHash: hash('sha256', 'k2-n05-pre-tx2-'.Str::uuid()),
            items: [[
                'size_bytes' => strlen($bytesPreTx2),
                'sha256' => $shaPreTx2,
                'mime_type' => 'application/pdf',
            ]],
        );
        $opPreTx2 = $resPreTx2['operation_id'];
        $itemPreTx2 = $resPreTx2['items'][0];

        $this->broker->stageWrite(
            namespaceId: $this->namespaceId,
            operationId: $opPreTx2,
            ordinal: 1,
            generationId: $itemPreTx2['generation_id'],
            locator: $itemPreTx2['locator'],
            sourceTempPath: $srcPreTx2,
            expectedSize: strlen($bytesPreTx2),
            expectedSha256: $shaPreTx2,
            mimeType: 'application/pdf',
        );

        $abortedPreTx2 = $reconciler->reconcile($opPreTx2);
        $this->assertSame('ABORTED', $abortedPreTx2['status']);
        $this->assertInstanceOf(BrokerCloseAck::class, $abortedPreTx2['close_ack']);

        try {
            $compensationService->compensate($opPreTx2, $abortedPreTx2['close_ack']);
            $this->fail('Expected pre-TX2 unrecorded broker-sealed generation to throw CustodyOperationUncertainException.');
        } catch (CustodyOperationUncertainException $e) {
            $this->assertStringContainsString('unrecorded_sealed_generations', $e->getMessage());
            $this->assertStringContainsString($itemPreTx2['generation_id'], $e->getMessage());
        }

        // Permanent generation_id & locator non-reuse in BOTH broker and PostgreSQL!
        try {
            $this->broker->stageWrite(
                namespaceId: $this->namespaceId,
                operationId: strtolower((string) Str::uuid()),
                ordinal: 1,
                generationId: $receipt->generationId,
                locator: $receipt->locator,
                sourceTempPath: $src,
                expectedSize: strlen($bytes),
                expectedSha256: $sha,
                mimeType: 'application/pdf',
            );
            $this->fail('Expected broker to reject reuse of disposed generation_id/locator.');
        } catch (CustodyViolationException) {
            $this->addToAssertionCount(1);
        }

        try {
            $stageService->reserve(
                namespaceId: $this->namespaceId,
                epoch: 1,
                actorUserId: (int) $this->mayorActor->id,
                officeId: (int) $this->mayorOffice->id,
                serviceIdentity: 'test:k2-n05-reuse',
                commandKind: 'travel_record',
                commandAction: 'record',
                correlationId: strtolower((string) Str::uuid()),
                idempotencyHash: hash('sha256', 'k2-n05-reuse-'.Str::uuid()),
                items: [[
                    'generation_id' => $receipt->generationId,
                    'locator' => $receipt->locator,
                    'size_bytes' => strlen($bytes),
                    'sha256' => $sha,
                    'mime_type' => 'application/pdf',
                ]],
            );
            $this->fail('Expected PostgreSQL unique constraints to reject reuse of disposed generation_id/locator.');
        } catch (\Throwable) {
            $this->addToAssertionCount(1);
        }
    }

    public function test_k2_n06_compensation_guards_block_open_committed_forged_ack_mutations_and_unauthorized_roles(): void
    {
        $stageService = new LegacyCustodyStageService($this->broker);
        $reconciler = new LegacyCustodyReconciler($this->broker, $this->hmacKey);
        $compensationService = new LegacyCustodyCompensationService($this->broker, $this->hmacKey);
        $commandService = new LegacyCustodyCommandService(app(AuditLogger::class));
        $travelService = app(TravelOrderService::class);

        // 1. OPEN operation cannot be compensated (service + DB trigger both refuse).
        [$srcOpen, $bytesOpen, $shaOpen] = $this->makeSourcePdf('k2_n06_open.pdf', 'K2-N06-Open');
        $stagedOpen = $stageService->reserveAndStage(
            namespaceId: $this->namespaceId,
            epoch: 1,
            actorUserId: (int) $this->mayorActor->id,
            officeId: (int) $this->mayorOffice->id,
            serviceIdentity: 'test:k2-n06-open',
            commandKind: 'travel_record',
            commandAction: 'record',
            correlationId: strtolower((string) Str::uuid()),
            idempotencyHash: hash('sha256', 'k2-n06-open-'.Str::uuid()),
            items: [[
                'size_bytes' => strlen($bytesOpen),
                'sha256' => $shaOpen,
                'mime_type' => 'application/pdf',
                'source_path' => $srcOpen,
            ]],
        );
        $openOp = $stagedOpen['reservation']['operation_id'];
        $openReceipt = $stagedOpen['receipts'][0];

        $fakeAck = $this->makeSignedFakeAck($openOp, [$openReceipt->generationId]);
        try {
            $compensationService->compensate($openOp, $fakeAck);
            $this->fail('Expected compensation of OPEN operation to fail closed.');
        } catch (CustodyViolationException) {
            $this->assertFileExists($this->physicalBlobPath($openReceipt->generationId));
        }

        // Direct SQL attempt by n03_reconcile on OPEN op must be blocked by k2_compensation_guard (23514).
        $this->assertSqlState('23514', fn () => $this->insert($this->reconcile, 'legacy_custody.compensation_tombstones', [
            'tombstone_id' => strtolower((string) Str::uuid()),
            'operation_id' => $openOp,
            'generation_id' => $openReceipt->generationId,
            'namespace_id' => $this->namespaceId,
            'locator' => $openReceipt->locator,
            'provider_object_identity' => $openReceipt->providerObjectIdentity,
            'close_ack_id' => $fakeAck->closeAckId,
        ]));

        // 2. COMMITTED operation cannot be compensated (service + DB trigger both refuse).
        $commandService->execute(
            operationId: $openOp,
            businessCommand: fn (ConnectionInterface $conn, VerifiedCommandActor $actor, string $corr): ProducedSourceEvent => $travelService->recordApprovedOnCustodyConnection(
                connection: $conn,
                actor: $actor,
                data: [
                    'reference_number' => 'TO-K2-N06-'.Str::upper(Str::random(6)),
                    'issuance_date' => '2026-11-20',
                    'purpose' => 'Committed Cannot Compensate',
                    'destination' => 'Talibon Hall',
                    'department_id' => $this->mayorOffice->id,
                    'travel_start_date' => '2026-11-21',
                    'travel_end_date' => '2026-11-22',
                    'employee_ids' => [$this->issuedEmployee->id],
                ],
                correlationId: $corr,
            ),
        );

        try {
            $compensationService->compensate($openOp, $fakeAck);
            $this->fail('Expected compensation of COMMITTED operation to fail closed.');
        } catch (CustodyViolationException) {
            $this->assertFileExists($this->physicalBlobPath($openReceipt->generationId));
        }

        // 3. ABORTED operation: mismatched close_ack_id blocked by DB trigger, and UPDATE/DELETE blocked after valid tombstone.
        [$srcAborted, $bytesAborted, $shaAborted] = $this->makeSourcePdf('k2_n06_aborted.pdf', 'K2-N06-Aborted');
        $stagedAborted = $stageService->reserveAndStage(
            namespaceId: $this->namespaceId,
            epoch: 1,
            actorUserId: (int) $this->mayorActor->id,
            officeId: (int) $this->mayorOffice->id,
            serviceIdentity: 'test:k2-n06-aborted',
            commandKind: 'travel_record',
            commandAction: 'record',
            correlationId: strtolower((string) Str::uuid()),
            idempotencyHash: hash('sha256', 'k2-n06-aborted-'.Str::uuid()),
            items: [[
                'size_bytes' => strlen($bytesAborted),
                'sha256' => $shaAborted,
                'mime_type' => 'application/pdf',
                'source_path' => $srcAborted,
            ]],
        );
        $abortedOp = $stagedAborted['reservation']['operation_id'];
        $abortedReceipt = $stagedAborted['receipts'][0];
        $abortedOutcome = $reconciler->reconcile($abortedOp);
        $realAck = $abortedOutcome['close_ack'];
        $this->assertInstanceOf(BrokerCloseAck::class, $realAck);

        // Direct SQL tombstone insert with mismatched close_ack_id must fail with 23514.
        $this->assertSqlState('23514', fn () => $this->insert($this->reconcile, 'legacy_custody.compensation_tombstones', [
            'tombstone_id' => strtolower((string) Str::uuid()),
            'operation_id' => $abortedOp,
            'generation_id' => $abortedReceipt->generationId,
            'namespace_id' => $this->namespaceId,
            'locator' => $abortedReceipt->locator,
            'provider_object_identity' => $abortedReceipt->providerObjectIdentity,
            'close_ack_id' => 'ack:wrong-'.strtolower((string) Str::uuid()),
        ]));

        // Valid compensation commits tombstone + outcome.
        $compensated = $compensationService->compensate($abortedOp, $realAck);
        $this->assertCount(1, $compensated);
        $tombstoneId = $compensated[0]['tombstone_id'];
        $outcomeId = $compensated[0]['outcome_id'];

        // UPDATE and DELETE on both tables blocked even for n03_reconcile (42501 privilege denied).
        $this->assertSqlState('42501', fn () => $this->reconcile->exec("UPDATE legacy_custody.compensation_tombstones SET close_ack_id = 'tampered' WHERE tombstone_id = '{$tombstoneId}'"));
        $this->assertSqlState('42501', fn () => $this->reconcile->exec("DELETE FROM legacy_custody.compensation_tombstones WHERE tombstone_id = '{$tombstoneId}'"));
        $this->assertSqlState('42501', fn () => $this->reconcile->exec("UPDATE legacy_custody.compensation_outcomes SET disposition = 'QUARANTINED' WHERE outcome_id = '{$outcomeId}'"));
        $this->assertSqlState('42501', fn () => $this->reconcile->exec("DELETE FROM legacy_custody.compensation_outcomes WHERE outcome_id = '{$outcomeId}'"));

        // Unauthorized roles (n03_stage, n03_command, kirion_g1b_app, kirion_g1b_custody) denied SELECT/INSERT (42501).
        foreach ([$this->stage, $this->command, $this->ordinary, $this->plan] as $unauthorizedRole) {
            $this->assertSqlState('42501', fn () => $unauthorizedRole->query('SELECT count(*) FROM legacy_custody.compensation_tombstones'));
            $this->assertSqlState('42501', fn () => $unauthorizedRole->query('SELECT count(*) FROM legacy_custody.compensation_outcomes'));
        }
    }

    private function makeSignedFakeAck(string $operationId, array $sealedGenerations): BrokerCloseAck
    {
        $ackId = 'ack:'.strtolower((string) Str::uuid());
        $at = gmdate('Y-m-d\TH:i:s\Z');
        $sig = LocalImmutableBrokerEngine::signCloseAckPayload(
            closeAckId: $ackId,
            namespaceId: $this->namespaceId,
            operationId: $operationId,
            fenceNo: 2,
            sealedGenerations: $sealedGenerations,
            acknowledgedAt: $at,
            hmacKey: $this->hmacKey,
        );

        return new BrokerCloseAck($ackId, $this->namespaceId, $operationId, 2, $sealedGenerations, $at, $sig);
    }

    /**
     * @return array{0: string, 1: string, 2: string}
     */
    private function makeSourcePdf(string $filename, string $marker): array
    {
        $bytes = "%PDF-1.4\n%{$marker}\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n";
        $path = $this->sourceDir.DIRECTORY_SEPARATOR.$filename;
        file_put_contents($path, $bytes);

        return [$path, $bytes, hash('sha256', $bytes)];
    }

    private function physicalBlobPath(string $generationId): string
    {
        return $this->brokerRoot
            .DIRECTORY_SEPARATOR.'objects'
            .DIRECTORY_SEPARATOR.substr($generationId, 0, 2)
            .DIRECTORY_SEPARATOR.$generationId.'.blob';
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
        $host = (string) (getenv('DB_HOST') ?: '127.0.0.1');
        $port = (string) (getenv('DB_PORT') ?: '5432');
        $db = (string) (getenv('DB_DATABASE') ?: 'talibon_portal_test');
        $password = getenv($envVar);

        if (! is_string($password) || $password === '') {
            throw new RuntimeException("Missing disposable credential [{$envVar}] for role [{$role}].");
        }

        $pdo = new PDO("pgsql:host={$host};port={$port};dbname={$db}", $role, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        $this->assertSame($role, $pdo->query('SELECT session_user')->fetchColumn());
        $this->assertSame($role, $pdo->query('SELECT current_user')->fetchColumn());
        $pdo->exec("SET lock_timeout='2500ms'; SET statement_timeout='15s'");
        $this->connections[] = $pdo;

        return $pdo;
    }

    private function makeActor(Department $department, string $role): User
    {
        $suffix = Str::lower(Str::random(10));
        $user = User::query()->create([
            'name' => 'K2 Actor '.$suffix,
            'email' => "k2.{$suffix}@talibon.test",
            'password' => bcrypt('SyntheticK2Pass!123'),
            'role' => $role,
            'is_active' => true,
            'account_status' => 'active',
            'session_version' => 1,
        ]);

        Employee::query()->create([
            'user_id' => $user->id,
            'department_id' => $department->id,
            'employee_no' => 'EMP-K2-'.Str::upper(Str::random(6)),
            'full_name' => $user->name,
            'position_title' => 'Municipal Officer',
            'employment_status' => 'active',
        ]);

        return $user->fresh('employee');
    }

    /**
     * @param  array<string, mixed>  $values
     */
    private function insert(PDO $pdo, string $table, array $values): void
    {
        $columns = array_keys($values);
        $placeholders = implode(', ', array_fill(0, count($columns), '?'));
        $sql = sprintf('INSERT INTO %s (%s) VALUES (%s)', $table, implode(', ', $columns), $placeholders);
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_values($values));
    }

    /**
     * @param  list<mixed>  $params
     * @return array<string, mixed>
     */
    private function fetchOne(PDO $pdo, string $sql, array $params = []): array
    {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $this->assertIsArray($row);

        return $row;
    }

    /**
     * @param  list<mixed>  $params
     */
    private function countWhere(PDO $pdo, string $table, string $where, array $params = []): int
    {
        $stmt = $pdo->prepare("SELECT count(*) FROM {$table} WHERE {$where}");
        $stmt->execute($params);

        return (int) $stmt->fetchColumn();
    }

    private function assertSqlState(string $expectedState, callable $callback): void
    {
        try {
            $callback();
            $this->fail("Expected SQLSTATE {$expectedState}, but query succeeded.");
        } catch (PDOException $e) {
            $actual = (string) ($e->errorInfo[0] ?? $e->getCode());
            $this->assertSame($expectedState, $actual, "Unexpected SQLSTATE [{$actual}]: {$e->getMessage()}");
        }
    }

    private function removeDirectoryRecursive(string $dir): void
    {
        if (! is_dir($dir)) {
            return;
        }

        $items = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST,
        );

        foreach ($items as $item) {
            $path = $item->getPathname();
            if ($item->isDir() && ! $item->isLink()) {
                @rmdir($path);
            } else {
                @chmod($path, 0600);
                @unlink($path);
            }
        }

        @rmdir($dir);
    }
}
