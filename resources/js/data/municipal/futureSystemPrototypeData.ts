export type PrototypeArchetype = 'workflow' | 'monitoring' | 'map' | 'assets' | 'integration' | 'knowledge';
export type PrototypeMetricTone = 'emerald' | 'amber' | 'sky' | 'violet' | 'slate';
export type PrototypeTabMode = 'overview' | 'register' | 'flow' | 'delivery' | 'map' | 'cards' | 'integration';

export type PrototypeMetric = {
    label: string;
    value: string;
    detail: string;
    tone?: PrototypeMetricTone;
};

export type PrototypeRecord = {
    id: string;
    title: string;
    subtitle: string;
    owner: string;
    status: string;
    stage: string;
    meta: string;
    note: string;
    progress?: number;
    amount?: string;
    updated?: string;
    nextAction?: string;
    documents?: string[];
    history?: string[];
    deliveryStatus?: string;
    inspectionStatus?: string;
    layer?: string;
};

export type PrototypeTabView = {
    mode: PrototypeTabMode;
    title: string;
    description: string;
    recordIds?: string[];
    statuses?: string[];
    stages?: string[];
    metricLabels?: string[];
    secondaryTitle?: string;
    secondaryItems?: string[];
    showLifecycle?: boolean;
};

export type PrototypeMapLayer = {
    label: string;
    recordIds: string[];
    context: string;
};

export type FutureSystemPrototypeConfig = {
    id: string;
    name: string;
    archetype: PrototypeArchetype;
    leadOffice: string;
    contextLabel: string;
    contextValue?: string;
    description: string;
    tabs: string[];
    filters: string[];
    metrics: PrototypeMetric[];
    lifecycle?: string[];
    records: PrototypeRecord[];
    secondaryTitle: string;
    secondaryItems: string[];
    integrationPoints: string[];
    tabViews?: Record<string, PrototypeTabView>;
    mapLayers?: PrototypeMapLayer[];
    conservativeNote?: string;
};

export const presentationEnvironmentLabel = 'PRESENTATION ENVIRONMENT';
export const presentationEnvironmentDetail = 'Reference data only · Transaction actions disabled';
export const presentationEnvironmentFooter = 'This workspace is configured for presentation review. Transaction posting and approval actions are unavailable.';

const procurementDocuments = [
    'Purchase Request',
    'PPMP / APP Reference',
    'RFQ Reference',
    'Purchase Order',
    'Delivery Reference',
    'Inspection Reference',
];

