export type ZoningReviewStage =
    | 'Application reference'
    | 'Planning review'
    | 'Land-use compatibility'
    | 'Locational clearance reference';

export type ZoningReferenceState =
    | 'Reference complete'
    | 'Under review'
    | 'Pending reference'
    | 'Not yet reached';

export type ZoningClearanceCase = {
    reference: string;
    applicationType: string;
    zoningClassification: string;
    siteContext: string;
    currentStage: ZoningReviewStage;
    planningNote: string;
    referenceStates: {
        application: ZoningReferenceState;
        planning: ZoningReferenceState;
        compatibility: ZoningReferenceState;
        clearance: ZoningReferenceState;
    };
    timeline: Array<{ stage: ZoningReviewStage; label: string; detail: string }>;
};

export const zoningReviewStages: ZoningReviewStage[] = [
    'Application reference',
    'Planning review',
    'Land-use compatibility',
    'Locational clearance reference',
];

export const zoningClearanceCases: ZoningClearanceCase[] = [
    {
        reference: 'ZON-2026-014',
        applicationType: 'Residential use reference',
        zoningClassification: 'Low-density residential context',
        siteContext: 'Inner municipal residential area reference',
        currentStage: 'Planning review',
        planningNote: 'Site context and zoning classification are under planning review before land-use compatibility can be represented.',
        referenceStates: {
            application: 'Reference complete',
            planning: 'Under review',
            compatibility: 'Pending reference',
            clearance: 'Not yet reached',
        },
        timeline: [
            { stage: 'Application reference', label: 'Location reference assembled', detail: 'Illustrative site and use context entered the presentation sequence.' },
            { stage: 'Planning review', label: 'Planning review active', detail: 'Zoning classification and site context are under reference review; no planning approval is represented.' },
        ],
    },
    {
        reference: 'ZON-2026-021',
        applicationType: 'Neighborhood commercial use reference',
        zoningClassification: 'Mixed-use corridor context',
        siteContext: 'Municipal corridor location reference',
        currentStage: 'Land-use compatibility',
        planningNote: 'Planning review is represented complete and the current reference centers on compatibility between proposed use and zoning context.',
        referenceStates: {
            application: 'Reference complete',
            planning: 'Reference complete',
            compatibility: 'Under review',
            clearance: 'Pending reference',
        },
        timeline: [
            { stage: 'Application reference', label: 'Application reference logged', detail: 'Illustrative land-use request recorded without applicant or parcel identity.' },
            { stage: 'Planning review', label: 'Planning reference completed', detail: 'Planning review reference is complete for sequencing only.' },
            { stage: 'Land-use compatibility', label: 'Compatibility review active', detail: 'Use-versus-zone compatibility is represented under review; no clearance decision is implied.' },
        ],
    },
    {
        reference: 'ZON-2026-033',
        applicationType: 'Institutional facility use reference',
        zoningClassification: 'Institutional context',
        siteContext: 'Civic-service area location reference',
        currentStage: 'Locational clearance reference',
        planningNote: 'Required illustrative planning and compatibility references are complete and the case is shown at locational-clearance reference stage.',
        referenceStates: {
            application: 'Reference complete',
            planning: 'Reference complete',
            compatibility: 'Reference complete',
            clearance: 'Under review',
        },
        timeline: [
            { stage: 'Application reference', label: 'Location context recorded', detail: 'Presentation-only site context entered the reference sequence.' },
            { stage: 'Planning review', label: 'Planning reference completed', detail: 'Classification reference completed without regulatory approval.' },
            { stage: 'Land-use compatibility', label: 'Compatibility reference completed', detail: 'Land-use compatibility reference completed for demonstration only.' },
            { stage: 'Locational clearance reference', label: 'Clearance reference active', detail: 'Locational-clearance reference is active; no clearance issuance is represented.' },
        ],
    },
    {
        reference: 'ZON-2026-041',
        applicationType: 'Light-service use reference',
        zoningClassification: 'Service-commercial context',
        siteContext: 'Peripheral service-area location reference',
        currentStage: 'Application reference',
        planningNote: 'Initial reference materials are represented as assembled; planning review has not yet been reached.',
        referenceStates: {
            application: 'Under review',
            planning: 'Not yet reached',
            compatibility: 'Not yet reached',
            clearance: 'Not yet reached',
        },
        timeline: [
            { stage: 'Application reference', label: 'Initial zoning reference active', detail: 'Illustrative site and use references are being represented for intake context only.' },
        ],
    },
];
