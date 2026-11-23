<?php

declare(strict_types=1);

namespace App\Services\Custody;

use App\Domain\Custody\Exceptions\CustodyViolationException;
use Illuminate\Support\Str;
use Throwable;

/**
 * External Non-Rollback Restore Watermark Authority (G3-N03).
 *
 * Maintains an append-only HMAC-SHA256 hash-chained NDJSON witness ledger
 * strictly outside PostgreSQL. Any missing ledger, corrupted entry, broken
 * HMAC chain, unresolved PENDING intent, or database snapshot rollback
 * (dbMaxCheckpointSeq < externalMaxSealedSeq) fails closed.
 */
final class ExternalWatermarkAuthority
{
    public const ALLOWED_EVENT_KINDS = [
        'AUTHORITY_REVOKE',
        'OPERATION_COMMIT',
        'OPERATION_ABORT',
        'COMPENSATION_TOMBSTONE',
        'EPOCH_ADVANCE',
    ];

    private const GENESIS_PREV_HMAC = '0000000000000000000000000000000000000000000000000000000000000000';

    private const SHA256_PATTERN = '/\A[0-9a-f]{64}\z/';

    public function __construct(
        private readonly ?string $storePath = null,
        private readonly ?string $hmacKey = null,
    ) {}

    public function beginPendingCheckpoint(
        string $namespaceId,
        int $epoch,
        string $eventKind,
        string $stateAnchorDigest,
        ?int $minNextSeq = null,
    ): int {
        $namespaceId = $this->normalizeUuid($namespaceId, 'namespace_id');
        $this->assertCheckpointParameters($epoch, $eventKind, $stateAnchorDigest);
        if ($minNextSeq !== null && $minNextSeq < 1) {
            throw new CustodyViolationException('External watermark minNextSeq must be positive.');
        }

        $storePath = $this->resolveStorePath(requireExists: false);
        $hmacKey = $this->resolveHmacKey();

        return $this->withLedgerLock($storePath, LOCK_EX, function () use ($storePath, $hmacKey, $namespaceId, $epoch, $eventKind, $stateAnchorDigest, $minNextSeq): int {
            $state = $this->loadVerifiedState($storePath, $hmacKey, allowMissingOrEmpty: true);
            $nextSeq = max($state['max_seq'] + 1, $minNextSeq ?? 1);

            $this->appendSignedLine($storePath, $hmacKey, [
                'seq' => $nextSeq,
                'namespace_id' => $namespaceId,
                'epoch' => $epoch,
                'status' => 'PENDING',
                'event_kind' => $eventKind,
                'state_anchor_digest' => $stateAnchorDigest,
                'prev_hmac' => $state['last_hmac'],
            ]);

            return $nextSeq;
        });
    }

    public function sealCheckpoint(
        int $seq,
        string $namespaceId,
        int $epoch,
        string $eventKind,
        string $stateAnchorDigest,
    ): void {
        if ($seq < 1) {
            throw new CustodyViolationException('Watermark checkpoint seq must be positive.');
        }

        $namespaceId = $this->normalizeUuid($namespaceId, 'namespace_id');
        $this->assertCheckpointParameters($epoch, $eventKind, $stateAnchorDigest);

        $storePath = $this->resolveStorePath(requireExists: true);
        $hmacKey = $this->resolveHmacKey();

        $this->withLedgerLock($storePath, LOCK_EX, function () use ($storePath, $hmacKey, $seq, $namespaceId, $epoch, $eventKind, $stateAnchorDigest): void {
            $state = $this->loadVerifiedState($storePath, $hmacKey, allowMissingOrEmpty: false);

            if (! isset($state['pending'][$seq])) {
                throw new CustodyViolationException("Cannot seal watermark checkpoint seq={$seq}: no matching unresolved PENDING entry.");
            }

            $pending = $state['pending'][$seq];
            if ($pending['namespace_id'] !== $namespaceId
                || $pending['epoch'] !== $epoch
                || $pending['event_kind'] !== $eventKind
                || ! hash_equals($pending['state_anchor_digest'], $stateAnchorDigest)) {
                throw new CustodyViolationException("Cannot seal watermark checkpoint seq={$seq}: tuple mismatch with PENDING entry.");
            }

            $this->appendSignedLine($storePath, $hmacKey, [
                'seq' => $seq,
                'namespace_id' => $namespaceId,
                'epoch' => $epoch,
                'status' => 'SEALED',
                'event_kind' => $eventKind,
                'state_anchor_digest' => $stateAnchorDigest,
                'prev_hmac' => $state['last_hmac'],
            ]);
        });
    }

