import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, ShieldCheck } from 'lucide-react';
import { buildPortalNavigation, portalDestinations } from '../../navigation/portalNavigation';
import { isStagedInertiaPath } from '../../navigation/stagedRoutes';
import type { SharedProps } from '../../types';
import { selectDashboardShortcuts } from './dashboardShortcuts';
import type { DashboardExperience } from './types';

const tileColors = ['#eaf5ed', '#eaf3fe', '#fff5df', '#fff0ec', '#f1ecfc', '#e7f5f4', '#f6f1e3', '#fbeaf1'];
const iconColors = ['#166534', '#1768b5', '#996410', '#b73343', '#7252a8', '#147d76', '#785919', '#a82766'];

export default function QuickActions({ actions }: { actions: DashboardExperience['quickActions'] }) {
    const page = usePage<SharedProps>().props;
    // Build from the same permission-filtered route inventory as the authenticated sidebar.
    // This does not activate the staged/authority-pending catalog destinations.
    const permitted = buildPortalNavigation(page.workspaceExperience, page.permissions?.navigation ?? {} as SharedProps['permissions']['navigation'])
        .flatMap((group) => group.items);
    const safeActions = actions.filter((action) => isStagedInertiaPath(action.url));
    const available = selectDashboardShortcuts(safeActions, permitted);
    if (!available.length) return null;

    return <section className="ot-dashboard-quick" aria-labelledby="dashboard-quick-actions">
        <div className="ot-dashboard-quick-heading">
            <h2 id="dashboard-quick-actions"><LayoutGrid size={17} aria-hidden="true" /> Portal modules</h2>
            <span className="ot-dashboard-quick-note">Available to your account</span>
        </div>
        <div className="ot-dashboard-tiles">
            {available.map((shortcut, index) => {
                const destination = shortcut.key
                    ? portalDestinations[shortcut.key as keyof typeof portalDestinations]
                    : Object.values(portalDestinations).find((item) => shortcut.href.split('?')[0] === item.href);
                const Icon = destination?.icon || ShieldCheck;
                return <Link key={shortcut.href} href={shortcut.href} className="ot-dashboard-tile" aria-label={`Open ${shortcut.label}`}>
                    <span className="ot-dashboard-tile-icon" style={{ backgroundColor: tileColors[index % tileColors.length], color: iconColors[index % iconColors.length] }}>
                        <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <span className="ot-dashboard-tile-label">{shortcut.label}</span>
                </Link>;
            })}
        </div>
    </section>;
}
