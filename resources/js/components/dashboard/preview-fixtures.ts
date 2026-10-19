/* Synthetic C04-shaped fixtures. Imported ONLY by the development preview. */
import type { DashboardProps, DashboardExperience, DashboardWork } from './types';

export const dashboardRoles = ['employee', 'department_head', 'executive_oversight', 'system_administration'] as const;
export type DashboardRole = typeof dashboardRoles[number];
export const dashboardRoleLabels: Record<DashboardRole, string> = {
    employee: 'Employee', department_head: 'Department Head', executive_oversight: 'Executive Oversight', system_administration: 'System Administration',
};
const office = { id: 1, code: 'SAMPLE', name: 'Sample Municipal Office', shortName: 'Sample Office' };
const timestamp = '2026-10-13T09:30:00+08:00';
const work: DashboardWork = {
    reference: 'DEMO-WR-001', title: 'Review sample inter-office request', transactionType: 'work_request',
    status: 'for_review', priority: 'normal', originOffice: office, currentOffice: office,
    assignedEmployee: { name: 'Preview Employee', position: 'Sample staff member' },
    receivedAt: timestamp, dueAt: null, updatedAt: timestamp, ageInOffice: '1 day', dueState: 'on_track', detailUrl: '/transactions/1',
};
const metric = (label: string, value: number, link = '/transactions') => ({ label, value, link });
const actions: Record<DashboardRole, DashboardExperience['quickActions']> = {
    employee: [
        { label: 'Needs Action', description: 'Open active work currently assigned to you.', url: '/transactions?view=needs_my_action' },
        { label: 'Correspondence', description: 'Open correspondence available through existing authorization.', url: '/correspondence' },
        { label: 'Search Records', description: 'Search the authorized internal records repository.', url: '/records' },
    ],
    department_head: [
        { label: 'My Work', description: 'Review personal actions, deadlines, and recently updated work.', url: '/transactions?view=needs_my_action' },
        { label: 'Office Work', description: 'Review active and unassigned work for the current office.', url: '/transactions?view=office_queue' },
        { label: 'Correspondence', description: 'Open the authorized correspondence lifecycle workspace.', url: '/correspondence' },
    ],
    executive_oversight: [
        { label: "Mayor's Office", description: 'Open the authoritative executive review workspace.', url: '/mayor-office' },
        { label: 'Pending approvals', description: 'Review active work currently awaiting executive action.', url: '/transactions?status=for_approval' },
        { label: 'Operational Reports', description: 'Open the authorized Core Portal reporting workspace.', url: '/reports' },
    ],
    system_administration: [
        { label: 'System Administration', description: 'Review identities, access, MFA posture, and office digital identity.', url: '/admin' },
        { label: 'Audit & Security', description: 'Open the existing authorized security and audit workspace.', url: '/audit' },
        { label: 'MFA Security', description: 'Manage the current account multi-factor security settings.', url: '/security/mfa' },
    ],
};
export function dashboardFixture(role: DashboardRole, state = 'populated'): DashboardProps {
    const system = role === 'system_administration', head = role === 'department_head', executive = role === 'executive_oversight';
    const personal = { key: 'personal', title: 'My responsibilities', metrics: [
        metric('Requires action', 2, '/transactions?view=needs_my_action'), metric('Due soon', 1, '/transactions?view=due_soon'), metric('Completed work', 8),
    ] };
    const workload = [{ ...office, active: 6, unassigned: 1, dueSoon: 2, overdue: 1 }];
    const data: DashboardProps = {
        experience: {
            key: role, label: dashboardRoleLabels[role], department: { ...office },
            scopes: { personal: !system, office: head, municipal: executive || system, system },
            capabilities: { openOfficeWorkspace: head, viewMunicipalAggregates: executive || system, openSystemAdministration: system },
            quickActions: actions[role].map(action => ({ ...action })),
        },
        metricGroups: system ? [{ key: 'system', title: 'Identity, access, and security posture', metrics: [
            metric('Active Portal Accounts', 12, '/admin'), metric('Inactive Accounts', 1, '/admin?status=inactive'),
            metric('MFA Enrolled', 10, '/admin'), metric('Employees Without Accounts', 2, '/admin'),
            metric('Office Identities Pending', 1, '/admin'), metric('Privileged Accounts', 2, '/admin'),
        ] }] : head ? [{ key: 'office', title: 'Office accountability', metrics: [
            metric('Active office work', 6, '/transactions?view=office_queue'), metric('Unassigned work', 1, '/transactions?view=office_queue'), metric('Overdue work', 1, '/transactions?view=office_queue'),
        ] }, personal] : executive ? [{ key: 'executive', title: 'Municipal oversight', metrics: [
            metric('Active municipal work', 6), metric('Due soon', 2), metric('Overdue work', 1),
        ] }, personal] : [personal],
        recentWork: system ? [] : [{ ...work }],
        ...(!system && { correspondenceOverview: {
            attention: metric('Needs action', 2, '/correspondence?view=needs_action'),
            status: [{ lifecycle: 'received', label: 'Received', count: 2, link: '/correspondence?view=received' }, { lifecycle: 'routed', label: 'Routed', count: 1, link: '/correspondence?view=routed' }],
            recentlyReceived: [{ reference: 'DEMO-COR-001', subject: 'Sample request for office coordination', sender: 'Sample sender', lifecycle: 'received', currentOffice: office, receivedAt: timestamp, detailUrl: '/correspondence/demo-a/workspace' }],
            recentlyRouted: [{ reference: 'DEMO-COR-002', subject: 'Illustrative document routing notice', sender: 'Example office', lifecycle: 'routed', currentOffice: office, routedAt: timestamp, detailUrl: '/correspondence/demo-b/workspace' }],
        } }),
        ...(head && { officeOverview: {
            metrics: {}, staffWorkload: [{ employee: 'Preview Employee', position: 'Sample staff member', active: 4, overdue: 1, requiresAction: 2 }, { employee: 'Preview Colleague', position: null, active: 2, overdue: 0, requiresAction: 1 }],
            statusOverview: [{ status: 'for_review', count: 2 }, { status: 'in_progress', count: 4 }], oldestUnresolved: [{ ...work, dueState: 'overdue' as const }],
        } }),
        ...(executive && { executiveOverview: {
            metrics: {}, summary: { active: 6, overdue: 1 }, departmentWorkload: workload,
            oldestUnresolved: [{ ...work, dueState: 'overdue' as const }],
            recentlyCompleted: [{ ...work, reference: 'DEMO-WR-003', title: 'Completed sample coordination request', detailUrl: '/transactions/3', status: 'completed', dueState: 'completed' as const }],
        } }),
        ...(system && { systemOverview: {
            overview: { activeUsers: 12, inactiveUsers: 1, mfaEnrolled: 10, employeesWithoutPortalAccounts: 2, privilegedUsers: 2 },
            officeIdentityStatus: { configured: 3, pending: 1 },
            operations: { summary: { active: 6 }, departmentWorkload: workload },
            security: { privilegedAccounts: 2, mfaEnrolled: 10, inactiveAccounts: 1, recentEvents: [
                { actor: 'Preview Administrator', action: 'mfa_enrolled', outcome: 'success', summary: 'Sample account enrolled in multi-factor authentication.', createdAt: timestamp },
                { actor: null, action: 'login_failed', outcome: 'denied', summary: 'Sample sign-in attempt was denied.', createdAt: null },
            ] },
        } }),
    };
    if (state === 'empty') {
        data.metricGroups.forEach(group => group.metrics.forEach(metric => { metric.value = 0; }));
        data.recentWork = [];
        if (data.correspondenceOverview) Object.assign(data.correspondenceOverview, { attention: metric('Needs action', 0, '/correspondence?view=needs_action'), status: [], recentlyReceived: [], recentlyRouted: [] });
        if (data.officeOverview) Object.assign(data.officeOverview, { staffWorkload: [], statusOverview: [], oldestUnresolved: [] });
        if (data.executiveOverview) Object.assign(data.executiveOverview, { departmentWorkload: [], oldestUnresolved: [], recentlyCompleted: [] });
        if (data.systemOverview) { data.systemOverview.officeIdentityStatus = { configured: 0, pending: 0 }; data.systemOverview.security.recentEvents = []; }
    }
    if (state === 'nullable' || state === 'long') {
        for (const item of [ ...data.recentWork, ...(data.officeOverview?.oldestUnresolved ?? []), ...(data.executiveOverview?.oldestUnresolved ?? []) ]) {
            item.originOffice = null; item.currentOffice = null; item.assignedEmployee = null; item.updatedAt = null; item.dueAt = null; item.receivedAt = null; item.ageInOffice = null;
            if (state === 'long') { item.title = 'Long synthetic request for review '.repeat(12); item.reference = 'REFERENCE'.repeat(20); }
        }
        if (data.correspondenceOverview) {
            for (const item of [...data.correspondenceOverview.recentlyReceived, ...data.correspondenceOverview.recentlyRouted]) {
                item.reference = null; item.currentOffice = null; item.receivedAt = null; item.routedAt = null;
                if (state === 'long') item.subject = 'Long synthetic correspondence subject '.repeat(12);
            }
        }
        if (state === 'long') {
            data.experience.department.name = 'Sample municipal department with a long office name '.repeat(4);
            data.experience.quickActions.forEach(action => { action.description += ' Additional synthetic descriptive text.'.repeat(8); });
            if (data.officeOverview) data.officeOverview.staffWorkload[0].employee = 'LongSyntheticEmployeeName'.repeat(8);
            if (data.executiveOverview) data.executiveOverview.departmentWorkload[0].shortName = 'LongSyntheticOfficeName'.repeat(8);
            if (data.systemOverview) data.systemOverview.security.recentEvents[0].summary = 'LongSyntheticSecuritySummary'.repeat(12);
        }
    }
    if (state === 'missing') {
        data.metricGroups = []; data.recentWork = []; data.experience.quickActions = [];
        delete data.correspondenceOverview; delete data.officeOverview; delete data.executiveOverview; delete data.systemOverview;
    }
    return data;
}
