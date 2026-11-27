<?php

declare(strict_types=1);

namespace App\Services\Custody;

use App\Domain\Custody\Exceptions\CustodyFenceClosedException;
use Throwable;

/**
 * Cross-process shared authorization fence (G3-N01).
 *
 * Uses an external lockfile (LOCK_SH for egress read claims vs LOCK_EX for
 * exclusive authority mutation barriers) paired with a durable fsync'd
 * monotonic epoch counter stored strictly outside PostgreSQL.
 */
final class AuthorityFence
{
    public function __construct(
        private readonly ?string $fencePath = null,
    ) {}

    public function acquireSharedReadClaim(int $timeoutMs = 2000): AuthorityReadClaim
    {
        if ($timeoutMs < 0) {
            throw new CustodyFenceClosedException('Authority fence timeout must be non-negative.');
        }

        $epochPath = $this->resolveFencePath();
        $lockPath = $this->lockPathFor($epochPath);
        $handle = $this->openLockHandle($lockPath);

        if (! $this->acquireFlock($handle, LOCK_SH, $timeoutMs)) {
            @fclose($handle);
            throw new CustodyFenceClosedException('Timed out waiting for shared authority fence read claim.');
        }

        try {
            $epoch = $this->readEpochStrict($epochPath);
        } catch (Throwable $exception) {
            @flock($handle, LOCK_UN);
            @fclose($handle);

            throw $exception instanceof CustodyFenceClosedException
                ? $exception
                : new CustodyFenceClosedException('Failed reading authority fence epoch.', previous: $exception);
        }

        return new AuthorityReadClaim($handle, $epoch, $epochPath);
    }

    public function assertClaimUnbroken(AuthorityReadClaim $claim): void
    {
        if (! $claim->isActive()) {
            throw new CustodyFenceClosedException('Authority read claim is no longer active.');
        }

        $currentEpoch = $this->readEpochStrict($claim->epochPath());
        if ($currentEpoch !== $claim->initialEpoch()) {
            throw new CustodyFenceClosedException(
                sprintf(
                    'Authority fence epoch advanced during active read claim (claimed=%d, current=%d).',
                    $claim->initialEpoch(),
                    $currentEpoch,
                )
            );
        }
    }

    public function releaseClaim(AuthorityReadClaim $claim): void
    {
        $claim->release();
    }

    /**
     * Acquire exclusive LOCK_EX blocking deterministically against active shared
     * read claims, execute the authority mutation, durably advance the monotonic
     * epoch counter (with fsync), and release LOCK_EX.
     *
     * @template T
     *
     * @param  callable(int): T  $mutation
     * @return T
     */
    public function withExclusiveMutationBarrier(callable $mutation, int $timeoutMs = 3000): mixed
    {
        if ($timeoutMs < 0) {
            throw new CustodyFenceClosedException('Authority fence timeout must be non-negative.');
        }

        $epochPath = $this->resolveFencePath();
        $lockPath = $this->lockPathFor($epochPath);
        $handle = $this->openLockHandle($lockPath);

        if (! $this->acquireFlock($handle, LOCK_EX, $timeoutMs)) {
            @fclose($handle);
            throw new CustodyFenceClosedException('Timed out waiting for exclusive authority mutation barrier.');
        }

        try {
            $currentEpoch = $this->readEpochStrict($epochPath);
            $result = $mutation($currentEpoch);
            $this->writeEpochDurable($epochPath, $currentEpoch + 1);

            return $result;
        } finally {
            @flock($handle, LOCK_UN);
            @fclose($handle);
        }
    }

    public function currentEpoch(): int
    {
        $epochPath = $this->resolveFencePath();

        return $this->readEpochStrict($epochPath);
    }

