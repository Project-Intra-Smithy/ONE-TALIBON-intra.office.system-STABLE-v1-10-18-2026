import { Link } from '@inertiajs/react';
import { formatDate, humanize } from './format';
import DashboardSection, { EmptyState } from './DashboardSection';
import type { CorrespondenceItem, CorrespondenceOverviewData } from './types';

function CorrespondenceList({ title, items, dateKey }: {
    title: string; items: CorrespondenceItem[]; dateKey: 'receivedAt' | 'routedAt';
}) {
    return <div className="dashboard-subsection">
        <h3>{title}</h3>
        <ul className="dashboard-list">
            {items.map((item) => <li key={item.detailUrl}>
                <Link href={item.detailUrl} className="dashboard-work">
                    <div className="dashboard-row"><span className="dashboard-reference">{item.reference || 'Reference pending'}</span><span>{humanize(item.lifecycle)}</span></div>
                    <strong>{item.subject}</strong>
                    <p>{item.sender ? item.sender + ' · ' : ''}{item.currentOffice?.shortName || item.currentOffice?.name || 'Office pending'}</p>
                    <p>{formatDate(item[dateKey])}</p>
                </Link>
            </li>)}
        </ul>
        {!items.length && <EmptyState>No recent correspondence.</EmptyState>}
    </div>;
}
export default function CorrespondenceOverview({ overview }: { overview: CorrespondenceOverviewData }) {
    const maximum = Math.max(0, ...overview.status.map(row => row.count));
    return <DashboardSection title="Correspondence workspace" action={<Link className="dashboard-text-action" href="/correspondence">Open correspondence</Link>}>
        <Link href={overview.attention.link} className="dashboard-attention">
            <strong>{overview.attention.value.toLocaleString()}</strong><span>{overview.attention.label}</span>
        </Link>
        <dl className="dashboard-metrics dashboard-metrics--chart">
            {overview.status.map((row) => <div key={row.lifecycle}><dt><Link href={row.link}>{row.label}</Link></dt><dd>{row.count.toLocaleString()}</dd><div className="dashboard-bar" aria-hidden="true"><span style={{ width: `${maximum > 0 ? row.count / maximum * 100 : 0}%` }} /></div></div>)}
        </dl>
        <CorrespondenceList title="Recently received" items={overview.recentlyReceived} dateKey="receivedAt" />
        <details className="dashboard-details"><summary>Recently routed ({overview.recentlyRouted.length})</summary><CorrespondenceList title="Routing details" items={overview.recentlyRouted} dateKey="routedAt" /></details>
    </DashboardSection>;
}
