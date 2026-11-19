<?php

declare(strict_types=1);

namespace App\Services\Custody\Broker;

use App\Domain\Custody\BrokerCloseAck;
use App\Domain\Custody\BrokerDisposeReceipt;
use App\Domain\Custody\BrokerReadObject;
use App\Domain\Custody\Exceptions\CustodyFenceClosedException;
use App\Domain\Custody\Exceptions\CustodyViolationException;
use App\Domain\Custody\StagingReceipt;
use App\Services\Custody\Contracts\StorageBrokerClient;

final class ProcessStorageBrokerClient implements StorageBrokerClient
{
    private ?int $lastBrokerPid = null;

    /**
     * @param  ?list<string>  $disallowedRoots
     */
    public function __construct(
        private readonly ?string $brokerRoot = null,
        private readonly ?string $hmacKey = null,
        private readonly ?string $brokerBinary = null,
        private readonly ?array $disallowedRoots = null,
        private readonly ?string $phpBinary = null,
    ) {}

    public function lastBrokerPid(): ?int
    {
        return $this->lastBrokerPid;
    }

    public function attestRoot(string $namespaceId, string $expectedBackendKind = BrokerRootAttestation::BACKEND_KIND): array
    {
        $result = $this->invoke('attestRoot', [
            'namespace_id' => $namespaceId,
            'expected_backend_kind' => $expectedBackendKind,
        ]);

        return [
            'backend_kind' => (string) ($result['backend_kind'] ?? ''),
            'provider_identity' => (string) ($result['provider_identity'] ?? ''),
            'root_claim' => (string) ($result['root_claim'] ?? ''),
            'namespace_id' => (string) ($result['namespace_id'] ?? ''),
            'canonical_root' => (string) ($result['canonical_root'] ?? ''),
        ];
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
        $result = $this->invoke('stageWrite', [
            'namespace_id' => $namespaceId,
            'operation_id' => $operationId,
            'ordinal' => $ordinal,
            'generation_id' => $generationId,
            'locator' => $locator,
            'source_temp_path' => $sourceTempPath,
            'expected_size' => $expectedSize,
            'expected_sha256' => $expectedSha256,
            'mime_type' => $mimeType,
            'fence_no' => $fenceNo,
            'fault_injection' => $faultInjection,
        ]);

        return StagingReceipt::fromArray($result);
    }

    public function closeFence(
        string $namespaceId,
        string $operationId,
        int $fenceNo = 2,
    ): BrokerCloseAck {
        $result = $this->invoke('closeFence', [
            'namespace_id' => $namespaceId,
            'operation_id' => $operationId,
            'fence_no' => $fenceNo,
        ]);

        $ack = BrokerCloseAck::fromArray($result);
        if (! LocalImmutableBrokerEngine::verifyCloseAck($ack, $this->resolveHmacKey())) {
            throw new CustodyViolationException('Broker subprocess returned a CloseAck with an invalid HMAC signature.');
        }

        return $ack;
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
        $result = $this->invoke('conditionalDispose', [
            'namespace_id' => $namespaceId,
            'operation_id' => $operationId,
            'generation_id' => $generationId,
            'locator' => $locator,
            'provider_object_identity' => $providerObjectIdentity,
            'close_ack_id' => $closeAckId,
            'tombstone_id' => $tombstoneId,
        ]);

        return BrokerDisposeReceipt::fromArray($result);
    }

    public function readGeneration(
        string $namespaceId,
        string $generationId,
        string $locator,
        string $expectedProviderObjectIdentity,
        int $expectedSize,
        string $expectedSha256,
    ): BrokerReadObject {
        $result = $this->invoke('readGeneration', [
            'namespace_id' => $namespaceId,
            'generation_id' => $generationId,
            'locator' => $locator,
            'expected_provider_object_identity' => $expectedProviderObjectIdentity,
            'expected_size' => $expectedSize,
            'expected_sha256' => $expectedSha256,
        ]);

        return BrokerReadObject::fromArray($result);
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array<string, mixed>
     */
    private function invoke(string $method, array $params): array
    {
        $root = $this->resolveBrokerRoot();
        $hmacKey = $this->resolveHmacKey();
        $binary = $this->resolveBrokerBinary();
        $php = $this->phpBinary ?? PHP_BINARY;

        if (! is_file($binary)) {
            throw new CustodyViolationException("Isolated broker binary [{$binary}] does not exist.");
        }

        $nonce = bin2hex(random_bytes(16));
        $timestamp = gmdate('Y-m-d\TH:i:s\Z');

        $payload = [
            'method' => $method,
            'params' => $params,
            'nonce' => $nonce,
            'timestamp' => $timestamp,
        ];
        $canonical = json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
        $payload['hmac'] = hash_hmac('sha256', $canonical, $hmacKey);

        $requestJson = json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);

        $env = $this->buildMinimalSubprocessEnv($root, $hmacKey);
        $descriptors = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];

        $process = @proc_open([$php, $binary], $descriptors, $pipes, null, $env);
        if (! is_resource($process)) {
            throw new CustodyViolationException('Failed to spawn isolated custody broker subprocess.');
        }

        fwrite($pipes[0], $requestJson);
        fclose($pipes[0]);

