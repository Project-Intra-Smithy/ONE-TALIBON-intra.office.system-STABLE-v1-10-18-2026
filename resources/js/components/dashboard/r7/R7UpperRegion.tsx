import { Bell, BriefcaseBusiness, ChartNoAxesCombined } from 'lucide-react';
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

/** Reference A's three-column upper composition, using only authorized existing projections. */
export default function R7UpperRegion({ recentWork, groups, system, head }: Props) {
    return <section id="work-overview" tabIndex={-1} className="r7-upper workspace-section-target" aria-label="Dashboard operational overview">
        <div className="r7-upper-grid">
            <div className="r7-panel r7-top-work">
                <div className="r7-section-kicker"><BriefcaseBusiness size={18} aria-hidden="true" /> Authorized work</div>
                <RecentWorkList compact title={head ? 'My recent work' : 'Recent work'} description="Recently updated authorized work." items={recentWork} emptyMessage="No recent work to show." />
            </div>
            <div className="r7-panel r7-top-activity">
                <div className="r7-section-kicker"><Bell size={18} aria-hidden="true" /> Activity and notifications</div>
                <ActivityRail system={system} />
            </div>
            <div className="r7-panel r7-top-summary">
                <div className="r7-section-kicker"><ChartNoAxesCombined size={18} aria-hidden="true" /> Work summary</div>
                {groups.length ? groups.map(group => <MetricGroup key={group.key} group={group} />) : <p className="r7-empty">No work summaries available for this account.</p>}
            </div>
        </div>
    </section>;
}
