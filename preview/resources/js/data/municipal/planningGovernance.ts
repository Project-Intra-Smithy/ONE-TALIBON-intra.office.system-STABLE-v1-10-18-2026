import type { AuthUser, WorkspaceExperience } from '../../types';
import type { DesignatedPlanningStaff } from './planningMaps';

export type PlanningModule = 'plans' | 'ppas' | 'maps';

export type PlanningAttachmentCategory =
    | 'sb_resolution'
    | 'mdc_endorsement'
    | 'plan_volume'
    | 'aip_matrix'
    | 'pow_ded'
    | 'site_exhibit'
    | 'higher_concurrence'
    | 'transmittal';

export type AttachmentVisibility = 'all_lgu' | 'office_and_mpdc' | 'mpdc_executive';

export type AttachmentFormat = 'PDF' | 'XLSX' | 'CSV' | 'DOCX' | 'PNG' | 'JPG' | 'WEBP';

export type PlanningAttachment = {
    id: string;
    parentType: 'plan' | 'ppa' | 'map';
    parentId: string;
    category: PlanningAttachmentCategory;
    title: string;
    controlRef: string;
    filename: string;
    mimeType: string;
    formatLabel: AttachmentFormat;
    sizeLabel: string;
    visibility: AttachmentVisibility;
    uploadedAt: string;
    uploadedBy: string;
    officeOwner?: string;
    previewImageUrl?: string;
    previewExcerpt?: string;
    previewFields?: Array<[string, string]>;
};

export const ATTACHMENT_CATEGORY_META: Record<
    PlanningAttachmentCategory,
    { label: string; shortLabel: string; tone: 'ok' | 'info' | 'warn' | 'neutral' }
> = {
    sb_resolution: { label: 'SB Resolution / Ordinance', shortLabel: 'SB Resolution', tone: 'ok' },
    mdc_endorsement: { label: 'MDC Endorsement Resolution', shortLabel: 'MDC Endorsement', tone: 'info' },
    plan_volume: { label: 'Official Plan Volume / Annex', shortLabel: 'Plan Volume', tone: 'info' },
    aip_matrix: { label: 'AIP / LDIP Budget Matrix', shortLabel: 'AIP Matrix', tone: 'warn' },
    pow_ded: { label: 'Program of Works (POW) / DED', shortLabel: 'POW / DED', tone: 'warn' },
    site_exhibit: { label: 'Site Photo / Map Exhibit', shortLabel: 'Site Exhibit', tone: 'ok' },
    higher_concurrence: { label: 'DILG / DHSUD / SP Review', shortLabel: 'Concurrence', tone: 'ok' },
    transmittal: { label: 'Transmittal / Supporting Memo', shortLabel: 'Transmittal', tone: 'neutral' },
};

export const ATTACHMENT_VISIBILITY_META: Record<
    AttachmentVisibility,
    { label: string; shortLabel: string; description: string }
> = {
    all_lgu: {
        label: 'All LGU Staff (Published Reference)',
        shortLabel: 'All LGU Staff',
        description: 'Viewable and downloadable by every authenticated municipal office once published.',
    },
    office_and_mpdc: {
        label: 'MPDC & Implementing Office',
        shortLabel: 'MPDC & Office',
        description: 'Restricted to MPDC editors, Executive Oversight, and the assigned implementing office.',
    },
    mpdc_executive: {
        label: 'MPDC & Executive Only',
        shortLabel: 'MPDC & Executive',
        description: 'Restricted to MPDC Head, Designated MPDC Staff, Mayor/Executive, and System Admin.',
    },
};

export const ACCEPTED_ATTACHMENT_EXTENSIONS = '.pdf,.xlsx,.xls,.csv,.docx,.png,.jpg,.jpeg,.webp';

