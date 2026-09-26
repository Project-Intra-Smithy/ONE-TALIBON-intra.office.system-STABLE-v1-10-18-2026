import QuickAccessTile from './QuickAccessTile';
import { usePage } from '@inertiajs/react';
import { quickAccessDestinations } from '../../navigation/portalModuleCatalog';
import { buildPortalNavigation } from '../../navigation/portalNavigation';
import type { SharedProps } from '../../types';

export default function PortalQuickAccess() {
    const { workspaceExperience, permissions } = usePage<SharedProps>().props;
    const available = buildPortalNavigation(workspaceExperience, permissions.navigation).flatMap((group) => group.items);
    return <section aria-labelledby="portal-quick-access" className="min-w-0">
        <div className="dashboard-quick-heading">
            <h2 id="portal-quick-access" className="dashboard-quick-title">Quick Access</h2>
            <a href="#portal-menu-overview" className="dashboard-directory-link">Explore all modules</a>
        </div>
        <div className="dashboard-quick-grid">
            {quickAccessDestinations.map(({ key, label }) => {
                const destination = available.find((item) => item.key === key);
                if (!destination) return null;
                return <QuickAccessTile key={key} destinationKey={key} label={label} href={destination.href} icon={destination.icon} />;
            })}
        </div>
    </section>;
}
