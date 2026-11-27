import { Bell, BriefcaseBusiness, ChartNoAxesCombined, MessageCircle, Megaphone, ShieldCheck } from 'lucide-react';
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
 * Gerry's three requested top-level surfaces are truthful availability states,
 * not independently authorized publication or messaging systems.
 * Authorized operational summaries remain below them.
 */
export default function R7UpperRegion({ recentWork, groups, system, head }: Props) {
    const recentTitle = head ? 'My recent work' : 'Recent work';
    const activityTitle = system ? 'Security activity' : 'Activity & notifications';

    return (
        <section id="work-overview" tabIndex={-1} className="r7-upper workspace-section-target" aria-label="Dashboard operational overview">
            <div className="r7-upper-grid">
                <section className="r7-panel r7-top-summary" aria-labelledby="r7-advisories-title">
                    <h2 id="r7-advisories-title" className="r7-section-kicker">
                        <Bell size={18} aria-hidden="true" /> Recent Advisories
                    </h2>
                    <p className="r7-empty" role="status">No approved advisory feed is currently available.</p>
                    <p className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300">Municipal advisory sources and publishing authority are pending confirmation.</p>
                </section>
                <section className="r7-panel r7-top-work" aria-labelledby="r7-announcements-title">
                    <h2 id="r7-announcements-title" className="r7-section-kicker">
                        <Megaphone size={18} aria-hidden="true" /> Announcements
                    </h2>
                    <p className="r7-empty" role="status">Announcements are not yet available.</p>
                    <p className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300">Official publishing and audience rules must be approved before notices appear here.</p>
                </section>
                <section className="r7-panel r7-top-activity" aria-labelledby="r7-chat-title">
                    <h2 id="r7-chat-title" className="r7-section-kicker">
                        <MessageCircle size={18} aria-hidden="true" /> Chat Room
                    </h2>
                    <p className="r7-empty" role="status"><strong>Planned</strong> — not available in this evaluation.</p>
                    <p className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300">Messaging remains disabled until municipal policy and security acceptance are complete.</p>
                </section>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3" aria-label="Authorized operational summaries">
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
