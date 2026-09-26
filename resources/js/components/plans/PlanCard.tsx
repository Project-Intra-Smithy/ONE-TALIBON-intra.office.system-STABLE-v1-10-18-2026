import { BookOpen } from 'lucide-react';
import type { MunicipalPlan } from '../../data/municipal/plans';

export default function PlanCard({ plan }: { plan: MunicipalPlan }) {
    return <article className="municipal-panel min-w-0 overflow-hidden" aria-label={plan.code}>
        <div className="flex min-h-28 items-center justify-between gap-3 border-b border-slate-200 bg-[var(--municipal-brand-soft)] p-4 dark:border-slate-700">
            <div><div className="text-xs font-semibold tracking-wide text-[var(--municipal-brand)]">ONE TALIBON · LGU PLAN</div><h3 className="mt-2 text-xl font-bold text-[var(--municipal-brand)]">{plan.code}</h3></div>
            <BookOpen size={28} className="shrink-0 text-[var(--municipal-brand)]" aria-hidden="true" />
        </div>
        <div className="space-y-3 p-4">
            <h4 className="text-base font-semibold leading-6">{plan.title}</h4>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm"><span>{plan.coverageStart}–{plan.coverageEnd}</span><span className="font-semibold text-[var(--municipal-brand)]">{plan.status}</span></div>
            <p className="text-sm text-slate-600 dark:text-slate-300">{plan.leadOffice}</p>
            <details className="border-t border-slate-200 dark:border-slate-700">
                <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-[var(--municipal-brand)]">View plan details</summary>
                <dl className="space-y-3 pb-2 text-sm">
                    {[
                        ['Document reference', plan.documentRef],
                        ['Authority / adoption', plan.authority],
                        ['Next milestone', `${plan.nextMilestone} · ${plan.nextMilestoneDate}`],
                        ['Required action', plan.requiredAction],
                        ['Coordinating offices', plan.coordinatingOffices.join('; ')],
                        ['Last action', `${plan.lastAction} · ${plan.lastActionDate}`],
                        ['Record completion', `${plan.sectionsComplete} of ${plan.sectionsTotal} sections`],
                    ].map(([label, value]) => <div key={label}><dt className="font-semibold">{label}</dt><dd className="mt-1 break-words text-slate-600 dark:text-slate-300">{value}</dd></div>)}
                </dl>
            </details>
        </div>
    </article>;
}
