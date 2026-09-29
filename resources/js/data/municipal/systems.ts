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
    | 'Main Showcase / Interactive Static Prototype'
    | 'Current Personnel Reference';

export type InitialRolloutItem = {
    id: string;
    name: string;
    state: InitialRolloutState;
    description: string;
    href?: string;
    actionLabel?: string;
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
    'Designed to plug into the shared ONE TALIBON platform foundation when implementation decisions and provider integrations are separately approved.';

const conceptOnlyBoundary =
    'Interactive concept preview only. Illustrative prototype data is not live municipal data, and no operational create, approve, issue, collect, pay, or processing action is enabled.';

function futureSystem(input: Omit<MunicipalSystem, 'presentationState' | 'conceptRecords' | 'integrationContext' | 'currentBoundary'>): MunicipalSystem {
    return {
        ...input,
        presentationState: 'Future Integration',
        conceptRecords: input.conceptItems.map((item) => `${item} reference`),
        integrationContext: sharedIntegrationContext,
        currentBoundary: conceptOnlyBoundary,
    };
}

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
        state: 'Main Showcase / Interactive Static Prototype',
        description: 'Reference-quality interactive static prototype for PR tracking from request through payment handoff.',
        href: '/procurement',
        actionLabel: 'Open Procurement Prototype',
    },
    {
        id: 'ROL-05',
        name: 'HR Employee Portal',
        state: 'Current Personnel Reference',
        description: 'Current employee and personnel-reference foundation only; broad HRIS functions are not activated here.',
        href: '/employees',
        actionLabel: 'Open HR Employee Portal',
    },
];

