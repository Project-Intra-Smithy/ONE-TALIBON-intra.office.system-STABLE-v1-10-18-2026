<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

class DocumentImportRevision extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['source_modified_at' => 'immutable_datetime'];
    }

    protected static function booted(): void
    {
        static::updating(static function (): never {
            throw new LogicException('Imported document revision history cannot be updated.');
        });

        static::deleting(static function (): never {
            throw new LogicException('Imported document revision history cannot be deleted.');
        });
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function supersedes(): BelongsTo
    {
        return $this->belongsTo(self::class, 'supersedes_revision_id');
    }
}
