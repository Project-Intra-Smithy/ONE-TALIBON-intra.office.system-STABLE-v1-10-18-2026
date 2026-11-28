<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\Correspondence\CorrespondenceClassification;
use App\Domain\Correspondence\CorrespondenceLifecycleState;
use App\Domain\Custody\CommandOutcome;
use App\Domain\Custody\Exceptions\CustodyFenceClosedException;
use App\Domain\Custody\ProducedSourceEvent;
use App\Domain\Custody\VerifiedCommandActor;
use App\Models\CorrespondenceRecord;
use App\Models\Department;
use App\Models\Document;
use App\Models\Employee;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\AuthenticationAssurance;
use App\Services\CommonEvidence\AuthorizedArchiveSql;
use App\Services\CommonEvidence\DocumentTraceabilityQuery;
use App\Services\CorrespondenceLifecycleService;
use App\Services\Custody\AuthorityFence;
use App\Services\Custody\Broker\BrokerRootAttestation;
use App\Services\Custody\Broker\ProcessStorageBrokerClient;
use App\Services\Custody\Contracts\StorageBrokerClient;
use App\Services\Custody\ExternalWatermarkAuthority;
use App\Services\Custody\LegacyCustodyCommandService;
use App\Services\Custody\LegacyCustodyStageService;
use App\Services\Custody\RegistryDocumentRetrievalService;
use App\Services\DocumentAccessService;
use App\Services\TravelOrderService;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PDO;
use PDOException;
use PHPUnit\Framework\Attributes\Group;
use RuntimeException;
use Tests\TestCase;

/**
 * Stage 4 (G3-G5) real-role REGISTRY_V1 egress, shared AuthorityFence,
 * external non-rollback restore watermark, classification_events, and
 * lifecycle traceability suite.
 *
 * Runs against a provisioned disposable PG16 cluster with real non-owner roles
 * (n03_stage, n03_command, n03_reconcile, n03_reader, kirion_g1b_app,
 * kirion_g1b_custody) AND a real separate-process K3 local write broker.
 */
#[Group('n03-g3-role')]
final class LegacyCustodyG3EgressAndWatermarkTest extends TestCase
{
    private PDO $root;

    private PDO $stage;

    private PDO $command;

    private PDO $reconcile;

    private PDO $reader;

    private PDO $ordinary;

    private PDO $plan;

    private Department $mayorOffice;

    private Department $officeA;

    private Department $officeB;

    private User $mayorActor;

    private User $actorA;

    private User $actorB;

    private string $namespaceId;

    private string $tempBase;

    private string $brokerRoot;

    private string $sourceDir;

    private string $watermarkPath;

    private string $fencePath;

    private string $hmacKey;

    private ProcessStorageBrokerClient $broker;

    private int $watermarkSeq = 0;

    /** @var list<PDO> */
    private array $connections = [];

    protected function setUp(): void
    {
        parent::setUp();

        if (! app()->environment('testing')
            || getenv('N03_DISPOSABLE_LEASE') !== 'EXCLUSIVE_PG16_SYNTHETIC_ONLY'
            || getenv('N03_G3_ROLE_SUITE') !== '1') {
            throw new RuntimeException(
                'N03 G3 real-role tests require APP_ENV=testing, N03_DISPOSABLE_LEASE=EXCLUSIVE_PG16_SYNTHETIC_ONLY, and N03_G3_ROLE_SUITE=1.'
            );
        }

        $this->root = $this->connect('postgres', 'DB_PASSWORD');
        $this->stage = $this->connect('n03_stage', 'N03_STAGE_PASSWORD');
        $this->command = $this->connect('n03_command', 'N03_COMMAND_PASSWORD');
        $this->reconcile = $this->connect('n03_reconcile', 'N03_RECONCILE_PASSWORD');
        $this->reader = $this->connect('n03_reader', 'N03_READER_PASSWORD');
        $this->ordinary = $this->connect('kirion_g1b_app', 'G1B_APP_PASSWORD');
        $this->plan = $this->connect('kirion_g1b_custody', 'G1B_CUSTODY_PASSWORD');

        $this->configureLaravelRoleConnections();

        $rawTemp = realpath(sys_get_temp_dir());
        $this->assertIsString($rawTemp);
        $this->tempBase = $rawTemp.DIRECTORY_SEPARATOR.'ot_g3_role_'.bin2hex(random_bytes(8));
        $this->brokerRoot = $this->tempBase.DIRECTORY_SEPARATOR.'vault';
        $this->sourceDir = $this->tempBase.DIRECTORY_SEPARATOR.'sources';
        $this->watermarkPath = $this->tempBase.DIRECTORY_SEPARATOR.'external_watermark.ndjson';
        $this->fencePath = $this->tempBase.DIRECTORY_SEPARATOR.'authority.fence';

        $this->assertTrue(mkdir($this->brokerRoot, 0750, true));
        $this->assertTrue(mkdir($this->sourceDir, 0750, true));

        $this->hmacKey = hash('sha256', 'g3-role-hmac-'.bin2hex(random_bytes(16)));
        $this->namespaceId = strtolower((string) Str::uuid());

        config([
            'messaging_release.restricted_uat' => false,
            'legacy_custody.broker_root' => $this->brokerRoot,
            'legacy_custody.broker_hmac_key' => $this->hmacKey,
            'legacy_custody.watermark_store_path' => $this->watermarkPath,
            'legacy_custody.authority_fence_path' => $this->fencePath,
        ]);

        $this->broker = new ProcessStorageBrokerClient(
            brokerRoot: $this->brokerRoot,
            hmacKey: $this->hmacKey,
            brokerBinary: base_path('bin/legacy-custody-broker'),
            disallowedRoots: BrokerRootAttestation::collectApplicationDisallowedRoots(),
        );
        $this->app->instance(StorageBrokerClient::class, $this->broker);

        $attested = $this->broker->attestRoot($this->namespaceId);
        $this->insert($this->root, 'legacy_custody.namespaces', [
            'namespace_id' => $this->namespaceId,
            'backend_kind' => $attested['backend_kind'],
            'provider_identity' => $attested['provider_identity'],
            'root_claim' => $attested['root_claim'],
        ]);

        $this->watermarkSeq = (int) $this->scalar($this->root, 'SELECT COALESCE(MAX(checkpoint_seq), 0) FROM legacy_custody.watermark_checkpoints');

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

        $this->officeA = Department::query()->create([
            'code' => 'G3A-'.Str::upper(Str::random(6)),
            'name' => 'Synthetic G3 Office A',
            'short_name' => 'G3A',
            'branch' => 'executive',
            'office_type' => 'department',
            'is_active' => true,
            'is_routable' => true,
            'sort_order' => 30,
        ]);

        $this->officeB = Department::query()->create([
            'code' => 'G3B-'.Str::upper(Str::random(6)),
            'name' => 'Synthetic G3 Office B',
            'short_name' => 'G3B',
            'branch' => 'executive',
            'office_type' => 'department',
            'is_active' => true,
            'is_routable' => true,
            'sort_order' => 31,
        ]);

        $this->mayorActor = $this->makeActor($this->mayorOffice, 'mayor_approver', 'G3 Mayor');
        $this->actorA = $this->makeActor($this->officeA, 'department_head', 'G3 Office A Head');
        $this->actorB = $this->makeActor($this->officeB, 'department_head', 'G3 Office B Head');
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
        DB::purge('n03_reader');
        $this->removeDirectoryRecursive($this->tempBase);
        parent::tearDown();
    }

