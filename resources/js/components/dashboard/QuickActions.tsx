import { Link } from '@inertiajs/react';
import { LayoutGrid, ShieldCheck } from 'lucide-react';
import { portalDestinations } from '../../navigation/portalNavigation';
import { isStagedInertiaPath } from '../../navigation/stagedRoutes';
import type { DashboardExperience } from './types';

const tileColors = ['#eaf5ed', '#eaf3fe', '#fff5df', '#fff0ec', '#f1ecfc', '#e7f5f4', '#f6f1e3', '#fbeaf1'];
const iconColors = ['#166534', '#1768b5', '#996410', '#b73343', '#7252a8', '#147d76', '#785919', '#a82766'];

export default function QuickActions({ actions }: { actions: DashboardExperience['quickActions'] }) {
    const available = actions.filter((action) => isStagedInertiaPath(action.url));
    if (!available.length) return null;
    return <section className="ot-dashboard-quick" aria-labelledby="dashboard-quick-actions">
        <h2 id="dashboard-quick-actions"><LayoutGrid size={18} aria-hidden="true" /> Quick Access</h2>
        <div className="ot-dashboard-tiles">
            {available.map((action, index) => {
                const Icon = Object.values(portalDestinations).find((item) => action.url.split('?')[0] === item.href)?.icon || ShieldCheck;
                return <Link key={action.url} href={action.url} className="ot-dashboard-tile">
                    <span className="ot-dashboard-tile-icon" style={{ backgroundColor: tileColors[index % tileColors.length], color: iconColors[index % iconColors.length] }}><Icon size={26} strokeWidth={1.8} aria-hidden="true" /></span>
                    <span className="ot-dashboard-tile-label">{action.label}</span>
                </Link>;
            })}
        </div>
    </section>;
}
