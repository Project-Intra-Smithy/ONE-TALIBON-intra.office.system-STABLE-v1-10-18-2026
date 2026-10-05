import { usePage } from '@inertiajs/react';
import type { SharedProps } from '../types';
import { buildPortalNavigation } from '../navigation/portalNavigation';
import DashboardPortalHero from '../components/dashboard/DashboardPortalHero';
import { ActionDocumentsCard } from '../components/dashboard/DashboardPortalCards';
import ActivityRail from '../components/dashboard/ActivityRail';
import AttentionSummary from '../components/dashboard/AttentionSummary';
import { dashboardAttentionWork } from '../components/dashboard/dashboardSelectors';
import ExecutiveHistory from '../components/dashboard/ExecutiveHistory';
import ExecutiveOverview from '../components/dashboard/ExecutiveOverview';
import MetricGroup from '../components/dashboard/MetricGroup';
import OfficeOverview from '../components/dashboard/OfficeOverview';
import PortalQuickAccess from '../components/dashboard/PortalQuickAccess';
import QuickActions from '../components/dashboard/QuickActions';
import RecentCorrespondence from '../components/dashboard/RecentCorrespondence';
import SystemOverview from '../components/dashboard/SystemOverview';
import type { DashboardProps } from '../components/dashboard/types';
import AppLayout from '../layouts/AppLayout';

export default function Dashboard({ experience, metricGroups, correspondenceOverview, recentWork, officeOverview, executiveOverview, systemOverview }: DashboardProps) {
    const { workspaceExperience, permissions } = usePage<SharedProps>().props;
    const destinations = buildPortalNavigation(workspaceExperience, permissions.navigation).flatMap((group) => group.items);
    const destination = (key: string) => destinations.find((item) => item.key === key)?.href;
    const attentionWork = dashboardAttentionWork(experience, recentWork, officeOverview, executiveOverview);
    const isAdministrator = experience.key === 'system_administration';
    const administrativeFollowUp = systemOverview?.operations.departmentWorkload.filter((office) => office.overdue > 0 || office.unassigned > 0).length ?? 0;
    const administrativeOverdue = systemOverview?.operations.departmentWorkload.filter((office) => office.overdue > 0).length ?? 0;
    const correspondenceAttentionCount = correspondenceOverview?.attention.value ?? 0;
    const attentionQueueHref = experience.key === 'executive_oversight' ? '/mayor-office' : experience.key === 'department_head' ? '/transactions?view=office_queue' : '/transactions?view=needs_my_action';

    return <AppLayout title="Dashboard" presentation="portal-dashboard">
        <div className="dashboard-portal">
            <DashboardPortalHero experience={experience} />
            <PortalQuickAccess />
            <div className="dashboard-primary-grid">
                <ActionDocumentsCard
                    experience={experience}
                    items={attentionWork}
                    workload={systemOverview?.operations.departmentWorkload}
                    href={attentionQueueHref}
                    correspondenceCount={correspondenceAttentionCount}
                    correspondenceHref={correspondenceOverview?.attention.link || destination('correspondence')}
                />
            </div>
            <details className="municipal-panel dashboard-operational-context">
                <summary>Operational Context <span>Show details</span></summary>
                <div className="dashboard-operational-body">
                    <AttentionSummary
                        workCount={isAdministrator ? administrativeFollowUp : attentionWork.length}
                        overdueWorkCount={isAdministrator ? administrativeOverdue : attentionWork.filter((item) => item.dueState === 'overdue').length}
                        correspondenceAttentionCount={correspondenceAttentionCount}
                        workLabel={isAdministrator ? 'Offices requiring follow-up' : undefined}
                        overdueLabel={isAdministrator ? 'Offices with overdue work' : undefined}
                    />
                    <section aria-label="Office and role context" className="grid min-w-0 gap-3 @min-[1000px]:grid-cols-2">
                        {metricGroups.filter((group) => group.key !== 'system').map((group) => <MetricGroup key={group.key} group={group} />)}
                        {experience.key === 'department_head' && officeOverview && <OfficeOverview overview={officeOverview} />}
                        {experience.key === 'executive_oversight' && executiveOverview && <ExecutiveOverview overview={executiveOverview} />}
                        {isAdministrator && systemOverview && <SystemOverview overview={systemOverview} />}
                    </section>
                    <div className="space-y-3">
                        <QuickActions actions={experience.quickActions} />
                        <div className="grid min-w-0 gap-3 @min-[1000px]:grid-cols-2">
                            <RecentCorrespondence overview={correspondenceOverview} />
                            <ActivityRail />
                        </div>
                        {experience.key === 'executive_oversight' && executiveOverview && <ExecutiveHistory overview={executiveOverview} />}
                    </div>
                </div>
            </details>
        </div>
    </AppLayout>;
}
