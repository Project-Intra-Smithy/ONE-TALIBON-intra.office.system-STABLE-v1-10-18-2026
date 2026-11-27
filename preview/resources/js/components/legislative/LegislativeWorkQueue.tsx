import { formatDateTimePH } from '../../lib/format';
import type { LegislativeWork } from './types';
const pretty = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
const isOverdue = (work: LegislativeWork) => Boolean(work.due_at && new Date(work.due_at).getTime() < Date.now());

export default function LegislativeWorkQueue({ work }: { work: LegislativeWork[] }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-[var(--border-control)] dark:bg-[var(--surface-card)]" aria-labelledby="legislative-work-heading">
            <div className="flex flex-wrap items-end justify-between gap-2"><div><div className="text-xs font-bold uppercase tracking-wide text-[var(--status-info-fg)]">Current workload</div><h2 id="legislative-work-heading" className="mt-0.5 text-sm font-bold text-[var(--ink-primary)]">Legislative routed work</h2></div><span className="text-xs text-slate-400">{work.length} loaded</span></div>
            <div className="mt-3 space-y-1.5 @min-[620px]:max-h-[24rem] @min-[620px]:overflow-y-auto @min-[620px]:pr-1 @min-[620px]:[scrollbar-gutter:stable]">
                {work.map((item) => {
                    const overdue = isOverdue(item);
                    return (
                        <a key={item.id} href={`/transactions/${item.id}`} aria-label={`Open ${item.reference_no}: ${item.title}`} className={`block min-w-0 rounded-lg border p-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-700/25 ${overdue ? 'border-rose-200 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/20' : 'border-slate-100 bg-slate-50 dark:border-[var(--border-default)] dark:bg-[var(--surface-card)]'}`}>
                            <div className="text-xs font-bold text-[var(--status-info-fg)]">{item.reference_no}</div>
                            <div className="mt-0.5 break-words font-semibold leading-4 text-[var(--ink-primary)]">{item.title}</div>
                            <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-[var(--ink-secondary)]"><span>{pretty(item.status)}</span><span>{pretty(item.priority)}</span><span>{item.current_department?.short_name || item.current_department?.name || 'Legislative office'}</span>{item.due_at && <span className={overdue ? 'font-semibold text-rose-700 dark:text-rose-300' : ''}>{overdue ? 'Overdue' : 'Due'} {formatDateTimePH(item.due_at)}</span>}</div>
                        </a>
                    );
                })}
                {work.length === 0 && <div className="rounded-lg bg-slate-50 px-3 py-5 text-center text-sm text-slate-500 dark:bg-[var(--surface-card)] dark:text-[var(--ink-secondary)]">No open legislative routed work in the loaded set.</div>}
            </div>
        </section>
    );
}
