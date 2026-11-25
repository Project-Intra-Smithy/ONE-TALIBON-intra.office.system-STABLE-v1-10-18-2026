type RoleKey = 'employee' | 'mpdc_designated_staff' | 'department_head' | 'executive_oversight' | 'system_administration' | 'hr';

export const FIXTURE_NOW = '2026-11-14T09:00:00+08:00';
export const FIXTURE_TIMEZONE = 'Asia/Manila';

export const department = {
    id: 1,
    code: 'MPDO',
    name: 'Municipal Planning and Development Office',
    short_name: 'MPDO',
    shortName: 'MPDO',
    branch: 'executive',
    office_type: 'department',
    officeType: 'department',
    is_routable: true,
} as const;

export type SyntheticStaffState = 'active' | 'overdue' | 'unavailable' | 'no_assignment';
export type SyntheticStaff = {
    id: number;
    employeeNumber: string;
    name: string;
    position: string;
    state: SyntheticStaffState;
    active: number;
    overdue: number;
    requiresAction: number;
};

const staffNames = [
    'Amihan Rivera', 'Bituin Santos', 'Cielo Navarro', 'Dalisay Flores',
    'Elio Mercado', 'Hiraya Ramos', 'Isagani Torres', 'Luningning Cruz',
    'Mayumi Garcia', 'Narra Mendoza', 'Sinag Villanueva', 'Tala Bautista',
];

export const departmentHeadStaff: SyntheticStaff[] = staffNames.map((name, index) => {
    const state: SyntheticStaffState = index < 8 ? 'active' : index < 10 ? 'overdue' : index === 10 ? 'unavailable' : 'no_assignment';
    return {
        id: index + 1,
        employeeNumber: `SYN-MPDO-${String(index + 1).padStart(3, '0')}`,
        name,
        position: index === 0 ? 'Planning Officer' : index === 10 ? 'Project Development Officer (on synthetic leave)' : 'Planning Assistant',
        state,
        active: state === 'no_assignment' || state === 'unavailable' ? 0 : state === 'overdue' ? 3 : 2 + (index % 3),
        overdue: state === 'overdue' ? 2 : index < 2 ? 1 : 0,
        requiresAction: state === 'unavailable' || state === 'no_assignment' ? 0 : 1 + (index % 2),
    };
});

export type WorkRequestCategory = 'head_action' | 'overdue' | 'due_soon' | 'unassigned' | 'in_progress' | 'recently_completed';
export type SyntheticWorkRequest = {
    id: number;
    reference: string;
    title: string;
    category: WorkRequestCategory;
    transactionType: string;
    status: string;
    priority: string;
    originOffice: typeof department;
    currentOffice: typeof department;
    assignedEmployee: { id: number; name: string; full_name: string; position: string; position_title: string; employee_number: string } | null;
    receivedAt: string;
    dueAt: string | null;
    updatedAt: string;
    ageInOffice: string;
    dueState: 'on_track' | 'due_soon' | 'overdue' | 'completed';
    requiresAction: boolean;
    expectedAction: string;
    detailUrl: string;
};

const categoryPlan: WorkRequestCategory[] = [
    ...Array<WorkRequestCategory>(5).fill('head_action'),
    ...Array<WorkRequestCategory>(4).fill('overdue'),
    ...Array<WorkRequestCategory>(5).fill('due_soon'),
    ...Array<WorkRequestCategory>(3).fill('unassigned'),
    ...Array<WorkRequestCategory>(5).fill('in_progress'),
    ...Array<WorkRequestCategory>(2).fill('recently_completed'),
];

const categoryTitle: Record<WorkRequestCategory, string> = {
    head_action: 'Review planning evidence for Head action',
    overdue: 'Follow up overdue barangay planning submission',
    due_soon: 'Validate due-soon investment program entry',
    unassigned: 'Assign office owner for planning request',
    in_progress: 'Prepare municipal development monitoring update',
    recently_completed: 'Archive completed planning coordination evidence',
};

