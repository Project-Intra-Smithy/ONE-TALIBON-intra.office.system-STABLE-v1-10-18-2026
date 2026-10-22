<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Workflow definition
    |--------------------------------------------------------------------------
    |
    | This is the compatibility definition for the existing municipal routing
    | flow. Transaction-type overrides can progressively replace shared rules
    | without scattering office/state/SLA policy through controllers/services.
    |
    */

    'default' => [
        'initial_status' => 'submitted',

        'terminal_statuses' => [
            'approved',
            'disapproved',
            'closed',
        ],

        'transitions' => [
            'assign' => [
                'destination' => 'current',
                'requires_assignment' => true,
            ],
            'mark_review' => [
                'status' => 'for_review',
                'allowed_from' => ['submitted', 'returned', 'information_requested'],
                'destination' => 'current',
            ],
            'forward' => [
                'status' => 'submitted',
                'destination' => 'target',
                'clear_assignment' => true,
                'refresh_received_at' => true,
            ],
            'send_to_mayor' => [
                'status' => 'for_approval',
                'allowed_from' => ['for_review'],
                'destination' => 'office',
                'office_code' => 'MAYOR',
                'clear_assignment' => true,
                'refresh_received_at' => true,
            ],
            'return_origin' => [
                'status' => 'returned',
                'destination' => 'origin',
                'clear_assignment' => true,
                'refresh_received_at' => true,
            ],
            'request_information' => [
                'status' => 'information_requested',
                'destination' => 'origin',
                'clear_assignment' => true,
                'refresh_received_at' => true,
            ],
            'approve' => [
                'status' => 'approved',
                'allowed_from' => ['for_approval'],
                'destination' => 'current',
                'completes' => true,
            ],
            'disapprove' => [
                'status' => 'disapproved',
                'allowed_from' => ['for_approval'],
                'destination' => 'current',
                'completes' => true,
            ],
        ],
    ],

    'types' => [
        // Candidate-only ordinary Work Request vocabulary. The server explicitly
        // rejects completion unless municipal authority and evidence integration
        // have been accepted. Other request types retain existing transitions.
        'internal_request' => [
            'transitions' => [
                'complete' => [
                    'status' => 'closed',
                    'allowed_from' => ['for_review'],
                    'destination' => 'current',
                    'completes' => true,
                ],
            ],
        ],
    ],

    // R3 Slot02: intentionally inert until W03/W05/W06 decisions and the
    // upload/notification adapters are integrated and independently reviewed.
    'ordinary_completion' => [
        'enabled' => false,
        'allowed_roles' => [],
        // Only a synthetic Laravel test may bypass the as-yet unintegrated
        // result-evidence upload boundary. Never enable this in deployed code.
        'synthetic_without_evidence' => false,
    ],

    'sla' => [
        'priority_days' => [
            'normal' => 5,
            'high' => 3,
            'urgent' => 1,
        ],
    ],

    'executive_attention_office_codes' => [
        'MAYOR',
    ],
];
