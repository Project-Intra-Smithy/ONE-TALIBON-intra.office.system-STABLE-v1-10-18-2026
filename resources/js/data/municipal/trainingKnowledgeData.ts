export type KnowledgeCategory =
    | 'Manuals'
    | 'SOPs'
    | 'Templates'
    | 'Videos'
    | 'Onboarding'
    | 'Institutional Knowledge';

export type KnowledgeResourceType =
    | 'Manual'
    | 'SOP'
    | 'Template'
    | 'Video'
    | 'Onboarding'
    | 'Institutional Knowledge';

export type KnowledgeFormat =
    | 'Reference PDF'
    | 'Reference page'
    | 'Template reference'
    | 'Recorded learning'
    | 'Checklist reference';

export type KnowledgeResource = {
    reference: string;
    title: string;
    type: KnowledgeResourceType;
    category: KnowledgeCategory;
    owningOffice: string;
    topic: string;
    updatedReference: string;
    format: KnowledgeFormat;
    summary: string;
    featured?: boolean;
    popular?: boolean;
    recentlyUpdated?: boolean;
    onboardingOrder?: number;
    relatedReferences: string[];
};

export type OnboardingPathItem = {
    reference: string;
    title: string;
    officeContext: string;
    learningContext: string;
    state: 'Start here' | 'Core reference' | 'Guided reference' | 'Companion reference';
};

export type InstitutionalKnowledgeItem = {
    reference: string;
    title: string;
    kind: 'Office guide' | 'Handover reference' | 'Process note' | 'Template memory' | 'Recorded learning';
    owningOffice: string;
    continuityContext: string;
    relatedResourceReferences: string[];
};

export const knowledgeCategories: KnowledgeCategory[] = [
    'Manuals',
    'SOPs',
    'Templates',
    'Videos',
    'Onboarding',
    'Institutional Knowledge',
];

export const knowledgeResources: KnowledgeResource[] = [
    {
        reference: 'KNW-2026-001',
        title: 'Municipal Operations Manual Reference',
        type: 'Manual',
        category: 'Manuals',
        owningOffice: 'Municipal Administrator Office',
        topic: 'Municipal operations',
        updatedReference: '2026-Q3 reference',
        format: 'Reference PDF',
        summary: 'Illustrative operations manual index covering office coordination, common municipal service routines and reference pathways without confidential procedures.',
        featured: true,
        popular: true,
        recentlyUpdated: true,
        relatedReferences: ['KNW-2026-004', 'KNW-2026-021'],
    },
    {
        reference: 'KNW-2026-004',
        title: 'Document Routing Basics',
        type: 'SOP',
        category: 'SOPs',
        owningOffice: 'Records / General Services reference',
        topic: 'Document routing',
        updatedReference: '2026-Q3 reference',
        format: 'Reference page',
        summary: 'Presentation-only routing reference explaining common intake, endorsement and records handoff concepts at a high level.',
        featured: true,
        popular: true,
        recentlyUpdated: true,
        onboardingOrder: 3,
        relatedReferences: ['KNW-2026-001', 'KNW-2026-014'],
    },
    {
        reference: 'KNW-2026-007',
        title: 'Standard Office Memo Template Reference',
        type: 'Template',
        category: 'Templates',
        owningOffice: 'Administrator / Records reference',
        topic: 'Office communication',
        updatedReference: '2026-Q2 reference',
        format: 'Template reference',
        summary: 'Illustrative memo structure showing headings, routing context and neutral formatting without real internal correspondence.',
        popular: true,
        relatedReferences: ['KNW-2026-027'],
    },
    {
        reference: 'KNW-2026-009',
        title: 'ONE TALIBON Orientation',
        type: 'Onboarding',
        category: 'Onboarding',
        owningOffice: 'HRMO / Municipal Offices',
        topic: 'Municipal orientation',
        updatedReference: '2026-Q3 reference',
        format: 'Recorded learning',
        summary: 'Illustrative municipal orientation resource introducing office context, service values and shared working vocabulary.',
        featured: true,
        recentlyUpdated: true,
        onboardingOrder: 1,
        relatedReferences: ['KNW-2026-012', 'KNW-2026-018'],
    },
    {
        reference: 'KNW-2026-012',
        title: 'Office Procedures Reference',
        type: 'Onboarding',
        category: 'Onboarding',
        owningOffice: 'HRMO / Municipal Offices',
        topic: 'Office procedures',
        updatedReference: '2026-Q2 reference',
        format: 'Checklist reference',
        summary: 'High-level onboarding reference for common office routines, coordination expectations and where to find approved public guidance.',
        onboardingOrder: 2,
        relatedReferences: ['KNW-2026-009', 'KNW-2026-004'],
    },
    {
        reference: 'KNW-2026-014',
        title: 'Records Handling Reference',
        type: 'SOP',
        category: 'SOPs',
        owningOffice: 'Records reference',
        topic: 'Records handling',
        updatedReference: '2026-Q3 reference',
        format: 'Reference page',
        summary: 'Illustrative records-handling guide covering classification awareness, handoff discipline and continuity concepts without confidential retention instructions.',
        recentlyUpdated: true,
        onboardingOrder: 4,
        relatedReferences: ['KNW-2026-004', 'KNW-2026-021'],
    },
    {
        reference: 'KNW-2026-018',
        title: 'Municipal Service Standards Walkthrough',
        type: 'Video',
        category: 'Videos',
        owningOffice: 'HRMO / Public service reference',
        topic: 'Service standards',
        updatedReference: '2026-Q2 reference',
        format: 'Recorded learning',
        summary: 'Recorded-learning reference describing service-standard concepts and citizen-facing professionalism for presentation purposes only.',
        popular: true,
        onboardingOrder: 5,
        relatedReferences: ['KNW-2026-009', 'KNW-2026-012'],
    },
    {
        reference: 'KNW-2026-021',
        title: 'Office Handover Guide',
        type: 'Institutional Knowledge',
        category: 'Institutional Knowledge',
        owningOffice: 'Municipal Offices',
        topic: 'Continuity and handover',
        updatedReference: '2026-Q3 reference',
        format: 'Checklist reference',
        summary: 'Continuity reference for organizing handover notes, recurring responsibilities, known dependencies and reusable institutional context.',
        recentlyUpdated: true,
        relatedReferences: ['KNW-2026-001', 'KNW-2026-024'],
    },
    {
        reference: 'KNW-2026-024',
        title: 'Inter-office Coordination Process Notes',
        type: 'Institutional Knowledge',
        category: 'Institutional Knowledge',
        owningOffice: 'Municipal Offices',
        topic: 'Cross-office coordination',
        updatedReference: '2026-Q2 reference',
        format: 'Reference page',
        summary: 'Illustrative organizational-memory notes capturing coordination patterns, dependency cues and reusable lessons without sensitive case information.',
        relatedReferences: ['KNW-2026-021', 'KNW-2026-004'],
    },
    {
        reference: 'KNW-2026-027',
        title: 'Meeting-to-Action Notes Template',
        type: 'Template',
        category: 'Templates',
        owningOffice: 'Municipal Offices',
        topic: 'Knowledge capture',
        updatedReference: '2026-Q3 reference',
        format: 'Template reference',
        summary: 'Illustrative template for capturing decisions, context, owners and follow-up references without storing live meeting content.',
        recentlyUpdated: true,
        relatedReferences: ['KNW-2026-007', 'KNW-2026-024'],
    },
];

