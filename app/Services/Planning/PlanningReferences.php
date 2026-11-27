<?php

declare(strict_types=1);

namespace App\Services\Planning;

use App\Models\DevelopmentPlan;
use App\Models\PlanningAttachment;
use App\Models\PlanningMap;
use App\Models\PpaRecord;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class PlanningReferences
{
    public function nextPpa(int $year): string
    {
        if (DB::transactionLevel() < 1) {
            throw new \LogicException('Reference allocation requires a transaction.');
        }
        DB::select('SELECT pg_advisory_xact_lock(?)', [741002]);
        DB::table('planning_reference_counters')->insertOrIgnore(['year' => $year, 'last_number' => 100]);
        $counter = DB::table('planning_reference_counters')->where('year', $year)->lockForUpdate()->first();
        $number = (int) $counter->last_number;
        do {
            $number++;
            $code = sprintf('PPA-%d-%03d', $year, $number);
        } while (PpaRecord::query()->where('ppa_code', $code)->exists()
            || PlanningAttachment::query()->where('parent_type', 'ppa')->where('parent_code', $code)->exists());
        DB::table('planning_reference_counters')->where('year', $year)->update(['last_number' => $number]);

        return $code;
    }

    public function links(array $data): array
    {
        $links = [];
        foreach (['development_plan_id' => DevelopmentPlan::class, 'planning_map_id' => PlanningMap::class] as $field => $model) {
            if (! array_key_exists($field, $data)) {
                continue;
            }
            if ($data[$field] === null) {
                $links[$field] = null;

                continue;
            }
            $parent = $model::query()->lockForUpdate()->find($data[$field]);
            if (! $parent) {
                throw ValidationException::withMessages([$field => 'Choose an existing Planning record.']);
            }
            $links[$field] = $parent->id;
        }

        return $links;
    }
}
