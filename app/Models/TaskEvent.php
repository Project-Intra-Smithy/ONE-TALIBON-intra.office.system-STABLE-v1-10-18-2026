<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Immutable by the W02 service contract; database-level tamper controls
 * and retention policy require a separate operational decision.
 */
class TaskEvent extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'task_id',
        'actor_user_id',
        'action',
        'previous_state',
        'new_state',
        'created_at',
    ];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