    public function verifyAgainstDatabase(
        string $namespaceId,
        int $expectedEpoch,
        int $dbMaxCheckpointSeq,
        ?string $dbLatestAnchorDigest,
    ): void {
        $namespaceId = $this->normalizeUuid($namespaceId, 'namespace_id');
        if ($expectedEpoch < 1) {
            throw new CustodyViolationException('Watermark verification requires a positive expected epoch.');
        }
        if ($dbMaxCheckpointSeq < 0) {
            throw new CustodyViolationException('Database watermark checkpoint sequence cannot be negative.');
        }
        if ($dbLatestAnchorDigest !== null && preg_match(self::SHA256_PATTERN, $dbLatestAnchorDigest) !== 1) {
            throw new CustodyViolationException('Database watermark anchor digest is malformed.');
        }

        $storePath = $this->resolveStorePath(requireExists: true);
        $hmacKey = $this->resolveHmacKey();

        $this->withLedgerLock($storePath, LOCK_SH, function () use ($storePath, $hmacKey, $namespaceId, $expectedEpoch, $dbMaxCheckpointSeq, $dbLatestAnchorDigest): void {
            $state = $this->loadVerifiedState($storePath, $hmacKey, allowMissingOrEmpty: false);

            foreach ($state['pending'] as $pendingSeq => $pending) {
                if ($pending['namespace_id'] === $namespaceId) {
                    throw new CustodyViolationException(
                        "Unresolved PENDING watermark checkpoint (seq={$pendingSeq}) for namespace [{$namespaceId}]; egress held conservatively."
                    );
                }
            }

            $nsSealed = $state['sealed_by_namespace'][$namespaceId] ?? null;
            if ($nsSealed === null) {
                throw new CustodyViolationException("No SEALED external watermark checkpoint exists for namespace [{$namespaceId}].");
            }

            $externalMaxSeq = $nsSealed['max_seq'];
            $externalMaxEpoch = $nsSealed['max_epoch'];
            $externalLatestAnchor = $nsSealed['latest_anchor'];

            if ($expectedEpoch < $externalMaxEpoch) {
                throw new CustodyViolationException(
                    "Database epoch ({$expectedEpoch}) regressed behind external watermark epoch ({$externalMaxEpoch})."
                );
            }

            if ($dbMaxCheckpointSeq < $externalMaxSeq) {
                throw new CustodyViolationException(
                    "Database snapshot rollback/resurrection detected: db_seq={$dbMaxCheckpointSeq} < external_sealed_seq={$externalMaxSeq}."
                );
            }

            if ($dbMaxCheckpointSeq > $externalMaxSeq) {
                throw new CustodyViolationException(
                    "External watermark witness lags behind database: db_seq={$dbMaxCheckpointSeq} > external_sealed_seq={$externalMaxSeq}."
                );
            }

            if ($dbLatestAnchorDigest === null || ! hash_equals($externalLatestAnchor, $dbLatestAnchorDigest)) {
                throw new CustodyViolationException(
                    "Watermark state anchor digest mismatch at seq={$externalMaxSeq}."
                );
            }
        });
    }

