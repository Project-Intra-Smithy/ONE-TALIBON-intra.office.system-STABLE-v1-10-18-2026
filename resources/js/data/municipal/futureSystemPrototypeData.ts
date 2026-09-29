export type PrototypeArchetype = 'workflow' | 'monitoring' | 'map' | 'assets' | 'integration' | 'knowledge';

export type PrototypeMetric = {
    label: string;
    value: string;
    detail: string;
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
};

export type FutureSystemPrototypeConfig = {
    id: string;
    name: string;
    archetype: PrototypeArchetype;
    leadOffice: string;
    tabs: string[];
    filters: string[];
    metrics: PrototypeMetric[];
    lifecycle?: string[];
    records: PrototypeRecord[];
    secondaryTitle: string;
    secondaryItems: string[];
    integrationPoints: string[];
    layers?: string[];
    conservativeNote?: string;
};

export const prototypeTruth = 'Illustrative prototype data — not live municipal records';

export const prototypeBoundary = 'Interactive Concept Preview';

const procurementPrototype: FutureSystemPrototypeConfig = {
    id: 'PROCUREMENT', name: 'Procurement / PR Tracking', archetype: 'workflow', leadOffice: 'BAC / General Services',
    tabs: ['Overview', 'Purchase Requests', 'Procurement Flow', 'Delivery & Inspection'],
    filters: ['All', 'For sourcing', 'In delivery', 'For inspection'],
    metrics: [
        { label: 'Sample queue', value: '3 PRs', detail: 'Illustrative request register' },
        { label: 'For sourcing', value: '1', detail: 'Reference sourcing stage' },
        { label: 'Delivery / inspection', value: '2', detail: 'Reference downstream handoffs' },
    ],
    lifecycle: ['PR', 'PPMP / APP', 'RFQ', 'PO', 'Delivery', 'Inspection', 'Payment'],
    records: [
        { id: 'PR-2026-014', title: 'Office network equipment', subtitle: 'Information systems equipment', owner: 'Illustrative requesting office', status: 'For sourcing', stage: 'RFQ', meta: 'Illustrative amount · ₱128,000', note: 'Next handoff: sourcing reference and quotation comparison.' },
        { id: 'PR-2026-021', title: 'Road maintenance materials', subtitle: 'Engineering materials request', owner: 'Illustrative requesting office', status: 'In delivery', stage: 'Delivery', meta: 'Illustrative amount · ₱246,500', note: 'Next handoff: delivery reference before inspection.' },
        { id: 'PR-2026-027', title: 'Health office supplies', subtitle: 'Routine supply requirement', owner: 'Illustrative requesting office', status: 'For inspection', stage: 'Inspection', meta: 'Illustrative amount · ₱74,300', note: 'Next handoff: inspection reference before payment handoff.' },
    ],
    secondaryTitle: 'Related references',
    secondaryItems: ['Purchase request', 'PPMP / APP reference', 'RFQ reference', 'Purchase order', 'Delivery reference', 'Inspection reference'],
    integrationPoints: ['Document Center', 'Task / workflow foundation', 'Audit trail', 'Records repository'],
};

