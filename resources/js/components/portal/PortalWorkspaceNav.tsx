import { Link, usePage } from '@inertiajs/react';
import { buildPortalNavigation } from '../../navigation/portalNavigation';
import type { PortalDestinationKey } from '../../navigation/navigationTypes';
import type { SharedProps } from '../../types';

export default function PortalWorkspaceNav({ destinations, current }: { destinations: PortalDestinationKey[]; current: PortalDestinationKey }) {
    const { workspaceExperience, permissions } = usePage<SharedProps>().props;
    const available = buildPortalNavigation(workspaceExperience, permissions.navigation).flatMap((group) => group.items);
    return <nav aria-label="Related workspaces" className="municipal-workspace-nav flex flex-wrap items-center gap-2">
        {destinations.map((key) => {
            const item = available.find((destination) => destination.key === key);
            const active = key === current;
            return item ? (
                <Link
                    key={key}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`municipal-workspace-link inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active
                            ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)] text-[var(--brand-ink)]'
                            : 'border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]'
                    }`}
                >
                    <item.icon size={15} aria-hidden="true" />
                    <span>{item.label}</span>
                </Link>
            ) : null;
        })}
    </nav>;
}
