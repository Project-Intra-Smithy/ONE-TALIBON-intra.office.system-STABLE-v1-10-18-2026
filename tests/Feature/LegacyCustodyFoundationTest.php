<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Document;
use App\Models\Employee;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\CommonEvidence\AuthorizedArchiveSql;
use App\Services\DocumentAccessService;
use App\Services\Reports\DocumentMovementReportQuery;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PDO;
use PDOException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;
use RuntimeException;
use Tests\TestCase;
use Throwable;

/**
 * Real-role suite. Never use RefreshDatabase here: the isolated role cluster
 * is provisioned and verified by the exact-SHA workflow before client login.
 * All fixtures are synthetic and no registry object is created.
 */
#[Group('n03-role')]
final class LegacyCustodyFoundationTest extends TestCase
{
    private PDO $root;
    private PDO $stage;
    private PDO $command;
    private PDO $reconcile;
    private PDO $ordinary;
    private PDO $plan;
    private User $actor;
    private int $office;
    private string $namespace;
    private array $connections = [];

    protected function setUp(): void
    {
        parent::setUp();
        if (getenv('N03_ROLE_SUITE') !== '1' || getenv('N03_DISPOSABLE_LEASE') !== 'EXCLUSIVE_PG16_SYNTHETIC_ONLY'
            || getenv('GITHUB_ACTIONS') !== 'true') {
            throw new RuntimeException('N03 real-role tests require the dedicated disposable workflow.');
        }
        config(['messaging_release.restricted_uat' => false]);
        $this->root = $this->connect('postgres', 'DB_PASSWORD');
        $this->stage = $this->connect('n03_stage', 'N03_STAGE_PASSWORD');
        $this->command = $this->connect('n03_command', 'N03_COMMAND_PASSWORD');
        $this->reconcile = $this->connect('n03_reconcile', 'N03_RECONCILE_PASSWORD');
        $this->ordinary = $this->connect('kirion_g1b_app', 'G1B_APP_PASSWORD');
        $this->plan = $this->connect('kirion_g1b_custody', 'G1B_CUSTODY_PASSWORD');
        $this->actor = $this->makeActor();
        $this->office = (int) $this->actor->employee->department_id;
        $this->namespace = $this->uuid();
        $this->insert($this->root, 'legacy_custody.namespaces', [
            'namespace_id' => $this->namespace, 'backend_kind' => 'synthetic',
            'provider_identity' => $this->namespace, 'root_claim' => 'fixture:'.$this->namespace,
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
        parent::tearDown();
    }

    private function connect(string $role, string $variable): PDO
    {
        $password = getenv($variable);
        if (! is_string($password) || $password === '') {
            throw new RuntimeException('Missing disposable credential for '.$role);
        }
        $p = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=talibon_portal_test', $role, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        $this->assertSame($role, $p->query('SELECT session_user')->fetchColumn());
        $this->assertSame($role, $p->query('SELECT current_user')->fetchColumn());
        $p->exec("SET lock_timeout='1500ms'; SET statement_timeout='12s'");
        $this->connections[] = $p;

        return $p;
    }

    private function uuid(): string
    {
        return (string) Str::uuid();
    }

    private function custodyQuery(PDO $p, string $sql, array $values = []): \PDOStatement
    {
        $q = $p->prepare($sql);
        $q->execute($values);

        return $q;
    }

    private function insert(PDO $p, string $table, array $data, ?string $return = null): mixed
    {
        // Only internal fixed fixture identifiers, never request input.
        $cols = implode(',', array_keys($data));
        $params = implode(',', array_fill(0, count($data), '?'));
        $q = $this->custodyQuery($p, "INSERT INTO $table ($cols) VALUES ($params)".($return ? " RETURNING $return" : ''), array_values($data));

        return $return ? $q->fetchColumn() : null;
    }

    private function scalar(string $sql, array $values = []): mixed
    {
        return $this->custodyQuery($this->root, $sql, $values)->fetchColumn();
    }

    private function denied(PDO $p, string|array $states, callable $f): void
    {
        try {
            $f();
        } catch (PDOException $e) {
            $actual = (string) ($e->errorInfo[0] ?? $e->getCode());
            if ($p->inTransaction()) {
                $p->rollBack();
            }
            $this->assertContains($actual, (array) $states, $e->getMessage());
            fwrite(STDOUT, "N03 denial SQLSTATE $actual\n");

            return;
        }
        if ($p->inTransaction()) {
            $p->rollBack();
        }
        $this->fail('Unauthorized statement/commit unexpectedly succeeded.');
    }

    private function makeActor(): User
    {
        $office = Department::query()->create([
            'code' => 'N03-'.Str::upper(Str::random(10)), 'name' => 'Synthetic N03 office',
            'short_name' => 'N03', 'branch' => 'executive', 'office_type' => 'department',
            'is_active' => true, 'is_routable' => true, 'sort_order' => 10,
        ]);
        $actor = User::query()->create([
            'name' => 'Synthetic N03 actor', 'email' => Str::random(12).'@example.test',
            'password' => 'synthetic-password', 'role' => 'department_head', 'is_active' => true,
        ]);
        Employee::query()->create([
            'employee_number' => 'N03-'.Str::upper(Str::random(12)), 'full_name' => $actor->name,
            'work_email' => $actor->email, 'user_id' => $actor->id, 'department_id' => $office->id,
            'position_title' => 'Synthetic reviewer', 'employment_status' => 'active',
        ]);

        return $actor->fresh('employee.department');
    }

    private function reservation(string $kind = 'transaction_create', string $action = 'create', int $n = 1): array
    {
        $op = [
            'operation_id' => $this->uuid(), 'namespace_id' => $this->namespace, 'epoch' => 1,
            'actor_user_id' => $this->actor->id, 'office_id' => $this->office, 'service_identity' => 'synthetic-command',
            'command_kind' => $kind, 'command_action' => $action, 'correlation_id' => $this->uuid(),
            'idempotency_hash' => hash('sha256', $this->uuid()), 'item_count' => $n, 'manifest_digest' => hash('sha256', $this->uuid()),
        ];
        $items = [];
        for ($i = 1; $i <= $n; $i++) {
            $g = $this->uuid();
            $items[] = [
                'operation_id' => $op['operation_id'], 'ordinal' => $i, 'generation_id' => $g,
                'namespace_id' => $this->namespace, 'epoch' => 1, 'locator' => 'objects/'.substr($g, 0, 2).'/'.$g.'.blob',
                'size_bytes' => 123, 'sha256' => str_repeat('a', 64), 'mime_type' => 'application/pdf',
            ];
        }

        return [$op, $items];
    }

    private function reserve(array $op, array $items): void
    {
        $this->stage->beginTransaction();
        $this->insert($this->stage, 'legacy_custody.operations', $op);
        foreach ($items as $item) {
            $this->insert($this->stage, 'legacy_custody.operation_items', $item);
        }
        $this->insert($this->stage, 'legacy_custody.operation_gates', ['operation_id' => $op['operation_id']]);
        $this->stage->commit();
    }

    private function generation(array $item): array
    {
        return $item + ['provider_object_identity' => 'synthetic:'.$item['generation_id'],
            'staged_fence' => 1, 'staging_receipt_id' => $this->uuid()];
    }

    private function stageItems(array $items): void
    {
        foreach ($items as $item) {
            $this->insert($this->stage, 'legacy_custody.generations', $this->generation($item));
        }
    }

    private function source(array $op, string $eventAction): array
    {
        $family = explode('_', $op['command_kind'])[0];
        $now = gmdate('Y-m-d H:i:sP');
        if ($family === 'transaction') {
            $parent = WorkflowTransaction::query()->create([
                'reference_no' => 'N03-'.Str::upper(Str::random(12)), 'transaction_type' => 'internal_request',
                'title' => 'Synthetic N03 transaction', 'origin_department_id' => $this->office, 'current_department_id' => $this->office,
                'created_by_user_id' => $this->actor->id, 'status' => 'submitted',
            ])->id;
            $event = $this->insert($this->root, 'public.transaction_events', [
                'transaction_id' => $parent, 'actor_user_id' => $this->actor->id, 'action' => $eventAction,
            ], 'id');
        } elseif ($family === 'correspondence') {
            $parent = $this->insert($this->root, 'public.correspondence_records', [
                'public_id' => $this->uuid(), 'external_reference_no' => 'N03-'.$this->uuid(), 'source' => 'manual',
                'sender_name' => 'Synthetic sender', 'subject' => 'Synthetic N03 correspondence', 'received_at' => $now,
                'receiving_department_id' => $this->office, 'registered_by_user_id' => $this->actor->id,
                'classification' => 'internal', 'lifecycle_state' => 'registered',
            ], 'id');
            $event = $this->insert($this->root, 'public.correspondence_events', [
                'correspondence_record_id' => $parent, 'actor_user_id' => $this->actor->id, 'event' => $eventAction,
                'office_department_id' => $this->office, 'correlation_id' => $op['correlation_id'],
                'new_lifecycle_state' => 'registered', 'occurred_at' => $now,
            ], 'id');
        } else {
            $parent = $this->insert($this->root, 'public.travel_orders', [
                'public_id' => $this->uuid(), 'reference_number' => 'N03-'.$this->uuid(), 'issuance_date' => '2026-11-19',
                'purpose' => 'Synthetic N03 travel', 'destination' => 'Synthetic destination', 'department_id' => $this->office,
                'travel_start_date' => '2026-11-19', 'travel_end_date' => '2026-11-19', 'recorded_by_user_id' => $this->actor->id,
            ], 'id');
            $event = $this->insert($this->root, 'public.travel_order_events', [
                'travel_order_id' => $parent, 'actor_user_id' => $this->actor->id, 'event' => $eventAction,
                'from_status' => $eventAction === 'status_changed' ? 'approved' : null,
                'to_status' => $eventAction === 'status_changed' ? 'completed' : 'approved',
                'occurred_at' => $now, 'created_at' => $now,
            ], 'id');
        }

        return ['operation_id' => $op['operation_id'], 'fence_no' => 1, 'source_kind' => $family, 'source_id' => $parent,
            'event_id' => $event, 'actor_user_id' => $op['actor_user_id'], 'office_id' => $op['office_id'],
            'correlation_id' => $op['correlation_id'], 'event_action' => $eventAction];
    }

    private function links(array $result, bool $direct, string $relationship): array
    {
        [$parent, $event] = match ($result['source_kind']) {
            'transaction' => ['WorkflowTransaction', 'TransactionEvent'],
            'correspondence' => ['CorrespondenceRecord', 'CorrespondenceEvent'],
            'travel' => ['TravelOrder', 'TravelOrderEvent'],
        };
        $links = [];
        if ($direct) {
            $links[] = ['linkable_type' => 'App\\Models\\'.$parent, 'linkable_id' => $result['source_id'], 'relationship' => 'supporting_document'];
        }
        $links[] = ['linkable_type' => 'App\\Models\\'.$event, 'linkable_id' => $result['event_id'], 'relationship' => $relationship];

        return $links;
    }

    private function docData(array $op, array $item, string $type): array
    {
        return [
            'public_id' => $this->uuid(), 'title' => 'Synthetic registry '.$op['operation_id'], 'document_type' => $type,
            'classification' => 'internal', 'mime_type' => $item['mime_type'], 'size_bytes' => $item['size_bytes'],
            'storage_disk' => 'legacy_registry_v1', 'storage_path' => null, 'checksum_sha256' => $item['sha256'],
            'owner_department_id' => $op['office_id'], 'uploaded_by_user_id' => $op['actor_user_id'],
            'security_domain' => 'LEGACY_CTW', 'custody_mode' => 'REGISTRY_V1',
            'custody_operation_id' => $op['operation_id'], 'custody_ordinal' => $item['ordinal'],
            'created_at' => gmdate('Y-m-d H:i:sP'),
        ];
    }

    private function receipt(array $op, string $outcome = 'COMMITTED'): array
    {
        return [
            'operation_id' => $op['operation_id'], 'outcome' => $outcome, 'fence_no' => $outcome === 'COMMITTED' ? 1 : 2,
            'receipt_uuid' => $this->uuid(), 'manifest_digest' => $op['manifest_digest'], 'evidence_ref' => 'synthetic-positive-witness',
            'actor_user_id' => $op['actor_user_id'], 'service_identity' => $op['service_identity'],
        ];
    }

    private function markedAudit(array $op, int $id): array
    {
        return [
            'custody_operation_id' => $op['operation_id'], 'entity_id' => $id, 'entity_type' => 'document',
            'action' => 'document.uploaded', 'outcome' => 'allowed', 'summary' => 'Synthetic marked upload',
            'actor_user_id' => $op['actor_user_id'], 'actor_department_id' => $op['office_id'],
            'correlation_id' => $op['correlation_id'], 'integration_client_id' => null,
        ];
    }

    /** Must be called inside the real command transaction. */
    private function artifact(array $op, array $item, array $links, string $fault = ''): array
    {
        $d = $this->docData($op, $item, $links[0]['relationship']);
        if ($fault === 'owner') {
            $d['owner_department_id'] = $this->makeActor()->employee->department_id;
        }
        if ($fault === 'digest') {
            $d['checksum_sha256'] = str_repeat('b', 64);
        }
        $id = (int) $this->insert($this->command, 'public.documents', $d, 'id');
        $a = $this->markedAudit($op, $id);
        if ($fault === 'audit') {
            $a['correlation_id'] = $this->uuid();
        }
        $audit = $this->insert($this->command, 'public.audit_logs', $a, 'id');
        $this->insert($this->command, 'legacy_custody.bindings', [
            'document_id' => $id, 'document_public_id' => $fault === 'uuid' ? $this->uuid() : $d['public_id'],
            'generation_id' => $item['generation_id'], 'operation_id' => $op['operation_id'], 'ordinal' => $item['ordinal'],
            'fence_no' => 1, 'upload_audit_id' => $audit,
        ]);
        foreach ($links as $index => $link) {
            if ($fault === 'missing-link' && $index === 0) {
                continue;
            }
            if ($fault === 'morph') {
                $link['linkable_type'] = 'App\\Models\\Employee';
            }
            $creator = $fault === 'creator' ? null : $op['actor_user_id'];
            $lid = $this->insert($this->command, 'public.document_links', $link + ['document_id' => $id, 'created_by_user_id' => $creator], 'id');
            if ($fault === 'missing-mirror') {
                continue;
            }
            $this->insert($this->command, 'legacy_custody.ownership_links', [
                'binding_document_id' => $id, 'public_document_link_id' => $lid, 'linkable_type' => $link['linkable_type'],
                'source_id' => $link['linkable_id'], 'relationship' => $link['relationship'], 'created_by_user_id' => $creator,
            ]);
        }

        return [$id, $d['public_id'], (int) $audit];
    }

    private function commit(array $op, array $items, array $result, array $links): array
    {
        $this->command->beginTransaction();
        $this->insert($this->command, 'legacy_custody.command_results', $result);
        $documents = [];
        foreach ($items as $item) {
            $documents[] = $this->artifact($op, $item, $links);
        }
        $this->insert($this->command, 'legacy_custody.terminal_receipts', $this->receipt($op));
        $this->command->commit();

        return $documents;
    }

    private function absent(array $op): void
    {
        foreach (['command_results', 'bindings', 'terminal_receipts'] as $table) {
            $this->assertSame(0, (int) $this->scalar("SELECT count(*) FROM legacy_custody.$table WHERE operation_id=?", [$op['operation_id']]));
        }
        foreach (['documents', 'audit_logs'] as $table) {
            $this->assertSame(0, (int) $this->scalar("SELECT count(*) FROM public.$table WHERE custody_operation_id=?", [$op['operation_id']]));
        }
    }

    public function test_a01_migration_inventory_and_forward_only(): void
    {
        $this->assertSame(53, (int) $this->scalar('SELECT count(*) FROM public.migrations'));
        $this->assertSame(10, (int) $this->scalar("SELECT count(*) FROM pg_tables WHERE schemaname='legacy_custody'"));
        $migration = require database_path('migrations/2026_11_19_200000_create_legacy_custody_foundation.php');
        foreach (['up', 'down'] as $method) {
            try {
                $migration->$method();
                $this->fail('Unsafe repeated or down migration accepted.');
            } catch (RuntimeException $e) {
                $this->assertStringContainsString('N03', $e->getMessage());
            }
        }
        $this->assertSame(1, (int) $this->scalar('SELECT count(*) FROM legacy_custody.namespaces WHERE namespace_id=?', [$this->namespace]));
    }

    public function test_a02_real_roles_acl_legacy_and_plan_controls(): void
    {
        foreach ([$this->ordinary, $this->plan] as $p) {
            $this->denied($p, '42501', fn () => $p->query('SELECT * FROM legacy_custody.operations'));
        }
        foreach ([$this->stage, $this->command, $this->reconcile, $this->ordinary, $this->plan] as $p) {
            $this->denied($p, '42501', fn () => $p->exec('SET ROLE kirion_g1b_owner'));
            $this->denied($p, '42501', fn () => $p->exec('CREATE TEMP TABLE documents(id bigint)'));
            $this->denied($p, '42501', fn () => $p->exec('CREATE TABLE public.n03_unauthorized(id bigint)'));
            $this->denied($p, '42501', fn () => $p->exec('TRUNCATE legacy_custody.operations'));
            $this->denied($p, '42501', fn () => $p->exec('ALTER TABLE public.documents DISABLE TRIGGER a_n03_public_guard'));
        }
        $d = $this->insert($this->ordinary, 'public.documents', ['public_id' => $this->uuid(), 'title' => 'old unregistered', 'storage_disk' => 'documents'], 'id');
        $this->custodyQuery($this->ordinary, "UPDATE public.documents SET classification='internal' WHERE id=?", [$d]);
        $id = $this->insert($this->ordinary, 'public.audit_logs', ['action' => 'old.fixture', 'summary' => 'old fixture'], 'id');
        $this->custodyQuery($this->ordinary, "UPDATE public.audit_logs SET summary='old changed' WHERE id=?", [$id]);
        $this->assertSame('old changed', $this->scalar('SELECT summary FROM public.audit_logs WHERE id=?', [$id]));
        $this->denied($this->ordinary, '42501', fn () => $this->custodyQuery($this->ordinary, 'UPDATE public.audit_logs SET custody_operation_id=NULL WHERE id=?', [$id]));
        $this->denied($this->command, '23514', fn () => $this->custodyQuery($this->command, 'UPDATE public.documents SET updated_at=now() WHERE id=?', [$d]));
        $this->denied($this->command, '23514', fn () => $this->insert($this->command, 'public.documents', ['public_id' => $this->uuid(), 'title' => 'ordinary denied']));
        $this->custodyQuery($this->ordinary, 'DELETE FROM public.audit_logs WHERE id=?', [$id]);
        $this->custodyQuery($this->plan, "UPDATE public.documents SET security_domain='EVER_PLAN' WHERE id=?", [$d]);
        $this->assertSame('EVER_PLAN', $this->scalar('SELECT security_domain FROM public.documents WHERE id=?', [$d]));
        $this->assertSame(1, (int) $this->scalar('SELECT count(*) FROM public.plan_document_origin_receipts WHERE document_id=?', [$d]));
        $this->denied($this->ordinary, '23514', fn () => $this->custodyQuery($this->ordinary, 'DELETE FROM public.documents WHERE id=?', [$d]));
        [$op, $items] = $this->reservation();
        $this->reserve($op, $items);
        foreach ([$this->stage, $this->command] as $p) {
            $p->beginTransaction();
            $this->assertSame($op['operation_id'], $this->custodyQuery($p, 'SELECT operation_id FROM legacy_custody.operation_gates WHERE operation_id=? FOR UPDATE', [$op['operation_id']])->fetchColumn());
            $this->denied($p, '23514', fn () => $this->custodyQuery($p, 'UPDATE legacy_custody.operation_gates SET lock_stub=0 WHERE operation_id=?', [$op['operation_id']]));
        }
        $this->assertSame(1, (int) $this->scalar('SELECT fence_no FROM legacy_custody.operation_gates WHERE operation_id=?', [$op['operation_id']]));
    }

    public function test_a03_complete_reservations_and_nonreuse(): void
    {
        [$op, $items] = $this->reservation(n: 5);
        $this->reserve($op, $items);
        $this->stageItems($items);
        $this->assertSame(5, (int) $this->scalar('SELECT count(*) FROM legacy_custody.generations WHERE operation_id=?', [$op['operation_id']]));
        $this->assertSame(1, (int) $this->scalar('SELECT count(DISTINCT sha256) FROM legacy_custody.generations WHERE operation_id=?', [$op['operation_id']]));
        $this->assertSame(5, (int) $this->scalar('SELECT count(DISTINCT generation_id) FROM legacy_custody.generations WHERE operation_id=?', [$op['operation_id']]));
        $this->absent($op);
        $replay = $this->custodyQuery($this->stage, 'SELECT idempotency_hash,manifest_digest FROM legacy_custody.operations WHERE operation_id=?', [$op['operation_id']])->fetch(PDO::FETCH_ASSOC);
        $this->assertSame($op['idempotency_hash'], $replay['idempotency_hash']);
        $this->assertSame($op['manifest_digest'], $replay['manifest_digest']);
        $dup = array_replace($op, ['operation_id' => $this->uuid(), 'epoch' => 2, 'manifest_digest' => str_repeat('c', 64)]);
        $this->denied($this->stage, '23505', fn () => $this->insert($this->stage, 'legacy_custody.operations', $dup));
        $this->denied($this->stage, '23514', fn () => $this->insert($this->stage, 'legacy_custody.operation_items', $items[0]));
        $this->denied($this->stage, '23505', fn () => $this->insert($this->stage, 'legacy_custody.generations', $this->generation($items[0])));
        $this->denied($this->root, '23505', fn () => $this->insert($this->root, 'legacy_custody.namespaces', [
            'namespace_id' => $this->uuid(), 'backend_kind' => 'synthetic', 'provider_identity' => $this->namespace, 'root_claim' => 'other',
        ]));
        $this->assertSame(5, (int) $this->scalar('SELECT count(*) FROM legacy_custody.operation_items WHERE operation_id=?', [$op['operation_id']]));
    }

    public static function reservationFaults(): array
    {
        return [['zero'], ['six'], ['gap'], ['extra'], ['missing-gate'], ['locator'], ['hash'], ['mime'], ['size'], ['null'], ['namespace'], ['reuse']];
    }

    #[DataProvider('reservationFaults')]
    public function test_a03_invalid_reservation_rolls_back(string $fault): void
    {
        [$op, $items] = $this->reservation(n: 2);
        if ($fault === 'reuse') {
            [$prior, $priorItems] = $this->reservation();
            $this->reserve($prior, $priorItems);
            $items[0]['generation_id'] = $priorItems[0]['generation_id'];
            $items[0]['locator'] = $priorItems[0]['locator'];
            $op['epoch'] = 2;
            foreach ($items as &$item) {
                $item['epoch'] = 2;
            }
            unset($item);
        }
        if ($fault === 'zero' || $fault === 'six') {
            $op['item_count'] = $fault === 'zero' ? 0 : 6;
        } elseif ($fault === 'gap') {
            $items[1]['ordinal'] = 3;
        } elseif ($fault === 'extra') {
            $op['item_count'] = 1;
        } elseif ($fault === 'locator') {
            $items[0]['locator'] = '../bad';
        } elseif ($fault === 'hash') {
            $items[0]['sha256'] = str_repeat('A', 64);
        } elseif ($fault === 'mime') {
            $items[0]['mime_type'] = 'application/executable';
        } elseif ($fault === 'size') {
            $items[0]['size_bytes'] = 15728641;
        } elseif ($fault === 'null') {
            $items[0]['namespace_id'] = null;
        } elseif ($fault === 'namespace') {
            $items[0]['namespace_id'] = $this->uuid();
        }
        $this->denied($this->stage, ['23514', '23502', '23503', '23505'], function () use ($op, $items, $fault) {
            if ($fault === 'missing-gate') {
                $this->stage->beginTransaction();
                $this->insert($this->stage, 'legacy_custody.operations', $op);
                foreach ($items as $item) {
                    $this->insert($this->stage, 'legacy_custody.operation_items', $item);
                }
                $this->stage->commit();
            } else {
                $this->reserve($op, $items);
            }
        });
        $this->assertSame(0, (int) $this->scalar('SELECT count(*) FROM legacy_custody.operations WHERE operation_id=?', [$op['operation_id']]));
        $this->assertSame(0, (int) $this->scalar('SELECT count(*) FROM legacy_custody.operation_items WHERE operation_id=?', [$op['operation_id']]));
    }

    public static function commands(): array
    {
        $rows = [['transaction_create', 'create', 'submitted', true, 'route_evidence'],
            ['correspondence_register', 'register', 'registered', true, 'action_evidence'],
            ['correspondence_classify', 'classify', 'classified', false, 'action_evidence'],
            ['correspondence_route', 'route', 'routed', false, 'route_evidence'],
            ['correspondence_act', 'act', 'in_action', false, 'action_evidence'],
            ['travel_record', 'record', 'recorded_approved', true, 'action_evidence'],
            ['travel_status', 'status', 'status_changed', false, 'action_evidence']];
        foreach (['forward','send_to_mayor','return_origin','request_information','assign','mark_review','approve','disapprove'] as $a) {
            $rows[] = ['transaction_transition', $a, $a, false, in_array($a, ['forward','send_to_mayor','return_origin','request_information'], true) ? 'route_evidence' : 'action_evidence'];
        }

        return $rows;
    }

    #[DataProvider('commands')]
    public function test_a04_each_command_exact_link_shape(string $kind, string $action, string $event, bool $direct, string $relationship): void
    {
        [$op, $items] = $this->reservation($kind, $action);
        $this->reserve($op, $items);
        $this->stageItems($items);
        $result = $this->source($op, $event);
        $links = $this->links($result, $direct, $relationship);
        [[$doc, $uuid, $audit]] = $this->commit($op, $items, $result, $links);
        $this->assertSame('COMMITTED', $this->scalar('SELECT outcome FROM legacy_custody.terminal_receipts WHERE operation_id=?', [$op['operation_id']]));
        $this->assertSame(count($links), (int) $this->scalar('SELECT count(*) FROM public.document_links WHERE document_id=?', [$doc]));
        $this->assertSame(count($links), (int) $this->scalar('SELECT count(*) FROM legacy_custody.ownership_links WHERE binding_document_id=?', [$doc]));
        $this->assertSame($uuid, $this->scalar('SELECT document_public_id FROM legacy_custody.bindings WHERE document_id=?', [$doc]));
        $this->assertSame($op['correlation_id'], $this->scalar('SELECT correlation_id FROM public.audit_logs WHERE id=?', [$audit]));
        $this->denied($this->ordinary, ['23503','23514'], fn () => $this->custodyQuery($this->ordinary, 'UPDATE public.document_links SET created_by_user_id=NULL WHERE document_id=?', [$doc]));
        $this->denied($this->ordinary, '23514', fn () => $this->custodyQuery($this->ordinary, 'DELETE FROM public.document_links WHERE document_id=?', [$doc]));
        $this->denied($this->ordinary, '23514', fn () => $this->custodyQuery($this->ordinary, "UPDATE public.documents SET title='changed' WHERE id=?", [$doc]));
        $this->denied($this->ordinary, '23514', fn () => $this->custodyQuery($this->ordinary, "UPDATE public.audit_logs SET summary='changed' WHERE id=?", [$audit]));
        $this->denied($this->ordinary, '23514', fn () => $this->custodyQuery($this->ordinary, 'DELETE FROM public.audit_logs WHERE id=?', [$audit]));
        $this->denied($this->plan, '23514', fn () => $this->custodyQuery($this->plan, "UPDATE public.documents SET security_domain='EVER_PLAN' WHERE id=?", [$doc]));
        $this->denied($this->reconcile, '23514', fn () => $this->custodyQuery($this->reconcile, "UPDATE legacy_custody.operation_gates SET state='CLOSED',fence_no=2 WHERE operation_id=?", [$op['operation_id']]));
        $this->assertSame('OPEN', $this->scalar('SELECT state FROM legacy_custody.operation_gates WHERE operation_id=?', [$op['operation_id']]));
        $table = match ($result['source_kind']) {'transaction' => 'transaction_events','correspondence' => 'correspondence_events','travel' => 'travel_order_events'};
        $this->denied($this->ordinary, '23503', fn () => $this->custodyQuery($this->ordinary, "DELETE FROM public.$table WHERE id=?", [$result['event_id']]));
        if ($result['source_kind'] === 'correspondence') {
            $client = $this->insert($this->root, 'public.integration_clients', ['public_id' => $this->uuid(), 'name' => 'synthetic external'], 'id');
            $this->denied($this->ordinary, '23503', fn () => $this->custodyQuery($this->ordinary, 'UPDATE public.correspondence_events SET integration_client_actor_id=? WHERE id=?', [$client, $result['event_id']]));
            $this->assertTrue((bool) $this->scalar('SELECT n03_municipal_actor FROM public.correspondence_events WHERE id=?', [$result['event_id']]));
        }
        $this->assertSame(count($links), (int) $this->scalar('SELECT count(*) FROM public.document_links WHERE document_id=?', [$doc]));
    }

    public static function artifactFaults(): array
    {
        return [['owner'], ['digest'], ['audit'], ['uuid'], ['missing-link'], ['missing-mirror'], ['morph'], ['creator'], ['wrong-event'], ['wrong-actor'], ['partial'], ['no-terminal'], ['early-terminal'], ['unmarked-spoof'], ['standalone-doc'], ['immediate'], ['savepoint']];
    }

    #[DataProvider('artifactFaults')]
    public function test_a04_a05_invalid_command_cannot_commit(string $fault): void
    {
        [$op, $items] = $this->reservation(n: 2);
        $this->reserve($op, $items);
        $this->stageItems($items);
        $result = $this->source($op, 'submitted');
        $links = $this->links($result, true, 'route_evidence');
        if ($fault === 'unmarked-spoof') {
            // An unmarked audit targeting an arbitrary ID remains an old audit, never a receipt.
            $spoof = $this->markedAudit($op, 999999999);
            unset($spoof['custody_operation_id']);
            $this->insert($this->ordinary, 'public.audit_logs', $spoof);
        }
        $this->denied($this->command, ['23514','23503','23502'], function () use ($op, $items, $result, $links, $fault) {
            $this->command->beginTransaction();
            if ($fault === 'immediate') {
                $this->command->exec('SET CONSTRAINTS ALL IMMEDIATE');
            }
            if ($fault === 'wrong-event') {
                $result['event_action'] = 'approve';
            }
            if ($fault === 'wrong-actor') {
                $result['actor_user_id'] = $this->makeActor()->id;
            }
            $this->insert($this->command, 'legacy_custody.command_results', $result);
            if ($fault === 'early-terminal') {
                $this->insert($this->command, 'legacy_custody.terminal_receipts', $this->receipt($op));
            }
            if ($fault === 'standalone-doc') {
                $this->insert($this->command, 'public.documents', $this->docData($op, $items[0], 'supporting_document'));
                $this->command->commit();
                return;
            }
            if ($fault === 'unmarked-spoof') {
                $this->command->commit();
                return;
            }
            if ($fault === 'savepoint') {
                $this->command->exec('SAVEPOINT item_sp');
            }
            $this->artifact($op, $items[0], $links, $fault);
            if ($fault === 'savepoint') {
                $this->command->exec('ROLLBACK TO SAVEPOINT item_sp');
            }
            if (! in_array($fault, ['partial','savepoint'], true)) {
                $this->artifact($op, $items[1], $links);
            }
            if ($fault !== 'no-terminal') {
                $this->insert($this->command, 'legacy_custody.terminal_receipts', $this->receipt($op));
            }
            $this->command->commit();
        });
        $this->absent($op);
        $this->assertSame(2, (int) $this->scalar('SELECT count(*) FROM legacy_custody.generations WHERE operation_id=?', [$op['operation_id']]));
    }

    public function test_a05_closed_aborted_and_multifile_terminal_rules(): void
    {
        [$op, $items] = $this->reservation(n: 5);
        $this->reserve($op, $items);
        $this->stageItems($items);
        $result = $this->source($op, 'submitted');
        $this->commit($op, $items, $result, $this->links($result, true, 'route_evidence'));
        $this->assertSame(5, (int) $this->scalar('SELECT count(*) FROM legacy_custody.bindings WHERE operation_id=?', [$op['operation_id']]));
        $this->denied($this->stage, '23514', fn () => $this->insert($this->stage, 'legacy_custody.generations', $this->generation($items[0])));
        $this->denied($this->command, '23514', fn () => $this->insert($this->command, 'legacy_custody.terminal_receipts', $this->receipt($op)));
        $this->denied($this->command, '23514', fn () => $this->insert($this->command, 'legacy_custody.operation_events', [
            'event_id' => $this->uuid(), 'operation_id' => $op['operation_id'], 'fence_no' => 1, 'kind' => 'COMMAND_READY', 'evidence_ref' => 'synthetic',
        ]));
        [$abort, $parts] = $this->reservation(n: 2);
        $this->reserve($abort, $parts);
        $this->stageItems([$parts[0]]);
        $this->denied($this->reconcile, '23514', fn () => $this->insert($this->reconcile, 'legacy_custody.terminal_receipts', $this->receipt($abort, 'ABORTED')));
        $this->custodyQuery($this->reconcile, "UPDATE legacy_custody.operation_gates SET state='CLOSED',fence_no=2 WHERE operation_id=?", [$abort['operation_id']]);
        $this->absent($abort);
        $this->denied($this->stage, '23514', fn () => $this->insert($this->stage, 'legacy_custody.generations', $this->generation($parts[1])));
        $this->insert($this->reconcile, 'legacy_custody.terminal_receipts', $this->receipt($abort, 'ABORTED'));
        $this->assertSame('ABORTED', $this->scalar('SELECT outcome FROM legacy_custody.terminal_receipts WHERE operation_id=?', [$abort['operation_id']]));
        $this->assertSame(1, (int) $this->scalar('SELECT count(*) FROM legacy_custody.generations WHERE operation_id=?', [$abort['operation_id']]));
        $this->denied($this->reconcile, '23514', fn () => $this->custodyQuery($this->reconcile, "UPDATE legacy_custody.operation_gates SET state='OPEN',fence_no=1 WHERE operation_id=?", [$abort['operation_id']]));
        $this->assertSame('CLOSED', $this->scalar('SELECT state FROM legacy_custody.operation_gates WHERE operation_id=?', [$abort['operation_id']]));
        $this->assertSame(0, (int) $this->scalar('SELECT count(*) FROM public.documents WHERE custody_operation_id=?', [$abort['operation_id']]));
    }

    public function test_a06_real_connections_timeout_and_fence_after_close(): void
    {
        [$op, $items] = $this->reservation();
        $this->reserve($op, $items);
        $this->reconcile->beginTransaction();
        $this->custodyQuery($this->reconcile, "UPDATE legacy_custody.operation_gates SET state='CLOSED',fence_no=2 WHERE operation_id=?", [$op['operation_id']]);
        $this->denied($this->stage, '55P03', fn () => $this->insert($this->stage, 'legacy_custody.generations', $this->generation($items[0])));
        $this->assertSame('OPEN', $this->scalar('SELECT state FROM legacy_custody.operation_gates WHERE operation_id=?', [$op['operation_id']]));
        $this->reconcile->commit();
        $this->denied($this->stage, '23514', fn () => $this->insert($this->stage, 'legacy_custody.generations', $this->generation($items[0])));
        $this->assertSame(0, (int) $this->scalar('SELECT count(*) FROM legacy_custody.generations WHERE operation_id=?', [$op['operation_id']]));
        [$second, $parts] = $this->reservation();
        $this->reserve($second, $parts);
        $this->stage->beginTransaction();
        $this->stage->exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        $this->denied($this->stage, '23514', fn () => $this->insert($this->stage, 'legacy_custody.generations', $this->generation($parts[0])));
        $this->stageItems($parts);
        $result = $this->source($second, 'submitted');
        $this->command->beginTransaction();
        $this->insert($this->command, 'legacy_custody.command_results', $result);
        $this->artifact($second, $parts[0], $this->links($result, true, 'route_evidence'));
        $this->insert($this->command, 'legacy_custody.terminal_receipts', $this->receipt($second));
        $this->denied($this->reconcile, '55P03', fn () => $this->custodyQuery($this->reconcile, "UPDATE legacy_custody.operation_gates SET state='CLOSED',fence_no=2 WHERE operation_id=?", [$second['operation_id']]));
        $this->assertSame(0, (int) $this->scalar('SELECT count(*) FROM legacy_custody.terminal_receipts WHERE operation_id=?', [$second['operation_id']]));
        $this->command->commit();
        $this->denied($this->reconcile, '23514', fn () => $this->custodyQuery($this->reconcile, "UPDATE legacy_custody.operation_gates SET state='CLOSED',fence_no=2 WHERE operation_id=?", [$second['operation_id']]));
        $this->assertSame('COMMITTED', $this->scalar('SELECT outcome FROM legacy_custody.terminal_receipts WHERE operation_id=?', [$second['operation_id']]));
    }

    public function test_a07_synthetic_metadata_characterization_no_registry_bytes(): void
    {
        [$op, $items] = $this->reservation();
        $this->reserve($op, $items);
        $this->stageItems($items);
        $result = $this->source($op, 'submitted');
        $archive = app(AuthorizedArchiveSql::class);
        $before = $archive->workspace($this->actor, []);
        [[$id, $uuid]] = $this->commit($op, $items, $result, $this->links($result, true, 'route_evidence'));
        $this->actingAs($this->actor);
        $visible = $archive->workspace($this->actor, ['document' => $uuid, 'archive_search' => $op['operation_id']]);
        $this->assertSame($uuid, $visible['selected']['publicId']);
        $this->assertNull($visible['selected']['previewUrl']);
        $this->assertSame('/documents/'.$uuid.'/download', $visible['selected']['downloadUrl']);
        $this->assertSame(1, $visible['records']->total());
        $this->assertSame($before['counts']['all'] + 1, $visible['counts']['all']);
        $this->assertContains('Internal', $visible['filterOptions']['classifications']);
        $this->assertSame([$id => false], $archive->visibleDocumentPreviewEligibility($this->actor, [$id]));
        $this->assertFalse(app(DocumentAccessService::class)->canDownload($this->actor, Document::query()->findOrFail($id)));
        foreach (['preview','download'] as $route) {
            $response = $this->get('/documents/'.$uuid.'/'.$route)->assertNotFound();
            $this->assertFalse($response->headers->has('Content-Disposition'));
        }
        $other = $this->makeActor();
        $this->actingAs($other);
        $denied = $archive->workspace($other, ['document' => $uuid, 'archive_search' => $op['operation_id']]);
        $this->assertNull($denied['selected']);
        $this->assertSame(0, $denied['records']->total());
        $this->get('/documents/'.$uuid.'/preview')->assertNotFound();
        $this->get('/documents/'.$uuid.'/download')->assertNotFound();
        $this->assertSame([], $archive->visibleDocumentIds($other, [$id]));
        $this->assertSame(0, (int) $this->scalar("SELECT count(*) FROM public.documents WHERE custody_operation_id=? AND storage_path IS NOT NULL", [$op['operation_id']]));
    }


    public function test_a01_wrong_driver_and_database_refuse_before_ddl(): void
    {
        $migration = require database_path('migrations/2026_11_19_200000_create_legacy_custody_foundation.php');
        $original = DB::getDefaultConnection();
        $baseline = config('database.connections.pgsql');
        try {
            foreach ([
                ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => ''],
                array_replace($baseline, ['database' => 'n03_forbidden_database']),
            ] as $configuration) {
                config(['database.connections.n03_wrong' => $configuration]);
                DB::purge('n03_wrong');
                DB::setDefaultConnection('n03_wrong');
                try {
                    $migration->up();
                    $this->fail('Wrong driver/database accepted.');
                } catch (RuntimeException $e) {
                    $this->assertStringContainsString('N03 requires a leased synthetic PG16 database', $e->getMessage());
                }
            }
        } finally {
            DB::purge('n03_wrong');
            DB::setDefaultConnection($original);
        }
        $this->assertSame(53, (int) $this->scalar('SELECT count(*) FROM public.migrations'));
    }

    private function asyncRole(string $role, string $passwordVariable): \PgSql\Connection
    {
        $password = getenv($passwordVariable);
        $this->assertMatchesRegularExpression('/^[0-9a-f]{48}$/', (string) $password);
        $c = pg_connect("host=127.0.0.1 port=5432 dbname=talibon_portal_test user=$role password=$password", PGSQL_CONNECT_FORCE_NEW);
        $this->assertInstanceOf(\PgSql\Connection::class, $c);
        $this->assertSame([$role, $role], pg_fetch_row(pg_query($c, 'SELECT session_user,current_user')));
        $this->assertNotFalse(pg_query($c, "SET lock_timeout='8s'; SET statement_timeout='12s'"));
        return $c;
    }

    private function waitForBlocker(\PgSql\Connection $waiter, PDO $holder): void
    {
        $pid = (int) $holder->query('SELECT pg_backend_pid()')->fetchColumn();
        $waitingPid = pg_get_pid($waiter);
        $deadline = microtime(true) + 5;
        do {
            if ((int) $this->scalar('SELECT (CAST(? AS integer)=ANY(pg_blocking_pids(CAST(? AS integer))))::int', [$pid, $waitingPid]) === 1) {
                fwrite(STDOUT, "N03 deterministic barrier observed\n");
                return;
            }
            usleep(10000);
        } while (microtime(true) < $deadline);
        $this->fail('Expected the independent backend to wait on the actual gate holder.');
    }

    private function sendInsert(\PgSql\Connection $c, string $table, array $data): void
    {
        $columns = implode(',', array_keys($data));
        $params = implode(',', array_map(static fn ($n) => '$'.$n, range(1, count($data))));
        $this->assertTrue(pg_send_query_params($c, "INSERT INTO $table ($columns) VALUES ($params)", array_values($data)));
    }

    private function asyncResult(\PgSql\Connection $c, ?string $state): void
    {
        $r = pg_get_result($c);
        $this->assertInstanceOf(\PgSql\Result::class, $r);
        if ($state === null) {
            $this->assertSame(PGSQL_COMMAND_OK, pg_result_status($r), pg_result_error($r));
        } else {
            $this->assertSame($state, pg_result_error_field($r, PGSQL_DIAG_SQLSTATE), pg_result_error($r));
            fwrite(STDOUT, "N03 post-wait denial SQLSTATE $state\n");
        }
        $this->assertFalse(pg_get_result($c));
    }

    public function test_a06_after_wait_reads_current_gate_and_terminal(): void
    {
        $stage = $this->asyncRole('n03_stage', 'N03_STAGE_PASSWORD');
        $reconcile = $this->asyncRole('n03_reconcile', 'N03_RECONCILE_PASSWORD');
        $command = $this->asyncRole('n03_command', 'N03_COMMAND_PASSWORD');
        $close = "UPDATE legacy_custody.operation_gates SET state='CLOSED',fence_no=2 WHERE operation_id=?";
        $asyncClose = "UPDATE legacy_custody.operation_gates SET state='CLOSED',fence_no=2 WHERE operation_id=$1";
        try {
            // Closure wins against a stage insert actually waiting on the gate.
            [$op, $items] = $this->reservation();
            $this->reserve($op, $items);
            $this->reconcile->beginTransaction();
            $this->custodyQuery($this->reconcile, $close, [$op['operation_id']]);
            $this->sendInsert($stage, 'legacy_custody.generations', $this->generation($items[0]));
            $this->waitForBlocker($stage, $this->reconcile);
            $this->reconcile->commit();
            $this->asyncResult($stage, '23514');
            $this->assertSame(0, (int) $this->scalar('SELECT count(*) FROM legacy_custody.generations WHERE operation_id=?', [$op['operation_id']]));
            $this->absent($op);

            // Stage wins first; subsequent close retains the staged identity.
            [$op, $items] = $this->reservation();
            $this->reserve($op, $items);
            $this->stage->beginTransaction();
            $this->insert($this->stage, 'legacy_custody.generations', $this->generation($items[0]));
            $this->assertTrue(pg_send_query_params($reconcile, $asyncClose, [$op['operation_id']]));
            $this->waitForBlocker($reconcile, $this->stage);
            $this->stage->commit();
            $this->asyncResult($reconcile, null);
            $this->assertSame('CLOSED', $this->scalar('SELECT state FROM legacy_custody.operation_gates WHERE operation_id=?', [$op['operation_id']]));
            $this->assertSame(1, (int) $this->scalar('SELECT count(*) FROM legacy_custody.generations WHERE operation_id=?', [$op['operation_id']]));
            $this->absent($op);

            // Closure also wins against an already staged command result.
            [$op, $items] = $this->reservation();
            $this->reserve($op, $items);
            $this->stageItems($items);
            $result = $this->source($op, 'submitted');
            $this->reconcile->beginTransaction();
            $this->custodyQuery($this->reconcile, $close, [$op['operation_id']]);
            $this->sendInsert($command, 'legacy_custody.command_results', $result);
            $this->waitForBlocker($command, $this->reconcile);
            $this->reconcile->commit();
            $this->asyncResult($command, '23514');
            $this->absent($op);

            // Fully committed command wins; a waiting close must see the receipt.
            [$op, $items] = $this->reservation();
            $this->reserve($op, $items);
            $this->stageItems($items);
            $result = $this->source($op, 'submitted');
            $this->command->beginTransaction();
            $this->insert($this->command, 'legacy_custody.command_results', $result);
            $this->artifact($op, $items[0], $this->links($result, true, 'route_evidence'));
            $this->insert($this->command, 'legacy_custody.terminal_receipts', $this->receipt($op));
            $this->assertTrue(pg_send_query_params($reconcile, $asyncClose, [$op['operation_id']]));
            $this->waitForBlocker($reconcile, $this->command);
            $this->command->commit();
            $this->asyncResult($reconcile, '23514');
            $this->assertSame('COMMITTED', $this->scalar('SELECT outcome FROM legacy_custody.terminal_receipts WHERE operation_id=?', [$op['operation_id']]));
            $this->assertSame('OPEN', $this->scalar('SELECT state FROM legacy_custody.operation_gates WHERE operation_id=?', [$op['operation_id']]));
            $this->assertSame(1, (int) $this->scalar('SELECT count(*) FROM legacy_custody.bindings WHERE operation_id=?', [$op['operation_id']]));
        } finally {
            foreach ([$this->stage, $this->command, $this->reconcile] as $holder) {
                if ($holder->inTransaction()) {
                    $holder->rollBack();
                }
            }
            foreach ([$stage, $reconcile, $command] as $c) {
                pg_close($c);
            }
        }
    }

    public function test_a07_correspondence_event_report_and_unregistered_projection_parity(): void
    {
        [$op, $items] = $this->reservation('correspondence_register', 'register');
        $this->reserve($op, $items);
        $this->stageItems($items);
        $result = $this->source($op, 'registered');
        $links = $this->links($result, true, 'action_evidence');
        $oldUuid = $this->uuid();
        $old = $this->insert($this->ordinary, 'public.documents', [
            'public_id' => $oldUuid, 'title' => 'Synthetic old archive control', 'document_type' => 'supporting_document',
            'classification' => 'internal', 'storage_disk' => 'documents', 'storage_path' => 'synthetic/old.pdf',
            'mime_type' => 'application/pdf', 'size_bytes' => 123, 'checksum_sha256' => str_repeat('b', 64),
            'owner_department_id' => $this->office, 'uploaded_by_user_id' => $this->actor->id,
        ], 'id');
        $oldLink = $this->insert($this->ordinary, 'public.document_links', $links[0] + ['document_id' => $old, 'created_by_user_id' => $this->actor->id], 'id');
        $archive = app(AuthorizedArchiveSql::class);
        $report = app(DocumentMovementReportQuery::class);
        $this->actingAs($this->actor);
        $before = $archive->workspace($this->actor, ['document' => $oldUuid]);
        $this->assertSame($oldUuid, $before['selected']['publicId']);
        $this->assertFalse($report->eligibleEventEvidence($this->actor, 'correspondence', $result['event_id']));
        $reportBefore = $report->rows($this->actor, [], false)->all();
        $this->assertContains('correspondence:'.$result['event_id'], array_column($reportBefore, 'id'));
        [[$id, $uuid, $audit]] = $this->commit($op, $items, $result, $links);
        $after = $archive->workspace($this->actor, ['document' => $oldUuid]);
        $this->assertSame($before['selected'], $after['selected']);
        $this->assertSame($before['counts']['all'] + 1, $after['counts']['all']);
        $this->assertTrue($report->eligibleEventEvidence($this->actor, 'correspondence', $result['event_id']));
        $this->assertSame($reportBefore, $report->rows($this->actor, [], false)->all());
        foreach ($reportBefore as $row) {
            $this->assertArrayNotHasKey('hasEvidence', $row);
        }
        $this->assertSame([$id], $archive->visibleDocumentIds($this->actor, [$id]));
        $this->assertSame([$id => false], $archive->visibleDocumentPreviewEligibility($this->actor, [$id]));
        $spoof = $this->markedAudit($op, $id);
        unset($spoof['custody_operation_id']);
        $this->insert($this->ordinary, 'public.audit_logs', $spoof);
        $this->assertSame(1, (int) $this->scalar('SELECT count(*) FROM public.audit_logs WHERE entity_id=? AND custody_operation_id IS NOT NULL', [$id]));
        $this->assertSame($audit, (int) $this->scalar('SELECT upload_audit_id FROM legacy_custody.bindings WHERE document_id=?', [$id]));
        $this->denied($this->ordinary, '23514', fn () => $this->custodyQuery($this->ordinary, 'UPDATE public.document_links SET document_id=? WHERE id=?', [$id, $oldLink]));
        $this->assertSame((int) $old, (int) $this->scalar('SELECT document_id FROM public.document_links WHERE id=?', [$oldLink]));
        foreach (['preview','download'] as $route) {
            $this->get('/documents/'.$uuid.'/'.$route)->assertNotFound();
        }
        $other = $this->makeActor();
        $this->actingAs($other);
        $this->assertFalse($report->eligibleEventEvidence($other, 'correspondence', $result['event_id']));
        $this->assertNotContains('correspondence:'.$result['event_id'], array_column($report->rows($other, [], false)->all(), 'id'));
        $this->assertSame([], $archive->visibleDocumentIds($other, [$id, $old]));
        $this->assertNull($archive->workspace($other, ['document' => $uuid])['selected']);
    }
}
