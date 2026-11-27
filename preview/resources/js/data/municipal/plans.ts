export type PlanStatus = 'Draft' | 'In force' | 'For review' | 'Updating' | 'Adopted' | 'Due this year' | 'Archived';
export type PlanHorizon = 'Annual' | 'Three-year' | 'Six-year' | 'Long-term' | 'Sectoral';

export type MunicipalPlan = {
    id: string;
    code: string;
    title: string;
    horizon: PlanHorizon;
    leadOffice: string;
    coordinatingOffices: string[];
    coverageStart: number;
    coverageEnd: number;
    status: PlanStatus;
    sectionsComplete: number;
    sectionsTotal: number;
    lastAction: string;
    lastActionDate: string;
    nextMilestone: string;
    nextMilestoneDate: string;
    requiredAction: string;
    authority: string;
    documentRef: string;
    sbResolutionNo?: string;
    sbAdoptedDate?: string;
    mdcResolutionNo?: string;
    higherReviewRef?: string;
    linkedMapIds?: string[];
    chapterNotes?: string[];
    updatedAt?: string;
    updatedBy?: string;
};

export const municipalPlans: MunicipalPlan[] = [
    {
        id: 'plan-cdp-2023-2028',
        code: 'CDP 2023–2028',
        title: 'Comprehensive Development Plan',
        horizon: 'Six-year',
        leadOffice: 'Municipal Planning and Development Office',
        coordinatingOffices: ['Office of the Municipal Mayor', 'Municipal Engineering Office', 'Municipal Social Welfare and Development Office'],
        coverageStart: 2023,
        coverageEnd: 2028,
        status: 'In force',
        sectionsComplete: 18,
        sectionsTotal: 18,
        lastAction: 'Annual implementation review recorded',
        lastActionDate: '2026-08-28',
        nextMilestone: '2027 planning assumptions review',
        nextMilestoneDate: '2026-10-09',
        requiredAction: 'Sector focal offices to confirm updated indicators before the review session.',
        authority: 'Sangguniang Bayan adoption record on file',
        documentRef: 'MPDO-PLAN-CDP-2023-2028',
        sbResolutionNo: 'SB Res. No. 2023-084',
        sbAdoptedDate: '2023-10-12',
        mdcResolutionNo: 'MDC Res. No. 2023-011',
        higherReviewRef: 'DILG Bohol CDP Technical Compliance Verified',
        linkedMapIds: ['map-tal-base-2026', 'map-tal-clup-2026'],
        chapterNotes: [
            'Ecological Profile & 25-Barangay Socioeconomic Baseline',
            'Social, Economic, Infrastructure, Environment & Institutional Sector Goals',
            'Capacity Development Agenda & Implementation Monitoring Matrix',
        ],
    },
    {
        id: 'plan-ela-2025-2028',
        code: 'ELA 2025–2028',
        title: 'Executive-Legislative Agenda',
        horizon: 'Three-year',
        leadOffice: 'Office of the Municipal Mayor',
        coordinatingOffices: ['Sangguniang Bayan Secretariat', 'Municipal Planning and Development Office'],
        coverageStart: 2025,
        coverageEnd: 2028,
        status: 'In force',
        sectionsComplete: 11,
        sectionsTotal: 11,
        lastAction: 'Priority commitments reconciled with current work program',
        lastActionDate: '2026-09-02',
        nextMilestone: 'Executive-legislative progress review',
        nextMilestoneDate: '2026-10-16',
        requiredAction: 'Lead offices to submit status notes for commitments marked for joint action.',
        authority: 'Joint executive-legislative adoption record on file',
        documentRef: 'OMM-SB-ELA-2025-2028',
        sbResolutionNo: 'SB Res. No. 2025-051',
        sbAdoptedDate: '2025-09-18',
        mdcResolutionNo: 'MDC Res. No. 2025-008',
        higherReviewRef: 'Joint Executive-Legislative Term Compact',
        linkedMapIds: ['map-tal-base-2026'],
        chapterNotes: [
            'Term Vision & 10-Point Municipal Governance Commitments',
            'Priority Legislative Ordinances & Revenue Measures',
            'Executive Work Program Alignment Matrix',
        ],
    },
    {
        id: 'plan-clup-2020-2029',
        code: 'CLUP 2020–2029',
        title: 'Comprehensive Land Use Plan',
        horizon: 'Long-term',
        leadOffice: 'Municipal Planning and Development Office',
        coordinatingOffices: ['Municipal Engineering Office', 'Municipal Assessor’s Office', 'Municipal Environment and Natural Resources Office'],
        coverageStart: 2020,
        coverageEnd: 2029,
        status: 'For review',
        sectionsComplete: 14,
        sectionsTotal: 16,
        lastAction: 'Land-use data update consolidated',
        lastActionDate: '2026-08-19',
        nextMilestone: 'Technical review of updated land-use tables',
        nextMilestoneDate: '2026-09-24',
        requiredAction: 'Planning and Assessor teams to reconcile parcel-level exceptions before technical review.',
        authority: 'Existing adoption and zoning references linked to planning file',
        documentRef: 'MPDO-PLAN-CLUP-2020-2029',
        sbResolutionNo: 'Municipal Ord. No. 2020-012',
        sbAdoptedDate: '2020-11-24',
        mdcResolutionNo: 'MDC Res. No. 2020-014',
        higherReviewRef: 'SP Bohol Ref. 2021-048 · DHSUD Region VII PLUC Reviewed',
        linkedMapIds: ['map-tal-clup-2026', 'map-tal-base-2026', 'map-tal-coast-2026'],
        chapterNotes: [
            'Volume 1: Spatial Strategy & Growth Node Structure (Poblacion + Island Nodes)',
            'Volume 2: Integrated Municipal Zoning Ordinance & Overlay Regulations',
            'Volume 3: Sectoral & Parcel-Level Land Use Reconciliation (In Progress)',
        ],
    },
    {
        id: 'plan-aip-2027',
        code: 'AIP 2027',
        title: 'Annual Investment Program',
        horizon: 'Annual',
        leadOffice: 'Municipal Planning and Development Office',
        coordinatingOffices: ['Municipal Budget Office', 'Municipal Accounting Office', 'Office of the Municipal Mayor'],
        coverageStart: 2027,
        coverageEnd: 2027,
        status: 'Updating',
        sectionsComplete: 7,
        sectionsTotal: 10,
        lastAction: 'Office submissions consolidated for technical review',
        lastActionDate: '2026-09-11',
        nextMilestone: 'Budget alignment conference',
        nextMilestoneDate: '2026-09-21',
        requiredAction: 'Offices with unresolved cost or schedule entries must submit corrections before conference.',
        authority: 'Preparation cycle under the local planning and budgeting calendar',
        documentRef: 'MPDO-AIP-2027-WORKING',
        sbResolutionNo: 'Pending SB Adoption (Target Nov 2026)',
        mdcResolutionNo: 'MDC Working Draft 2026-019',
        higherReviewRef: 'DILG-NEDA-DBM-DOF JMC No. 1 AIP Calendar',
        linkedMapIds: ['map-tal-infra-2026', 'map-tal-base-2026'],
        chapterNotes: [
            'General Public Services & Institutional Programs',
            'Social Services (Health, MSWDO, OSCA, Nutrition, GAD)',
            'Economic, Infrastructure (20% DF) & Statutory 5% LDRRMF Matrix',
        ],
    },
    {
        id: 'plan-ldip-2026-2028',
        code: 'LDIP 2026–2028',
        title: 'Local Development Investment Program',
        horizon: 'Three-year',
        leadOffice: 'Municipal Planning and Development Office',
        coordinatingOffices: ['Municipal Budget Office', 'Municipal Engineering Office', 'Municipal Treasurer’s Office'],
        coverageStart: 2026,
        coverageEnd: 2028,
        status: 'In force',
        sectionsComplete: 12,
        sectionsTotal: 12,
        lastAction: 'Project financing references synchronized',
        lastActionDate: '2026-08-31',
        nextMilestone: 'Quarterly investment program review',
        nextMilestoneDate: '2026-10-05',
        requiredAction: 'Project owners to verify obligation schedules and implementation status.',
        authority: 'Local development investment programming record',
        documentRef: 'MPDO-LDIP-2026-2028',
        sbResolutionNo: 'SB Res. No. 2025-112',
        sbAdoptedDate: '2025-11-14',
        mdcResolutionNo: 'MDC Res. No. 2025-017',
        higherReviewRef: 'Aligned with CDP 2023–2028 & Medium-Term Fiscal Framework',
        linkedMapIds: ['map-tal-infra-2026', 'map-tal-drrm-2026'],
        chapterNotes: [
            'Three-Year Ranked Priority Project Portfolio',
            '20% Development Fund & External Grant Financing Plan',
            'Multi-Year Capital Outlay Phasing (FY 2026–2028)',
        ],
    },
    {
        id: 'plan-ldrrmp-2025-2027',
        code: 'LDRRMP 2025–2027',
        title: 'Local Disaster Risk Reduction and Management Plan',
        horizon: 'Three-year',
        leadOffice: 'Municipal Disaster Risk Reduction and Management Office',
        coordinatingOffices: ['Municipal Engineering Office', 'Municipal Health Office', 'Municipal Social Welfare and Development Office'],
        coverageStart: 2025,
        coverageEnd: 2027,
        status: 'In force',
        sectionsComplete: 13,
        sectionsTotal: 13,
        lastAction: 'Preparedness actions reviewed for third quarter',
        lastActionDate: '2026-09-05',
        nextMilestone: 'Fourth-quarter readiness review',
        nextMilestoneDate: '2026-10-02',
        requiredAction: 'Response cluster leads to confirm resource and contact updates.',
        authority: 'Local DRRM Council planning record',
        documentRef: 'MDRRMO-LDRRMP-2025-2027',
        sbResolutionNo: 'SB Res. No. 2025-019',
        sbAdoptedDate: '2025-02-10',
        mdcResolutionNo: 'MDRRMC Res. No. 2025-003',
        higherReviewRef: 'OCD Region VII / PDRRMO Bohol Reviewed',
        linkedMapIds: ['map-tal-drrm-2026', 'map-tal-coast-2026'],
        chapterNotes: [
            'Multi-Hazard Risk Assessment (Flood, Storm Surge, Liquefaction)',
            '4 Thematic Pillars: Prevention, Preparedness, Response, Rehab',
            '5% LDRRMF Utilization Plan (70% Mitigation / 30% QRF)',
        ],
    },
    {
        id: 'plan-lccap-2021-2030',
        code: 'LCCAP 2021–2030',
        title: 'Local Climate Change Action Plan',
        horizon: 'Long-term',
        leadOffice: 'Municipal Environment and Natural Resources Office',
        coordinatingOffices: ['Municipal Planning and Development Office', 'Municipal Agriculture Office', 'Municipal Engineering Office'],
        coverageStart: 2021,
        coverageEnd: 2030,
        status: 'For review',
        sectionsComplete: 10,
        sectionsTotal: 12,
        lastAction: 'Adaptation activity inventory updated',
        lastActionDate: '2026-08-26',
        nextMilestone: 'Climate expenditure tagging review',
        nextMilestoneDate: '2026-10-13',
        requiredAction: 'Lead offices to verify activities tagged for climate adaptation and mitigation.',
        authority: 'Municipal climate action planning record',
        documentRef: 'MENRO-LCCAP-2021-2030',
        sbResolutionNo: 'SB Res. No. 2021-067',
        sbAdoptedDate: '2021-08-19',
        higherReviewRef: 'CCC-DILG Climate Change Expenditure Tagging (CCET) Review',
        linkedMapIds: ['map-tal-coast-2026', 'map-tal-drrm-2026'],
    },
    {
        id: 'plan-gad-2027',
        code: 'GAD Plan 2027',
        title: 'Gender and Development Plan and Budget',
        horizon: 'Annual',
        leadOffice: 'GAD Focal Point System',
        coordinatingOffices: ['Municipal Social Welfare and Development Office', 'Municipal Budget Office', 'Municipal Planning and Development Office'],
        coverageStart: 2027,
        coverageEnd: 2027,
        status: 'Updating',
        sectionsComplete: 6,
        sectionsTotal: 9,
        lastAction: 'Office issue statements and proposed activities consolidated',
        lastActionDate: '2026-09-09',
        nextMilestone: 'Technical review of proposed activities and budget',
        nextMilestoneDate: '2026-09-29',
        requiredAction: 'Focal persons to resolve incomplete issue statements and missing performance indicators.',
        authority: 'Annual GAD planning and budgeting cycle',
        documentRef: 'GFPS-GAD-2027-WORKING',
        higherReviewRef: 'Pending DILG Region VII GAD Certificate of Review & Endorsement',
        linkedMapIds: ['map-tal-base-2026'],
    },
    {
        id: 'plan-ecological-solid-waste-2025-2034',
        code: 'SWM 2025–2034',
        title: 'Ten-Year Ecological Solid Waste Management Plan',
        horizon: 'Long-term',
        leadOffice: 'Municipal Environment and Natural Resources Office',
        coordinatingOffices: ['Municipal Engineering Office', 'Municipal Health Office', 'Barangay Affairs Desk'],
        coverageStart: 2025,
        coverageEnd: 2034,
        status: 'Adopted',
        sectionsComplete: 15,
        sectionsTotal: 15,
        lastAction: 'Implementation responsibility matrix distributed',
        lastActionDate: '2026-07-30',
        nextMilestone: 'Annual diversion target review',
        nextMilestoneDate: '2026-11-06',
        requiredAction: 'Responsible offices to update accomplishment notes against assigned actions.',
        authority: 'Municipal solid waste management planning record',
        documentRef: 'MENRO-SWM-2025-2034',
        sbResolutionNo: 'SB Res. No. 2025-034',
        sbAdoptedDate: '2025-04-22',
        higherReviewRef: 'NSWMC Approved 10-Year Plan (RA 9003)',
        linkedMapIds: ['map-tal-base-2026'],
    },
    {
        id: 'plan-local-shelter-2024-2032',
        code: 'LSP 2024–2032',
        title: 'Local Shelter Plan',
        horizon: 'Long-term',
        leadOffice: 'Municipal Planning and Development Office',
        coordinatingOffices: ['Municipal Social Welfare and Development Office', 'Municipal Engineering Office', 'Municipal Assessor’s Office'],
        coverageStart: 2024,
        coverageEnd: 2032,
        status: 'For review',
        sectionsComplete: 8,
        sectionsTotal: 10,
        lastAction: 'Housing need references updated',
        lastActionDate: '2026-08-14',
        nextMilestone: 'Beneficiary and site criteria review',
        nextMilestoneDate: '2026-10-20',
        requiredAction: 'Planning team to reconcile current household references with identified sites.',
        authority: 'Municipal shelter planning record',
        documentRef: 'MPDO-LSP-2024-2032',
        linkedMapIds: ['map-tal-clup-2026'],
    },
    {
        id: 'plan-local-nutrition-2026-2028',
        code: 'LNAP 2026–2028',
        title: 'Local Nutrition Action Plan',
        horizon: 'Three-year',
        leadOffice: 'Municipal Health Office',
        coordinatingOffices: ['Municipal Social Welfare and Development Office', 'Municipal Agriculture Office', 'Municipal Planning and Development Office'],
        coverageStart: 2026,
        coverageEnd: 2028,
        status: 'In force',
        sectionsComplete: 9,
        sectionsTotal: 9,
        lastAction: 'Program coverage notes updated from second-quarter reports',
        lastActionDate: '2026-08-22',
        nextMilestone: 'Third-quarter nutrition program review',
        nextMilestoneDate: '2026-10-08',
        requiredAction: 'Program leads to submit current coverage and referral notes before review.',
        authority: 'Municipal nutrition planning record',
        documentRef: 'MHO-LNAP-2026-2028',
        sbResolutionNo: 'SB Res. No. 2025-128',
        sbAdoptedDate: '2025-12-09',
        linkedMapIds: ['map-tal-base-2026'],
    },
    {
        id: 'plan-tourism-2024-2028',
        code: 'Tourism 2024–2028',
        title: 'Local Tourism Development Plan',
        horizon: 'Six-year',
        leadOffice: 'Municipal Tourism Office',
        coordinatingOffices: ['Municipal Planning and Development Office', 'Municipal Environment and Natural Resources Office', 'Business Permits and Licensing Office'],
        coverageStart: 2024,
        coverageEnd: 2028,
        status: 'Due this year',
        sectionsComplete: 9,
        sectionsTotal: 11,
        lastAction: 'Destination and enterprise inventory reviewed',
        lastActionDate: '2026-09-03',
        nextMilestone: 'Mid-cycle program update',
        nextMilestoneDate: '2026-11-17',
        requiredAction: 'Tourism and planning teams to complete program adjustments for the next implementation year.',
        authority: 'Municipal tourism development planning record',
        documentRef: 'MTO-LTDP-2024-2028',
        linkedMapIds: ['map-tal-coast-2026'],
    },
];

