// FRONTEND-REG-001-COMPAT-FIX-R2: backend-owned destination identity and readiness.

// Navigation links additionally require a supported local staged Inertia page.

import {
    AppWindow,
    BookOpen,
    Building2,
    CalendarClock,
    CalendarDays,
    FileSearch,
    FileText,
    FolderKanban,
    Inbox,
    Landmark,
    LayoutDashboard,
    ListChecks,
    Megaphone,
    MessagesSquare,
    Network,
    Settings,
    UserCog,
    Users,
    type LucideIcon,
} from 'lucide-react';

import type { NavigationPermissions, WorkspaceExperience } from '../types';

import { isStagedInertiaPath } from './stagedRoutes';

export type PortalGroupKey =
    | 'home'
    | 'work'
    | 'files'
    | 'communication'
    | 'schedule'
    | 'people'
    | 'organization'
    | 'planning'
    | 'administration'
    | 'systems';

export type PortalDestinationKey =
    | 'portalSearch'
    | 'documentCenter'
    | 'home'
    | 'myDepartment'
    | 'myWork'
    | 'correspondence'
    | 'procurementTracking'
    | 'records'
    | 'memoranda'
    | 'announcements'
    | 'calendar'
    | 'meetings'
    | 'messages'
    | 'executiveDepartments'
    | 'employeeDirectory'
    | 'legislative'
    | 'localSpecialBodies'
    | 'developmentPlans'
    | 'ppas'
    | 'projectMonitoring'
    | 'users'
    | 'adminDepartments'
    | 'systemAdministration'
    | 'municipalSystems';

export type PortalRouteReadiness = 'wired' | 'integration_pending';

export type PortalDestination = {
    key: PortalDestinationKey;
    label: string;
    href: string;
    icon: LucideIcon;
    group: PortalGroupKey;
    readiness: PortalRouteReadiness;
    permission?: keyof NavigationPermissions;
    experiences?: WorkspaceExperience[];
};

export type PortalNavigationItem = PortalDestination;

export type PortalNavigationGroup = {
    key: PortalGroupKey;
    label: string;
    items: PortalNavigationItem[];
};

export const portalRoutePlan = {
    home: '/dashboard',
    myDepartment: '/dashboard#department-overview',
    portalSearch: '/portal-search',
    documentCenter: '/documents',
    myWork: '/transactions',
    correspondence: '/correspondence',
    procurementTracking: '/procurement',
    records: '/records',
    memoranda: '/memoranda',
    announcements: '/announcements',
    calendar: '/calendar',
    meetings: '/meetings',
    messages: '/messages',
    executiveDepartments: '/departments',
    employeeDirectory: '/employees',
    legislative: '/legislation',
    localSpecialBodies: '/local-special-bodies',
    developmentPlans: '/development-plans',
    ppas: '/ppas',
    projectMonitoring: '/operations',
    users: '/admin/users',
    adminDepartments: '/admin/departments',
    systemAdministration: '/admin',
    municipalSystems: '/municipal-systems',
} satisfies Record<PortalDestinationKey, string>;

export const portalDestinations: Partial<Record<PortalDestinationKey, PortalDestination>> = {
    portalSearch: { key: 'portalSearch', label: 'Search Portal', href: portalRoutePlan.portalSearch, icon: FileSearch, group: 'home', readiness: 'wired' },
    documentCenter: { key: 'documentCenter', label: 'Document Center', href: portalRoutePlan.documentCenter, icon: FileText, group: 'files', readiness: 'wired', permission: 'records' },
    home: { key: 'home', label: 'Home', href: portalRoutePlan.home, icon: LayoutDashboard, group: 'home', readiness: 'wired', permission: 'dashboard' },
    myDepartment: { key: 'myDepartment', label: 'My Department', href: portalRoutePlan.myDepartment, icon: Building2, group: 'work', readiness: 'wired', permission: 'dashboard', experiences: ['department_head'] },
    myWork: { key: 'myWork', label: 'Work Requests', href: portalRoutePlan.myWork, icon: FileText, group: 'work', readiness: 'wired', permission: 'transactions' },
    correspondence: { key: 'correspondence', label: 'Correspondence', href: portalRoutePlan.correspondence, icon: Inbox, group: 'work', readiness: 'wired', permission: 'correspondence' },
    procurementTracking: { key: 'procurementTracking', label: 'Procurement / PR Tracking', href: portalRoutePlan.procurementTracking, icon: ListChecks, group: 'work', readiness: 'integration_pending' },
    employeeDirectory: { key: 'employeeDirectory', label: 'Employee & Office Directory', href: portalRoutePlan.employeeDirectory, icon: Users, group: 'people', readiness: 'wired' },
    records: { key: 'records', label: 'Municipal Records', href: portalRoutePlan.records, icon: FileSearch, group: 'files', readiness: 'wired', permission: 'records' },
    memoranda: { key: 'memoranda', label: 'Official Memoranda', href: portalRoutePlan.memoranda, icon: FileText, group: 'files', readiness: 'wired', permission: 'memoranda' },
    announcements: { key: 'announcements', label: 'Announcements', href: portalRoutePlan.announcements, icon: Megaphone, group: 'communication', readiness: 'integration_pending' },
    calendar: { key: 'calendar', label: 'Calendar', href: portalRoutePlan.calendar, icon: CalendarDays, group: 'schedule', readiness: 'wired' },
    meetings: { key: 'meetings', label: 'Meetings', href: portalRoutePlan.meetings, icon: CalendarClock, group: 'schedule', readiness: 'integration_pending' },
    messages: { key: 'messages', label: 'Messages', href: portalRoutePlan.messages, icon: MessagesSquare, group: 'communication', readiness: 'wired' },
    executiveDepartments: { key: 'executiveDepartments', label: 'Executive Departments', href: portalRoutePlan.executiveDepartments, icon: Building2, group: 'organization', readiness: 'wired', permission: 'departments' },
    legislative: { key: 'legislative', label: 'Ordinances & Issuances', href: portalRoutePlan.legislative, icon: Landmark, group: 'organization', readiness: 'integration_pending' },
    localSpecialBodies: { key: 'localSpecialBodies', label: 'Councils, Boards & Committees', href: portalRoutePlan.localSpecialBodies, icon: Network, group: 'organization', readiness: 'integration_pending' },
    developmentPlans: { key: 'developmentPlans', label: 'Development Plans', href: portalRoutePlan.developmentPlans, icon: BookOpen, group: 'planning', readiness: 'integration_pending' },
    ppas: { key: 'ppas', label: 'PPAs', href: portalRoutePlan.ppas, icon: ListChecks, group: 'planning', readiness: 'integration_pending' },
    projectMonitoring: { key: 'projectMonitoring', label: 'Project Monitoring', href: portalRoutePlan.projectMonitoring, icon: FolderKanban, group: 'planning', readiness: 'integration_pending', experiences: ['department_head', 'executive_oversight', 'system_administration'] },
    users: { key: 'users', label: 'Users', href: portalRoutePlan.users, icon: UserCog, group: 'administration', readiness: 'integration_pending', permission: 'systemAdministration' },
    adminDepartments: { key: 'adminDepartments', label: 'Departments', href: portalRoutePlan.adminDepartments, icon: Building2, group: 'administration', readiness: 'integration_pending', permission: 'systemAdministration' },
    systemAdministration: { key: 'systemAdministration', label: 'System Administration', href: portalRoutePlan.systemAdministration, icon: Settings, group: 'administration', readiness: 'wired', permission: 'systemAdministration' },
    municipalSystems: { key: 'municipalSystems', label: 'Future Integrations', href: portalRoutePlan.municipalSystems, icon: AppWindow, group: 'systems', readiness: 'integration_pending' },
};

