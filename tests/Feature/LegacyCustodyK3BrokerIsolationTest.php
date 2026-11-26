<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\Custody\Exceptions\CustodyFenceClosedException;
use App\Domain\Custody\Exceptions\CustodyViolationException;
use App\Services\Custody\Broker\BrokerRootAttestation;
use App\Services\Custody\Broker\LocalImmutableBrokerEngine;
use App\Services\Custody\Broker\ProcessStorageBrokerClient;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Group;
use Tests\TestCase;

/**
 * Stage 3 (K3) isolated local write broker & immutable physical generation suite.
 *
 * Pure filesystem + real separate OS subprocess (proc_open) verification.
 * Requires no PostgreSQL instance.
 */
#[Group('n03-k3-broker')]
final class LegacyCustodyK3BrokerIsolationTest extends TestCase
{
    private string $tempBase;

    private string $brokerRoot;

    private string $sourceDir;

    private string $hmacKey;

    private string $namespaceId;

    protected function setUp(): void
    {
        parent::setUp();

        $rawTemp = realpath(sys_get_temp_dir());
        $this->assertIsString($rawTemp);

        $this->tempBase = $rawTemp.DIRECTORY_SEPARATOR.'ot_k3_broker_'.bin2hex(random_bytes(8));
        $this->brokerRoot = $this->tempBase.DIRECTORY_SEPARATOR.'vault';
        $this->sourceDir = $this->tempBase.DIRECTORY_SEPARATOR.'sources';

        $this->assertTrue(mkdir($this->brokerRoot, 0750, true));
        $this->assertTrue(mkdir($this->sourceDir, 0750, true));

        $this->hmacKey = hash('sha256', 'k3-test-hmac-key-'.bin2hex(random_bytes(16)));
        $this->namespaceId = strtolower((string) Str::uuid());

        config([
            'legacy_custody.broker_root' => $this->brokerRoot,
            'legacy_custody.broker_hmac_key' => $this->hmacKey,
        ]);
    }

    protected function tearDown(): void
    {
        $this->removeDirectoryRecursive($this->tempBase);
        parent::tearDown();
    }

