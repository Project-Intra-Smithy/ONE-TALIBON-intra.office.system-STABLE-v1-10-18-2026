import { Link, usePage } from '@inertiajs/react';
import { buildPortalNavigation } from '../../navigation/portalNavigation';
import type { PortalDestinationKey } from '../../navigation/navigationTypes';
import type { SharedProps } from '../../types';

export default function PortalWorkspaceNav({ destinations, current }: { destinations: PortalDestinationKey[]; current: PortalDestinationKey }) {
    const { workspaceExperience, permissions } = usePage<SharedProps>().props;
    const available = buildPortalNavigation(workspaceExperience, permissions.navigation).flatMap((group) => group.items);
    return <nav aria-label="Related workspaces" className="flex min-w-0 flex-wrap gap-1 border-b border-[var(--municipal-border)] pb-2">
        {destinations.map((key) => {
            const item = available.find((destination) => destination.key === key);
            return item ? <Link key={key} href={item.href} aria-current={key === current ? 'page' : undefined} className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold ${key === current ? 'bg-[var(--municipal-brand-soft)] text-[var(--municipal-brand)]' : 'text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)]'}`}><item.icon size={16} aria-hidden="true" />{item.label}</Link> : null;
        })}
    </nav>;
}