export type PlanningSuitePermissions = {
    module: PlanningModule;
    isMpdcHead: boolean;
    isDesignatedForModule: boolean;
    isSystemAdmin: boolean;
    isExecutive: boolean;
    isImplementingOfficeHead: boolean;
    actorOfficeName: string;
    canView: boolean;
    canViewDrafts: boolean;
    canCreate: boolean;
    canProposeOfficeDraft: boolean;
    canPublish: boolean;
    canArchive: boolean;
    canDelete: boolean;
    canManageStaff: boolean;
    accessLabel: string;
    accessHint: string;
    canEditRecord: (recordOffice?: string, status?: string) => boolean;
    canManageDocsFor: (recordOffice?: string) => boolean;
    canViewAttachment: (visibility: AttachmentVisibility, recordOffice?: string) => boolean;
};

export function resolvePlanningPermissions(
    module: PlanningModule,
    user: AuthUser | null,
    workspaceExperience: WorkspaceExperience | null,
    designatedStaff: DesignatedPlanningStaff[],
): PlanningSuitePermissions {
    const deptCode = (user?.employee?.department?.code || user?.employee?.department?.short_name || '').toUpperCase();
    const actorOfficeName = user?.employee?.department?.name || user?.employee?.department?.short_name || 'Municipal Office';
    const isMpdcOffice = deptCode === 'MPDO' || deptCode === 'MPDC';
    const role = (user?.role || '').toLowerCase();
    const empNo = user?.employee?.employee_number || '';
    const userName = (user?.name || '').trim().toLowerCase();

    const isSystemAdmin = role === 'system_admin' || role === 'admin' || workspaceExperience === 'system_administration';
    const isExecutive = role === 'executive' || role === 'mayor' || workspaceExperience === 'executive_oversight';
    const isDepartmentHead = role === 'department_head' || workspaceExperience === 'department_head';
    const isMpdcHead = isMpdcOffice && isDepartmentHead;
    const isImplementingOfficeHead = !isMpdcOffice && isDepartmentHead;

    const matchedStaff = designatedStaff.find(
        (member) =>
            member.active &&
            ((empNo && member.employeeNumber === empNo) || member.name.trim().toLowerCase() === userName),
    );

    const hasModuleScope = (member: DesignatedPlanningStaff | undefined): boolean => {
        if (!member || !member.active) return false;
        if (module === 'plans') return member.canManagePlans ?? true;
        if (module === 'ppas') return member.canManagePpas ?? true;
        return member.canManageMaps ?? true;
    };

    const isDesignatedForModule =
        isMpdcOffice && (role === 'mpdc_designated_staff' || hasModuleScope(matchedStaff));

    const hasFullEdit = isMpdcHead || isDesignatedForModule || isSystemAdmin;
    const canProposeOfficeDraft = module === 'ppas' && isImplementingOfficeHead;

    const normalizedOffice = (value?: string) => (value || '').trim().toLowerCase();
    const sameOffice = (recordOffice?: string) =>
        Boolean(recordOffice) && normalizedOffice(recordOffice) === normalizedOffice(actorOfficeName);

    const moduleLabel = module === 'plans' ? 'Development Plans' : module === 'ppas' ? 'PPAs' : 'Planning Maps';

    const accessLabel = isMpdcHead
        ? `MPDC Head · Full ${moduleLabel} Management & Staff Authorization`
        : isDesignatedForModule
          ? `MPDC Designated Staff · ${moduleLabel} Editor`
          : isSystemAdmin
            ? `System Administration · ${moduleLabel} Oversight`
            : canProposeOfficeDraft
              ? `${actorOfficeName} Head · Propose Office PPAs & Attach POW Docs`
              : isExecutive
                ? `Executive Oversight · All ${moduleLabel} & Review Documents`
                : `All-Staff Reference · Published ${moduleLabel} & Public Attachments`;

    const accessHint = isMpdcHead
        ? 'You can add, update, publish, archive, or remove records, attach supporting documents, and authorize MPDC editors.'
        : isDesignatedForModule
          ? 'Authorized by the MPDC Head to encode, update, attach supporting documents, publish, and archive records.'
          : isSystemAdmin
            ? 'Administrative oversight enabled for registry management and editor authorization.'
            : canProposeOfficeDraft
              ? 'You can propose Draft PPAs and attach supporting POW/DED documents for your office; MPDC reviews and publishes official AIP codes.'
              : isExecutive
                ? 'Read-only executive review across published, draft, and executive-restricted planning documents.'
                : 'Browse official published entries and preview or download attached LGU reference documents.';

    return {
        module,
        isMpdcHead,
        isDesignatedForModule,
        isSystemAdmin,
        isExecutive,
        isImplementingOfficeHead,
        actorOfficeName,
        canView: true,
        canViewDrafts: hasFullEdit || isExecutive || canProposeOfficeDraft,
        canCreate: hasFullEdit,
        canProposeOfficeDraft,
        canPublish: hasFullEdit,
        canArchive: hasFullEdit,
        canDelete: isMpdcHead || isSystemAdmin,
        canManageStaff: isMpdcHead || isSystemAdmin,
        accessLabel,
        accessHint,
        canEditRecord: (recordOffice?: string, status?: string) => {
            if (hasFullEdit) return true;
            if (canProposeOfficeDraft && sameOffice(recordOffice) && (status === 'Draft' || status === 'For MPDC Review')) {
                return true;
            }
            return false;
        },
        canManageDocsFor: (recordOffice?: string) => {
            if (hasFullEdit) return true;
            if (canProposeOfficeDraft && sameOffice(recordOffice)) return true;
            return false;
        },
        canViewAttachment: (visibility: AttachmentVisibility, recordOffice?: string) => {
            if (visibility === 'all_lgu') return true;
            if (hasFullEdit || isExecutive) return true;
            if (visibility === 'office_and_mpdc' && sameOffice(recordOffice)) return true;
            return false;
        },
    };
}