    public function test_k3_n01_root_isolation_disjointness_and_filesystems_untouched(): void
    {
        // K3 storage must NEVER be registered in config/filesystems.php.
        $disks = config('filesystems.disks');
        $this->assertIsArray($disks);
        $this->assertArrayNotHasKey('legacy_registry_v1', $disks);
        $this->assertArrayNotHasKey('legacy_custody', $disks);
        $this->assertArrayHasKey('documents', $disks);
        $this->assertArrayHasKey('plan_custody', $disks);

        // Unset or empty broker root must fail closed.
        config(['legacy_custody.broker_root' => null]);
        $unsetClient = new ProcessStorageBrokerClient(hmacKey: $this->hmacKey);
        try {
            $unsetClient->attestRoot($this->namespaceId);
            $this->fail('Expected unset broker_root to fail closed.');
        } catch (CustodyViolationException $e) {
            $this->assertStringContainsString('unset or empty', $e->getMessage());
        }

        // Reject overlaps with every Laravel storage disk, storage_path(), public_path(), and children/parents.
        $forbiddenCandidates = [
            storage_path(),
            storage_path('app/private'),
            storage_path('app/core-documents'),
            storage_path('app/plan-custody-quarantine'),
            storage_path('app/public'),
            public_path(),
            dirname(storage_path()), // parent of storage_path()
        ];

        $attestation = new BrokerRootAttestation;
        foreach ($forbiddenCandidates as $candidate) {
            if (! is_dir($candidate)) {
                continue;
            }
            try {
                $attestation->attest($candidate, $this->namespaceId);
                $this->fail("Expected forbidden root [{$candidate}] to be rejected.");
            } catch (CustodyViolationException $e) {
                $this->assertStringContainsString('overlaps forbidden', $e->getMessage());
            }
        }

        // Reject relative paths and traversal attempts.
        foreach (['relative/vault', $this->brokerRoot.DIRECTORY_SEPARATOR.'..'.DIRECTORY_SEPARATOR.'vault'] as $badRoot) {
            try {
                $attestation->attest($badRoot, $this->namespaceId);
                $this->fail("Expected malformed root [{$badRoot}] to be rejected.");
            } catch (CustodyViolationException) {
                $this->addToAssertionCount(1);
            }
        }

        // Valid isolated root succeeds via real separate OS subprocess (distinct PID).
        $client = $this->makeProcessClient();
        $attested = $client->attestRoot($this->namespaceId);
        $this->assertSame('local_broker_v1', $attested['backend_kind']);
        $this->assertSame($this->namespaceId, $attested['namespace_id']);
        $this->assertNotNull($client->lastBrokerPid());
        $this->assertNotSame(getmypid(), $client->lastBrokerPid());

        // NOX-K2K3-01: BrokerRootAttestation must fail closed if disallowedRoots is empty or resolves to zero valid paths.
        try {
            $attestation->attest($this->brokerRoot, $this->namespaceId, BrokerRootAttestation::BACKEND_KIND, []);
            $this->fail('Expected empty disallowedRoots array to fail closed.');
        } catch (CustodyViolationException $e) {
            $this->assertStringContainsString('non-empty disallowed roots', $e->getMessage());
        }

        try {
            $attestation->attest($this->brokerRoot, $this->namespaceId, BrokerRootAttestation::BACKEND_KIND, ['', '   ']);
            $this->fail('Expected whitespace-only disallowedRoots array to fail closed.');
        } catch (CustodyViolationException $e) {
            $this->assertStringContainsString('zero valid normalized disallowed roots', $e->getMessage());
        }

        // NOX-K2K3-01: bin/legacy-custody-broker must fail closed when LEGACY_CUSTODY_DISALLOWED_ROOTS_JSON is missing or empty.
        foreach ([null, '', '[]', '[""]'] as $badDisallowedJson) {
            $proc = $this->spawnRawBrokerProcess('attestRoot', [
                'namespace_id' => $this->namespaceId,
            ], customEnv: ['LEGACY_CUSTODY_DISALLOWED_ROOTS_JSON' => $badDisallowedJson]);
            $res = $this->collectRawBrokerProcess($proc);
            $this->assertFalse($res['json']['ok'] ?? true);
            $this->assertSame('BROKER_CONFIG_INVALID', $res['json']['error_code'] ?? '');
        }

        // NOX-K2K3-01: bin/legacy-custody-broker unconditionally merges dirname(__DIR__).'/storage' and '/public'
        // even if caller passes an unrelated disallowed root in LEGACY_CUSTODY_DISALLOWED_ROOTS_JSON.
        $unrelatedForbidden = $this->tempBase.DIRECTORY_SEPARATOR.'unrelated_forbidden';
        mkdir($unrelatedForbidden, 0750, true);
        foreach ([storage_path(), public_path()] as $alwaysForbiddenRoot) {
            if (! is_dir($alwaysForbiddenRoot)) {
                continue;
            }
            $proc = $this->spawnRawBrokerProcess('attestRoot', [
                'namespace_id' => $this->namespaceId,
            ], customEnv: [
                'LEGACY_CUSTODY_BROKER_ROOT' => $alwaysForbiddenRoot,
                'LEGACY_CUSTODY_DISALLOWED_ROOTS_JSON' => json_encode([$unrelatedForbidden], JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES),
            ]);
            $res = $this->collectRawBrokerProcess($proc);
            $this->assertFalse($res['json']['ok'] ?? true);
            $this->assertStringContainsString('overlaps forbidden', (string) ($res['json']['message'] ?? ''));
        }
    }

