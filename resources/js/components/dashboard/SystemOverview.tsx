import DashboardSection from './DashboardSection';
import type { SystemOverviewData } from './types';

export default function SystemOverview({ overview }: { overview: SystemOverviewData }) {
    return <DashboardSection title="Office identities">
        <dl className="dashboard-metrics">
            <div><dt>Configured office identities</dt><dd>{overview.officeIdentityStatus.configured}</dd></div>
            <div><dt>Pending office identities</dt><dd>{overview.officeIdentityStatus.pending}</dd></div>
        </dl>
    </DashboardSection>;
}
