type Props = {
    sessions: number;
    routedWork: number;
    overdue: number;
};

export default function LegislativeWorkspaceMetrics({ sessions, routedWork, overdue }: Props) {
    return (
        <section className="grid overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-[var(--border-control)] dark:bg-[var(--surface-card)] @min-[520px]:grid-cols-3" aria-label="Legislative workspace summary">
            <div className="px-3 py-2.5 @min-[520px]:border-r @min-[520px]:border-slate-100 dark:@min-[520px]:border-slate-700">
                <div className="text-lg font-bold text-[var(--status-info-fg)]">{sessions}</div>
                <div className="mt-0.5 text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Sessions loaded</div>
            </div>
            <div className="border-t border-slate-100 px-3 py-2.5 dark:border-[var(--border-control)] @min-[520px]:border-r @min-[520px]:border-t-0">
                <div className="text-lg font-bold text-[var(--brand-primary)] dark:text-[var(--status-info-fg)]">{routedWork}</div>
                <div className="mt-0.5 text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Routed work</div>
            </div>
            <div className={`border-t border-slate-100 px-3 py-2.5 dark:border-[var(--border-control)] @min-[520px]:border-t-0 ${overdue > 0 ? 'bg-rose-50/60 dark:bg-rose-950/15' : ''}`}>
                <div className={`text-lg font-bold ${overdue > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-[var(--ink-secondary)]'}`}>{overdue}</div>
                <div className="mt-0.5 text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Overdue</div>
            </div>
        </section>
    );
}
