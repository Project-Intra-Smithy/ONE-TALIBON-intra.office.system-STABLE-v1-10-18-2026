import { Link } from '@inertiajs/react';
import CorrespondenceOverview from '../components/dashboard/CorrespondenceOverview';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import ExecutiveOverview from '../components/dashboard/ExecutiveOverview';
import MetricGroup from '../components/dashboard/MetricGroup';
import R7UpperRegion from '../components/dashboard/r7/R7UpperRegion';
import R7LowerRegion from '../components/dashboard/r7/R7LowerRegion';
import MunicipalContext from '../components/dashboard/MunicipalContext';
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
import '../../css/aj-dashboard-workspace.css';

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
        <div className="aj-dashboard ot-reference-dashboard r7-dashboard mx-auto max-w-[1480px]">
            <DashboardHeader experience={experience} />
            <div className="ot-dashboard-toolbar">
                <nav className="ot-dashboard-jumps workspace-shortcuts" aria-label="Jump to work section">
                    <a href="#work-overview">Work overview</a>
                    {(isEmployee || isHead) && correspondenceOverview && <a href="#dashboard-correspondence">Correspondence</a>}
                    <Link href="/my-tasks">My Tasks</Link>
                    {isHead && <Link href="/my-department">My Department</Link>}
                </nav>
                <div className="ot-dashboard-municipal-context"><MunicipalContext /></div>
            </div>
            <R7UpperRegion recentWork={recentWork} groups={primaryGroups} system={isAdmin ? systemOverview : undefined} head={isHead} />
            <R7LowerRegion actions={experience.quickActions} />
            {(isEmployee || isHead) && correspondenceOverview && <div className="ot-dashboard-section">
                <CorrespondenceOverview overview={correspondenceOverview} />
            </div>}
            {isHead && <section className="ot-dashboard-section municipal-panel rounded-xl p-4 sm:p-5" aria-labelledby="department-preview-heading">
                <h2 id="department-preview-heading" className="text-lg font-bold text-slate-900 dark:text-white">My Department</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {officeOverview
                        ? 'Review your authorized office workload, unresolved items and staff accountability in the dedicated department workspace.'
                        : 'Your department overview is temporarily unavailable.'}
                </p>
                <Link href="/my-department" className="mt-3 inline-block text-sm font-semibold text-blue-700 underline dark:text-blue-300">
                    Open My Department
                </Link>
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
