import { ArrowUpRight, BookOpen, Building2, FolderKanban, Map, Paperclip } from 'lucide-react';
const formatPhpCompact = (value:number)=>new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',notation:'compact',maximumFractionDigits:1}).format(value);
import type { MunicipalPlan } from '../../data/municipal/plans';
import { StatusBadge } from '../ui';

type Props = {
    plan: Omit<MunicipalPlan,'status'> & {status:string;sbResolutionNo?:string};
    selected: boolean;
    linkedPpaCount?: number;
    linkedPpaBudget?: number;
    docCount?: number;
    onSelect: () => void;
};

export default function PlanCard({
    plan,
    selected,
    linkedPpaCount,
    linkedPpaBudget,
    docCount,
    onSelect,
}: Props) {
    const identity = plan.code.replace(/\s+\d{4}.*$/, '');
    const coverage = plan.coverageStart === plan.coverageEnd ? String(plan.coverageStart) : `${plan.coverageStart}\u2013${plan.coverageEnd}`;

    return (
        <article
            className="tcds-card flex min-w-0 flex-col p-3.5 transition-colors hover:border-[var(--brand-primary)]"
            aria-label={plan.code}
        >
            <div
                aria-hidden="true"
                className="relative flex min-h-32 w-full flex-col justify-between overflow-hidden rounded-lg border border-[var(--brand-soft-border)] bg-[var(--brand-soft)] p-3.5 text-[var(--brand-ink)]"
            >
                <Map size={92} strokeWidth={1.1} className="pointer-events-none absolute -right-2 top-2 opacity-15" />
                <span className="relative flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                    <BookOpen size={15} />
                    <span>Municipality of Talibon</span>
                </span>
                <span className="relative text-2xl font-extrabold tracking-tight text-[var(--ink-primary)]">{identity}</span>
                <span className="relative truncate font-mono text-xs font-medium text-[var(--ink-secondary)]">
                    {plan.sbResolutionNo || plan.documentRef}
                </span>
            </div>

            <p className="mt-1 text-xs text-[var(--ink-secondary)]">Illustrative library cover · Not an official document</p>
            <div className="mt-3 flex flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-mono text-xs font-bold uppercase tracking-wide text-[var(--brand-ink)]">
                        {plan.code}
                    </h2>
                    <StatusBadge
                        tone={
                            plan.status === 'In force' || plan.status === 'Adopted'
                                ? 'ok'
                                : plan.status === 'For review' || plan.status === 'Updating' || plan.status === 'Due this year'
                                  ? 'warn'
                                  : 'neutral'
                        }
                    >
                        {plan.status}
                    </StatusBadge>
                </div>
                <p className="text-sm font-bold leading-snug text-[var(--ink-primary)]">{plan.title}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ink-secondary)]">
                    <span>{coverage}</span>
                    <span>·</span>
                    <span>{plan.horizon}</span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-default)] bg-[var(--surface-recessed)] px-2 py-0.5 font-medium text-[var(--ink-primary)]">
                        <FolderKanban size={11} aria-hidden="true" className="text-[var(--brand-ink)]" />
                        <span>
                            {linkedPpaCount === undefined ? 'PPA links unavailable' : `${linkedPpaCount} ${linkedPpaCount === 1 ? 'PPA' : 'PPAs'}`}
                            {linkedPpaBudget !== undefined && linkedPpaBudget > 0 ? ` · ${formatPhpCompact(linkedPpaBudget)}` : ''}
                        </span>
                    </span>
                    <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${
                            docCount !== undefined && docCount > 0
                                ? 'border-[var(--brand-soft-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]'
                                : 'border-[var(--border-default)] bg-[var(--surface-recessed)] text-[var(--ink-secondary)]'
                        }`}
                    >
                        <Paperclip size={11} aria-hidden="true" />
                        <span>
                            {docCount === undefined ? 'Document count unavailable' : `${docCount} ${docCount === 1 ? 'doc' : 'docs'}`}
                        </span>
                    </span>
                </div>

                <p className="mt-auto flex items-center gap-1.5 pt-2 text-xs text-[var(--ink-secondary)]">
                    <Building2 size={14} aria-hidden="true" className="shrink-0" />
                    <span className="truncate">{plan.leadOffice}</span>
                </p>
            </div>

            <button
                id={`plan-trigger-${plan.id}`}
                type="button"
                aria-expanded={selected}
                aria-controls={selected ? 'selected-plan-details' : undefined}
                aria-label={`${selected ? 'Hide' : 'View'} details for ${plan.code}`}
                onClick={onSelect}
                className="mt-3 flex min-h-11 w-full items-center justify-between border-t border-[var(--border-default)] pt-2 text-left text-xs font-bold text-[var(--brand-ink)] hover:underline"
            >
                <span>{selected ? 'Hide plan dossier' : 'View plan dossier'}</span>
                <ArrowUpRight size={15} aria-hidden="true" />
            </button>
        </article>
    );
}
