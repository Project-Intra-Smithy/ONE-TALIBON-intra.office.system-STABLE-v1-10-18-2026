<?php

namespace App\Services\CommonReferences;

/**
 * No identifiers, titles or URLs are returned for missing or denied records.
 */
final readonly class ReferenceResolution
{
    private function __construct(
        public ReferenceStatus $status,
        public ?SourceTarget $target = null,
    ) {
    }

    public static function available(SourceTarget $target): self
    {
        return new self(ReferenceStatus::Available, $target);
    }

    public static function unavailable(): self
    {
        return new self(ReferenceStatus::Unavailable);
    }

    public static function unsupported(): self
    {
        return new self(ReferenceStatus::Unsupported);
    }

    public static function invalid(): self
    {
        return new self(ReferenceStatus::Invalid);
    }
}
