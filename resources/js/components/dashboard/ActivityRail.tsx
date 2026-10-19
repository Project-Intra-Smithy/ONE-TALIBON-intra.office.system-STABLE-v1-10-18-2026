import { Link } from '@inertiajs/react';
import { useNotificationState, usePortalNotifications } from '../shell/NotificationContext';
import { formatDate, humanize } from './format';
import DashboardSection, { EmptyState } from './DashboardSection';
import type { SystemOverviewData } from './types';

export default function ActivityRail({ system }: { system?: SystemOverviewData }) {
    const notifications = usePortalNotifications();
    const notificationState = useNotificationState();
    const feedMessage = notificationState === 'loading' ? 'Loading notifications…'
        : notificationState === 'expired' ? 'Session expired or access unavailable. Sign in again.'
        : notificationState === 'unavailable' ? 'Notifications unavailable. Retrying.' : null;
    return <DashboardSection title={system ? 'Security activity' : 'Recent activity'}>
        <ul className="dashboard-list">
            {!system && feedMessage && <li role="status" className="dashboard-work">{feedMessage}</li>}
            {system ? system.security.recentEvents.map((event, index) => <li key={index} className="dashboard-work">
                <strong>{humanize(event.action)}</strong><p>{event.summary}</p>
                <div className="dashboard-row dashboard-muted"><span>{event.actor || 'System'} · {humanize(event.outcome)}</span><span>{formatDate(event.createdAt)}</span></div>
            </li>) : notifications.map((item) => <li key={item.key}>
                <Link href={item.url} className="dashboard-work">
                    <strong>{item.title}</strong><p>{item.message}</p>
                    <div className="dashboard-row dashboard-muted">{item.urgent && <span className="dashboard-status" data-tone="due_soon">For action</span>}<span>{formatDate(item.created_at)}</span></div>
                </Link>
            </li>)}
        </ul>
        {(system ? system.security.recentEvents.length === 0 : notificationState === 'current' && notifications.length === 0) && <EmptyState>{system ? 'No recent security events.' : 'No recent notifications.'}</EmptyState>}
    </DashboardSection>;
}