export const departmentWorkRequests: SyntheticWorkRequest[] = categoryPlan.map((category, index) => {
    const staff = category === 'unassigned' ? null : departmentHeadStaff[index % 10];
    const dueState = category === 'overdue' ? 'overdue' : category === 'due_soon' || category === 'head_action' ? 'due_soon' : category === 'recently_completed' ? 'completed' : 'on_track';
    const status = category === 'recently_completed' ? 'completed' : category === 'head_action' ? 'for_review' : category === 'unassigned' ? 'received' : 'in_progress';
    const id = index + 1;
    return {
        id,
        reference: `WR-SYN-2026-${String(id).padStart(3, '0')}`,
        title: `${categoryTitle[category]} ${String(id).padStart(2, '0')}`,
        category,
        transactionType: 'work_request',
        status,
        priority: category === 'overdue' || category === 'head_action' ? 'high' : 'normal',
        originOffice: department,
        currentOffice: department,
        assignedEmployee: staff ? { id: staff.id, name: staff.name, full_name: staff.name, position: staff.position, position_title: staff.position, employee_number: staff.employeeNumber } : null,
        receivedAt: `2026-11-${String(1 + (index % 10)).padStart(2, '0')}T08:30:00+08:00`,
        dueAt: category === 'recently_completed' ? '2026-11-12T17:00:00+08:00' : category === 'overdue' ? '2026-11-10T17:00:00+08:00' : `2026-11-${String(15 + (index % 7)).padStart(2, '0')}T17:00:00+08:00`,
        updatedAt: `2026-11-${String(10 + (index % 5)).padStart(2, '0')}T14:00:00+08:00`,
        ageInOffice: `${2 + (index % 9)} days`,
        dueState,
        requiresAction: category === 'head_action',
        expectedAction: category === 'head_action' ? 'Department Head review required' : category === 'unassigned' ? 'Assign an authorized office owner' : 'Open authorized work details',
        detailUrl: `/work-requests/${id}`,
    };
});

export const employeePersonalWorkRequests: SyntheticWorkRequest[] = departmentWorkRequests.slice(0, 8).map((item, index) => ({
    ...item,
    title: `My synthetic Work Request ${index + 1}: ${item.title}`,
    requiresAction: index < 3,
    expectedAction: index < 3 ? 'Review your assigned synthetic request' : 'Open your personal Work Request details',
}));

export type WorkRequestQuery = {
    view: string;
    search: string;
    status: string;
    priority: string;
    officeId: number | null;
};

export function workRequestFixtureForRole(role: RoleKey, searchParams = new URLSearchParams()) {
    const isHead = role === 'department_head';
    const source = isHead ? departmentWorkRequests : role === 'employee' ? employeePersonalWorkRequests : [];
    const allowedViews = isHead
        ? ['all', 'office_queue', 'needs_action', 'overdue', 'unassigned', 'in_progress', 'due_soon', 'completed', 'staff_workload']
        : ['all'];
    const requestedView = searchParams.get('view') || (isHead ? 'office_queue' : 'all');
    const view = allowedViews.includes(requestedView) ? requestedView : (isHead ? 'office_queue' : 'all');
    const search = (searchParams.get('search') || '').trim();
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const officeValue = searchParams.get('office_id');
    const officeId = officeValue && /^\d+$/.test(officeValue) ? Number(officeValue) : null;

    let records = view === 'all' ? (isHead ? employeePersonalWorkRequests : source) : source;
    if (view === 'needs_action') records = records.filter((item) => item.category === 'head_action');
    if (view === 'overdue') records = records.filter((item) => item.category === 'overdue');
    if (view === 'unassigned') records = records.filter((item) => item.category === 'unassigned');
    if (view === 'in_progress') records = records.filter((item) => item.category === 'in_progress');
    if (view === 'due_soon') records = records.filter((item) => item.category === 'due_soon');
    if (view === 'completed') records = records.filter((item) => item.category === 'recently_completed');
    if (view === 'staff_workload') records = [];

    if (search) {
        const needle = search.toLocaleLowerCase('en-PH');
        records = records.filter((item) => [item.reference, item.title, item.currentOffice.name, item.currentOffice.shortName, item.assignedEmployee?.name]
            .filter(Boolean).some((value) => String(value).toLocaleLowerCase('en-PH').includes(needle)));
    }
    if (status) records = records.filter((item) => item.status === status);
    if (priority) records = records.filter((item) => item.priority === priority);
    if (officeId !== null) records = records.filter((item) => item.currentOffice.id === officeId);

    return {
        records,
        query: { view, search, status, priority, officeId } satisfies WorkRequestQuery,
        sourceCount: source.length,
        resultKind: source.length === 0 && !search && !status && !priority ? 'empty' : records.length === 0 ? 'no_match' : 'results',
    } as const;
}