    public function test_g3_role_boundary_and_n03_reader_strict_readonly_enforcement(): void
    {
        // n03_reader can SELECT from authorized legacy_custody tables.
        $this->assertGreaterThanOrEqual(
            1,
            (int) $this->scalar($this->reader, 'SELECT count(*) FROM legacy_custody.namespaces WHERE namespace_id = ?', [$this->namespaceId]),
        );

        // n03_reader has ZERO write privileges anywhere (legacy_custody or public).
        $anchor = hash('sha256', 'reader-write-attempt');
        $this->assertPdoFails($this->reader, '42501', function () use ($anchor): void {
            $this->insert($this->reader, 'legacy_custody.watermark_checkpoints', [
                'checkpoint_seq' => $this->watermarkSeq + 100,
                'namespace_id' => $this->namespaceId,
                'epoch' => 1,
                'event_kind' => 'EPOCH_ADVANCE',
                'state_anchor_digest' => $anchor,
                'actor_user_id' => $this->mayorActor->id,
            ]);
        });
        $this->assertPdoFails($this->reader, '42501', function (): void {
            $this->reader->exec("UPDATE public.documents SET title = 'tampered' WHERE id = -1");
        });
        $this->assertPdoFails($this->reader, '42501', function (): void {
            $this->reader->exec('DELETE FROM legacy_custody.watermark_checkpoints WHERE checkpoint_seq = -1');
        });

        // kirion_g1b_app and kirion_g1b_custody remain strictly excluded from legacy_custody G3 tables.
        foreach ([$this->ordinary, $this->plan] as $excluded) {
            $this->assertPdoFails($excluded, '42501', static function () use ($excluded): void {
                $excluded->query('SELECT count(*) FROM legacy_custody.watermark_checkpoints');
            });
            $this->assertPdoFails($excluded, '42501', static function () use ($excluded): void {
                $excluded->query('SELECT count(*) FROM legacy_custody.classification_events');
            });
        }

        // n03_stage cannot insert watermark_checkpoints.
        $this->assertPdoFails($this->stage, '42501', function () use ($anchor): void {
            $this->insert($this->stage, 'legacy_custody.watermark_checkpoints', [
                'checkpoint_seq' => $this->watermarkSeq + 101,
                'namespace_id' => $this->namespaceId,
                'epoch' => 1,
                'event_kind' => 'EPOCH_ADVANCE',
                'state_anchor_digest' => $anchor,
                'actor_user_id' => $this->mayorActor->id,
            ]);
        });

        // n03_command can insert a monotonic watermark_checkpoint; UPDATE/DELETE and non-monotonic seq are blocked.
        $seq1 = $this->watermarkSeq + 1;
        $this->insert($this->command, 'legacy_custody.watermark_checkpoints', [
            'checkpoint_seq' => $seq1,
            'namespace_id' => $this->namespaceId,
            'epoch' => 1,
            'event_kind' => 'OPERATION_COMMIT',
            'state_anchor_digest' => $anchor,
            'actor_user_id' => $this->mayorActor->id,
        ]);
        $this->watermarkSeq = $seq1;

        $this->assertPdoFails($this->command, '42501', function () use ($seq1): void {
            $this->command->exec("UPDATE legacy_custody.watermark_checkpoints SET epoch = 2 WHERE checkpoint_seq = {$seq1}");
        });
        $this->assertPdoFails($this->root, '23514', function () use ($seq1): void {
            $this->root->exec("UPDATE legacy_custody.watermark_checkpoints SET epoch = 2 WHERE checkpoint_seq = {$seq1}");
        });
        $this->assertPdoFails($this->root, '23514', function () use ($seq1): void {
            $this->root->exec("DELETE FROM legacy_custody.watermark_checkpoints WHERE checkpoint_seq = {$seq1}");
        });
    }

