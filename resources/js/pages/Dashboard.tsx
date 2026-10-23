import ActivityRail from '../components/dashboard/ActivityRail';
import CorrespondenceOverview from '../components/dashboard/CorrespondenceOverview';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import ExecutiveOverview from '../components/dashboard/ExecutiveOverview';
import MetricGroup from '../components/dashboard/MetricGroup';
import MunicipalContext from '../components/dashboard/MunicipalContext';
import OfficeOverview from '../components/dashboard/OfficeOverview';
import QuickActions from '../components/dashboard/QuickActions';
import RecentWorkList from '../components/dashboard/RecentWorkList';
import SystemOverview from '../components/dashboard/SystemOverview';
import type { DashboardProps } from '../components/dashboard/types';
import PersonalTaskMutationPanel from '../components/tasks/PersonalTaskMutationPanel';
import PersonalTaskWorkspace from '../components/tasks/PersonalTaskWorkspace';
import AppLayout from '../layouts/AppLayout';
import WorkspaceUnavailable from '../components/WorkspaceUnavailable';
import '../../css/ot-reference-dashboard.css';

export default function Dashboard({ experience, metricGroups, correspondenceOverview, recentWork, officeOverview, executiveOverview, systemOverview }: DashboardProps) {
    if (!experience?.department || !Array.isArray(experience.quickActions)
        || !Array.isArray(metricGroups) || !Array.isArray(recentWork)) {
        return <WorkspaceUnavailable title="Dashboard" />;
    }
    const primaryKey = { employee: 'personal', department_head: 'office', executive_oversight: 'executive', system_administration: 'system' }[experience.key];
    const primaryGroups = metricGroups.filter((group) => group.key === primaryKey);
    const secondaryGroups = metricGroups.filter((group) => group.key !== primaryKey);
    const isEmployee = experience.key === 'employee';
    const isHead = experience.key === 'department_head';
    const isExecutive = experience.key === 'executive_oversight';
    const isAdmin = experience.key === 'system_administration';

    return <AppLayout workspaceRefinement title="Dashboard">
        <div className="ot-reference-dashboard mx-auto max-w-[1480px]">
            <DashboardHeader experience={experience} />
            <QuickActions actions={experience.quickActions} />
            <div className="ot-dashboard-toolbar">
                <nav className="ot-dashboard-jumps workspace-shortcuts" aria-label="Jump to work section">
                    <a href="#work-overview">Work overview</a>
                    {(isEmployee || isHead) && correspondenceOverview && <a href="#dashboard-correspondence">Correspondence</a>}
                    <a href="#personal-tasks">Personal tasks</a>
                </nav>
                <div className="ot-dashboard-municipal-context"><MunicipalContext /></div>
            </div>
            <div id="work-overview" tabIndex={-1} className="ot-dashboard-work workspace-section-target">
                <section aria-label="Recent operational work" className="ot-dashboard-lead">
                    <RecentWorkList compact title={isHead ? 'My recent work' : 'Recent work'} description="Recently updated authorized work." items={recentWork} emptyMessage="No recent work to show." />
                </section>
                <section aria-label="Activity and notifications" className="ot-dashboard-activity">
                    <ActivityRail system={isAdmin ? systemOverview : undefined} />
                </section>
                <div className="ot-dashboard-metrics">
                    {primaryGroups.map((group) => <MetricGroup key={group.key} group={group} />)}
                </div>
            </div>
            {(isEmployee || isHead) && correspondenceOverview && <div className="ot-dashboard-section">
                <CorrespondenceOverview overview={correspondenceOverview} />
            </div>}
            {isHead && <section id="department-overview" tabIndex={-1} className="ot-dashboard-section workspace-section-target" aria-label="My Department">
                {officeOverview ? <OfficeOverview overview={officeOverview} /> : <p className="municipal-panel p-5">Department overview is unavailable. Refresh the page to try again.</p>}
            </section>}
            {isExecutive && executiveOverview && <section className="ot-dashboard-section" aria-label="Executive oversight">
                <ExecutiveOverview overview={executiveOverview} />
            </section>}
            {isAdmin && systemOverview && <section className="ot-dashboard-section" aria-label="Administration overview">
                <SystemOverview overview={systemOverview} />
            </section>}
            {secondaryGroups.length > 0 && <div className="ot-dashboard-section ot-dashboard-secondary-metrics">
                {secondaryGroups.map((group) => <MetricGroup key={group.key} group={group} />)}
            </div>}
            <div id="personal-tasks" tabIndex={-1} className="ot-dashboard-section workspace-section-target space-y-4">
                <PersonalTaskWorkspace />
                <PersonalTaskMutationPanel />
            </div>
        </div>
    </AppLayout>;
}
