import { Link, usePage } from '@inertiajs/react';
import { buildPortalNavigation } from '../../navigation/portalNavigation';
import type { PortalDestinationKey } from '../../navigation/navigationTypes';
import type { SharedProps } from '../../types';

export default function PortalWorkspaceNav({ destinations, current }: { destinations: PortalDestinationKey[]; current: PortalDestinationKey }) {
    const { workspaceExperience, permissions } = usePage<SharedProps>().props;
    const available = buildPortalNavigation(workspaceExperience, permissions.navigation).flatMap((group) => group.items);
    return <nav aria-label="Related workspaces" className="municipal-workspace-nav">
        {destinations.map((key) => {
            const item = available.find((destination) => destination.key === key);
            return item ? <Link key={key} href={item.href} aria-current={key === current ? 'page' : undefined} className="municipal-workspace-link"><item.icon size={16} aria-hidden="true" />{item.label}</Link> : null;
        })}
    </nav>;
}
