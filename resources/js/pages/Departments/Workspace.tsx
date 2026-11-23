import { Link } from '@inertiajs/react';
import { ArrowRight, Building2, ClipboardList } from 'lucide-react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import OfficeOverview from '../../components/dashboard/OfficeOverview';
import type { OfficeOverviewData } from '../../components/dashboard/types';
import AppLayout from '../../layouts/AppLayout';

type DepartmentWorkspaceProps = {
    department: { id: number; code: string; name: string; shortName?: string | null; branch: string; officeType: string };
    metrics: OfficeOverviewData['metrics'];
    statusOverview: OfficeOverviewData['statusOverview'];
    staffWorkload: OfficeOverviewData['staffWorkload'];
    oldestUnresolved: OfficeOverviewData['oldestUnresolved'];
    recentActivity: Array<{
        id: number;
        actionLabel: string;
        reference: string | null;
        title: string | null;
        actor: string | null;
        createdAt: string | null;
        detailUrl: string | null;
    }>;
    drilldowns: Array<{ label: string; href: string }>;
};

function dateLabel(value: string | null): string {
    if (!value) return 'Date unavailable';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? 'Date unavailable'
        : new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeZone: 'Asia/Manila' }).format(date);
}

/** The server supplies only the authenticated Head's authorized office projections. */
export default function Workspace({ department, metrics, statusOverview, staffWorkload, oldestUnresolved, recentActivity, drilldowns }: DepartmentWorkspaceProps) {
    return (
        <AppLayout title="My Department">
            <PageFrame className="civic-page aj-page-workspace" density="comfortable">
                <PageHeader
                    eyebrow="Department head workspace"
                    title="My Department"
                    description={department.name + ' · Authorized office workload and activity'}
                    icon={Building2}
                    aside={<Link href="/departments?view=directory" className="municipal-action inline-flex items-center gap-2">Departments directory <ArrowRight size={16} aria-hidden="true" /></Link>}
                />

                <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Authorized department metrics">
                    {Object.entries(metrics).map(([key, metric]) => (
                        <Link key={key} href={metric.link} className="municipal-panel block rounded-xl p-4 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
                            <span className="block text-sm font-semibold text-slate-600 dark:text-slate-300">{metric.label}</span>
                            <strong className="mt-2 block text-2xl tabular-nums text-slate-900 dark:text-white">{metric.value}</strong>
                        </Link>
                    ))}
                </section>

                <div className="mt-5">
                    <OfficeOverview overview={{ metrics, statusOverview, staffWorkload, oldestUnresolved }} />
                </div>

                <section className="municipal-panel mt-5 rounded-xl p-4 sm:p-5" aria-labelledby="department-activity-heading">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 id="department-activity-heading" className="inline-flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                            <ClipboardList size={19} aria-hidden="true" /> Recent authorized department activity
                        </h2>
                        <Link href="/transactions?view=office_queue" className="text-sm font-semibold text-blue-700 underline dark:text-blue-300">Open office work</Link>
                    </div>
                    {recentActivity.length === 0
                        ? <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">No authorized department activity to show.</p>
                        : <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-700">
                            {recentActivity.map((item) => (
                                <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900 dark:text-white">{item.actionLabel}</p>
                                        <p className="break-words text-sm text-slate-600 dark:text-slate-300">{[item.reference, item.title].filter(Boolean).join(' · ') || 'Authorized office event'}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{[item.actor, dateLabel(item.createdAt)].filter(Boolean).join(' · ')}</p>
                                    </div>
                                    {item.detailUrl && <Link href={item.detailUrl} className="text-sm font-semibold text-blue-700 underline dark:text-blue-300">View work</Link>}
                                </li>
                            ))}
                        </ul>}
                </section>

                <nav className="mt-5 flex flex-wrap gap-2" aria-label="Department related workspaces">
                    {drilldowns.map((item) => (
                        <Link key={item.href} href={item.href} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#142236] dark:text-blue-300">
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">
                    Department-specific approvals, signatures and routing changes remain unavailable until their municipal workflow rules are authorized.
                </p>
            </PageFrame>
        </AppLayout>
    );
}
