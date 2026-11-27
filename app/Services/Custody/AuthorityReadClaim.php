<?php

declare(strict_types=1);

namespace App\Services\Custody;

final class AuthorityReadClaim
{
    /** @var resource|null */
    private $lockHandle;

    private bool $released = false;

    /**
     * @param  resource  $lockHandle
     */
    public function __construct(
        $lockHandle,
        private readonly int $initialEpoch,
        private readonly string $epochPath,
    ) {
        $this->lockHandle = $lockHandle;
    }

    public function __destruct()
    {
        $this->release();
    }

    public function initialEpoch(): int
    {
        return $this->initialEpoch;
    }

    public function epochPath(): string
    {
        return $this->epochPath;
    }

    public function isActive(): bool
    {
        return ! $this->released && is_resource($this->lockHandle);
    }

    public function release(): void
    {
        if ($this->released) {
            return;
        }

        $this->released = true;

        if (is_resource($this->lockHandle)) {
            @flock($this->lockHandle, LOCK_UN);
            @fclose($this->lockHandle);
        }

        $this->lockHandle = null;
    }
}
