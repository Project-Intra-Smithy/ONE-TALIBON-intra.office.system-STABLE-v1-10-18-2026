<?php

return [
    'dataMode' => 'prototype',
    'sampleLabel' => 'PROTOTYPE SAMPLE DATA',
    'municipality' => 'Municipality of Talibon, Bohol',
    'hero' => [
        'eyebrow' => 'ONE TALIBON',
        'title' => 'ONE WORKSPACE FOR MUNICIPAL WORK.',
        'lead' => 'CONNECTED OFFICES. BETTER SERVICE.',
        'description' => 'A secure municipal workspace for coordinating offices, documents, requests, employees, projects, schedules, and official workflows across the LGU.',
    ],
    'portalPreview' => [
        'eyebrow' => 'Employee Portal Preview',
        'title' => 'Your workday at a glance',
        'modules' => [
            [
                'id' => 'memorandum',
                'kind' => 'memorandum',
                'title' => 'Latest Memorandum',
                'description' => 'Internal updates in one place.',
            ],
            [
                'id' => 'schedule',
                'kind' => 'schedule',
                'title' => 'Today & Upcoming',
                'description' => 'Calendar and coordination context.',
            ],
            [
                'id' => 'notification',
                'kind' => 'notification',
                'title' => 'Notifications',
                'description' => 'Work that may require review or follow-up.',
            ],
            [
                'id' => 'weather',
                'kind' => 'weather',
                'title' => 'Weather Context',
                'description' => 'Local conditions for field and activity planning.',
            ],
        ],
        'quickAccess' => ['Transactions', 'Documents', 'Calendar', 'Notifications', 'Employees', 'Projects'],
    ],
    'dailyConvenience' => [
        'eyebrow' => 'Everyday Coordination',
        'title' => 'YOUR WORKDAY AT A GLANCE',
        'description' => 'A clear starting point for the information and coordination employees use throughout the municipal workday.',
        'items' => [
            [
                'id' => 'latest-memoranda',
                'kind' => 'memorandum',
                'title' => 'Latest Memoranda',
                'description' => 'See newly issued internal memoranda and important office communications from one municipal workspace.',
            ],
            [
                'id' => 'events-calendar',
                'kind' => 'schedule',
                'title' => 'Events & Calendar',
                'description' => 'Keep meetings, deadlines, municipal activities and office schedules visible in one place.',
            ],
            [
                'id' => 'notifications-follow-up',
                'kind' => 'notification',
                'title' => 'Notifications & Follow-Up',
                'description' => 'Know when work requires review, action, acknowledgment or follow-up.',
            ],
            [
                'id' => 'weather-context',
                'kind' => 'weather',
                'title' => 'Local Weather Context',
                'description' => 'See local conditions that may affect field work, municipal activities, travel and coordination.',
            ],
        ],
    ],
    'capabilities' => [
        'title' => 'Portal Capabilities',
        'description' => 'A pre-login overview of the municipal work areas available to authorized personnel after authentication.',
        'items' => [
            [
                'id' => 'transactions',
                'title' => 'Inter-Office Transactions',
                'description' => 'Route requests, endorsements, and actions between municipal offices.',
            ],
            [
                'id' => 'documents',
                'title' => 'Documents & Memoranda',
                'description' => 'Coordinate official documents, memoranda, records, and correspondence.',
            ],
            [
                'id' => 'projects',
                'title' => 'Programs & Projects',
                'description' => 'Organize municipal programs, projects, assignments, and activity.',
            ],
            [
                'id' => 'people',
                'title' => 'Employees & Offices',
                'description' => 'Work with municipal office and personnel information inside the authenticated portal.',
            ],
            [
                'id' => 'calendar',
                'title' => 'Calendar & Coordination',
                'description' => 'Coordinate schedules, municipal events, deadlines, and office activity.',
            ],
            [
                'id' => 'follow-up',
                'title' => 'Notifications & Follow-Up',
                'description' => 'Keep track of work requiring review, action, or follow-up.',
            ],
        ],
    ],
    'workflow' => [
        'eyebrow' => 'How Work Moves',
        'title' => 'Clear ownership from creation to completion',
        'description' => 'Work moves through the appropriate offices with clear ownership, review, action, and completion inside the authenticated portal.',
        'steps' => ['Create', 'Route', 'Review', 'Act', 'Complete'],
    ],
    'officeOverview' => [
        'eyebrow' => 'Connected Offices',
        'title' => 'ONE MUNICIPALITY. CONNECTED OFFICES.',
        'description' => 'The portal provides a common digital workspace for municipal departments and authorized personnel while each office retains responsibility for its own official work.',
    ],
    'secureAccess' => [
        'eyebrow' => 'Secure Access',
        'title' => 'SECURE MUNICIPAL WORKSPACE',
        'description' => 'Authorized personnel sign in to access official transactions, documents, assignments, schedules, and internal coordination.',
        'note' => 'This pre-login overview does not display live transactions, employee records, documents, schedules, or notifications.',
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
