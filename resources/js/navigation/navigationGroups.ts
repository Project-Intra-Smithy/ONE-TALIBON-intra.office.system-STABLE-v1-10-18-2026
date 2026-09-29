import type { PortalGroupKey } from './navigationTypes';

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