const procurementPrototype: FutureSystemPrototypeConfig = {
    id: 'PROCUREMENT',
    name: 'Procurement / PR Tracking',
    archetype: 'workflow',
    leadOffice: 'BAC / General Services',
    contextLabel: 'PROCUREMENT OPERATIONS',
    contextValue: 'REQUEST LIFECYCLE',
    description: 'Purchase requests, sourcing, delivery and inspection tracking',
    tabs: ['Overview', 'Purchase Requests', 'Procurement Flow', 'Delivery & Inspection'],
    filters: ['All', 'For sourcing', 'In delivery', 'For inspection'],
    metrics: [
        { label: 'Open PRs', value: '3', detail: 'Active purchase requests', tone: 'emerald' },
        { label: 'For sourcing', value: '1', detail: 'Requests awaiting sourcing activity', tone: 'amber' },
        { label: 'For delivery', value: '1', detail: 'Purchase orders in delivery stage', tone: 'sky' },
        { label: 'For inspection', value: '1', detail: 'Deliveries awaiting inspection', tone: 'violet' },
    ],
    lifecycle: ['PR', 'PPMP / APP', 'RFQ', 'PO', 'Delivery', 'Inspection', 'Payment'],
    records: [
        {
            id: 'PR-2026-014', title: 'Office network equipment', subtitle: 'Information systems equipment', owner: 'Information Systems Unit',
            status: 'For sourcing', stage: 'RFQ', meta: '₱128,000', amount: '₱128,000', updated: 'Recently updated',
            note: 'Sourcing reference and quotation comparison are the next procurement handoff.',
            nextAction: 'Sourcing reference and quotation comparison', documents: procurementDocuments,
            history: ['PR registered', 'PPMP / APP reference linked', 'Endorsed for sourcing', 'RFQ reference prepared'],
        },
        {
            id: 'PR-2026-021', title: 'Road maintenance materials', subtitle: 'Engineering materials request', owner: 'Municipal Engineering Office',
            status: 'In delivery', stage: 'Delivery', meta: '₱246,500', amount: '₱246,500', updated: 'Recently updated',
            note: 'Delivery reference is being tracked before inspection.', nextAction: 'Record delivery reference then proceed to inspection',
            documents: procurementDocuments, history: ['PR registered', 'Sourcing completed', 'Purchase order reference linked', 'Delivery in progress'],
            deliveryStatus: 'Delivery in progress', inspectionStatus: 'Inspection pending delivery completion',
        },
        {
            id: 'PR-2026-027', title: 'Health office supplies', subtitle: 'Routine supply requirement', owner: 'Municipal Health Office',
            status: 'For inspection', stage: 'Inspection', meta: '₱74,300', amount: '₱74,300', updated: 'Recently updated',
            note: 'Delivery has been recorded and the request is awaiting inspection reference.', nextAction: 'Complete inspection reference before payment handoff',
            documents: procurementDocuments, history: ['PR registered', 'Purchase order reference linked', 'Delivery recorded', 'Inspection pending'],
            deliveryStatus: 'Delivery recorded', inspectionStatus: 'Awaiting inspection',
        },
    ],
    secondaryTitle: 'Supporting documents',
    secondaryItems: procurementDocuments,
    integrationPoints: ['Document Center', 'Task / workflow foundation', 'Audit trail', 'Records repository'],
    tabViews: {
        Overview: {
            mode: 'overview', title: 'Procurement operations overview',
            description: 'Current request movement, lifecycle position and next handoffs at a glance.', showLifecycle: true,
        },
        'Purchase Requests': {
            mode: 'register', title: 'Purchase request register',
            description: 'Search and inspect request status, requesting office, amount and current stage.', showLifecycle: false,
        },
        'Procurement Flow': {
            mode: 'flow', title: 'Procurement flow',
            description: 'Inspect request distribution across the PR-to-payment lifecycle.', showLifecycle: true,
        },
        'Delivery & Inspection': {
            mode: 'delivery', title: 'Delivery & inspection register',
            description: 'Track downstream delivery, inspection status and next handoff.',
            recordIds: ['PR-2026-021', 'PR-2026-027'], showLifecycle: false,
            secondaryTitle: 'Fulfillment references', secondaryItems: ['Purchase Order', 'Delivery Reference', 'Inspection Reference', 'Payment handoff'],
        },
    },
};

