import { CalendarDays } from 'lucide-react';
import type { MunicipalPlan } from '../../data/municipal/plans';

const dateLabel = (value: string) => new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' }).format(new Date(`${value}T00:00:00`));

export default function PlanMilestoneQueue({ plans }: { plans: MunicipalPlan[] }) {
    const recorded = [...plans]
        .sort((a, b) => a.nextMilestoneDate.localeCompare(b.nextMilestoneDate))
        .slice(0, 6);

    return (
        <section className="min-w-0 border-t border-[var(--municipal-border)]" aria-labelledby="planning-milestones-title">
            <div className="flex items-center gap-2 border-b border-slate-200 py-3 dark:border-slate-700">
                <CalendarDays size={16} className="text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
                <div>
                    <h2 id="planning-milestones-title" className="text-sm font-bold text-slate-900 dark:text-slate-100">Recorded planning milestones</h2>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Next recorded action dates across the municipal plan register.</p>
                </div>
            </div>
            <div className="grid gap-x-3 sm:grid-cols-2">
                {recorded.length === 0 && <p className="py-3 text-xs text-[var(--municipal-muted)]">No recorded milestones match the current filters.</p>}
                {recorded.map((plan) => (
                    <article key={plan.id} className="grid grid-cols-[62px_minmax(0,1fr)] gap-2 border-t border-[var(--municipal-border)] py-3">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-center dark:border-slate-700 dark:bg-slate-900/40">
                            <div className="text-xs font-bold text-[var(--municipal-brand)] dark:text-slate-100">{dateLabel(plan.nextMilestoneDate)}</div>
                            <div className="mt-0.5 text-xs text-slate-400">{plan.nextMilestoneDate.slice(0, 4)}</div>
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{plan.code}</div>
                            <div className="mt-0.5 text-xs font-semibold leading-5 text-slate-800 dark:text-slate-200">{plan.nextMilestone}</div>
                            <div className="mt-1 text-xs leading-4 text-slate-500 dark:text-slate-400">{plan.requiredAction}</div>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
