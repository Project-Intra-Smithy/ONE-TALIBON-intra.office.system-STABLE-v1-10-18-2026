import {
    announcements,
    calendarEvents,
    department,
    departmentCorrespondence,
    departmentDocuments,
    departmentHeadFixture,
    departmentHeadStaff,
    departmentHeadWorkspaceFixture,
    departmentWorkRequests,
    employeePersonalWorkRequests,
    FIXTURE_NOW,
    memoranda,
    workRequestDetailForRole,
    workRequestFixtureForRole,
    type EvaluationState,
} from './departmentHeadFixtures';

export type RoleKey = 'employee' | 'mpdc_designated_staff' | 'department_head' | 'executive_oversight' | 'system_administration' | 'hr';

const office = department;
const roleOffices: Record<RoleKey, { id: number; code: string; name: string; short_name: string; shortName: string; branch: string; office_type: string; officeType: string; is_routable: boolean }> = {
    employee: { id: 2, code: 'MEO', name: 'Municipal Engineering Office', short_name: 'MEO', shortName: 'MEO', branch: 'executive', office_type: 'department', officeType: 'department', is_routable: true },
    mpdc_designated_staff: office,
    department_head: office,
    executive_oversight: { id: 3, code: 'OMM', name: 'Office of the Municipal Mayor', short_name: 'Mayor’s Office', shortName: 'Mayor’s Office', branch: 'executive', office_type: 'executive', officeType: 'executive', is_routable: true },
    hr: { id: 4, code: 'HRMO', name: 'Human Resource Management Office', short_name: 'HRMO', shortName: 'HRMO', branch: 'executive', office_type: 'department', officeType: 'department', is_routable: true },
    system_administration: { id: 5, code: 'MISO', name: 'Municipal Management Information Systems Office', short_name: 'MISO', shortName: 'MISO', branch: 'executive', office_type: 'department', officeType: 'department', is_routable: true },
};
const now = FIXTURE_NOW;
const page = { current_page: 1, last_page: 1, per_page: 20, total: 1, from: 1, to: 1, prev_page_url: null, next_page_url: null, links: [] };
const syntheticEmployee = { id: 101, employee_number: 'SYN-101', full_name: 'Emilio Employee', name: 'Emilio Employee', number: 'SYN-101', email: 'employee@example.invalid', work_email: 'employee@example.invalid', position: 'Administrative Aide', position_title: 'Administrative Aide', employment_status: 'active', department_id: office.id, office: office.shortName, presence: 'offline', department: { ...office, short_name: office.shortName } };
const syntheticHrEmployee = { ...syntheticEmployee, id: 104, employee_number: 'SYN-104', full_name: 'Helen HR Officer', name: 'Helen HR Officer', number: 'SYN-104', email: 'hr@example.invalid', work_email: 'hr@example.invalid', position: 'HR Officer', position_title: 'HR Officer', department: roleOffices.hr, office: 'HRMO' };

export function sharedProps(role: RoleKey) {
    const roleLabel = role === 'hr' ? 'hr_admin' : role;
    const identities = {
        employee: [101, 'Emilio Employee', 'Administrative Aide'],
        mpdc_designated_staff: [106, 'Amihan Rivera', 'Planning Officer II'],
        department_head: [102, 'Daniel Department Head', 'MPDC Head'],
        executive_oversight: [103, 'Maria Executive', 'Executive Oversight'],
        hr: [104, 'Helen HR Officer', 'HR Officer'],
        system_administration: [105, 'Alex Administrator', 'System Administrator'],
    } as const;
    const [id, name, position] = identities[role];
    const userDept = roleOffices[role];
    return {
        appName: 'ONE TALIBON · Isolated UI Workspace',
        workspaceExperience: role === 'hr' || role === 'mpdc_designated_staff' ? 'employee' : role,
        auth: { user: { id, name, email: `${role}@example.invalid`, role: roleLabel, employee: { employee_number: `SYN-${id}`, position, department: userDept } } },
        permissions: { reports: true, navigation: { systemAdministration: role === 'system_administration', dashboard: true, transactions: true, correspondence: true, records: true, travelOrders: true, reports: true, mayorOffice: role === 'executive_oversight', memoranda: true, departments: true, audit: role === 'system_administration' } },
        flash: {},
    };
}

const work = { reference: 'WR-SYN-2026-001', title: 'Review annual investment program evidence', transactionType: 'work_request', status: 'in_progress', priority: 'high', originOffice: office, currentOffice: office, assignedEmployee: { name: 'Emilio Employee', position: 'Administrative Aide' }, receivedAt: now, dueAt: '2026-11-18T17:00:00+08:00', updatedAt: now, ageInOffice: '2 days', dueState: 'due_soon', detailUrl: '/work-requests/1' };

const roleAccess: Partial<Record<string, RoleKey[]>> = {
    'Transactions/DeliveryExceptions': ['department_head'],
    'Hris/Admin': ['hr'],
    'Hris/Dtr': ['employee', 'hr'],
    'MayorOffice': ['executive_oversight'],
    'Property/Index': ['system_administration'],
    'Transactions/Create': ['employee', 'mpdc_designated_staff', 'department_head'],
    'TravelOrders/Index': ['employee', 'mpdc_designated_staff', 'department_head'],
    'TravelOrders/Create': ['employee', 'mpdc_designated_staff', 'department_head'],
    'TravelOrders/Show': ['employee', 'mpdc_designated_staff', 'department_head'],
    'Employees/Show': ['employee', 'mpdc_designated_staff', 'department_head', 'executive_oversight', 'hr'],
    'Hris/Dashboard': ['employee', 'mpdc_designated_staff', 'hr'],
    'Hris/Development': ['hr'],
    'Hris/HealthAccess': ['hr'],
    'Hris/HealthVault': ['hr'],
    'Hris/Lifecycle/Index': ['hr'],
    'Hris/Lifecycle/Show': ['hr'],
    'Hris/Offboarding/Index': ['hr'],
    'Hris/Offboarding/Show': ['hr'],
    'Hris/Payroll': ['employee', 'hr'],
    'Property/Lifecycle': ['system_administration'],
};

export function fixturePageForRole(name: string, role: RoleKey) {
    const allowed = roleAccess[name];
    return allowed && !allowed.includes(role) ? 'Errors/403' : name;
}