    private function resolveFencePath(): string
    {
        $path = $this->fencePath ?? (function_exists('config') ? config('legacy_custody.authority_fence_path') : null);
        if (! is_string($path) || trim($path) === '') {
            throw new CustodyFenceClosedException('LEGACY_CUSTODY_AUTHORITY_FENCE_PATH is unset or empty; authority fence fails closed.');
        }

        $path = trim($path);
        clearstatcache(true, $path);
        if (is_link($path) || is_dir($path)) {
            throw new CustodyFenceClosedException('Authority fence path must be a regular file path, not a symlink or directory.');
        }

        $parent = dirname($path);
        if ($parent === '' || ! is_dir($parent) || is_link($parent)) {
            throw new CustodyFenceClosedException('Authority fence parent directory does not exist or is a symlink.');
        }

        return $path;
    }

    private function lockPathFor(string $epochPath): string
    {
        $lockPath = $epochPath.'.lock';
        clearstatcache(true, $lockPath);
        if (is_link($lockPath) || is_dir($lockPath)) {
            throw new CustodyFenceClosedException('Authority fence lock path must not be a symlink or directory.');
        }

        return $lockPath;
    }

    /**
     * @return resource
     */
    private function openLockHandle(string $lockPath)
    {
        $handle = @fopen($lockPath, 'c+');
        if (! is_resource($handle)) {
            throw new CustodyFenceClosedException("Unable to open authority fence lockfile [{$lockPath}].");
        }

        return $handle;
    }

    /**
     * @param  resource  $handle
     */
    private function acquireFlock($handle, int $mode, int $timeoutMs): bool
    {
        $deadlineNs = hrtime(true) + ($timeoutMs * 1_000_000);

        while (true) {
            if (@flock($handle, $mode | LOCK_NB)) {
                return true;
            }

            if (hrtime(true) >= $deadlineNs) {
                return false;
            }

            usleep(10_000);
        }
    }

    private function readEpochStrict(string $epochPath): int
    {
        clearstatcache(true, $epochPath);
        if (! file_exists($epochPath)) {
            return 1;
        }

        if (is_link($epochPath) || ! is_file($epochPath)) {
            throw new CustodyFenceClosedException('Authority fence epoch file is not a regular file.');
        }

        $raw = @file_get_contents($epochPath);
        if (! is_string($raw) || trim($raw) === '') {
            throw new CustodyFenceClosedException('Authority fence epoch file is empty or unreadable.');
        }

        try {
            $decoded = json_decode($raw, true, 8, JSON_THROW_ON_ERROR);
        } catch (Throwable $exception) {
            throw new CustodyFenceClosedException('Authority fence epoch file contains malformed JSON.', previous: $exception);
        }

        if (! is_array($decoded) || ! isset($decoded['epoch']) || ! is_int($decoded['epoch']) || $decoded['epoch'] < 1) {
            throw new CustodyFenceClosedException('Authority fence epoch file has invalid epoch value.');
        }

        return $decoded['epoch'];
    }

    private function writeEpochDurable(string $epochPath, int $nextEpoch): void
    {
        if ($nextEpoch < 1) {
            throw new CustodyFenceClosedException('Authority fence epoch must remain positive.');
        }

        clearstatcache(true, $epochPath);
        if (is_link($epochPath) || is_dir($epochPath)) {
            throw new CustodyFenceClosedException('Authority fence epoch target is a symlink or directory.');
        }

        $payload = json_encode(
            [
                'epoch' => $nextEpoch,
                'updated_at' => gmdate('Y-m-d\TH:i:s\Z'),
            ],
            JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES,
        )."\n";

        $fp = @fopen($epochPath, 'c+');
        if (! is_resource($fp)) {
            throw new CustodyFenceClosedException('Failed to open authority fence epoch file for durable update.');
        }

        try {
            if (! ftruncate($fp, 0) || ! rewind($fp)) {
                throw new CustodyFenceClosedException('Failed to reset authority fence epoch file.');
            }

            $written = fwrite($fp, $payload);
            if ($written !== strlen($payload) || ! fflush($fp) || ! fsync($fp)) {
                throw new CustodyFenceClosedException('Failed to fsync updated authority fence epoch.');
            }
        } finally {
            fclose($fp);
        }
    }
}
