import { Building2, CalendarDays, ClipboardList, FileText, LayoutDashboard, MessagesSquare, Settings, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { NavigationPermissions, WorkspaceExperience } from '../types';
import { buildPortalNavigation } from './portalNavigation';
import type { PortalDestinationKey } from './navigationTypes';

type ModuleDefinition = { key: string; title: string; icon: LucideIcon; destinations: PortalDestinationKey[] };
export type PortalModuleItem = { key: string; label: string; href?: string; status: 'available' | 'planned' };
export type PortalModule = { key: string; title: string; icon: LucideIcon; items: PortalModuleItem[] };

const modules: ModuleDefinition[] = [
    { key: 'home', title: 'Dashboard & Search', icon: LayoutDashboard, destinations: ['home', 'portalSearch'] },
    { key: 'organization', title: 'Organization & Offices', icon: Building2, destinations: ['executiveDepartments', 'employeeDirectory'] },
    { key: 'documents', title: 'Documents & Records', icon: FileText, destinations: ['documentCenter', 'records', 'correspondence', 'memoranda'] },
    { key: 'work', title: 'Work & Accountability', icon: ClipboardList, destinations: ['myWork'] },
    { key: 'calendar', title: 'Calendar', icon: CalendarDays, destinations: ['calendar'] },
    { key: 'communication', title: 'Internal Communication', icon: MessagesSquare, destinations: ['messages'] },
    { key: 'people', title: 'Employee Directory', icon: Users, destinations: ['employeeDirectory'] },
    { key: 'administration', title: 'Administration', icon: Settings, destinations: ['systemAdministration'] },
];

export const quickAccessDestinations: { key: PortalDestinationKey; label: string }[] = [
    { key: 'myWork', label: 'Work Requests' },
    { key: 'documentCenter', label: 'Document Center' },
    { key: 'correspondence', label: 'Correspondence' },
    { key: 'memoranda', label: 'Official Memoranda' },
    { key: 'calendar', label: 'Calendar' },
    { key: 'messages', label: 'Messages' },
    { key: 'executiveDepartments', label: 'Departments & Offices' },
    { key: 'employeeDirectory', label: 'Employee & Office Directory' },
];

// Resolve through the shell's existing visibility contract; the catalog owns no permissions.
export function buildPortalModuleCatalog(experience: WorkspaceExperience | null, permissions: NavigationPermissions): PortalModule[] {
    const destinations = new Map(buildPortalNavigation(experience, permissions).flatMap((group) => group.items).map((item) => [item.key, item]));
    return modules.map((module) => ({
        key: module.key,
        title: module.title,
        icon: module.icon,
        items: module.destinations.flatMap((key): PortalModuleItem[] => {
            const destination = destinations.get(key);
            return destination ? [{ key, label: destination.label, href: destination.href, status: 'available' }] : [];
        }),
    })).filter((module) => module.items.length > 0);
}
