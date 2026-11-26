<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlanningMap extends Model
{
    protected $fillable = [
        'map_code',
        'title',
        'category',
        'plan_code',
        'scale',
        'crs',
        'coverage',
        'updated_year',
        'status',
        'provenance_status',
        'summary',
        'center_lat',
        'center_lng',
        'default_zoom',
        'barangays',
        'related_plan_codes',
        'related_ppa_codes',
        'lead_department_id',
        'created_by_user_id',
        'updated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'updated_year' => 'integer',
            'center_lat' => 'float',
            'center_lng' => 'float',
            'default_zoom' => 'integer',
            'barangays' => 'array',
            'related_plan_codes' => 'array',
            'related_ppa_codes' => 'array',
        ];
    }

    public function leadDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'lead_department_id');
    }
}
