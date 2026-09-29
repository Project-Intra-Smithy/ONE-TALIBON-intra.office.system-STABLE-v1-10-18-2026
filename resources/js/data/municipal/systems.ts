export type FutureIntegrationStatus = 'Planned' | 'Not Enabled';

export type MunicipalSystem = {
    id: string;
    name: string;
    group: string;
    owningOffice: string;
    status: FutureIntegrationStatus;
    presentationState: 'Future Integration';
    purpose: string;
    recordScope: string;
    integrationNote: string;
};

export type InitialRolloutState =
    | 'Current / Working'
    | 'Future Integration'
    | 'Current Personnel Reference';

export type InitialRolloutItem = {
    id: string;
    name: string;
    state: InitialRolloutState;
    description: string;
};

export type CorePlatformState =
    | 'Current'
    | 'Current Foundation'
    | 'Platform Foundation'
    | 'Integration Direction';

export type CorePlatformItem = {
    name: string;
    state: CorePlatformState;
    description: string;
};

export const initialRollout: InitialRolloutItem[] = [
    {
        id: 'ROL-01',
        name: 'Document Routing & Correspondence',
        state: 'Current / Working',
        description: 'Current document, correspondence, routing, records, memorandum, and routed-work foundations.',
    },
    {
        id: 'ROL-02',
        name: 'Task / Executive Dashboard',
        state: 'Current / Working',
        description: 'Current dashboard and task visibility remain in place; this presentation does not rewrite Dashboard.',
    },
    {
        id: 'ROL-03',
        name: 'Project Monitoring',
        state: 'Current / Working',
        description: 'Current planning and project-monitoring foundation for PPAs, milestones, progress, and implementation context.',
    },
    {
        id: 'ROL-04',
        name: 'Procurement / PR Tracking',
        state: 'Future Integration',
        description: 'Planned PR → PPMP/APP → RFQ → PO → delivery → inspection → payment pipeline. No procurement workflow is enabled here.',
    },
    {
        id: 'ROL-05',
        name: 'HR Employee Portal',
        state: 'Current Personnel Reference',
        description: 'Personnel directory and employee-reference foundation only; not payroll, DTR, attendance, leave, performance, or broad HRIS.',
    },
];