export const municipalSystems: MunicipalSystem[] = [
    futureSystem({
        id: 'FUT-02', name: 'Budget & Obligation Monitoring', group: 'Major Pipeline', owningOffice: 'Municipal Budget Office', status: 'Not Enabled',
        purpose: 'Future visibility over municipal budget authority, utilization, and obligation context.',
        recordScope: 'Appropriations, allotments, obligations, balances, and office-utilization references.',
        integrationNote: 'No budget ledger or obligation workflow is enabled.', conceptMode: 'scope',
        conceptItems: ['Appropriations', 'Allotments', 'Obligations', 'Balances', 'Office utilization'],
    }),
    futureSystem({
        id: 'FUT-03', name: 'GIS / Mapping Portal', group: 'Data & Mapping', owningOffice: 'Planning / Engineering', status: 'Planned',
        purpose: 'Future map-based municipal reference surface for location-aware planning and operations.',
        recordScope: 'Projects, roads, zoning, government properties, facilities, hazards, and business-location references.',
        integrationNote: 'No GIS dataset, coordinates, or external map service is exposed.', conceptMode: 'scope',
        conceptItems: ['Projects', 'Roads', 'Zoning', 'Government properties', 'Facilities', 'Hazards', 'Businesses'],
    }),
    futureSystem({
        id: 'FUT-04', name: 'Zoning & Locational Clearance System', group: 'Service & Regulatory', owningOffice: 'Zoning / MPDO', status: 'Planned',
        purpose: 'Future locational-clearance coordination from application through evaluation and certification.',
        recordScope: 'Applications, zoning evaluations, GIS validation, inspections, clearances, and certificate references.',
        integrationNote: 'No clearance application or approval workflow is enabled.', conceptMode: 'workflow',
        conceptItems: ['Applications', 'Evaluation', 'GIS validation', 'Inspections', 'Clearances', 'Certificates'],
    }),
    futureSystem({
        id: 'FUT-05', name: 'Building Permit Workflow', group: 'Service & Regulatory', owningOffice: 'Municipal Engineering Office', status: 'Planned',
        purpose: 'Future cross-office clearance presentation for building-permit processing.',
        recordScope: 'Engineering, zoning, fire, departmental-clearance, and permit-processing references.',
        integrationNote: 'No building-permit workflow or records are enabled.', conceptMode: 'workflow',
        conceptItems: ['Engineering clearance', 'Zoning clearance', 'Fire clearance', 'Other clearances', 'Permit processing'],
    }),
    futureSystem({
        id: 'FUT-06', name: 'Business Permit / eBOSS Integration', group: 'Service & Regulatory', owningOffice: 'BPLO / Treasury', status: 'Not Enabled',
        purpose: 'Future business-permitting and eBOSS integration direction across municipal processing touchpoints.',
        recordScope: 'Business application, assessment, clearance, inspection, and renewal references.',
        integrationNote: 'No eBOSS or business-permit processing integration is enabled.', conceptMode: 'workflow',
        conceptItems: ['Applications', 'Assessment', 'Clearances', 'Inspection', 'Renewal'],
    }),
    futureSystem({
        id: 'FUT-07', name: 'Citizen Request / Action Center', group: 'Service & Regulatory', owningOffice: 'Mayor’s Office / Service Offices', status: 'Planned',
        purpose: 'Future coordinated reference surface for citizen concerns and inter-office action.',
        recordScope: 'Complaint, request, referral, status, and response-time references without real citizen identity.',
        integrationNote: 'No public intake, ticketing, or citizen records are enabled.', conceptMode: 'workflow',
        conceptItems: ['Intake', 'Categorize', 'Refer', 'Office action', 'Response'],
    }),
    futureSystem({
        id: 'FUT-08', name: 'GAD Data Analytics', group: 'Data & Mapping', owningOffice: 'GAD Focal Point System', status: 'Planned',
        purpose: 'Future GAD information and analysis presentation for authorized planning use.',
        recordScope: 'Sex-disaggregated data, GPB / GAR monitoring, and sectoral-statistics references.',
        integrationNote: 'No GAD analytics dataset or generated analytics is presented.', conceptMode: 'scope',
        conceptItems: ['Sex-disaggregated data', 'GPB / GAR monitoring', 'Sectoral statistics'],
    }),
    futureSystem({
        id: 'FUT-09', name: 'CBMS / Socioeconomic Dashboard', group: 'Data & Mapping', owningOffice: 'Municipal Planning and Development Office', status: 'Not Enabled',
        purpose: 'Future planning-oriented socioeconomic reference and dashboard direction.',
        recordScope: 'Barangay demographics, poverty indicators, and planning-analytics references.',
        integrationNote: 'No CBMS household record or live dashboard is exposed.', conceptMode: 'scope',
        conceptItems: ['Barangay demographics', 'Poverty indicators', 'Planning analytics'],
    }),
    futureSystem({
        id: 'FUT-10', name: 'Asset & Property Management', group: 'Assets & Logistics', owningOffice: 'General Services Office', status: 'Planned',
        purpose: 'Future property and accountability reference surface for municipal assets.',
        recordScope: 'Vehicles, computers, furniture, buildings, equipment, and accountability references.',
        integrationNote: 'No asset ledger, custody transaction, or live property record is enabled.', conceptMode: 'scope',
        conceptItems: ['Vehicles', 'Computers', 'Furniture', 'Buildings', 'Equipment', 'Accountability'],
    }),
    futureSystem({
        id: 'FUT-11', name: 'Inventory & Supplies System', group: 'Assets & Logistics', owningOffice: 'General Services Office', status: 'Planned',
        purpose: 'Future supplies and stock-control reference surface for municipal offices.',
        recordScope: 'Stock request, issuance, inventory-level, and reorder-alert references.',
        integrationNote: 'No stock ledger, issuance transaction, or live inventory record is enabled.', conceptMode: 'scope',
        conceptItems: ['Stock requests', 'Issuance', 'Inventory levels', 'Reorder alerts'],
    }),
    futureSystem({
        id: 'FUT-12', name: 'Motorpool / Fleet Management', group: 'Assets & Logistics', owningOffice: 'General Services / Motorpool', status: 'Planned',
        purpose: 'Future fleet coordination and vehicle-operations reference surface.',
        recordScope: 'Vehicle scheduling, fuel, maintenance, trip-ticket, and GPS-reference context.',
        integrationNote: 'No fleet dispatch, trip ticket, fuel, maintenance, or GPS integration is enabled.', conceptMode: 'scope',
        conceptItems: ['Vehicle scheduling', 'Fuel', 'Maintenance', 'Trip tickets', 'GPS'],
    }),
    futureSystem({
        id: 'FUT-13', name: 'Accounting Integration', group: 'Financial Integration', owningOffice: 'Municipal Accounting Office', status: 'Not Enabled',
        purpose: 'Future accounting integration direction without asserting a detailed accounting workflow.',
        recordScope: 'Shared-record and financial-reference handoff where later approved.',
        integrationNote: 'The supplied authority names Accounting as a future plug-in but does not define ledger or approval rules.', conceptMode: 'scope',
        conceptItems: ['Shared record handoff', 'Source module', 'Reference status', 'Integration checkpoints'],
    }),
    futureSystem({
        id: 'FUT-14', name: 'Treasury / Revenue Integration', group: 'Financial Integration', owningOffice: 'Municipal Treasurer’s Office', status: 'Not Enabled',
        purpose: 'Future treasury and revenue integration direction without asserting a detailed treasury workflow.',
        recordScope: 'Future collection and payment reference handoff where later approved.',
        integrationNote: 'The supplied authority names Treasury as a future plug-in but does not define collection policy or approval rules.', conceptMode: 'scope',
        conceptItems: ['Reference handoff', 'Source module', 'Reference status', 'Integration checkpoints'],
    }),
    futureSystem({
        id: 'FUT-15', name: 'Training / Knowledge Management', group: 'People & Knowledge', owningOffice: 'HRMO / Municipal Offices', status: 'Planned',
        purpose: 'Future shared knowledge and learning reference surface for municipal continuity.',
        recordScope: 'Manual, SOP, template, video, onboarding, and institutional-knowledge references.',
        integrationNote: 'No general Knowledge Management portal is claimed as current.', conceptMode: 'scope',
        conceptItems: ['Manuals', 'SOPs', 'Templates', 'Videos', 'Onboarding', 'Institutional knowledge'],
    }),
];

