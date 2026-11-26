export type PPAStatus = 'Planned' | 'For Procurement' | 'Ongoing' | 'Completed' | 'On Hold';
export type PPAPriority = 'High' | 'Medium' | 'Routine';

export type PPARecord = {
    id: string;
    dbId?: number;
    canEdit?: boolean;
    canDelete?: boolean;
    canUploadAttachments?: boolean;
    title: string;
    sector: string;
    responsibleOffice: string;
    implementingDepartmentId?: number | null;
    year: number;
    relatedDevelopmentPlan: string;
    fundingSource: string;
    status: PPAStatus;
    rawStatus?: string;
    relatedProjectCount: number;
    priority: PPAPriority;
    implementationContext: string;
    location?: string;
    barangay?: string;
    appropriationAmount?: number;
    psAmount?: number;
    mooeAmount?: number;
    coAmount?: number;
    climateAdaptationAmount?: number;
    climateMitigationAmount?: number;
    gadAttributed?: boolean;
    drrmTagged?: boolean;
    aipReferenceCode?: string | null;
    targetQuarter?: string | null;
    mapCode?: string | null;
    provenanceStatus?: string;
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
