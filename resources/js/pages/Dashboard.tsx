import CorrespondenceOverview from '../components/dashboard/CorrespondenceOverview';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import ExecutiveOverview from '../components/dashboard/ExecutiveOverview';
import MetricGroup from '../components/dashboard/MetricGroup';
import ActivityRail from '../components/dashboard/ActivityRail';
import RecentWorkList from '../components/dashboard/RecentWorkList';
import R7QuickLinksPanel from '../components/dashboard/r7/lower/R7QuickLinksPanel';
import R7TaskPanel from '../components/dashboard/r7/lower/R7TaskPanel';
import R7EventsPanel from '../components/dashboard/r7/lower/R7EventsPanel';
import R7DocumentsPanel from '../components/dashboard/r7/lower/R7DocumentsPanel';
import { Link, usePage } from '@inertiajs/react';
import { buildPortalNavigation } from '../navigation/portalNavigation';
import type { SharedProps } from '../types';
import OfficeOverview from '../components/dashboard/OfficeOverview';
import SystemOverview from '../components/dashboard/SystemOverview';
import type { DashboardProps } from '../components/dashboard/types';
import AppLayout from '../layouts/AppLayout';
import WorkspaceUnavailable from '../components/WorkspaceUnavailable';
import '../../css/ot-reference-dashboard.css';
import '../../css/r7-dashboard-upper.css';
import '../../css/r7-dashboard-lower.css';
import '../../css/r7-hero-fidelity.css';
import '../../css/r7-lower-evidence.css';
import '../../css/r7-task-panel.css';
import '../../css/r7-shortcuts-responsive.css';
import '../../css/dashboard-refinement.css';

export default function Dashboard({ experience, metricGroups, correspondenceOverview, recentWork, officeOverview, executiveOverview, systemOverview }: DashboardProps) {
    const shared = usePage<SharedProps>().props;
    const destinations = buildPortalNavigation(shared.workspaceExperience,
        shared.permissions?.navigation ?? {} as SharedProps['permissions']['navigation'])
        .flatMap((group) => group.items);
    const recordsDestination = destinations.find((item) => item.key === 'records');
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
        <div className="dashboard-refinement ot-reference-dashboard r7-dashboard mx-auto max-w-[1480px]">
            <DashboardHeader experience={experience} />
            {recordsDestination && <section className="dashboard-records-access" aria-labelledby="dashboard-records-title">
                <div>
                    <p className="dashboard-eyebrow">Office records &amp; archives</p>
                    <h2 id="dashboard-records-title">Find the record. Follow the action.</h2>
                    <p>Search the municipal records available to your account.</p>
                </div>
                <Link href={recordsDestination.href} className="dashboard-records-button">Open records</Link>
            </section>}
            <div className="dashboard-shortcut-row">
                <R7QuickLinksPanel actions={experience.quickActions} />
            </div>
            <section className="dashboard-summary-band" aria-label="Work summary">
                {primaryGroups.map((group) => <MetricGroup key={group.key} group={group} />)}
            </section>
            <div className="ot-dashboard-toolbar dashboard-section-navigation">
                <nav className="ot-dashboard-jumps workspace-shortcuts" aria-label="Jump to work section">
                    <a href="#work-overview">Work overview</a>
                    {(isEmployee || isHead) && correspondenceOverview && <a href="#dashboard-correspondence">Correspondence</a>}
                    <a href="#personal-tasks">Personal tasks</a>
                </nav>
            </div>
            <div className="dashboard-body-columns">
                <div className="dashboard-primary-column">
                    <section id="work-overview" tabIndex={-1} className="dashboard-work-table workspace-section-target" aria-label="Work overview">
                        <RecentWorkList compact title={isHead ? 'My recent work' : 'Recent work'}
                            description="Recently updated authorized work." items={recentWork}
                            emptyMessage="No recent work to show." />
                    </section>
                    {(isEmployee || isHead) && correspondenceOverview && <div className="ot-dashboard-section">
                        <CorrespondenceOverview overview={correspondenceOverview} />
                    </div>}
                    <R7TaskPanel />
                </div>
                <div className="dashboard-supporting-column">
                    <ActivityRail system={isAdmin ? systemOverview : undefined} />
                    <R7EventsPanel />
                    <R7DocumentsPanel />
                </div>
            </div>
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
        </div>
    </AppLayout>;
}
