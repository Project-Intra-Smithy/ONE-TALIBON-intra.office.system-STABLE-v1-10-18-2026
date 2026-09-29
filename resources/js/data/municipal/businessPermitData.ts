export type BusinessPermitStage =
    | 'Application reference'
    | 'Requirements assessment'
    | 'Cross-office clearance'
    | 'Permit processing reference';

export type BusinessRequirementState =
    | 'Reference complete'
    | 'Under review'
    | 'Pending reference'
    | 'Not yet reached';

export type BusinessRequirement = {
    label: string;
    office: string;
    state: BusinessRequirementState;
};

export type BusinessPermitCase = {
    reference: string;
    applicationType: string;
    activityClass: string;
    permitClass: string;
    currentStage: BusinessPermitStage;
    assessmentContext: string;
    requirements: BusinessRequirement[];
    permitState: string;
    timeline: Array<{ stage: BusinessPermitStage; label: string; detail: string }>;
};

export const businessPermitStages: BusinessPermitStage[] = [
    'Application reference',
    'Requirements assessment',
    'Cross-office clearance',
    'Permit processing reference',
];

export const businessPermitCases: BusinessPermitCase[] = [
    {
        reference: 'BIZ-2026-008',
        applicationType: 'New micro-retail permit reference',
        activityClass: 'Neighborhood retail activity context',
        permitClass: 'New application reference',
        currentStage: 'Requirements assessment',
        assessmentContext: 'Core documentary references are under presentation review before office-clearance dependencies are coordinated.',
        requirements: [
            { label: 'Application form reference', office: 'BPLO reference', state: 'Reference complete' },
            { label: 'Zoning / locational reference', office: 'Planning reference', state: 'Under review' },
            { label: 'Fire-safety reference', office: 'Fire-clearance reference', state: 'Pending reference' },
            { label: 'Health / sanitary reference', office: 'Health reference', state: 'Pending reference' },
        ],
        permitState: 'Requirements assessment reference',
        timeline: [
            { stage: 'Application reference', label: 'Business application reference recorded', detail: 'Illustrative activity and permit-class metadata entered without a real business or applicant identity.' },
            { stage: 'Requirements assessment', label: 'Requirements reference review active', detail: 'Requirement references are being checked for presentation sequencing only.' },
        ],
    },
    {
        reference: 'BIZ-2026-017',
        applicationType: 'Renewal service-establishment reference',
        activityClass: 'Personal-service activity context',
        permitClass: 'Renewal application reference',
        currentStage: 'Cross-office clearance',
        assessmentContext: 'Requirements are represented complete and the case is shown coordinating planning, fire and health reference dependencies.',
        requirements: [
            { label: 'Renewal application reference', office: 'BPLO reference', state: 'Reference complete' },
            { label: 'Zoning / locational reference', office: 'Planning reference', state: 'Reference complete' },
            { label: 'Fire-safety reference', office: 'Fire-clearance reference', state: 'Under review' },
            { label: 'Health / sanitary reference', office: 'Health reference', state: 'Under review' },
        ],
        permitState: 'Cross-office clearance reference',
        timeline: [
            { stage: 'Application reference', label: 'Renewal reference recorded', detail: 'Illustrative renewal context entered without production business data.' },
            { stage: 'Requirements assessment', label: 'Requirement references completed', detail: 'Reference completeness is shown for workflow context, not approval.' },
            { stage: 'Cross-office clearance', label: 'Office-clearance coordination active', detail: 'Fire and health references are shown under review without regulatory decision authority.' },
        ],
    },
    {
        reference: 'BIZ-2026-026',
        applicationType: 'Small food-service permit reference',
        activityClass: 'Food-service activity context',
        permitClass: 'New application reference',
        currentStage: 'Cross-office clearance',
        assessmentContext: 'Requirements assessment is complete in the illustrative sequence while health and fire reference coordination remains active.',
        requirements: [
            { label: 'Application form reference', office: 'BPLO reference', state: 'Reference complete' },
            { label: 'Zoning / locational reference', office: 'Planning reference', state: 'Reference complete' },
            { label: 'Fire-safety reference', office: 'Fire-clearance reference', state: 'Under review' },
            { label: 'Health / sanitary reference', office: 'Health reference', state: 'Under review' },
        ],
        permitState: 'Office-clearance coordination reference',
        timeline: [
            { stage: 'Application reference', label: 'Application reference assembled', detail: 'Presentation-only business activity metadata recorded.' },
            { stage: 'Requirements assessment', label: 'Requirements reference completed', detail: 'Reference set marked complete for sequencing only.' },
            { stage: 'Cross-office clearance', label: 'Clearance references active', detail: 'Health and fire dependencies are represented without approval claims.' },
        ],
    },
    {
        reference: 'BIZ-2026-039',
        applicationType: 'Professional office renewal reference',
        activityClass: 'Office-service activity context',
        permitClass: 'Renewal application reference',
        currentStage: 'Permit processing reference',
        assessmentContext: 'Illustrative requirement and office-clearance references are complete and the case is shown at permit-processing reference stage.',
        requirements: [
            { label: 'Renewal application reference', office: 'BPLO reference', state: 'Reference complete' },
            { label: 'Zoning / locational reference', office: 'Planning reference', state: 'Reference complete' },
            { label: 'Fire-safety reference', office: 'Fire-clearance reference', state: 'Reference complete' },
            { label: 'Health / sanitary reference', office: 'Health reference', state: 'Reference complete' },
        ],
        permitState: 'Permit processing reference',
        timeline: [
            { stage: 'Application reference', label: 'Renewal reference recorded', detail: 'Illustrative renewal case entered the reference sequence.' },
            { stage: 'Requirements assessment', label: 'Requirements reference completed', detail: 'Requirements marked complete without approval implication.' },
            { stage: 'Cross-office clearance', label: 'Office references completed', detail: 'Cross-office references marked complete for presentation sequencing only.' },
            { stage: 'Permit processing reference', label: 'Permit-processing reference active', detail: 'No permit issuance, payment or production processing is represented.' },
        ],
    },
];
