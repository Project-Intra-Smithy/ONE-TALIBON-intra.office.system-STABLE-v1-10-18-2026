<?php

namespace App\Data\Correspondence;

use App\Domain\Correspondence\CorrespondenceClassification;
use App\Domain\Correspondence\CorrespondenceLifecycleState;

/** Trusted state reconstructed inside a row lock, never from HTTP. */
final readonly class CustodySnapshot
{
    /** @param list<string> $milestones */
    public function __construct(
        public CorrespondenceLifecycleState $state,
        public int $lastEventId,
        public ?CorrespondenceClassification $classification,
        public array $milestones,
    ) {
    }

    public function has(CustodyOperation $operation): bool
    {
        return in_array($operation->value, $this->milestones, true);
    }
}