export const systemGroups = [...new Set(municipalSystems.map((item) => item.group))];

export const corePlatform: CorePlatformItem[] = [
    { name: 'Unified authenticated access / SSO direction', state: 'Current Foundation', description: 'Unified authenticated portal access is the current foundation; external SSO remains an integration direction.' },
    { name: 'Employee/User Directory', state: 'Current', description: 'Shared municipal user, office, and personnel-reference foundation.' },
    { name: 'Document Routing', state: 'Current', description: 'Current document and correspondence routing foundation across authorized municipal work.' },
    { name: 'Notifications', state: 'Current', description: 'Current in-platform notification foundation for authorized operational events.' },
    { name: 'Task/Workflow Engine', state: 'Current', description: 'Current task and routed-work foundation supporting municipal coordination.' },
    { name: 'Digital Approval foundation', state: 'Platform Foundation', description: 'Approval and decision evidence foundation within current authorized workflows.' },
    { name: 'Audit Trail', state: 'Platform Foundation', description: 'Audit and traceability foundation supporting accountability and protected operations.' },
    { name: 'Central File Repository', state: 'Platform Foundation', description: 'Shared file and evidence repository foundation under existing access controls.' },
    { name: 'API / Integration Layer direction', state: 'Integration Direction', description: 'Future municipal-system interoperability direction; no blanket external integration is claimed.' },
];

export const supportingFoundations = [
    'Councils, Boards & Committees — current Local Special Bodies reference foundation',
    'Planning Information — current Development Plans, PPAs, and Project Monitoring foundation',
    'Legal / Ordinance & Resolution Repository — current Ordinances & Issuances foundation',
    'Meeting & Task Management — current Tasks & Assignments, Calendar, and Meetings foundation',
    'Records Archive / e-Records — current Document Center and Municipal Records foundation',
    'Data Privacy & Cybersecurity — platform/security foundation, not a completed standalone module',
] as const;
