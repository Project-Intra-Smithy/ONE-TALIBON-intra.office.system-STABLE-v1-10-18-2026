<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * No adoption flag, file descriptor, or document link is implied by an edition.
 * EVER_PLAN origin and guarded typed bindings require separate G1 clearance.
 */
final class PlanEdition extends Model
{
    protected $fillable = ['edition_label'];

    protected static function booted(): void
    {
        static::creating(function (self $edition): void {
            $edition->public_id ??= (string) Str::uuid();
        });
    }

    public function getRouteKeyName(): string
    {
        return 'public_id';
    }

    public function family(): BelongsTo
    {
        return $this->belongsTo(PlanFamily::class, 'plan_family_id');
    }
}
