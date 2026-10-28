<?php

namespace Tests\Feature;

use App\Models\PlanCustodyGeneration;
use App\PlanCustody\Contracts\CustodySecurityGate;
use App\PlanCustody\Contracts\GenerationIdSource;
use App\PlanCustody\Contracts\ImmutableObjectStore;
use App\PlanCustody\Contracts\ScannerEvidenceVerifier;
use App\PlanCustody\Data\CustodySecurityContext;
use App\PlanCustody\Data\ScanEvidence;
use App\PlanCustody\Data\StageGeneration;
use App\PlanCustody\DenyAllCustodySecurityGate;
use App\PlanCustody\Exceptions\CustodyViolation;
use App\PlanCustody\Exceptions\ObjectCollision;
use App\PlanCustody\Exceptions\OrphanedCustodyObject;
use App\PlanCustody\PlanCustodyService;
use DateTimeImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

final class PlanCustodyFoundationTest extends TestCase
{
    use RefreshDatabase;

    /** @var array<int, string> */
    private array $temporaryFiles = [];

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('plan_custody');
        $this->allowSecurity();
    }

    protected function tearDown(): void
    {
        foreach ($this->temporaryFiles as $path) {
            @unlink($path);
        }
        parent::tearDown();
    }

    public function test_default_security_dependencies_deny_staging_before_storage_or_database_write(): void
    {
        $this->app->forgetInstance(CustodySecurityGate::class);
        $this->app->bind(CustodySecurityGate::class, DenyAllCustodySecurityGate::class);
        $request = $this->request($this->pdf('denied'));

        $this->expectException(CustodyViolation::class);
        try {
            app(PlanCustodyService::class)->stage($request);
        } finally {
            $this->assertDatabaseCount('plan_custody_generations', 0);
            $this->assertSame([], Storage::disk('plan_custody')->allFiles());
        }
    }

    public function test_valid_pdf_is_staged_once_as_unbound_immutable_quarantine_generation(): void
    {
        $request = $this->request($this->pdf('valid-generation'), 'idempotency-valid-generation');
        $service = app(PlanCustodyService::class);

        $first = $service->stage($request);
        $second = $service->stage($request);

        $this->assertSame($first->id, $second->id);
        $this->assertSame('QUARANTINED', $first->custody_state);
        $this->assertSame('VERIFIED', $first->integrity_status);
        $this->assertSame('application/pdf', $first->media_type);
        Storage::disk('plan_custody')->assertExists($first->storage_locator);
        $this->assertDatabaseCount('plan_custody_generations', 1);
        $this->assertDatabaseHas('plan_custody_events', [
            'plan_custody_generation_id' => $first->id,
            'event_type' => 'GENERATION_QUARANTINED',
        ]);
        $this->assertDatabaseCount('documents', 0);
        $this->assertDatabaseCount('document_links', 0);
        $this->assertDatabaseCount('plan_document_bindings', 0);
    }

    public function test_declared_type_size_digest_and_bounded_pdf_screening_fail_closed(): void
    {
        $valid = $this->pdf('declaration-check');
        $cases = [
            new StageGeneration($valid, 'text/plain', filesize($valid), hash_file('sha256', $valid), 'idempotency-wrong-mime', 'custody-service', $this->security()),
            new StageGeneration($valid, 'application/pdf', filesize($valid) + 1, hash_file('sha256', $valid), 'idempotency-wrong-size', 'custody-service', $this->security()),
            new StageGeneration($valid, 'application/pdf', filesize($valid), str_repeat('0', 64), 'idempotency-wrong-hash', 'custody-service', $this->security()),
            $this->request($this->temporary('not-a-pdf'), 'idempotency-invalid-content'),
            $this->request($this->temporary("%PDF-1.7\ntruncated"), 'idempotency-truncated'),
        ];

        foreach ($cases as $case) {
            try {
                app(PlanCustodyService::class)->stage($case);
                $this->fail('Invalid custody input was accepted.');
            } catch (CustodyViolation) {
                $this->addToAssertionCount(1);
            }
        }

        $this->assertDatabaseCount('plan_custody_generations', 0);
        $this->assertSame([], Storage::disk('plan_custody')->allFiles());
    }

    public function test_idempotency_reuse_with_different_content_is_rejected(): void
    {
        $service = app(PlanCustodyService::class);
        $service->stage($this->request($this->pdf('first'), 'shared-idempotency-key'));

        $this->expectException(CustodyViolation::class);
        try {
            $service->stage($this->request($this->pdf('second'), 'shared-idempotency-key'));
        } finally {
            $this->assertDatabaseCount('plan_custody_generations', 1);
            $this->assertCount(1, Storage::disk('plan_custody')->allFiles());
        }
    }

    public function test_server_selected_locator_collision_never_overwrites_existing_bytes(): void
    {
        $fixed = '40000000-0000-4000-8000-000000000001';
        $this->app->instance(GenerationIdSource::class, new class($fixed) implements GenerationIdSource
        {
            public function __construct(private readonly string $id) {}

            public function next(): string
            {
                return $this->id;
            }
        });
        $service = app(PlanCustodyService::class);
        $first = $service->stage($this->request($this->pdf('first-collision'), 'collision-first-key'));
        $before = Storage::disk('plan_custody')->get($first->storage_locator);

        try {
            $service->stage($this->request($this->pdf('second-collision'), 'collision-second-key'));
            $this->fail('Locator collision was accepted.');
        } catch (ObjectCollision) {
            $this->addToAssertionCount(1);
        }

        $this->assertSame($before, Storage::disk('plan_custody')->get($first->storage_locator));
        $this->assertDatabaseCount('plan_custody_generations', 1);
    }

    public function test_post_write_tampering_is_detected_and_uncommitted_object_is_removed(): void
    {
        $this->app->instance(ImmutableObjectStore::class, new class implements ImmutableObjectStore
        {
            public function putIfAbsent(string $locator, $stream): void
            {
                Storage::disk('plan_custody')->put($locator, 'tampered');
            }

            public function openForVerification(string $locator)
            {
                return Storage::disk('plan_custody')->readStream($locator);
            }

            public function deleteUncommitted(string $locator): void
            {
                Storage::disk('plan_custody')->delete($locator);
            }

            public function exists(string $locator): bool
            {
                return Storage::disk('plan_custody')->exists($locator);
            }
        });

        $this->expectException(CustodyViolation::class);
        try {
            app(PlanCustodyService::class)->stage($this->request($this->pdf('tamper-check'), 'tamper-check-key'));
        } finally {
            $this->assertDatabaseCount('plan_custody_generations', 0);
            $this->assertSame([], Storage::disk('plan_custody')->allFiles());
        }
    }

    public function test_private_write_failure_cannot_create_false_ledger_success(): void
    {
        $this->app->instance(ImmutableObjectStore::class, new class implements ImmutableObjectStore
        {
            public function putIfAbsent(string $locator, $stream): void
            {
                throw new RuntimeException('synthetic private write failure');
            }

            public function openForVerification(string $locator)
            {
                throw new RuntimeException('not reached');
            }

            public function deleteUncommitted(string $locator): void {}

            public function exists(string $locator): bool
            {
                return false;
            }
        });

        $this->expectException(RuntimeException::class);
        try {
            app(PlanCustodyService::class)->stage($this->request($this->pdf('write-failure'), 'write-failure-key'));
        } finally {
            $this->assertDatabaseCount('plan_custody_generations', 0);
        }
    }

    public function test_failed_cleanup_returns_opaque_orphan_reconciliation_signal(): void
    {
        $this->app->instance(ImmutableObjectStore::class, new class implements ImmutableObjectStore
        {
            public function putIfAbsent(string $locator, $stream): void
            {
                Storage::disk('plan_custody')->put($locator, 'tampered');
            }

            public function openForVerification(string $locator)
            {
                return Storage::disk('plan_custody')->readStream($locator);
            }

            public function deleteUncommitted(string $locator): void
            {
                throw new RuntimeException('synthetic cleanup failure');
            }

            public function exists(string $locator): bool
            {
                return Storage::disk('plan_custody')->exists($locator);
            }
        });

        try {
            app(PlanCustodyService::class)->stage($this->request($this->pdf('orphan'), 'orphan-reconciliation-key'));
            $this->fail('Failed cleanup did not return an orphan reconciliation signal.');
        } catch (OrphanedCustodyObject $exception) {
            $this->assertStringStartsWith('quarantine/', $exception->opaqueLocator);
            $this->assertInstanceOf(CustodyViolation::class, $exception->cause);
        }

        $this->assertDatabaseCount('plan_custody_generations', 0);
        $this->assertCount(1, Storage::disk('plan_custody')->allFiles());
    }

    public function test_audit_insert_failure_rolls_back_ledger_and_removes_uncommitted_object(): void
    {
        DB::unprepared(<<<'SQL'
CREATE FUNCTION g2_test_reject_custody_event() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'synthetic audit failure' USING ERRCODE='23514'; END; $$;
CREATE TRIGGER g2_test_reject_custody_event_trigger
BEFORE INSERT ON plan_custody_events FOR EACH ROW EXECUTE FUNCTION g2_test_reject_custody_event();
SQL);

        try {
            app(PlanCustodyService::class)->stage($this->request($this->pdf('audit-failure'), 'audit-failure-key'));
            $this->fail('Audit failure did not halt custody staging.');
        } catch (QueryException $exception) {
            $this->assertSame('23514', $exception->getCode());
        }

        $this->assertDatabaseCount('plan_custody_generations', 0);
        $this->assertDatabaseCount('plan_custody_events', 0);
        $this->assertSame([], Storage::disk('plan_custody')->allFiles());
    }

    public function test_scanner_is_deny_by_default_and_stale_or_mismatched_evidence_is_rejected(): void
    {
        $generation = app(PlanCustodyService::class)
            ->stage($this->request($this->pdf('scan-denials'), 'scan-denials-key'));
        $valid = $this->scan($generation);

        try {
            app(PlanCustodyService::class)->recordTrustedScan($generation, $valid, 'scanner-service');
            $this->fail('Default scanner verifier accepted evidence.');
        } catch (CustodyViolation) {
            $this->addToAssertionCount(1);
        }

        $this->allowScanner();
        foreach ([
            new ScanEvidence((string) Str::uuid(), 'CLEAN', 'scanner-a', '1', 'sig-1', str_repeat('0', 64), (int) $generation->size_bytes, 'signed', new DateTimeImmutable),
            new ScanEvidence((string) Str::uuid(), 'CLEAN', 'scanner-a', '1', 'sig-1', $generation->sha256, (int) $generation->size_bytes, 'signed', new DateTimeImmutable('-2 hours')),
        ] as $invalid) {
            try {
                app(PlanCustodyService::class)->recordTrustedScan($generation, $invalid, 'scanner-service');
                $this->fail('Invalid scanner evidence was accepted.');
            } catch (CustodyViolation) {
                $this->addToAssertionCount(1);
            }
        }

        $this->assertDatabaseCount('plan_custody_scan_evidence', 0);
    }

    public function test_trusted_clean_evidence_is_append_only_but_never_publishes_generation(): void
    {
        $generation = app(PlanCustodyService::class)
            ->stage($this->request($this->pdf('trusted-scan'), 'trusted-scan-key'));
        $this->allowScanner();
        $scan = app(PlanCustodyService::class)
            ->recordTrustedScan($generation, $this->scan($generation), 'scanner-service');

        $this->assertSame('CLEAN', $scan->decision);
        $this->assertTrue($scan->trusted);
        $this->assertSame('QUARANTINED', $generation->fresh()->custody_state);
        $this->assertDatabaseHas('plan_custody_events', [
            'plan_custody_generation_id' => $generation->id,
            'event_type' => 'SCANNER_CLEAN',
        ]);
        $this->assertDatabaseCount('documents', 0);
        $this->assertDatabaseCount('plan_document_bindings', 0);
    }

    public function test_generation_scan_and_event_rows_reject_update_and_delete_with_23514(): void
    {
        $generation = app(PlanCustodyService::class)
            ->stage($this->request($this->pdf('immutability'), 'immutability-key'));
        $this->allowScanner();
        $scan = app(PlanCustodyService::class)
            ->recordTrustedScan($generation, $this->scan($generation), 'scanner-service');
        $eventId = DB::table('plan_custody_events')->where('plan_custody_generation_id', $generation->id)->value('id');

        foreach ([
            fn () => DB::table('plan_custody_generations')->where('id', $generation->id)->update(['storage_locator' => 'tampered']),
            fn () => DB::table('plan_custody_generations')->where('id', $generation->id)->delete(),
            fn () => DB::table('plan_custody_scan_evidence')->where('id', $scan->id)->delete(),
            fn () => DB::table('plan_custody_events')->where('id', $eventId)->update(['event_type' => 'TAMPERED']),
        ] as $mutation) {
            try {
                DB::transaction($mutation);
                $this->fail('Append-only custody row was mutated.');
            } catch (QueryException $exception) {
                $this->assertSame('23514', $exception->getCode());
            }
        }
    }

    public function test_restore_fence_and_identity_epoch_contract_can_fail_closed(): void
    {
        $this->app->instance(CustodySecurityGate::class, new class implements CustodySecurityGate
        {
            public function allows(CustodySecurityContext $context): bool
            {
                return $context->mfaEpoch === 7
                    && $context->sessionEpoch === 11
                    && hash_equals('external-fence-42', $context->restoreFenceToken);
            }
        });
        $request = $this->request($this->pdf('fence'), 'restore-fence-key');

        $this->expectException(CustodyViolation::class);
        try {
            app(PlanCustodyService::class)->stage($request);
        } finally {
            $this->assertDatabaseCount('plan_custody_generations', 0);
            $this->assertSame([], Storage::disk('plan_custody')->allFiles());
        }
    }

    private function allowSecurity(): void
    {
        $this->app->instance(CustodySecurityGate::class, new class implements CustodySecurityGate
        {
            public function allows(CustodySecurityContext $context): bool
            {
                return true;
            }
        });
    }

    private function allowScanner(): void
    {
        $this->app->instance(ScannerEvidenceVerifier::class, new class implements ScannerEvidenceVerifier
        {
            public function isTrusted(ScanEvidence $evidence): bool
            {
                return true;
            }
        });
    }

    private function security(): CustodySecurityContext
    {
        return new CustodySecurityContext('synthetic-actor', 'synthetic-office', 1, 1, 'synthetic-fence');
    }

    private function request(string $path, string $key = 'synthetic-idempotency-key'): StageGeneration
    {
        return new StageGeneration(
            $path,
            'application/pdf',
            filesize($path),
            hash_file('sha256', $path),
            $key,
            'custody-service',
            $this->security(),
        );
    }

    private function scan(PlanCustodyGeneration $generation): ScanEvidence
    {
        return new ScanEvidence(
            (string) Str::uuid(),
            'CLEAN',
            'scanner-a',
            'engine-1',
            'signatures-1',
            $generation->sha256,
            (int) $generation->size_bytes,
            'synthetic-trusted-signature',
            new DateTimeImmutable,
        );
    }

    private function pdf(string $payload): string
    {
        return $this->temporary("%PDF-1.7\n{$payload}\n%%EOF");
    }

    private function temporary(string $contents): string
    {
        $path = tempnam(sys_get_temp_dir(), 'g2-custody-');
        if ($path === false || file_put_contents($path, $contents) === false) {
            throw new RuntimeException('Unable to create a synthetic custody fixture.');
        }
        $this->temporaryFiles[] = $path;

        return $path;
    }
}