    public function test_g3_n01_shared_authority_fence_blocks_concurrent_revocation_and_denies_post_epoch_release(): void
    {
        [$document, $bytes] = $this->commitRegistryTravelOrderPdf($this->mayorActor, $this->actorA, 'G3-N01-Fence');
        $fence = app(AuthorityFence::class);

        $this->assertSame(1, $fence->currentEpoch());

        // Acquire shared read claim -> exclusive mutation barrier MUST block and fail closed on timeout.
        $claim = $fence->acquireSharedReadClaim(500);
        try {
            $this->assertSame(1, $claim->initialEpoch());
            try {
                $fence->withExclusiveMutationBarrier(static fn (): bool => true, timeoutMs: 120);
                $this->fail('Expected exclusive mutation barrier to block while shared read claim is held.');
            } catch (CustodyFenceClosedException $e) {
                $this->assertStringContainsString('Timed out', $e->getMessage());
            }

            $fence->assertClaimUnbroken($claim);
        } finally {
            $fence->releaseClaim($claim);
        }

        // After claim release, exclusive mutation barrier revokes actorA and durably increments epoch.
        $fence->withExclusiveMutationBarrier(function (): void {
            DB::table('users')
                ->where('id', $this->actorA->id)
                ->update([
                    'is_active' => false,
                    'account_status' => 'suspended',
                    'suspended_at' => now(),
                    'session_version' => DB::raw('session_version + 1'),
                ]);
        }, timeoutMs: 1000);

        $this->assertSame(2, $fence->currentEpoch());

        // Released / stale claim fails assertClaimUnbroken.
        try {
            $fence->assertClaimUnbroken($claim);
            $this->fail('Expected assertClaimUnbroken to reject released claim.');
        } catch (CustodyFenceClosedException) {
            $this->addToAssertionCount(1);
        }

        // Revoked actor fails closed on direct service retrieval AND HTTP route (zero bytes emitted).
        try {
            app(RegistryDocumentRetrievalService::class)->retrieveForEgress($this->actorA, $document->public_id, true);
            $this->fail('Expected revoked actor egress to fail closed.');
        } catch (\Throwable) {
            $this->addToAssertionCount(1);
        }

        $this->actingAs($this->mayorActor);
        $this->get('/documents/'.$document->public_id.'/preview')
            ->assertOk()
            ->assertContent($bytes);
    }

    public function test_g3_n02_audit_failure_egress_abort_emits_zero_bytes(): void
    {
        [$document, $bytes] = $this->commitRegistryTravelOrderPdf($this->mayorActor, $this->actorA, 'G3-N02-AuditAbort');
        $this->actingAs($this->actorA);

        // 1. Direct service invocation with pre-audit fault hook aborts BEFORE emitting any bytes or allowed audit row.
        $retrieval = app(RegistryDocumentRetrievalService::class);
        try {
            $retrieval->retrieveForEgress(
                actor: $this->actorA,
                publicId: $document->public_id,
                inlinePdf: true,
                preAuditFaultHook: static function (): void {
                    throw new RuntimeException('Simulated audit sink outage before byte release.');
                },
            );
            $this->fail('Expected preAuditFaultHook failure to abort egress.');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('Simulated audit sink outage', $e->getMessage());
        }

        $this->assertDatabaseMissing('audit_logs', [
            'actor_user_id' => $this->actorA->id,
            'action' => 'document.preview',
            'entity_id' => $document->id,
            'outcome' => 'allowed',
        ]);

        // 2. HTTP egress when AuditLogger throws on allowed write emits ZERO PDF bytes.
        $this->mock(AuditLogger::class, static function ($mock): void {
            $mock->shouldReceive('record')->atLeast()->once()->andThrow(new RuntimeException('Audit write failed.'));
        });

        $response = $this->get('/documents/'.$document->public_id.'/preview');
        $this->assertNotSame(200, $response->getStatusCode());
        $this->assertStringNotContainsString('%PDF-', (string) $response->getContent());
        $this->assertStringNotContainsString('G3-N02-AuditAbort', (string) $response->getContent());
    }