export const portalGroupOrder: PortalGroupKey[] = [
    'home',
    'work',
    'files',
    'communication',
    'schedule',
    'people',
    'organization',
    'planning',
    'administration',
    'systems',
];

export const portalGroupLabels: Record<PortalGroupKey, string> = {
    home: 'Home',
    work: 'Work & Routing',
    files: 'Files & Records',
    communication: 'Communication',
    schedule: 'Schedule & Coordination',
    people: 'People',
    organization: 'Municipal Organization',
    planning: 'Planning',
    administration: 'Administration',
    systems: 'Municipal Systems',
};

export const portalDestinationOrder: PortalDestinationKey[] = [
    'home',
    'myDepartment',
    'portalSearch',
    'documentCenter',
    'myWork',
    'correspondence',
    'procurementTracking',
    'employeeDirectory',
    'records',
    'memoranda',
    'announcements',
    'calendar',
    'meetings',
    'messages',
    'executiveDepartments',
    'legislative',
    'localSpecialBodies',
    'developmentPlans',
    'ppas',
    'projectMonitoring',
    'users',
    'adminDepartments',
    'systemAdministration',
    'municipalSystems',
];

// These server permission flags must never be conflated with destination keys.
function isPortalDestinationVisible(
    destination: PortalDestination,
    experience: WorkspaceExperience | null,
    permissions: NavigationPermissions,
): boolean {
    if (destination.readiness !== 'wired' || !isStagedInertiaPath(destination.href)) return false;
    if (destination.permission && !permissions[destination.permission]) return false;
    if (destination.experiences && (!experience || !destination.experiences.includes(experience))) return false;
    return true;
}

export const plannedPortalDestinations = portalDestinationOrder
    .map((key) => portalDestinations[key])
    .filter((destination): destination is PortalDestination => Boolean(destination));

export const wiredPortalDestinations = plannedPortalDestinations.filter(
    (destination) => destination.readiness === 'wired',
);

export const integrationPendingPortalDestinations = plannedPortalDestinations.filter(
    (destination) => destination.readiness === 'integration_pending',
);

export function buildPortalNavigation(
    experience: WorkspaceExperience | null,
    permissions: NavigationPermissions,
    _reportsAllowed = false,
): PortalNavigationGroup[] {
    return portalGroupOrder
        .map((groupKey): PortalNavigationGroup => ({
            key: groupKey,
            label: portalGroupLabels[groupKey],
            items: wiredPortalDestinations.filter(
                (destination) => destination.group === groupKey
                    && isPortalDestinationVisible(destination, experience, permissions),
            ),
        }))
        .filter((group) => group.items.length > 0);
}

export function isPortalPathActive(currentUrl: string, href: string): boolean {
    const path = (currentUrl.split(/[?#]/, 1)[0] || '/').replace(/\/$/, '') || '/';
    const hash = currentUrl.split('#')[1];
    const targetHash = href.split('#')[1];
    if (targetHash && targetHash !== hash) return false;
    if (!targetHash && href === '/dashboard' && hash === 'department-overview') return false;
    const target = href.split(/[?#]/, 1)[0].replace(/\/$/, '') || '/';

    return path === target || (target !== '/' && path.startsWith(`${target}/`));
}
