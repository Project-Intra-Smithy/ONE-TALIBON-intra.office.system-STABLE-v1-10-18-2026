import { useEffect, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { ListChecks, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { isPortalPathActive, type PortalNavigationGroup } from '../../navigation/portalNavigation';
import type { AuthUser } from '../../types';
import AppearanceControl from '../AppearanceControl';
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

function userInitials(name?: string | null): string {
    const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];

    if (parts.length === 0) return 'OT';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? 'OT';

    return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

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
    const [hash, setHash] = useState(() => typeof window === 'undefined' ? '' : window.location.hash);
    const [compactTooltip, setCompactTooltip] = useState<{ label: string; left: number; top: number } | null>(null);
    useEffect(() => {
        const update = () => setHash(window.location.hash);
        window.addEventListener('hashchange', update);
        update();
        return () => window.removeEventListener('hashchange', update);
    }, [currentUrl]);
    const navigationUrl = currentUrl.split('#')[0] + hash;
    const compact = !mobile && collapsed;
    useEffect(() => {
        setCompactTooltip(null);
    }, [compact, currentUrl]);
    useEffect(() => {
        const dismiss = () => setCompactTooltip(null);
        window.addEventListener('resize', dismiss);
        return () => window.removeEventListener('resize', dismiss);
    }, []);
    const position = user?.employee?.position;
    const department = user?.employee?.department?.name;
    const secondaryIdentity = position || department;
    const identityTitle = [user?.name, position, department].filter(Boolean).join(' · ');

    // The tooltip lives outside the scrolling nav so compact labels remain visible at its edges.
    // Navigation groups and destinations continue to come exclusively from the parent.
    const showCompactTooltip = (element: HTMLElement, label: string) => {
        if (!compact) return;
        const rect = element.getBoundingClientRect();
        setCompactTooltip({ label, left: rect.right + 12, top: Math.max(44, Math.min(rect.top + rect.height / 2, window.innerHeight - 44)) });
    };

    return (
        <div
            className={`portal-sidebar flex h-full flex-col bg-white text-slate-800 ${compact ? 'portal-sidebar--compact' : 'portal-sidebar--expanded'} ${mobile ? 'portal-sidebar--mobile' : ''}`}
            onKeyDown={(event) => { if (event.key === 'Escape') setCompactTooltip(null); }}
        >
            <div className={`portal-sidebar-header border-b border-slate-200 ${compact ? 'px-2 py-3' : 'px-4 py-4'}`}>
                <div className={compact ? 'flex justify-center' : undefined}>
                    <MunicipalBrand compact iconOnly={compact} />
                </div>

                {mobile ? (
                    <div className="portal-sidebar-subtitle mt-3 text-xs text-slate-600">Intra-office workspace</div>
                ) : (
                    <div className={`mt-3 flex items-center ${compact ? 'justify-center' : 'justify-between gap-3'}`}>
                        {!compact && <div className="portal-sidebar-subtitle text-xs text-slate-600">Intra-office workspace</div>}
                        <button
                            type="button"
                            onClick={onToggleCollapsed}
                            className="portal-sidebar-toggle flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                            aria-label={compact ? 'Expand navigation' : 'Collapse navigation'}
                            aria-expanded={!compact}
                            title={compact ? 'Expand navigation' : 'Collapse navigation'}
                        >
                            {compact
                                ? <PanelLeftOpen size={18} aria-hidden="true" />
                                : <PanelLeftClose size={18} aria-hidden="true" />}
                        </button>
                    </div>
                )}
            </div>

            <nav
                className={`portal-sidebar-navigation min-h-0 flex-1 overflow-x-hidden overflow-y-auto ${compact ? 'px-2 py-3' : 'px-3 py-4'}`}
                onScroll={() => setCompactTooltip(null)}
                aria-label="Primary navigation"
            >
                <div className={compact ? 'space-y-3' : 'space-y-5'}>
                    {navigationGroups.map((group) => {
                        const groupActive = group.items.some((item) => isPortalPathActive(navigationUrl, item.href));

                        return (
                            <section key={group.key} aria-label={group.label} className="portal-sidebar-section">
                                {compact && <div aria-hidden="true" className={`portal-sidebar-group-divider ${groupActive ? 'portal-sidebar-group-divider--active' : ''}`} />}
                                {!compact && (
                                    <div className={`portal-sidebar-section-title flex min-w-0 items-center gap-2 px-2 text-xs font-bold uppercase tracking-[0.08em] ${groupActive ? 'text-[#145a43]' : 'text-slate-600'}`}>
                                        {group.label}
                                    </div>
                                )}

                                <div className={compact ? 'space-y-1' : 'mt-2 space-y-1'}>
                                    {group.items.map(({ key, label, href, icon: Icon }) => {
                                        const active = isPortalPathActive(navigationUrl, href) && !(key === 'home' && hash === '#personal-tasks');
                                        const NavigationLink = href.includes('#') ? 'a' : Link;
                                        const hasMemoCount = key === 'memoranda' && unreadMemoCount > 0;
                                        const accessibleLabel = hasMemoCount
                                            ? `${label}, ${unreadMemoCount} unread`
                                            : label;

                                        const itemElement = (
                                            <NavigationLink
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
                                                aria-label={compact ? accessibleLabel : undefined}
                                                aria-describedby={compact && compactTooltip?.label === `${group.label} · ${accessibleLabel}` ? 'portal-sidebar-link-hint' : undefined}
                                                onMouseEnter={(event) => showCompactTooltip(event.currentTarget, `${group.label} · ${accessibleLabel}`)}
                                                onMouseLeave={(event) => { if (document.activeElement !== event.currentTarget) setCompactTooltip(null); }}
                                                onFocus={(event) => showCompactTooltip(event.currentTarget, `${group.label} · ${accessibleLabel}`)}
                                                onBlur={() => setCompactTooltip(null)}
                                                className={`portal-sidebar-nav-link relative flex min-h-11 items-center rounded-xl py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-1 focus-visible:ring-offset-white ${
                                                    compact ? 'justify-center px-2' : 'gap-3 px-3'
                                                } ${
                                                    active
                                                        ? 'bg-[#edf5ef] text-[#145a43] before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r before:bg-[#145a43]'
                                                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                                                }`}
                                            >
                                                <Icon size={18} aria-hidden="true" className="portal-sidebar-nav-icon shrink-0" />

                                                {!compact && <span className="portal-sidebar-nav-label min-w-0 flex-1">{label}</span>}

                                                {hasMemoCount && (
                                                    compact ? (
                                                        <span
                                                            aria-hidden="true"
                                                            className={`absolute right-1 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none ${
                                                                active
                                                                    ? 'bg-amber-100 text-amber-900'
                                                                    : 'bg-amber-400 text-slate-950'
                                                            }`}
                                                        >
                                                            {unreadMemoCount > 99 ? '99+' : unreadMemoCount}
                                                        </span>
                                                    ) : (
                                                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                                            active
                                                                ? 'bg-amber-100 text-amber-900'
                                                                : 'bg-amber-400 text-slate-950'
                                                        }`}>
                                                            {unreadMemoCount}
                                                        </span>
                                                    )
                                                )}
                                            </NavigationLink>
                                        );

                                        if (key === 'myWork' && group.key === 'work') {
                                            const tasksActive = hash === '#personal-tasks' && navigationUrl.split('#')[0] === '/dashboard';
                                            return (
                                                <div key="work-with-tasks" className="space-y-1">
                                                    {itemElement}
                                                    <a
                                                        key="personalTasks"
                                                        href="/dashboard#personal-tasks"
                                                        onClick={() => {
                                                            onNavigate?.();
                                                            if (typeof window !== 'undefined' && window.location.pathname === '/dashboard') {
                                                                const el = document.getElementById('personal-tasks');
                                                                el?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
                                                                el?.focus();
                                                            }
                                                        }}
                                                        aria-current={tasksActive ? 'page' : undefined}
                                                        aria-label={compact ? 'Tasks' : undefined}
                                                        aria-describedby={compact && compactTooltip?.label === `${group.label} · Tasks` ? 'portal-sidebar-link-hint' : undefined}
                                                        onMouseEnter={(event) => showCompactTooltip(event.currentTarget, `${group.label} · Tasks`)}
                                                        onMouseLeave={(event) => { if (document.activeElement !== event.currentTarget) setCompactTooltip(null); }}
                                                        onFocus={(event) => showCompactTooltip(event.currentTarget, `${group.label} · Tasks`)}
                                                        onBlur={() => setCompactTooltip(null)}
                                                        className={`portal-sidebar-nav-link relative flex min-h-11 items-center rounded-xl py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-1 focus-visible:ring-offset-white ${
                                                            compact ? 'justify-center px-2' : 'gap-3 px-3'
                                                        } ${
                                                            tasksActive
                                                                ? 'bg-[#edf5ef] text-[#145a43] before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r before:bg-[#145a43]'
                                                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                                                        }`}
                                                    >
                                                        <ListChecks size={18} aria-hidden="true" className="portal-sidebar-nav-icon shrink-0" />
                                                        {!compact && <span className="portal-sidebar-nav-label min-w-0 flex-1">Tasks</span>}
                                                    </a>
                                                </div>
                                            );
                                        }

                                        return itemElement;
                                    })}
                                </div>
                            </section>
                        );
                    })}
                </div>
            </nav>

                {!compact && <div className="portal-sidebar-civic-note">
                    {user?.employee?.department?.code && <span className="portal-sidebar-office-badge">{user.employee.department.code}</span>}
                    <p>Smart Planning.<br />Strong Coordination.<br /><strong>One Talibon.</strong></p>
                </div>}
            {compact && compactTooltip && (
                <div
                    id="portal-sidebar-link-hint"
                    role="tooltip"
                    className="portal-sidebar-tooltip"
                    style={{ left: compactTooltip.left, top: compactTooltip.top }}
                >
                    {compactTooltip.label}
                </div>
            )}

            <div className={`portal-sidebar-footer relative shrink-0 border-t border-slate-200 ${compact ? 'p-2' : 'p-3 sm:p-4'}`}>
                {compact ? (
                    <div className="relative flex flex-col items-center gap-3">
                        <div
                            role="img"
                            aria-label={identityTitle ? `Signed in as ${identityTitle}` : 'Signed in user'}
                            title={identityTitle || undefined}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-bold text-slate-800"
                        >
                            {userInitials(user?.name)}
                        </div>

                        <AppearanceControl compact />

                        <button
                            type="button"
                            onClick={() => router.post('/logout')}
                            className="portal-sidebar-signout flex h-11 w-11 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                            aria-label="Sign out"
                            title="Sign out"
                        >
                            <LogOut size={17} aria-hidden="true" />
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <AppearanceControl iconOnly />

                        <div className="mt-3 border-t border-slate-200 pt-3">
                            <div
                                className="text-sm font-semibold leading-snug break-words"
                                title={user?.name || undefined}
                            >
                                {user?.name}
                            </div>

                            {secondaryIdentity && (
                                <div
                                    className="mt-1 text-xs leading-snug text-slate-600 break-words"
                                    title={secondaryIdentity}
                                >
                                    {secondaryIdentity}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => router.post('/logout')}
                                className="portal-sidebar-signout mt-2 flex min-h-11 w-full items-center gap-2 rounded-xl px-2 text-[13px] text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:mt-3 sm:text-sm"
                            >
                                <LogOut size={15} aria-hidden="true" />
                                <span>Sign out</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
