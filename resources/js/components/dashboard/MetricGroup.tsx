import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { isStagedInertiaPath } from '../../navigation/stagedRoutes';
import DashboardSection, { EmptyState } from './DashboardSection';
import type { MetricGroupData } from './types';

export default function MetricGroup({ group }: { group: MetricGroupData }) {
    const title = ({ personal: 'My work', office: 'Office workload', executive: 'Municipal workload', system: 'Accounts and security' } as Record<string, string>)[group.key] || group.title;
    const maximum = Math.max(0, ...group.metrics.map(metric => Number.isFinite(metric.value) ? metric.value : 0));
    return <DashboardSection title={title}>
        <p className="dashboard-chart-note">Current counts; categories may overlap</p>
        <dl className="dashboard-metrics dashboard-metrics--chart">
            {group.metrics.map((metric) => <div key={metric.label}>
                <dt>{isStagedInertiaPath(metric.link)
                    ? <Link href={metric.link} aria-label={metric.label + ': ' + metric.value + '. Open related work.'}>{metric.label}<ArrowRight size={16} aria-hidden="true" /></Link>
                    : metric.label}</dt>
                <dd>{Number.isFinite(metric.value) ? metric.value.toLocaleString() : 'Unavailable'}</dd>
                <div className="dashboard-bar" aria-hidden="true"><span style={{ width: `${maximum > 0 && Number.isFinite(metric.value) ? Math.max(0, metric.value) / maximum * 100 : 0}%` }} /></div>
            </div>)}
        </dl>
        {group.metrics.length > 0 && maximum === 0 && <EmptyState>No recorded counts in this summary.</EmptyState>}
        {!group.metrics.length && <EmptyState>No summary figures available.</EmptyState>}
    </DashboardSection>;
}
