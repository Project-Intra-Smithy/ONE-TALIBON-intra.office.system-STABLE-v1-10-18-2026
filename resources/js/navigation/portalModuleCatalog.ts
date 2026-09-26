import { BookOpen, Building2, CalendarDays, ChartNoAxesCombined, ClipboardList, FileText, FolderKanban, Landmark, LayoutDashboard, Library, MessagesSquare, Network, Settings, Users, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { NavigationPermissions, WorkspaceExperience } from '../types';
import { buildPortalNavigation } from './portalNavigation';
import type { PortalDestinationKey } from './navigationTypes';

type ModuleDefinition = { key: string; title: string; icon: LucideIcon; destinations: PortalDestinationKey[]; planned?: string[] };
export type PortalModuleItem = { key: string; label: string; href?: string; status: 'available' | 'planned' };
export type PortalModule = { key: string; title: string; icon: LucideIcon; items: PortalModuleItem[] };

const modules: ModuleDefinition[] = [
    { key: 'home', title: 'Dashboard', icon: LayoutDashboard, destinations: ['home', 'portalSearch', 'announcements'] },
    { key: 'offices', title: 'Executive Offices & Departments', icon: Building2, destinations: ['executiveDepartments'] },
    { key: 'ppas', title: 'Programs, Projects & Activities', icon: ClipboardList, destinations: ['ppas'] },
    { key: 'projects', title: 'Project Monitoring', icon: FolderKanban, destinations: ['projectMonitoring'] },
    { key: 'plans', title: 'LGU Development Plans', icon: BookOpen, destinations: ['developmentPlans'] },
    { key: 'bodies', title: 'Local Special Bodies', icon: Network, destinations: ['localSpecialBodies'] },
    { key: 'documents', title: 'Documents & Correspondence', icon: FileText, destinations: ['documentCenter', 'records', 'correspondence', 'memoranda', 'legislative'] },
    { key: 'work', title: 'Tasks & Workflow', icon: ClipboardList, destinations: ['myWork'] },
    { key: 'calendar', title: 'Calendar & Meetings', icon: CalendarDays, destinations: ['calendar', 'meetings'] },
    { key: 'communication', title: 'Internal Communication', icon: MessagesSquare, destinations: ['messages', 'announcements'] },
    { key: 'analytics', title: 'Data & Analytics', icon: ChartNoAxesCombined, destinations: [], planned: ['Municipal analytics'] },
    { key: 'hr', title: 'Human Resource', icon: Users, destinations: ['employeeDirectory'], planned: ['Human resource services'] },
    { key: 'finance', title: 'Finance & Procurement', icon: Wallet, destinations: [], planned: ['Finance and procurement services'] },
    { key: 'forms', title: 'Forms & Templates', icon: FileText, destinations: [], planned: ['Forms library'] },
    { key: 'directory', title: 'Directory', icon: Landmark, destinations: ['employeeDirectory', 'executiveDepartments'] },
    { key: 'knowledge', title: 'Knowledge Hub', icon: Library, destinations: [], planned: ['Knowledge resources'] },
    { key: 'systems', title: 'Systems / Apps', icon: Settings, destinations: ['municipalSystems', 'systemAdministration'] },
    { key: 'account', title: 'My Account', icon: Users, destinations: [], planned: ['Account workspace'] },
];

export const quickAccessDestinations: { key: PortalDestinationKey; label: string }[] = [
    { key: 'documentCenter', label: 'Document Center' },
    { key: 'memoranda', label: 'Issuances & Memoranda' },
    { key: 'ppas', label: 'Projects & PPAs' },
    { key: 'calendar', label: 'Calendar & Meetings' },
    { key: 'announcements', label: 'Announcements' },
    { key: 'myWork', label: 'Tasks & Assignments' },
    { key: 'executiveDepartments', label: 'Departments & Offices' },
    { key: 'developmentPlans', label: 'LGU Plans Library' },
];

// Resolve through the shell's existing visibility contract; the catalog owns no permissions.
export function buildPortalModuleCatalog(experience: WorkspaceExperience | null, permissions: NavigationPermissions): PortalModule[] {
    const destinations = new Map(buildPortalNavigation(experience, permissions).flatMap((group) => group.items).map((item) => [item.key, item]));
    return modules.map((module) => ({
        key: module.key, title: module.title, icon: module.icon,
        items: [
            ...module.destinations.flatMap((key): PortalModuleItem[] => {
                const destination = destinations.get(key);
                return destination ? [{ key, label: destination.label, href: destination.href, status: 'available' }] : [];
            }),
            ...(module.planned ?? []).map((label): PortalModuleItem => ({ key: label, label, status: 'planned' })),
        ],
    })).filter((module) => module.items.length > 0);
}