export const onboardingPath: OnboardingPathItem[] = [
    {
        reference: 'KNW-2026-009',
        title: 'ONE TALIBON orientation',
        officeContext: 'HRMO / Municipal Offices',
        learningContext: 'Shared municipal context, service values and office landscape.',
        state: 'Start here',
    },
    {
        reference: 'KNW-2026-012',
        title: 'Office procedures reference',
        officeContext: 'HRMO / Municipal Offices',
        learningContext: 'Common office routines and where reference guidance is located.',
        state: 'Core reference',
    },
    {
        reference: 'KNW-2026-004',
        title: 'Document routing basics',
        officeContext: 'Records / General Services reference',
        learningContext: 'High-level intake, endorsement and handoff concepts.',
        state: 'Guided reference',
    },
    {
        reference: 'KNW-2026-014',
        title: 'Records handling reference',
        officeContext: 'Records reference',
        learningContext: 'Records-awareness and continuity practices at reference level.',
        state: 'Guided reference',
    },
    {
        reference: 'KNW-2026-018',
        title: 'Municipal service standards',
        officeContext: 'HRMO / Public service reference',
        learningContext: 'Citizen-facing service concepts and municipal professionalism.',
        state: 'Companion reference',
    },
];

export const institutionalKnowledge: InstitutionalKnowledgeItem[] = [
    {
        reference: 'IK-2026-01',
        title: 'Office continuity guide set',
        kind: 'Office guide',
        owningOffice: 'Municipal Offices',
        continuityContext: 'Illustrative office-level guide references for recurring responsibilities, coordination points and service continuity.',
        relatedResourceReferences: ['KNW-2026-001', 'KNW-2026-021'],
    },
    {
        reference: 'IK-2026-02',
        title: 'Role transition handover reference',
        kind: 'Handover reference',
        owningOffice: 'HRMO / Municipal Offices',
        continuityContext: 'Reference structure for context transfer, open dependencies and reusable institutional notes without employee records.',
        relatedResourceReferences: ['KNW-2026-021'],
    },
    {
        reference: 'IK-2026-03',
        title: 'Cross-office process note collection',
        kind: 'Process note',
        owningOffice: 'Municipal Offices',
        continuityContext: 'Presentation-safe process notes illustrating how organizational memory can preserve recurring coordination lessons.',
        relatedResourceReferences: ['KNW-2026-024', 'KNW-2026-004'],
    },
    {
        reference: 'IK-2026-04',
        title: 'Reusable knowledge-capture templates',
        kind: 'Template memory',
        owningOffice: 'Municipal Offices',
        continuityContext: 'Template references for handovers, meeting-to-action notes and lightweight continuity capture.',
        relatedResourceReferences: ['KNW-2026-007', 'KNW-2026-027'],
    },
    {
        reference: 'IK-2026-05',
        title: 'Recorded learning reference shelf',
        kind: 'Recorded learning',
        owningOffice: 'HRMO / Municipal Offices',
        continuityContext: 'Illustrative recorded-learning references retained as organizational context rather than training completion evidence.',
        relatedResourceReferences: ['KNW-2026-009', 'KNW-2026-018'],
    },
];
