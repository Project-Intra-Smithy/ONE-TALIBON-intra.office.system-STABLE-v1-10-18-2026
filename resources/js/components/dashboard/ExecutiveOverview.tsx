import DashboardSection, { EmptyState } from './DashboardSection';
import RecentWorkList from './RecentWorkList';
import type { ExecutiveOverviewData } from './types';

export default function ExecutiveOverview({ overview }: { overview: ExecutiveOverviewData }) {
    return <>
        <DashboardSection title="Office workload" description="Office workload for municipal follow-up.">
            {overview.departmentWorkload.length ? <div className="dashboard-table-scroll" role="region" aria-label="Office workload table" tabIndex={0}>
                <table className="dashboard-table"><caption className="sr-only">Municipal work by office</caption>
                    <thead><tr><th scope="col">Office</th><th scope="col">Active</th><th scope="col">Unassigned</th><th scope="col">Due soon</th><th scope="col">Overdue</th></tr></thead>
                    <tbody>{overview.departmentWorkload.map((office) => <tr key={office.id}>
                        <th scope="row"><strong>{office.shortName || office.name}</strong><span className="dashboard-description">{office.code}</span></th>
                        <td>{office.active}</td><td>{office.unassigned}</td><td>{office.dueSoon}</td><td>{office.overdue}</td>
                    </tr>)}</tbody>
                </table>
            </div> : <EmptyState>No active municipal workload.</EmptyState>}
        </DashboardSection>
        <RecentWorkList title="Oldest unresolved work" description="Municipal work awaiting completion." items={overview.oldestUnresolved} />
        <RecentWorkList title="Recently completed" description="Latest completed municipal work." items={overview.recentlyCompleted} emptyMessage="No recently completed work in this view." />
    </>;
}
