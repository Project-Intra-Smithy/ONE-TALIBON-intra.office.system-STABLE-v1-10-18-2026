import { Link } from '@inertiajs/react';
import { Bell, ShieldCheck } from 'lucide-react';
import { useNotificationState, usePortalNotifications } from '../shell/NotificationContext';
import { formatDate, humanize } from './format';
import DashboardScrollRegion from './DashboardScrollRegion';
import type { SystemOverviewData } from './types';

type Props = { system?: SystemOverviewData };

export default function ActivityRail({ system }: Props) {
    const notifications = usePortalNotifications();
    const notificationState = useNotificationState();
    const feedMessage = notificationState === 'loading' ? 'Loading notifications…'
        : notificationState === 'expired' ? 'Session expired or access unavailable. Sign in again to refresh.'
        : notificationState === 'unavailable' ? 'Notifications unavailable. Retrying automatically.' : null;
    const eventCount = system ? system.security.recentEvents.length : notifications.length;
    return <section className="municipal-panel min-w-0 overflow-hidden" aria-labelledby="dashboard-activity">
            <h2 id="dashboard-activity" className="ot-dashboard-panel-heading municipal-panel-title border-b border-slate-100 px-4 py-4 dark:border-slate-700">{system ? <ShieldCheck size={18} className="text-blue-600 dark:text-blue-300" /> : <Bell size={18} className="text-blue-600 dark:text-blue-300" />}{system ? 'Security activity' : 'Recent activity'}<span className="ot-dashboard-panel-count" aria-label={`${eventCount} activity items`}>{eventCount}</span></h2>
            <DashboardScrollRegion label={system ? 'Security activity list' : 'Recent activity list'} itemCount={eventCount} className="divide-y divide-slate-100 dark:divide-slate-700">
                {!system && feedMessage && <p role="status" className="px-4 py-4 text-base">{feedMessage}{notifications.length > 0 && ' Showing last received items.'}</p>}
                {system ? system.security.recentEvents.map((event, index) => <article key={`${event.action}-${index}`} className="px-4 py-3">
                    <div className="text-base font-semibold">{humanize(event.action)}</div>
                    <p className="mt-1 text-base leading-6 text-slate-600 dark:text-slate-300">{event.summary}</p>
                    <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">{event.actor || 'System'} · {humanize(event.outcome)}</div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatDate(event.createdAt)}</div>
                </article>) : notifications.map((item) => <Link key={item.key} href={item.url} className="aj-activity-row flex gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.urgent ? 'bg-rose-500' : 'bg-emerald-600'}`} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-base font-semibold">{item.title}</h3>
                            {item.read_url && <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Unread</span>}
                        </div>
                        <p className="mt-3 break-words text-base leading-7 text-slate-600 dark:text-slate-300">{item.message}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
                            {item.requires_acknowledgement ? <span className="font-semibold">Acknowledgement required</span> : item.urgent && <span className="font-semibold text-rose-700 dark:text-rose-300">For action</span>}
                            <time dateTime={item.created_at || undefined}>{formatDate(item.created_at)}</time>
                            <span className="font-semibold text-emerald-800 dark:text-emerald-200">Open record <span aria-hidden="true">?</span></span>
                        </div>
                    </div>
                </Link>)}
                {(system ? system.security.recentEvents.length === 0 : notificationState === 'current' && notifications.length === 0) && <p className="px-4 py-7 text-center text-base leading-6 text-slate-500 dark:text-slate-400">{system ? 'No recent security events.' : 'No recent notifications.'}</p>}
            </DashboardScrollRegion>
    </section>;
}