    /**
     * @return array{
     *     max_seq: int,
     *     last_hmac: string,
     *     pending: array<int, array{seq: int, namespace_id: string, epoch: int, event_kind: string, state_anchor_digest: string}>,
     *     sealed_by_namespace: array<string, array{max_seq: int, max_epoch: int, latest_anchor: string}>
     * }
     */
    private function loadVerifiedState(string $storePath, string $hmacKey, bool $allowMissingOrEmpty): array
    {
        clearstatcache(true, $storePath);

        if (! file_exists($storePath)) {
            if ($allowMissingOrEmpty) {
                return [
                    'max_seq' => 0,
                    'last_hmac' => self::GENESIS_PREV_HMAC,
                    'pending' => [],
                    'sealed_by_namespace' => [],
                ];
            }

            throw new CustodyViolationException('External watermark witness ledger is missing.');
        }

        if (is_link($storePath) || ! is_file($storePath) || ! is_readable($storePath)) {
            throw new CustodyViolationException('External watermark witness ledger is unreadable or not a regular file.');
        }

        $contents = @file_get_contents($storePath);
        if (! is_string($contents)) {
            throw new CustodyViolationException('Failed to read external watermark witness ledger.');
        }

        if (trim($contents) === '') {
            if ($allowMissingOrEmpty) {
                return [
                    'max_seq' => 0,
                    'last_hmac' => self::GENESIS_PREV_HMAC,
                    'pending' => [],
                    'sealed_by_namespace' => [],
                ];
            }

            throw new CustodyViolationException('External watermark witness ledger is empty.');
        }

        $rawLines = preg_split('/\r\n|\n/', $contents);
        if (! is_array($rawLines)) {
            throw new CustodyViolationException('Failed to split external watermark witness ledger lines.');
        }

        // Remove single trailing empty element after final newline, but reject embedded blank lines.
        if ($rawLines !== [] && end($rawLines) === '') {
            array_pop($rawLines);
        }

        if ($rawLines === []) {
            throw new CustodyViolationException('External watermark witness ledger contains no records.');
        }

        $expectedPrevHmac = self::GENESIS_PREV_HMAC;
        $maxSeq = 0;
        $pending = [];
        $sealedSeqs = [];
        $sealedByNamespace = [];

        foreach ($rawLines as $index => $line) {
            $lineNo = $index + 1;
            if (trim($line) === '') {
                throw new CustodyViolationException("Corrupted blank line {$lineNo} in external watermark ledger.");
            }

            try {
                $entry = json_decode($line, true, 8, JSON_THROW_ON_ERROR);
            } catch (Throwable $exception) {
                throw new CustodyViolationException("Malformed JSON at line {$lineNo} in external watermark ledger.", previous: $exception);
            }

            if (! is_array($entry)) {
                throw new CustodyViolationException("Non-object entry at line {$lineNo} in external watermark ledger.");
            }

            $requiredKeys = ['seq', 'namespace_id', 'epoch', 'status', 'event_kind', 'state_anchor_digest', 'prev_hmac', 'hmac'];
            if (array_keys($entry) !== $requiredKeys) {
                throw new CustodyViolationException("Unexpected key structure at line {$lineNo} in external watermark ledger.");
            }

            $seq = $entry['seq'];
            $ns = $entry['namespace_id'];
            $epoch = $entry['epoch'];
            $status = $entry['status'];
            $eventKind = $entry['event_kind'];
            $anchor = $entry['state_anchor_digest'];
            $prevHmac = $entry['prev_hmac'];
            $storedHmac = $entry['hmac'];

            if (! is_int($seq) || $seq < 1
                || ! is_string($ns) || ! Str::isUuid($ns) || $ns !== strtolower($ns)
                || ! is_int($epoch) || $epoch < 1
                || ! in_array($status, ['PENDING', 'SEALED'], true)
                || ! is_string($eventKind) || ! in_array($eventKind, self::ALLOWED_EVENT_KINDS, true)
                || ! is_string($anchor) || preg_match(self::SHA256_PATTERN, $anchor) !== 1
                || ! is_string($prevHmac) || preg_match(self::SHA256_PATTERN, $prevHmac) !== 1
                || ! is_string($storedHmac) || preg_match(self::SHA256_PATTERN, $storedHmac) !== 1) {
                throw new CustodyViolationException("Invalid field value at line {$lineNo} in external watermark ledger.");
            }

            if (! hash_equals($expectedPrevHmac, $prevHmac)) {
                throw new CustodyViolationException("Broken prev_hmac hash chain at line {$lineNo} in external watermark ledger.");
            }

            $unsigned = [
                'seq' => $seq,
                'namespace_id' => $ns,
                'epoch' => $epoch,
                'status' => $status,
                'event_kind' => $eventKind,
                'state_anchor_digest' => $anchor,
                'prev_hmac' => $prevHmac,
            ];
            $computedHmac = $this->computeHmac($unsigned, $hmacKey);
            if (! hash_equals($computedHmac, $storedHmac)) {
                throw new CustodyViolationException("Invalid HMAC signature at line {$lineNo} in external watermark ledger.");
            }

            if ($status === 'PENDING') {
                if ($seq <= $maxSeq || isset($pending[$seq]) || isset($sealedSeqs[$seq])) {
                    throw new CustodyViolationException("Non-monotonic or duplicate PENDING seq={$seq} at line {$lineNo}.");
                }
                $maxSeq = $seq;
                $pending[$seq] = [
                    'seq' => $seq,
                    'namespace_id' => $ns,
                    'epoch' => $epoch,
                    'event_kind' => $eventKind,
                    'state_anchor_digest' => $anchor,
                ];
            } else {
                if (! isset($pending[$seq]) || isset($sealedSeqs[$seq])) {
                    throw new CustodyViolationException("SEALED entry at line {$lineNo} has no matching unresolved PENDING seq={$seq}.");
                }
                $open = $pending[$seq];
                if ($open['namespace_id'] !== $ns
                    || $open['epoch'] !== $epoch
                    || $open['event_kind'] !== $eventKind
                    || ! hash_equals($open['state_anchor_digest'], $anchor)) {
                    throw new CustodyViolationException("SEALED entry at line {$lineNo} diverges from PENDING tuple for seq={$seq}.");
                }

                unset($pending[$seq]);
                $sealedSeqs[$seq] = true;

                $current = $sealedByNamespace[$ns] ?? ['max_seq' => 0, 'max_epoch' => 0, 'latest_anchor' => ''];
                if ($seq > $current['max_seq']) {
                    $current['max_seq'] = $seq;
                    $current['latest_anchor'] = $anchor;
                }
                if ($epoch > $current['max_epoch']) {
                    $current['max_epoch'] = $epoch;
                }
                $sealedByNamespace[$ns] = $current;
            }

            $expectedPrevHmac = $storedHmac;
        }

        return [
            'max_seq' => $maxSeq,
            'last_hmac' => $expectedPrevHmac,
            'pending' => $pending,
            'sealed_by_namespace' => $sealedByNamespace,
        ];
    }

