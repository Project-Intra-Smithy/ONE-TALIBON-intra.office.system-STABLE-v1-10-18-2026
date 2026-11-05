<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * Descriptive catalog data only: neither municipal certification nor file rights.
 */
final class PlanFamily extends Model
{
    protected $fillable = ['title'];

    protected static function booted(): void
    {
        static::creating(function (self $family): void {
            $family->public_id ??= (string) Str::uuid();
        });
    }

    public function getRouteKeyName(): string
    {
        return 'public_id';
    }

    public function editions(): HasMany
    {
        return $this->hasMany(PlanEdition::class);
    }
}