    public function test_k3_n02_exclusive_create_collision_and_concurrent_os_process_race(): void
    {
        $client = $this->makeProcessClient();
        $opA = strtolower((string) Str::uuid());
        $opB = strtolower((string) Str::uuid());
        $genId = strtolower((string) Str::uuid());
        $locator = $this->locatorFor($genId);

        $bytesA = "%PDF-1.4\n%Process-A-Original-Content-".str_repeat('A', 2048)."\n%%EOF\n";
        $bytesB = "%PDF-1.4\n%Process-B-Competing-Content-".str_repeat('B', 2048)."\n%%EOF\n";

        $srcA = $this->writeTempSource('race_a.pdf', $bytesA);
        $srcB = $this->writeTempSource('race_b.pdf', $bytesB);
        $shaA = hash('sha256', $bytesA);
        $shaB = hash('sha256', $bytesB);

        // Launch two concurrent real OS broker subprocesses racing on the exact same generation_id & locator.
        $procA = $this->spawnRawBrokerProcess('stageWrite', [
            'namespace_id' => $this->namespaceId,
            'operation_id' => $opA,
            'ordinal' => 1,
            'generation_id' => $genId,
            'locator' => $locator,
            'source_temp_path' => $srcA,
            'expected_size' => strlen($bytesA),
            'expected_sha256' => $shaA,
            'mime_type' => 'application/pdf',
            'fence_no' => 1,
        ]);

        $procB = $this->spawnRawBrokerProcess('stageWrite', [
            'namespace_id' => $this->namespaceId,
            'operation_id' => $opB,
            'ordinal' => 1,
            'generation_id' => $genId,
            'locator' => $locator,
            'source_temp_path' => $srcB,
            'expected_size' => strlen($bytesB),
            'expected_sha256' => $shaB,
            'mime_type' => 'application/pdf',
            'fence_no' => 1,
        ]);

        $resA = $this->collectRawBrokerProcess($procA);
        $resB = $this->collectRawBrokerProcess($procB);

        $wins = ((($resA['json']['ok'] ?? false) === true) ? 1 : 0)
            + ((($resB['json']['ok'] ?? false) === true) ? 1 : 0);
        $this->assertSame(1, $wins, 'Exactly one concurrent OS process must win exclusive creation.');

        $winnerIsA = ($resA['json']['ok'] ?? false) === true;
        $winnerResult = $winnerIsA ? $resA['json']['result'] : $resB['json']['result'];
        $expectedBytes = $winnerIsA ? $bytesA : $bytesB;
        $expectedSha = $winnerIsA ? $shaA : $shaB;

        // Sequential collision against the winning locator must also fail closed without mutating bytes.
        $opC = strtolower((string) Str::uuid());
        try {
            $client->stageWrite(
                namespaceId: $this->namespaceId,
                operationId: $opC,
                ordinal: 1,
                generationId: $genId,
                locator: $locator,
                sourceTempPath: $winnerIsA ? $srcB : $srcA,
                expectedSize: strlen($winnerIsA ? $bytesB : $bytesA),
                expectedSha256: $winnerIsA ? $shaB : $shaA,
                mimeType: 'application/pdf',
            );
            $this->fail('Expected sequential collision on existing locator to fail closed.');
        } catch (CustodyViolationException) {
            $this->addToAssertionCount(1);
        }

        // Winning bytes must remain intact and pass single-FD readGeneration verification.
        $read = $client->readGeneration(
            namespaceId: $this->namespaceId,
            generationId: $genId,
            locator: $locator,
            expectedProviderObjectIdentity: (string) $winnerResult['provider_object_identity'],
            expectedSize: strlen($expectedBytes),
            expectedSha256: $expectedSha,
        );
        $this->assertSame($expectedBytes, $read->bytes);
        $this->assertSame($expectedSha, $read->sha256);
    }