    /**
     * @param  array{seq: int, namespace_id: string, epoch: int, status: string, event_kind: string, state_anchor_digest: string, prev_hmac: string}  $unsigned
     */
    private function appendSignedLine(string $storePath, string $hmacKey, array $unsigned): void
    {
        $record = $unsigned;
        $record['hmac'] = $this->computeHmac($unsigned, $hmacKey);
        $line = json_encode($record, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES)."\n";

        $existedBefore = file_exists($storePath);
        $fp = @fopen($storePath, 'ab');
        if (! is_resource($fp)) {
            throw new CustodyViolationException("Unable to open external watermark ledger [{$storePath}] for append.");
        }

        try {
            $written = fwrite($fp, $line);
            if ($written !== strlen($line) || ! fflush($fp) || ! fsync($fp)) {
                throw new CustodyViolationException('Failed to durably fsync external watermark ledger entry.');
            }
        } finally {
            fclose($fp);
        }

        if (! $existedBefore && PHP_OS_FAMILY !== 'Windows' && function_exists('fsync')) {
            $dirFp = @fopen(dirname($storePath), 'rb');
            if (is_resource($dirFp)) {
                try {
                    @fsync($dirFp);
                } finally {
                    fclose($dirFp);
                }
            }
        }
    }

    /**
     * @param  array{seq: int, namespace_id: string, epoch: int, status: string, event_kind: string, state_anchor_digest: string, prev_hmac: string}  $unsigned
     */
    private function computeHmac(array $unsigned, string $hmacKey): string
    {
        $canonical = json_encode($unsigned, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);

        return hash_hmac('sha256', $canonical, $hmacKey);
    }

