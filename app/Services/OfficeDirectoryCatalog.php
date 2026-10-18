<?php

namespace App\Services;

use App\Models\Department;
use Illuminate\Support\Collection;

/**
 * Read-only public-facing catalog projection; does not authorize workflow actions.
 */
final class OfficeDirectoryCatalog
{
    /** @return array{directoryEntries: array<int, array<string, mixed>>, directoryGroups: array<int, string>} */
    public function props(): array
    {
        /** @var array<int, array{key:string, group:string, shortName:string, name:string, responsibility:string, backendCode:?string}> $entries */
        $entries = config('office_directory.entries', []);
        /** @var array<int, string> $groups */
        $groups = config('office_directory.groups', []);

        $codes = array_values(array_unique(array_filter(
            array_column($entries, 'backendCode'),
            static fn (mixed $code): bool => is_string($code) && $code !== '',
        )));

        /** @var Collection<string, Department> $departments */
        $departments = Department::query()
            ->whereIn('code', $codes)
            ->get(['code', 'is_active', 'is_routable'])
            ->keyBy('code');

        $directoryEntries = array_map(static function (array $entry) use ($departments): array {
            $code = $entry['backendCode'];
            $department = is_string($code) ? $departments->get($code) : null;

            return [
                'key' => $entry['key'],
                'group' => $entry['group'],
                'shortName' => $entry['shortName'],
                'name' => $entry['name'],
                'responsibility' => $entry['responsibility'],
                'backingDepartmentCode' => $department?->code,
                'recordsHref' => null,
                'routable' => $department !== null
                    && $department->is_active === true
                    && $department->is_routable === true,
            ];
        }, $entries);

        return [
            'directoryEntries' => $directoryEntries,
            'directoryGroups' => $groups,
        ];
    }
}
