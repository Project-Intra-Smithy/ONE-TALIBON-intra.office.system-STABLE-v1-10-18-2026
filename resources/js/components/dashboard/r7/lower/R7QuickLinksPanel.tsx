import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, Link2 } from 'lucide-react';
import { buildPortalNavigation } from '../../../../navigation/portalNavigation';
import { isStagedInertiaPath } from '../../../../navigation/stagedRoutes';
import type { SharedProps } from '../../../../types';
import { selectDashboardShortcuts } from '../../dashboardShortcuts';
import type { DashboardExperience } from '../../types';

function pathOf(href: string): string {
    return href.split(/[?#]/, 1)[0].replace(/\/$/, '') || '/';
}

/** An action may address a staged child page, but its parent module must be permitted. */
function isUnderDestination(href: string, destinationHref: string): boolean {
    const path = pathOf(href);
    const permittedPath = pathOf(destinationHref);
    return path === permittedPath || (permittedPath !== '/' && path.startsWith(permittedPath + "/"));
}

export default function R7QuickLinksPanel({ actions }: { actions: DashboardExperience['quickActions'] }) {
    const page = usePage<SharedProps>().props;
    const permitted = buildPortalNavigation(
        page.workspaceExperience,
        page.permissions?.navigation ?? {} as SharedProps['permissions']['navigation'],
    ).flatMap((group) => group.items).filter((destination) => isStagedInertiaPath(destination.href));

    // A server-supplied quick action is eligible only if its staged destination also
    // belongs to the current user's permitted navigation inventory.
    const allowedActions = actions.filter((action) => isStagedInertiaPath(action.url)
        && permitted.some((destination) => isUnderDestination(action.url, destination.href)));
    const links = selectDashboardShortcuts(allowedActions, permitted, 6);

    return <section className="r7-lower-card r7-lower-links" aria-labelledby="r7-links-title">
        <h2 className="r7-lower-title" id="r7-links-title">
            <Link2 size={18} aria-hidden="true" /> Quick links
        </h2>
        <div className="r7-links-content">
            {links.length === 0 ? <p className="r7-links-note r7-no-links">No quick links are available to your account.</p> :
                <ul className="r7-links-tiles" aria-label="Available workspaces">
                    {links.map((link) => {
                        const destination = permitted.find((item) => isUnderDestination(link.href, item.href));
                        const Icon = destination?.icon ?? LayoutGrid;
                        return <li key={link.href}>
                            <Link href={link.href} className="r7-links-tile" aria-label={"Open " + link.label}>
                                <span className="r7-links-icon"><Icon size={21} strokeWidth={1.8} aria-hidden="true" /></span>
                                <span className="r7-links-label">{link.label}</span>
                            </Link>
                        </li>;
                    })}
                </ul>}
        </div>
    </section>;
}
