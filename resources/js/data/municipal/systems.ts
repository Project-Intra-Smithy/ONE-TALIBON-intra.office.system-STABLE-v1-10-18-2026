export type FutureIntegrationStatus = 'Planned' | 'Not Enabled';

export type ConceptPresentationMode = 'workflow' | 'scope';

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
    conceptMode: ConceptPresentationMode;
    conceptItems: string[];
    conceptRecords: string[];
    integrationContext: string;
    currentBoundary: string;
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

const sharedIntegrationContext =
    'Designed to plug into the shared ONE TALIBON platform foundation as implementation decisions and provider integrations are approved. Shared authenticated access, directory, routing, notification, workflow, approval, audit, file, and API foundations may be reused where later authorized.';

const conceptOnlyBoundary =
    'Concept presentation only. This module is not operational, exposes no live records or transactions, and does not provide functional create, submit, approve, issue, pay, or processing actions.';

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
        purpose: 'Future procurement tracking from purchase request through payment handoff.',
        recordScope: 'Procurement requests, sourcing, awards, delivery, inspection, and payment handoff.',
        integrationNote: 'No procurement route, records, CRUD, or workflow is enabled.',
        conceptMode: 'workflow',
        conceptItems: ['PR', 'PPMP / APP', 'RFQ', 'PO', 'Delivery', 'Inspection', 'Payment'],
        conceptRecords: ['Purchase requests', 'PPMP / APP references', 'RFQ references', 'Purchase orders', 'Delivery references', 'Inspection references', 'Payment handoff references'],
        integrationContext: sharedIntegrationContext,
        currentBoundary: conceptOnlyBoundary,
    },
    {
        id: 'FUT-02',
        name: 'Budget & Obligation Monitoring',
        group: 'Major Pipeline',
        owningOffice: 'Municipal Budget Office',
        status: 'Not Enabled',
        presentationState: 'Future Integration',
        purpose: 'Future visibility over municipal budget authority, utilization, and obligation context.',
        recordScope: 'Appropriation, allotment, obligation, balance, and office-utilization references.',
        integrationNote: 'No budget ledger or obligation workflow is enabled.',
        conceptMode: 'scope',
        conceptItems: ['Appropriations', 'Allotments', 'Obligations', 'Balances', 'Office utilization'],
        conceptRecords: ['Appropriation references', 'Allotment references', 'Obligation references', 'Balance references', 'Office utilization references'],
        integrationContext: sharedIntegrationContext,
        currentBoundary: conceptOnlyBoundary,
    },
    {
        id: 'FUT-03',
        name: 'GIS / Mapping Portal',
        group: 'Data & Mapping',
        owningOffice: 'Planning / Engineering',
        status: 'Planned',
        presentationState: 'Future Integration',
        purpose: 'Future map-based municipal reference surface for location-aware planning and operations.',
        recordScope: 'Spatial and location references for projects, roads, zoning, properties, facilities, hazards, and businesses.',
        integrationNote: 'No GIS dataset or interactive mapping backend is exposed.',
        conceptMode: 'scope',
        conceptItems: ['Projects', 'Roads', 'Zoning', 'Government properties', 'Facilities', 'Hazards', 'Businesses'],
        conceptRecords: ['Project locations', 'Road references', 'Zoning layers', 'Government property references', 'Facility locations', 'Hazard references', 'Business locations'],
        integrationContext: sharedIntegrationContext,
        currentBoundary: conceptOnlyBoundary,
    },
    {
        id: 'FUT-04',
        name: 'Zoning & Locational Clearance System',
        group: 'Service & Regulatory',
        owningOffice: 'Zoning / MPDO',
        status: 'Planned',
        presentationState: 'Future Integration',
        purpose: 'Future locational-clearance coordination from application through evaluation and certification.',
        recordScope: 'Applications, zoning evaluations, GIS validation, inspections, clearances, and certificate references.',
        integrationNote: 'No clearance application or approval workflow is enabled.',
        conceptMode: 'workflow',
        conceptItems: ['Applications', 'Evaluation', 'GIS validation', 'Inspections', 'Clearances', 'Certificates'],
        conceptRecords: ['Application references', 'Evaluation references', 'GIS validation references', 'Inspection references', 'Clearance references', 'Certificate references'],
        integrationContext: sharedIntegrationContext,
        currentBoundary: conceptOnlyBoundary,
    },
    {
        id: 'FUT-05',
        name: 'Building Permit Workflow',
        group: 'Service & Regulatory',
        owningOffice: 'Municipal Engineering Office',
        status: 'Planned',
        presentationState: 'Future Integration',
        purpose: 'Future cross-office clearance presentation for building-permit processing.',
        recordScope: 'Engineering, zoning, fire, departmental-clearance, and permit-processing references.',
        integrationNote: 'No building-permit workflow or records are enabled.',
        conceptMode: 'workflow',
        conceptItems: ['Engineering clearance', 'Zoning clearance', 'Fire clearance', 'Other departmental clearances', 'Permit processing'],
        conceptRecords: ['Engineering clearance references', 'Zoning clearance references', 'Fire clearance references', 'Other departmental clearance references', 'Permit processing references'],
        integrationContext: sharedIntegrationContext,
        currentBoundary: conceptOnlyBoundary,
    },
    {
        id: 'FUT-06',
        name: 'Business Permit / eBOSS Integration',
        group: 'Service & Regulatory',
        owningOffice: 'BPLO / Treasury',
        status: 'Not Enabled',
        presentationState: 'Future Integration',
        purpose: 'Future business-permitting and eBOSS integration direction across municipal processing touchpoints.',
        recordScope: 'Business application, assessment, clearance, inspection, and renewal references.',
        integrationNote: 'No eBOSS or business-permit processing integration is enabled.',
        conceptMode: 'workflow',
        conceptItems: ['Business applications', 'Assessment', 'Clearances', 'Inspection', 'Renewal'],
        conceptRecords: ['Business application references', 'Assessment references', 'Clearance references', 'Inspection references', 'Renewal references'],
        integrationContext: sharedIntegrationContext,
        currentBoundary: conceptOnlyBoundary,
    },
    {
        id: 'FUT-07',
        name: 'Citizen Request / Action Center',
        group: 'Service & Regulatory',
        owningOffice: 'Mayor’s Office / Service Offices',
        status: 'Planned',
        presentationState: 'Future Integration',
        purpose: 'Future coordinated reference surface for citizen concerns and inter-office action.',
        recordScope: 'Complaint, request, referral, status, and response-time references.',
        integrationNote: 'No public intake, ticketing, or citizen records are enabled.',
        conceptMode: 'scope',
        conceptItems: ['Complaints', 'Requests', 'Referrals', 'Status tracking', 'Response time'],
        conceptRecords: ['Complaint references', 'Request references', 'Referral references', 'Status references', 'Response-time references'],
        integrationContext: sharedIntegrationContext,
        currentBoundary: conceptOnlyBoundary,
    },
    {
        id: 'FUT-08',
        name: 'GAD Data Analytics',
        group: 'Data & Mapping',
        owningOffice: 'GAD Focal Point System',
        status: 'Planned',
        presentationState: 'Future Integration',
        purpose: 'Future GAD information and analysis presentation for authorized planning use.',
        recordScope: 'Sex-disaggregated data, GPB / GAR monitoring, and sectoral-statistics references.',
        integrationNote: 'No GAD analytics dataset or generated analytics is presented.',
        conceptMode: 'scope',
        conceptItems: ['Sex-disaggregated data', 'GPB / GAR monitoring', 'Sectoral statistics'],
        conceptRecords: ['Sex-disaggregated data references', 'GPB references', 'GAR references', 'Sectoral statistics references'],
        integrationContext: sharedIntegrationContext,
        currentBoundary: conceptOnlyBoundary,
    },
    {
        id: 'FUT-09',
        name: 'CBMS / Socioeconomic Dashboard',
        group: 'Data & Mapping',
        owningOffice: 'Municipal Planning and Development Office',
        status: 'Not Enabled',
        presentationState: 'Future Integration',
        purpose: 'Future planning-oriented socioeconomic reference and dashboard direction.',
        recordScope: 'Barangay demographics, poverty indicators, and planning-analytics references.',
        integrationNote: 'No CBMS dataset, household record, or live dashboard is exposed.',
        conceptMode: 'scope',
        conceptItems: ['Barangay demographics', 'Poverty indicators', 'Planning analytics'],
        conceptRecords: ['Barangay demographic references', 'Poverty-indicator references', 'Planning-analysis references'],
        integrationContext: sharedIntegrationContext,
        currentBoundary: conceptOnlyBoundary,
    },
    {
        id: 'FUT-10',
        name: 'Asset & Property Management',
        group: 'Assets & Logistics',
        owningOffice: 'General Services Office',
        status: 'Planned',
        presentationState: 'Future Integration',
        purpose: 'Future property and accountability reference surface for municipal assets.',
        recordScope: 'Vehicles, computers, furniture, buildings, equipment, and accountability references.',
        integrationNote: 'No asset ledger, custody transaction, or property records are enabled.',
        conceptMode: 'scope',
        conceptItems: ['Vehicles', 'Computers', 'Furniture', 'Buildings', 'Equipment', 'Accountability'],
        conceptRecords: ['Vehicle references', 'Computer references', 'Furniture references', 'Building references', 'Equipment references', 'Accountability references'],
        integrationContext: sharedIntegrationContext,
        currentBoundary: conceptOnlyBoundary,
    },
    {
        id: 'FUT-11',
        name: 'Inventory & Supplies System',
        group: 'Assets & Logistics',
        owningOffice: 'General Services Office',
        status: 'Planned',
        presentationState: 'Future Integration',
        purpose: 'Future supplies and stock-control reference surface for municipal offices.',
        recordScope: 'Stock request, issuance, inventory-level, and reorder-alert references.',
        integrationNote: 'No stock ledger, issuance transaction, or inventory records are enabled.',
        conceptMode: 'scope',
        conceptItems: ['Stock requests', 'Issuance', 'Inventory levels', 'Reorder alerts'],
        conceptRecords: ['Stock-request references', 'Issuance references', 'Inventory-level references', 'Reorder-alert references'],
        integrationContext: sharedIntegrationContext,
        currentBoundary: conceptOnlyBoundary,
    },
    {
        id: 'FUT-12',
        name: 'Motorpool / Fleet Management',
        group: 'Assets & Logistics',
        owningOffice: 'General Services / Motorpool',
        status: 'Planned',
        presentationState: 'Future Integration',
        purpose: 'Future fleet coordination and vehicle-operations reference surface.',
        recordScope: 'Vehicle scheduling, fuel, maintenance, trip-ticket, and GPS references.',
        integrationNote: 'No fleet dispatch, trip ticket, fuel, maintenance, or GPS workflow is enabled.',
        conceptMode: 'scope',
        conceptItems: ['Vehicle scheduling', 'Fuel', 'Maintenance', 'Trip tickets', 'GPS'],
        conceptRecords: ['Vehicle scheduling references', 'Fuel references', 'Maintenance references', 'Trip-ticket references', 'GPS references'],
        integrationContext: sharedIntegrationContext,
        currentBoundary: conceptOnlyBoundary,
    },
    {
        id: 'FUT-13',
        name: 'Accounting integration',
        group: 'Financial Integration',
        owningOffice: 'Municipal Accounting Office',
        status: 'Not Enabled',
        presentationState: 'Future Integration',
        purpose: 'Future accounting integration direction without asserting a detailed accounting workflow.',
        recordScope: 'Financial and accounting reference handoff where later approved.',
        integrationNote: 'The supplied authority names Accounting as a future plug-in but does not define a full workflow.',
        conceptMode: 'scope',
        conceptItems: ['Accounting integration direction', 'Financial / accounting reference handoff', 'Shared ONE TALIBON records where later approved'],
        conceptRecords: ['Financial or accounting references only where later approved', 'Shared record references needed by an approved provider or implementation'],
        integrationContext: sharedIntegrationContext,
        currentBoundary: conceptOnlyBoundary,
    },
    {
        id: 'FUT-14',
        name: 'Treasury / Revenue integration',
        group: 'Financial Integration',
        owningOffice: 'Municipal Treasurer’s Office',
        status: 'Not Enabled',
        presentationState: 'Future Integration',
        purpose: 'Future treasury and revenue integration direction without asserting a detailed treasury workflow.',
        recordScope: 'Collection and payment reference integration where later approved.',
        integrationNote: 'The supplied authority names Treasury as a future plug-in but does not define a full workflow.',
        conceptMode: 'scope',
        conceptItems: ['Treasury / revenue integration direction', 'Collection / payment reference integration where later approved'],
        conceptRecords: ['Collection references only where later approved', 'Payment references only where later approved'],
        integrationContext: sharedIntegrationContext,
        currentBoundary: conceptOnlyBoundary,
    },
    {
        id: 'FUT-15',
        name: 'Training / Knowledge Management',
        group: 'People & Knowledge',
        owningOffice: 'HRMO / Municipal Offices',
        status: 'Planned',
        presentationState: 'Future Integration',
        purpose: 'Future shared knowledge and learning reference surface for municipal continuity.',
        recordScope: 'Manual, SOP, template, video, onboarding, and institutional-knowledge references.',
        integrationNote: 'No general Knowledge Management portal is claimed as current.',
        conceptMode: 'scope',
        conceptItems: ['Manuals', 'SOPs', 'Templates', 'Videos', 'Onboarding', 'Institutional knowledge'],
        conceptRecords: ['Manual references', 'SOP references', 'Template references', 'Video references', 'Onboarding references', 'Institutional knowledge references'],
        integrationContext: sharedIntegrationContext,
        currentBoundary: conceptOnlyBoundary,
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
