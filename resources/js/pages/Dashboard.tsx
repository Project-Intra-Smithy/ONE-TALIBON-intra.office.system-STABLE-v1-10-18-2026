import { jumpToSection } from '../components/dashboard/DashboardSection';
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
import PersonalTaskWorkspace from '../components/tasks/PersonalTaskWorkspace';
import PersonalTaskMutationPanel from '../components/tasks/PersonalTaskMutationPanel';
import AppLayout from '../layouts/AppLayout';
import WorkspaceUnavailable from '../components/WorkspaceUnavailable';
import '../components/dashboard/dashboard.css';

export default function Dashboard({ experience, metricGroups, correspondenceOverview, recentWork, officeOverview, executiveOverview, systemOverview }: DashboardProps) {
    if (!experience?.department || !Array.isArray(experience.quickActions) || !Array.isArray(metricGroups) || !Array.isArray(recentWork)) {
        return <WorkspaceUnavailable title="Dashboard" />;
    }
    const primaryKey = { employee: 'personal', department_head: 'office', executive_oversight: 'executive', system_administration: 'system' }[experience.key];
    const primaryGroups = metricGroups.filter((group) => group.key === primaryKey);
    const secondaryGroups = metricGroups.filter((group) => group.key !== primaryKey);

    const sections = [
        ...(correspondenceOverview && ['employee', 'department_head'].includes(experience.key) ? ['Correspondence workspace'] : []),
        ...(experience.key === 'employee' ? ['Recent work'] : []),
        ...(experience.key === 'department_head' ? ['My recent work', ...(officeOverview ? ['Staff workload', 'Active status mix'] : [])] : []),
        ...(experience.key === 'executive_oversight' && executiveOverview ? ['Office workload', 'Oldest unresolved work', 'Recently completed'] : []),
        ...(experience.key === 'system_administration' && systemOverview ? ['Office identities', 'Security activity'] : []),
    ];
    return <AppLayout title="Dashboard" presentation="portal-dashboard">
        <div className="dashboard">
            <DashboardHeader experience={experience} />
            <div className="dashboard-content">
                {primaryGroups.map((group) => <MetricGroup key={group.key} group={group} />)}
                <nav className="dashboard-jumps" aria-label="Dashboard sections">
                    {sections.map(title => <button type="button" key={title} onClick={() => jumpToSection(title)}>{title}</button>)}
                    <button type="button" onClick={() => { const target = document.getElementById('dashboard-personal-tasks'); target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: 'start' }); }}>Personal Tasks</button>
                </nav>
                <QuickActions actions={experience.quickActions} />

                {experience.key === 'employee' && <>
                    {correspondenceOverview && <CorrespondenceOverview overview={correspondenceOverview} />}
                    <RecentWorkList title="Recent work" description="Latest updates to your assigned and initiated work." items={recentWork} emptyMessage="No recent work to show." />
                    <ActivityRail />
                </>}

                {experience.key === 'department_head' && <>
                    {correspondenceOverview && <CorrespondenceOverview overview={correspondenceOverview} />}
                    {secondaryGroups.map((group) => <MetricGroup key={group.key} group={group} />)}
                    <RecentWorkList title="My recent work" description="Latest updates to your personally assigned and initiated work." items={recentWork} emptyMessage="No recent personal work to show." />
                    <ActivityRail />
                    {officeOverview && <OfficeOverview overview={officeOverview} />}
                </>}

                {experience.key === 'executive_oversight' && <>
                    {secondaryGroups.map((group) => <MetricGroup key={group.key} group={group} />)}
                    {recentWork.length > 0 && <RecentWorkList title="My recent work" description="Latest updates to your personally assigned and initiated work." items={recentWork} />}
                    <ActivityRail />
                    {executiveOverview && <ExecutiveOverview overview={executiveOverview} />}
                </>}

                {experience.key === 'system_administration' && <>
                    {systemOverview && <SystemOverview overview={systemOverview} />}
                    {systemOverview && <ActivityRail system={systemOverview} />}
                </>}

                <div id="dashboard-personal-tasks" tabIndex={-1}><PersonalTaskWorkspace /><PersonalTaskMutationPanel /></div>
            </div>
        </div>
    </AppLayout>;
}