const futurePrototypeEntries: FutureSystemPrototypeConfig[] = [
    {
        id: 'FUT-02', name: 'Budget & Obligation Monitoring', archetype: 'monitoring', leadOffice: 'Municipal Budget Office',
        contextLabel: 'FUTURE INTEGRATION', description: 'Appropriation, allotment, obligation and utilization monitoring',
        tabs: ['Overview', 'Obligations', 'Utilization', 'Reports'], filters: ['All', 'Under review', 'Committed', 'High utilization'],
        metrics: [
            { label: 'Records in view', value: '3', detail: 'Budget reference sets', tone: 'emerald' },
            { label: 'Obligation focus', value: '2', detail: 'Allotment and obligation stages', tone: 'sky' },
            { label: 'Utilization attention', value: '1', detail: 'High-utilization reference', tone: 'amber' },
        ],
        records: [
            { id: 'BUD-01', title: 'Office operations allocation', subtitle: 'Appropriation and allotment view', owner: 'Administrative Services', status: 'Committed', stage: 'Obligation', meta: 'Balance reference', note: 'Shows allotment-to-obligation visibility.', progress: 64 },
            { id: 'BUD-02', title: 'Capital outlay program', subtitle: 'Program utilization view', owner: 'Capital Development', status: 'Under review', stage: 'Allotment', meta: 'Utilization reference', note: 'Shows office and program drill-down.', progress: 42 },
            { id: 'BUD-03', title: 'Service delivery program', subtitle: 'Office utilization view', owner: 'Service Delivery', status: 'High utilization', stage: 'Balance', meta: 'Balance reference', note: 'Shows remaining-balance attention.', progress: 86 },
        ],
        secondaryTitle: 'Budget lenses', secondaryItems: ['Appropriations', 'Allotments', 'Obligations', 'Balances', 'Office utilization'],
        integrationPoints: ['Tasks / approvals', 'Document references', 'Procurement handoff direction', 'Audit context'],
    },
    {
        id: 'FUT-03', name: 'GIS / Mapping Portal', archetype: 'map', leadOffice: 'Planning / Engineering',
        contextLabel: 'FUTURE INTEGRATION', description: 'Layered municipal planning and location reference workspace',
        tabs: ['Map', 'Layers', 'Locations'], filters: ['All', 'Projects', 'Roads', 'Zoning', 'Government properties', 'Facilities', 'Hazards', 'Businesses'],
        metrics: [
            { label: 'Map layers', value: '7', detail: 'Planning and operations layers', tone: 'emerald' },
            { label: 'Locations in view', value: '7', detail: 'Reference location set', tone: 'sky' },
            { label: 'Selected layer', value: 'Projects', detail: 'Use layer controls to change context', tone: 'violet' },
        ],
        mapLayers: [
            { label: 'Projects', recordIds: ['MAP-01'], context: 'Project implementation and capital-work locations.' },
            { label: 'Roads', recordIds: ['MAP-02'], context: 'Road network and maintenance reference locations.' },
            { label: 'Zoning', recordIds: ['MAP-03'], context: 'Land-use and zoning reference areas.' },
            { label: 'Government properties', recordIds: ['MAP-04'], context: 'Municipal property reference locations.' },
            { label: 'Facilities', recordIds: ['MAP-05'], context: 'Municipal facility and service-site references.' },
            { label: 'Hazards', recordIds: ['MAP-06'], context: 'Planning and DRRM hazard-reference areas.' },
            { label: 'Businesses', recordIds: ['MAP-07'], context: 'Business-location reference layer.' },
        ],
        records: [
            { id: 'MAP-01', title: 'Road improvement project', subtitle: 'Project location', owner: 'Planning / Engineering', status: 'Projects', stage: 'Project layer', meta: 'Planning zone A', note: 'Project implementation location context.', layer: 'Projects' },
            { id: 'MAP-02', title: 'Road maintenance corridor', subtitle: 'Road network reference', owner: 'Engineering', status: 'Roads', stage: 'Road layer', meta: 'Planning zone B', note: 'Road and maintenance context.', layer: 'Roads' },
            { id: 'MAP-03', title: 'Mixed-use zoning area', subtitle: 'Land-use reference', owner: 'Planning / Zoning', status: 'Zoning', stage: 'Zoning layer', meta: 'Planning zone C', note: 'Zoning and land-use context.', layer: 'Zoning' },
            { id: 'MAP-04', title: 'Municipal property reference', subtitle: 'Government property', owner: 'General Services', status: 'Government properties', stage: 'Property layer', meta: 'Planning zone D', note: 'Property reference context.', layer: 'Government properties' },
            { id: 'MAP-05', title: 'Municipal facility reference', subtitle: 'Service facility', owner: 'Municipal Office', status: 'Facilities', stage: 'Facility layer', meta: 'Planning zone E', note: 'Facility and service context.', layer: 'Facilities' },
            { id: 'MAP-06', title: 'Hazard reference area', subtitle: 'Risk-planning reference', owner: 'Planning / DRRM', status: 'Hazards', stage: 'Hazard layer', meta: 'Planning zone F', note: 'Hazard and planning context.', layer: 'Hazards' },
            { id: 'MAP-07', title: 'Business activity cluster', subtitle: 'Business location reference', owner: 'Planning / Business Services', status: 'Businesses', stage: 'Business layer', meta: 'Planning zone G', note: 'Business-location planning context.', layer: 'Businesses' },
        ],
        secondaryTitle: 'Layer context', secondaryItems: ['Projects', 'Roads', 'Zoning', 'Government properties', 'Facilities', 'Hazards', 'Businesses'],
        integrationPoints: ['Project Monitoring', 'Development Plans', 'Zoning direction', 'Asset / facility references'],
    },
    {
        id: 'FUT-04', name: 'Zoning & Locational Clearance System', archetype: 'workflow', leadOffice: 'Zoning / MPDO',
        contextLabel: 'FUTURE INTEGRATION', description: 'Application, evaluation, inspection and clearance coordination',
        tabs: ['Applications', 'Evaluation', 'GIS Validation', 'Clearances'], filters: ['All', 'For evaluation', 'For inspection', 'For clearance'],
        metrics: [
            { label: 'Applications in view', value: '3', detail: 'Clearance reference queue', tone: 'emerald' },
            { label: 'For evaluation', value: '1', detail: 'Evaluation stage', tone: 'amber' },
            { label: 'For clearance', value: '1', detail: 'Clearance stage', tone: 'violet' },
        ],
        lifecycle: ['Application', 'Evaluation', 'GIS validation', 'Inspection', 'Clearance', 'Certificate'],
        records: [
            { id: 'ZON-014', title: 'Commercial site clearance', subtitle: 'Locational application', owner: 'Applicant reference', status: 'For evaluation', stage: 'Evaluation', meta: 'Site reference A', note: 'Evaluation checklist and zoning context.' },
            { id: 'ZON-021', title: 'Residential location review', subtitle: 'Locational application', owner: 'Applicant reference', status: 'For inspection', stage: 'Inspection', meta: 'Site reference B', note: 'Inspection handoff context.' },
            { id: 'ZON-028', title: 'Facility location clearance', subtitle: 'Locational application', owner: 'Applicant reference', status: 'For clearance', stage: 'Clearance', meta: 'Site reference C', note: 'Clearance status context.' },
        ],
        secondaryTitle: 'Evaluation references', secondaryItems: ['Application record', 'Land-use reference', 'GIS validation', 'Inspection note', 'Clearance reference'],
        integrationPoints: ['GIS direction', 'Document Center', 'Engineering clearance direction', 'Audit trail'],
    },
    {
        id: 'FUT-05', name: 'Building Permit Workflow', archetype: 'workflow', leadOffice: 'Municipal Engineering Office',
        contextLabel: 'FUTURE INTEGRATION', description: 'Cross-office clearance and permit processing workspace',
        tabs: ['Applications', 'Clearance Matrix', 'Permit Flow'], filters: ['All', 'Engineering review', 'Cross-office clearance', 'Permit processing'],
        metrics: [
            { label: 'Permit cases', value: '3', detail: 'Applications in view', tone: 'emerald' },
            { label: 'Clearance lanes', value: '4', detail: 'Engineering, zoning, fire and other', tone: 'sky' },
            { label: 'Permit processing', value: '1', detail: 'Downstream case', tone: 'violet' },
        ],
        lifecycle: ['Application', 'Engineering', 'Zoning', 'Fire', 'Other clearances', 'Permit processing'],
        records: [
            { id: 'BLD-011', title: 'Two-storey residential permit', subtitle: 'Permit application', owner: 'Applicant reference', status: 'Engineering review', stage: 'Engineering', meta: '4 clearance lanes', note: 'Engineering review context.' },
            { id: 'BLD-019', title: 'Small commercial alteration', subtitle: 'Permit application', owner: 'Applicant reference', status: 'Cross-office clearance', stage: 'Zoning', meta: '4 clearance lanes', note: 'Cross-office clearance status context.' },
            { id: 'BLD-025', title: 'Municipal facility repair', subtitle: 'Permit application', owner: 'Facility reference', status: 'Permit processing', stage: 'Permit processing', meta: '4 clearance lanes', note: 'Final processing context.' },
        ],
        secondaryTitle: 'Clearance matrix', secondaryItems: ['Engineering', 'Zoning', 'Fire', 'Other departmental clearance'],
        integrationPoints: ['Zoning direction', 'Document Center', 'Task routing', 'Audit trail'],
    },
    {
        id: 'FUT-06', name: 'Business Permit / eBOSS Integration', archetype: 'workflow', leadOffice: 'BPLO / Treasury',
        contextLabel: 'FUTURE INTEGRATION', description: 'Business application, assessment, clearance and renewal coordination',
        tabs: ['Applications', 'Assessment', 'Clearances', 'Renewals'], filters: ['All', 'Assessment', 'Clearances', 'Renewal'],
        metrics: [
            { label: 'Applications in view', value: '3', detail: 'Business permit references', tone: 'emerald' },
            { label: 'For assessment', value: '1', detail: 'Assessment stage', tone: 'amber' },
            { label: 'Renewals', value: '1', detail: 'Renewal stage', tone: 'sky' },
        ],
        lifecycle: ['Application', 'Assessment', 'Clearances', 'Inspection', 'Renewal'],
        records: [
            { id: 'BIZ-102', title: 'Retail renewal', subtitle: 'Business application', owner: 'Business reference', status: 'Renewal', stage: 'Renewal', meta: 'Application reference', note: 'Renewal status and office handoff context.' },
            { id: 'BIZ-118', title: 'Service establishment', subtitle: 'Business application', owner: 'Business reference', status: 'Assessment', stage: 'Assessment', meta: 'Application reference', note: 'Assessment context.' },
            { id: 'BIZ-124', title: 'Food establishment', subtitle: 'Business application', owner: 'Business reference', status: 'Clearances', stage: 'Clearances', meta: 'Application reference', note: 'Clearance matrix context.' },
        ],
        secondaryTitle: 'Clearance context', secondaryItems: ['Assessment reference', 'Department clearance', 'Inspection reference', 'Renewal status'],
        integrationPoints: ['Treasury direction', 'Citizen service direction', 'Document Center', 'Audit context'],
    },
    {
        id: 'FUT-07', name: 'Citizen Request / Action Center', archetype: 'workflow', leadOffice: 'Mayor’s Office / Service Offices',
        contextLabel: 'FUTURE INTEGRATION', description: 'Request intake, office routing, status and response tracking',
        tabs: ['Inbox', 'Routing', 'Response Time', 'History'], filters: ['All', 'New', 'Assigned', 'For response'],
        metrics: [
            { label: 'Requests in view', value: '3', detail: 'Concern and service references', tone: 'emerald' },
            { label: 'Assigned', value: '1', detail: 'Office-routed request', tone: 'sky' },
            { label: 'For response', value: '1', detail: 'Awaiting response reference', tone: 'amber' },
        ],
        lifecycle: ['Intake', 'Categorize', 'Refer', 'Office action', 'Response'],
        records: [
            { id: 'REQ-031', title: 'Road condition concern', subtitle: 'Concern category', owner: 'Identity withheld', status: 'Assigned', stage: 'Refer', meta: 'Engineering route', note: 'Office routing and action context.' },
            { id: 'REQ-044', title: 'Streetlight service request', subtitle: 'Service category', owner: 'Identity withheld', status: 'For response', stage: 'Office action', meta: 'Service office route', note: 'Response status context.' },
            { id: 'REQ-051', title: 'Waste collection inquiry', subtitle: 'Inquiry category', owner: 'Identity withheld', status: 'New', stage: 'Categorize', meta: 'Service office route', note: 'Intake and categorization context.' },
        ],
        secondaryTitle: 'Action history', secondaryItems: ['Received', 'Categorized', 'Office assigned', 'Action note', 'Response reference'],
        integrationPoints: ['Task routing', 'Notifications', 'Document references', 'Audit trail'],
    },
    {
        id: 'FUT-08', name: 'GAD Data Analytics', archetype: 'monitoring', leadOffice: 'GAD Focal Point System',
        contextLabel: 'FUTURE INTEGRATION', description: 'GPB / GAR monitoring and sectoral planning analytics',
        tabs: ['Overview', 'GPB / GAR', 'Sectors', 'Monitoring'], filters: ['All', 'GPB', 'GAR', 'Sector data'],
        metrics: [
            { label: 'Monitoring sets', value: '3', detail: 'Program and sector references', tone: 'emerald' },
            { label: 'GPB / GAR', value: '2', detail: 'Planning and reporting sets', tone: 'sky' },
            { label: 'Sector lens', value: '1', detail: 'Disaggregated planning set', tone: 'violet' },
        ],
        records: [
            { id: 'GAD-01', title: 'GPB activity set', subtitle: 'Monitoring group', owner: 'GAD focal reference', status: 'GPB', stage: 'Monitoring', meta: 'Program references', note: 'Program progress context.', progress: 58 },
            { id: 'GAD-02', title: 'GAR accomplishment set', subtitle: 'Reporting group', owner: 'GAD focal reference', status: 'GAR', stage: 'Reporting', meta: 'Accomplishment references', note: 'Accomplishment reporting context.', progress: 72 },
            { id: 'GAD-03', title: 'Sector indicator set', subtitle: 'Sector slice', owner: 'Planning reference', status: 'Sector data', stage: 'Analysis', meta: 'Disaggregated reference', note: 'Sector analysis context.', progress: 46 },
        ],
        secondaryTitle: 'Analytics dimensions', secondaryItems: ['Sex-disaggregated data', 'GPB monitoring', 'GAR monitoring', 'Sectoral statistics'],
        integrationPoints: ['Planning', 'Reports direction', 'Knowledge references', 'Audit context'],
    },
    {
        id: 'FUT-09', name: 'CBMS / Socioeconomic Dashboard', archetype: 'monitoring', leadOffice: 'Municipal Planning and Development Office',
        contextLabel: 'FUTURE INTEGRATION', description: 'Barangay demographics, poverty indicators and planning comparison',
        tabs: ['Overview', 'Barangays', 'Indicators', 'Comparison'], filters: ['All', 'Demographics', 'Poverty indicator', 'Planning indicator'],
        metrics: [
            { label: 'Indicator sets', value: '3', detail: 'Planning-level references', tone: 'emerald' },
            { label: 'Barangay lens', value: 'Planning', detail: 'Aggregated comparison direction', tone: 'sky' },
            { label: 'Comparison view', value: 'Available', detail: 'Indicator-to-indicator inspection', tone: 'violet' },
        ],
        records: [
            { id: 'CBMS-01', title: 'Population planning indicator', subtitle: 'Barangay-level comparison', owner: 'Planning reference', status: 'Demographics', stage: 'Comparison', meta: 'Aggregated reference', note: 'Population-planning comparison context.', progress: 61 },
            { id: 'CBMS-02', title: 'Poverty planning indicator', subtitle: 'Planning indicator', owner: 'Planning reference', status: 'Poverty indicator', stage: 'Analysis', meta: 'Aggregated reference', note: 'Poverty-indicator analysis context.', progress: 39 },
            { id: 'CBMS-03', title: 'Service access indicator', subtitle: 'Planning indicator', owner: 'Planning reference', status: 'Planning indicator', stage: 'Planning', meta: 'Aggregated reference', note: 'Service-access planning context.', progress: 53 },
        ],
        secondaryTitle: 'Planning views', secondaryItems: ['Barangay comparison', 'Indicator definition', 'Trend direction', 'Planning note'],
        integrationPoints: ['Development Plans', 'GIS direction', 'Project Monitoring', 'Reports direction'],
    },
    {
        id: 'FUT-10', name: 'Asset & Property Management', archetype: 'assets', leadOffice: 'General Services Office',
        contextLabel: 'FUTURE INTEGRATION', description: 'Asset register, condition, custody and accountability reference',
        tabs: ['Assets', 'Custody', 'Condition', 'History'], filters: ['All', 'In service', 'For maintenance', 'For verification'],
        metrics: [
            { label: 'Assets in view', value: '3', detail: 'Property references', tone: 'emerald' },
            { label: 'For maintenance', value: '1', detail: 'Condition attention', tone: 'amber' },
            { label: 'For verification', value: '1', detail: 'Inventory verification', tone: 'sky' },
        ],
        records: [
            { id: 'AST-001', title: 'Service vehicle', subtitle: 'Vehicle · transport asset', owner: 'Office A', status: 'In service', stage: 'Accountability', meta: 'Property tag reference', note: 'Custody and condition context.' },
            { id: 'AST-014', title: 'Desktop workstation', subtitle: 'Computer · ICT asset', owner: 'Office B', status: 'For verification', stage: 'Inventory check', meta: 'Property tag reference', note: 'Inventory verification context.' },
            { id: 'AST-026', title: 'Generator set', subtitle: 'Equipment · facility asset', owner: 'Office C', status: 'For maintenance', stage: 'Condition review', meta: 'Property tag reference', note: 'Maintenance and condition context.' },
        ],
        secondaryTitle: 'Asset context', secondaryItems: ['Category', 'Condition', 'Custody', 'Accountability', 'History'],
        integrationPoints: ['Inventory direction', 'Motorpool direction', 'Document references', 'Audit trail'],
    },
    {
        id: 'FUT-11', name: 'Inventory & Supplies System', archetype: 'assets', leadOffice: 'General Services Office',
        contextLabel: 'FUTURE INTEGRATION', description: 'Stock levels, requests, issuance and reorder visibility',
        tabs: ['Stock', 'Requests', 'Issuance', 'Reorder'], filters: ['All', 'Healthy stock', 'Reorder', 'Request pending'],
        metrics: [
            { label: 'Items in view', value: '3', detail: 'Stock references', tone: 'emerald' },
            { label: 'Reorder attention', value: '1', detail: 'Low-stock reference', tone: 'amber' },
            { label: 'Request pending', value: '1', detail: 'Pending stock request', tone: 'sky' },
        ],
        records: [
            { id: 'INV-011', title: 'Bond paper', subtitle: 'Office supply', owner: 'Central stock', status: 'Healthy stock', stage: 'Stock level', meta: 'Level · 68%', note: 'Stock-level context.', progress: 68 },
            { id: 'INV-023', title: 'Printer toner', subtitle: 'ICT consumable', owner: 'Central stock', status: 'Reorder', stage: 'Reorder alert', meta: 'Level · 18%', note: 'Reorder-attention context.', progress: 18 },
            { id: 'INV-037', title: 'Cleaning supplies', subtitle: 'Facility supply', owner: 'Central stock', status: 'Request pending', stage: 'Stock request', meta: 'Level · 44%', note: 'Stock-request context.', progress: 44 },
        ],
        secondaryTitle: 'Stock controls', secondaryItems: ['Stock level', 'Request status', 'Issuance reference', 'Reorder indicator'],
        integrationPoints: ['Procurement direction', 'Asset direction', 'Document references', 'Audit context'],
    },
    {
        id: 'FUT-12', name: 'Motorpool / Fleet Management', archetype: 'assets', leadOffice: 'General Services / Motorpool',
        contextLabel: 'FUTURE INTEGRATION', description: 'Vehicle scheduling, trip tickets, fuel and maintenance visibility',
        tabs: ['Fleet', 'Schedule', 'Trip Tickets', 'Maintenance'], filters: ['All', 'Available', 'On trip', 'Maintenance'],
        metrics: [
            { label: 'Vehicles in view', value: '3', detail: 'Fleet references', tone: 'emerald' },
            { label: 'On trip', value: '1', detail: 'Trip-ticket reference', tone: 'sky' },
            { label: 'Maintenance', value: '1', detail: 'Service attention', tone: 'amber' },
        ],
        records: [
            { id: 'FLT-01', title: 'Utility vehicle', subtitle: 'General service vehicle', owner: 'Motorpool', status: 'Available', stage: 'Scheduling', meta: 'Fuel and maintenance context', note: 'Availability and schedule context.' },
            { id: 'FLT-04', title: 'Service pickup', subtitle: 'Field operations vehicle', owner: 'Motorpool', status: 'On trip', stage: 'Trip ticket', meta: 'Location reference', note: 'Trip-ticket and route context.' },
            { id: 'FLT-07', title: 'Response vehicle', subtitle: 'Service vehicle', owner: 'Motorpool', status: 'Maintenance', stage: 'Maintenance', meta: 'Service reference', note: 'Maintenance context.' },
        ],
        secondaryTitle: 'Fleet context', secondaryItems: ['Schedule', 'Trip ticket', 'Fuel indicator', 'Maintenance', 'Location reference'],
        integrationPoints: ['Asset direction', 'Calendar direction', 'Document references', 'Audit context'],
    },
    {
        id: 'FUT-13', name: 'Accounting Integration', archetype: 'integration', leadOffice: 'Municipal Accounting Office',
        contextLabel: 'FUTURE INTEGRATION', description: 'Shared-record handoff and reference checkpoint direction',
        tabs: ['Handoffs', 'References', 'Checkpoints'], filters: ['All', 'Awaiting reference', 'Reference linked', 'For handoff'],
        metrics: [
            { label: 'Handoffs', value: '3', detail: 'Shared-record references', tone: 'emerald' },
            { label: 'Reference linked', value: '1', detail: 'Linked checkpoint', tone: 'sky' },
            { label: 'Awaiting reference', value: '1', detail: 'Reference checkpoint', tone: 'amber' },
        ],
        records: [
            { id: 'ACC-REF-01', title: 'Procurement reference handoff', subtitle: 'Shared-record handoff', owner: 'Procurement source', status: 'For handoff', stage: 'Integration checkpoint', meta: 'Reference number', note: 'Shared-record handoff context only.' },
            { id: 'ACC-REF-02', title: 'Payroll reference handoff', subtitle: 'Shared-record handoff', owner: 'Payroll source', status: 'Awaiting reference', stage: 'Reference check', meta: 'Reference number', note: 'Connection-point context only.' },
            { id: 'ACC-REF-03', title: 'Asset reference handoff', subtitle: 'Shared-record handoff', owner: 'Asset source', status: 'Reference linked', stage: 'Linked reference', meta: 'Reference number', note: 'Linked-reference context only.' },
        ],
        secondaryTitle: 'Integration checkpoints', secondaryItems: ['Source module', 'Reference number', 'Reference status', 'Integration checkpoint'],
        integrationPoints: ['Procurement reference', 'Payroll reference direction', 'Asset reference direction', 'Audit context'],
        conservativeNote: 'Accounting remains a shared-record integration direction only. Journal rules, ledgers, disbursement workflows, financial statements and accounting approval rules are outside this presentation.',
    },
    {
        id: 'FUT-14', name: 'Treasury / Revenue Integration', archetype: 'integration', leadOffice: 'Municipal Treasurer’s Office',
        contextLabel: 'FUTURE INTEGRATION', description: 'Collection and payment reference handoff direction',
        tabs: ['Handoffs', 'Payment References', 'Checkpoints'], filters: ['All', 'Awaiting reference', 'Reference linked', 'For handoff'],
        metrics: [
            { label: 'Handoffs', value: '3', detail: 'Collection and payment references', tone: 'emerald' },
            { label: 'Reference linked', value: '1', detail: 'Linked checkpoint', tone: 'sky' },
            { label: 'Awaiting reference', value: '1', detail: 'Reference checkpoint', tone: 'amber' },
        ],
        records: [
            { id: 'TRS-REF-01', title: 'Permit payment reference', subtitle: 'Collection handoff', owner: 'Permit source', status: 'For handoff', stage: 'Integration checkpoint', meta: 'Reference number', note: 'Collection-reference handoff context only.' },
            { id: 'TRS-REF-02', title: 'Service fee reference', subtitle: 'Payment handoff', owner: 'Service source', status: 'Awaiting reference', stage: 'Reference check', meta: 'Reference number', note: 'Connection-point context only.' },
            { id: 'TRS-REF-03', title: 'Revenue reference link', subtitle: 'Shared record', owner: 'Revenue source', status: 'Reference linked', stage: 'Linked reference', meta: 'Reference number', note: 'Linked-reference context only.' },
        ],
        secondaryTitle: 'Integration checkpoints', secondaryItems: ['Source module', 'Payment / collection reference', 'Reference status', 'Integration checkpoint'],
        integrationPoints: ['Business permit direction', 'Citizen service direction', 'Accounting direction', 'Audit context'],
        conservativeNote: 'Treasury remains a reference-integration direction only. Tax schedules, official-receipt behavior, collection policy and treasury approval workflows are outside this presentation.',
    },
    {
        id: 'FUT-15', name: 'Training / Knowledge Management', archetype: 'knowledge', leadOffice: 'HRMO / Municipal Offices',
        contextLabel: 'FUTURE INTEGRATION', description: 'Manuals, SOPs, templates, onboarding and institutional knowledge',
        tabs: ['Library', 'SOPs', 'Templates', 'Onboarding'], filters: ['All', 'Manual', 'SOP', 'Template'],
        metrics: [
            { label: 'Resources in view', value: '3', detail: 'Knowledge references', tone: 'emerald' },
            { label: 'Categories', value: '3', detail: 'Manual, SOP and template', tone: 'sky' },
            { label: 'Onboarding collection', value: '1', detail: 'Turnover and onboarding reference', tone: 'violet' },
        ],
        records: [
            { id: 'KM-001', title: 'Document routing quick guide', subtitle: 'Manual', owner: 'Institutional knowledge', status: 'Manual', stage: 'Published reference', meta: 'Guide resource', note: 'Document-routing guide context.' },
            { id: 'KM-014', title: 'Records handling SOP', subtitle: 'SOP', owner: 'Institutional knowledge', status: 'SOP', stage: 'Published reference', meta: 'SOP resource', note: 'Records-handling reference context.' },
            { id: 'KM-022', title: 'Office turnover checklist', subtitle: 'Template', owner: 'Institutional knowledge', status: 'Template', stage: 'Onboarding collection', meta: 'Template resource', note: 'Onboarding and turnover context.' },
        ],
        secondaryTitle: 'Knowledge collections', secondaryItems: ['Manuals', 'SOPs', 'Templates', 'Videos', 'Onboarding', 'Institutional knowledge'],
        integrationPoints: ['Employee directory', 'Document references', 'Announcements', 'Onboarding direction'],
    },
];

export const futureSystemPrototypes = Object.fromEntries(
    futurePrototypeEntries.map((prototype) => [prototype.id, prototype]),
) as Record<string, FutureSystemPrototypeConfig>;

export function getFutureSystemPrototype(id: string): FutureSystemPrototypeConfig {
    const prototype = futureSystemPrototypes[id];
    if (!prototype) throw new Error(`Missing prototype configuration for ${id}`);
    return prototype;
}

export { procurementPrototype };
