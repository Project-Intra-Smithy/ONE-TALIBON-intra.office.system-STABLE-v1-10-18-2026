<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class PlanCustodyScanEvidence extends Model
{
    public $timestamps = false;

    protected $table = 'plan_custody_scan_evidence';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'trusted' => 'boolean',
            'scanned_at' => 'immutable_datetime',
            'received_at' => 'immutable_datetime',
        ];
    }

    public function generation(): BelongsTo
    {
        return $this->belongsTo(PlanCustodyGeneration::class, 'plan_custody_generation_id');
    }
}
