import { Link, usePage } from '@inertiajs/react';
import { quickAccessDestinations } from '../../navigation/portalModuleCatalog';
import { buildPortalNavigation } from '../../navigation/portalNavigation';
import type { SharedProps } from '../../types';

export default function PortalQuickAccess() {
    const { workspaceExperience, permissions } = usePage<SharedProps>().props;
    const available = buildPortalNavigation(workspaceExperience, permissions.navigation).flatMap((group) => group.items);
    return <section aria-labelledby="portal-quick-access" className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 id="portal-quick-access" className="employee-section-title">Quick Access</h2>
            <a href="#portal-menu-overview" className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--municipal-brand)]">Explore all modules</a>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 2xl:grid-cols-8">
            {quickAccessDestinations.map(({ key, label }) => {
                const destination = available.find((item) => item.key === key);
                if (!destination) return null;
                const Icon = destination.icon;
                return <Link key={key} href={destination.href} className="municipal-panel flex min-h-24 min-w-0 flex-col items-start justify-center gap-2 p-3 text-sm font-semibold leading-5 hover:bg-[var(--municipal-brand-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--municipal-brand)]">
                    <Icon size={22} className="text-[var(--municipal-brand)]" aria-hidden="true" />
                    <span>{label}</span>
                </Link>;
            })}
        </div>
    </section>;
}