export function fixtureFor(name: string, role: RoleKey, searchParams = new URLSearchParams(), path = '/'): Record<string, any> {
    const experienceKey = role === 'hr' || role === 'mpdc_designated_staff' ? 'employee' : role;
    const common = sharedProps(role);
    const base = { ...common };
    const userDept = roleOffices[role];
    switch (name) {
        case 'Auth/AccountSecurity': return { ...base, requiresMfa: true };
        case 'Transactions/DeliveryExceptions': return { ...base, exceptions: [{ id: 1, transactionId: 1, eventId: 1, reference: 'WR-SYN-2026-001', reason: 'Synthetic evaluation case', createdAt: now, acknowledged: false, resolved: false }] };
        case 'Dashboard': return { ...base, experience: { key: experienceKey, label: role === 'hr' ? 'HR' : role === 'mpdc_designated_staff' ? 'MPDC Designated Staff' : role.replaceAll('_', ' '), department: userDept, scopes: { personal: true, office: role === 'department_head', municipal: role === 'executive_oversight', system: role === 'system_administration' }, capabilities: { openOfficeWorkspace: role === 'department_head', viewMunicipalAggregates: role === 'executive_oversight', openSystemAdministration: role === 'system_administration' }, quickActions: [{ label: 'My tasks', description: 'Review assigned work', url: '/my-tasks' }, { label: 'Planning maps', description: 'Browse Talibon spatial plates', url: '/planning-maps' }, { label: 'Records', description: 'Search municipal records', url: '/records' }] }, metricGroups: [{ key: experienceKey === 'employee' ? 'personal' : experienceKey === 'department_head' ? 'office' : experienceKey === 'executive_oversight' ? 'executive' : 'system', title: 'Current workload', metrics: [{ label: 'Open items', value: role === 'department_head' ? 17 : 3, link: '/work-requests' }, { label: 'Due soon', value: role === 'department_head' ? 4 : 1, link: '/work-requests' }, { label: 'Completed', value: role === 'department_head' ? 24 : 12, link: '/records' }] }], recentWork: role === 'department_head' ? departmentWorkRequests.slice(0, 8) : [work], officeOverview: role === 'department_head' ? { metrics: departmentHeadFixture.metrics, statusOverview: departmentHeadFixture.statusOverview, staffWorkload: departmentHeadFixture.staffWorkload, oldestUnresolved: departmentHeadFixture.oldestUnresolved } : undefined, municipalDashboard: { projects: [], meetings: [], deadlines: [], documents: departmentDocuments.slice(0, 4).map(item => ({ id: String(item.id), reference: item.reference, title: item.title, office: office.shortName, documentType: item.recordType, updatedAt: item.updatedAt, audiences: ['department_head', 'employee', 'executive_oversight', 'system_administration'] })), announcements: announcements.map(item => ({ ...item, id: String(item.id), audiences: ['department_head', 'employee', 'executive_oversight', 'system_administration'] })), planningUpdates: [], officeActivity: [] } };
        case 'Public/Home': return { ...base, authenticated: false, content: publicContent };
        case 'Calendar/Index': return { ...base, events: calendarEvents, calendar: { view: 'month', anchor_date: '2026-11-14', today: '2026-11-14', range_start: '2026-11-01', range_end: '2026-12-31', timezone: 'Asia/Manila' } };
        case 'Departments/Workspace': return { ...base, ...departmentHeadWorkspaceFixture((searchParams.get('state') || 'default') as EvaluationState) };
        case 'Departments/Index': return {
            ...base,
            departments: [
                { ...office, active_employees_count: 12, active_transactions_count: 8, is_executive: true, is_legislative: false },
                { ...roleOffices.executive_oversight, active_employees_count: 18, active_transactions_count: 14, is_executive: true, is_legislative: false },
                { ...roleOffices.employee, active_employees_count: 24, active_transactions_count: 11, is_executive: true, is_legislative: false },
                { ...roleOffices.hr, active_employees_count: 9, active_transactions_count: 5, is_executive: true, is_legislative: false },
                { id: 6, code: 'SB', name: 'Office of the Sangguniang Bayan', short_name: 'Sangguniang Bayan', branch: 'legislative', office_type: 'legislative', is_routable: true, active_employees_count: 16, active_transactions_count: 3, is_executive: false, is_legislative: true },
            ],
            summary: { offices: 18, executiveOffices: 15, legislativeOffices: 3, employees: 326, activeTransactions: 41 },
            directoryEntries: [
                { key: 'mpdo', group: 'Executive offices', shortName: 'MPDO / MPDC', name: 'Municipal Planning and Development Office', responsibility: 'Comprehensive Land Use Plan (CLUP), Municipal Planning Maps, AIP, and development coordination.', backingDepartmentCode: 'MPDO', recordsHref: '/records', routable: true },
                { key: 'omm', group: 'Executive offices', shortName: 'Mayor’s Office', name: 'Office of the Municipal Mayor', responsibility: 'Chief executive direction, inter-office approvals, executive issuances, and public administration.', backingDepartmentCode: 'OMM', recordsHref: '/records', routable: true },
                { key: 'meo', group: 'Executive offices', shortName: 'MEO', name: 'Municipal Engineering Office', responsibility: 'Public works, farm-to-market roads, drainage, building permit reviews, and project inspection.', backingDepartmentCode: 'MEO', recordsHref: '/records', routable: true },
                { key: 'hrmo', group: 'Executive offices', shortName: 'HRMO', name: 'Human Resource Management Office', responsibility: 'Personnel appointments, DTR evidence, payroll coordination, learning & development, and employee welfare.', backingDepartmentCode: 'HRMO', recordsHref: '/records', routable: true },
                { key: 'mto', group: 'Executive offices', shortName: 'MTO', name: 'Municipal Treasurer’s Office', responsibility: 'Local revenue collection, real property tax administration, cash disbursements, and treasury reporting.', backingDepartmentCode: 'MTO', recordsHref: '/records', routable: true },
                { key: 'sb', group: 'Legislative offices', shortName: 'Sangguniang Bayan', name: 'Office of the Sangguniang Bayan', responsibility: 'Municipal ordinances, resolutions, committee hearings, legislative calendar, and public enactments.', backingDepartmentCode: 'SB', recordsHref: '/records', routable: true },
                { key: 'ovm', group: 'Legislative offices', shortName: 'Vice Mayor’s Office', name: 'Office of the Municipal Vice Mayor', responsibility: 'Presiding officer leadership, legislative oversight, and Sangguniang Bayan secretariat coordination.', backingDepartmentCode: 'OVM', recordsHref: '/records', routable: true },
            ],
            directoryGroups: ['Executive offices', 'Legislative offices'],
        };
        case 'Records/Index': return { ...base, records: { ...page, data: [{ recordType: 'transaction', reference: work.reference, title: work.title, source: 'Synthetic fixture', originOffice: office, currentOffice: office, assignedEmployee: work.assignedEmployee, state: 'in_progress', classification: 'internal', recordDate: now, updatedAt: now, detailUrl: work.detailUrl }] }, filters: { search: '', record_type: 'all', state: '', office_id: null, date_from: '', date_to: '' }, filterOptions: { recordTypes: [{ value: 'all', label: 'All records' }], states: [{ value: 'in_progress', label: 'In progress' }], offices: [office] } };
        case 'Transactions/Index': {
            const result = workRequestFixtureForRole(role, searchParams);
            const isHead = role === 'department_head';
            const personalViews = [{ key: 'all', label: 'All Work Requests', scope: 'personal', count: role === 'employee' || isHead ? employeePersonalWorkRequests.length : 0 }];
            const officeViews = [{ key: 'office_queue', label: 'Office queue', scope: 'office', count: 24 }, { key: 'needs_action', label: 'Needs Head action', scope: 'office', count: 5 }, { key: 'overdue', label: 'Overdue', scope: 'office', count: 4 }, { key: 'unassigned', label: 'Unassigned', scope: 'office', count: 3 }];
            return { ...base, records: { ...page, per_page: Math.max(result.records.length, 1), total: result.records.length, from: result.records.length ? 1 : null, to: result.records.length || null, data: result.records }, filters: { view: result.query.view, search: result.query.search, status: result.query.status, priority: result.query.priority, office_id: result.query.officeId }, scopeGroups: [{ key: 'personal', label: 'My Work', views: personalViews }, ...(isHead ? [{ key: 'office', label: 'My Department', views: officeViews }] : [])], filterOptions: { statuses: ['received','for_review','in_progress','completed'], priorities: ['normal','high'], offices: isHead ? [office] : [] }, experience: { profile: experienceKey, department: office, hasOfficeScope: isHead }, staffWorkload: isHead ? departmentHeadStaff.map(({ name, position, active, overdue, requiresAction }) => ({ employee: name, position, active, overdue, requiresAction })) : [], syntheticResultKind: result.resultKind, syntheticSourceCount: result.sourceCount };
        }
        case 'Transactions/Show': {
            const detail = workRequestDetailForRole(role, path, searchParams);
            if (detail.kind !== 'detail') return { ...base, status: detail.kind === 'forbidden' ? 403 : 404, requestId: detail.kind === 'forbidden' ? 'SYNTHETIC-WORK-REQUEST-RESTRICTED' : 'SYNTHETIC-WORK-REQUEST-NOT-FOUND' };
            const item = detail.item;
            return { ...base, transaction: { id: item.id, reference_no: item.reference, title: item.title, description: 'Synthetic evaluation item. Workflow actions are unavailable in this isolated preview and no changes can be saved.', transaction_type: item.transactionType, priority: item.priority, status: item.status, created_at: item.receivedAt, received_at: item.receivedAt, due_at: item.dueAt, completed_at: item.category === 'recently_completed' ? item.updatedAt : undefined, origin_department: office, current_department: office, creator: { name: 'Synthetic Request Creator' }, assigned_employee: item.assignedEmployee, events: [{ id: 1, action: 'created', new_status: item.status, remarks: 'Synthetic event only.', created_at: item.receivedAt, actor: { name: 'Synthetic Request Creator', employee: { department: office } }, to_department: office }] }, departments: [office], assignableEmployees: [], accountability: { dueState: item.dueState, timeInCurrentOffice: item.ageInOffice, receivedAt: item.receivedAt, dueAt: item.dueAt, completedAt: item.category === 'recently_completed' ? item.updatedAt : null }, transactionPermissions: detail.permissions, evidence: { record: [], events: {} }, returnTo: detail.returnTo, syntheticMutationBoundary: detail.mutationBoundary };
        }
        case 'Documents/Index': {
            const docSearch = (searchParams.get('search') || '').trim().toLowerCase();
            const docType = searchParams.get('record_type') || 'all';
            const docState = searchParams.get('state') || '';
            const mode = searchParams.get('mode') === 'files' ? 'files' : 'records';
            const selectedIdMatch = path.match(/^\/records\/(\d+)$/);
            const selectedDoc = selectedIdMatch ? departmentDocuments.find((d) => String(d.id) === selectedIdMatch[1]) ?? null : null;
            const filteredDocs = departmentDocuments
                .filter((d) => docType === 'all' || !docType || d.recordType === docType)
                .filter((d) => !docState || d.state === docState)
                .filter((d) => !docSearch || `${d.reference} ${d.title} ${d.recordType}`.toLowerCase().includes(docSearch));
            return { ...base, records: { ...page, per_page: Math.max(filteredDocs.length, 1), total: filteredDocs.length, from: filteredDocs.length ? 1 : null, to: filteredDocs.length || null, data: filteredDocs }, filters: { search: searchParams.get('search') || '', record_type: docType, state: docState, office_id: office.id, date_from: '', date_to: '' }, filterOptions: { recordTypes: [{ value: 'all', label: 'All records' }, ...Array.from(new Set(departmentDocuments.map(item => item.recordType))).map(value => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }))], states: [{ value: 'active', label: 'Active' }, { value: 'restricted_metadata', label: 'Restricted metadata' }, { value: 'file_unavailable', label: 'File unavailable' }], offices: [office] }, mode, archive: { records: { ...page, per_page: Math.max(filteredDocs.length, 1), total: filteredDocs.length, to: filteredDocs.length || null, data: filteredDocs }, selected: selectedDoc, counts: { all: departmentDocuments.length, my_sent: 6, my_received: 6, my_uploads: 6 }, filters: { archive_scope: searchParams.get('archive_scope') || 'all', archive_search: searchParams.get('archive_search') || '', document_type: searchParams.get('document_type') || '', classification: '', archive_office_id: office.id, archive_year: '2026', document: selectedDoc ? String(selectedDoc.id) : null }, filterOptions: { documentTypes: Array.from(new Set(departmentDocuments.map(item => item.recordType))), classifications: ['internal','restricted'], years: ['2026'], offices: [office] } } };
        }
        case 'Admin/Index': return { ...base, overview: { totalEmployees: 326, portalUsers: 284, activeUsers: 277, inactiveUsers: 7, employeesWithoutPortalAccounts: 42, activeDepartments: 18, privilegedUsers: 12, mfaEnrolled: 261 }, registry: { ...page, total: 3, to: 3, data: [{ id: 1, employee: 'Alex Administrator', employeeNumber: 'SYN-105', department: roleOffices.system_administration, position: 'System Administrator', role: 'system_administrator', username: 'alex.admin', loginEmail: 'admin@talibon.example', accountStatus: 'active', active: true, mfaEnrolled: true }, { id: 2, employee: 'Daniel Department Head', employeeNumber: 'SYN-102', department: office, position: 'MPDC Head', role: 'department_head', username: 'daniel.mpdc', loginEmail: 'mpdc@talibon.example', accountStatus: 'active', active: true, mfaEnrolled: true }, { id: 3, employee: 'Amihan Rivera', employeeNumber: 'SYN-106', department: office, position: 'Planning Officer II', role: 'employee', username: 'amihan.rivera', loginEmail: 'amihan@talibon.example', accountStatus: 'active', active: true, mfaEnrolled: true }] }, registryFilters: { search: '', department_id: null, role: '', status: '' }, departmentOptions: [office, roleOffices.hr, roleOffices.employee], roleOptions: ['employee','department_head','system_administrator'], invitableRoles: ['employee','department_head'], eligibleEmployees: [{ id: 204, name: 'Dalisay Flores', employeeNumber: 'SYN-204', office: 'MPDO', departmentId: office.id }, { id: 205, name: 'Elio Mercado', employeeNumber: 'SYN-205', office: 'MPDO', departmentId: office.id }], pendingInvitations: [], activationCredential: null, officeIdentities: [{ office: office.name, code: office.code, shortName: office.shortName, officialEmail: 'mpdo@talibon.example', status: 'configured' }, { office: roleOffices.hr.name, code: roleOffices.hr.code, shortName: roleOffices.hr.shortName, officialEmail: 'hrmo@talibon.example', status: 'configured' }], operations: { summary: { activeMunicipalWork: 41, municipalOverdue: 4, municipalUnassigned: 2, completedThisMonth: 19 }, departmentWorkload: [{ id: office.id, code: office.code, name: office.name, shortName: office.shortName, active: 17, unassigned: 2, dueSoon: 4, overdue: 2 }, { id: roleOffices.employee.id, code: roleOffices.employee.code, name: roleOffices.employee.name, shortName: roleOffices.employee.shortName, active: 14, unassigned: 0, dueSoon: 3, overdue: 1 }] }, security: { privilegedAccounts: 12, mfaEnrolled: 261, inactiveAccounts: 7, recentEvents: [{ actor: 'Alex Administrator', action: 'account.reviewed', outcome: 'success', summary: 'Reviewed quarterly privileged account inventory and MFA enrollment.', createdAt: now }] } };
        case 'Audit/Index': return { ...base, events: [{ id: 1, created_at: now, occurred_at: now, actor: { name: 'Alex Administrator', employee: { department: roleOffices.system_administration } }, actor_department: roleOffices.system_administration, action: 'account.reviewed', category: 'security', outcome: 'allowed', target_label: 'MPDC Portal Access', summary: 'Verified MFA status for privileged department accounts.' }, { id: 2, created_at: '2026-11-14T08:30:00+08:00', occurred_at: '2026-11-14T08:30:00+08:00', actor: { name: 'Daniel Department Head', employee: { department: office } }, actor_department: office, action: 'planning_map.published', category: 'records', outcome: 'allowed', target_label: 'TAL-BASE-2026', summary: 'Published Municipal Base & 25-Barangay Map to all LGU offices.' }, { id: 3, created_at: '2026-11-13T16:45:00+08:00', occurred_at: '2026-11-13T16:45:00+08:00', actor: { name: 'Helen HR Officer', employee: { department: roleOffices.hr } }, actor_department: roleOffices.hr, action: 'hris.dtr.reviewed', category: 'hris', outcome: 'allowed', target_label: 'Nov 2026 DTR Period', summary: 'Reviewed attendance evidence period summary.' }], summary: { events24h: 14, denied24h: 1, events7d: 92, distinctActors7d: 27 }, filters: {}, departments: [office, roleOffices.hr, roleOffices.employee, roleOffices.system_administration] };
        case 'Employees/Index': return { ...base, employees: { ...page, total: 3, to: 3, data: [{ id: 1, employee_number: 'SYN-101', full_name: 'Emilio Employee', position_title: 'Administrative Aide', department: roleOffices.employee, has_portal_account: true, featured_login: false }, { id: 2, employee_number: 'SYN-102', full_name: 'Daniel Department Head', position_title: 'MPDC Head', department: office, has_portal_account: true, featured_login: true }, { id: 3, employee_number: 'SYN-106', full_name: 'Amihan Rivera', position_title: 'Planning Officer II', department: office, has_portal_account: true, featured_login: false }] }, departments: [office, roleOffices.employee, roleOffices.hr], filters: { q: '', department: '' }, summary: { employees: 326, portalAccounts: 284, featuredLogins: 5, offices: 18 } };
        case 'Employees/DirectoryProfile': return { ...base, employee: syntheticEmployee, isSelf: role === 'employee' };
        case 'Employees/Show': return { ...base, employee: { ...syntheticEmployee, supervisor: null }, employmentProfile: role === 'hr' ? { employment_type: 'regular', appointment_date: '2022-01-10', employment_start_date: '2022-01-10', contract_end_date: null, biometric_external_id: 'SYNTHETIC-NOT-CONNECTED' } : null, privateProfile: null, documents: role === 'hr' ? [{ id: 1, public_id: 'DOC-SYN-EMP-001', title: 'Synthetic appointment record', document_type: 'appointment', classification: 'restricted', created_at: now }] : [], activeAssignments: [{ id: 1, reference_no: work.reference, title: work.title, priority: work.priority, status: work.status, due_at: work.dueAt }], performanceRecords: role === 'hr' ? [{ id: 1, period_start: '2026-01-01', period_end: '2026-06-30', rating: null, rating_scale: null, status: 'recorded', summary: 'Synthetic review evidence; no official rating.' }] : [], developmentRecords: role === 'hr' ? [{ id: 1, record_type: 'training', title: 'Records handling orientation', provider: 'Synthetic training provider', reference_no: 'SYN-TRN-001', attained_at: '2026-02-01', expires_at: null, status: 'active' }] : [], permissions: { isSelf: role === 'employee', canViewPrivate: false, canViewHrRecord: role === 'hr', canViewWorkContext: ['employee','department_head','executive_oversight','hr'].includes(role), healthVaultAccess: false, canManageHealthAccess: role === 'hr' } };
        case 'Correspondence/Index': {
            const rows = departmentCorrespondence.map((item) => ({ publicId: String(item.id), reference: item.reference, sender: { name: item.sender, source: 'synthetic' }, subject: item.subject, classification: 'internal', lifecycleState: item.lifecycle, currentOffice: { ...office, shortName: office.shortName }, assignedEmployee: null, workflowReference: null, receivedAt: item.receivedAt, age: '2 days', actionRequired: item.lifecycle === 'overdue' || item.lifecycle === 'active', overdue: item.lifecycle === 'overdue' }));
            const requestedView = searchParams.get('view') || 'overview';
            const allowedViews = ['overview', 'received', 'needs_action', 'assigned_to_me', 'routed', 'archived', 'overdue', 'all'];
            const view = allowedViews.includes(requestedView) ? requestedView : 'overview';
            const search = (searchParams.get('search') || '').trim().toLowerCase();
            const status = searchParams.get('lifecycle') || '';
            const receivedRows = rows.filter((item) => ['received', 'registered', 'classified'].includes(item.lifecycleState));
            const needsActionRows = rows.filter((item) => item.actionRequired || item.overdue || item.lifecycleState === 'active');
            const routedRows = rows.filter((item) => item.lifecycleState === 'routed');
            const overdueRows = rows.filter((item) => item.overdue);
            const scoped = rows
                .filter((item) => {
                    if (view === 'received') return ['received', 'registered', 'classified'].includes(item.lifecycleState);
                    if (view === 'needs_action' || view === 'assigned_to_me') return item.actionRequired || item.overdue || item.lifecycleState === 'active';
                    if (view === 'routed') return item.lifecycleState === 'routed';
                    if (view === 'overdue') return item.overdue;
                    if (view === 'archived') return String(item.lifecycleState) === 'archived';
                    return true;
                })
                .filter((item) => !status || item.lifecycleState === status)
                .filter((item) => !search || `${item.reference} ${item.subject} ${item.sender.name}`.toLowerCase().includes(search));
            return { ...base, records: { ...page, per_page: Math.max(scoped.length, 1), total: scoped.length, from: scoped.length ? 1 : null, to: scoped.length || null, data: scoped }, filters: { view, search: searchParams.get('search') || '', lifecycle: status, classification: '', office_id: null }, overview: { counts: { all: rows.length, received: receivedRows.length, needs_action: needsActionRows.length, routed: routedRows.length, active: rows.filter((item) => item.lifecycleState === 'active').length, overdue: overdueRows.length, archived: 0 }, previews: { received: receivedRows.slice(0, 3), needs_action: needsActionRows.slice(0, 3), routed: routedRows.slice(0, 3), active: rows.filter((item) => item.lifecycleState === 'active').slice(0, 3), overdue: overdueRows.slice(0, 3), archived: [] } }, filterOptions: { lifecycles: [...new Set(rows.map((item) => item.lifecycleState))], classifications: ['internal'], offices: [{ ...office, short_name: office.shortName }] }, workspace: { departmentName: office.name, departmentCode: office.code } };
        }
        case 'Correspondence/Show': {
            const segments = path.split('/').filter(Boolean);
            const idSegment = segments.find((seg) => /^\d+$/.test(seg));
            const item = departmentCorrespondence.find((entry) => String(entry.id) === idSegment) || departmentCorrespondence[0];
            return { ...base, correspondence: { publicId: String(item.id), reference: item.reference, municipalReference: `MUN-${item.reference}`, externalReference: `EXT-${item.id}`, lifecycleState: item.lifecycle, classification: 'internal', source: { senderName: item.sender, senderOrganization: 'Partner municipal office', source: 'synthetic', channel: 'registered_mail' }, content: { subject: item.subject, summary: 'Synthetic correspondence for visual review. No action is persisted.' }, accountability: { currentOffice: office, receivingOffice: office, workflow: null }, dates: { receivedAt: item.receivedAt, registeredAt: item.receivedAt, classifiedAt: null, routedAt: null, actionStartedAt: null } }, timeline: [{ id: 'SYN-CORR-EVT-1', source: 'correspondence', event: 'received', newState: item.lifecycle, actor: { type: 'integration', name: 'Records Office' }, office, occurredAt: item.receivedAt, evidence: [] }], capabilities: { canClassify: false, canRoute: false, canStartAction: false, canAttachEvidence: false }, routeOptions: [], evidence: { record: [], events: {} } };
        }
        case 'Hris/Admin': return { ...base, employees: [{ id: 1, employee_number: 'SYN-101', full_name: 'Emilio Employee', position_title: 'Administrative Aide', employment_status: 'active', user: null, department: { name: office.name, short_name: office.shortName } }], pending: [] };
        case 'Hris/Dtr': return { ...base, period: { id: 1, label: 'Synthetic November 2026', period_start: '2026-11-01', period_end: '2026-11-15', status: 'preview', generated_at: null, locked_at: null }, employee: { employee_number: `SYN-${role === 'hr' ? 104 : 101}`, full_name: role === 'hr' ? 'Helen HR Officer' : 'Emilio Employee', department: { name: userDept.name, short_name: userDept.shortName } }, summaries: [{ id: 1, work_date: '2026-11-14', first_in_at: '2026-11-14T08:00:00+08:00', last_out_at: '2026-11-14T17:00:00+08:00', raw_event_count: 2, leave_status: null, source_status: 'synthetic' }], snapshot: { daysWithLogs: 1, completeDays: 1, partialDays: 0, leaveDaysRepresented: 0, approvedLeaveUnits: 0 }, isHrAdmin: false, payrollPeriods: [] };
        case 'Hris/Attendance': return { ...base, employee: { name: 'Emilio Employee', number: 'SYN-101', office: 'MEO' }, events: [{ id: 1, occurred_at: now, event_type: 'time_in', source: 'Synthetic fixture', notes: null }] };
        case 'Hris/Dashboard': return { ...base, employee: syntheticEmployee, department: office, leaveTypes: [{ id: 1, code: 'VL', name: 'Vacation leave', tracks_balance: true, balance: 8, entitlement_label: null }], requests: [{ id: 1, start_date: '2026-11-20', end_date: '2026-11-20', units: 1, status: 'pending', leave_type: { name: 'Vacation leave' } }], attendance: [{ id: 1, occurred_at: now, event_type: 'time_in', source: 'Synthetic fixture' }], canAdmin: role === 'hr', attendanceIntegration: { source: 'Synthetic fixture', status: 'not_connected', lastEvent: now, events: 1, employeesRepresented: 1 } };
        case 'Hris/Development': return { ...base, employees: [syntheticEmployee], performanceRecords: [], developmentRecords: [], summary: { performance: 0, development: 0, expiringDevelopment: 0, contractsDue: 0 } };
        case 'Hris/HealthAccess': return { ...base, grants: [], users: [{ id: 104, name: 'Helen HR Officer', email: 'hr@example.invalid', role: 'hr_admin' }], employees: [syntheticEmployee] };
        case 'Hris/HealthVault': return { ...base, employee: syntheticEmployee, records: [{ id: 1, record_type: 'fit_to_work', title: 'Synthetic occupational-health clearance', issued_at: '2026-11-01', valid_until: '2027-11-01', status: 'active', summary: 'Synthetic preview only; not clinical data.', restriction_notes: 'No download or persistence in isolated mode.', creator: 'Synthetic fixture adapter', created_at: now }], canManage: false };
        case 'Hris/Lifecycle/Index': return { ...base, onboardingCases: [{ id: 1, status: 'in_progress', planned_start_date: '2026-12-01', appointment_reference: 'SYN-APT-001', open_required_tasks_count: 1, employee: syntheticEmployee, target_department: { ...office, short_name: office.shortName } }], movements: [], departments: [{ ...office, short_name: office.shortName, branch: 'executive' }], employees: [syntheticEmployee], supervisors: [syntheticHrEmployee], today: '2026-11-17', summary: { onboardingActive: 1, onboardingBlocked: 0, movementReviews: 0 } };
        case 'Hris/Lifecycle/Show': return { ...base, case: { id: 1, status: 'in_progress', appointment_reference: 'SYN-APT-001', planned_start_date: '2026-12-01', employee: syntheticEmployee, target_department: { ...office, short_name: office.shortName }, supervisor: syntheticHrEmployee, tasks: [{ id: 1, task_key: 'records_orientation', title: 'Review records handling orientation', category: 'orientation', is_required: true, status: 'pending', due_at: '2026-11-30', owner_department: { name: office.name, short_name: office.shortName } }] }, summary: { required: 1, completed: 0, openRequired: 1 } };
        case 'Hris/Offboarding/Index': return { ...base, cases: [{ id: 1, separation_type: 'resignation', effective_date: '2026-12-31', status: 'clearance_pending', open_required_tasks_count: 2, employee: syntheticEmployee }], employees: [syntheticEmployee], today: '2026-11-17' };
        case 'Hris/Offboarding/Show': return { ...base, case: { id: 1, separation_type: 'resignation', effective_date: '2026-12-31', status: 'clearance_pending', reason: 'Synthetic preview only', employee: syntheticEmployee, tasks: [{ id: 1, task_key: 'records_handover', title: 'Records handover review', is_required: true, status: 'pending', owner_department: { ...office, short_name: office.shortName }, notes: 'No completion is persisted in isolated mode.' }] }, summary: { required: 1, completed: 0, openRequired: 1 } };
        case 'Hris/Payroll': return { ...base, period: { id: 1, label: 'Synthetic November 2026', period_start: '2026-11-01', period_end: '2026-11-15', status: 'preview', calculation_mode: 'synthetic_preview', source_notes: 'No official payroll rules or deductions are represented.', dtr_period: null }, employee: role === 'hr' ? syntheticHrEmployee : syntheticEmployee, entry: null, canAdmin: role === 'hr', adminSummary: role === 'hr' ? { employees: 1, gross: 0, deductions: 0, net: 0, released: 0, dtrLinked: 0, partialDtrDays: 0 } : null, adminEntries: [] };
        case 'MayorOffice': {
            const tx = departmentWorkRequests.slice(0, 5).map((item) => ({ id: item.id, reference_no: item.reference, title: item.title, status: item.status, priority: item.priority, due_at: item.dueAt, origin_department: { name: office.name, short_name: office.shortName }, current_department: { name: office.name, short_name: office.shortName } }));
            return { ...base, queue: tx, overdue: tx.filter((_, index) => index < 2), returned: [], bottlenecks: [{ current_department_id: office.id, open_count: 5, current_department: { name: office.name, short_name: office.shortName } }], stats: { forApproval: 5, forReview: 0, highPriority: tx.filter((item) => item.priority === 'high').length, total: 5, municipalityOpen: 5, municipalityOverdue: 2, returnedOrInfoRequested: 0 } };
        }
        case 'Property/Index': return { ...base, assets: [{ id: 1, property_number: 'PROP-SYN-001', qr_value: 'SYNTHETIC-NOT-SCANNABLE', category: 'Office equipment', description: 'Synthetic desktop workstation', serial_number: 'SYN-0001', acquisition_cost: null, physical_location: 'Synthetic records room', par_reference: null, ics_reference: null, condition: 'good', status: 'available', reconciliation_status: 'preview', current_department: { ...office, short_name: office.shortName }, accountable_employee: null }], employees: [], departments: [{ ...office, short_name: office.shortName }], canManage: false, summary: { total: 1, assigned: 0, available: 1, needsAttention: 0 } };
        case 'Property/Lifecycle': return { ...base, assets: [{ id: 1, property_number: 'PROP-SYN-001', qr_value: 'SYNTHETIC-NOT-SCANNABLE', category: 'Office equipment', description: 'Synthetic desktop workstation', physical_location: 'Synthetic records room', condition: 'good', status: 'available', reconciliation_status: 'preview', current_department: { ...office, short_name: office.shortName }, accountable_employee: null }], inventorySessions: [{ id: 1, session_code: 'INV-SYN-001', title: 'Synthetic inventory review', status: 'draft', inventory_date: '2026-11-17', scans_count: 0, department: { ...office, short_name: office.shortName } }], openMaintenance: [], pendingDisposals: [], departments: [{ ...office, short_name: office.shortName }], canManage: false, canReconcile: false };
        case 'Reports/Index': return {
            ...base,
            catalog: [
                {
                    key: 'office-workload',
                    label: 'Office Workload Summary',
                    description: 'Read-only preview of active, due-soon, and completed transactions grouped by authorized municipal office.',
                    filters: ['office', 'status', 'date_from', 'date_to'],
                    columns: [
                        { key: 'office', label: 'Municipal office' },
                        { key: 'active', label: 'Active items' },
                        { key: 'dueSoon', label: 'Due soon' },
                        { key: 'overdue', label: 'Overdue' },
                        { key: 'completed', label: 'Completed' },
                    ],
                    kind: 'aggregate',
                },
                {
                    key: 'transaction-aging',
                    label: 'Work Request Aging',
                    description: 'Read-only preview of open municipal work requests with current aging and due status.',
                    filters: ['office', 'status', 'priority'],
                    columns: [
                        { key: 'reference', label: 'Reference' },
                        { key: 'title', label: 'Work Request' },
                        { key: 'office', label: 'Current Office' },
                        { key: 'status', label: 'Status' },
                        { key: 'dueState', label: 'Due State' },
                    ],
                    kind: 'rows',
                },
            ],
            activeReport: searchParams.get('report') === 'transaction-aging' ? 'transaction-aging' : 'office-workload',
            filters: { report: searchParams.get('report') === 'transaction-aging' ? 'transaction-aging' : 'office-workload', office: searchParams.get('office') || '', status: searchParams.get('status') || '' },
            filterOptions: {
                offices: [
                    { id: office.id, label: office.name },
                    { id: roleOffices.employee.id, label: roleOffices.employee.name },
                    { id: roleOffices.hr.id, label: roleOffices.hr.name },
                ],
                statuses: ['received', 'in_progress', 'for_review', 'completed'],
                priorities: ['normal', 'high', 'urgent'],
                transactionTypes: ['work_request'],
                lifecycles: ['received', 'routed', 'active'],
                classifications: ['internal', 'restricted'],
            },
            result: searchParams.get('report') === 'transaction-aging'
                ? {
                    data: [
                        { id: 1, reference: 'WR-SYN-2026-001', title: 'Review annual investment program evidence', office: 'MPDO', status: 'In Progress', dueState: 'Due Soon', detailUrl: '/work-requests/1' },
                        { id: 6, reference: 'WR-SYN-2026-006', title: 'Follow up overdue barangay planning submission', office: 'MPDO', status: 'In Progress', dueState: 'Overdue', detailUrl: '/work-requests/6' },
                    ],
                    total: 2,
                    current_page: 1,
                    last_page: 1,
                    per_page: 20,
                    links: [],
                }
                : {
                    data: [
                        { id: 1, office: 'Municipal Planning and Development Office (MPDO)', active: 17, dueSoon: 4, overdue: 2, completed: 24 },
                        { id: 2, office: 'Municipal Engineering Office (MEO)', active: 14, dueSoon: 3, overdue: 1, completed: 19 },
                        { id: 3, office: 'Human Resource Management Office (HRMO)', active: 8, dueSoon: 1, overdue: 0, completed: 15 },
                    ],
                    total: 3,
                    current_page: 1,
                    last_page: 1,
                    per_page: 20,
                    links: [],
                },
            errors: { export: 'Export is unavailable in the isolated preview.' },
        };
        case 'Legislation/Index': return { ...base, records: [{ id: 1, record_type: 'ordinance', record_number: 'ORD-2026-001', title: 'Municipal Comprehensive Land Use & Zoning Implementation Ordinance', summary: 'Establishes updated zoning boundaries, coastal setback standards, and MPDC review workflows across all 25 barangays of Talibon.', approved_at: '2026-10-15', year: 2026, status: 'active', issuing_body: 'Sangguniang Bayan', keywords: ['planning', 'zoning', 'clup'] }], filters: { q: '', type: '' }, canManage: role !== 'employee' };
        case 'Legislation/Workspace': return { ...base, sessions: [], legislativeWork: [], canManage: role !== 'employee' };
        case 'Legislation/Show': return { ...base, record: { id: 1, record_type: 'ordinance', record_number: 'ORD-2026-001', title: 'Municipal Comprehensive Land Use & Zoning Implementation Ordinance', summary: 'Establishes updated zoning boundaries, coastal setback standards, and MPDC spatial planning map publication procedures across all 25 barangays of Talibon.', full_text: null, approved_at: '2026-10-15', year: 2026, status: 'active', issuing_body: 'Sangguniang Bayan', keywords: ['planning', 'zoning', 'clup'], source_document: null, creator: { name: 'Sangguniang Bayan Secretariat' } }, canManage: false };
        case 'Memoranda/Index': return { ...base, memoranda, authority: { canPublish: role === 'department_head' }, view: searchParams.get('view') || 'overview' };
        case 'Memoranda/Show': return { ...base, memorandum: { id: 1, memo_number: 'MEMO-SYN-2026-001', title: 'Synthetic records handling reminder', body: 'This memorandum is synthetic and intended only for interface review. No acknowledgement is persisted.', classification: 'internal', audience_type: 'all_employees', requires_acknowledgement: true, published_at: now, expires_at: null, issuer: { name: 'Synthetic Municipal Administrator' }, issuing_department: { name: office.name, short_name: office.shortName } }, recipient: { viewed_at: now, acknowledged_at: null }, statistics: null };
        case 'MunicipalSystems/Index': return { ...base, referenceSurface: path === '/procurement' ? 'procurement' : undefined };
        case 'Errors/403': return { ...base, resource: 'Restricted municipal workspace', message: 'This synthetic role does not have access to this interface.' };
        case 'Errors/Status': {
            const isUnknownWorkRequest = /^\/(?:work-requests|transactions)\/.+/.test(path);
            return { ...base, status: isUnknownWorkRequest ? 404 : searchParams.get('state') === 'session_expired' ? 419 : 503, requestId: isUnknownWorkRequest ? 'SYNTHETIC-WORK-REQUEST-NOT-FOUND' : searchParams.get('state') === 'session_expired' ? 'SYNTHETIC-SESSION-EXPIRED' : 'SYNTHETIC-OFFLINE' };
        }
        case 'Auth/MfaEnrollment': return { ...base, secret: 'SYNTHETIC-SECRET', provisioningUri: 'otpauth://totp/ONE-TALIBON:synthetic', issuer: 'ONE TALIBON' };
        case 'Auth/MfaRecoveryCodes': return { ...base, continueUrl: '/dashboard', flash: { mfaRecoveryCodes: ['synthetic-code-1', 'synthetic-code-2'] } };
        case 'Auth/MfaSettings': return { ...base, configured: true, confirmedAt: now, recoveryGeneratedAt: now };
        case 'Search/Index': return { ...base, archiveActivity: { sentCount: 0, receivedCount: 0, recentSent: [], recentReceived: [] } };
        case 'Transactions/Create': return { ...base, departments: [{ ...office, short_name: office.shortName, branch: 'executive', office_type: 'department' }, { ...roleOffices.employee, short_name: roleOffices.employee.shortName, branch: 'executive', office_type: 'department' }, { ...roleOffices.hr, short_name: roleOffices.hr.shortName, branch: 'executive', office_type: 'department' }], assignableEmployees: [{ id: 1, employee_number: 'SYN-101', full_name: 'Emilio Employee', department_id: office.id, position_title: 'Administrative Aide' }, { id: 2, employee_number: 'SYN-106', full_name: 'Amihan Rivera', department_id: office.id, position_title: 'Planning Officer II' }], requestCategories: { planning: ['Review planning evidence', 'CLUP zoning verification'], administrative: ['General inter-office endorsement'] }, actionOptions: ['Review', 'Endorse', 'Approve'] };
        case 'TravelOrders/Index': return { ...base, travelOrders: { ...page, data: [{ publicId: '1', referenceNumber: 'TO-SYN-2026-001', issuanceDate: '2026-11-10', purpose: 'Synthetic coordination meeting', destination: 'Talibon, Bohol', office: { ...office, shortName: office.shortName }, travelStartDate: '2026-11-20', travelEndDate: '2026-11-20', status: 'approved', issuedToCount: 1, detailUrl: '/travel-orders/1' }] }, filters: { search: '', status: '', office_id: null, date_from: '', date_to: '' }, filterOptions: { statuses: [{ value: 'approved', label: 'Approved' }], offices: [office] }, canRecordApproved: false };
        case 'TravelOrders/Create': return { ...base, departments: [office] };
        case 'TravelOrders/Show': return { ...base, travelOrder: { publicId: '1', referenceNumber: 'TO-SYN-2026-001', issuanceDate: '2026-11-10', purpose: 'Synthetic coordination meeting', destination: 'Talibon, Bohol', office, travelStartDate: '2026-11-20', travelEndDate: '2026-11-20', status: 'approved', issuedTo: [{ employeeNumber: 'SYN-101', name: 'Emilio Employee', position: 'Administrative Aide', office }], issuedToCount: 1, events: [{ id: 1, event: 'created', fromStatus: null, toStatus: 'approved', remarks: 'Synthetic preview; no official issuance.', occurredAt: now, actor: 'Synthetic fixture adapter' }], eventCount: 1 }, evidence: { record: [], events: {} }, capabilities: { canChangeStatus: false } };
        default: return base;
    }
}

