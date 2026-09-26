import ActivityRail from '../components/dashboard/ActivityRail';
import AdministrativeAttention from '../components/dashboard/AdministrativeAttention';
import AttentionQueue from '../components/dashboard/AttentionQueue';
import AttentionSummary from '../components/dashboard/AttentionSummary';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { dashboardAttentionWork, dashboardDueToday, dashboardOpenDeadlines, dashboardProjectAttention, dashboardUpcomingDeadlines } from '../components/dashboard/dashboardSelectors';
import ExecutiveHistory from '../components/dashboard/ExecutiveHistory';
import ExecutiveOverview from '../components/dashboard/ExecutiveOverview';
import MetricGroup from '../components/dashboard/MetricGroup';
import MunicipalUpdates from '../components/dashboard/MunicipalUpdates';
import OfficeActivityFeed from '../components/dashboard/OfficeActivityFeed';
import OfficeOverview from '../components/dashboard/OfficeOverview';
import PortalMenuOverview from '../components/dashboard/PortalMenuOverview';
import PortalQuickAccess from '../components/dashboard/PortalQuickAccess';
import ProjectPortfolio from '../components/dashboard/ProjectPortfolio';
import QuickActions from '../components/dashboard/QuickActions';
import RecentCorrespondence from '../components/dashboard/RecentCorrespondence';
import RecentDocuments from '../components/dashboard/RecentDocuments';
import SchedulePanel from '../components/dashboard/SchedulePanel';
import SystemOverview from '../components/dashboard/SystemOverview';
import type { DashboardProps } from '../components/dashboard/types';
import { getMunicipalDashboardData } from '../data/municipal/dashboard';
import { getDashboardCorrespondenceUpdates } from '../data/municipal/dashboardCorrespondence';
import AppLayout from '../layouts/AppLayout';

export default function Dashboard({ experience, metricGroups, correspondenceOverview, recentWork, officeOverview, executiveOverview, systemOverview }: DashboardProps) {
    const municipal = getMunicipalDashboardData(experience);
    const supplementalCorrespondence = getDashboardCorrespondenceUpdates(experience);
    const attentionWork = dashboardAttentionWork(experience, recentWork, officeOverview, executiveOverview);
    const projectAttention = dashboardProjectAttention(municipal.projects);
    const openDeadlines = dashboardOpenDeadlines(municipal.deadlines);
    const dueToday = dashboardDueToday(openDeadlines);
    const upcomingDeadlines = dashboardUpcomingDeadlines(openDeadlines);
    const isAdministrator = experience.key === 'system_administration';
    const isMpdo = experience.key === 'department_head' && experience.department.code.toUpperCase() === 'MPDO';
    const administrativeFollowUp = systemOverview?.operations.departmentWorkload.filter((office) => office.overdue > 0 || office.unassigned > 0).length ?? 0;
    const attentionQueueHref = experience.key === 'executive_oversight' ? '/mayor-office' : experience.key === 'department_head' ? '/transactions?view=office_queue' : '/transactions?view=needs_my_action';
    const attentionQueueLabel = experience.key === 'executive_oversight' ? 'Open executive work' : experience.key === 'department_head' ? 'Open office work' : 'Open my work';

    return <AppLayout title="Dashboard">
        <div className="@container employee-section-stack mx-auto min-w-0 max-w-[1560px]">
            <DashboardHeader experience={experience} />
            <PortalQuickAccess />
            <AttentionSummary workCount={isAdministrator ? administrativeFollowUp : attentionWork.length}
                overdueWorkCount={isAdministrator ? systemOverview?.operations.departmentWorkload.filter((office) => office.overdue > 0).length ?? 0 : attentionWork.filter((item) => item.dueState === 'overdue').length}
                projectAttentionCount={projectAttention.length} dueTodayCount={dueToday.length}
                correspondenceAttentionCount={correspondenceOverview?.attention.value ?? supplementalCorrespondence.filter((item) => item.lifecycle === 'for_action').length}
                workLabel={isAdministrator ? 'Offices requiring follow-up' : undefined} overdueLabel={isAdministrator ? 'Offices with overdue work' : undefined} />
            <section aria-label="Announcements, work and upcoming activities" className="grid min-w-0 gap-3 @min-[1000px]:grid-cols-3 @min-[1000px]:items-start">
                <div className="@container order-2 min-w-0 @min-[1000px]:order-1"><MunicipalUpdates announcements={municipal.announcements} planningUpdates={municipal.planningUpdates} mode="announcements" /></div>
                <div className="@container order-1 min-w-0 @min-[1000px]:order-2">{isAdministrator && systemOverview ? <AdministrativeAttention workload={systemOverview.operations.departmentWorkload} /> : <AttentionQueue items={attentionWork} href={attentionQueueHref} linkLabel={attentionQueueLabel} />}</div>
                <div className="@container order-3 min-w-0"><SchedulePanel meetings={municipal.meetings} deadlines={upcomingDeadlines} /></div>
            </section>
            <div className="grid min-w-0 gap-3 @min-[900px]:grid-cols-2 @min-[900px]:items-start">
                <div className="@container order-2 min-w-0 @min-[900px]:order-1"><ProjectPortfolio projects={municipal.projects} /></div>
                <div className="@container order-1 min-w-0 @min-[900px]:order-2"><RecentDocuments documents={municipal.documents} /></div>
            </div>
            <p className="text-xs text-[var(--municipal-muted)]">Municipal announcements, schedules, project snapshots and recent document summaries include prototype reference data.</p>
            <section aria-label="Office and role context" className="grid min-w-0 gap-3 @min-[1000px]:grid-cols-2">
                {metricGroups.filter((group) => group.key !== 'system').map((group) => <MetricGroup key={group.key} group={group} />)}
                {experience.key === 'department_head' && officeOverview && <OfficeOverview overview={officeOverview} />}
                {experience.key === 'executive_oversight' && executiveOverview && <ExecutiveOverview overview={executiveOverview} />}
                {isAdministrator && systemOverview && <SystemOverview overview={systemOverview} />}
                {isMpdo && <MunicipalUpdates announcements={municipal.announcements} planningUpdates={municipal.planningUpdates} mode="planning" />}
            </section>
            <details className="municipal-panel min-w-0 overflow-hidden">
                <summary className="min-h-11 cursor-pointer px-4 py-3 text-sm font-semibold">Workspace shortcuts, correspondence & activity</summary>
                <div className="space-y-3 border-t border-[var(--municipal-border)] p-3">
                    <QuickActions actions={experience.quickActions} />
                    <RecentCorrespondence overview={correspondenceOverview} supplemental={supplementalCorrespondence} />
                    {experience.key === 'executive_oversight' && executiveOverview && <ExecutiveHistory overview={executiveOverview} />}
                    <div className="grid min-w-0 gap-3 @min-[1000px]:grid-cols-2"><OfficeActivityFeed activity={municipal.officeActivity} /><ActivityRail /></div>
                </div>
            </details>
            <PortalMenuOverview />
        </div>
    </AppLayout>;
}