    public function test_k3_n03_traversal_bad_grammar_wrong_shard_and_hardlink_rejection(): void
    {
        $client = $this->makeProcessClient();
        $opId = strtolower((string) Str::uuid());
        $genId = strtolower((string) Str::uuid());
        $goodBytes = "%PDF-1.4\n%Valid-Object\n%%EOF\n";
        $goodSrc = $this->writeTempSource('good.pdf', $goodBytes);
        $goodSha = hash('sha256', $goodBytes);
        $wrongShard = substr($genId, 0, 2) === 'aa' ? 'bb' : 'aa';

        $badLocators = [
            "objects/{$wrongShard}/{$genId}.blob",
            "objects/../{$genId}.blob",
            'objects/'.substr($genId, 0, 2).'/'.strtoupper($genId).'.blob',
            'objects\\'.substr($genId, 0, 2).'\\'.$genId.'.blob',
            'objects/'.substr($genId, 0, 2)."/{$genId}.pdf",
            'objects/'.substr($genId, 0, 2)."/{$genId}.blob\0.txt",
        ];

        foreach ($badLocators as $badLocator) {
            try {
                $client->stageWrite(
                    namespaceId: $this->namespaceId,
                    operationId: $opId,
                    ordinal: 1,
                    generationId: $genId,
                    locator: $badLocator,
                    sourceTempPath: $goodSrc,
                    expectedSize: strlen($goodBytes),
                    expectedSha256: $goodSha,
                    mimeType: 'application/pdf',
                );
                $this->fail("Expected bad locator [{$badLocator}] to be rejected.");
            } catch (CustodyViolationException) {
                $this->addToAssertionCount(1);
            }
        }

        // Non-regular directory source path must be rejected.
        try {
            $client->stageWrite(
                namespaceId: $this->namespaceId,
                operationId: $opId,
                ordinal: 1,
                generationId: $genId,
                locator: $this->locatorFor($genId),
                sourceTempPath: $this->sourceDir,
                expectedSize: strlen($goodBytes),
                expectedSha256: $goodSha,
                mimeType: 'application/pdf',
            );
            $this->fail('Expected directory source path to be rejected.');
        } catch (CustodyViolationException) {
            $this->addToAssertionCount(1);
        }

        // Stage a valid object, then attach a hardlink alias (nlink = 2) and assert readGeneration fails closed!
        $receipt = $client->stageWrite(
            namespaceId: $this->namespaceId,
            operationId: $opId,
            ordinal: 1,
            generationId: $genId,
            locator: $this->locatorFor($genId),
            sourceTempPath: $goodSrc,
            expectedSize: strlen($goodBytes),
            expectedSha256: $goodSha,
            mimeType: 'application/pdf',
        );

        $blobPath = $this->physicalBlobPath($genId);
        $hardlinkAlias = $this->tempBase.DIRECTORY_SEPARATOR.'evil_hardlink.blob';
        $this->assertTrue(@link($blobPath, $hardlinkAlias));

        try {
            $client->readGeneration(
                namespaceId: $this->namespaceId,
                generationId: $genId,
                locator: $receipt->locator,
                expectedProviderObjectIdentity: $receipt->providerObjectIdentity,
                expectedSize: $receipt->sizeBytes,
                expectedSha256: $receipt->sha256,
            );
            $this->fail('Expected hardlink alias (nlink === 2) to fail closed.');
        } catch (CustodyViolationException $e) {
            $this->assertStringContainsString('hardlink', $e->getMessage());
        } finally {
            @chmod($hardlinkAlias, 0600);
            @unlink($hardlinkAlias);
            @chmod($blobPath, 0440);
        }
    }

