<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PpaRecord extends Model
{
    protected $fillable = [
        'ppa_code',
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
            'related_project_count' => 'integer',
            'appropriation_amount' => 'float',
            'ps_amount' => 'float',
            'mooe_amount' => 'float',
            'co_amount' => 'float',
            'climate_adaptation_amount' => 'float',
            'climate_mitigation_amount' => 'float',
            'gad_attributed' => 'boolean',
            'drrm_tagged' => 'boolean',
        ];
    }

    public function implementingDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'implementing_department_id');
    }
}
