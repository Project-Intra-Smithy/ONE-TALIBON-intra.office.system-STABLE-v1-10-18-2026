<?php

namespace App\Domain\Tasks;

/**
 * W02 permits transitions only for newly created individual Tasks.
 * These values are not a conversion of legacy W01 caller-defined states.
 */
enum TaskLifecycleState: string
{
    case Open = 'open';
    case InProgress = 'in_progress';
    case Completed = 'completed';

    public function nextFor(string $action): ?self
    {
        return match (true) {
            $this === self::Open && $action === 'start' => self::InProgress,
            $this === self::InProgress && $action === 'complete' => self::Completed,
            default => null,
        };
    }
}