    public function test_k3_n04_short_write_digest_mismatch_oversized_and_fsync_failure_leave_zero_sealed_objects(): void
    {
        $client = $this->makeProcessClient();
        $opId = strtolower((string) Str::uuid());
        $payload = "%PDF-1.4\n%Integrity-Check-Payload\n%%EOF\n";
        $src = $this->writeTempSource('integrity.pdf', $payload);
        $sha = hash('sha256', $payload);

        // 1. Corrupt digest mismatch -> fail closed, zero sealed object.
        $genDigest = strtolower((string) Str::uuid());
        try {
            $client->stageWrite(
                namespaceId: $this->namespaceId,
                operationId: $opId,
                ordinal: 1,
                generationId: $genDigest,
                locator: $this->locatorFor($genDigest),
                sourceTempPath: $src,
                expectedSize: strlen($payload),
                expectedSha256: str_repeat('0', 64),
                mimeType: 'application/pdf',
            );
            $this->fail('Expected SHA-256 mismatch to fail closed.');
        } catch (CustodyViolationException) {
            $this->assertFileDoesNotExist($this->physicalBlobPath($genDigest));
        }

        // 2. Short-write fault injection -> fail closed, zero sealed object.
        $genShort = strtolower((string) Str::uuid());
        try {
            $client->stageWrite(
                namespaceId: $this->namespaceId,
                operationId: $opId,
                ordinal: 1,
                generationId: $genShort,
                locator: $this->locatorFor($genShort),
                sourceTempPath: $src,
                expectedSize: strlen($payload),
                expectedSha256: $sha,
                mimeType: 'application/pdf',
                faultInjection: 'short_write',
            );
            $this->fail('Expected short write to fail closed.');
        } catch (CustodyViolationException) {
            $this->assertFileDoesNotExist($this->physicalBlobPath($genShort));
        }

        // 3. Injected fsync_failure -> fail closed, zero sealed object.
        $genFsync = strtolower((string) Str::uuid());
        try {
            $client->stageWrite(
                namespaceId: $this->namespaceId,
                operationId: $opId,
                ordinal: 1,
                generationId: $genFsync,
                locator: $this->locatorFor($genFsync),
                sourceTempPath: $src,
                expectedSize: strlen($payload),
                expectedSha256: $sha,
                mimeType: 'application/pdf',
                faultInjection: 'fsync_failure',
            );
            $this->fail('Expected fsync_failure to fail closed.');
        } catch (CustodyViolationException) {
            $this->assertFileDoesNotExist($this->physicalBlobPath($genFsync));
        }

        // 4. Oversized (> 15 MiB) -> fail closed, zero sealed object.
        $genBig = strtolower((string) Str::uuid());
        try {
            $client->stageWrite(
                namespaceId: $this->namespaceId,
                operationId: $opId,
                ordinal: 1,
                generationId: $genBig,
                locator: $this->locatorFor($genBig),
                sourceTempPath: $src,
                expectedSize: 15728641,
                expectedSha256: $sha,
                mimeType: 'application/pdf',
            );
            $this->fail('Expected oversized payload (> 15 MiB) to fail closed.');
        } catch (CustodyViolationException) {
            $this->assertFileDoesNotExist($this->physicalBlobPath($genBig));
        }

        // Verify zero leftover temp files in .staging.
        $stagingDir = $this->brokerRoot.DIRECTORY_SEPARATOR.'.staging';
        if (is_dir($stagingDir)) {
            $iterator = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($stagingDir, \FilesystemIterator::SKIP_DOTS)
            );
            $remainingFiles = [];
            foreach ($iterator as $file) {
                if ($file->isFile()) {
                    $remainingFiles[] = $file->getPathname();
                }
            }
            $this->assertSame([], $remainingFiles, 'Failed staging attempts must not leave orphaned temp files.');
        }
    }

    public function test_k3_n05_post_seal_immutability_tamper_detection_fence_close_and_permanent_burn(): void
    {
        $client = $this->makeProcessClient();
        $opId = strtolower((string) Str::uuid());
        $genId = strtolower((string) Str::uuid());
        $locator = $this->locatorFor($genId);

        $bytes = "%PDF-1.4\n%Sealed-Immutable-Evidence\n%%EOF\n";
        $src = $this->writeTempSource('sealed.pdf', $bytes);
        $sha = hash('sha256', $bytes);

        $receipt = $client->stageWrite(
            namespaceId: $this->namespaceId,
            operationId: $opId,
            ordinal: 1,
            generationId: $genId,
            locator: $locator,
            sourceTempPath: $src,
            expectedSize: strlen($bytes),
            expectedSha256: $sha,
            mimeType: 'application/pdf',
        );

        // Verify read-only seal on disk.
        $blobPath = $this->physicalBlobPath($genId);
        $this->assertFileExists($blobPath);
        clearstatcache(true, $blobPath);
        if (DIRECTORY_SEPARATOR === '\\') {
            $this->assertFalse(is_writable($blobPath), 'Sealed blob must be read-only on Windows.');
        } else {
            $this->assertSame(0, (fileperms($blobPath) & 0222), 'Sealed blob must have zero write bits on POSIX.');
        }

        // Verify readGeneration returns exact verified bytes.
        $read = $client->readGeneration(
            namespaceId: $this->namespaceId,
            generationId: $genId,
            locator: $locator,
            expectedProviderObjectIdentity: $receipt->providerObjectIdentity,
            expectedSize: strlen($bytes),
            expectedSha256: $sha,
        );
        $this->assertSame($bytes, $read->bytes);

        // Dispose without closeFence MUST be denied and leave bytes untouched.
        try {
            $client->conditionalDispose(
                namespaceId: $this->namespaceId,
                operationId: $opId,
                generationId: $genId,
                locator: $locator,
                providerObjectIdentity: $receipt->providerObjectIdentity,
                closeAckId: 'ack:'.strtolower((string) Str::uuid()),
                tombstoneId: strtolower((string) Str::uuid()),
            );
            $this->fail('Expected conditionalDispose without closed fence to be denied.');
        } catch (CustodyViolationException) {
            $this->assertFileExists($blobPath);
        }

        // Tamper 1 byte in place -> readGeneration MUST detect tampering and fail closed!
        chmod($blobPath, 0600);
        $tampered = substr($bytes, 0, -1).'X';
        file_put_contents($blobPath, $tampered);
        chmod($blobPath, 0440);

        try {
            $client->readGeneration(
                namespaceId: $this->namespaceId,
                generationId: $genId,
                locator: $locator,
                expectedProviderObjectIdentity: $receipt->providerObjectIdentity,
                expectedSize: strlen($bytes),
                expectedSha256: $sha,
            );
            $this->fail('Expected tampered blob bytes to fail closed.');
        } catch (CustodyViolationException $e) {
            $this->assertStringContainsString('tampering', strtolower($e->getMessage()));
        }

        // Restore original bytes to test clean fence close + conditionalDispose + permanent burn.
        chmod($blobPath, 0600);
        file_put_contents($blobPath, $bytes);
        chmod($blobPath, 0440);

        // Close fence durably -> verify HMAC-signed CloseAck.
        $closeAck = $client->closeFence($this->namespaceId, $opId, 2);
        $this->assertTrue(LocalImmutableBrokerEngine::verifyCloseAck($closeAck, $this->hmacKey));
        $this->assertContains($genId, $closeAck->sealedGenerations);

        // Any subsequent stageWrite for the closed operation MUST fail with CustodyFenceClosedException!
        $lateGenId = strtolower((string) Str::uuid());
        try {
            $client->stageWrite(
                namespaceId: $this->namespaceId,
                operationId: $opId,
                ordinal: 2,
                generationId: $lateGenId,
                locator: $this->locatorFor($lateGenId),
                sourceTempPath: $src,
                expectedSize: strlen($bytes),
                expectedSha256: $sha,
                mimeType: 'application/pdf',
            );
            $this->fail('Expected late stageWrite after closeFence to throw CustodyFenceClosedException.');
        } catch (CustodyFenceClosedException) {
            $this->assertFileDoesNotExist($this->physicalBlobPath($lateGenId));
        }

        // Forged closeAckId must be rejected by conditionalDispose.
        try {
            $client->conditionalDispose(
                namespaceId: $this->namespaceId,
                operationId: $opId,
                generationId: $genId,
                locator: $locator,
                providerObjectIdentity: $receipt->providerObjectIdentity,
                closeAckId: 'ack:forged-'.strtolower((string) Str::uuid()),
                tombstoneId: strtolower((string) Str::uuid()),
            );
            $this->fail('Expected forged closeAckId to be rejected.');
        } catch (CustodyViolationException) {
            $this->assertFileExists($blobPath);
        }

        // Valid conditionalDispose succeeds and unlinks the physical file.
        $tombstoneId = strtolower((string) Str::uuid());
        $disposeReceipt = $client->conditionalDispose(
            namespaceId: $this->namespaceId,
            operationId: $opId,
            generationId: $genId,
            locator: $locator,
            providerObjectIdentity: $receipt->providerObjectIdentity,
            closeAckId: $closeAck->closeAckId,
            tombstoneId: $tombstoneId,
        );
        $this->assertSame('DISPOSED', $disposeReceipt->disposition);
        $this->assertSame($tombstoneId, $disposeReceipt->tombstoneId);
        $this->assertFileDoesNotExist($blobPath);

        // NOX-K2K3-02: Idempotent crash-recovery retry of conditionalDispose with exact matching tuple
        // returns ABSENT_VERIFIED with the persisted disposeReceiptId (and rejects mismatched tombstoneId).
        $retryReceipt = $client->conditionalDispose(
            namespaceId: $this->namespaceId,
            operationId: $opId,
            generationId: $genId,
            locator: $locator,
            providerObjectIdentity: $receipt->providerObjectIdentity,
            closeAckId: $closeAck->closeAckId,
            tombstoneId: $tombstoneId,
        );
        $this->assertSame('ABSENT_VERIFIED', $retryReceipt->disposition);
        $this->assertSame($disposeReceipt->disposeReceiptId, $retryReceipt->disposeReceiptId);
        $this->assertSame($tombstoneId, $retryReceipt->tombstoneId);

        try {
            $client->conditionalDispose(
                namespaceId: $this->namespaceId,
                operationId: $opId,
                generationId: $genId,
                locator: $locator,
                providerObjectIdentity: $receipt->providerObjectIdentity,
                closeAckId: $closeAck->closeAckId,
                tombstoneId: strtolower((string) Str::uuid()),
            );
            $this->fail('Expected conditionalDispose retry with different tombstoneId to fail closed.');
        } catch (CustodyViolationException $e) {
            $this->assertStringContainsString('conflicting parameters', $e->getMessage());
        }

        // Disposed generation cannot be read or reused ever again (permanent burn).
        try {
            $client->readGeneration(
                namespaceId: $this->namespaceId,
                generationId: $genId,
                locator: $locator,
                expectedProviderObjectIdentity: $receipt->providerObjectIdentity,
                expectedSize: strlen($bytes),
                expectedSha256: $sha,
            );
            $this->fail('Expected readGeneration on disposed object to fail closed.');
        } catch (CustodyViolationException) {
            $this->addToAssertionCount(1);
        }

        $newOpId = strtolower((string) Str::uuid());
        try {
            $client->stageWrite(
                namespaceId: $this->namespaceId,
                operationId: $newOpId,
                ordinal: 1,
                generationId: $genId,
                locator: $locator,
                sourceTempPath: $src,
                expectedSize: strlen($bytes),
                expectedSha256: $sha,
                mimeType: 'application/pdf',
            );
            $this->fail('Expected permanently burned generation_id/locator reuse to fail closed.');
        } catch (CustodyViolationException $e) {
            $this->assertStringContainsString('burned', $e->getMessage());
        }

        // Forged IPC HMAC directly against bin/legacy-custody-broker MUST fail closed.
        $forgedProc = $this->spawnRawBrokerProcess('attestRoot', [
            'namespace_id' => $this->namespaceId,
        ], forgedHmac: true);
        $forgedResult = $this->collectRawBrokerProcess($forgedProc);
        $this->assertFalse($forgedResult['json']['ok'] ?? true);
        $this->assertStringContainsString('HMAC', (string) ($forgedResult['json']['message'] ?? ''));
    }

    private function makeProcessClient(): ProcessStorageBrokerClient
    {
        return new ProcessStorageBrokerClient(
            brokerRoot: $this->brokerRoot,
            hmacKey: $this->hmacKey,
            brokerBinary: base_path('bin/legacy-custody-broker'),
            disallowedRoots: BrokerRootAttestation::collectApplicationDisallowedRoots(),
        );
    }

    private function locatorFor(string $generationId): string
    {
        return 'objects/'.substr($generationId, 0, 2).'/'.$generationId.'.blob';
    }

    private function physicalBlobPath(string $generationId): string
    {
        return $this->brokerRoot
            .DIRECTORY_SEPARATOR.'objects'
            .DIRECTORY_SEPARATOR.substr($generationId, 0, 2)
            .DIRECTORY_SEPARATOR.$generationId.'.blob';
    }

    private function writeTempSource(string $name, string $bytes): string
    {
        $path = $this->sourceDir.DIRECTORY_SEPARATOR.$name;
        file_put_contents($path, $bytes);

        return $path;
    }

    /**
     * @param  array<string, mixed>  $params
     * @param  array<string, ?string>  $customEnv
     * @return array{process: resource, pipes: array<int, resource>}
     */
    private function spawnRawBrokerProcess(string $method, array $params, bool $forgedHmac = false, array $customEnv = []): array
    {
        $nonce = bin2hex(random_bytes(16));
        $timestamp = gmdate('Y-m-d\TH:i:s\Z');
        $payload = [
            'method' => $method,
            'params' => $params,
            'nonce' => $nonce,
            'timestamp' => $timestamp,
        ];
        $canonical = json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
        $payload['hmac'] = $forgedHmac
            ? str_repeat('a', 64)
            : hash_hmac('sha256', $canonical, $this->hmacKey);

        $env = [
            'LEGACY_CUSTODY_BROKER_ROOT' => $this->brokerRoot,
            'LEGACY_CUSTODY_BROKER_HMAC_KEY' => $this->hmacKey,
            'LEGACY_CUSTODY_DISALLOWED_ROOTS_JSON' => json_encode(
                BrokerRootAttestation::collectApplicationDisallowedRoots(),
                JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES,
            ),
            'LEGACY_CUSTODY_ALLOW_FAULT_INJECTION' => '1',
        ];

        foreach ($customEnv as $k => $v) {
            if ($v === null) {
                unset($env[$k]);
            } else {
                $env[$k] = $v;
            }
        }

        if (DIRECTORY_SEPARATOR === '\\') {
            foreach (['SYSTEMROOT', 'COMSPEC', 'TEMP', 'TMP', 'PATHEXT', 'PATH'] as $key) {
                $val = getenv($key);
                if (is_string($val) && $val !== '') {
                    $env[$key] = $val;
                }
            }
        } else {
            $env['PATH'] = '/usr/local/bin:/usr/bin:/bin';
        }

        $process = proc_open(
            [PHP_BINARY, base_path('bin/legacy-custody-broker')],
            [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
            $pipes,
            null,
            $env,
        );
        $this->assertIsResource($process);

        fwrite($pipes[0], json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES));
        fclose($pipes[0]);

        return ['process' => $process, 'pipes' => $pipes];
    }

    /**
     * @param  array{process: resource, pipes: array<int, resource>}  $handle
     * @return array{exit_code: int, json: array<string, mixed>, stderr: string}
     */
    private function collectRawBrokerProcess(array $handle): array
    {
        $stdout = (string) stream_get_contents($handle['pipes'][1]);
        fclose($handle['pipes'][1]);

        $stderr = (string) stream_get_contents($handle['pipes'][2]);
        fclose($handle['pipes'][2]);

        $exitCode = proc_close($handle['process']);
        $decoded = json_decode($stdout, true, 16, JSON_THROW_ON_ERROR);
        $this->assertIsArray($decoded);

        return [
            'exit_code' => $exitCode,
            'json' => $decoded,
            'stderr' => $stderr,
        ];
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
