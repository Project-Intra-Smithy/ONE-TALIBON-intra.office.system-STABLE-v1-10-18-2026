import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { isStagedInertiaPath } from '../../navigation/stagedRoutes';
import DashboardSection from './DashboardSection';
import type { DashboardExperience } from './types';

export default function QuickActions({ actions }: { actions: DashboardExperience['quickActions'] }) {
    const available = actions.filter((action) => isStagedInertiaPath(action.url));
    if (!available.length) return null;
    return <DashboardSection title="Quick Access">
        <ul className="dashboard-list">
            {available.map((action) => <li key={action.url}>
                <Link href={action.url} className="dashboard-action">
                    <span><strong>{action.label}</strong><span className="dashboard-description">{action.description}</span></span>
                    <ArrowRight size={18} aria-hidden="true" />
                </Link>
            </li>)}
        </ul>
    </DashboardSection>;
}
