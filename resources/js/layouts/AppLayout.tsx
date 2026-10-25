import '../../css/ot-reference-shell.css';
import { Head, Link, usePage } from '@inertiajs/react';
import { Bell, ListChecks, Menu, X } from 'lucide-react';
import { type PropsWithChildren, useEffect, useRef, useState } from 'react';
import { NotificationContext, NotificationStateContext } from '../components/shell/NotificationContext';
import { emptyNotificationFeed, parseNotificationFeed } from '../compat/notificationFeed';
import MobileNavigation from '../components/shell/MobileNavigation';
import PortalSidebar from '../components/shell/PortalSidebar';
import { PortalIdentity, PortalLauncher, RecordsSearch } from '../components/shell/PortalTools';
import { useVisiblePolling } from '../hooks/useVisiblePolling';
import { buildPortalNavigation, isPortalPathActive } from '../navigation/portalNavigation';
import type { LiveNotification, NotificationFeed, SharedProps } from '../types';

type Presentation = 'standard' | 'portal-dashboard';
type Props = PropsWithChildren<{ title: string; presentation?: Presentation; workspaceRefinement?: boolean }>;

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'talibon.sidebar.collapsed';

function relativeTime(value?: string | null): string {
    if (!value) return '';

    const time = new Date(value).getTime();
    if (Number.isNaN(time)) return '';

    const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    return new Date(value).toLocaleString();
}

