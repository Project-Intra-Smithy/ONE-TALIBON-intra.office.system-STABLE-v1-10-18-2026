import { Link, usePage } from '@inertiajs/react';
import { buildPortalNavigation, type PortalDestinationKey } from '../../navigation/portalNavigation';
import type { SharedProps } from '../../types';

export default function PortalWorkspaceNav({
    destinations,
    current,
}: {
    destinations: PortalDestinationKey[];
    current: PortalDestinationKey;
}) {
    const { workspaceExperience, permissions } = usePage<SharedProps>().props;
    const available = buildPortalNavigation(workspaceExperience, permissions.navigation).flatMap((group) => group.items);
    const items = destinations
        .map((key) => available.find((destination) => destination.key === key))
        .filter((item): item is NonNullable<typeof item> => Boolean(item));

    if (items.length === 0) return null;

    return (
        <nav aria-label="Related workspaces" className="flex flex-wrap gap-2 border-b border-[var(--border-default)] pb-3">
            {items.map((item) => {
                const active = item.key === current;
                const Icon = item.icon;
                return (
                    <Link
                        key={item.key}
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3.5 text-sm font-semibold transition-colors ${
                            active
                                ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)] text-[var(--ink-primary)]'
                                : 'border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]'
                        }`}
                    >
                        <Icon size={16} aria-hidden="true" className={active ? 'text-[var(--brand-ink)]' : ''} />
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
