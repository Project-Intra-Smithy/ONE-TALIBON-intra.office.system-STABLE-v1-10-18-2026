<?php

namespace App\Services\CommonWork;

use JsonSerializable;

/** Immutable read model. State and responsibility retain their source meanings. */
final readonly class CommonWorkItem implements JsonSerializable
{
    public function __construct(
        public CommonWorkSource $source,
        public int $sourceId,
        public string $sourceKind,
        public string $title,
        public string $sourceState,
        public string $responsibility,
        public ?string $reference,
        public ?string $dueAt,
        public ?string $updatedAt,
        public bool $isTerminal,
    ) {}

    /** @return array<string, int|string|bool|null> */
    public function jsonSerialize(): array
    {
        return [
            'key' => $this->source->value.':'.$this->sourceId,
            'source' => $this->source->value,
            'source_id' => $this->sourceId,
            'source_kind' => $this->sourceKind,
            'title' => $this->title,
            'source_state' => $this->sourceState,
            'responsibility' => $this->responsibility,
            'reference' => $this->reference,
            'due_at' => $this->dueAt,
            'updated_at' => $this->updatedAt,
            'is_terminal' => $this->isTerminal,
        ];
    }
}
