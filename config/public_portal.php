<?php

return [
    'dataMode' => 'prototype',
    'sampleLabel' => 'PROTOTYPE SAMPLE DATA',
    'municipality' => 'Municipality of Talibon, Bohol',
    'hero' => [
        'eyebrow' => 'WELCOME TO',
        'title' => 'TALIBON, BOHOL',
        'lead' => 'ONE TALIBON MUNICIPAL DIGITAL PORTAL',
        'description' => 'Bohol’s Seafood Capital · municipal services, public information, transparency resources, and secure employee access in one civic gateway.',
    ],
    'about' => [
        'eyebrow' => 'About the Portal',
        'title' => 'Built for municipal coordination.',
        'description' => 'ONE TALIBON is the LGU’s shared intra-office workspace for coordinating official work, information, documents, schedules, and processes across municipal offices.',
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
        'title' => 'Portal Capabilities',
        'description' => 'Core tools for moving municipal work between offices.',
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
                'title' => 'Documents & Memoranda',
                'description' => 'Manage official documents, memoranda, records, and correspondence.',
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
                'title' => 'Programs & Projects',
                'description' => 'Coordinate programs, projects, assignments, and activity.',
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
                'title' => 'Employees & Offices',
                'description' => 'Find office and personnel information in one workspace.',
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
                'title' => 'Calendar & Coordination',
                'description' => 'Coordinate meetings, deadlines, activities, and schedules.',
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
                'title' => 'Notifications & Follow-Up',
                'description' => 'Track work that needs review, action, or follow-up.',
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
        'title' => 'SECURE MUNICIPAL WORKSPACE',
        'description' => 'Official work continues inside the authenticated LGU Intra-Office Portal.',
        'note' => 'No live operational records are shown on this page.',
        'trustPoints' => [
            'Authorized personnel only',
            'Protected internal workspace',
            'No live operational records on this page',
        ],
    ],
    'services' => [
        [
            'title' => 'Business permits & licensing',
            'description' => 'Guidance for business permit and licensing concerns.',
            'group' => 'services',
            'meta' => 'Information only',
            'action' => 'Municipal contact',
            'href' => '#contact',
        ],
        [
            'title' => 'Civil registry requests',
            'description' => 'General guidance for local civil registry requests and concerns.',
            'group' => 'services',
            'meta' => 'Information only',
            'action' => 'Municipal contact',
            'href' => '#contact',
        ],
        [
            'title' => 'Real property & tax information',
            'description' => 'Public guidance for real-property and local tax information.',
            'group' => 'services',
            'meta' => 'Information only',
            'action' => 'Municipal contact',
            'href' => '#contact',
        ],
        [
            'title' => 'Agriculture & fisheries',
            'description' => 'Public guidance for agriculture and fisheries-related municipal services.',
            'group' => 'services',
            'meta' => 'Information only',
            'action' => 'Municipal contact',
            'href' => '#contact',
        ],
        [
            'title' => 'PESO & employment services',
            'description' => 'General information for employment and public employment service concerns.',
            'group' => 'services',
            'meta' => 'Information only',
            'action' => 'Municipal contact',
            'href' => '#contact',
        ],
        [
            'title' => 'Tourism information',
            'description' => 'Public information about Talibon destinations and visitor guidance.',
            'group' => 'services',
            'meta' => 'Public information',
            'action' => 'About Talibon',
            'href' => '#about',
        ],
        [
            'title' => 'Municipal office directory',
            'description' => 'Guidance for identifying the municipal office responsible for a concern.',
            'group' => 'services',
            'meta' => 'Directory preview',
            'action' => 'Municipal contact',
            'href' => '#contact',
        ],
        [
            'title' => 'Public documents',
            'description' => 'Prototype area for transparency resources and public-document presentation.',
            'group' => 'information',
            'meta' => 'Prototype content',
            'action' => 'Transparency',
            'href' => '#transparency',
        ],
        [
            'title' => 'Complaints & concerns',
            'description' => 'Find confirmed public contact channels for comments or municipal concerns.',
            'group' => 'information',
            'meta' => 'Contact guidance',
            'action' => 'Contact',
            'href' => '#contact',
        ],
    ],
    'transparency' => [
        ['label' => 'Public document library preview', 'value' => 'PREVIEW', 'note' => 'No official document is published by this prototype entry.'],
        ['label' => 'Municipal report preview', 'value' => 'PREVIEW', 'note' => 'Sample report presentation for layout evaluation only.'],
        ['label' => 'Public notice preview', 'value' => 'PREVIEW', 'note' => 'Sample public-notice presentation; not an active municipal notice.'],
        ['label' => 'Transparency resource preview', 'value' => 'PREVIEW', 'note' => 'Reserved for approved public transparency resources.'],
    ],
    'projects' => [
        ['title' => 'Community infrastructure update preview', 'summary' => 'Sample project-update presentation for evaluation; no official project record is published here.', 'tag' => 'Project preview'],
        ['title' => 'Service modernization update preview', 'summary' => 'Sample municipal digital-service update presentation for evaluation.', 'tag' => 'Program preview'],
        ['title' => 'Public information access update preview', 'summary' => 'Sample public-information initiative presentation for evaluation.', 'tag' => 'Initiative preview'],
    ],
    'dashboard' => [
        ['label' => 'Public projects', 'value' => 'Sample view', 'detail' => 'Future approved project summaries'],
        ['label' => 'Service directory', 'value' => 'Prototype', 'detail' => 'Municipal service-information index'],
        ['label' => 'Public documents', 'value' => 'Sample view', 'detail' => 'Approved documents and notices'],
        ['label' => 'Announcements', 'value' => 'Prototype', 'detail' => 'News and advisory presentation'],
        ['label' => 'Employee portal', 'value' => 'Secure access', 'detail' => 'Protected internal workspace'],
        ['label' => 'Municipal contacts', 'value' => 'Confirmed', 'detail' => 'Official public contact channels'],
    ],
    'news' => [
        ['type' => 'Advisory', 'title' => 'Municipal advisory preview', 'summary' => 'Sample MDRRMO-style advisory presentation for evaluation. No active warning is issued here.', 'date' => ''],
        ['type' => 'Event', 'title' => 'Community event preview', 'summary' => 'Sample event presentation for evaluation; an official schedule has not been published.', 'date' => ''],
        ['type' => 'Event', 'title' => 'Municipal activity preview', 'summary' => 'Sample calendar entry used to evaluate the upcoming-events layout.', 'date' => ''],
        ['type' => 'News', 'title' => 'Municipal public-information update', 'summary' => 'Sample announcement structure for evaluation of the public homepage.', 'date' => ''],
        ['type' => 'News', 'title' => 'Public service notice preview', 'summary' => 'Sample service notice; no active municipal notice is represented.', 'date' => ''],
    ],
    'contact' => [
        'heading' => 'Municipality of Talibon',
        'description' => 'For comments or suggestions: talibonofficial@gmail.com · Office of Mayor: (038) 422-2895.',
        'location' => 'Talibon, Bohol, Philippines',
    ],
];
