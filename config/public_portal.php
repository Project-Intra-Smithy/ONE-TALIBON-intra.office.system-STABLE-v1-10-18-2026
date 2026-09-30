<?php

return [
    'dataMode' => 'prototype',
    'sampleLabel' => 'PROTOTYPE SAMPLE DATA',
    'municipality' => 'Municipality of Talibon, Bohol',
    'hero' => [
        'eyebrow' => 'LGU INTRA-OFFICE PORTAL',
        'title' => 'ONE TALIBON. ONE WORKSPACE.',
        'lead' => 'MUNICIPAL WORK, CONNECTED ACROSS OFFICES.',
        'description' => 'Manage documents, memoranda, schedules, projects, requests, and office coordination in one secure workspace.',
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
            'description' => 'Find guidance about local business and permit services available through the municipality.',
            'group' => 'services',
            'meta' => 'Information only',
            'action' => 'See contact information',
            'href' => '#contact',
        ],
        [
            'title' => 'Civil & community services',
            'description' => 'Find guidance about civil and community services available through the municipality.',
            'group' => 'services',
            'meta' => 'Information only',
            'action' => 'See contact information',
            'href' => '#contact',
        ],
        [
            'title' => 'Municipal offices',
            'description' => 'Find general guidance for identifying the municipal office responsible for a public concern.',
            'group' => 'services',
            'meta' => 'Directory preview',
            'action' => 'About Talibon',
            'href' => '#about',
        ],
        [
            'title' => 'News & public information',
            'description' => 'Read sample municipal announcements, notices, and public updates prepared for this prototype.',
            'group' => 'information',
            'meta' => 'Prototype content',
            'action' => 'Read news & notices',
            'href' => '#news',
        ],
        [
            'title' => 'Emergency advisories',
            'description' => 'See how public advisories are presented in this evaluation prototype. No active warning is issued here.',
            'group' => 'information',
            'meta' => 'Prototype content',
            'action' => 'View advisory preview',
            'href' => '#news',
        ],
        [
            'title' => 'Public documents & transparency',
            'description' => 'Review the prototype area for public documents, reports, and transparency resources.',
            'group' => 'information',
            'meta' => 'Prototype content',
            'action' => 'See public documents',
            'href' => '#transparency',
        ],
    ],
    'transparency' => [
        ['label' => 'Public document library preview', 'value' => 'Document preview', 'note' => 'No official documents are published in this prototype.'],
        ['label' => 'Municipal report preview', 'value' => 'Report preview', 'note' => 'Sample report information for layout evaluation; not an official municipal report.'],
        ['label' => 'Public notice preview', 'value' => 'Notice preview', 'note' => 'Sample notice information for evaluation; not an official municipal notice.'],
    ],
    'projects' => [
        ['title' => 'Community infrastructure update preview', 'summary' => 'Sample project-update structure for evaluation; no official project record is published here.', 'tag' => 'Project preview'],
        ['title' => 'Service modernization update preview', 'summary' => 'Sample municipal digital-service update for evaluation.', 'tag' => 'Program preview'],
        ['title' => 'Public information access update preview', 'summary' => 'Sample public-information initiative update for evaluation.', 'tag' => 'Initiative preview'],
    ],
    'dashboard' => [
        ['label' => 'Public projects', 'value' => 'Sample view', 'detail' => 'Future public project summaries'],
        ['label' => 'Service availability', 'value' => 'Prototype', 'detail' => 'Public service-information status'],
        ['label' => 'Published information', 'value' => 'Sample view', 'detail' => 'Approved public documents and notices'],
        ['label' => 'Announcements', 'value' => 'Prototype', 'detail' => 'Public news and advisories'],
    ],
    'news' => [
        ['type' => 'Advisory', 'title' => 'Municipal advisory preview', 'summary' => 'Sample advisory for evaluation. No active warning is issued here.', 'date' => ''],
        ['type' => 'Event', 'title' => 'Community event preview', 'summary' => 'Sample event for evaluation. An official schedule has not been published.', 'date' => ''],
        ['type' => 'News', 'title' => 'Municipal update preview', 'summary' => 'Sample municipal update for evaluation.', 'date' => ''],
    ],
    'contact' => [
        'heading' => 'Municipality of Talibon',
        'description' => 'Public contact details await municipal confirmation.',
        'location' => 'Talibon, Bohol, Philippines',
    ],
];
