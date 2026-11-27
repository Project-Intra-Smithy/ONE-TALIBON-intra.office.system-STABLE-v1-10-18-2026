export type PPAStatus =
    | 'Draft'
    | 'For MPDC Review'
    | 'Planned'
    | 'For Procurement'
    | 'Ongoing'
    | 'Completed'
    | 'On Hold'
    | 'Archived';

export type PPAPriority = 'High' | 'Medium' | 'Routine';

export type PPARecord = {
    id: string;
    aipRefCode: string;
    title: string;
    sector: string;
    responsibleOffice: string;
    year: number;
    relatedDevelopmentPlan: string;
    linkedPlanId?: string;
    linkedMapId?: string;
    fundingSource: string;
    status: PPAStatus;
    relatedProjectCount: number;
    priority: PPAPriority;
    implementationContext: string;
    expectedOutputs: string;
    scheduleStart: string;
    scheduleEnd: string;
    barangays: string[];
    budgetPs: number;
    budgetMooe: number;
    budgetCo: number;
    budgetTotal: number;
    ccaAmount?: number;
    ccmAmount?: number;
    gadAttributed?: boolean;
    drrmTagged?: boolean;
    updatedAt?: string;
    updatedBy?: string;
};

export type PPAFilters = {
    query: string;
    sector: string;
    office: string;
    year: string;
    plan: string;
    fundingSource: string;
    status: string;
};
