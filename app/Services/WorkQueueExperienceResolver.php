<?php

namespace App\Services;

use App\Models\User;

final class WorkQueueExperienceResolver
{
    private const PERSONAL_VIEWS = [
        'needs_my_action' => 'Needs My Action',
        'assigned_to_me' => 'Assigned to Me',
        'due_soon' => 'Due Soon',
        'overdue' => 'Overdue',
        'my_requests' => 'My Requests',
        'waiting_on_others' => 'Waiting on Others',
        'recently_completed' => 'Completed',
    ];

    private const OFFICE_VIEWS = [
        'office_queue' => 'Incoming Office Work',
        'unassigned' => 'Unassigned',
        'staff_workload' => 'Staff Workload',
        'escalations' => 'Escalations',
    ];

    private const EXECUTIVE_VIEWS = [
        'needs_my_action' => 'For Approval',
        'due_soon' => 'Due Soon',
        'overdue' => 'Overdue',
        'recently_updated' => 'Recently Updated',
        'recently_completed' => 'Completed Decisions',
    ];

    private const SYSTEM_VIEWS = [
        'all' => 'Active Work',
        'overdue' => 'Overdue',
        'recently_updated' => 'Recently Updated',
        'recently_completed' => 'Completed Recently',
    ];

    public function __construct(
        private readonly DashboardExperienceResolver $dashboardExperiences,
    ) {}

    /** @return array<string, mixed> */
    public function resolve(User $actor): array
    {
        $dashboard = $this->dashboardExperiences->resolve($actor);

        $groups = match ($dashboard['key']) {
            'department_head' => [
                [
                    'key' => 'personal',
                    'label' => 'Personal',
                    'views' => $this->definitions(self::PERSONAL_VIEWS, 'personal'),
                ],
                [
                    'key' => 'office',
                    'label' => 'Office',
                    'views' => $this->definitions(self::OFFICE_VIEWS, 'office'),
                ],
            ],
            'executive_oversight' => [[
                'key' => 'executive',
                'label' => 'Executive',
                'views' => $this->definitions(self::EXECUTIVE_VIEWS, 'municipal'),
            ]],
            'system_administration' => [[
                'key' => 'system',
                'label' => 'Administration',
                'views' => $this->definitions(self::SYSTEM_VIEWS, 'municipal'),
            ]],
            default => [[
                'key' => 'personal',
                'label' => 'Personal',
                'views' => $this->definitions(self::PERSONAL_VIEWS, 'personal'),
            ]],
        };

        $visibleViews = collect($groups)->pluck('views')->flatten(1)->pluck('key')->all();

        return [
            'profile' => $dashboard['key'],
            'department' => $dashboard['department'],
            'scopeGroups' => $groups,
            'allowedViews' => array_values(array_unique(['overview', ...$visibleViews, 'all'])),
        ];
    }

    /**
     * @param  array<string, string>  $views
     * @return array<int, array{key:string,label:string,scope:string}>
     */
    private function definitions(array $views, string $scope): array
    {
        return collect($views)
            ->map(fn (string $label, string $key): array => [
                'key' => $key,
                'label' => $label,
                'scope' => $scope,
            ])
            ->values()
            ->all();
    }
}
