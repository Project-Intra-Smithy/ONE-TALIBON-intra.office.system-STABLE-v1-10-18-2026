<?php

namespace App\PlanCustody;

use App\Models\PlanCustodyEvent;
use App\Models\PlanCustodyGeneration;
use App\Models\PlanCustodyScanEvidence;
use App\PlanCustody\Contracts\CustodySecurityGate;
use App\PlanCustody\Contracts\GenerationIdSource;
use App\PlanCustody\Contracts\ImmutableObjectStore;
use App\PlanCustody\Contracts\ScannerEvidenceVerifier;
use App\PlanCustody\Data\ScanEvidence;
use App\PlanCustody\Data\StageGeneration;
use App\PlanCustody\Exceptions\CustodyViolation;
use App\PlanCustody\Exceptions\OrphanedCustodyObject;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

final class PlanCustodyService
{
    public function __construct(
        private readonly ImmutableObjectStore $objects,
        private readonly GenerationIdSource $ids,
        private readonly ScannerEvidenceVerifier $scannerVerifier,
        private readonly CustodySecurityGate $securityGate,
    ) {}

    public function stage(StageGeneration $request): PlanCustodyGeneration
    {
        if (! $this->securityGate->allows($request->security)) {
            throw new CustodyViolation('Current actor, office, MFA, session, or restore-fence authority is not established.');
        }

        $this->assertIdentity($request->security->actorId, 'actor');
        $this->assertIdentity($request->security->officeId, 'office');
        $this->assertIdentity($request->serviceIdentity, 'service');
        $idempotencyHash = $this->idempotencyHash($request->idempotencyKey);
        $source = $this->inspectSource($request->sourcePath);
        $this->assertDeclaration($request, $source);

        $existing = PlanCustodyGeneration::query()
            ->where('idempotency_key_hash', $idempotencyHash)
            ->first();
        if ($existing !== null) {
            return $this->assertIdempotentMatch($existing, $source);
        }

        $generationId = Str::lower($this->ids->next());
        if (! Str::isUuid($generationId)) {
            throw new CustodyViolation('The generation identifier source returned an invalid identifier.');
        }

        $locator = 'quarantine/'.substr(str_replace('-', '', $generationId), 0, 2).'/'.$generationId.'.pdf';
        $input = @fopen($request->sourcePath, 'rb');
        if ($input === false) {
            throw new CustodyViolation('The custody source cannot be opened.');
        }

        try {
            $this->objects->putIfAbsent($locator, $input);
        } finally {
            fclose($input);
        }

        try {
            $this->assertStoredIntegrity($locator, $source);

            return DB::transaction(function () use (
                $request,
                $source,
                $generationId,
                $locator,
                $idempotencyHash,
            ): PlanCustodyGeneration {
                $generation = PlanCustodyGeneration::query()->create([
                    'generation_id' => $generationId,
                    'storage_disk' => (string) config('plan_custody.disk', 'plan_custody'),
                    'storage_locator' => $locator,
                    'sha256' => $source['sha256'],
                    'size_bytes' => $source['size'],
                    'media_type' => 'application/pdf',
                    'custody_state' => 'QUARANTINED',
                    'integrity_status' => 'VERIFIED',
                    'idempotency_key_hash' => $idempotencyHash,
                    'actor_id' => $request->security->actorId,
                    'office_id' => $request->security->officeId,
                    'service_identity' => $request->serviceIdentity,
                ]);

                PlanCustodyEvent::query()->create([
                    'plan_custody_generation_id' => $generation->id,
                    'event_id' => (string) Str::uuid(),
                    'event_type' => 'GENERATION_QUARANTINED',
                    'actor_id' => $request->security->actorId,
                    'office_id' => $request->security->officeId,
                    'service_identity' => $request->serviceIdentity,
                    'details' => [
                        'integrity_status' => 'VERIFIED',
                        'publication_authorized' => false,
                    ],
                ]);

                return $generation->fresh();
            });
        } catch (QueryException $exception) {
            $existing = PlanCustodyGeneration::query()
                ->where('idempotency_key_hash', $idempotencyHash)
                ->first();
            $this->cleanupUncommitted($locator, $exception);
            if ($existing !== null) {
                return $this->assertIdempotentMatch($existing, $source);
            }
            throw $exception;
        } catch (Throwable $exception) {
            $this->cleanupUncommitted($locator, $exception);
            throw $exception;
        }
    }