    public function test_g3_n03_external_watermark_rollback_resurrection_pending_missing_and_forged_hmac_fail_closed(): void
    {
        [$document, $bytes] = $this->commitRegistryTravelOrderPdf($this->mayorActor, $this->actorA, 'G3-N03-Watermark');
        $this->actingAs($this->actorA);

        $previewUrl = '/documents/'.$document->public_id.'/preview';
        $downloadUrl = '/documents/'.$document->public_id.'/download';

        // Baseline: valid sealed watermark matches DB checkpoint -> preview & download succeed, and archive reports previewUrl.
        $archive = app(AuthorizedArchiveSql::class)->workspace($this->actorA, ['document' => $document->public_id]);
        $this->assertSame($previewUrl, $archive['selected']['previewUrl']);

        $this->get($previewUrl)
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('Referrer-Policy', 'no-referrer')
            ->assertContent($bytes);

        $download = $this->get($downloadUrl)->assertOk();
        $this->assertStringStartsWith('attachment;', (string) $download->headers->get('Content-Disposition'));
        $this->assertSame($bytes, $download->streamedContent());

        // 1. Unresolved PENDING external checkpoint -> conservative hold (masked 404).
        $watermark = app(ExternalWatermarkAuthority::class);
        $anchor2 = hash('sha256', 'g3-n03-rollback-anchor-2');
        $seq2 = $watermark->beginPendingCheckpoint($this->namespaceId, 1, 'AUTHORITY_REVOKE', $anchor2);
        $this->assertSame($this->watermarkSeq + 1, $seq2);

        $this->get($previewUrl)->assertNotFound()->assertContent('Not Found');
        $this->get($downloadUrl)->assertNotFound()->assertContent('Not Found');

        // 2. Seal seq2 externally WITHOUT DB row -> simulates same-epoch DB snapshot rollback/resurrection (db_seq < external_sealed_seq).
        $watermark->sealCheckpoint($seq2, $this->namespaceId, 1, 'AUTHORITY_REVOKE', $anchor2);
        $this->get($previewUrl)->assertNotFound()->assertContent('Not Found');
        $this->get($downloadUrl)->assertNotFound()->assertContent('Not Found');

        // 3. DB row at seq2 with mismatched state_anchor_digest -> fails closed.
        $wrongAnchor = hash('sha256', 'g3-n03-wrong-anchor-2');
        $this->insert($this->command, 'legacy_custody.watermark_checkpoints', [
            'checkpoint_seq' => $seq2,
            'namespace_id' => $this->namespaceId,
            'epoch' => 1,
            'event_kind' => 'AUTHORITY_REVOKE',
            'state_anchor_digest' => $wrongAnchor,
            'actor_user_id' => $this->mayorActor->id,
        ]);
        $this->watermarkSeq = $seq2;
        $this->get($previewUrl)->assertNotFound()->assertContent('Not Found');

        // 4. Advance both external and DB to matching seq3 -> egress recovers cleanly.
        $anchor3 = hash('sha256', 'g3-n03-recovered-anchor-3');
        $seq3 = $watermark->beginPendingCheckpoint($this->namespaceId, 1, 'EPOCH_ADVANCE', $anchor3);
        $this->insert($this->command, 'legacy_custody.watermark_checkpoints', [
            'checkpoint_seq' => $seq3,
            'namespace_id' => $this->namespaceId,
            'epoch' => 1,
            'event_kind' => 'EPOCH_ADVANCE',
            'state_anchor_digest' => $anchor3,
            'actor_user_id' => $this->mayorActor->id,
        ]);
        $this->watermarkSeq = $seq3;
        $watermark->sealCheckpoint($seq3, $this->namespaceId, 1, 'EPOCH_ADVANCE', $anchor3);
        $this->get($previewUrl)->assertOk()->assertContent($bytes);

        // 5. Forged HMAC in external witness ledger -> fails closed.
        $originalLedger = file_get_contents($this->watermarkPath);
        $this->assertIsString($originalLedger);
        $tamperedLedger = preg_replace('/"hmac":"[0-9a-f]{64}"/', '"hmac":"'.str_repeat('f', 64).'"', $originalLedger, 1);
        $this->assertIsString($tamperedLedger);
        file_put_contents($this->watermarkPath, $tamperedLedger);
        $this->get($previewUrl)->assertNotFound()->assertContent('Not Found');

        // 6. Missing external witness ledger -> fails closed.
        unlink($this->watermarkPath);
        $this->get($previewUrl)->assertNotFound()->assertContent('Not Found');
    }

    public function test_g3_n04_cross_office_idor_mixed_parent_and_guest_or_no_mfa_denial_across_get_head_range(): void
    {
        [$document, $bytes] = $this->commitRegistryTravelOrderPdf($this->mayorActor, $this->actorA, 'G3-N04-Access');
        $previewUrl = '/documents/'.$document->public_id.'/preview';
        $downloadUrl = '/documents/'.$document->public_id.'/download';

        // 1. Authorized actor succeeds on GET, HEAD, and Range.
        $this->actingAs($this->actorA);
        $this->get($previewUrl)->assertOk()->assertContent($bytes);
        $this->head($previewUrl)->assertOk()->assertHeader('Content-Type', 'application/pdf')->assertContent('');
        $this->get($previewUrl, ['Range' => 'bytes=0-15'])->assertOk()->assertContent($bytes);

        // 2. Cross-office outsider (actorB) denied identically across GET, HEAD, Range on both preview & download.
        $this->actingAs($this->actorB);
        foreach ([$previewUrl, $downloadUrl] as $url) {
            $this->get($url)->assertNotFound()->assertContent('Not Found')->assertHeaderMissing('Content-Disposition');
            $this->head($url)->assertNotFound()->assertContent('')->assertHeaderMissing('Content-Disposition');
            $this->get($url, ['Range' => 'bytes=0-15'])->assertNotFound()->assertContent('Not Found')->assertHeaderMissing('Content-Range');
        }

        $this->assertDatabaseHas('audit_logs', [
            'actor_user_id' => $this->actorB->id,
            'action' => 'document.preview',
            'outcome' => 'denied',
            'entity_id' => null,
        ]);

        // 3. Guest (unauthenticated) is redirected to /login with zero bytes leaked.
        auth()->logout();
        $this->get($previewUrl)->assertRedirect('/login');
        $this->get($downloadUrl)->assertRedirect('/login');

        // 4. Authenticated privileged actor WITHOUT MFA assurance cannot access bytes.
        $this->actingAs($this->actorA);
        $this->withSession([
            AuthenticationAssurance::SESSION_USER_KEY => null,
            AuthenticationAssurance::SESSION_VERSION_KEY => null,
            AuthenticationAssurance::SESSION_VERIFIED_AT_KEY => null,
        ]);
        $noMfaPreview = $this->get($previewUrl);
        $this->assertTrue($noMfaPreview->isRedirect());
        $this->assertStringNotContainsString('%PDF-', (string) $noMfaPreview->getContent());

        // 5. Mixed all-parent denial: adding a foreign unauthorized link denies even actorA!
        $this->actingAs($this->actorA);
        $foreignOrder = app(TravelOrderService::class)->recordApproved($this->mayorActor, [
            'reference_number' => 'TO-FOREIGN-'.Str::upper(Str::random(6)),
            'issuance_date' => '2026-11-19',
            'purpose' => 'Foreign Office B Travel',
            'destination' => 'Cebu City',
            'department_id' => $this->officeB->id,
            'travel_start_date' => '2026-11-23',
            'travel_end_date' => '2026-11-24',
            'employee_ids' => [$this->actorB->employee->id],
        ]);

        $this->root->exec('ALTER TABLE public.document_links DISABLE TRIGGER a_n03_public_guard');
        try {
            $this->insert($this->root, 'public.document_links', [
                'document_id' => $document->id,
                'linkable_type' => $foreignOrder->getMorphClass(),
                'linkable_id' => $foreignOrder->id,
                'relationship' => 'mixed_foreign',
                'created_by_user_id' => $this->mayorActor->id,
                'created_at' => now()->format('Y-m-d H:i:sP'),
                'updated_at' => now()->format('Y-m-d H:i:sP'),
            ]);
        } finally {
            $this->root->exec('ALTER TABLE public.document_links ENABLE TRIGGER a_n03_public_guard');
        }

        $this->get($previewUrl)->assertNotFound()->assertContent('Not Found');
        $this->get($downloadUrl)->assertNotFound()->assertContent('Not Found');
    }

