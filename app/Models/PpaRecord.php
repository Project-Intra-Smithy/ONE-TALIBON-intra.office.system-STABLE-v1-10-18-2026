<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PpaRecord extends Model
{
    protected $fillable = [
        'ppa_code', 'development_plan_id', 'planning_map_id', 'schedule_start', 'schedule_end', 'expected_outputs', 'covered_barangays',
        'title',
        'sector',
        'responsible_office',
        'implementing_department_id',
        'year',
        'related_development_plan',
        'funding_source',
        'status',
        'related_project_count',
        'priority',
        'implementation_context',
        'location',
        'barangay',
        'appropriation_amount',
        'ps_amount',
        'mooe_amount',
        'co_amount',
        'climate_adaptation_amount',
        'climate_mitigation_amount',
        'gad_attributed',
        'drrm_tagged',
        'aip_reference_code',
        'target_quarter',
        'map_code',
        'provenance_status',
        'created_by_user_id',
        'updated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'schedule_start' => 'date', 'schedule_end' => 'date', 'covered_barangays' => 'array',
            'related_project_count' => 'integer',
            'appropriation_amount' => 'decimal:2',
            'ps_amount' => 'decimal:2',
            'mooe_amount' => 'decimal:2',
            'co_amount' => 'decimal:2',
            'climate_adaptation_amount' => 'decimal:2',
            'climate_mitigation_amount' => 'decimal:2',
            'gad_attributed' => 'boolean',
            'drrm_tagged' => 'boolean',
        ];
    }

    public function implementingDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'implementing_department_id');
    }

    public function developmentPlan(): BelongsTo
    {
        return $this->belongsTo(DevelopmentPlan::class);
    }

    public function planningMap(): BelongsTo
    {
        return $this->belongsTo(PlanningMap::class);
    }
}