const correspondenceStates = ['received', 'received', 'received', 'classified', 'classified', 'routed', 'routed', 'routed', 'active', 'active', 'overdue', 'overdue'] as const;
export const departmentCorrespondence = correspondenceStates.map((lifecycle, index) => ({
    id: index + 1,
    reference: `COR-SYN-2026-${String(index + 1).padStart(3, '0')}`,
    subject: `Synthetic ${lifecycle} correspondence ${index + 1}`,
    sender: `Synthetic Office ${String((index % 4) + 1).padStart(2, '0')}`,
    lifecycle,
    currentOffice: department,
    receivedAt: `2026-11-${String(2 + index).padStart(2, '0')}T09:00:00+08:00`,
    routedAt: ['routed', 'active', 'overdue'].includes(lifecycle) ? `2026-11-${String(3 + index).padStart(2, '0')}T10:00:00+08:00` : null,
    detailUrl: `/correspondence/${index + 1}`,
}));

const documentTypes = ['memorandum', 'plan', 'report', 'minutes', 'endorsement', 'evidence'] as const;
export const departmentDocuments = Array.from({ length: 18 }, (_, index) => ({
    id: index + 1,
    recordType: documentTypes[index % documentTypes.length],
    reference: `DOC-SYN-2026-${String(index + 1).padStart(3, '0')}`,
    title: `Synthetic planning ${documentTypes[index % documentTypes.length]} ${index + 1}`,
    source: 'Synthetic G1 fixture',
    originOffice: department,
    currentOffice: department,
    assignedEmployee: departmentWorkRequests[index % departmentWorkRequests.length].assignedEmployee,
    state: index === 16 ? 'restricted_metadata' : index === 17 ? 'file_unavailable' : index % 4 === 0 ? 'completed' : 'active',
    classification: index === 16 ? 'restricted' : 'internal',
    recordDate: `2026-10-${String(1 + index).padStart(2, '0')}T09:00:00+08:00`,
    updatedAt: `2026-11-${String(1 + (index % 13)).padStart(2, '0')}T15:00:00+08:00`,
    detailUrl: `/records/${index + 1}`,
    fileAvailability: index === 16 ? 'restricted' : index === 17 ? 'unavailable' : 'available',
}));

const taskStates = ['open', 'open', 'open', 'due_soon', 'due_soon', 'overdue', 'completed', 'completed'] as const;
export const personalTasks = taskStates.map((status, index) => ({
    id: index + 1,
    reference: `TASK-SYN-2026-${String(index + 1).padStart(3, '0')}`,
    title: `Synthetic personal planning task ${index + 1}`,
    status,
    dueAt: status === 'overdue' ? '2026-11-10T17:00:00+08:00' : `2026-11-${String(15 + index).padStart(2, '0')}T17:00:00+08:00`,
}));

export const calendarEvents = Array.from({ length: 6 }, (_, index) => ({
    id: index + 1,
    event_key: `CAL-SYN-2026-${String(index + 1).padStart(3, '0')}`,
    event_type: index % 2 === 0 ? 'meeting' : 'deadline',
    title: `Synthetic municipal planning event ${index + 1}`,
    description: 'Deterministic G1 evaluation fixture.',
    priority: index === 0 ? 'important' : 'normal',
    starts_at: index < 2 ? `2026-11-14T${String(10 + index).padStart(2, '0')}:00:00+08:00` : index < 4 ? `2026-11-${16 + index}T09:00:00+08:00` : `2026-12-0${index - 2}T09:00:00+08:00`,
    ends_at: index < 2 ? `2026-11-14T${String(11 + index).padStart(2, '0')}:00:00+08:00` : null,
    all_day: index >= 2,
    location: index % 2 === 0 ? 'Synthetic Session Hall' : 'MPDO synthetic workspace',
    action_url: '/calendar',
    status: 'scheduled',
    department,
}));

export const memoranda = [
    { id: 1, state: 'unread', requires_acknowledgement: false },
    { id: 2, state: 'read', requires_acknowledgement: false },
    { id: 3, state: 'acknowledgement_required', requires_acknowledgement: true },
    { id: 4, state: 'acknowledged', requires_acknowledgement: true },
].map((item) => ({
    ...item,
    memo_number: `MEMO-SYN-2026-${String(item.id).padStart(3, '0')}`,
    title: `Synthetic ${item.state.replaceAll('_', ' ')} memorandum`,
    classification: 'internal',
    published_at: `2026-11-${String(9 + item.id).padStart(2, '0')}T08:00:00+08:00`,
    recipients_count: 12,
    issuer: { name: 'Synthetic Municipal Administrator' },
    issuing_department: { name: department.name, short_name: department.shortName },
}));