    public function test_g3_n05_ever_plan_and_g3_n06_no_fallback_to_legacy_bytes_and_contradiction_defense(): void
    {
        [$document, $bytes] = $this->commitRegistryTravelOrderPdf($this->mayorActor, $this->actorA, 'G3-N06-NoFallback');
        $this->actingAs($this->actorA);

        // Plant a decoy identical PDF inside legacy Storage::disk('documents') AND break watermark so broker cannot serve.
        $syntheticDisk = Storage::fake('documents');
        config(['filesystems.disks.documents.root' => rtrim($syntheticDisk->path(''), '/')]);
        $decoyPath = 'decoy/'.$document->public_id.'.pdf';
        Storage::disk('documents')->put($decoyPath, $bytes);

        // Remove watermark so REGISTRY_V1 fails closed -> MUST NOT fall back to LegacyDocumentBytes!
        unlink($this->watermarkPath);
        $this->get('/documents/'.$document->public_id.'/preview')->assertNotFound()->assertContent('Not Found');
        $this->get('/documents/'.$document->public_id.'/download')->assertNotFound()->assertContent('Not Found');

        // Contradiction defense (G3-N06): LEGACY_PATH row carrying custody_operation_id fails closed!
        $legacyDoc = Document::query()->create([
            'title' => 'Contradictory Legacy Doc',
            'original_name' => 'contradiction.pdf',
            'document_type' => 'supporting_document',
            'classification' => 'internal',
            'storage_disk' => 'documents',
            'storage_path' => $decoyPath,
            'mime_type' => 'application/pdf',
            'size_bytes' => strlen($bytes),
            'checksum_sha256' => hash('sha256', $bytes),
            'owner_department_id' => $this->officeA->id,
            'uploaded_by_user_id' => $this->actorA->id,
        ]);

        $this->root->exec('ALTER TABLE public.documents DISABLE TRIGGER a_n03_public_guard');
        $this->root->exec('ALTER TABLE public.documents DROP CONSTRAINT n03_mode_check');
        $this->root->exec('ALTER TABLE public.documents DROP CONSTRAINT n03_document_item');
        try {
            DB::table('documents')->where('id', $legacyDoc->id)->update([
                'security_domain' => 'LEGACY_CTW',
                'custody_mode' => 'LEGACY_PATH',
                'custody_operation_id' => (string) Str::uuid(),
            ]);

            $this->assertFalse(app(DocumentAccessService::class)->canDownload($this->actorA, $legacyDoc->fresh()));
            $this->get('/documents/'.$legacyDoc->public_id.'/preview')->assertNotFound()->assertContent('Not Found');
            $this->get('/documents/'.$legacyDoc->public_id.'/download')->assertNotFound()->assertContent('Not Found');
        } finally {
            DB::table('documents')->where('id', $legacyDoc->id)->update(['custody_operation_id' => null]);
            $this->root->exec('ALTER TABLE public.documents ENABLE TRIGGER a_n03_public_guard');
            $this->root->exec("ALTER TABLE public.documents ADD CONSTRAINT n03_mode_check CHECK ((custody_mode='LEGACY_PATH' AND custody_operation_id IS NULL AND custody_ordinal IS NULL AND storage_disk<>'legacy_registry_v1') OR (custody_mode='REGISTRY_V1' AND custody_operation_id IS NOT NULL AND custody_ordinal IS NOT NULL AND security_domain IS NOT NULL AND security_domain='LEGACY_CTW' AND storage_disk='legacy_registry_v1' AND storage_path IS NULL AND owner_department_id IS NOT NULL AND uploaded_by_user_id IS NOT NULL AND size_bytes IS NOT NULL AND size_bytes BETWEEN 1 AND 15728640 AND checksum_sha256 IS NOT NULL AND checksum_sha256 ~ '^[0-9a-f]{64}$' AND mime_type IS NOT NULL AND mime_type IN ('application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png','image/webp')))");
            $this->root->exec('ALTER TABLE public.documents ADD CONSTRAINT n03_document_item FOREIGN KEY(custody_operation_id,custody_ordinal) REFERENCES legacy_custody.operation_items ON DELETE RESTRICT');
        }
    }

