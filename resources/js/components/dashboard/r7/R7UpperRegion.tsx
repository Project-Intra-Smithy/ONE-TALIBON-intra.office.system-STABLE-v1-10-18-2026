import { Bell, BriefcaseBusiness, ChartNoAxesCombined, ShieldCheck } from 'lucide-react';
import ActivityRail from '../ActivityRail';
import MetricGroup from '../MetricGroup';
import RecentWorkList from '../RecentWorkList';
import type { DashboardWork, MetricGroupData, SystemOverviewData } from '../types';

type Props = {
    recentWork: DashboardWork[];
    groups: MetricGroupData[];
    system?: SystemOverviewData;
    head: boolean;
};

/**
 * The three visible headings belong to this region. Existing data components
 * retain their accessible names and server-authorized links beneath them.
 */
export default function R7UpperRegion({ recentWork, groups, system, head }: Props) {
    const recentTitle = head ? 'My recent work' : 'Recent work';
    const activityTitle = system ? 'Security activity' : 'Activity & notifications';

    return <section id="work-overview" tabIndex={-1} className="r7-upper workspace-section-target" aria-label="Dashboard operational overview">
        <div className="r7-upper-grid">
            <section className="r7-panel r7-top-work" aria-labelledby="r7-upper-work-title">
                <h2 id="r7-upper-work-title" className="r7-section-kicker">
                    <BriefcaseBusiness size={18} aria-hidden="true" />
                    <span>{recentTitle}</span>
                </h2>
                <RecentWorkList
                    compact
                    title={recentTitle}
                    description="Recently updated authorized work."
                    items={recentWork}
                    emptyMessage="No recent work to show."
                />
            </section>
            <section className="r7-panel r7-top-activity" aria-labelledby="r7-upper-activity-title">
                <h2 id="r7-upper-activity-title" className="r7-section-kicker">
                    {system ? <ShieldCheck size={18} aria-hidden="true" /> : <Bell size={18} aria-hidden="true" />}
                    <span>{activityTitle}</span>
                </h2>
                <ActivityRail system={system} />
            </section>
            <section className="r7-panel r7-top-summary" aria-labelledby="r7-upper-summary-title">
                <h2 id="r7-upper-summary-title" className="r7-section-kicker">
                    <ChartNoAxesCombined size={18} aria-hidden="true" />
                    <span>Work summary</span>
                </h2>
                {groups.length
                    ? groups.map((group) => <MetricGroup key={group.key} group={group} />)
                    : <p className="r7-empty">No work summaries available for this account.</p>}
            </section>
        </div>
    </section>;
}
