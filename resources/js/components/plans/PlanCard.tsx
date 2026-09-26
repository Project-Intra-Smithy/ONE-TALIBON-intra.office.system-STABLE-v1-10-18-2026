import { BookOpen, Map } from 'lucide-react';
import type { MunicipalPlan } from '../../data/municipal/plans';

type Props = {
    plan: MunicipalPlan;
    selected: boolean;
    onSelect: () => void;
};

export default function PlanCard({ plan, selected, onSelect }: Props) {
    const identity = plan.code.replace(/\s+\d{4}.*$/, '');
    const coverage = plan.coverageStart === plan.coverageEnd ? String(plan.coverageStart) : `${plan.coverageStart}\u2013${plan.coverageEnd}`;

    return (
        <article className="municipal-panel flex min-w-0 flex-col rounded-lg p-3" aria-label={plan.code}>
            <div aria-hidden="true" className="relative flex min-h-28 w-full flex-col justify-between overflow-hidden rounded border border-[var(--municipal-border)] bg-[var(--municipal-brand-soft)] p-3 text-[var(--municipal-brand)]">
                <Map size={100} strokeWidth={1} className="pointer-events-none absolute -right-2 top-2 opacity-15" />
                <span className="relative flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide"><BookOpen size={16} /> Municipality of Talibon</span>
                <span className="relative break-words text-2xl font-bold leading-7">{identity}</span>
                <span className="relative text-[10px]">Library graphic / Plan reference</span>
            </div>
            <div className="mt-2 flex flex-1 flex-col gap-1">
                <h2 className="break-words text-sm font-bold text-[var(--municipal-text)]">{identity}</h2>
                <p className="break-words text-[13px] font-medium leading-5 text-[var(--municipal-text)]">{plan.title}</p>
                <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-[var(--municipal-muted)]"><span>{coverage}</span><span>{plan.status}</span></div>
                <p className="break-words text-[11px] leading-4 text-[var(--municipal-muted)]">{plan.leadOffice}</p>
            </div>
            <button
                id={`plan-trigger-${plan.id}`}
                type="button"
                aria-expanded={selected}
                aria-controls={selected ? 'selected-plan-details' : undefined}
                aria-label={`${selected ? 'Hide' : 'View'} details for ${plan.code}`}
                onClick={onSelect}
                className="mt-2 flex min-h-11 w-full items-center border-t border-[var(--municipal-border)] text-left text-xs font-semibold text-[var(--municipal-brand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
                {selected ? 'Hide plan details' : 'View plan details'}
            </button>
        </article>
    );
}