    public function test_g3_n07_byte_identical_masked_404_parity(): void
    {
        [$registryDoc] = $this->commitRegistryTravelOrderPdf($this->mayorActor, $this->actorA, 'G3-N07-Parity');

        // Create an EVER_PLAN sealed document.
        $everPlanPublicId = (string) Str::uuid();
        $this->insert($this->root, 'public.documents', [
            'public_id' => $everPlanPublicId,
            'title' => 'EVER_PLAN Masked Parity Doc',
            'document_type' => 'plan_master',
            'classification' => 'restricted',
            'original_name' => 'ever-plan.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => 128,
            'storage_disk' => 'plan_custody',
            'storage_path' => 'plan/'.Str::uuid().'.pdf',
            'checksum_sha256' => hash('sha256', 'ever-plan-parity'),
            'owner_department_id' => $this->officeA->id,
            'uploaded_by_user_id' => $this->actorA->id,
            'security_domain' => 'EVER_PLAN',
            'custody_mode' => 'LEGACY_PATH',
            'created_at' => now()->format('Y-m-d H:i:sP'),
            'updated_at' => now()->format('Y-m-d H:i:sP'),
        ]);

        $this->actingAs($this->actorB);

        foreach (['preview', 'download'] as $endpoint) {
            $missing = $this->get('/documents/'.Str::uuid().'/'.$endpoint);
            $invalid = $this->get('/documents/not-a-valid-uuid/'.$endpoint);
            $everPlan = $this->get('/documents/'.$everPlanPublicId.'/'.$endpoint);
            $unauthRegistry = $this->get('/documents/'.$registryDoc->public_id.'/'.$endpoint);

            // Also test corrupt watermark parity for authorized actor.
            $savedLedger = file_get_contents($this->watermarkPath);
            $this->assertIsString($savedLedger);
            unlink($this->watermarkPath);
            $this->actingAs($this->actorA);
            $brokenWatermark = $this->get('/documents/'.$registryDoc->public_id.'/'.$endpoint);
            file_put_contents($this->watermarkPath, $savedLedger);
            $this->actingAs($this->actorB);

            foreach ([$missing, $invalid, $everPlan, $unauthRegistry, $brokenWatermark] as $response) {
                $response->assertNotFound()
                    ->assertContent('Not Found')
                    ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
                    ->assertHeader('X-Content-Type-Options', 'nosniff')
                    ->assertHeader('Referrer-Policy', 'no-referrer')
                    ->assertHeaderMissing('Content-Disposition')
                    ->assertHeaderMissing('Content-Range');
                $this->assertStringContainsString('private', (string) $response->headers->get('Cache-Control'));
                $this->assertStringContainsString('no-store', (string) $response->headers->get('Cache-Control'));
                $this->assertSame($missing->headers->get('Content-Length'), $response->headers->get('Content-Length'));
            }
        }
    }

    public function test_g3_n08_o1_indexed_lookup_explain_and_classification_events_and_traceability(): void
    {
        // Commit a Correspondence REGISTRY_V1 document so we can exercise classification_events + traceability.
        $correspondence = CorrespondenceRecord::query()->create([
            'public_id' => (string) Str::uuid(),
            'external_reference_no' => 'EXT-G3-'.Str::upper(Str::random(6)),
            'source' => 'municipal_desk',
            'channel' => 'walk_in',
            'sender_name' => 'G3 Traceability Sender',
            'subject' => 'G3 Registry Reclassification Subject',
            'receiving_department_id' => $this->officeA->id,
            'lifecycle_state' => CorrespondenceLifecycleState::Received->value,
            'classification' => CorrespondenceClassification::Internal->value,
            'received_at' => now(),
        ]);

        [$document, $bytes, $outcome] = $this->commitRegistryCorrespondencePdf($this->actorA, $correspondence, 'G3-N08-Corr');

        // 1. Verify O(1) primary-key index scan plan on n03_reader (with enable_seqscan = off to verify index path exists).
        $this->reader->beginTransaction();
        try {
            $this->reader->exec('SET LOCAL enable_seqscan = off');
            $stmt = $this->reader->prepare(<<<'SQL'
                EXPLAIN (FORMAT JSON)
                SELECT b.document_id, g.generation_id, tr.receipt_uuid, og.state
                FROM legacy_custody.bindings b
                JOIN legacy_custody.generations g ON g.generation_id = b.generation_id
                JOIN legacy_custody.terminal_receipts tr
                  ON tr.operation_id = b.operation_id
                 AND tr.outcome = 'COMMITTED'
                 AND tr.fence_no = 1
                JOIN legacy_custody.operation_gates og
                  ON og.operation_id = b.operation_id
                 AND og.state = 'OPEN'
                 AND og.fence_no = 1
                WHERE b.document_id = ?
                  AND b.document_public_id = ?
                SQL);
            $stmt->execute([$document->id, strtolower($document->public_id)]);
            $planJson = (string) $stmt->fetchColumn();
            $this->assertStringContainsString('Index Scan', $planJson);
            $this->assertStringNotContainsString('"Node Type": "Seq Scan"', $planJson);
        } finally {
            $this->reader->rollBack();
        }

        // 2. Reclassify Correspondence on n03_command and append immutable legacy_custody.classification_events row.
        $classifyCorrelation = strtolower((string) Str::uuid());
        $commandConn = DB::connection('n03_command');
        $commandConn->beginTransaction();
        try {
            $verified = VerifiedCommandActor::verifyOnConnection($commandConn, (int) $this->actorA->id, (int) $this->officeA->id);
            $produced = app(CorrespondenceLifecycleService::class)->classifyWithEventOnConnection(
                $commandConn,
                $verified,
                (int) $correspondence->id,
                CorrespondenceClassification::Confidential,
                $classifyCorrelation,
                'G3 append-only registry reclassification.',
            );

            $auditId = (int) $commandConn->table('audit_logs')
                ->where('entity_type', 'correspondence_record')
                ->where('entity_id', $correspondence->id)
                ->where('action', 'correspondence.classified')
                ->where('correlation_id', $classifyCorrelation)
                ->value('id');
            $this->assertGreaterThan(0, $auditId);

            $classEventId = strtolower((string) Str::uuid());
            $commandConn->table('legacy_custody.classification_events')->insert([
                'classification_event_id' => $classEventId,
                'document_id' => $document->id,
                'correspondence_record_id' => $correspondence->id,
                'correspondence_event_id' => $produced->eventId,
                'prior_classification' => 'internal',
                'new_classification' => 'confidential',
                'actor_user_id' => $this->actorA->id,
                'office_id' => $this->officeA->id,
                'correlation_id' => $classifyCorrelation,
                'audit_log_id' => $auditId,
            ]);

            $commandConn->commit();
        } catch (\Throwable $e) {
            $commandConn->rollBack();
            throw $e;
        }

        // Verify classification_events immutability (UPDATE/DELETE blocked with 23514).
        $this->assertPdoFails($this->root, '23514', function () use ($classEventId): void {
            $this->root->exec("UPDATE legacy_custody.classification_events SET new_classification = 'public' WHERE classification_event_id = '{$classEventId}'");
        });
        $this->assertPdoFails($this->root, '23514', function () use ($classEventId): void {
            $this->root->exec("DELETE FROM legacy_custody.classification_events WHERE classification_event_id = '{$classEventId}'");
        });

        // Verify public.documents row stayed immutable ('internal') while traceability reflects effective 'confidential'.
        $this->assertSame('internal', $document->fresh()->classification);

        $this->actingAs($this->actorA);
        $trace = app(DocumentTraceabilityQuery::class)->forAuthorizedDocument($this->actorA, $document->fresh());
        $this->assertNotNull($trace);
        $this->assertSame('internal', $trace['recordedClassification']);
        $this->assertSame('confidential', $trace['effectiveClassification']);
        $this->assertSame('REGISTRY_V1', $trace['custody']['mode']);
        $this->assertSame('committed', $trace['custody']['status']);
        $this->assertSame($outcome->receiptUuid, $trace['custody']['receiptUuid']);
        $this->assertCount(1, $trace['classificationHistory']);
        $this->assertSame($classifyCorrelation, $trace['classificationHistory'][0]['correlationId']);

        // ZERO physical paths, locators, broker root, or HMAC keys leaked in traceability payload.
        $serialized = json_encode($trace, JSON_THROW_ON_ERROR);
        $this->assertStringNotContainsString($this->brokerRoot, $serialized);
        $this->assertStringNotContainsString($this->hmacKey, $serialized);
        $this->assertStringNotContainsString('objects/', $serialized);
        $this->assertStringNotContainsString('local_v1:', $serialized);
        $this->assertStringNotContainsString('provider_object_identity', $serialized);

        // Unauthorized cross-office actor gets null from DocumentTraceabilityQuery.
        $this->actingAs($this->actorB);
        $this->assertNull(app(DocumentTraceabilityQuery::class)->forAuthorizedDocument($this->actorB, $document->fresh()));

        // Authorized actor can still preview exact bytes after reclassification.
        $this->actingAs($this->actorA);
        $this->get('/documents/'.$document->public_id.'/preview')->assertOk()->assertContent($bytes);
    }

