<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Model;

/**
 * The integration owner must bind a real, source-aware write policy before use.
 * Read access or document-download permission is NOT import/write authority.
 */
class DocumentImportAuthorization
{
    public function authorize(User $actor, Model $parent, string $classification): void
    {
        throw new AuthorizationException('Document import authority has not been configured.');
    }
}
