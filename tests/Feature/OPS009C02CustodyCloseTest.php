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
use App\Services\Reports\TransactionOperationalReportQuery;
use App\Services\TransactionWorkflowService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\ConnectionInterface;
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

    public function test_connection_bound_n03_service_emits_safe_completion_notice(): void
    {
        // Diagnostic isolation only: the canonical legacy_custody.operations constraint
        // currently rejects transaction_transition/close before execute() can run.
        // This directly exercises the *real n03_command PostgreSQL connection and
        // connection-bound workflow service*, with no mocked notification listeners.
        // It is NOT a substitute for end-to-end LegacyCustodyCommandService.
        $tx = $this->makeReviewedTransaction('For Information');
        $connection = DB::connection('n03_command');
        $connection->beginTransaction();
        try {
            $actor = VerifiedCommandActor::verifyOnConnection(
                $connection,
                (int) $this->head->id,
                (int) $this->receivingOffice->id,
                (int) $this->head->session_version,
                'department_head',
            );
            $produced = app(TransactionWorkflowService::class)->transitionWithEventOnConnection(
                $connection, $actor, (int) $tx->id, 'close', (string) Str::uuid(),
                remarks: 'Custody case completed.',
            );
            $connection->commit();
        } catch (Throwable $e) {
            if ($connection->transactionLevel() > 0) {
                $connection->rollBack();
            }
            throw $e;
        }
        $noticeCount = DB::table('platform_notifications')
            ->where('event_key', 'transaction-event-'.$produced->eventId)
            ->where('user_id', $this->origin->id)
            ->count();
        fwrite(STDOUT, 'OPS009_C02_DIRECT_CONNECTION='.json_encode([
            'db_role' => 'n03_command',
            'status' => $tx->fresh()->status,
            'event_id' => $produced->eventId,
            'audit_count' => $this->auditCount($tx->id),
            'origin_notice_count' => $noticeCount,
            'limitation' => 'direct_connection_only_not_custody_execute',
        ], JSON_THROW_ON_ERROR)."\n");
        $this->assertSame('closed', $tx->fresh()->status);
        $this->assertSame(1, $this->auditCount($tx->id));
        $this->assertSame(1, $noticeCount, 'CUSTODY_NOTIFICATION_PARITY_DEFECT: connection-bound closure skipped origin notice');
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
