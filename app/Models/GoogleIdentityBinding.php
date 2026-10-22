<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A Google subject is not an employee role or authorization claim.
 * The subject and User foreign key are immutable via the service contract.
 */
final class GoogleIdentityBinding extends Model
{
    protected $table = 'google_identity_bindings';

    protected $guarded = ['*'];

    protected function casts(): array
    {
        return [
            'linked_at' => 'immutable_datetime',
            'revoked_at' => 'immutable_datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
