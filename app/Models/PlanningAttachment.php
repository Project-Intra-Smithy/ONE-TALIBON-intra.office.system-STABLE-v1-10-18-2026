<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class PlanningAttachment extends Model
{
    protected $fillable = [
        'public_id',
        'parent_type',
        'parent_code',
        'parent_record_id',
        'title',
        'file_name',
        'mime_type',
        'size_bytes',
        'checksum_sha256',
        'storage_disk',
        'storage_path',
        'category',
        'visibility',
        'owner_department_id',
        'uploaded_by_user_id',
        'archived_at',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $attachment): void {
            if (! $attachment->public_id) {
                $attachment->public_id = (string) Str::uuid();
            }
        });
        static::updating(function (self $attachment): void {
            if ($attachment->isDirty(['parent_type', 'parent_code', 'parent_record_id'])) {
                throw new \LogicException('Planning attachment parent identity is immutable.');
            }
        });
    }

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
            'parent_record_id' => 'integer',
            'archived_at' => 'datetime',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'public_id';
    }

    public function ownerDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'owner_department_id');
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }
}