export const DEFAULT_PLANNING_ATTACHMENTS: PlanningAttachment[] = [
    // Development Plan attachments
    {
        id: 'att-cdp-sb-res',
        parentType: 'plan',
        parentId: 'plan-cdp-2023-2028',
        category: 'sb_resolution',
        title: 'SB Resolution No. 2023-084 — Adoption of Talibon CDP 2023–2028',
        controlRef: 'SB-RES-2023-084',
        filename: 'Talibon_SB_Res_2023-084_CDP_Adoption.pdf',
        mimeType: 'application/pdf',
        formatLabel: 'PDF',
        sizeLabel: '1.8 MB',
        visibility: 'all_lgu',
        uploadedAt: '2023-10-12',
        uploadedBy: 'Daniel Department Head (MPDO)',
        previewExcerpt:
            'A RESOLUTION APPROVING AND ADOPTING THE COMPREHENSIVE DEVELOPMENT PLAN (CDP) 2023–2028 OF THE MUNICIPALITY OF TALIBON, PROVINCE OF BOHOL, AS ENDORSED BY THE MUNICIPAL DEVELOPMENT COUNCIL (MDC RES. NO. 2023-011).',
        previewFields: [
            ['Legislative Body', 'Sangguniang Bayan of Talibon, Bohol'],
            ['Resolution Number', 'SB Resolution No. 2023-084'],
            ['Date Adopted', 'October 12, 2023'],
            ['MDC Endorsement', 'MDC Resolution No. 2023-011 (Sept 28, 2023)'],
            ['Effectivity', 'FY 2023 – FY 2028 (Six-Year Horizon)'],
            ['Authentication', 'Certified True Copy on file · SB Secretariat / MPDO'],
        ],
    },
    {
        id: 'att-cdp-volume',
        parentType: 'plan',
        parentId: 'plan-cdp-2023-2028',
        category: 'plan_volume',
        title: 'Talibon Comprehensive Development Plan 2023–2028 (Full Volume)',
        controlRef: 'MPDO-CDP-2023-VOL1',
        filename: 'Talibon_CDP_2023-2028_Approved_Volume.pdf',
        mimeType: 'application/pdf',
        formatLabel: 'PDF',
        sizeLabel: '14.6 MB',
        visibility: 'all_lgu',
        uploadedAt: '2023-10-18',
        uploadedBy: 'Amihan Rivera (MPDC Designated Staff)',
        previewExcerpt:
            'Consolidated five-sector municipal development plan covering Social, Economic, Infrastructure, Environment, and Institutional Governance priorities across all 25 mainland and island barangays of Talibon.',
        previewFields: [
            ['Chapters Included', '18 of 18 Sectoral & Implementation Chapters'],
            ['Lead Technical Office', 'Municipal Planning and Development Office (MPDO)'],
            ['Linked Investment Plan', 'LDIP 2026–2028 & Annual Investment Programs'],
            ['Distribution Tier', 'All Talibon LGU Offices (Official Reference)'],
        ],
    },
    {
        id: 'att-clup-zoning-ord',
        parentType: 'plan',
        parentId: 'plan-clup-2020-2029',
        category: 'sb_resolution',
        title: 'Municipal Zoning Ordinance & CLUP 2020–2029 Adoption Record',
        controlRef: 'SB-ORD-2020-012',
        filename: 'Talibon_CLUP_2020-2029_Zoning_Ordinance.pdf',
        mimeType: 'application/pdf',
        formatLabel: 'PDF',
        sizeLabel: '9.4 MB',
        visibility: 'all_lgu',
        uploadedAt: '2020-11-24',
        uploadedBy: 'Daniel Department Head (MPDO)',
        previewExcerpt:
            'Comprehensive Land Use Plan (CLUP) 2020–2029 Volume 2 Zoning Ordinance establishing residential, commercial, agricultural, coastal, and hazard overlay zones for Poblacion and all 24 rural/island barangays.',
        previewFields: [
            ['Ordinance Reference', 'Municipal Ordinance No. 2020-012'],
            ['SP Bohol Review', 'Sangguniang Panlalawigan Review Ref. 2021-048'],
            ['DHSUD Concurrence', 'Region VII PLUC Technical Review Completed'],
            ['Current Status', 'Under 2026 Parcel-Level Technical Review'],
        ],
    },
    {
        id: 'att-clup-map-plate',
        parentType: 'plan',
        parentId: 'plan-clup-2020-2029',
        category: 'site_exhibit',
        title: 'General Land Use & Zoning Reference Plate (Talibon)',
        controlRef: 'TAL-CLUP-2026',
        filename: 'Talibon_CLUP_Zoning_Plate.jpg',
        mimeType: 'image/jpeg',
        formatLabel: 'JPG',
        sizeLabel: '4.2 MB',
        visibility: 'all_lgu',
        uploadedAt: '2026-10-20',
        uploadedBy: 'Cielo Navarro (MPDC Designated Staff)',
        previewImageUrl: '/maps/talibon-clup-zoning.jpg',
        previewExcerpt: 'Cartographic land-use zoning reference plate linked to CLUP 2020–2029.',
    },
    {
        id: 'att-aip-2027-matrix',
        parentType: 'plan',
        parentId: 'plan-aip-2027',
        category: 'aip_matrix',
        title: 'FY 2027 Annual Investment Program (DILG-NEDA-DBM Working Matrix)',
        controlRef: 'MPDO-AIP-2027-XLS',
        filename: 'Talibon_AIP_2027_Consolidated_Matrix.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        formatLabel: 'XLSX',
        sizeLabel: '1.1 MB',
        visibility: 'office_and_mpdc',
        uploadedAt: '2026-09-11',
        uploadedBy: 'Bituin Santos (MPDC Designated Staff)',
        previewExcerpt:
            'Working consolidated FY 2027 Annual Investment Program spreadsheet covering General Public, Social, Economic, and Other Services sectors with PS / MOOE / CO allocations and CCA/CCM/GAD tagging.',
        previewFields: [
            ['Format Standard', 'DILG-NEDA-DBM-DOF JMC No. 1 AIP Summary Form'],
            ['Consolidated Offices', '14 Municipal Departments & Special Units'],
            ['Next Governance Gate', 'Budget Alignment Conference (Sept 21, 2026) → MDC → SB'],
            ['Access Tier', 'MPDC Editors, Executive & Submitting Offices'],
        ],
    },
    {
        id: 'att-aip-2027-mdc-draft',
        parentType: 'plan',
        parentId: 'plan-aip-2027',
        category: 'mdc_endorsement',
        title: 'Draft MDC Resolution Endorsing FY 2027 AIP to Sangguniang Bayan',
        controlRef: 'MDC-DRAFT-2026-019',
        filename: 'Talibon_MDC_Draft_Endorsement_AIP2027.pdf',
        mimeType: 'application/pdf',
        formatLabel: 'PDF',
        sizeLabel: '620 KB',
        visibility: 'mpdc_executive',
        uploadedAt: '2026-09-14',
        uploadedBy: 'Daniel Department Head (MPDO)',
        previewExcerpt:
            'Working draft endorsement resolution prepared for the Municipal Development Council full assembly prior to Sangguniang Bayan transmittal.',
        previewFields: [
            ['Draft Status', 'Pre-Assembly Technical Working Copy'],
            ['Visibility', 'MPDC & Executive Oversight Only'],
            ['Target Assembly Date', 'October 2026 MDC Full Council Meeting'],
        ],
    },
    {
        id: 'att-ela-2025-2028',
        parentType: 'plan',
        parentId: 'plan-ela-2025-2028',
        category: 'sb_resolution',
        title: 'Joint Executive-Legislative Agenda (ELA) 2025–2028 Commitment Compact',
        controlRef: 'OMM-SB-ELA-2025',
        filename: 'Talibon_ELA_2025-2028_Signed_Compact.pdf',
        mimeType: 'application/pdf',
        formatLabel: 'PDF',
        sizeLabel: '3.1 MB',
        visibility: 'all_lgu',
        uploadedAt: '2025-09-18',
        uploadedBy: 'Daniel Department Head (MPDO)',
        previewExcerpt:
            'Joint three-year Executive-Legislative priority roadmap harmonizing Mayor Office deliverables with Sangguniang Bayan legislative measures.',
        previewFields: [
            ['Signatories', 'Municipal Mayor, Vice Mayor & Sangguniang Bayan'],
            ['Term Horizon', '2025–2028 (Three-Year Term)'],
            ['Sections Completed', '11 of 11 Priority Areas'],
        ],
    },
    {
        id: 'att-ldip-2026-2028',
        parentType: 'plan',
        parentId: 'plan-ldip-2026-2028',
        category: 'aip_matrix',
        title: 'LDIP 2026–2028 Multi-Year Capital Financing & Prioritization Matrix',
        controlRef: 'MPDO-LDIP-2026-MAT',
        filename: 'Talibon_LDIP_2026-2028_Financing_Matrix.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        formatLabel: 'XLSX',
        sizeLabel: '940 KB',
        visibility: 'all_lgu',
        uploadedAt: '2026-08-31',
        uploadedBy: 'Amihan Rivera (MPDC Designated Staff)',
        previewExcerpt:
            'Three-year prioritized list of infrastructure, social, economic, and environmental projects matched against 20% Development Fund and external financing capacity.',
        previewFields: [
            ['Coverage', 'FY 2026 – FY 2028'],
            ['Lead Offices', 'MPDO, Municipal Budget Office, Engineering, Treasury'],
            ['Primary Sources', '20% Development Fund, General Fund, External Grants'],
        ],
    },
    {
        id: 'att-ldrrmp-plan',
        parentType: 'plan',
        parentId: 'plan-ldrrmp-2025-2027',
        category: 'plan_volume',
        title: 'Talibon Local DRRM Plan 2025–2027 & Multi-Hazard Atlas',
        controlRef: 'MDRRMO-LDRRMP-2025',
        filename: 'Talibon_LDRRMP_2025-2027_Approved.pdf',
        mimeType: 'application/pdf',
        formatLabel: 'PDF',
        sizeLabel: '8.7 MB',
        visibility: 'all_lgu',
        uploadedAt: '2025-02-10',
        uploadedBy: 'Daniel Department Head (MPDO)',
        previewExcerpt:
            'Four-pillar disaster prevention, preparedness, response, and rehabilitation plan funded through the statutory 5% Municipal LDRRM Fund.',
        previewFields: [
            ['Reviewing Council', 'Talibon Municipal DRRM Council'],
            ['Hazard Map Linked', 'TAL-DRRM-2026 Flood & Storm Surge Plate'],
            ['Statutory Funding', '5% Local DRRM Fund (70% Preparedness / 30% QRF)'],
        ],
    },
    // Representative PPA Supporting Documents (plus deterministic fallback attachments for other PPAs)
    {
        id: 'att-ppa-2025-001-pow',
        parentType: 'ppa',
        parentId: 'PPA-2025-001',
        category: 'pow_ded',
        title: 'Program of Works (POW) — Farm-to-Market Road Maintenance FY 2025',
        controlRef: 'MEO-POW-2025-014',
        filename: 'MEO_POW_FMR_Maintenance_2025.pdf',
        mimeType: 'application/pdf',
        formatLabel: 'PDF',
        sizeLabel: '3.4 MB',
        visibility: 'all_lgu',
        uploadedAt: '2025-02-18',
        uploadedBy: 'Amihan Rivera (MPDC Designated Staff)',
        officeOwner: 'Municipal Engineering Office',
        previewExcerpt:
            'Approved Program of Works and Detailed Unit Price Analysis (DUPA) for gravel resurfacing, shoulder trimming, and cross-drainage desilting of agricultural access roads in San Agustin, Zamora, and Sikatuna.',
        previewFields: [
            ['AIP Reference Code', '8000-000-3-2-01-001'],
            ['Implementing Office', 'Municipal Engineering Office (MEO)'],
            ['Funding Source', '20% Development Fund'],
            ['Prepared & Certified By', 'Municipal Engineer · Checked by MPDC'],
        ],
    },
    {
        id: 'att-ppa-2025-001-map',
        parentType: 'ppa',
        parentId: 'PPA-2025-001',
        category: 'site_exhibit',
        title: 'Road Network Corridor Alignment Exhibit (Talibon Base)',
        controlRef: 'TAL-INFRA-2026',
        filename: 'Talibon_FMR_Corridor_Exhibit.jpg',
        mimeType: 'image/jpeg',
        formatLabel: 'JPG',
        sizeLabel: '2.9 MB',
        visibility: 'all_lgu',
        uploadedAt: '2025-02-20',
        uploadedBy: 'Cielo Navarro (MPDC Designated Staff)',
        officeOwner: 'Municipal Engineering Office',
        previewImageUrl: '/maps/talibon-ppdo-base.jpg',
        previewExcerpt: 'Municipal road corridor alignment and covered barangay reference exhibit.',
    },
    {
        id: 'att-ppa-2026-007-pow',
        parentType: 'ppa',
        parentId: 'PPA-2026-007',
        category: 'pow_ded',
        title: 'Detailed Engineering Design & Cost Estimate — Local Road Rehabilitation',
        controlRef: 'MEO-DED-2026-022',
        filename: 'MEO_DED_Local_Road_Rehab_2026.pdf',
        mimeType: 'application/pdf',
        formatLabel: 'PDF',
        sizeLabel: '5.1 MB',
        visibility: 'office_and_mpdc',
        uploadedAt: '2026-01-25',
        uploadedBy: 'Bituin Santos (MPDC Designated Staff)',
        officeOwner: 'Municipal Engineering Office',
        previewExcerpt:
            'Detailed Engineering Design (DED), stationing cross-sections, and itemized Bill of Quantities for priority municipal and barangay road concrete paving sections.',
        previewFields: [
            ['AIP Reference Code', '8000-000-3-2-07-001'],
            ['Parent Plan', 'LDIP 2026–2028 / AIP 2026'],
            ['Access Tier', 'MPDC & Municipal Engineering Office'],
        ],
    },
    {
        id: 'att-ppa-2027-013-brief',
        parentType: 'ppa',
        parentId: 'PPA-2027-013',
        category: 'aip_matrix',
        title: 'FY 2027 AIP Project Profile & Senior Citizen Social Protection Budget Sheet',
        controlRef: 'MSWDO-AIP-2027-013',
        filename: 'MSWDO_Senior_Citizen_Support_AIP2027.pdf',
        mimeType: 'application/pdf',
        formatLabel: 'PDF',
        sizeLabel: '890 KB',
        visibility: 'all_lgu',
        uploadedAt: '2026-09-08',
        uploadedBy: 'Bituin Santos (MPDC Designated Staff)',
        officeOwner: 'Municipal Social Welfare and Development Office',
        previewExcerpt:
            'Standard DILG-DBM AIP Project Profile detailing quarterly social pension assistance coordination, medical referral support, and barangay OSCA chapter activities across all 25 Talibon barangays.',
        previewFields: [
            ['AIP Reference Code', '3000-000-3-2-13-001'],
            ['Implementing Office', 'Municipal Social Welfare and Development Office'],
            ['Statutory Basis', 'RA 9994 (Expanded Senior Citizens Act) · 1% Senior Citizens Allocation'],
            ['Target Coverage', 'All 25 Barangays (OSCA Registered Seniors)'],
        ],
    },
    {
        id: 'att-ppa-2027-013-memo',
        parentType: 'ppa',
        parentId: 'PPA-2027-013',
        category: 'transmittal',
        title: 'OSCA / MSWDO Transmittal Endorsement for FY 2027 AIP Inclusion',
        controlRef: 'MSWDO-MEMO-2026-071',
        filename: 'MSWDO_OSCA_Transmittal_2027.pdf',
        mimeType: 'application/pdf',
        formatLabel: 'PDF',
        sizeLabel: '410 KB',
        visibility: 'office_and_mpdc',
        uploadedAt: '2026-09-04',
        uploadedBy: 'Amihan Rivera (MPDC Designated Staff)',
        officeOwner: 'Municipal Social Welfare and Development Office',
        previewExcerpt:
            'Office transmittal endorsing updated beneficiary counts and quarterly welfare activity schedules for consolidation into the FY 2027 Annual Investment Program.',
        previewFields: [
            ['Submitting Office', 'MSWDO / Office of Senior Citizens Affairs'],
            ['Received By', 'Municipal Planning and Development Office (MPDO)'],
            ['Access Tier', 'MPDC & Implementing Office'],
        ],
    },
];

