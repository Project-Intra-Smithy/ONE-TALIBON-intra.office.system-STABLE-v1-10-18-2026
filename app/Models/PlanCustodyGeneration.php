<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class PlanCustodyGeneration extends Model
{
    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['created_at' => 'immutable_datetime'];
    }

    public function scanEvidence(): HasMany
    {
        return $this->hasMany(PlanCustodyScanEvidence::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(PlanCustodyEvent::class);
    }
}
