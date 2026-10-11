/* Synthetic, non-operational props for the isolated visual preview only. */
const office = { id: 1, code: 'SAMPLE', name: 'Sample Municipal Office', shortName: 'Sample Office' };
const otherOffice = { id: 2, code: 'EXAMPLE', name: 'Example Service Office', shortName: 'Example Office' };
const now = '2026-10-09T09:30:00+08:00';
const work = [
    { id: 1, reference: 'DEMO-WR-001', title: 'Review sample inter-office request', transactionType: 'work_request', priority: 'normal', status: 'for_review', originOffice: otherOffice, currentOffice: office, assignedEmployee: { name: 'Preview Staff', position: 'Sample position' }, receivedAt: now, dueAt: '2026-10-12T17:00:00+08:00', updatedAt: now, ageInOffice: '1 day', dueState: 'on_track', requiresAction: true, expectedAction: 'Review the request' },
    { id: 2, reference: 'DEMO-WR-002', title: 'Confirm sample supporting documents', transactionType: 'work_request', priority: 'high', status: 'in_progress', originOffice: office, currentOffice: otherOffice, assignedEmployee: null, receivedAt: now, dueAt: '2026-10-10T17:00:00+08:00', updatedAt: now, ageInOffice: '2 days', dueState: 'due_soon', requiresAction: false, expectedAction: 'Await office response' },
] as const;
const page = <T,>(data: T[]) => ({ data, total: data.length, current_page: 1, last_page: 1, per_page: 20, from: data.length ? 1 : null, to: data.length, prev_page_url: null, next_page_url: null });
const nav = { systemAdministration: true, dashboard: true, transactions: true, correspondence: true, records: true, travelOrders: true, reports: true, mayorOffice: true, memoranda: true, departments: true, audit: true };
const shared = (role: string) => ({
    appName: 'ONE TALIBON', workspaceExperience: role,
    auth: { user: { id: 1, name: 'Preview Employee', email: 'preview.invalid@example.test', role, employee: { employee_number: 'DEMO-001', position: 'Sample staff member', department: { ...office, short_name: office.shortName } } } },
    permissions: { reports: true, navigation: nav }, flash: {},
});
const metric = (label: string, value: number, link: string) => ({ label, value, link });
const sampleCorrespondence = [
    { publicId: 'demo-a', reference: 'DEMO-COR-001', sender: { name: 'Sample sender', organization: 'Example organization', source: 'external' }, subject: 'Sample request for office coordination', classification: 'internal', lifecycleState: 'received', currentOffice: office, assignedEmployee: null, workflowReference: 'DEMO-WR-001', receivedAt: now, age: '1 day', actionRequired: true, overdue: false },
    { publicId: 'demo-b', reference: 'DEMO-COR-002', sender: { name: 'Example office', source: 'internal' }, subject: 'Illustrative document routing notice', classification: 'internal', lifecycleState: 'routed', currentOffice: otherOffice, assignedEmployee: { id: 1, employeeNumber: 'DEMO-001', name: 'Preview Staff', position: 'Sample position' }, receivedAt: now, age: '2 days', actionRequired: false, overdue: false },
];

export const previewScreens = [
    { key: 'dashboard', label: 'Dashboard' }, { key: 'work', label: 'My Work' },
    { key: 'correspondence', label: 'Correspondence' }, { key: 'records', label: 'Records' },
    { key: 'memoranda', label: 'Memoranda' }, { key: 'calendar', label: 'Calendar' },
    { key: 'employees', label: 'Employees' }, { key: 'departments', label: 'Offices' },
    { key: 'login', label: 'Login' }, { key: 'mfa', label: 'MFA' },
] as const;

