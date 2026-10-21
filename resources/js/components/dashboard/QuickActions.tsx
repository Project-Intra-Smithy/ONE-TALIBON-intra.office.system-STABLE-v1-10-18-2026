import { Link } from '@inertiajs/react';
import { LayoutGrid, ShieldCheck } from 'lucide-react';
import { portalDestinations } from '../../navigation/portalNavigation';
import { isStagedInertiaPath } from '../../navigation/stagedRoutes';
import type { DashboardExperience } from './types';

export default function QuickActions({ actions }: { actions: DashboardExperience['quickActions'] }) {
    const available = actions.filter((action) => isStagedInertiaPath(action.url));
    if (!available.length) return null;
    return <section className="municipal-panel p-4" aria-labelledby="dashboard-quick-actions">
        <h2 id="dashboard-quick-actions" className="municipal-panel-title"><LayoutGrid size={17} className="text-blue-800 dark:text-blue-300" />Quick Access</h2>
        <div className="workspace-action-grid mt-4">
            {available.map((action) => {
                const Icon = Object.values(portalDestinations).find((item) => action.url.split('?')[0] === item.href)?.icon || ShieldCheck;
                return <Link key={action.url} href={action.url} className="flex min-h-16 min-w-0 items-center gap-3 rounded-lg border border-slate-200 px-4 py-4 transition-colors duration-150 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                    <Icon size={20} className="shrink-0 text-[#1769aa] dark:text-blue-300" strokeWidth={1.8} aria-hidden="true" />
                    <div className="text-base font-semibold leading-6 text-slate-900 dark:text-slate-100">{action.label}</div>
                </Link>;
            })}
        </div>
    </section>;
}
