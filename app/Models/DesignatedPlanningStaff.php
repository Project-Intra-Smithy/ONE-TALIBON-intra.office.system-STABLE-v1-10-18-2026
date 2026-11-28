<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DesignatedPlanningStaff extends Model
{
    protected $table = 'designated_planning_staff';

    protected $fillable = [
        'user_id',
        'employee_id',
        'department_id',
        'can_manage_plans',
        'can_manage_ppas',
        'can_manage_maps',
        'designated_by_user_id',
        'revoked_at',
        'revoked_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'can_manage_plans' => 'boolean',
            'can_manage_ppas' => 'boolean',
            'can_manage_maps' => 'boolean',
            'revoked_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
}
