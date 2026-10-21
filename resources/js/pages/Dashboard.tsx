import ActivityRail from '../components/dashboard/ActivityRail';
import CorrespondenceOverview from '../components/dashboard/CorrespondenceOverview';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import ExecutiveOverview from '../components/dashboard/ExecutiveOverview';
import MetricGroup from '../components/dashboard/MetricGroup';
import OfficeOverview from '../components/dashboard/OfficeOverview';
import QuickActions from '../components/dashboard/QuickActions';
import RecentWorkList from '../components/dashboard/RecentWorkList';
import SystemOverview from '../components/dashboard/SystemOverview';
import type { DashboardProps } from '../components/dashboard/types';
import PersonalTaskMutationPanel from '../components/tasks/PersonalTaskMutationPanel';
import PersonalTaskWorkspace from '../components/tasks/PersonalTaskWorkspace';
import AppLayout from '../layouts/AppLayout';
import WorkspaceUnavailable from '../components/WorkspaceUnavailable';

export default function Dashboard({ experience, metricGroups, correspondenceOverview, recentWork, officeOverview, executiveOverview, systemOverview }: DashboardProps) {
    if (!experience?.department || !Array.isArray(experience.quickActions)
        || !Array.isArray(metricGroups) || !Array.isArray(recentWork)) {
        return <WorkspaceUnavailable title="Dashboard" />;
    }
    const primaryKey = { employee: 'personal', department_head: 'office', executive_oversight: 'executive', system_administration: 'system' }[experience.key];
    const primaryGroups = metricGroups.filter((group) => group.key === primaryKey);
    const secondaryGroups = metricGroups.filter((group) => group.key !== primaryKey);

    return <AppLayout workspaceRefinement title="Dashboard">
        <div className="mx-auto max-w-[1480px] space-y-5">
            <div className="workspace-dashboard-intro">
                <DashboardHeader experience={experience} />
                <QuickActions actions={experience.quickActions} />
            </div>
            <nav className="workspace-shortcuts" aria-label="Jump to work section">
                <a href="#work-overview" onClick={() => document.getElementById('work-overview')?.focus()}>Work overview</a>
                {correspondenceOverview && (experience.key === 'employee' || experience.key === 'department_head') && <a href="#dashboard-correspondence" onClick={() => document.getElementById('dashboard-correspondence')?.focus()}>Correspondence</a>}
                <a href="#personal-tasks" onClick={() => document.getElementById('personal-tasks')?.focus()}>Personal tasks</a>
            </nav>
            <div id="work-overview" tabIndex={-1} className="@container min-w-0 space-y-5 workspace-section-target">
                {primaryGroups.map((group) => <MetricGroup key={group.key} group={group} />)}

                {experience.key === 'employee' && <div className="workspace-dashboard-columns">
                    <RecentWorkList title="Recent work" description="Latest updates to your assigned and initiated work." items={recentWork} emptyMessage="No recent work to show." />
                    <div className="space-y-5">
                        {correspondenceOverview && <CorrespondenceOverview overview={correspondenceOverview} />}
                        <ActivityRail />
                    </div>
                </div>}

                {experience.key === 'department_head' && <>
                    {officeOverview && <OfficeOverview overview={officeOverview} />}
                    {correspondenceOverview && <CorrespondenceOverview overview={correspondenceOverview} />}
                    {secondaryGroups.map((group) => <MetricGroup key={group.key} group={group} />)}
                    <RecentWorkList title="My recent work" description="Latest updates to your personally assigned and initiated work." items={recentWork} emptyMessage="No recent personal work to show." />
                    <ActivityRail />
                </>}

                {experience.key === 'executive_oversight' && <>
                    {executiveOverview && <ExecutiveOverview overview={executiveOverview} />}
                    {secondaryGroups.map((group) => <MetricGroup key={group.key} group={group} />)}
                    {recentWork.length > 0 && <RecentWorkList title="My recent work" description="Latest updates to your personally assigned and initiated work." items={recentWork} />}
                    <ActivityRail />
                </>}

                {experience.key === 'system_administration' && <>
                    {systemOverview && <SystemOverview overview={systemOverview} />}
                    {systemOverview && <ActivityRail system={systemOverview} />}
                </>}

                <div id="personal-tasks" tabIndex={-1} className="workspace-section-target space-y-5">
                    <PersonalTaskWorkspace />
                    <PersonalTaskMutationPanel />
                </div>
            </div>
        </div>
    </AppLayout>;
}