export const municipalSystems: MunicipalSystem[] = [
    {
        id: 'FUT-01',
        name: 'Procurement / PR Tracking',
        group: 'Major Pipeline',
        owningOffice: 'BAC / General Services',
        status: 'Planned',
        presentationState: 'Future Integration',
        purpose: 'PR → PPMP/APP → RFQ → PO → delivery → inspection → payment.',
        recordScope: 'Procurement requests, sourcing, awards, delivery, inspection, and payment handoff.',
        integrationNote: 'Static presentation only; no procurement route, records, CRUD, or workflow is enabled.',
    },
    {
        id: 'FUT-02',
        name: 'Budget & Obligation Monitoring',
        group: 'Major Pipeline',
        owningOffice: 'Municipal Budget Office',
        status: 'Not Enabled',
        presentationState: 'Future Integration',
        purpose: 'Appropriations, allotments, obligations, balances, and office utilization.',
        recordScope: 'Budget authority, utilization, obligation, and balance references.',
        integrationNote: 'Static presentation only; no budget ledger or obligation workflow is enabled.',
    },
    {
        id: 'FUT-03',
        name: 'GIS / Mapping Portal',
        group: 'Data & Mapping',
        owningOffice: 'Planning / Engineering',
        status: 'Planned',
        presentationState: 'Future Integration',
        purpose: 'Map-based municipal planning, facilities, projects, and location reference.',
        recordScope: 'Spatial layers, locations, municipal assets, projects, and planning references.',
        integrationNote: 'Static presentation only; no GIS dataset or interactive mapping backend is exposed.',
    },
    {
        id: 'FUT-04',
        name: 'Zoning & Locational Clearance System',
        group: 'Service & Regulatory',
        owningOffice: 'Zoning / MPDO',
        status: 'Planned',
        presentationState: 'Future Integration',
        purpose: 'Zoning review and locational-clearance processing direction.',
        recordScope: 'Applications, zoning references, review status, and clearance decisions.',
        integrationNote: 'Static presentation only; no clearance application or approval workflow is enabled.',
    },
    {
        id: 'FUT-05',
        name: 'Building Permit Workflow',
        group: 'Service & Regulatory',
        owningOffice: 'Municipal Engineering Office',
        status: 'Planned',
        presentationState: 'Future Integration',
        purpose: 'Permit intake, technical review, inspection coordination, and issuance direction.',
        recordScope: 'Permit applications, technical requirements, inspections, and issuance references.',
        integrationNote: 'Static presentation only; no building-permit workflow or records are enabled.',
    },
    {
        id: 'FUT-06',
        name: 'Business Permit / eBOSS Integration',
        group: 'Service & Regulatory',
        owningOffice: 'BPLO / Treasury',
        status: 'Not Enabled',
        presentationState: 'Future Integration',
        purpose: 'Business permitting and eBOSS integration direction across licensing and payment touchpoints.',
        recordScope: 'Business applications, clearances, permit status, and integration references.',
        integrationNote: 'Static presentation only; no eBOSS or business-permit processing integration is enabled.',
    },
    {
        id: 'FUT-07',
        name: 'Citizen Request / Action Center',
        group: 'Service & Regulatory',
        owningOffice: 'Mayor’s Office / Service Offices',
        status: 'Planned',
        presentationState: 'Future Integration',
        purpose: 'Coordinated intake, routing, follow-up, and resolution references for citizen requests.',
        recordScope: 'Citizen requests, office routing, action status, and resolution references.',
        integrationNote: 'Static presentation only; no public intake, ticketing, or citizen records are enabled.',
    },
    {
        id: 'FUT-08',
        name: 'GAD Data Analytics',
        group: 'Data & Mapping',
        owningOffice: 'GAD Focal Point System',
        status: 'Planned',
        presentationState: 'Future Integration',
        purpose: 'GAD planning, activity, budget, indicator, and accomplishment analysis direction.',
        recordScope: 'GAD plans, activities, budgets, indicators, and accomplishment references.',
        integrationNote: 'Static presentation only; no GAD analytics dataset or generated analytics is presented.',
    },
    {
        id: 'FUT-09',
        name: 'CBMS / Socioeconomic Dashboard',
        group: 'Data & Mapping',
        owningOffice: 'Municipal Planning and Development Office',
        status: 'Not Enabled',
        presentationState: 'Future Integration',
        purpose: 'Authorized socioeconomic and community indicator dashboard direction.',
        recordScope: 'CBMS and socioeconomic datasets subject to authorization and governance.',
        integrationNote: 'Static presentation only; no CBMS dataset, household record, or live dashboard is exposed.',
    },
    {
        id: 'FUT-10',
        name: 'Asset & Property Management',
        group: 'Assets & Logistics',
        owningOffice: 'General Services Office',
        status: 'Planned',
        presentationState: 'Future Integration',
        purpose: 'Property accountability, asset lifecycle, custody, transfer, and disposal direction.',
        recordScope: 'Assets, property cards, accountability, transfers, inspection, and disposal references.',
        integrationNote: 'Static presentation only; no asset ledger, custody transaction, or property records are enabled.',
    },
    {
        id: 'FUT-11',
        name: 'Inventory & Supplies System',
        group: 'Assets & Logistics',
        owningOffice: 'General Services Office',
        status: 'Planned',
        presentationState: 'Future Integration',
        purpose: 'Stock receipt, issuance, balance, reorder, and office supply accountability direction.',
        recordScope: 'Inventory items, receipts, issuances, balances, and office supply references.',
        integrationNote: 'Static presentation only; no stock ledger, issuance transaction, or inventory records are enabled.',
    },
    {
        id: 'FUT-12',
        name: 'Motorpool / Fleet Management',
        group: 'Assets & Logistics',
        owningOffice: 'General Services / Motorpool',
        status: 'Planned',
        presentationState: 'Future Integration',
        purpose: 'Vehicle assignment, trip, maintenance, fuel, and serviceability tracking direction.',
        recordScope: 'Vehicles, trips, maintenance, fuel, assignment, and serviceability references.',
        integrationNote: 'Static presentation only; no fleet dispatch, trip ticket, fuel, or maintenance workflow is enabled.',
    },
    {
        id: 'FUT-13',
        name: 'Accounting integration',
        group: 'Financial Integration',
        owningOffice: 'Municipal Accounting Office',
        status: 'Not Enabled',
        presentationState: 'Future Integration',
        purpose: 'Accounting handoff and integration direction for claims, entries, and financial reporting.',
        recordScope: 'Accounting references and future integration contracts.',
        integrationNote: 'Static presentation only; no accounting integration, journal, or financial record is enabled.',
    },
    {
        id: 'FUT-14',
        name: 'Treasury / Revenue integration',
        group: 'Financial Integration',
        owningOffice: 'Municipal Treasurer’s Office',
        status: 'Not Enabled',
        presentationState: 'Future Integration',
        purpose: 'Treasury, collection, payment, and local-revenue integration direction.',
        recordScope: 'Collection, payment, treasury, and revenue integration references.',
        integrationNote: 'Static presentation only; no treasury collection, payment, or revenue integration is enabled.',
    },
    {
        id: 'FUT-15',
        name: 'Training / Knowledge Management',
        group: 'People & Knowledge',
        owningOffice: 'HRMO / Municipal Offices',
        status: 'Planned',
        presentationState: 'Future Integration',
        purpose: 'Shared training, reference material, institutional knowledge, and learning-resource direction.',
        recordScope: 'Training references, learning resources, guidance, and institutional knowledge.',
        integrationNote: 'Static presentation only; no general Knowledge Management portal is claimed as current.',
    },
];

