import { Link } from '@inertiajs/react';
import { humanize } from './format';
import DashboardSection, { EmptyState } from './DashboardSection';
import RecentWorkList from './RecentWorkList';
import type { OfficeOverviewData } from './types';

export default function OfficeOverview({ overview }: { overview: OfficeOverviewData }) {
    return <>
        <DashboardSection title="Staff workload" description="Staff assignments and work requiring follow-up."
            action={<Link href="/transactions?view=office_queue" className="dashboard-text-action">Open office work</Link>}>
            {overview.staffWorkload.length ? <div className="dashboard-table-scroll" role="region" aria-label="Staff workload table" tabIndex={0}>
                <table className="dashboard-table"><caption className="sr-only">Staff workload by employee</caption>
                    <thead><tr><th scope="col">Employee</th><th scope="col">Active</th><th scope="col">Overdue</th><th scope="col">Needs action</th></tr></thead>
                    <tbody>{overview.staffWorkload.map((row, index) => <tr key={index}>
                        <th scope="row"><strong>{row.employee}</strong><span className="dashboard-description">{row.position || 'Position not recorded'}</span></th>
                        <td>{row.active}</td><td>{row.overdue}</td><td>{row.requiresAction}</td>
                    </tr>)}</tbody>
                </table>
            </div> : <EmptyState>No active assigned office work.</EmptyState>}
        </DashboardSection>
        <DashboardSection title="Active status mix">
            <dl className="dashboard-metrics">{overview.statusOverview.map((row) => <div key={row.status}><dt>{humanize(row.status)}</dt><dd>{row.count}</dd></div>)}</dl>
            {!overview.statusOverview.length && <EmptyState>No active office status rows.</EmptyState>}
        </DashboardSection>
        <RecentWorkList title="Oldest unresolved office work" description="Office work awaiting completion." items={overview.oldestUnresolved} />
    </>;
}