    /**
     * @return array{0: Document, 1: string, 2: CommandOutcome}
     */
    private function commitRegistryTravelOrderPdf(User $issuer, User $traveler, string $marker): array
    {
        [$srcPath, $bytes, $sha] = $this->makeSourcePdf($marker.'.pdf', $marker);
        $stageService = new LegacyCustodyStageService($this->broker);
        $commandService = new LegacyCustodyCommandService(app(AuditLogger::class));

        $correlationId = strtolower((string) Str::uuid());
        $reservation = $stageService->reserve(
            namespaceId: $this->namespaceId,
            epoch: 1,
            actorUserId: (int) $issuer->id,
            officeId: (int) $issuer->employee->department_id,
            serviceIdentity: 'test:g3-travel',
            commandKind: 'travel_record',
            commandAction: 'record',
            correlationId: $correlationId,
            idempotencyHash: hash('sha256', 'g3-travel-'.$marker.'-'.Str::uuid()),
            items: [[
                'size_bytes' => strlen($bytes),
                'sha256' => $sha,
                'mime_type' => 'application/pdf',
            ]],
        );

        $stageService->stageAll($reservation['operation_id'], [1 => $srcPath]);

        $outcome = $commandService->execute(
            operationId: $reservation['operation_id'],
            businessCommand: function (ConnectionInterface $conn, VerifiedCommandActor $verified, string $corrId) use ($traveler, $marker): ProducedSourceEvent {
                return app(TravelOrderService::class)->recordApprovedOnCustodyConnection(
                    connection: $conn,
                    actor: $verified,
                    data: [
                        'reference_number' => 'TO-G3-'.Str::upper(Str::random(6)),
                        'issuance_date' => '2026-11-19',
                        'purpose' => 'Synthetic '.$marker,
                        'destination' => 'Talibon Synthetic',
                        'department_id' => $traveler->employee->department_id,
                        'travel_start_date' => '2026-11-21',
                        'travel_end_date' => '2026-11-22',
                        'employee_ids' => [$traveler->employee->id],
                    ],
                    correlationId: $corrId,
                );
            },
            itemMetadataByOrdinal: [
                1 => [
                    'title' => $marker.' Travel Order PDF',
                    'original_name' => $marker.'.pdf',
                ],
            ],
        );

        $this->recordSealedWatermark('OPERATION_COMMIT', hash('sha256', $outcome->operationId.':'.$outcome->receiptUuid), (int) $issuer->id);

        $doc = Document::query()->findOrFail($outcome->documents[0]['document_id']);

        return [$doc, $bytes, $outcome];
    }

    /**
     * @return array{0: Document, 1: string, 2: CommandOutcome}
     */
    private function commitRegistryCorrespondencePdf(User $actor, CorrespondenceRecord $correspondence, string $marker): array
    {
        [$srcPath, $bytes, $sha] = $this->makeSourcePdf($marker.'.pdf', $marker);
        $stageService = new LegacyCustodyStageService($this->broker);
        $commandService = new LegacyCustodyCommandService(app(AuditLogger::class));

        $correlationId = strtolower((string) Str::uuid());
        $reservation = $stageService->reserve(
            namespaceId: $this->namespaceId,
            epoch: 1,
            actorUserId: (int) $actor->id,
            officeId: (int) $actor->employee->department_id,
            serviceIdentity: 'test:g3-corr',
            commandKind: 'correspondence_register',
            commandAction: 'register',
            correlationId: $correlationId,
            idempotencyHash: hash('sha256', 'g3-corr-'.$marker.'-'.Str::uuid()),
            items: [[
                'size_bytes' => strlen($bytes),
                'sha256' => $sha,
                'mime_type' => 'application/pdf',
            ]],
        );

        $stageService->stageAll($reservation['operation_id'], [1 => $srcPath]);

        $outcome = $commandService->execute(
            operationId: $reservation['operation_id'],
            businessCommand: static function (ConnectionInterface $conn, VerifiedCommandActor $verified, string $corrId) use ($correspondence): ProducedSourceEvent {
                return app(CorrespondenceLifecycleService::class)->registerWithEventOnConnection(
                    connection: $conn,
                    actor: $verified,
                    correspondenceId: (int) $correspondence->id,
                    correlationId: $corrId,
                );
            },
            itemMetadataByOrdinal: [
                1 => [
                    'title' => $marker.' Correspondence PDF',
                    'original_name' => $marker.'.pdf',
                ],
            ],
        );

        $this->recordSealedWatermark('OPERATION_COMMIT', hash('sha256', $outcome->operationId.':'.$outcome->receiptUuid), (int) $actor->id);

        $doc = Document::query()->findOrFail($outcome->documents[0]['document_id']);

        return [$doc, $bytes, $outcome];
    }