export const announcements = [
    { id: 1, priority: 'important', title: 'Synthetic planning submission reminder' },
    { id: 2, priority: 'normal', title: 'Synthetic office coordination notice' },
    { id: 3, priority: 'normal', title: 'Synthetic records filing guidance' },
].map((item) => ({ ...item, body: 'Synthetic information for isolated evaluation only.', office: department.shortName, postedAt: FIXTURE_NOW }));

export const departmentHeadFixture = {
    department,
    metrics: {
        active: { label: 'Active office work', value: 17, link: '/work-requests?view=office_queue&status=in_progress' },
        requiresAction: { label: 'Needs Head action', value: 5, link: '/work-requests?view=needs_action' },
        overdue: { label: 'Overdue', value: 4, link: '/work-requests?view=overdue' },
        unassigned: { label: 'Unassigned', value: 3, link: '/work-requests?view=unassigned' },
    },
    statusOverview: [
        { status: 'for_review', count: 5 },
        { status: 'overdue', count: 4 },
        { status: 'due_soon', count: 5 },
        { status: 'unassigned', count: 3 },
        { status: 'in_progress', count: 5 },
    ],
    staffWorkload: departmentHeadStaff.map(({ name, position, active, overdue, requiresAction }) => ({ employee: name, position, active, overdue, requiresAction })),
    oldestUnresolved: departmentWorkRequests.filter((item) => item.category === 'overdue').map(({ category: _category, ...item }) => item),
    recentActivity: departmentWorkRequests.slice(0, 8).map((item, index) => ({
        id: index + 1,
        actionLabel: item.category === 'head_action' ? 'Head review requested' : 'Office work updated',
        reference: item.reference,
        title: item.title,
        actor: item.assignedEmployee?.name ?? 'Synthetic unassigned queue',
        createdAt: item.updatedAt,
        detailUrl: item.detailUrl,
    })),
    drilldowns: [
        { label: 'Needs Head action', href: '/work-requests?view=needs_action' },
        { label: 'Overdue office work', href: '/work-requests?view=overdue' },
        { label: 'Office documents', href: '/documents?office=MPDO' },
        { label: 'Departments & Offices', href: '/departments?view=directory' },
    ],
};

export const evaluationStates = ['default', 'empty', 'no_match', 'slow', 'retryable_failure', 'stale', 'session_expired', 'restricted'] as const;
export type EvaluationState = typeof evaluationStates[number];

export function workRequestDetailForRole(role: RoleKey, path: string, searchParams = new URLSearchParams()) {
    const match = path.match(/^\/(?:work-requests|transactions)\/(.+)$/);
    if (!match || !/^\d+$/.test(match[1])) return { kind: 'not_found' as const };
    const id = Number(match[1]);
    const item = departmentWorkRequests.find((candidate) => candidate.id === id);
    if (!item) return { kind: 'not_found' as const };
    const permitted = role === 'department_head' || (role === 'employee' && employeePersonalWorkRequests.some((candidate) => candidate.id === id));
    if (!permitted) return { kind: 'forbidden' as const };
    const requestedReturn = searchParams.get('return_to') || '';
    const returnTo = /^\/(?:transactions|work-requests)(?:\?|$)/.test(requestedReturn) && !requestedReturn.startsWith('//')
        ? requestedReturn
        : role === 'department_head' ? '/transactions?view=office_queue' : '/transactions?view=all';
    return {
        kind: 'detail' as const,
        item,
        returnTo,
        permissions: { canTransition: false, canMayorDecision: false, canAssign: false },
        mutationBoundary: 'disabled_no_persistence' as const,
    };
}

