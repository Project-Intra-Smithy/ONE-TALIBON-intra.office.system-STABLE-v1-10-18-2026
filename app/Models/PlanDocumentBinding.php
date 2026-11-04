<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Read-only Eloquent projection: PostgreSQL keeps bindings quarantined. */
final class PlanDocumentBinding extends Model
{
    protected $guarded = ['*'];

    public function edition(): BelongsTo
    {
        return $this->belongsTo(PlanEdition::class, 'plan_edition_id');
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
