import { AlertTriangle, Building2 } from 'lucide-react';
import RecentWorkList from './RecentWorkList';
import type { ExecutiveOverviewData } from './types';

export default function ExecutiveOverview({ overview }: { overview: ExecutiveOverviewData }) {
    return (
        <section className="space-y-3.5" aria-labelledby="dashboard-executive-overview">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 id="dashboard-executive-overview" className="mt-1 text-base font-bold text-[var(--ink-primary)] sm:text-lg">Municipal attention</h2>
                    <p className="mt-1 text-sm text-[var(--ink-secondary)] sm:text-sm">Office workload and unresolved transactions for municipal follow-up.</p>
                </div>
                <span className="text-sm text-slate-500">Detailed decision workspace is not staged</span>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-[var(--border-control)] dark:bg-[var(--surface-card)]">
                <div className="flex flex-col gap-1 border-b border-slate-100 px-4 py-3 dark:border-[var(--border-control)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="flex items-center gap-2"><Building2 size={16} className="text-[var(--status-info-fg)]" aria-hidden="true" /><h3 className="text-base font-bold text-[var(--ink-primary)]">Office workload</h3></div>
                    <span className="text-sm text-[var(--ink-secondary)] sm:text-sm">Overdue and unassigned work first</span>
                </div>
                <div className="hidden grid-cols-[minmax(0,1.5fr)_repeat(4,82px)] gap-3 border-b border-slate-100 bg-slate-50 px-5 py-2 text-sm font-bold uppercase tracking-wide text-[var(--ink-secondary)] dark:border-[var(--border-control)] dark:bg-[var(--surface-card)] @min-[700px]:grid">
                    <div>Office</div><div>Active</div><div>Unassigned</div><div>Due soon</div><div>Overdue</div>
                </div>
                <div className="divide-y divide-[var(--border-default)]">
                    {overview.departmentWorkload.map((office) => (
                        <article key={office.id} className="grid gap-2 px-4 py-3 sm:px-5 @min-[700px]:grid-cols-[minmax(0,1.5fr)_repeat(4,82px)] md:items-center">
                            <div className="min-w-0"><div className="break-words text-base font-semibold text-[var(--ink-primary)]">{office.shortName || office.name}</div><div className="mt-0.5 text-sm text-[var(--ink-secondary)]">{office.code}</div></div>
                            <div className="text-sm text-[var(--ink-secondary)] sm:text-sm"><span className="font-bold text-[var(--ink-primary)]">{office.active}</span> <span className="@min-[700px]:hidden">active</span></div>
                            <div className={`text-sm sm:text-sm ${office.unassigned > 0 ? 'font-semibold text-amber-700 dark:text-amber-300' : 'text-[var(--ink-secondary)]'}`}>{office.unassigned} <span className="@min-[700px]:hidden">unassigned</span></div>
                            <div className="text-sm text-amber-700 dark:text-amber-300 sm:text-sm">{office.dueSoon} <span className="@min-[700px]:hidden">due soon</span></div>
                            <div className={`inline-flex items-center gap-1 text-sm sm:text-sm ${office.overdue > 0 ? 'font-semibold text-rose-700 dark:text-rose-300' : 'text-[var(--ink-secondary)]'}`}><AlertTriangle size={11} aria-hidden="true" /> {office.overdue} overdue</div>
                        </article>
                    ))}
                    {overview.departmentWorkload.length === 0 ? <div className="px-5 py-7 text-center text-base text-[var(--ink-secondary)]">No active municipal workload.</div> : null}
                </div>
            </div>

            <RecentWorkList title="Oldest unresolved work" description="Municipal work awaiting completion." items={overview.oldestUnresolved} />

            <div className="space-y-4">
                <RecentWorkList title="Recently completed" description="Latest completed municipal work." items={overview.recentlyCompleted} emptyMessage="No recently completed work in this view." />
            </div>
        </section>
    );
}