export function resolveStandalonePage(path: string, role: RoleKey, search: string): string | null {
    const state = new URLSearchParams(search).get('state') as EvaluationState | null;
    if (path === '/my-department') {
        if (state === 'session_expired') return 'Errors/Status';
        if (role !== 'department_head' || state === 'restricted') return 'Errors/403';
        return 'Departments/Workspace';
    }
    if (path === '/departments') return 'Departments/Index';
    if (path === '/transactions') return 'Transactions/Index';
    // A creation path is never a numeric detail ID. The isolated UI may display
    // the extracted form, but cannot persist any Work Request.
    if (path === '/transactions/create') {
        return role === 'employee' || role === 'department_head' ? 'Transactions/Create' : 'Errors/403';
    }
    if (/^\/(?:work-requests|transactions)\//.test(path)) {
        const detail = workRequestDetailForRole(role, path, new URLSearchParams(search));
        return detail.kind === 'detail' ? 'Transactions/Show' : detail.kind === 'forbidden' ? 'Errors/403' : 'Errors/Status';
    }
    if (/^\/correspondence\/\d+(?:\/workspace)?$/.test(path)) return 'Correspondence/Show';
    if (/^\/memoranda\/create$/.test(path)) return role === 'department_head' || role === 'executive_oversight' || role === 'system_administration' ? 'Memoranda/Create' : 'Errors/403';
    if (/^\/memoranda\/\d+$/.test(path)) return 'Memoranda/Show';
    if (/^\/records\/\d+$/.test(path)) return 'Documents/Index';
    if (/^\/employees\/\d+$/.test(path)) return ['employee', 'department_head', 'executive_oversight', 'hr'].includes(role) ? 'Employees/Show' : 'Errors/403';
    if (/^\/legislation\/create$/.test(path)) return role !== 'employee' ? 'Legislation/Create' : 'Errors/403';
    if (/^\/legislation\/\d+$/.test(path)) return 'Legislation/Show';
    if (/^\/hris\/admin\/development$/.test(path)) return role === 'hr' ? 'Hris/Development' : 'Errors/403';
    if (/^\/hris\/admin\/lifecycle\/\d+$/.test(path)) return role === 'hr' ? 'Hris/Lifecycle/Show' : 'Errors/403';
    if (/^\/hris\/admin\/lifecycle$/.test(path)) return role === 'hr' ? 'Hris/Lifecycle/Index' : 'Errors/403';
    if (/^\/hris\/admin\/offboarding\/\d+$/.test(path)) return role === 'hr' ? 'Hris/Offboarding/Show' : 'Errors/403';
    if (/^\/hris\/admin\/offboarding$/.test(path)) return role === 'hr' ? 'Hris/Offboarding/Index' : 'Errors/403';
    if (/^\/hris\/health-access$/.test(path)) return role === 'hr' ? 'Hris/HealthAccess' : 'Errors/403';
    if (/^\/hris\/health-vault$/.test(path)) return role === 'hr' ? 'Hris/HealthVault' : 'Errors/403';
    if (/^\/hris\/payroll$/.test(path)) return role === 'employee' || role === 'hr' ? 'Hris/Payroll' : 'Errors/403';
    if (/^\/hris\/attendance$/.test(path)) return 'Hris/Attendance';
    if (/^\/hris\/dashboard$/.test(path)) return role === 'employee' || role === 'hr' ? 'Hris/Dashboard' : 'Errors/403';
    if (/^\/hris\/admin$/.test(path)) return role === 'hr' ? 'Hris/Admin' : 'Errors/403';
    if (/^\/property\/lifecycle$/.test(path)) return role === 'system_administration' ? 'Property/Lifecycle' : 'Errors/403';
    if (/^\/security\/mfa$/.test(path)) return 'Auth/MfaSettings';
    if (/^\/logout$/.test(path)) return 'Auth/Login';
    if (/^\/travel-orders\/create$/.test(path)) return role === 'employee' || role === 'department_head' ? 'TravelOrders/Create' : 'Errors/403';
    if (/^\/travel-orders\/\d+$/.test(path)) return role === 'employee' || role === 'department_head' ? 'TravelOrders/Show' : 'Errors/403';
    return null;
}

export function resolveCatalogPage(requestedPage: string | null, role: RoleKey): string | null {
    if (!requestedPage) return null;
    if (requestedPage === 'Departments/Workspace' && role !== 'department_head') return 'Errors/403';
    if (requestedPage === 'Transactions/Show') return 'Errors/Status';
    return requestedPage;
}

export function departmentHeadWorkspaceFixture(state: EvaluationState = 'default') {
    if (state === 'empty') {
        return {
            ...departmentHeadFixture,
            metrics: Object.fromEntries(Object.entries(departmentHeadFixture.metrics).map(([key, metric]) => [key, { ...metric, value: 0 }])),
            statusOverview: [], staffWorkload: [], oldestUnresolved: [], recentActivity: [],
        };
    }
    return departmentHeadFixture;
}
