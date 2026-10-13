<?php

namespace App\Services;

use App\Models\User;
use App\Services\CommonEvidence\AuthorizedArchiveSql;

/**
 * Stable P0/P3 archive integration contract.
 *
 * SQL performs source-policy filtering, precedence resolution, pagination,
 * aggregate counts and metadata-option discovery before any projection reaches
 * the caller. Direct download still reauthorizes independently.
 */
final class DocumentArchiveQuery
{
    public function __construct(private readonly AuthorizedArchiveSql $authorizedArchive) {}

    /** @param array<string, mixed> $filters */
    public function workspace(User $actor, array $filters): array
    {
        return $this->authorizedArchive->workspace($actor, $filters);
    }

    /** @return array<string, mixed> */
    public function activity(User $actor): array
    {
        return $this->authorizedArchive->activity($actor);
    }
}