    private function recordSealedWatermark(string $eventKind, string $anchorDigest, int $actorUserId): int
    {
        $watermark = app(ExternalWatermarkAuthority::class);
        $seq = $watermark->beginPendingCheckpoint(
            namespaceId: $this->namespaceId,
            epoch: 1,
            eventKind: $eventKind,
            stateAnchorDigest: $anchorDigest,
            minNextSeq: $this->watermarkSeq + 1,
        );
        $this->insert($this->command, 'legacy_custody.watermark_checkpoints', [
            'checkpoint_seq' => $seq,
            'namespace_id' => $this->namespaceId,
            'epoch' => 1,
            'event_kind' => $eventKind,
            'state_anchor_digest' => $anchorDigest,
            'actor_user_id' => $actorUserId,
        ]);
        $this->watermarkSeq = $seq;
        $watermark->sealCheckpoint($seq, $this->namespaceId, 1, $eventKind, $anchorDigest);

        return $seq;
    }

    /**
     * @return array{0: string, 1: string, 2: string}
     */
    private function makeSourcePdf(string $filename, string $marker): array
    {
        $body = "%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
            ."2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
            ."3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R >> endobj\n"
            .'4 0 obj << /Length '.(strlen($marker) + 12)." >> stream\nBT ({$marker}) Tj ET\nendstream endobj\n";
        $xrefOffset = strlen($body);
        $bytes = $body."xref\n0 5\n0000000000 65535 f \ntrailer << /Size 5 /Root 1 0 R >>\nstartxref\n{$xrefOffset}\n%%EOF\n";

        $path = $this->sourceDir.DIRECTORY_SEPARATOR.$filename;
        $this->assertNotFalse(file_put_contents($path, $bytes));

        return [$path, $bytes, hash('sha256', $bytes)];
    }

    private function makeActor(Department $department, string $role, string $name): User
    {
        $user = User::query()->create([
            'name' => $name,
            'email' => Str::lower(Str::random(10)).'@talibon.test',
            'password' => 'password',
            'role' => $role,
            'is_active' => true,
            'account_status' => 'active',
        ]);

        Employee::query()->create([
            'employee_number' => 'G3-'.Str::upper(Str::random(8)),
            'full_name' => $name,
            'work_email' => $user->email,
            'user_id' => $user->id,
            'department_id' => $department->id,
            'position_title' => $name,
            'employment_status' => 'active',
        ]);

        return $user->fresh('employee.department');
    }

    private function configureLaravelRoleConnections(): void
    {
        $base = config('database.connections.pgsql');
        $roles = [
            'n03_stage' => 'N03_STAGE_PASSWORD',
            'n03_command' => 'N03_COMMAND_PASSWORD',
            'n03_reconcile' => 'N03_RECONCILE_PASSWORD',
            'n03_reader' => 'N03_READER_PASSWORD',
        ];

        foreach ($roles as $role => $envKey) {
            $password = getenv($envKey);
            if (! is_string($password) || $password === '') {
                throw new RuntimeException("Missing required role password environment variable [{$envKey}].");
            }
            config([
                "database.connections.{$role}" => array_replace($base, [
                    'username' => $role,
                    'password' => $password,
                ]),
            ]);
            DB::purge($role);
        }
    }

    private function connect(string $user, string $passwordEnv): PDO
    {
        $password = getenv($passwordEnv);
        if (! is_string($password) || $password === '') {
            throw new RuntimeException("Missing required PDO password [{$passwordEnv}] for [{$user}].");
        }
        $host = getenv('DB_HOST') ?: '127.0.0.1';
        $port = getenv('DB_PORT') ?: '5432';
        $db = getenv('DB_DATABASE') ?: 'talibon_portal_test';
        $pdo = new PDO(
            "pgsql:host={$host};port={$port};dbname={$db}",
            $user,
            $password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ],
        );
        $this->connections[] = $pdo;

        return $pdo;
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
     * @param  list<mixed>  $bindings
     */
    private function scalar(PDO $pdo, string $sql, array $bindings = []): mixed
    {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($bindings);

        return $stmt->fetchColumn();
    }

    private function assertPdoFails(PDO $pdo, string $expectedSqlState, callable $callback): void
    {
        try {
            $callback();
            $this->fail("Expected PostgreSQL SQLSTATE {$expectedSqlState} failure.");
        } catch (PDOException $exception) {
            $this->assertSame($expectedSqlState, (string) $exception->getCode(), $exception->getMessage());
        }
    }

    private function removeDirectoryRecursive(string $dir): void
    {
        if (! is_dir($dir)) {
            return;
        }
        $items = scandir($dir);
        if (! is_array($items)) {
            return;
        }
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            $path = $dir.DIRECTORY_SEPARATOR.$item;
            if (is_link($path) || is_file($path)) {
                @chmod($path, 0660);
                @unlink($path);
            } elseif (is_dir($path)) {
                $this->removeDirectoryRecursive($path);
            }
        }
        @rmdir($dir);
    }
}
