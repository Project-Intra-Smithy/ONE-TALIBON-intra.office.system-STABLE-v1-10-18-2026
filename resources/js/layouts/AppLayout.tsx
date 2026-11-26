import { Head, Link, usePage } from '@inertiajs/react';
import { Bell, Menu, Search, X } from 'lucide-react';
import { type PropsWithChildren, useEffect, useId, useRef, useState } from 'react';
import { emptyNotificationFeed, parseNotificationFeed } from '../compat/notificationFeed';
import { NotificationContext, NotificationStateContext } from '../components/shell/NotificationContext';
import CommandPalette from '../components/shell/CommandPalette';
import MobileNavigation from '../components/shell/MobileNavigation';
import PortalSidebar from '../components/shell/PortalSidebar';
import { PortalIdentity, PortalLauncher, RecordsSearch } from '../components/shell/PortalTools';
import { Dialog } from '../components/ui';
import { useVisiblePolling } from '../hooks/useVisiblePolling';
import { relativeTimePH } from '../lib/format';
import { useLocale } from '../lib/i18n';
import { buildPortalNavigation } from '../navigation/portalNavigation';
import type { LiveNotification, NotificationFeed, SharedProps } from '../types';

type Presentation = 'standard' | 'portal-dashboard';
type Props = PropsWithChildren<{ title: string; presentation?: Presentation; workspaceRefinement?: boolean }>;

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'talibon.sidebar.collapsed';