    public function recordTrustedScan(
        PlanCustodyGeneration $generation,
        ScanEvidence $evidence,
        string $serviceIdentity,
    ): PlanCustodyScanEvidence {
        if (! $this->scannerVerifier->isTrusted($evidence)) {
            throw new CustodyViolation('Scanner evidence is not trusted.');
        }

        if (! in_array($evidence->decision, ['CLEAN', 'REJECTED', 'ERROR'], true)) {
            throw new CustodyViolation('Scanner evidence decision is invalid.');
        }
        if (! Str::isUuid($evidence->evidenceId)) {
            throw new CustodyViolation('Scanner evidence identifier is invalid.');
        }

        $now = CarbonImmutable::now();
        $scannedAt = CarbonImmutable::instance($evidence->scannedAt);
        $maximumAge = max(1, (int) config('plan_custody.max_scan_age_seconds', 3600));
        $futureSkew = max(0, (int) config('plan_custody.future_clock_skew_seconds', 60));
        if ($scannedAt->lt($now->subSeconds($maximumAge))
            || $scannedAt->gt($now->addSeconds($futureSkew))) {
            throw new CustodyViolation('Scanner evidence is stale or has an invalid timestamp.');
        }

        $this->assertIdentity($serviceIdentity, 'scanner service');

        return DB::transaction(function () use ($generation, $evidence, $serviceIdentity): PlanCustodyScanEvidence {
            // Generation rows are protected by an UPDATE/DELETE rejecting trigger,
            // so custody needs SELECT rather than an otherwise excessive lock grant.
            $locked = PlanCustodyGeneration::query()->findOrFail($generation->id);
            if ($locked->custody_state !== 'QUARANTINED'
                || ! hash_equals($locked->sha256, Str::lower($evidence->scannedSha256))
                || (int) $locked->size_bytes !== $evidence->scannedSizeBytes) {
                throw new CustodyViolation('Scanner evidence does not pin the quarantined generation.');
            }

            $existing = PlanCustodyScanEvidence::query()
                ->where('evidence_id', $evidence->evidenceId)
                ->first();
            if ($existing !== null) {
                if ((int) $existing->plan_custody_generation_id !== (int) $locked->id
                    || $existing->decision !== $evidence->decision
                    || ! hash_equals($existing->scanned_sha256, Str::lower($evidence->scannedSha256))) {
                    throw new CustodyViolation('Scanner evidence identifier was reused with different content.');
                }

                return $existing;
            }

            $scan = PlanCustodyScanEvidence::query()->create([
                'plan_custody_generation_id' => $locked->id,
                'evidence_id' => $evidence->evidenceId,
                'decision' => $evidence->decision,
                'scanner_identity' => $evidence->scannerIdentity,
                'engine_version' => $evidence->engineVersion,
                'signature_version' => $evidence->signatureVersion,
                'scanned_sha256' => Str::lower($evidence->scannedSha256),
                'scanned_size_bytes' => $evidence->scannedSizeBytes,
                'evidence_signature_hash' => hash('sha256', $evidence->signature),
                'trusted' => true,
                'scanned_at' => $evidence->scannedAt,
            ]);

            PlanCustodyEvent::query()->create([
                'plan_custody_generation_id' => $locked->id,
                'event_id' => (string) Str::uuid(),
                'event_type' => 'SCANNER_'.$evidence->decision,
                'actor_id' => 'scanner:'.$evidence->scannerIdentity,
                'office_id' => 'service',
                'service_identity' => $serviceIdentity,
                'details' => [
                    'evidence_id' => $evidence->evidenceId,
                    'publication_authorized' => false,
                ],
            ]);

            return $scan->fresh();
        });
    }