        $stdout = stream_get_contents($pipes[1]);
        fclose($pipes[1]);

        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[2]);

        $exitCode = proc_close($process);

        if (! is_string($stdout) || trim($stdout) === '') {
            $errText = is_string($stderr) ? trim($stderr) : '';
            throw new CustodyViolationException(
                "Isolated custody broker subprocess exited ({$exitCode}) without JSON response."
                .($errText !== '' ? " Stderr: {$errText}" : '')
            );
        }

        try {
            $response = json_decode($stdout, true, 16, JSON_THROW_ON_ERROR);
        } catch (\Throwable $e) {
            throw new CustodyViolationException('Isolated custody broker returned malformed JSON.', previous: $e);
        }

        if (! is_array($response)) {
            throw new CustodyViolationException('Isolated custody broker returned non-object response.');
        }

        $responseHmac = isset($response['hmac']) && is_string($response['hmac']) ? $response['hmac'] : '';
        $unsigned = $response;
        unset($unsigned['hmac']);
        $expectedHmac = hash_hmac(
            'sha256',
            json_encode($unsigned, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES),
            $hmacKey,
        );

        if ($responseHmac === '' || ! hash_equals($expectedHmac, $responseHmac)) {
            throw new CustodyViolationException('Isolated custody broker response failed HMAC verification.');
        }

        if (($response['ok'] ?? false) !== true) {
            $code = (string) ($response['error_code'] ?? 'CUSTODY_VIOLATION');
            $message = (string) ($response['message'] ?? 'Isolated custody broker rejected request.');

            if ($code === 'FENCE_CLOSED') {
                throw new CustodyFenceClosedException($message);
            }

            throw new CustodyViolationException($message);
        }

        if ((string) ($response['nonce'] ?? '') !== $nonce) {
            throw new CustodyViolationException('Isolated custody broker response nonce mismatch.');
        }

        $this->lastBrokerPid = isset($response['pid']) ? (int) $response['pid'] : null;

        if (! isset($response['result']) || ! is_array($response['result'])) {
            throw new CustodyViolationException('Isolated custody broker response missing result object.');
        }

        return $response['result'];
    }

    /**
     * @return array<string, string>
     */
    private function buildMinimalSubprocessEnv(string $root, string $hmacKey): array
    {
        $disallowed = $this->disallowedRoots ?? BrokerRootAttestation::collectApplicationDisallowedRoots();
        $maxBytes = function_exists('config')
            ? (int) config('legacy_custody.max_upload_bytes', LocalImmutableBrokerEngine::DEFAULT_MAX_UPLOAD_BYTES)
            : LocalImmutableBrokerEngine::DEFAULT_MAX_UPLOAD_BYTES;
        $allowedMimes = function_exists('config')
            ? config('legacy_custody.allowed_mimes', LocalImmutableBrokerEngine::DEFAULT_ALLOWED_MIMES)
            : LocalImmutableBrokerEngine::DEFAULT_ALLOWED_MIMES;

        $env = [
            'LEGACY_CUSTODY_BROKER_ROOT' => $root,
            'LEGACY_CUSTODY_BROKER_HMAC_KEY' => $hmacKey,
            'LEGACY_CUSTODY_DISALLOWED_ROOTS_JSON' => json_encode(array_values($disallowed), JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES),
            'LEGACY_CUSTODY_MAX_UPLOAD_BYTES' => (string) $maxBytes,
            'LEGACY_CUSTODY_ALLOWED_MIMES_JSON' => json_encode(
                is_array($allowedMimes) ? array_values($allowedMimes) : LocalImmutableBrokerEngine::DEFAULT_ALLOWED_MIMES,
                JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES,
            ),
        ];

        if (DIRECTORY_SEPARATOR === '\\') {
            foreach (['SYSTEMROOT', 'COMSPEC', 'TEMP', 'TMP', 'PATHEXT', 'PATH'] as $key) {
                $value = getenv($key);
                if (is_string($value) && $value !== '') {
                    $env[$key] = $value;
                }
            }
        } else {
            $env['PATH'] = '/usr/local/bin:/usr/bin:/bin';
        }

        return $env;
    }

    private function resolveBrokerRoot(): string
    {
        $value = $this->brokerRoot ?? (function_exists('config') ? config('legacy_custody.broker_root') : null);
        if (! is_string($value) || trim($value) === '') {
            throw new CustodyViolationException('LEGACY_CUSTODY_BROKER_ROOT is unset or empty; broker fails closed.');
        }

        return $value;
    }

    private function resolveHmacKey(): string
    {
        $value = $this->hmacKey ?? (function_exists('config') ? config('legacy_custody.broker_hmac_key') : null);
        if (! is_string($value) || strlen($value) < 32) {
            throw new CustodyViolationException('LEGACY_CUSTODY_BROKER_HMAC_KEY is missing or shorter than 32 bytes.');
        }

        return $value;
    }

    private function resolveBrokerBinary(): string
    {
        $value = $this->brokerBinary ?? (function_exists('config') ? config('legacy_custody.broker_binary') : null);
        if (! is_string($value) || trim($value) === '') {
            throw new CustodyViolationException('LEGACY_CUSTODY_BROKER binary path is unset.');
        }

        return $value;
    }
}