    /**
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    private function withLedgerLock(string $storePath, int $lockMode, callable $callback): mixed
    {
        $lockPath = $storePath.'.lock';
        clearstatcache(true, $lockPath);
        if (is_link($lockPath) || is_dir($lockPath)) {
            throw new CustodyViolationException('External watermark lockfile must not be a symlink or directory.');
        }

        $lockHandle = @fopen($lockPath, 'c+');
        if (! is_resource($lockHandle)) {
            throw new CustodyViolationException("Unable to open external watermark lockfile [{$lockPath}].");
        }

        try {
            if (! @flock($lockHandle, $lockMode)) {
                throw new CustodyViolationException('Failed to acquire lock on external watermark witness ledger.');
            }

            return $callback();
        } finally {
            @flock($lockHandle, LOCK_UN);
            @fclose($lockHandle);
        }
    }

    private function resolveStorePath(bool $requireExists): string
    {
        $path = $this->storePath ?? (function_exists('config') ? config('legacy_custody.watermark_store_path') : null);
        if (! is_string($path) || trim($path) === '') {
            throw new CustodyViolationException('LEGACY_CUSTODY_WATERMARK_STORE is unset or empty; watermark authority fails closed.');
        }

        $path = trim($path);
        clearstatcache(true, $path);
        if (is_link($path) || is_dir($path)) {
            throw new CustodyViolationException('External watermark store path must be a regular file path, not a symlink or directory.');
        }

        $parent = dirname($path);
        if ($parent === '' || ! is_dir($parent) || is_link($parent)) {
            throw new CustodyViolationException('External watermark parent directory does not exist or is a symlink.');
        }

        if ($requireExists && ! is_file($path)) {
            throw new CustodyViolationException('External watermark witness ledger file does not exist.');
        }

        return $path;
    }

    private function resolveHmacKey(): string
    {
        $key = $this->hmacKey ?? (function_exists('config') ? config('legacy_custody.broker_hmac_key') : null);
        if (! is_string($key) || strlen($key) < 32) {
            throw new CustodyViolationException('LEGACY_CUSTODY_BROKER_HMAC_KEY is missing or shorter than 32 bytes.');
        }

        return $key;
    }

    private function normalizeUuid(string $value, string $field): string
    {
        $normalized = strtolower(trim($value));
        if (! Str::isUuid($normalized)) {
            throw new CustodyViolationException("External watermark {$field} must be a valid UUID.");
        }

        return $normalized;
    }

    private function assertCheckpointParameters(int $epoch, string $eventKind, string $stateAnchorDigest): void
    {
        if ($epoch < 1) {
            throw new CustodyViolationException('External watermark epoch must be positive.');
        }
        if (! in_array($eventKind, self::ALLOWED_EVENT_KINDS, true)) {
            throw new CustodyViolationException("Unsupported watermark event_kind [{$eventKind}].");
        }
        if (preg_match(self::SHA256_PATTERN, $stateAnchorDigest) !== 1) {
            throw new CustodyViolationException('External watermark state_anchor_digest must be 64 lowercase hex characters.');
        }
    }
}
