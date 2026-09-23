<?php

return [
    'dataMode' => 'prototype',
    'sampleLabel' => 'PROTOTYPE SAMPLE DATA',
    'municipality' => 'Municipality of Talibon, Bohol',
    'hero' => [
        'eyebrow' => 'ONE TALIBON',
        'title' => 'ONE WORKSPACE FOR MUNICIPAL WORK.',
        'lead' => 'CONNECTED OFFICES. BETTER SERVICE.',
        'description' => 'A secure municipal workspace for coordinating offices, documents, requests, projects, schedules, and official workflows.',
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
        'quickAccess' => ['Transactions', 'Documents', 'Calendar', 'Notifications', 'Employees', 'Projects'],
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
            ],
            [
                'id' => 'events-calendar',
                'kind' => 'schedule',
                'title' => 'Events & Calendar',
                'description' => 'See meetings, schedules, deadlines, and municipal activities.',
            ],
            [
                'id' => 'notifications-follow-up',
                'kind' => 'notification',
                'title' => 'Notifications & Follow-Up',
                'description' => 'Track work that needs review, action, or acknowledgment.',
            ],
            [
                'id' => 'weather-context',
                'kind' => 'weather',
                'title' => 'Local Weather Context',
                'description' => 'Check local conditions that may affect field work and travel.',
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
            ],
            [
                'id' => 'documents',
                'title' => 'Documents & Memoranda',
                'description' => 'Manage official documents, memoranda, records, and correspondence.',
            ],
            [
                'id' => 'projects',
                'title' => 'Programs & Projects',
                'description' => 'Coordinate programs, projects, assignments, and activity.',
            ],
            [
                'id' => 'people',
                'title' => 'Employees & Offices',
                'description' => 'Find office and personnel information in one workspace.',
            ],
            [
                'id' => 'calendar',
                'title' => 'Calendar & Coordination',
                'description' => 'Coordinate meetings, deadlines, activities, and schedules.',
            ],
            [
                'id' => 'follow-up',
                'title' => 'Notifications & Follow-Up',
                'description' => 'Track work that needs review, action, or follow-up.',
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
