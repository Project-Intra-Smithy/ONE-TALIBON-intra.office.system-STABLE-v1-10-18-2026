export type CitizenRequestPriority = 'High' | 'Normal';
export type CitizenRequestStatus = 'Received' | 'Routed' | 'In progress' | 'Awaiting response' | 'Resolved';

export type CitizenRequestHistoryEvent = {
    label: string;
    detail: string;
};

export type CitizenRequest = {
    reference: string;
    concern: string;
    category: string;
    priority: CitizenRequestPriority;
    status: CitizenRequestStatus;
    assignedReference: string;
    routingStage: string;
    nextResponseContext: string;
    history: CitizenRequestHistoryEvent[];
};

export const citizenRequestStatuses: CitizenRequestStatus[] = [
    'Received',
    'Routed',
    'In progress',
    'Awaiting response',
    'Resolved',
];

export const citizenRequests: CitizenRequest[] = [
    {
        reference: 'CR-2026-041',
        concern: 'Streetlight outage report',
        category: 'Infrastructure',
        priority: 'High',
        status: 'Routed',
        assignedReference: 'Engineering',
        routingStage: 'Office reference assigned',
        nextResponseContext: 'Engineering review reference pending acknowledgment.',
        history: [
            { label: 'Concern received', detail: 'Reference request entered the presentation service desk.' },
            { label: 'Routed', detail: 'Engineering reference assigned for review.' },
            { label: 'Acknowledged', detail: 'Routing reference marked for office acknowledgment.' },
        ],
    },
    {
        reference: 'CR-2026-046',
        concern: 'Drainage obstruction concern',
        category: 'Drainage',
        priority: 'Normal',
        status: 'In progress',
        assignedReference: 'Engineering',
        routingStage: 'Office review in progress',
        nextResponseContext: 'Progress reference is being coordinated within the assigned office.',
        history: [
            { label: 'Concern received', detail: 'Reference request entered the presentation service desk.' },
            { label: 'Routed', detail: 'Engineering reference assigned for review.' },
            { label: 'Progress reference updated', detail: 'Presentation status advanced to in progress.' },
        ],
    },
    {
        reference: 'CR-2026-052',
        concern: 'Solid waste collection concern',
        category: 'Sanitation',
        priority: 'Normal',
        status: 'Received',
        assignedReference: 'General Services',
        routingStage: 'Intake review',
        nextResponseContext: 'Routing reference awaits service-desk review.',
        history: [
            { label: 'Concern received', detail: 'Reference request entered the presentation service desk.' },
            { label: 'Intake reference opened', detail: 'General Services is shown as the presentation routing reference.' },
        ],
    },
    {
        reference: 'CR-2026-058',
        concern: 'Business permit follow-up',
        category: 'Permits',
        priority: 'Normal',
        status: 'Awaiting response',
        assignedReference: 'Business permit service reference',
        routingStage: 'Response coordination',
        nextResponseContext: 'Service reference is awaiting a presentation response update.',
        history: [
            { label: 'Concern received', detail: 'Reference request entered the presentation service desk.' },
            { label: 'Routed', detail: 'Business permit service reference assigned.' },
            { label: 'Acknowledged', detail: 'Presentation routing reference acknowledged.' },
            { label: 'Awaiting response reference', detail: 'Response coordination remains open.' },
        ],
    },
    {
        reference: 'CR-2026-061',
        concern: 'Road obstruction report',
        category: 'Roads',
        priority: 'High',
        status: 'Received',
        assignedReference: 'Engineering',
        routingStage: 'Priority intake review',
        nextResponseContext: 'High-priority routing reference awaits desk review.',
        history: [
            { label: 'Concern received', detail: 'High-priority reference entered the presentation service desk.' },
            { label: 'Priority noted', detail: 'The presentation queue marks this reference for priority review.' },
        ],
    },
];

export const citizenResponseActivity = [
    { reference: 'CR-2026-046', label: 'Progress reference updated', detail: 'Engineering reference remains in progress.' },
    { reference: 'CR-2026-058', label: 'Awaiting response reference', detail: 'Permit service response coordination remains open.' },
    { reference: 'CR-2026-041', label: 'Routed to Engineering reference', detail: 'Routing stage advanced from intake to assigned office.' },
    { reference: 'CR-2026-061', label: 'Priority intake noted', detail: 'Road obstruction reference remains in received status.' },
    { reference: 'CR-2026-052', label: 'Intake reference opened', detail: 'General Services is shown as the routing reference.' },
];