export const planStatuses: Array<'All' | PlanStatus> = [
    'All',
    'Draft',
    'In force',
    'For review',
    'Updating',
    'Adopted',
    'Due this year',
    'Archived',
];
export const planHorizons: Array<'All' | PlanHorizon> = ['All', 'Annual', 'Three-year', 'Six-year', 'Long-term', 'Sectoral'];

export function getPlanMetrics(plans: MunicipalPlan[]) {
    return {
        total: plans.length,
        inForce: plans.filter((plan) => plan.status === 'In force' || plan.status === 'Adopted').length,
        underReview: plans.filter((plan) => plan.status === 'For review' || plan.status === 'Updating' || plan.status === 'Draft').length,
        milestonesThisYear: plans.filter((plan) => plan.nextMilestoneDate.startsWith('2026-')).length,
    };
}

const PLANS_STORAGE_KEY = 'ot.planningPlans.v1';

const LEGACY_MAP_ID_ALIASES: Record<string, string> = {
    'map-talibon-base-2026': 'map-tal-base-2026',
    'map-talibon-clup-zoning': 'map-tal-clup-2026',
    'map-talibon-drrm-hazard': 'map-tal-drrm-2026',
    'map-talibon-coastal-islands': 'map-tal-coast-2026',
    'map-talibon-infra-roads': 'map-tal-infra-2026',
};

export function loadMunicipalPlans(): MunicipalPlan[] {
    if (typeof window === 'undefined') return municipalPlans;
    try {
        const raw = window.localStorage.getItem(PLANS_STORAGE_KEY);
        if (!raw) return municipalPlans;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
            return (parsed as MunicipalPlan[]).map((plan) => ({
                ...plan,
                linkedMapIds: plan.linkedMapIds?.map((id) => LEGACY_MAP_ID_ALIASES[id] ?? id),
            }));
        }
    } catch {
        // Fallback cleanly to deterministic seed
    }
    return municipalPlans;
}

export function saveMunicipalPlans(plans: MunicipalPlan[]): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
    } catch {
        // Ignore storage limits cleanly
    }
}
