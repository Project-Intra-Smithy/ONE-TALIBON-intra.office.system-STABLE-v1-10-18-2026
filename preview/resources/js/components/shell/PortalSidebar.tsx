import { Link, router } from '@inertiajs/react';
import { ChevronDown, ChevronRight, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useState } from 'react';
import { getUserInitials } from '../../lib/userIdentity';
import { isPortalPathActive, type PortalNavigationGroup } from '../../navigation/portalNavigation';
import type { AuthUser } from '../../types';
import AppearanceControl from '../AppearanceControl';
import LocaleControl from '../LocaleControl';
import MunicipalBrand from '../MunicipalBrand';

type Props = {
    collapsed: boolean;
    currentUrl: string;
    mobile?: boolean;
    navigationGroups: PortalNavigationGroup[];
    onNavigate?: () => void;
    onToggleCollapsed?: () => void;
    unreadMemoCount: number;
    user: AuthUser | null;
};

export default function PortalSidebar({
    collapsed,
    currentUrl,
    mobile = false,
    navigationGroups,
    onNavigate,
    onToggleCollapsed,
    unreadMemoCount,
    user,
}: Props) {
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const compact = !mobile && collapsed;
    const position = user?.employee?.position;
    const department = user?.employee?.department?.short_name || user?.employee?.department?.name;
    const secondaryIdentity = [department, position].filter(Boolean).join(' · ');
    const identityTitle = [user?.name, position, department].filter(Boolean).join(' · ');

    return (
        <div className="flex h-full flex-col border-r border-[var(--surface-sidebar-border)] bg-[var(--surface-sidebar)] text-[var(--surface-sidebar-ink)]">
            <div className={`shrink-0 border-b border-[var(--surface-sidebar-border)] ${compact ? 'px-2 py-3' : 'px-3.5 py-3'}`}>
                <div className={compact ? 'flex flex-col items-center gap-2' : 'flex min-w-0 items-center justify-between gap-2'}>
                    <div className="min-w-0">
                        <MunicipalBrand compact inverse iconOnly={compact} />
                    </div>
                    {!mobile && (
                        <button
                            type="button"
                            onClick={onToggleCollapsed}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/15 text-[var(--surface-sidebar-ink)] transition-colors hover:bg-[var(--surface-sidebar-hover)] focus-visible:outline-[var(--focus-ring-sidebar)]"
                            aria-label={compact ? 'Expand navigation' : 'Collapse navigation'}
                            aria-expanded={!compact}
                            title={compact ? 'Expand navigation' : 'Collapse navigation'}
                        >
                            {compact ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
                        </button>
                    )}
                </div>
            </div>

            <nav
                className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto ${compact ? 'px-2 py-3' : 'px-3 py-3'}`}
                aria-label="Primary navigation"
            >
                <div className="space-y-3">
                    {navigationGroups.map((group) => {
                        const groupActive = group.items.some((item) => isPortalPathActive(currentUrl, item.href));
                        const expandable = !compact && !groupActive && !['home', 'work', 'files'].includes(group.key) && group.items.length > 1;
                        const expanded = groupActive || expandedGroups[group.key] === true;
                        const groupContentId = `sidebar-group-${group.key}-${mobile ? 'mobile' : 'desktop'}`;

                        return (
                            <section key={group.key} aria-label={group.label}>
                                {!compact && group.key !== 'home' && (
                                    expandable ? (
                                        <button
                                            type="button"
                                            className="mb-1 flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-2.5 text-left text-xs font-bold uppercase tracking-wider text-[var(--surface-sidebar-muted)] hover:bg-[var(--surface-sidebar-hover)] hover:text-white focus-visible:outline-[var(--focus-ring-sidebar)]"
                                            onClick={() => setExpandedGroups((current) => ({ ...current, [group.key]: !expanded }))}
                                            aria-expanded={expanded}
                                            aria-controls={groupContentId}
                                        >
                                            <span>{group.label}</span>
                                            {expanded ? <ChevronDown size={15} aria-hidden="true" /> : <ChevronRight size={15} aria-hidden="true" />}
                                        </button>
                                    ) : (
                                        <div className="mb-1 px-2.5 pt-1 text-xs font-bold uppercase tracking-wider text-[var(--surface-sidebar-muted)]">
                                            {group.label}
                                        </div>
                                    )
                                )}

                                <div id={groupContentId} hidden={expandable && !expanded} className="space-y-0.5">
                                    {group.items.map(({ key, label, href, icon: Icon }) => {
                                        const active = isPortalPathActive(currentUrl, href);
                                        const hasMemoCount = key === 'memoranda' && unreadMemoCount > 0;
                                        const accessibleLabel = hasMemoCount ? `${label}, ${unreadMemoCount} unread` : label;

                                        return (
                                            <Link
                                                key={key}
                                                href={href}
                                                onClick={() => {
                                                    onNavigate?.();
                                                    const target = href.split('#')[1];
                                                    if (target && window.location.pathname === href.split('#')[0]) {
                                                        requestAnimationFrame(() => document.getElementById(target)?.focus());
                                                    }
                                                }}
                                                aria-current={active ? 'page' : undefined}
                                                aria-label={compact ? (key === 'ppas' ? 'Programs, Projects and Activities (PPAs)' : accessibleLabel) : undefined}
                                                title={key === 'ppas' ? 'Programs, Projects and Activities (PPAs)' : compact ? accessibleLabel : undefined}
                                                className={`relative flex min-h-11 items-center rounded-lg py-2 text-sm font-medium transition-colors focus-visible:outline-[var(--focus-ring-sidebar)] ${
                                                    compact ? 'justify-center px-2' : 'gap-2.5 px-3'
                                                } ${
                                                    active
                                                        ? 'bg-[var(--surface-sidebar-active)] font-bold text-[var(--surface-sidebar-active-ink)] before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-r before:bg-[var(--accent-gold)]'
                                                        : 'text-[var(--surface-sidebar-ink)] hover:bg-[var(--surface-sidebar-hover)] hover:text-white'
                                                }`}
                                            >
                                                <Icon size={18} aria-hidden="true" className="shrink-0" />
                                                {!compact && <span className="min-w-0 flex-1 truncate">{label}</span>}

                                                {hasMemoCount && (
                                                    compact ? (
                                                        <span
                                                            aria-hidden="true"
                                                            className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent-gold)] px-1 text-xs font-bold leading-none text-[#14211c]"
                                                        >
                                                            {unreadMemoCount > 99 ? '99+' : unreadMemoCount}
                                                        </span>
                                                    ) : (
                                                        <span className="rounded-full bg-[var(--accent-gold)] px-2 py-0.5 text-xs font-bold text-[#14211c]">
                                                            {unreadMemoCount}
                                                        </span>
                                                    )
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}
                </div>
            </nav>

            <div className={`shrink-0 border-t border-[var(--surface-sidebar-border)] bg-black/15 ${compact ? 'space-y-1.5 p-2' : 'space-y-2 p-3'}`}>
                <AppearanceControl compact={compact} />
                <LocaleControl compact={compact} />

                <div className={compact ? 'mt-2 flex flex-col items-center gap-1.5' : 'mt-2.5 flex min-w-0 items-center gap-2.5 border-t border-white/10 pt-2.5'}>
                    <div
                        role="img"
                        aria-label={identityTitle ? `Signed in as ${identityTitle}` : 'Signed in user'}
                        title={identityTitle || undefined}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/15 text-xs font-bold text-white"
                    >
                        {getUserInitials(user?.name)}
                    </div>
                    {!compact && (
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-white" title={user?.name || undefined}>
                                {user?.name || 'Signed in'}
                            </div>
                            {secondaryIdentity && (
                                <div className="truncate text-xs text-[var(--surface-sidebar-muted)]" title={secondaryIdentity}>
                                    {secondaryIdentity}
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => router.post('/logout')}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--surface-sidebar-ink)] transition-colors hover:bg-[var(--surface-sidebar-hover)] hover:text-white focus-visible:outline-[var(--focus-ring-sidebar)]"
                        aria-label="Sign out"
                        title="Sign out"
                    >
                        <LogOut size={17} aria-hidden="true" />
                    </button>
                </div>
            </div>
        </div>
    );
}