export const systemGroups = [...new Set(municipalSystems.map((item) => item.group))];

export const corePlatform: CorePlatformItem[] = [
    {
        name: 'Unified authenticated access / SSO direction',
        state: 'Current Foundation',
        description: 'Unified authenticated portal access is the current foundation; external SSO remains an integration direction.',
    },
    {
        name: 'Employee/User Directory',
        state: 'Current',
        description: 'Shared municipal user, office, and personnel-reference foundation.',
    },
    {
        name: 'Document Routing',
        state: 'Current',
        description: 'Current document and correspondence routing foundation across authorized municipal work.',
    },
    {
        name: 'Notifications',
        state: 'Current',
        description: 'Current in-platform notification foundation for authorized operational events.',
    },
    {
        name: 'Task/Workflow Engine',
        state: 'Current',
        description: 'Current task and routed-work foundation supporting municipal coordination.',
    },
    {
        name: 'Digital Approval foundation',
        state: 'Platform Foundation',
        description: 'Approval and decision evidence foundation within current authorized workflows.',
    },
    {
        name: 'Audit Trail',
        state: 'Platform Foundation',
        description: 'Audit and traceability foundation supporting accountability and protected operations.',
    },
    {
        name: 'Central File Repository',
        state: 'Platform Foundation',
        description: 'Shared file and evidence repository foundation under existing access controls.',
    },
    {
        name: 'API / Integration Layer direction',
        state: 'Integration Direction',
        description: 'Future municipal-system interoperability direction; no blanket external integration is claimed.',
    },
];

export const supportingFoundations = [
    'Councils, Boards & Committees — current Local Special Bodies reference foundation',
    'Planning Information — current Development Plans, PPAs, and Project Monitoring foundation',
    'Legal / Ordinance & Resolution Repository — current Ordinances & Issuances foundation',
    'Meeting & Task Management — current Tasks & Assignments, Calendar, and Meetings foundation',
    'Records Archive / e-Records — current Document Center and Municipal Records foundation',
    'Data Privacy & Cybersecurity — platform/security foundation, not a completed standalone module',
] as const;
