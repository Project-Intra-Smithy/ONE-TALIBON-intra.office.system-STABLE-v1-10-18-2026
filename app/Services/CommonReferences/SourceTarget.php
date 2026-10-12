<?php

namespace App\Services\CommonReferences;

/**
 * A read-only, point-in-time navigation hint, never a capability or grant.
 *
 * The destination must still enforce its own authorization when requested.
 */
final readonly class SourceTarget
{
    /**
     * @param 'json_resource'|'detail_page' $destinationType
     */
    public function __construct(
        public SourceKind $kind,
        public int $id,
        public string $title,
        public string $url,
        public string $destinationType,
    ) {
    }

    public function reference(): string
    {
        return $this->kind->value.':'.$this->id;
    }
}
