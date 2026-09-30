export type PermitStage =
    | 'Application'
    | 'Engineering'
    | 'Zoning'
    | 'Fire'
    | 'Other clearances'
    | 'Permit processing';

export type PermitReferenceState =
    | 'Complete reference'
    | 'Under review'
    | 'Pending reference'
    | 'Not yet reached';

export type ClearanceKey = 'engineering' | 'zoning' | 'fire' | 'other';

export type PermitReferenceStates = {
    engineering: PermitReferenceState;
    zoning: PermitReferenceState;
    fire: PermitReferenceState;
    other: PermitReferenceState;
    permitProcessing: PermitReferenceState;
};

export type PermitTimelineEvent = {
    stage: PermitStage;
    label: string;
    detail: string;
};

export type BuildingPermitCase = {
    reference: string;
    projectType: string;
    currentStage: PermitStage;
    officeContext: string;
    caseNote: string;
    requiredReferences: string[];
    referenceStates: PermitReferenceStates;
    permitState: string;
    timeline: PermitTimelineEvent[];
};

export const permitLifecycle: PermitStage[] = [
    'Application',
    'Engineering',
    'Zoning',
    'Fire',
    'Other clearances',
    'Permit processing',
];

export const clearanceLabels: Record<ClearanceKey, string> = {
    engineering: 'Engineering',
    zoning: 'Zoning',
    fire: 'Fire',
    other: 'Other clearances',
};

export const buildingPermitCases: BuildingPermitCase[] = [
    {
        reference: 'BLD-2026-011',
        projectType: 'Two-storey residential permit',
        currentStage: 'Engineering',
        officeContext: 'Municipal Engineering Office · plan-set review reference',
        caseNote: 'Engineering review reference is active before dependent zoning, fire and other clearance references are coordinated.',
        requiredReferences: [
            'Architectural plan-set reference',
            'Structural reference set',
            'Site development reference',
        ],
        referenceStates: {
            engineering: 'Under review',
            zoning: 'Pending reference',
            fire: 'Not yet reached',
            other: 'Not yet reached',
            permitProcessing: 'Not yet reached',
        },
        permitState: 'Engineering review reference',
        timeline: [
            {
                stage: 'Application',
                label: 'Application reference assembled',
                detail: 'Illustrative case materials are represented as received for presentation sequencing only.',
            },
            {
                stage: 'Engineering',
                label: 'Engineering review reference active',
                detail: 'Plan-set and structural references are shown under engineering review; no engineering approval is represented.',
            },
        ],
    },
    {
        reference: 'BLD-2026-019',
        projectType: 'Small commercial alteration',
        currentStage: 'Zoning',
        officeContext: 'Engineering + zoning coordination reference',
        caseNote: 'Engineering reference is complete for presentation purposes and zoning coordination is the current dependency surface.',
        requiredReferences: [
            'Alteration plan-set reference',
            'Use and occupancy context reference',
            'Zoning coordination reference',
        ],
        referenceStates: {
            engineering: 'Complete reference',
            zoning: 'Under review',
            fire: 'Pending reference',
            other: 'Pending reference',
            permitProcessing: 'Not yet reached',
        },
        permitState: 'Cross-office clearance reference',
        timeline: [
            {
                stage: 'Application',
                label: 'Application reference recorded',
                detail: 'Illustrative commercial-alteration case data entered the presentation sequence.',
            },
            {
                stage: 'Engineering',
                label: 'Engineering reference completed',
                detail: 'The engineering reference is shown complete as a dependency marker, not as regulatory approval.',
            },
            {
                stage: 'Zoning',
                label: 'Zoning reference under review',
                detail: 'Zoning context is shown as the active cross-office reference; no zoning approval is represented.',
            },
        ],
    },
    {
        reference: 'BLD-2026-024',
        projectType: 'Warehouse extension reference',
        currentStage: 'Fire',
        officeContext: 'Engineering + zoning + fire coordination reference',
        caseNote: 'Engineering and zoning references are complete in the illustrative sequence while the fire-clearance reference remains under review.',
        requiredReferences: [
            'Extension plan-set reference',
            'Engineering coordination reference',
            'Zoning context reference',
            'Fire-clearance reference',
        ],
        referenceStates: {
            engineering: 'Complete reference',
            zoning: 'Complete reference',
            fire: 'Under review',
            other: 'Pending reference',
            permitProcessing: 'Not yet reached',
        },
        permitState: 'Fire clearance reference',
        timeline: [
            {
                stage: 'Application',
                label: 'Extension reference assembled',
                detail: 'Illustrative warehouse-extension materials are represented for dependency sequencing only.',
            },
            {
                stage: 'Engineering',
                label: 'Engineering reference completed',
                detail: 'Engineering dependency reference marked complete without representing approval authority.',
            },
            {
                stage: 'Zoning',
                label: 'Zoning reference completed',
                detail: 'Zoning dependency reference marked complete without representing approval authority.',
            },
            {
                stage: 'Fire',
                label: 'Fire reference under review',
                detail: 'Fire-clearance reference is active in the presentation sequence; no fire approval is represented.',
            },
        ],
    },
    {
        reference: 'BLD-2026-031',
        projectType: 'Accessibility retrofit',
        currentStage: 'Permit processing',
        officeContext: 'Cross-office references consolidated for permit-processing context',
        caseNote: 'Required cross-office references are shown complete for presentation sequencing and the case is now represented at permit-processing reference stage.',
        requiredReferences: [
            'Accessibility retrofit plan reference',
            'Engineering reference',
            'Zoning reference',
            'Fire reference',
            'Other clearance reference set',
        ],
        referenceStates: {
            engineering: 'Complete reference',
            zoning: 'Complete reference',
            fire: 'Complete reference',
            other: 'Complete reference',
            permitProcessing: 'Under review',
        },
        permitState: 'Permit processing reference',
        timeline: [
            {
                stage: 'Application',
                label: 'Retrofit reference assembled',
                detail: 'Illustrative accessibility-retrofit case entered the presentation sequence.',
            },
            {
                stage: 'Engineering',
                label: 'Engineering reference completed',
                detail: 'Engineering dependency reference marked complete for presentation sequencing only.',
            },
            {
                stage: 'Zoning',
                label: 'Zoning reference completed',
                detail: 'Zoning dependency reference marked complete for presentation sequencing only.',
            },
            {
                stage: 'Fire',
                label: 'Fire reference completed',
                detail: 'Fire dependency reference marked complete for presentation sequencing only.',
            },
            {
                stage: 'Other clearances',
                label: 'Other clearance references completed',
                detail: 'Remaining illustrative dependency references are shown complete without representing approvals.',
            },
            {
                stage: 'Permit processing',
                label: 'Permit-processing reference active',
                detail: 'The case is shown at permit-processing reference stage; no permit issuance or decision is represented.',
            },
        ],
    },
];