const publicContent = {
    dataMode: 'synthetic', sampleLabel: 'Synthetic UI preview', municipality: 'Municipality of Talibon',
    hero: { eyebrow: 'ONE TALIBON', title: 'One connected municipal workplace', lead: 'A unified intra-office experience for municipal teams.', description: 'This isolated frontend uses synthetic content and is not connected to municipal systems.' },
    about: { eyebrow: 'About the portal', title: 'Work together with clarity', description: 'A shared interface for accountable municipal work.', pillars: [{ title: 'Connected offices', description: 'Bring authorized work into one coherent workspace.' }, { title: 'Visible accountability', description: 'Present ownership and status clearly.' }] },
    portalPreview: { eyebrow: 'Portal preview', title: 'A day in ONE TALIBON', modules: [{ id: 'memo', kind: 'memorandum', title: 'New memorandum', description: 'Review a synthetic internal issuance.' }], quickAccess: [{ capabilityId: 'transactions', label: 'Open work requests' }] },
    dailyConvenience: { eyebrow: 'Daily work', title: 'Common actions close at hand', description: 'Navigate tasks, records, schedules, and office information.', items: [{ id: 'schedule', kind: 'schedule', title: 'Today’s schedule', description: 'Municipal coordination meeting at 10:00 AM.' }] },
    capabilities: { title: 'Municipal workspace capabilities', description: 'Presentation-only examples of the current interface.', items: [{ id: 'transactions', title: 'Work requests', description: 'Track assigned municipal work.', detail: { summary: 'Synthetic preview.', highlights: ['Assignment', 'Status', 'Evidence'] } }, { id: 'documents', title: 'Documents', description: 'Find records and evidence.', detail: { summary: 'Synthetic preview.', highlights: ['Search', 'Collections', 'Archive'] } }] },
    workflow: { eyebrow: 'How work moves', title: 'A clear municipal workflow', description: 'Interfaces preserve responsibility without claiming backend operation.', steps: [{ title: 'Receive', description: 'Capture the request.' }, { title: 'Assign', description: 'Identify responsibility.' }, { title: 'Complete', description: 'Record evidence.' }] },
    officeOverview: { eyebrow: 'Offices', title: 'One municipality, coordinated', description: 'Discover municipal offices and their responsibilities.' },
    secureAccess: { eyebrow: 'Secure access', title: 'Role-aware presentation', description: 'Interfaces vary by representative role.', note: 'Authentication and authorization are mocked in this repository.', trustPoints: ['Synthetic identities', 'No production connection', 'No persistence'] },
    services: [], transparency: [], projects: [], dashboard: [], news: [], contact: { heading: 'Municipality of Talibon', description: 'Public information preview.', location: 'Talibon, Bohol, Philippines' },
};
