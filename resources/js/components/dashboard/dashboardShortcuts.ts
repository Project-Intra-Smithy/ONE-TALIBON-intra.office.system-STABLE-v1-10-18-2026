/**
 * Visual-only shortcut composition. Server-owned role actions are retained first;
 * additional module shortcuts must come exclusively from the permission-filtered
 * portal navigation inventory. This function grants no new access.
 */
export type RoleQuickAction = { label: string; url: string };
export type PermittedDestination = { key: string; label: string; href: string };
export type DashboardShortcut = { label: string; href: string; key?: string };

const modulePriority = [
    'documentCenter',
    'calendar',
    'messages',
    'myWork',
    'memoranda',
    'employeeDirectory',
    'records',
    'correspondence',
] as const;

function routePath(href: string): string {
    return href.split(/[?#]/, 1)[0].replace(/\/$/, '') || '/';
}

export function selectDashboardShortcuts(
    roleActions: readonly RoleQuickAction[],
    permittedDestinations: readonly PermittedDestination[],
    limit = 8,
): DashboardShortcut[] {
    if (limit <= 0) return [];
    const shortcuts: DashboardShortcut[] = [];
    const shownPaths = new Set<string>();

    for (const action of roleActions) {
        if (!action.url.startsWith('/') || action.url.startsWith('//')) continue;
        const path = routePath(action.url);
        if (shownPaths.has(path)) continue;
        shortcuts.push({ label: action.label, href: action.url });
        shownPaths.add(path);
        if (shortcuts.length === limit) return shortcuts;
    }

    for (const key of modulePriority) {
        const destination = permittedDestinations.find((item) => item.key === key);
        if (!destination || !destination.href.startsWith('/') || destination.href.startsWith('//')) continue;
        const path = routePath(destination.href);
        if (shownPaths.has(path)) continue;
        shortcuts.push({ label: destination.label, href: destination.href, key: destination.key });
        shownPaths.add(path);
        if (shortcuts.length === limit) break;
    }
    return shortcuts;
}
