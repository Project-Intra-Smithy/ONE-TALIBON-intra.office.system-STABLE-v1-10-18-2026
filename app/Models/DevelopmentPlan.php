<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DevelopmentPlan extends Model
{
    protected $fillable = [
        'plan_key',
        'code',
        'title',
        'horizon',
        'lead_office',
        'lead_department_id',
        'coordinating_offices',
        'coverage_start',
        'coverage_end',
        'status',
        'sections_complete',
        'sections_total',
        'last_action',
        'last_action_date',
        'next_milestone',
        'next_milestone_date',
        'required_action',
        'authority',
        'document_ref',
        'provenance_status',
        'created_by_user_id',
        'updated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'coordinating_offices' => 'array',
            'coverage_start' => 'integer',
            'coverage_end' => 'integer',
            'sections_complete' => 'integer',
            'sections_total' => 'integer',
        ];
    }

    public function leadDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'lead_department_id');
    }
}
