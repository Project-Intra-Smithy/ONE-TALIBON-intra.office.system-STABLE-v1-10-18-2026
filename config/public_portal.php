<?php

return [
    'dataMode' => 'prototype',
    'sampleLabel' => 'PROTOTYPE REVIEW ENVIRONMENT',
    'municipality' => 'Municipality of Talibon, Bohol',
    'hero' => [
        'eyebrow' => 'MUNICIPALITY OF TALIBON · AUTHORIZED ACCESS',
        'title' => 'TALIBON INTRA-OFFICE PORTAL',
        'lead' => 'SECURE DIGITAL WORKSPACE FOR MUNICIPAL PERSONNEL',
        'description' => 'Access internal municipal workflows, inter-office transactions, memoranda, employee services, records, approvals, and authorized operational tools.',
    ],
    'about' => [
        'eyebrow' => 'About the Portal',
        'title' => 'One municipality. Connected internal work.',
        'description' => 'The Talibon Intra-Office Portal is the Municipality of Talibon’s secure internal workspace for coordinating official work between authorized offices and personnel.'
        'pillars' => [
            [
                'title' => 'Coordinate',
                'description' => 'Move official work between responsible offices.',
            ],
            [
                'title' => 'Centralize',
                'description' => 'Keep documents, schedules, and office information in one municipal workspace.',
            ],
            [
                'title' => 'Follow Through',
                'description' => 'Keep work visible from creation through completion.',
            ],
        ],
    ],
    'portalPreview' => [
        'eyebrow' => 'Employee Portal Preview',
        'title' => 'Workday overview',
        'modules' => [
            [
                'id' => 'memorandum',
                'kind' => 'memorandum',
                'title' => 'Latest Memorandum',
                'description' => 'Internal notices and memoranda.',
            ],
            [
                'id' => 'schedule',
                'kind' => 'schedule',
                'title' => 'Today & Upcoming',
                'description' => 'Meetings, schedules, and deadlines.',
            ],
            [
                'id' => 'notification',
                'kind' => 'notification',
                'title' => 'Notifications',
                'description' => 'Items needing review or follow-up.',
            ],
            [
                'id' => 'weather',
                'kind' => 'weather',
                'title' => 'Weather Context',
                'description' => 'Local conditions for field activity.',
            ],
        ],
        'quickAccess' => [
            ['capabilityId' => 'transactions', 'label' => 'Transactions'],
            ['capabilityId' => 'documents', 'label' => 'Documents'],
            ['capabilityId' => 'calendar', 'label' => 'Calendar'],
            ['capabilityId' => 'follow-up', 'label' => 'Notifications'],
            ['capabilityId' => 'people', 'label' => 'Employees'],
            ['capabilityId' => 'projects', 'label' => 'Projects'],
        ],
    ],
    'dailyConvenience' => [
        'eyebrow' => 'Everyday Coordination',
        'title' => 'YOUR WORKDAY AT A GLANCE',
        'description' => 'Everyday tools for keeping office work visible and coordinated.',
        'items' => [
            [
                'id' => 'latest-memoranda',
                'kind' => 'memorandum',
                'title' => 'Latest Memoranda',
                'description' => 'Review newly issued memoranda and internal office notices.',
                'detail' => [
                    'summary' => 'Keep recently issued memoranda and internal notices easy to review from one municipal workspace.',
                    'highlights' => [
                        'Review recent internal communication',
                        'Keep official notices visible',
                        'Reduce missed office updates',
                    ],
                    'note' => 'Available inside the authenticated portal.',
                ],
            ],
            [
                'id' => 'events-calendar',
                'kind' => 'schedule',
                'title' => 'Events & Calendar',
                'description' => 'See meetings, schedules, deadlines, and municipal activities.',
                'detail' => [
                    'summary' => 'Keep office schedules, deadlines, meetings, and municipal activities visible from one workspace.',
                    'highlights' => [
                        'See upcoming meetings and deadlines',
                        'Coordinate office schedules',
                        'Keep municipal activities visible',
                    ],
                    'note' => 'Available inside the authenticated portal.',
                ],
            ],
            [
                'id' => 'notifications-follow-up',
                'kind' => 'notification',
                'title' => 'Notifications & Follow-Up',
                'description' => 'Track work that needs review, action, or acknowledgment.',
                'detail' => [
                    'summary' => 'Surface work that needs review, acknowledgment, action, or follow-up so responsibilities stay visible.',
                    'highlights' => [
                        'See work requiring attention',
                        'Support timely acknowledgment',
                        'Keep follow-up responsibilities visible',
                    ],
                    'note' => 'Available inside the authenticated portal.',
                ],
            ],
            [
                'id' => 'weather-context',
                'kind' => 'weather',
                'title' => 'Local Weather Context',
                'description' => 'Check local conditions that may affect field work and travel.',
                'detail' => [
                    'summary' => 'Provide local weather awareness that may support field work, travel, and municipal activity planning.',
                    'highlights' => [
                        'Support field activity awareness',
                        'Inform travel and scheduling context',
                        'Keep local conditions visible at a glance',
                    ],
                    'note' => 'Presentation concept only. This public homepage does not retrieve live weather data.',
                ],
            ],
        ],
    ],
    'capabilities' => [
        'title' => 'Tools for authorized municipal work',
        'description' => 'The portal brings core internal workflows into one protected municipal workspace. Capability descriptions below reflect the prototype scope and do not imply that every module is production-complete.',
        'items' => [
            [
                'id' => 'transactions',
                'title' => 'Inter-Office Transactions',
                'description' => 'Route requests, endorsements, and actions between offices.',
                'detail' => [
                    'summary' => 'Coordinate requests, endorsements, and official actions between responsible municipal offices.',
                    'highlights' => [
                        'Route official work between offices',
                        'Keep office responsibility clear',
                        'Follow work through the municipal process',
                    ],
                    'note' => 'Available inside the authenticated portal.',
                ],
            ],
            [
                'id' => 'documents',
                'title' => 'Memoranda & Records',
                'description' => 'Receive, review, publish, acknowledge, and access permitted internal memoranda and municipal records.',
                'detail' => [
                    'summary' => 'Coordinate official documents, memoranda, records, and correspondence within one municipal workspace.',
                    'highlights' => [
                        'Review internal memoranda',
                        'Coordinate official correspondence',
                        'Work with municipal records',
                    ],
                    'note' => 'Available inside the authenticated portal.',
                ],
            ],
            [
                'id' => 'projects',
                'title' => 'Approvals & Workflow',
                'description' => 'Review internal workflows and actions that require authorized municipal approval or follow-through.',
                'detail' => [
                    'summary' => 'Keep municipal programs, projects, assignments, and related activity organized in one workspace.',
                    'highlights' => [
                        'Coordinate programs and projects',
                        'Keep assignments visible',
                        'Support office follow-through',
                    ],
                    'note' => 'Available inside the authenticated portal.',
                ],
            ],
            [
                'id' => 'people',
                'title' => 'HRIS / Employee Services',
                'description' => 'Access employee information, leave requests, leave credits, attendance-related services, and authorized HR workflows.',
                'detail' => [
                    'summary' => 'Access municipal office and personnel information from the shared authenticated workspace.',
                    'highlights' => [
                        'Find responsible offices',
                        'Reference personnel information',
                        'Support inter-office coordination',
                    ],
                    'note' => 'Available inside the authenticated portal.',
                ],
            ],
            [
                'id' => 'calendar',
                'title' => 'Department Workspace',
                'description' => 'Work with department-specific operational information, responsibilities, schedules, and internal activity.',
                'detail' => [
                    'summary' => 'Coordinate meetings, deadlines, municipal activities, and office schedules from one shared calendar context.',
                    'highlights' => [
                        'See office schedules',
                        'Track deadlines and meetings',
                        'Coordinate municipal activities',
                    ],
                    'note' => 'Available inside the authenticated portal.',
                ],
            ],
            [
                'id' => 'follow-up',
                'title' => 'Internal Notifications',
                'description' => 'Keep authorized reviews, acknowledgments, pending actions, and follow-up responsibilities visible.',
                'detail' => [
                    'summary' => 'Keep work requiring review, action, acknowledgment, or follow-up visible to authorized personnel.',
                    'highlights' => [
                        'Surface items needing attention',
                        'Support review and acknowledgment',
                        'Keep follow-up work visible',
                    ],
                    'note' => 'Available inside the authenticated portal.',
                ],
            ],
        ],
    ],
    'workflow' => [
        'eyebrow' => 'How Work Moves',
        'title' => 'HOW MUNICIPAL WORK MOVES',
        'description' => 'Move official work through clear ownership from start to resolution.',
        'steps' => [
            [
                'title' => 'Create',
                'description' => 'Start official work.',
            ],
            [
                'title' => 'Route',
                'description' => 'Send it to the responsible office.',
            ],
            [
                'title' => 'Review',
                'description' => 'Assigned personnel assess it.',
            ],
            [
                'title' => 'Act',
                'description' => 'Carry out the required action.',
            ],
            [
                'title' => 'Complete',
                'description' => 'Close the workflow.',
            ],
        ],
    ],
    'officeOverview' => [
        'eyebrow' => 'Connected Offices',
        'title' => 'ONE MUNICIPALITY. CONNECTED WORK.',
        'description' => 'A shared workspace helps offices coordinate while each remains responsible for its official work.',
    ],
    'secureAccess' => [
        'eyebrow' => 'Secure Access',
        'title' => 'AUTHORIZED EMPLOYEE ACCESS',
        'description' => 'Sign in to continue to the protected Talibon Intra-Office Portal and access the internal tools permitted for your account.',
        'note' => 'No live operational records are shown on this page.',
        'trustPoints' => [
            'Authorized personnel only',
            'Protected internal workspace',
            'No live operational records on this page',
        ],
    ],
    'services' => [],
    'transparency' => [],
    'projects' => [],
    'dashboard' => [],
    'news' => [],
    'contact' => [
        'heading' => 'Portal Help & Support',
        'description' => 'For account, access, or portal assistance, coordinate with your authorized municipal administrator or designated internal support contact.',
        'location' => 'Talibon Municipal Hall · Talibon, Bohol, Philippines',
    ],
];