    /** @return array{sha256:string,size:int} */
    private function inspectSource(string $path): array
    {
        if (! is_file($path) || is_link($path)) {
            throw new CustodyViolation('The custody source must be a regular file.');
        }

        $stream = @fopen($path, 'rb');
        if ($stream === false) {
            throw new CustodyViolation('The custody source cannot be inspected.');
        }

        try {
            $context = hash_init('sha256');
            $size = 0;
            $prefix = '';
            $tail = '';
            while (! feof($stream)) {
                $chunk = fread($stream, 1024 * 1024);
                if ($chunk === false) {
                    throw new CustodyViolation('The custody source ended unexpectedly.');
                }
                if ($chunk === '') {
                    continue;
                }
                $prefix = substr($prefix.$chunk, 0, 8);
                $tail = substr($tail.$chunk, -1024);
                $size += strlen($chunk);
                if ($size > max(1, (int) config('plan_custody.max_bytes', 50 * 1024 * 1024))) {
                    throw new CustodyViolation('The custody source exceeds the configured size limit.');
                }
                hash_update($context, $chunk);
            }
        } finally {
            fclose($stream);
        }

        if ($size === 0 || ! str_starts_with($prefix, '%PDF-') || ! str_contains($tail, '%%EOF')) {
            throw new CustodyViolation('The custody source fails bounded PDF quarantine screening.');
        }

        return ['sha256' => hash_final($context), 'size' => $size];
    }

    /** @param array{sha256:string,size:int} $source */
    private function assertDeclaration(StageGeneration $request, array $source): void
    {
        $declaredHash = Str::lower($request->declaredSha256);
        if ($request->declaredMediaType !== 'application/pdf'
            || preg_match('/^[0-9a-f]{64}$/D', $declaredHash) !== 1
            || ! hash_equals($source['sha256'], $declaredHash)
            || $source['size'] !== $request->declaredSizeBytes) {
            throw new CustodyViolation('Declared type, size, or digest does not match the inspected source.');
        }
    }

    /** @param array{sha256:string,size:int} $source */
    private function assertStoredIntegrity(string $locator, array $source): void
    {
        $stream = $this->objects->openForVerification($locator);
        try {
            $context = hash_init('sha256');
            $size = hash_update_stream($context, $stream);
            if ($size === false
                || $size !== $source['size']
                || ! hash_equals($source['sha256'], hash_final($context))) {
                throw new CustodyViolation('Post-write custody verification failed.');
            }
        } finally {
            fclose($stream);
        }
    }

    /** @param array{sha256:string,size:int} $source */
    private function assertIdempotentMatch(PlanCustodyGeneration $existing, array $source): PlanCustodyGeneration
    {
        if ($existing->media_type !== 'application/pdf'
            || (int) $existing->size_bytes !== $source['size']
            || ! hash_equals($existing->sha256, $source['sha256'])
            || $existing->custody_state !== 'QUARANTINED') {
            throw new CustodyViolation('The idempotency key was reused for different custody content.');
        }

        $this->assertStoredIntegrity($existing->storage_locator, $source);

        return $existing;
    }

    private function cleanupUncommitted(string $locator, Throwable $cause): void
    {
        try {
            $this->objects->deleteUncommitted($locator);
        } catch (Throwable $cleanupFailure) {
            throw new OrphanedCustodyObject($locator, $cause, $cleanupFailure);
        }
    }

    private function idempotencyHash(string $key): string
    {
        if (strlen($key) < 16 || strlen($key) > 255) {
            throw new CustodyViolation('The custody idempotency key is invalid.');
        }

        return hash('sha256', $key);
    }

    private function assertIdentity(string $identity, string $label): void
    {
        if ($identity === '' || strlen($identity) > 128
            || preg_match('/^[A-Za-z0-9][A-Za-z0-9:._@-]*$/D', $identity) !== 1) {
            throw new CustodyViolation("The {$label} identity is invalid.");
        }
    }
}