export default function AppLayout({ title, presentation = 'standard', workspaceRefinement = true, children }: Props) {
    const page = usePage<SharedProps>();
    const [hash, setHash] = useState(() => (typeof window === 'undefined' ? '' : window.location.hash));
    useEffect(() => {
        const update = () => setHash(window.location.hash);
        window.addEventListener('hashchange', update);
        update();
        return () => window.removeEventListener('hashchange', update);
    }, [page.url]);

    const currentUrl = page.url.split('#')[0] + hash;
    const pageProps = page.props;
    const { auth, flash } = pageProps;
    const [feed, setFeed] = useState<NotificationFeed>(emptyNotificationFeed);
    const [feedState, setFeedState] = useState<'loading' | 'current' | 'unavailable' | 'expired'>('loading');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [commandOpen, setCommandOpen] = useState(false);
    const [desktopCollapsed, setDesktopCollapsed] = useState(false);
    const { t } = useLocale();

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setCommandOpen((open) => !open);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);
    const [dismissedMemoId, setDismissedMemoId] = useState<number | null>(null);
    const [liveAlert, setLiveAlert] = useState<LiveNotification | null>(null);
    const [unseenWorkflowCount, setUnseenWorkflowCount] = useState(0);
    const knownNotificationKeys = useRef<Set<string>>(new Set());
    const notificationsInitialized = useRef(false);
    const notificationsPopoverId = useId();
    const user = auth?.user ?? null;
    const { pendingMemo, unreadMemoCount, notifications } = feed;
    const navigation = pageProps.permissions?.navigation ?? ({} as SharedProps['permissions']['navigation']);
    const canViewReports = Boolean(pageProps.permissions?.reports && navigation.reports);
    const navigationGroups = buildPortalNavigation(pageProps.workspaceExperience, navigation, canViewReports);
    const departmentSubtitle = user?.employee?.department?.name || 'Municipal workspace';

    useEffect(() => {
        if (!user?.id) return;
        const heartbeat = () => {
            if (document.visibilityState !== 'visible') return;
            const cookie = document.cookie.split('; ').find((item) => item.startsWith('XSRF-TOKEN='))?.slice(11);
            if (!cookie) return;
            void fetch('/employees/presence', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { Accept: 'application/json', 'X-XSRF-TOKEN': decodeURIComponent(cookie) },
            }).catch(() => {});
        };
        heartbeat();
        const interval = window.setInterval(heartbeat, 60000);
        document.addEventListener('visibilitychange', heartbeat);
        return () => {
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', heartbeat);
        };
    }, [user?.id]);

    useEffect(() => {
        try {
            setDesktopCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true');
        } catch {
            setDesktopCollapsed(false);
        }
    }, []);

    const toggleDesktopSidebar = () => {
        setDesktopCollapsed((collapsed) => {
            const next = !collapsed;
            try {
                window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(next));
            } catch {
                // Keep in-memory state when storage is unavailable.
            }
            return next;
        });
    };

    useVisiblePolling(async (signal) => {
        try {
            const response = await fetch('/notifications/feed', {
                credentials: 'same-origin',
                headers: { Accept: 'application/json' },
                signal,
            });
            if (response.status === 401 || response.status === 403 || response.status === 419) {
                setFeed(emptyNotificationFeed());
                setFeedState('expired');
                return;
            }
            if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
                throw new Error('Notification feed unavailable');
            }
            setFeed(parseNotificationFeed(await response.json()));
            setFeedState('current');
        } catch {
            if (signal.aborted) return;
            setFeedState('unavailable');
        }
    }, 30000);

    useEffect(() => {
        if (feedState !== 'current') return;
        const workflowNotifications = notifications.filter((notification) => notification.type === 'transaction');
        if (!notificationsInitialized.current) {
            workflowNotifications.forEach((notification) => knownNotificationKeys.current.add(notification.key));
            notificationsInitialized.current = true;
            return;
        }
        const newItems = workflowNotifications.filter((n) => !knownNotificationKeys.current.has(n.key));
        if (newItems.length === 0) return;
        newItems.forEach((n) => knownNotificationKeys.current.add(n.key));
        setLiveAlert(newItems[0]);
        setUnseenWorkflowCount((count) => count + newItems.length);
    }, [feedState, notifications]);

    useEffect(() => {
        if (!liveAlert) return;
        const timer = window.setTimeout(() => setLiveAlert(null), 12000);
        return () => window.clearTimeout(timer);
    }, [liveAlert]);

    const sidebarProps = {
        currentUrl,
        navigationGroups,
        unreadMemoCount,
        user,
    };

    const showMemo = Boolean(pendingMemo && dismissedMemoId !== pendingMemo.id);
    const bellCount = unreadMemoCount + unseenWorkflowCount;
    const canSearchRecords = navigationGroups.some((group) => group.items.some((item) => item.key === 'records'));

    return (
        <>
            <Head title={title} />
            <a href="#portal-content" className="tcds-skip-link">
                {t('skipToMain')}
            </a>

            <div
                data-presentation={presentation}
                data-workspace-shell={workspaceRefinement || undefined}
                className={`min-h-[calc(100dvh-var(--ot-toolbar-height,0px))] bg-[var(--surface-canvas)] text-[var(--ink-primary)] lg:grid lg:transition-[grid-template-columns] lg:duration-150 lg:ease-out ${
                    desktopCollapsed ? 'lg:grid-cols-[72px_minmax(0,1fr)]' : 'lg:grid-cols-[264px_minmax(0,1fr)]'
                }`}
            >
                <aside
                    aria-label="Primary workspace navigation"
                    className="tcds-sidebar-rail hidden lg:sticky lg:top-[var(--ot-toolbar-height,0px)] lg:block lg:h-[calc(100dvh-var(--ot-toolbar-height,0px))]"
                >
                    <PortalSidebar
                        {...sidebarProps}
                        collapsed={desktopCollapsed}
                        onToggleCollapsed={toggleDesktopSidebar}
                    />
                </aside>

                {mobileOpen && (
                    <MobileNavigation onClose={() => setMobileOpen(false)} onDesktop={() => setMobileOpen(false)}>
                        <PortalSidebar
                            {...sidebarProps}
                            collapsed={false}
                            mobile
                            onNavigate={() => setMobileOpen(false)}
                        />
                    </MobileNavigation>
                )}

                {/* Sibling landmarks: header, main, footer are NOT nested inside <main> */}
                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="tcds-topbar sticky top-[var(--ot-toolbar-height,0px)] z-20 flex min-h-14 items-center justify-between gap-3 border-b border-[var(--border-default)] bg-[var(--surface-card)] px-3 sm:px-5">
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                            <button
                                type="button"
                                onClick={() => setMobileOpen(true)}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--ink-primary)] hover:bg-[var(--surface-hover)] lg:hidden"
                                aria-label="Open navigation"
                            >
                                <Menu size={20} aria-hidden="true" />
                            </button>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-base font-bold tracking-tight text-[var(--ink-primary)]">
                                    {title}
                                </div>
                                <div className="hidden truncate text-xs font-medium text-[var(--ink-secondary)] sm:block">
                                    {departmentSubtitle}
                                </div>
                            </div>
                        </div>

                        {canSearchRecords && (
                            <div className="hidden min-w-0 lg:block lg:w-72 xl:w-96">
                                <RecordsSearch onOpenCommandPalette={() => setCommandOpen(true)} />
                            </div>
                        )}

                        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
                            {canSearchRecords && (
                                <button
                                    type="button"
                                    onClick={() => setCommandOpen(true)}
                                    aria-label="Open quick jump and search"
                                    className="flex h-11 w-11 items-center justify-center rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)] lg:hidden"
                                >
                                    <Search size={18} aria-hidden="true" />
                                </button>
                            )}

                            {/* Top-layer native Popover escapes header stacking context */}
                            <button
                                type="button"
                                popoverTarget={notificationsPopoverId}
                                onClick={() => setUnseenWorkflowCount(0)}
                                style={{ anchorName: '--tcds-bell-anchor' } as React.CSSProperties}
                                className="relative flex h-11 w-11 items-center justify-center rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]"
                                aria-label={bellCount > 0 ? `Open notifications (${bellCount} unread)` : 'Open notifications'}
                            >
                                <Bell size={18} aria-hidden="true" />
                                {bellCount > 0 && (
                                    <span
                                        aria-hidden="true"
                                        className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-primary)] px-1 text-xs font-bold leading-none text-white"
                                    >
                                        {bellCount > 9 ? '9+' : bellCount}
                                    </span>
                                )}
                            </button>

                            <div
                                id={notificationsPopoverId}
                                popover="auto"
                                data-placement="bottom-end"
                                style={{ positionAnchor: '--tcds-bell-anchor' } as React.CSSProperties}
                                className="tcds-popover w-88"
                                role="region"
                                aria-label="Notifications"
                            >
                                <div className="flex items-center justify-between gap-3 border-b border-[var(--border-default)] px-4 py-3">
                                    <div>
                                        <div className="text-sm font-bold text-[var(--ink-primary)]">{t('recentActivity')}</div>
                                        <div className="text-xs text-[var(--ink-secondary)]">
                                            {feedState === 'current'
                                                ? 'Office arrivals and unread memoranda'
                                                : feedState === 'expired'
                                                    ? 'Session expired. Sign in again to refresh.'
                                                    : feedState === 'unavailable'
                                                        ? 'Live feed unavailable.'
                                                        : 'Checking updates…'}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        popoverTarget={notificationsPopoverId}
                                        popoverTargetAction="hide"
                                        aria-label="Close notifications"
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)]"
                                    >
                                        <X size={16} aria-hidden="true" />
                                    </button>
                                </div>
                                <div className="divide-y divide-[var(--border-default)]">
                                    {notifications.map((notification) => (
                                        <Link
                                            key={notification.key}
                                            href={notification.url}
                                            className="block px-4 py-3 transition-colors hover:bg-[var(--surface-hover)]"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold uppercase tracking-wide text-[var(--brand-ink)]">
                                                        {notification.title}
                                                    </div>
                                                    <div className="mt-0.5 text-sm leading-5 text-[var(--ink-primary)]">
                                                        {notification.message}
                                                    </div>
                                                    {notification.created_at && (
                                                        <div className="mt-1 text-xs text-[var(--ink-secondary)]">
                                                            {relativeTimePH(notification.created_at)}
                                                        </div>
                                                    )}
                                                </div>
                                                {notification.urgent && (
                                                    <span className="shrink-0 rounded-full border border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--status-warn-fg)]">
                                                        Action
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                    {notifications.length === 0 && (
                                        <div className="px-4 py-8 text-center text-sm text-[var(--ink-secondary)]">
                                            No recent notifications.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <PortalLauncher groups={navigationGroups} />
                            <PortalIdentity user={user} />
                        </div>
                    </header>

                    {(flash?.success || flash?.error) && (
                        <div
                            role={flash.error ? 'alert' : 'status'}
                            aria-live={flash.error ? 'assertive' : 'polite'}
                            className={`mx-4 mt-4 rounded-xl border px-4 py-3 text-sm font-semibold sm:mx-6 ${
                                flash.success
                                    ? 'border-[var(--status-ok-border)] bg-[var(--status-ok-bg)] text-[var(--status-ok-fg)]'
                                    : 'border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]'
                            }`}
                        >
                            {flash.success || flash.error}
                        </div>
                    )}

                    <main
                        id="portal-content"
                        data-workspace-refinement={workspaceRefinement || undefined}
                        data-presentation={presentation === 'portal-dashboard' ? 'dashboard' : undefined}
                        tabIndex={-1}
                        onFocusCapture={(event) => {
                            if (!(event.target instanceof HTMLElement)) return;
                            const container = event.target.closest<HTMLElement>('nav, [role="tablist"], [role="region"][tabindex="0"]');
                            if (container && container !== event.target && container.scrollWidth > container.clientWidth) {
                                event.target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                            }
                        }}
                        className="min-w-0 flex-1 pb-24 md:pb-8"
                    >
                        <NotificationStateContext.Provider value={feedState}>
                            <NotificationContext.Provider value={notifications}>
                                {children}
                            </NotificationContext.Provider>
                        </NotificationStateContext.Provider>
                    </main>

                    <footer className="mx-4 mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-default)] py-4 pb-24 text-xs text-[var(--ink-secondary)] sm:mx-6 md:pb-4">
                        <span>{t('municipalityFooter')}</span>
                        <span>{t('portalFooter')}</span>
                    </footer>
                </div>
            </div>

            <nav
                aria-label="Mobile workspace navigation"
                className="tcds-mobile-nav fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-[var(--border-default)] bg-[var(--surface-card)] px-1.5 pt-1 md:hidden"
                style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom, 0px))' }}
            >
                {navigationGroups
                    .flatMap((group) => group.items)
                    .filter((item) => ['home', 'myTasks', 'myWork', 'correspondence'].includes(item.key))
                    .map(({ key, label, href, icon: Icon }) => {
                        const active = page.url.split(/[?#]/, 1)[0] === href;
                        const shortLabel = key === 'home'
                            ? t('navHome')
                            : key === 'myTasks'
                                ? t('navTasks')
                                : key === 'myWork'
                                    ? t('navRequests')
                                    : key === 'correspondence'
                                        ? t('navInbox')
                                        : label;
                        return (
                            <Link
                                key={key}
                                href={href}
                                aria-current={active ? 'page' : undefined}
                                className={`flex min-h-12 min-w-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-xs font-semibold transition-colors ${
                                    active
                                        ? 'bg-[var(--brand-soft)] text-[var(--brand-ink)]'
                                        : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                                }`}
                            >
                                <Icon size={20} aria-hidden="true" />
                                <span>{shortLabel}</span>
                            </Link>
                        );
                    })}
                <button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    aria-label="Open more navigation options"
                    aria-expanded={mobileOpen}
                    className="flex min-h-12 min-w-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-xs font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                >
                    <Menu size={20} aria-hidden="true" />
                    <span>{t('navMore')}</span>
                </button>
            </nav>

            <CommandPalette
                open={commandOpen}
                onClose={() => setCommandOpen(false)}
                navigationGroups={navigationGroups}
            />

            {liveAlert && (
                <div
                    role="status"
                    aria-live="polite"
                    className="fixed bottom-20 left-3 right-3 z-40 sm:left-auto sm:right-5 sm:w-96 md:bottom-5"
                >
                    <div className="tcds-card overflow-hidden border-l-4 border-l-[var(--brand-primary)] shadow-lg">
                        <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                                        {liveAlert.title}
                                    </div>
                                    <div className="mt-1 text-sm font-semibold text-[var(--ink-primary)]">
                                        {liveAlert.message}
                                    </div>
                                    <div className="mt-1 text-xs text-[var(--ink-secondary)]">
                                        {relativeTimePH(liveAlert.created_at)}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setLiveAlert(null)}
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)]"
                                    aria-label="Dismiss notification"
                                >
                                    <X size={16} aria-hidden="true" />
                                </button>
                            </div>
                            <div className="mt-3 flex justify-end">
                                <Link
                                    href={liveAlert.url}
                                    onClick={() => {
                                        setLiveAlert(null);
                                        setUnseenWorkflowCount(0);
                                    }}
                                    className="municipal-primary-button"
                                >
                                    Open request
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {pendingMemo && (
                <Dialog
                    open={showMemo}
                    onClose={() => setDismissedMemoId(pendingMemo.id)}
                    title={pendingMemo.title}
                    description={`New Memorandum · ${pendingMemo.memo_number}`}
                    footer={
                        <>
                            <button
                                type="button"
                                onClick={() => setDismissedMemoId(pendingMemo.id)}
                                className="municipal-secondary-button"
                            >
                                Review later
                            </button>
                            <Link href={`/memoranda/${pendingMemo.id}`} className="municipal-primary-button">
                                Open memorandum
                            </Link>
                        </>
                    }
                >
                    <p className="text-sm leading-6 text-[var(--ink-secondary)]">
                        Issued by {pendingMemo.department || pendingMemo.issuer || "Mayor's Office"}.{' '}
                        {pendingMemo.requires_acknowledgement
                            ? 'Official acknowledgement is required.'
                            : 'Please review this official issuance.'}
                    </p>
                </Dialog>
            )}
        </>
    );
}
