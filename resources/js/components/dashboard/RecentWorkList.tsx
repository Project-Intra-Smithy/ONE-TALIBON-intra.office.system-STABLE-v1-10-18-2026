import { Link } from '@inertiajs/react';
import { formatDate, humanize } from './format';
import DashboardSection, { EmptyState } from './DashboardSection';
import type { DashboardWork } from './types';

type Props = { title: string; description: string; items: DashboardWork[]; emptyMessage?: string };
export default function RecentWorkList({ title, description, items, emptyMessage = 'No work currently requires attention in this view.' }: Props) {
    return <DashboardSection title={title} description={description}>
        <ul className="dashboard-list">
            {items.map((item) => <li key={item.detailUrl}>
                <Link href={item.detailUrl} className="dashboard-work">
                    <div className="dashboard-row">
                        <span className="dashboard-reference">{item.reference} · {humanize(item.transactionType)}</span>
                        <span className="dashboard-status" data-tone={item.dueState}>{humanize(item.dueState)}</span>
                    </div>
                    <strong>{item.title}</strong>
                    <p>{item.originOffice?.shortName || item.originOffice?.name || 'Unknown origin'} → {item.currentOffice?.shortName || item.currentOffice?.name || 'Unknown office'}</p>
                    <div className="dashboard-row dashboard-muted">
                        <span>{item.assignedEmployee?.name || 'Unassigned'} · {humanize(item.status)}</span>
                        <span>Updated {formatDate(item.updatedAt)}</span>
                    </div>
                </Link>
            </li>)}
        </ul>
        {!items.length && <EmptyState>{emptyMessage}</EmptyState>}
    </DashboardSection>;
}
