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

/** Authorized operational dashboard summaries only; disabled modules have no promotional surface. */
export default function R7UpperRegion({ recentWork, groups, system, head }: Props) {
    const recentTitle = head ? 'My recent work' : 'Recent work';
    const activityTitle = system ? 'Security activity' : 'Activity & notifications';

    return (
        <section id="work-overview" tabIndex={-1} className="r7-upper workspace-section-target" aria-label="Dashboard operational overview">
            <div className="grid gap-4 lg:grid-cols-3" aria-label="Authorized operational summaries">
                <section className="r7-panel min-w-0" aria-labelledby="r7-upper-summary-title">
                    <h2 id="r7-upper-summary-title" className="r7-section-kicker">
                        <ChartNoAxesCombined size={18} aria-hidden="true" /> Work summary
                    </h2>
                    {groups.length
                        ? groups.map((group) => <MetricGroup key={group.key} group={group} />)
                        : <p className="r7-empty">No work summaries available for this account.</p>}
                </section>
                <section className="r7-panel min-w-0" aria-labelledby="r7-upper-work-title">
                    <h2 id="r7-upper-work-title" className="r7-section-kicker">
                        <BriefcaseBusiness size={18} aria-hidden="true" /> {recentTitle}
                    </h2>
                    <RecentWorkList title={recentTitle} description="Recently updated authorized work." items={recentWork} emptyMessage="No recent work to show." />
                </section>
                <section className="r7-panel min-w-0" aria-labelledby="r7-upper-activity-title">
                    <h2 id="r7-upper-activity-title" className="r7-section-kicker">
                        {system ? <ShieldCheck size={18} aria-hidden="true" /> : <Bell size={18} aria-hidden="true" />}
                        {activityTitle}
                    </h2>
                    <ActivityRail system={system} />
                </section>
            </div>
        </section>
    );
}