const futurePrototypeEntries: FutureSystemPrototypeConfig[] = [
    {
        id: 'FUT-02', name: 'Budget & Obligation Monitoring', archetype: 'monitoring', leadOffice: 'Municipal Budget Office',
        tabs: ['Overview', 'Obligations', 'Utilization', 'Reports'], filters: ['All', 'Under review', 'Committed', 'High utilization'],
        metrics: [
            { label: 'Appropriation view', value: '₱ —', detail: 'Illustrative planning surface' },
            { label: 'Obligation queue', value: '3 samples', detail: 'Concept records only' },
            { label: 'Utilization', value: 'Preview', detail: 'No live budget ledger' },
        ],
        records: [
            { id: 'BUD-01', title: 'Office operations allocation', subtitle: 'Appropriation / allotment view', owner: 'Sample Office A', status: 'Committed', stage: 'Obligation', meta: 'Reference balance only', note: 'Illustrates allotment-to-obligation visibility.', progress: 64 },
            { id: 'BUD-02', title: 'Capital outlay program', subtitle: 'Program utilization view', owner: 'Sample Office B', status: 'Under review', stage: 'Allotment', meta: 'Reference utilization only', note: 'Illustrates office/program drill-down.', progress: 42 },
            { id: 'BUD-03', title: 'Service delivery program', subtitle: 'Office utilization view', owner: 'Sample Office C', status: 'High utilization', stage: 'Balance', meta: 'Reference balance only', note: 'Illustrates remaining-balance attention.', progress: 86 },
        ],
        secondaryTitle: 'Budget lenses', secondaryItems: ['Appropriations', 'Allotments', 'Obligations', 'Balances', 'Office utilization'],
        integrationPoints: ['Tasks / approvals', 'Document references', 'Procurement handoff direction', 'Audit context'],
    },
    {
        id: 'FUT-03', name: 'GIS / Mapping Portal', archetype: 'map', leadOffice: 'Planning / Engineering',
        tabs: ['Map', 'Layers', 'Locations'], filters: ['All', 'Projects', 'Facilities', 'Hazards'],
        metrics: [
            { label: 'Map mode', value: '7 layers', detail: 'CSS concept canvas' },
            { label: 'Selected layer', value: 'Projects', detail: 'Client-side switching' },
            { label: 'External map API', value: 'None', detail: 'No live coordinates' },
        ],
        layers: ['Projects', 'Roads', 'Zoning', 'Government properties', 'Facilities', 'Hazards', 'Businesses'],
        records: [
            { id: 'MAP-01', title: 'Road improvement project', subtitle: 'Illustrative project marker', owner: 'Planning / Engineering', status: 'Projects', stage: 'Project layer', meta: 'Zone A · no real coordinates', note: 'Selected-location panel for project context.' },
            { id: 'MAP-02', title: 'Municipal facility reference', subtitle: 'Illustrative facility marker', owner: 'Sample municipal office', status: 'Facilities', stage: 'Facility layer', meta: 'Zone B · no real coordinates', note: 'Selected-location panel for facility context.' },
            { id: 'MAP-03', title: 'Hazard reference area', subtitle: 'Illustrative hazard marker', owner: 'Planning / DRRM reference', status: 'Hazards', stage: 'Hazard layer', meta: 'Zone C · no real coordinates', note: 'Selected-location panel for planning context.' },
        ],
        secondaryTitle: 'Layer legend', secondaryItems: ['Projects', 'Roads', 'Zoning', 'Properties', 'Facilities', 'Hazards', 'Businesses'],
        integrationPoints: ['Project Monitoring', 'Development Plans', 'Zoning direction', 'Asset / facility references'],
    },
    {
        id: 'FUT-04', name: 'Zoning & Locational Clearance System', archetype: 'workflow', leadOffice: 'Zoning / MPDO',
        tabs: ['Applications', 'Evaluation', 'GIS Validation', 'Clearances'], filters: ['All', 'For evaluation', 'For inspection', 'For clearance'],
        metrics: [
            { label: 'Sample applications', value: '3', detail: 'Illustrative queue' },
            { label: 'For evaluation', value: '1', detail: 'Concept workload' },
            { label: 'For clearance', value: '1', detail: 'Concept handoff' },
        ],
        lifecycle: ['Application', 'Evaluation', 'GIS validation', 'Inspection', 'Clearance', 'Certificate'],
        records: [
            { id: 'ZON-014', title: 'Commercial site clearance', subtitle: 'Illustrative application', owner: 'Sample applicant reference', status: 'For evaluation', stage: 'Evaluation', meta: 'Site reference only', note: 'Evaluation checklist and zoning context preview.' },
            { id: 'ZON-021', title: 'Residential location review', subtitle: 'Illustrative application', owner: 'Sample applicant reference', status: 'For inspection', stage: 'Inspection', meta: 'Site reference only', note: 'Inspection handoff preview.' },
            { id: 'ZON-028', title: 'Facility location clearance', subtitle: 'Illustrative application', owner: 'Sample applicant reference', status: 'For clearance', stage: 'Clearance', meta: 'Site reference only', note: 'Clearance status preview.' },
        ],
        secondaryTitle: 'Evaluation references', secondaryItems: ['Application record', 'Land-use reference', 'GIS validation', 'Inspection note', 'Clearance reference'],
        integrationPoints: ['GIS direction', 'Document Center', 'Engineering clearance direction', 'Audit trail'],
    },
    {
        id: 'FUT-05', name: 'Building Permit Workflow', archetype: 'workflow', leadOffice: 'Municipal Engineering Office',
        tabs: ['Applications', 'Clearance Matrix', 'Permit Flow'], filters: ['All', 'Engineering review', 'Cross-office clearance', 'Permit processing'],
        metrics: [
            { label: 'Sample permits', value: '3', detail: 'Illustrative applications' },
            { label: 'Clearance matrix', value: '4 lanes', detail: 'Cross-office preview' },
            { label: 'Operational permits', value: '0', detail: 'Concept only' },
        ],
        lifecycle: ['Application', 'Engineering', 'Zoning', 'Fire', 'Other clearances', 'Permit processing'],
        records: [
            { id: 'BLD-011', title: 'Two-storey residential permit', subtitle: 'Illustrative permit application', owner: 'Sample applicant reference', status: 'Engineering review', stage: 'Engineering', meta: '4 clearance lanes', note: 'Engineering review is highlighted in the sample matrix.' },
            { id: 'BLD-019', title: 'Small commercial alteration', subtitle: 'Illustrative permit application', owner: 'Sample applicant reference', status: 'Cross-office clearance', stage: 'Zoning', meta: '4 clearance lanes', note: 'Cross-office clearance statuses remain illustrative.' },
            { id: 'BLD-025', title: 'Municipal facility repair', subtitle: 'Illustrative permit application', owner: 'Sample facility reference', status: 'Permit processing', stage: 'Permit processing', meta: '4 clearance lanes', note: 'Final permit processing is presentation-only.' },
        ],
        secondaryTitle: 'Clearance matrix', secondaryItems: ['Engineering', 'Zoning', 'Fire', 'Other departmental clearance'],
        integrationPoints: ['Zoning direction', 'Document Center', 'Task routing', 'Audit trail'],
    },
    {
        id: 'FUT-06', name: 'Business Permit / eBOSS Integration', archetype: 'workflow', leadOffice: 'BPLO / Treasury',
        tabs: ['Applications', 'Assessment', 'Clearances', 'Renewals'], filters: ['All', 'Assessment', 'Clearances', 'Renewal'],
        metrics: [
            { label: 'Sample applications', value: '3', detail: 'Illustrative queue' },
            { label: 'Clearance view', value: 'Preview', detail: 'No live eBOSS link' },
            { label: 'Renewal view', value: 'Preview', detail: 'No permit processing' },
        ],
        lifecycle: ['Application', 'Assessment', 'Clearances', 'Inspection', 'Renewal'],
        records: [
            { id: 'BIZ-102', title: 'Retail renewal sample', subtitle: 'Illustrative business application', owner: 'Sample business reference', status: 'Renewal', stage: 'Renewal', meta: 'Reference only', note: 'Renewal status and office handoff preview.' },
            { id: 'BIZ-118', title: 'Service establishment sample', subtitle: 'Illustrative business application', owner: 'Sample business reference', status: 'Assessment', stage: 'Assessment', meta: 'Reference only', note: 'Assessment panel is non-operational.' },
            { id: 'BIZ-124', title: 'Food establishment sample', subtitle: 'Illustrative business application', owner: 'Sample business reference', status: 'Clearances', stage: 'Clearances', meta: 'Reference only', note: 'Clearance matrix is illustrative.' },
        ],
        secondaryTitle: 'Clearance context', secondaryItems: ['Assessment reference', 'Department clearance', 'Inspection reference', 'Renewal status'],
        integrationPoints: ['Treasury direction', 'Citizen service direction', 'Document Center', 'Audit context'],
    },
    {
        id: 'FUT-07', name: 'Citizen Request / Action Center', archetype: 'workflow', leadOffice: 'Mayor’s Office / Service Offices',
        tabs: ['Inbox', 'Routing', 'Response Time', 'History'], filters: ['All', 'New', 'Assigned', 'For response'],
        metrics: [
            { label: 'Sample concerns', value: '3', detail: 'No citizen identities' },
            { label: 'Assigned', value: '1', detail: 'Illustrative routing' },
            { label: 'Response-time view', value: 'Preview', detail: 'No live SLA claim' },
        ],
        lifecycle: ['Intake', 'Categorize', 'Refer', 'Office action', 'Response'],
        records: [
            { id: 'REQ-031', title: 'Road condition concern', subtitle: 'Illustrative concern category', owner: 'Anonymous sample reference', status: 'Assigned', stage: 'Refer', meta: 'Engineering · sample route', note: 'No real citizen identity is shown.' },
            { id: 'REQ-044', title: 'Streetlight service request', subtitle: 'Illustrative request category', owner: 'Anonymous sample reference', status: 'For response', stage: 'Office action', meta: 'Service office · sample route', note: 'Response timer is illustrative only.' },
            { id: 'REQ-051', title: 'Waste collection inquiry', subtitle: 'Illustrative inquiry category', owner: 'Anonymous sample reference', status: 'New', stage: 'Categorize', meta: 'Service office · sample route', note: 'Intake remains concept-only.' },
        ],
        secondaryTitle: 'Action history', secondaryItems: ['Received', 'Categorized', 'Office assigned', 'Action note', 'Response reference'],
        integrationPoints: ['Task routing', 'Notifications', 'Document references', 'Audit trail'],
    },
    {
        id: 'FUT-08', name: 'GAD Data Analytics', archetype: 'monitoring', leadOffice: 'GAD Focal Point System',
        tabs: ['Overview', 'GPB / GAR', 'Sectors', 'Monitoring'], filters: ['All', 'GPB', 'GAR', 'Sector data'],
        metrics: [
            { label: 'GPB / GAR', value: 'Preview', detail: 'Illustrative progress only' },
            { label: 'Sector filters', value: '3 samples', detail: 'Client-side categories' },
            { label: 'Live analytics', value: 'None', detail: 'No source dataset' },
        ],
        records: [
            { id: 'GAD-01', title: 'GPB activity set', subtitle: 'Illustrative monitoring group', owner: 'GAD focal reference', status: 'GPB', stage: 'Monitoring', meta: 'Program references', note: 'Progress is sample presentation data.', progress: 58 },
            { id: 'GAD-02', title: 'GAR accomplishment set', subtitle: 'Illustrative reporting group', owner: 'GAD focal reference', status: 'GAR', stage: 'Reporting', meta: 'Accomplishment references', note: 'No live GAR data is represented.', progress: 72 },
            { id: 'GAD-03', title: 'Sector indicator set', subtitle: 'Illustrative sector slice', owner: 'Planning reference', status: 'Sector data', stage: 'Analysis', meta: 'Disaggregated reference', note: 'No real individual-level data.', progress: 46 },
        ],
        secondaryTitle: 'Analytics dimensions', secondaryItems: ['Sex-disaggregated data', 'GPB monitoring', 'GAR monitoring', 'Sectoral statistics'],
        integrationPoints: ['Planning', 'Reports direction', 'Knowledge references', 'Audit context'],
    },
    {
        id: 'FUT-09', name: 'CBMS / Socioeconomic Dashboard', archetype: 'monitoring', leadOffice: 'Municipal Planning and Development Office',
        tabs: ['Overview', 'Barangays', 'Indicators', 'Comparison'], filters: ['All', 'Demographics', 'Poverty indicator', 'Planning indicator'],
        metrics: [
            { label: 'Barangay lens', value: 'Preview', detail: 'No household records' },
            { label: 'Indicator sets', value: '3 samples', detail: 'Planning-level only' },
            { label: 'Live CBMS data', value: 'None', detail: 'Concept surface' },
        ],
        records: [
            { id: 'CBMS-01', title: 'Population planning indicator', subtitle: 'Illustrative barangay-level comparison', owner: 'Planning reference', status: 'Demographics', stage: 'Comparison', meta: 'Aggregated concept only', note: 'No household or person-level record.', progress: 61 },
            { id: 'CBMS-02', title: 'Poverty planning indicator', subtitle: 'Illustrative planning indicator', owner: 'Planning reference', status: 'Poverty indicator', stage: 'Analysis', meta: 'Aggregated concept only', note: 'No claim of measured Talibon value.', progress: 39 },
            { id: 'CBMS-03', title: 'Service access indicator', subtitle: 'Illustrative planning indicator', owner: 'Planning reference', status: 'Planning indicator', stage: 'Planning', meta: 'Aggregated concept only', note: 'Comparison is illustrative.', progress: 53 },
        ],
        secondaryTitle: 'Planning views', secondaryItems: ['Barangay comparison', 'Indicator definition', 'Trend direction', 'Planning note'],
        integrationPoints: ['Development Plans', 'GIS direction', 'Project Monitoring', 'Reports direction'],
    },
    {
        id: 'FUT-10', name: 'Asset & Property Management', archetype: 'assets', leadOffice: 'General Services Office',
        tabs: ['Assets', 'Custody', 'Condition', 'History'], filters: ['All', 'In service', 'For maintenance', 'For verification'],
        metrics: [
            { label: 'Sample assets', value: '3', detail: 'Illustrative register' },
            { label: 'Custody view', value: 'Preview', detail: 'No accountability transaction' },
            { label: 'Live asset ledger', value: 'None', detail: 'Concept only' },
        ],
        records: [
            { id: 'AST-001', title: 'Service vehicle sample', subtitle: 'Vehicle · transport asset', owner: 'Sample Office A', status: 'In service', stage: 'Accountability', meta: 'Property tag sample', note: 'Selected asset shows custody and condition context.' },
            { id: 'AST-014', title: 'Desktop workstation sample', subtitle: 'Computer · ICT asset', owner: 'Sample Office B', status: 'For verification', stage: 'Inventory check', meta: 'Property tag sample', note: 'Inventory verification is non-operational.' },
            { id: 'AST-026', title: 'Generator set sample', subtitle: 'Equipment · facility asset', owner: 'Sample Office C', status: 'For maintenance', stage: 'Condition review', meta: 'Property tag sample', note: 'Maintenance history is illustrative.' },
        ],
        secondaryTitle: 'Asset context', secondaryItems: ['Category', 'Condition', 'Custody', 'Accountability', 'History'],
        integrationPoints: ['Inventory direction', 'Motorpool direction', 'Document references', 'Audit trail'],
    },
    {
        id: 'FUT-11', name: 'Inventory & Supplies System', archetype: 'assets', leadOffice: 'General Services Office',
        tabs: ['Stock', 'Requests', 'Issuance', 'Reorder'], filters: ['All', 'Healthy stock', 'Reorder', 'Request pending'],
        metrics: [
            { label: 'Sample items', value: '3', detail: 'Illustrative inventory' },
            { label: 'Reorder attention', value: '1', detail: 'Sample alert' },
            { label: 'Live stock ledger', value: 'None', detail: 'Concept only' },
        ],
        records: [
            { id: 'INV-011', title: 'Bond paper sample', subtitle: 'Office supply', owner: 'Central stock sample', status: 'Healthy stock', stage: 'Stock level', meta: 'Sample level · 68%', note: 'Stock level is illustrative.', progress: 68 },
            { id: 'INV-023', title: 'Printer toner sample', subtitle: 'ICT consumable', owner: 'Central stock sample', status: 'Reorder', stage: 'Reorder alert', meta: 'Sample level · 18%', note: 'Reorder alert does not create an actual request.', progress: 18 },
            { id: 'INV-037', title: 'Cleaning supplies sample', subtitle: 'Facility supply', owner: 'Central stock sample', status: 'Request pending', stage: 'Stock request', meta: 'Sample level · 44%', note: 'Request status is client-side sample data.', progress: 44 },
        ],
        secondaryTitle: 'Stock controls', secondaryItems: ['Stock level', 'Request status', 'Issuance reference', 'Reorder indicator'],
        integrationPoints: ['Procurement direction', 'Asset direction', 'Document references', 'Audit context'],
    },
    {
        id: 'FUT-12', name: 'Motorpool / Fleet Management', archetype: 'assets', leadOffice: 'General Services / Motorpool',
        tabs: ['Fleet', 'Schedule', 'Trip Tickets', 'Maintenance'], filters: ['All', 'Available', 'On trip', 'Maintenance'],
        metrics: [
            { label: 'Sample vehicles', value: '3', detail: 'Illustrative fleet' },
            { label: 'Schedule view', value: 'Preview', detail: 'No dispatch action' },
            { label: 'GPS', value: 'Static only', detail: 'No location integration' },
        ],
        records: [
            { id: 'FLT-01', title: 'Utility vehicle sample', subtitle: 'General service vehicle', owner: 'Motorpool sample', status: 'Available', stage: 'Scheduling', meta: 'Fuel / maintenance indicators', note: 'Vehicle availability is illustrative.' },
            { id: 'FLT-04', title: 'Service pickup sample', subtitle: 'Field operations vehicle', owner: 'Motorpool sample', status: 'On trip', stage: 'Trip ticket', meta: 'Static location reference', note: 'No live GPS or dispatch is connected.' },
            { id: 'FLT-07', title: 'Response vehicle sample', subtitle: 'Service vehicle', owner: 'Motorpool sample', status: 'Maintenance', stage: 'Maintenance', meta: 'Service reference', note: 'Maintenance entry is illustrative.' },
        ],
        secondaryTitle: 'Fleet context', secondaryItems: ['Schedule', 'Trip ticket', 'Fuel indicator', 'Maintenance', 'Static location reference'],
        integrationPoints: ['Asset direction', 'Calendar direction', 'Document references', 'Audit context'],
    },
    {
        id: 'FUT-13', name: 'Accounting Integration', archetype: 'integration', leadOffice: 'Municipal Accounting Office',
        tabs: ['Handoffs', 'References', 'Checkpoints'], filters: ['All', 'Awaiting reference', 'Reference linked', 'For handoff'],
        metrics: [
            { label: 'Integration state', value: 'Concept', detail: 'No ledger behavior' },
            { label: 'Sample handoffs', value: '3', detail: 'Reference queue only' },
            { label: 'Posting rules', value: 'Not defined', detail: 'Authority intentionally conservative' },
        ],
        records: [
            { id: 'ACC-REF-01', title: 'Procurement reference handoff', subtitle: 'Shared-record concept', owner: 'Source module sample', status: 'For handoff', stage: 'Integration checkpoint', meta: 'Reference number sample', note: 'No journal, ledger, disbursement, or approval rule is implied.' },
            { id: 'ACC-REF-02', title: 'Payroll reference handoff', subtitle: 'Shared-record concept', owner: 'Source module sample', status: 'Awaiting reference', stage: 'Reference check', meta: 'Reference number sample', note: 'Only connection points are illustrated.' },
            { id: 'ACC-REF-03', title: 'Asset reference handoff', subtitle: 'Shared-record concept', owner: 'Source module sample', status: 'Reference linked', stage: 'Linked reference', meta: 'Reference number sample', note: 'No accounting behavior is fabricated.' },
        ],
        secondaryTitle: 'Permitted concept scope', secondaryItems: ['Source module', 'Reference number', 'Reference status', 'Integration checkpoint'],
        integrationPoints: ['Procurement reference', 'Payroll reference direction', 'Asset reference direction', 'Audit context'],
        conservativeNote: 'Accounting is shown only as a future shared-record integration surface. Journal rules, ledgers, disbursement workflows, financial statements, and approval rules are intentionally not invented.',
    },
    {
        id: 'FUT-14', name: 'Treasury / Revenue Integration', archetype: 'integration', leadOffice: 'Municipal Treasurer’s Office',
        tabs: ['Handoffs', 'Payment References', 'Checkpoints'], filters: ['All', 'Awaiting reference', 'Reference linked', 'For handoff'],
        metrics: [
            { label: 'Integration state', value: 'Concept', detail: 'No collection policy' },
            { label: 'Sample handoffs', value: '3', detail: 'Reference queue only' },
            { label: 'Receipt behavior', value: 'Not defined', detail: 'Authority intentionally conservative' },
        ],
        records: [
            { id: 'TRS-REF-01', title: 'Permit payment reference', subtitle: 'Future collection handoff', owner: 'Source module sample', status: 'For handoff', stage: 'Integration checkpoint', meta: 'Reference number sample', note: 'No tax schedule, official receipt, or collection rule is implied.' },
            { id: 'TRS-REF-02', title: 'Service fee reference', subtitle: 'Future payment handoff', owner: 'Source module sample', status: 'Awaiting reference', stage: 'Reference check', meta: 'Reference number sample', note: 'Only connection direction is illustrated.' },
            { id: 'TRS-REF-03', title: 'Revenue reference link', subtitle: 'Future shared record', owner: 'Source module sample', status: 'Reference linked', stage: 'Linked reference', meta: 'Reference number sample', note: 'No treasury approval workflow is fabricated.' },
        ],
        secondaryTitle: 'Permitted concept scope', secondaryItems: ['Source module', 'Payment / collection reference', 'Reference status', 'Integration checkpoint'],
        integrationPoints: ['Business permit direction', 'Citizen service direction', 'Accounting direction', 'Audit context'],
        conservativeNote: 'Treasury is shown only as a future reference-integration surface. Tax schedules, official-receipt behavior, collection policy, and treasury approval workflows are intentionally not invented.',
    },
    {
        id: 'FUT-15', name: 'Training / Knowledge Management', archetype: 'knowledge', leadOffice: 'HRMO / Municipal Offices',
        tabs: ['Library', 'SOPs', 'Templates', 'Onboarding'], filters: ['All', 'Manual', 'SOP', 'Template'],
        metrics: [
            { label: 'Sample resources', value: '3', detail: 'Illustrative library' },
            { label: 'Categories', value: '4', detail: 'Client-side filtering' },
            { label: 'Live repository', value: 'None', detail: 'Concept only' },
        ],
        records: [
            { id: 'KM-001', title: 'Document routing quick guide', subtitle: 'Illustrative manual', owner: 'Institutional knowledge sample', status: 'Manual', stage: 'Published reference', meta: 'Guide · sample resource', note: 'Selected resource preview only.' },
            { id: 'KM-014', title: 'Records handling SOP', subtitle: 'Illustrative SOP', owner: 'Institutional knowledge sample', status: 'SOP', stage: 'Published reference', meta: 'SOP · sample resource', note: 'No live file is exposed.' },
            { id: 'KM-022', title: 'Office turnover checklist', subtitle: 'Illustrative template', owner: 'Institutional knowledge sample', status: 'Template', stage: 'Onboarding collection', meta: 'Template · sample resource', note: 'Onboarding collection is illustrative.' },
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
    if (!prototype) {
        throw new Error(`Missing prototype configuration for ${id}`);
    }
    return prototype;
}

export { procurementPrototype };