export default function AppLayout({ title, presentation = 'standard', workspaceRefinement = true, children }: Props) {
    const page = usePage<SharedProps>();
    const [hash, setHash] = useState(() => typeof window === 'undefined' ? '' : window.location.hash);
    useEffect(() => {
        const update = () => setHash(window.location.hash);
        window.addEventListener('hashchange', update);
        update();
        return () => window.removeEventListener('hashchange', update);
    }, [page.url]);
    const currentUrl = page.url.split('#')[0] + hash;
    useEffect(() => {
        if (hash !== '#personal-tasks' || page.url.split(/[?#]/, 1)[0] !== '/dashboard') return;
        // A Tasks link can reload the dashboard when removing a query string.
        // Restore its anchor focus after the destination has mounted as well.
        const frame = requestAnimationFrame(() => document.getElementById('personal-tasks')?.focus({ preventScroll: true }));
        return () => cancelAnimationFrame(frame);
    }, [hash, page.url]);
    const pageProps = page.props;
    const { auth, flash } = pageProps;
    const [feed, setFeed] = useState<NotificationFeed>(emptyNotificationFeed);
    const [feedState, setFeedState] = useState<'loading' | 'current' | 'unavailable' | 'expired'>('loading');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [editingField, setEditingField] = useState(false);
    useEffect(() => {
        // Keep fixed navigation out of the way of form fields and on-screen keyboards.
        const isEditable = (target: EventTarget | null) => target instanceof HTMLElement && Boolean(target.closest(
            'textarea, input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="hidden"]), [contenteditable]:not([contenteditable="false"])',
        ));
        const onFocus = (event: FocusEvent) => setEditingField(isEditable(event.target));
        const onBlur = (event: FocusEvent) => setEditingField(isEditable(event.relatedTarget));
        setEditingField(isEditable(document.activeElement));
        document.addEventListener('focusin', onFocus);
        document.addEventListener('focusout', onBlur);
        return () => {
            document.removeEventListener('focusin', onFocus);
            document.removeEventListener('focusout', onBlur);
        };
    }, []);
    const [desktopCollapsed, setDesktopCollapsed] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [dismissedMemoId, setDismissedMemoId] = useState<number | null>(null);
    const [liveAlert, setLiveAlert] = useState<LiveNotification | null>(null);
    const [unseenWorkflowCount, setUnseenWorkflowCount] = useState(0);
    const knownNotificationKeys = useRef<Set<string>>(new Set());
    const notificationsInitialized = useRef(false);
    const notificationsPanel = useRef<HTMLDivElement>(null);
    const notificationsButton = useRef<HTMLButtonElement>(null);
    const user = auth?.user ?? null;
    const { pendingMemo, unreadMemoCount, notifications } = feed;
    const navigation = pageProps.permissions?.navigation ?? {} as SharedProps['permissions']['navigation'];
    const canViewReports = Boolean(pageProps.permissions?.reports && navigation.reports);
    const navigationGroups = buildPortalNavigation(
        pageProps.workspaceExperience,
        navigation,
        canViewReports,
    );
    const mobileDestinations = navigationGroups.flatMap(group => group.items)
        .filter(item => ['home', 'myWork', 'calendar'].includes(item.key))
        .flatMap(item => item.key === 'home'
            ? [{ ...item, label: 'Home' }, { ...item, key: 'personalTasks', label: 'Tasks', href: '/dashboard#personal-tasks', icon: ListChecks }]
            : [{ ...item, label: item.key === 'myWork' ? 'Work' : item.label }])
        .slice(0, 4);
    const isMobileDestinationActive = (item: { key: string; href: string }) =>
        isPortalPathActive(currentUrl, item.href) && !(item.key === 'home' && hash === '#personal-tasks');
    const moreActive = !mobileDestinations.some(isMobileDestinationActive)
        && navigationGroups.some(group => group.items.some(item => isPortalPathActive(currentUrl, item.href)));
    const mobileItemClass = (active: boolean) => `flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1 text-xs font-semibold transition-colors duration-200 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-700 dark:focus-visible:outline-emerald-300 ${active
        ? 'bg-emerald-50 text-[#145a43] dark:bg-[#294b3a] dark:text-[#d2f7df]'
        : 'text-slate-600 hover:bg-slate-100 hover:text-[#145a43] dark:text-slate-200 dark:hover:bg-[#294b3a] dark:hover:text-[#d2f7df]'}`;

    // Presence is evidence from this authenticated, visible browser session. Hidden tabs
    // must not keep an employee online, and CSRF remains enforced by Laravel.
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
                // Keep the in-memory preference when browser storage is unavailable.
            }

            return next;
        });
    };

    useEffect(() => {
        if (!notificationsOpen) return;
        const escape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') { setNotificationsOpen(false); notificationsButton.current?.focus(); }
        };
        const outside = (event: PointerEvent) => {
            if (!notificationsPanel.current?.contains(event.target as Node)) setNotificationsOpen(false);
        };
        document.addEventListener('keydown', escape);
        document.addEventListener('pointerdown', outside);
        return () => {
            document.removeEventListener('keydown', escape);
            document.removeEventListener('pointerdown', outside);
        };
    }, [notificationsOpen]);

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
        } catch (error) {
            if (signal.aborted) return;
            setFeedState('unavailable');
        }

    }, 8000);

    useEffect(() => {
        const workflowNotifications = notifications.filter((notification) => notification.type === 'transaction');

        if (!notificationsInitialized.current) {
            workflowNotifications.forEach((notification) => knownNotificationKeys.current.add(notification.key));
            notificationsInitialized.current = true;

            const justArrived = workflowNotifications.find((notification) => {
                if (!notification.created_at) return false;
                const age = Date.now() - new Date(notification.created_at).getTime();
                return age >= -5000 && age <= 15000;
            });

            if (justArrived) {
                setLiveAlert(justArrived);
                setUnseenWorkflowCount(1);
            }

            return;
        }

        const newWorkflowNotifications = workflowNotifications.filter(
            (notification) => !knownNotificationKeys.current.has(notification.key),
        );

        if (newWorkflowNotifications.length === 0) return;

        newWorkflowNotifications.forEach((notification) => knownNotificationKeys.current.add(notification.key));
        setLiveAlert(newWorkflowNotifications[0]);
        setUnseenWorkflowCount((count) => count + newWorkflowNotifications.length);
    }, [notifications]);

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

    const desktopSidebar = (
        <PortalSidebar
            {...sidebarProps}
            collapsed={desktopCollapsed}
            onToggleCollapsed={toggleDesktopSidebar}
        />
    );

    const mobileSidebar = (
        <PortalSidebar
            {...sidebarProps}
            collapsed={false}
            mobile
            onNavigate={() => setMobileOpen(false)}
        />
    );

    const showMemo = pendingMemo && dismissedMemoId !== pendingMemo.id;
    const bellCount = unreadMemoCount + unseenWorkflowCount;

    return (
        <>
            <Head title={title} />
            <a href="#portal-content" className="sr-only z-[80] rounded bg-white p-3 text-blue-900 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
            <div data-presentation={presentation} data-workspace-shell={workspaceRefinement || undefined}
                className={`min-h-screen bg-[var(--municipal-canvas)] text-slate-900 transition-colors dark:bg-[#0d1624] dark:text-slate-100 lg:grid lg:transition-[grid-template-columns] lg:duration-150 lg:ease-out motion-reduce:transition-none ${
                    desktopCollapsed
                        ? 'lg:grid-cols-[72px_minmax(0,1fr)]'
                        : 'lg:grid-cols-[248px_minmax(0,1fr)]'
                }`}
            >
                <aside className="hidden h-screen shadow-xl shadow-[#071e3d]/10 lg:sticky lg:top-0 lg:block">{desktopSidebar}</aside>

                {mobileOpen && (
                    <MobileNavigation
                        onClose={() => setMobileOpen(false)}
                        onDesktop={() => setMobileOpen(false)}
                    >
                        {mobileSidebar}
                    </MobileNavigation>
                )}

                <main className="min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-6">
                    <header className="sticky top-0 z-20 flex min-h-[72px] sm:min-h-[76px] items-center justify-between gap-2 border-b border-slate-200/80 bg-white/95 px-3 shadow-sm shadow-slate-900/5 backdrop-blur-md transition-colors dark:border-slate-700/80 dark:bg-[#142236]/95 sm:px-6">
                        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                            <button onClick={() => setMobileOpen(true)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden" aria-label="Open navigation" aria-expanded={mobileOpen} aria-controls={mobileOpen ? 'portal-mobile-navigation' : undefined} aria-haspopup="dialog">
                                <Menu size={20} />
                            </button>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-base font-extrabold tracking-tight text-[#0b442d] dark:text-white sm:text-xl">One <span className="text-[#19754b] dark:text-emerald-300">Talibon</span></div>
                                <div className="hidden text-[10px] font-semibold uppercase tracking-wider sm:block">LGU Intra-Office Portal</div>
                                <div className="mt-0.5 truncate text-xs font-medium text-slate-500 dark:text-slate-400">{title}</div>
                            </div>
                        </div>

                        {navigationGroups.some((group) => group.items.some((item) => item.key === 'records')) && (
                            <div className="hidden min-w-0 lg:block">
                                <RecordsSearch />
                            </div>
                        )}
                        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                            <div ref={notificationsPanel} className="relative">
                                <button
                                    ref={notificationsButton}
                                    onClick={() => { setNotificationsOpen((open) => !open); setUnseenWorkflowCount(0); }}
                                    className="relative flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                    aria-label="Open notifications"
                                    aria-expanded={notificationsOpen}
                                    aria-controls="portal-notifications"
                                >
                                    <Bell size={18} />
                                    {bellCount > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-rose-600 px-1 text-center text-xs font-bold text-white sm:text-xs">{bellCount > 9 ? '9+' : bellCount}</span>}
                                </button>

                                {notificationsOpen && (
                                    <div id="portal-notifications" className="fixed left-3 right-3 top-20 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#142236] sm:absolute sm:left-auto sm:right-0 sm:top-10 sm:w-[350px]">
                                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
                                            <div>
                                                <div className="text-[12px] font-bold text-slate-950 dark:text-slate-100 sm:text-sm">Recent activity</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 sm:text-xs">{feedState === 'current' ? 'New office arrivals and unread memoranda' : feedState === 'expired' ? 'Session expired. Sign in again to refresh.' : feedState === 'unavailable' ? 'Updates unavailable; showing last received items.' : 'Loading updates…'}</div>
                                            </div>
                                            <button onClick={() => setNotificationsOpen(false)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close notifications"><X size={16} /></button>
                                        </div>
                                        <div className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-700">
                                            {notifications.map((notification) => (
                                                <Link key={notification.key} href={notification.url} onClick={() => setNotificationsOpen(false)} className="block px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/60">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300 sm:text-xs">{notification.title}</div>
                                                            <div className="mt-1 text-[13px] leading-4 text-slate-700 dark:text-slate-200 sm:text-sm">{notification.message}</div>
                                                            {notification.created_at && <div className="mt-1.5 text-xs text-slate-400 sm:text-xs">{relativeTime(notification.created_at)}</div>}
                                                        </div>
                                                        {notification.urgent && <span className="shrink-0 rounded-full bg-rose-50 px-2 py-1 text-xs font-bold uppercase text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 sm:text-xs">Action</span>}
                                                    </div>
                                                </Link>
                                            ))}
                                            {notifications.length === 0 && <div className="px-4 py-8 text-center text-[13px] text-slate-500 dark:text-slate-400 sm:text-sm">{feedState === 'current' ? 'No recent notifications.' : 'Notifications have not been refreshed.'}</div>}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <PortalLauncher groups={navigationGroups} />
                            <PortalIdentity user={user} />
                        </div>
                    </header>

                    {(flash?.success || flash?.error) && (
                        <div role={flash.error ? 'alert' : 'status'} className={`portal-flash mx-3 mt-3 rounded-xl border px-3 py-2.5 text-[12px] font-semibold sm:mx-4 sm:mt-4 sm:px-4 sm:py-3 sm:text-sm md:mx-8 ${flash.success ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200' : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200'}`}>
                            {flash.success || flash.error}
                        </div>
                    )}
                    <div id="portal-content" data-workspace-refinement={workspaceRefinement || undefined} data-presentation={presentation === 'portal-dashboard' ? 'dashboard' : undefined} tabIndex={-1} className={presentation === 'portal-dashboard' ? 'p-3 sm:p-4' : undefined}><NotificationStateContext.Provider value={feedState}><NotificationContext.Provider value={notifications}>{children}</NotificationContext.Provider></NotificationStateContext.Provider></div>
                    <footer className="mx-3 flex flex-wrap justify-between gap-2 border-t border-slate-200 py-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:mx-5"><span>Municipality of Talibon · Province of Bohol</span><span>One Talibon · Intra-Office Portal</span></footer>

                    <nav aria-label="Mobile workspace navigation"
                        className={`fixed bottom-0 inset-x-0 z-30 ${editingField ? 'hidden' : 'grid'} gap-1 border-t border-slate-200 bg-white px-1 pt-1 dark:border-slate-700 dark:bg-[#102c21] md:hidden`}
                        style={{ gridTemplateColumns: `repeat(${mobileDestinations.length + 1}, minmax(0, 1fr))`, paddingBottom: 'max(4px, env(safe-area-inset-bottom, 0px))', paddingLeft: 'max(4px, env(safe-area-inset-left, 0px))', paddingRight: 'max(4px, env(safe-area-inset-right, 0px))' }}>
                        {mobileDestinations.map(({ key, label, href, icon: Icon }) => {
                            const active = isMobileDestinationActive({ key, href });
                            return <a key={key} href={href} aria-current={active ? 'page' : undefined}
                                onClick={(event) => {
                                    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                                    if (key === 'personalTasks' && window.location.pathname === '/dashboard') {
                                        requestAnimationFrame(() => document.getElementById('personal-tasks')?.focus({ preventScroll: true }));
                                    }
                                }}
                                className={mobileItemClass(active)}>
                                <Icon size={20} aria-hidden="true" /><span className="text-xs font-semibold leading-4">{label}</span>
                            </a>;
                        })}
                        <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open more navigation options" aria-description={moreActive ? 'Current section is in More' : undefined} aria-expanded={mobileOpen} aria-controls={mobileOpen ? 'portal-mobile-navigation' : undefined} aria-haspopup="dialog"
                            className={mobileItemClass(moreActive || mobileOpen)}>
                            <Menu size={20} aria-hidden="true" /><span className="text-xs font-semibold leading-4">More</span>
                        </button>
                    </nav>
                </main>
            </div>

            {liveAlert && (
                <div className="fixed left-3 right-3 top-16 z-[60] sm:left-auto sm:right-4 sm:top-20 sm:w-[390px]">
                    <div className="overflow-hidden rounded-xl border border-blue-200 bg-white shadow-2xl shadow-slate-900/15 dark:border-blue-900 dark:bg-[#142236]">
                        <div className="h-1 bg-blue-700" />
                        <div className="p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 sm:text-xs"><span className="h-2 w-2 rounded-full bg-emerald-500" /> {liveAlert.title}</div>
                                    <div className="mt-2 text-[12px] font-semibold leading-5 text-slate-950 dark:text-slate-100 sm:text-sm">{liveAlert.message}</div>
                                    <div className="mt-1 text-xs text-slate-400 sm:text-xs">{relativeTime(liveAlert.created_at)}</div>
                                </div>
                                <button onClick={() => setLiveAlert(null)} className="shrink-0 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Dismiss notification"><X size={16} /></button>
                            </div>
                            <div className="mt-3 flex justify-end"><Link href={liveAlert.url} onClick={() => { setLiveAlert(null); setUnseenWorkflowCount(0); }} className="rounded-lg bg-[#0b2852] px-4 py-2 text-[13px] font-semibold text-white sm:text-xs">Open request</Link></div>
                        </div>
                    </div>
                </div>
            )}

            {showMemo && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-4">
                    <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-2xl dark:bg-[#142236] sm:p-6 md:p-8">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200 sm:h-12 sm:w-12"><Bell size={19} /></div>
                            <button onClick={() => setDismissedMemoId(pendingMemo.id)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 sm:p-2" aria-label="Dismiss memorandum"><X size={18} /></button>
                        </div>
                        <div className="mt-4 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 sm:mt-6 sm:text-xs">New Memorandum · {pendingMemo.memo_number}</div>
                        <h2 className="mt-2 text-xl font-bold text-slate-950 dark:text-slate-100 sm:text-2xl">{pendingMemo.title}</h2>
                        <p className="mt-2 text-[12px] text-slate-500 dark:text-slate-300 sm:mt-3 sm:text-sm">Issued by {pendingMemo.department || pendingMemo.issuer || "Mayor's Office"}. {pendingMemo.requires_acknowledgement ? 'Acknowledgement is required.' : 'Please review this issuance.'}</p>
                        <div className="mt-5 flex justify-end gap-2 sm:mt-7 sm:gap-3">
                            <button onClick={() => setDismissedMemoId(pendingMemo.id)} className="rounded-lg border border-slate-300 px-3 py-2 text-[12px] font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200 sm:px-4 sm:py-2.5 sm:text-sm">Later</button>
                            <Link href={`/memoranda/${pendingMemo.id}`} className="rounded-lg bg-[#0b2852] px-4 py-2 text-[12px] font-semibold text-white sm:px-5 sm:py-2.5 sm:text-sm">Open memorandum</Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