type Fixture = { component: string; url: string; props: Record<string, unknown> };
export function fixturePage(screen: string, role = 'employee'): Fixture {
    const roles = ['employee', 'department_head', 'executive_oversight', 'system_administration'];
    const safeRole = roles.includes(role) ? role : 'employee';
    const base = shared(safeRole);
    const recentWork = work.map((item) => ({ ...item, detailUrl: `/transactions/${item.id}` }));
    const dashboard = {
        experience: { key: safeRole, label: safeRole.replaceAll('_', ' '), department: office, scopes: { personal: true, office: true, municipal: false, system: false }, capabilities: { openOfficeWorkspace: false, viewMunicipalAggregates: false, openSystemAdministration: false }, quickActions: [
            { label: 'My Work', description: 'Review work', url: '/transactions' },
            { label: 'Correspondence', description: 'Review inbox', url: '/correspondence' },
            { label: 'Records', description: 'Search records', url: '/records' },
            { label: 'Calendar', description: 'View schedule', url: '/calendar' },
        ] },
        metricGroups: [{ key: 'personal', title: 'My work', metrics: [metric('Requires action', 2, '/transactions'), metric('Due soon', 1, '/transactions'), metric('Correspondence', 4, '/correspondence'), metric('Records', 12, '/records')] }],
        correspondenceOverview: { attention: metric('Needs action', 2, '/correspondence?view=needs_action'), status: [
            { lifecycle: 'received', label: 'Received', count: 2, link: '/correspondence?view=received' },
            { lifecycle: 'routed', label: 'Routed', count: 1, link: '/correspondence?view=routed' },
        ], recentlyReceived: [{ reference: 'DEMO-COR-001', subject: sampleCorrespondence[0].subject, sender: 'Sample sender', lifecycle: 'received', currentOffice: office, receivedAt: now, detailUrl: '/correspondence/demo-a/workspace' }], recentlyRouted: [{ reference: 'DEMO-COR-002', subject: sampleCorrespondence[1].subject, sender: 'Example office', lifecycle: 'routed', currentOffice: otherOffice, routedAt: now, detailUrl: '/correspondence/demo-b/workspace' }] },
        recentWork,
    };
    const scenarios: Record<string, Fixture> = {
        dashboard: { component: 'Dashboard', url: '/dashboard', props: dashboard },
        work: { component: 'Transactions/Index', url: '/transactions', props: {
            records: page([...work]), filters: { view: 'all', search: '', status: '', priority: '', office_id: null },
            scopeGroups: [{ key: 'personal', label: 'My queues', views: [{ key: 'all', label: 'All visible work', scope: 'personal', count: 2 }, { key: 'needs_my_action', label: 'Needs my action', scope: 'personal', count: 1 }, { key: 'due_soon', label: 'Due soon', scope: 'personal', count: 1 }] }],
            filterOptions: { statuses: ['for_review', 'in_progress'], priorities: ['normal', 'high'], offices: [office, otherOffice] },
            experience: { profile: safeRole, department: office, hasOfficeScope: true }, staffWorkload: [],
        } },
        correspondence: { component: 'Correspondence/Index', url: '/correspondence', props: {
            records: page([]), overview: { counts: { all: 8, received: 3, needs_action: 2, assigned_to_me: 1, routed: 3, archived: 1, overdue: 0 }, previews: { needs_action: [sampleCorrespondence[0]], received: [sampleCorrespondence[0]], routed: [sampleCorrespondence[1]], archived: [] } },
            filters: { view: 'overview', search: '', lifecycle: '', classification: '', office_id: '', assigned_to_me: false, action_required: false, aging: '' },
            filterOptions: { lifecycles: ['received', 'routed'], classifications: ['internal'], offices: [office, otherOffice] },
            workspace: { departmentName: office.name, departmentCode: office.code },
        } },
        records: { component: 'Records/Index', url: '/records', props: {
            records: page([{ recordType: 'transaction', reference: 'DEMO-WR-001', title: 'Sample inter-office request', source: 'work_request', originOffice: otherOffice, currentOffice: office, assignedEmployee: { name: 'Preview Staff' }, state: 'for_review', classification: 'internal', recordDate: now, updatedAt: now, detailUrl: '/transactions/1' }]),
            filters: { search: '', record_type: 'all', state: '', office_id: null, date_from: '', date_to: '' },
            filterOptions: { recordTypes: [{ value: 'transaction', label: 'Work Request' }], states: [{ value: 'for_review', label: 'For review' }], offices: [office] },
        } },
        memoranda: { component: 'Memoranda/Index', url: '/memoranda', props: {
            authority: { canPublish: true }, view: 'overview', memoranda: [{ id: 1, memo_number: 'DEMO-MEMO-001', title: 'Sample internal coordination notice', classification: 'internal', requires_acknowledgement: true, published_at: now, recipients_count: 3, issuer: { name: 'Preview Issuer' }, issuing_department: { name: office.name, short_name: office.shortName } }],
        } },
        calendar: { component: 'Calendar/Index', url: '/calendar', props: {
            events: [{ id: 1, event_key: 'demo-1', event_type: 'office_event', title: 'Sample office coordination', description: 'Illustrative calendar entry', priority: 'normal', starts_at: '2026-10-09T14:00:00+08:00', ends_at: '2026-10-09T15:00:00+08:00', all_day: false, location: 'Example room', action_url: null, status: 'scheduled', department: { code: office.code, name: office.name, short_name: office.shortName } }],
            calendar: { view: 'month', anchor_date: '2026-10-09', today: '2026-10-09', range_start: '2026-09-27T00:00:00+08:00', range_end: '2026-11-07T23:59:59+08:00', timezone: 'Asia/Manila' },
        } },
        employees: { component: 'Employees/Index', url: '/employees', props: {
            employees: page([{ id: 1, employee_number: 'DEMO-001', full_name: 'Preview Employee', work_email: 'preview.invalid@example.test', position_title: 'Sample staff member', employment_status: 'active', user_id: 1, department: { code: office.code, name: office.name, short_name: office.shortName } }]),
            departments: [{ code: office.code, name: office.name, short_name: office.shortName }], filters: { q: '', department: '' }, summary: { employees: 1, portalAccounts: 1, featuredLogins: 0, offices: 1 },
        } },
        departments: { component: 'Departments/Index', url: '/departments', props: {
            departments: [{ id: 1, code: office.code, name: office.name, short_name: office.shortName, branch: 'executive', office_type: 'administrative', is_routable: true, active_employees_count: 1, active_transactions_count: 2, is_executive: true, is_legislative: false }],
            summary: { offices: 1, executiveOffices: 1, legislativeOffices: 0, employees: 1, activeTransactions: 2 },
        } },
        login: { component: 'Auth/Login', url: '/login', props: {} },
        mfa: { component: 'Auth/MfaChallenge', url: '/security/mfa/challenge', props: {} },
    };
    const chosen = scenarios[screen] ?? scenarios.dashboard;
    return { ...chosen, props: { ...base, ...chosen.props } };
}
