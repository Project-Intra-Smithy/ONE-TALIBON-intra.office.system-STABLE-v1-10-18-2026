import { Link, router } from '@inertiajs/react';
import { ListChecks, LogOut, PanelLeftClose, PanelLeftOpen, Settings } from 'lucide-react';
import { Fragment } from 'react';
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
    const compact = !mobile && collapsed;
    const position = user?.employee?.position;
    const department = user?.employee?.department?.name;
    const secondaryIdentity = position || department;
    const identityTitle = [user?.name, position, department].filter(Boolean).join(' · ');

    return (
        <div className={`portal-sidebar ${compact ? 'portal-sidebar--compact' : ''}`}>
            <div className={`border-b border-white/10 ${compact ? 'px-2 py-4' : 'px-5 py-5'}`}>
                <div className={compact ? 'flex justify-center' : undefined}>
                    <MunicipalBrand inverse compact iconOnly={compact} />
                </div>

                {mobile ? (
                    <div className="mt-3 text-xs text-emerald-100">Intra-office workspace</div>
                ) : (
                    <div className={`mt-3 flex items-center ${compact ? 'justify-center' : 'justify-between gap-3'}`}>
                        {!compact && <div className="text-xs text-emerald-100">Intra-office workspace</div>}
                        <button
                            type="button"
                            onClick={onToggleCollapsed}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 text-emerald-50 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
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
                className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto ${compact ? 'px-2 py-3' : 'px-3 py-4'}`}
                aria-label="Primary navigation"
            >
                <div className={compact ? 'space-y-3' : 'space-y-4'}>
                    {navigationGroups.map((group) => {
                        const groupActive = group.items.some((item) => isPortalPathActive(currentUrl, item.href));

                        return (
                            <section key={group.label} aria-label={group.label}>
                                {!compact && (
                                    <div className={`px-2 text-sm font-semibold ${groupActive ? 'text-white' : 'text-emerald-100'}`}>
                                        {group.label}
                                    </div>
                                )}

                                <div className={compact ? 'space-y-1' : 'mt-2 space-y-1'}>
                                    {group.items.map(({ key, label, href, icon: Icon }) => {
                                        const active = isPortalPathActive(currentUrl, href);
                                        const hasMemoCount = key === 'memoranda' && unreadMemoCount > 0;
                                        const accessibleLabel = hasMemoCount
                                            ? `${label}, ${unreadMemoCount} unread`
                                            : label;

                                        return (
                                            <Fragment key={key}>
                                            <Link
                                                key={key}
                                                href={href}
                                                onClick={() => onNavigate?.()}
                                                aria-current={active ? 'page' : undefined}
                                                aria-label={compact ? accessibleLabel : undefined}
                                                title={compact ? accessibleLabel : undefined}
                                                className={`relative flex min-h-11 items-center rounded-lg py-2 text-base font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-1 focus-visible:ring-offset-[#124c38] ${
                                                    compact ? 'justify-center px-2' : 'gap-3 px-3'
                                                } ${
                                                    active
                                                        ? 'bg-white text-[#124c38] font-bold before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r before:bg-[#124c38]'
                                                        : 'text-emerald-50 hover:bg-white/10 hover:text-white'
                                                }`}
                                            >
                                                <Icon size={18} aria-hidden="true" className="shrink-0" />

                                                {!compact && <span className="min-w-0 flex-1 break-words">{label}</span>}

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
                                            </Link>
                                            {key === 'myWork' && <a href="/dashboard#personal-tasks"
                                                onClick={() => { onNavigate?.(); document.getElementById('personal-tasks')?.focus(); }}
                                                aria-current={currentUrl.includes('#personal-tasks') ? 'page' : undefined}
                                                aria-label={compact ? 'Personal tasks' : undefined}
                                                title="Personal tasks"
                                                className="relative mt-1 flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-base font-medium text-emerald-50 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/80">
                                                <ListChecks size={18} aria-hidden="true"/>{!compact && <span>Personal Tasks</span>}
                                            </a>}
                                            </Fragment>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}
                </div>
            </nav>

            <div className={`relative shrink-0 border-t border-white/10 ${compact ? 'p-2' : 'p-3 sm:p-4'}`}>
                {compact ? (
                    <div className="relative flex flex-col items-center gap-3">
                        <div
                            role="img"
                            aria-label={identityTitle ? `Signed in as ${identityTitle}` : 'Signed in user'}
                            title={identityTitle || undefined}
                            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xs font-bold text-white"
                        >
                            {userInitials(user?.name)}
                        </div>

                        <details className="portal-settings"><summary aria-label="Appearance settings" title="Appearance settings"><Settings size={18} /></summary><AppearanceControl compact /></details>

                        <button
                            type="button"
                            onClick={() => router.post('/logout')}
                            className="flex h-11 w-11 items-center justify-center rounded-lg text-emerald-50 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                            aria-label="Sign out"
                            title="Sign out"
                        >
                            <LogOut size={17} aria-hidden="true" />
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <details className="portal-settings"><summary><Settings size={18} aria-hidden="true" />Appearance settings</summary><AppearanceControl /></details>

                        <div className="mt-3 border-t border-white/10 pt-3">
                            <div
                                className="text-sm font-semibold leading-snug break-words"
                                title={user?.name || undefined}
                            >
                                {user?.name}
                            </div>

                            {secondaryIdentity && (
                                <div
                                    className="mt-1 text-xs leading-snug text-emerald-100 break-words"
                                    title={secondaryIdentity}
                                >
                                    {secondaryIdentity}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => router.post('/logout')}
                                className="mt-2 flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-base text-emerald-50 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:mt-3 sm:text-sm"
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
