<?php

namespace App\Services;

use App\Models\Department;

final class OfficeDirectoryCatalog
{
    /** @return array{directoryGroups: array<int, string>, directoryEntries: array<int, array<string,mixed>>} */
    public function workspace(): array
    {
        $entries = config('office_directory.entries', []);
        $groups = config('office_directory.groups', []);
        $codes = array_values(array_filter(array_column($entries, 'code')));
        $existing = Department::query()->whereIn('code', $codes)
            ->get(['id', 'code', 'is_active', 'is_routable'])->keyBy('code');

        $safeEntries = array_map(static function (array $item) use ($existing): array {
            $record = $item['code'] ? $existing->get($item['code']) : null;

            return [
                'key' => $item['key'],
                'group' => $item['group'],
                'shortName' => $item['shortName'],
                'name' => $item['name'],
                'responsibility' => $item['responsibility'],
                'backingDepartmentCode' => $record?->code,
                'recordsHref' => null,
                'routable' => $record !== null && $record->is_active && $record->is_routable,
            ];
        }, $entries);

        return ['directoryEntries' => $safeEntries, 'directoryGroups' => $groups];
    }
}
