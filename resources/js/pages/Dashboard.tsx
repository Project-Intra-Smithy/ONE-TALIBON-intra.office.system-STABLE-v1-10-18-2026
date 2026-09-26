import { usePage } from '@inertiajs/react';
import type { SharedProps } from '../types';
import { buildPortalNavigation } from '../navigation/portalNavigation';
import DashboardPortalHero from '../components/dashboard/DashboardPortalHero';
import { RecentAnnouncementsCard, ActionDocumentsCard, UpcomingActivitiesCard, RecentDocumentsCard } from '../components/dashboard/DashboardPortalCards';
import ProjectStatusSnapshot from '../components/dashboard/ProjectStatusSnapshot';
import ActivityRail from '../components/dashboard/ActivityRail';
import AttentionSummary from '../components/dashboard/AttentionSummary';
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
import SystemOverview from '../components/dashboard/SystemOverview';
import type { DashboardProps } from '../components/dashboard/types';
import { getMunicipalDashboardData } from '../data/municipal/dashboard';
import { getDashboardCorrespondenceUpdates } from '../data/municipal/dashboardCorrespondence';
import AppLayout from '../layouts/AppLayout';

export default function Dashboard({ experience, metricGroups, correspondenceOverview, recentWork, officeOverview, executiveOverview, systemOverview }: DashboardProps) {
    const { workspaceExperience, permissions } = usePage<SharedProps>().props;
    const destinations = buildPortalNavigation(workspaceExperience, permissions.navigation).flatMap((group) => group.items);
    const destination = (key: string) => destinations.find((item) => item.key === key)?.href;
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

    return <AppLayout title="Dashboard" presentation="portal-dashboard">
        <div className="dashboard-portal">
            <DashboardPortalHero experience={experience} />
            <PortalQuickAccess />
            <div className="dashboard-primary-grid">
                <RecentAnnouncementsCard items={municipal.announcements} href={destination('announcements')} />
                <ActionDocumentsCard experience={experience} items={attentionWork} workload={systemOverview?.operations.departmentWorkload} href={attentionQueueHref} correspondenceCount={correspondenceOverview?.attention.value ?? supplementalCorrespondence.filter((item) => item.lifecycle === 'for_action').length} correspondenceHref={correspondenceOverview?.attention.link || destination('correspondence')} />
                <UpcomingActivitiesCard meetings={municipal.meetings} deadlines={[...dueToday, ...upcomingDeadlines]} dueTodayCount={dueToday.length} href={destination('calendar')} />
            </div>
            <div className="dashboard-secondary-grid">
                <ProjectStatusSnapshot projects={municipal.projects} href={destination('ppas')} />
                <RecentDocumentsCard items={municipal.documents} href={destination('documentCenter') || destination('records')} />
            </div>
            <p className="dashboard-reference-note">Municipal announcements, schedules, project snapshots and recent document summaries include prototype reference data.</p>
            <details className="municipal-panel dashboard-operational-context">
                <summary>Operational Context <span>Show details</span></summary>
                <div className="dashboard-operational-body">
            <AttentionSummary workCount={isAdministrator ? administrativeFollowUp : attentionWork.length}
                overdueWorkCount={isAdministrator ? systemOverview?.operations.departmentWorkload.filter((office) => office.overdue > 0).length ?? 0 : attentionWork.filter((item) => item.dueState === 'overdue').length}
                projectAttentionCount={projectAttention.length} dueTodayCount={dueToday.length}
                correspondenceAttentionCount={correspondenceOverview?.attention.value ?? supplementalCorrespondence.filter((item) => item.lifecycle === 'for_action').length}
                workLabel={isAdministrator ? 'Offices requiring follow-up' : undefined} overdueLabel={isAdministrator ? 'Offices with overdue work' : undefined} />
            <section aria-label="Office and role context" className="grid min-w-0 gap-3 @min-[1000px]:grid-cols-2">
                {metricGroups.filter((group) => group.key !== 'system').map((group) => <MetricGroup key={group.key} group={group} />)}
                {experience.key === 'department_head' && officeOverview && <OfficeOverview overview={officeOverview} />}
                {experience.key === 'executive_oversight' && executiveOverview && <ExecutiveOverview overview={executiveOverview} />}
                {isAdministrator && systemOverview && <SystemOverview overview={systemOverview} />}
                {isMpdo && <MunicipalUpdates announcements={municipal.announcements} planningUpdates={municipal.planningUpdates} mode="planning" />}
            </section>
                <ProjectPortfolio projects={municipal.projects} />
                <div className="space-y-3">
                    <QuickActions actions={experience.quickActions} />
                    <RecentCorrespondence overview={correspondenceOverview} supplemental={supplementalCorrespondence} />
                    {experience.key === 'executive_oversight' && executiveOverview && <ExecutiveHistory overview={executiveOverview} />}
                    <div className="grid min-w-0 gap-3 @min-[1000px]:grid-cols-2"><OfficeActivityFeed activity={municipal.officeActivity} /><ActivityRail /></div>
                </div>
                </div>
            </details>
            <PortalMenuOverview />
        </div>
    </AppLayout>;
}
