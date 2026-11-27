<?php

declare(strict_types=1);

namespace App\Services\Planning;

use App\Models\DevelopmentPlan;
use App\Models\PlanningAttachment;
use App\Models\PlanningMap;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class PlanningDossier
{
    public function syncMaps(DevelopmentPlan $plan, array $data): void
    {
        if (! array_key_exists('linked_map_ids', $data)) {
            return;
        }
        $ids = array_map('intval', $data['linked_map_ids'] ?? []);
        if (PlanningMap::query()->whereIn('id', $ids)->orderBy('id')->lockForUpdate()->get()->count() !== count($ids)) {
            throw ValidationException::withMessages(['linked_map_ids' => 'Choose existing distinct Planning maps.']);
        }
        DB::table('planning_plan_map_links')->where('development_plan_id', $plan->id)->delete();
        foreach ($ids as $id) {
            DB::table('planning_plan_map_links')->insert(['development_plan_id' => $plan->id, 'planning_map_id' => $id]);
        }
    }

    public function plate(PlanningMap $map, array $data): void
    {
        if (! array_key_exists('plate_attachment_id', $data)) {
            return;
        }
        $id = $data['plate_attachment_id'];
        if ($id !== null) {
            $plate = PlanningAttachment::query()->lockForUpdate()->find($id);
            if (! $plate || $plate->archived_at !== null || $plate->parent_type !== 'map'
                || $plate->parent_record_id !== $map->id || $plate->category !== 'cartographic_plate'
                || ! in_array($plate->mime_type, ['application/pdf', 'image/png', 'image/jpeg'], true)) {
                throw ValidationException::withMessages(['plate_attachment_id' => 'Choose an active cartographic attachment bound to this map.']);
            }
        }
        $map->update(['plate_attachment_id' => $id]);
    }
}
