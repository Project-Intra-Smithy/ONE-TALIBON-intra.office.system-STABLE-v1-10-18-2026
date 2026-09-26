import { BookOpen } from 'lucide-react';
import type { MunicipalPlan } from '../../data/municipal/plans';

export default function PlanCard({ plan }: { plan: MunicipalPlan }) {
    const identity = plan.code.replace(/\s+\d{4}.*$/, '');
    const coverage = plan.coverageStart === plan.coverageEnd ? String(plan.coverageStart) : `${plan.coverageStart}–${plan.coverageEnd}`;

    return <article className="min-w-0 border-b border-[var(--municipal-border)] pb-2" aria-label={plan.code}>
        <div aria-hidden="true" className="flex h-24 w-24 flex-col justify-between overflow-hidden rounded border border-[var(--municipal-border)] border-l-4 border-l-[var(--municipal-brand)] bg-[var(--municipal-brand-soft)] p-2 text-[var(--municipal-brand)]">
            <BookOpen size={18} />
            <span className="break-words text-sm font-bold leading-4">{identity}</span>
            <span className="text-[10px] leading-3">Plan reference</span>
        </div>
        <div className="mt-2 space-y-1.5">
            <h2 className="break-words text-sm font-bold text-[var(--municipal-text)]">{identity}</h2>
            <p className="break-words text-[13px] font-medium leading-5 text-[var(--municipal-text)]">{plan.title}</p>
            <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-[var(--municipal-muted)]"><span>{coverage}</span><span>{plan.status}</span></div>
            <p className="break-words text-[11px] leading-4 text-[var(--municipal-muted)]">{plan.leadOffice}</p>
            <details className="border-t border-[var(--municipal-border)]">
                <summary className="min-h-11 cursor-pointer py-2 text-xs font-semibold text-[var(--municipal-brand)]">View plan details</summary>
                <dl className="space-y-3 pb-2 text-sm">
                    {[
                        ['Document reference', plan.documentRef],
                        ['Authority / adoption', plan.authority],
                        ['Next milestone', `${plan.nextMilestone}  /  ${plan.nextMilestoneDate}`],
                        ['Required action', plan.requiredAction],
                        ['Coordinating offices', plan.coordinatingOffices.join('; ')],
                        ['Last action', `${plan.lastAction}  /  ${plan.lastActionDate}`],
                        ['Record completion', `${plan.sectionsComplete} of ${plan.sectionsTotal} sections`],
                    ].map(([label, value]) => <div key={label}><dt className="font-semibold">{label}</dt><dd className="mt-1 break-words text-[var(--municipal-muted)]">{value}</dd></div>)}
                </dl>
            </details>
        </div>
    </article>;
}