const ATTACHMENTS_STORAGE_KEY = 'ot.planningAttachments.v1';

export function loadPlanningAttachments(): PlanningAttachment[] {
    if (typeof window === 'undefined') return DEFAULT_PLANNING_ATTACHMENTS;
    try {
        const raw = window.localStorage.getItem(ATTACHMENTS_STORAGE_KEY);
        if (!raw) return DEFAULT_PLANNING_ATTACHMENTS;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as PlanningAttachment[];
    } catch {
        // Fallback cleanly to deterministic seed
    }
    return DEFAULT_PLANNING_ATTACHMENTS;
}

export function savePlanningAttachments(items: PlanningAttachment[]): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(ATTACHMENTS_STORAGE_KEY, JSON.stringify(items));
    } catch {
        // Ignore quota limits cleanly
    }
}

export function detectAttachmentFormat(filename: string, mimeType: string): AttachmentFormat {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf' || mimeType === 'application/pdf') return 'PDF';
    if (ext === 'xlsx' || ext === 'xls' || mimeType.includes('spreadsheet')) return 'XLSX';
    if (ext === 'csv' || mimeType === 'text/csv') return 'CSV';
    if (ext === 'docx' || ext === 'doc' || mimeType.includes('wordprocessingml')) return 'DOCX';
    if (ext === 'png' || mimeType === 'image/png') return 'PNG';
    if (ext === 'webp' || mimeType === 'image/webp') return 'WEBP';
    return 'JPG';
}

export function formatFileBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatPhpCurrency(amount: number): string {
    return `₱${new Intl.NumberFormat('en-PH', { maximumFractionDigits: 0 }).format(Math.round(amount))}`;
}

export function formatPhpCompact(amount: number): string {
    if (amount >= 1_000_000) return `₱${(amount / 1_000_000).toFixed(2)}M`;
    if (amount >= 1_000) return `₱${Math.round(amount / 1_000).toLocaleString('en-PH')}K`;
    return `₱${Math.round(amount).toLocaleString('en-PH')}`;
}
