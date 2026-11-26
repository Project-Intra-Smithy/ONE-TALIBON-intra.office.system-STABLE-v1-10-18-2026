import { CalendarDays, FileText, Gavel } from 'lucide-react';
import { legislativeCalendar, legislativeCommittees } from '../../data/municipal/legislative';

export default function LegislativeCalendarPanel() {
    return (
        <details className="group rounded-xl border border-slate-200 bg-white dark:border-[var(--border-control)] dark:bg-[var(--surface-card)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--municipal-focus)]/25">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--municipal-brand)]"><Gavel size={15} /> Legislative reference</div>
                    <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">Reference calendar and committee context — not a live schedule feed.</p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-[var(--ink-secondary)]"><span className="group-open:hidden">View reference</span><span className="hidden group-open:inline text-[var(--municipal-brand)]">Hide reference</span></span>
            </summary>
            <div className="grid gap-3 border-t border-slate-100 p-3 dark:border-[var(--border-control)] @min-[700px]:max-h-[22rem] @min-[700px]:overflow-y-auto @min-[700px]:[scrollbar-gutter:stable] @min-[920px]:grid-cols-[1.2fr_0.8fr]">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]"><CalendarDays size={15} /> Upcoming legislative calendar</div>
                    <div className="mt-2 grid gap-x-4 @min-[620px]:grid-cols-2">
                        {legislativeCalendar.map((item) => (
                            <div key={`${item.date}-${item.title}`} className="border-b border-slate-100 py-2.5 dark:border-[var(--border-control)]">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="text-xs font-bold text-[var(--ink-primary)]">{item.date}</span><span className="text-xs font-bold uppercase tracking-wide text-[var(--municipal-brand)]">{item.type}</span></div>
                                <div className="mt-1 text-sm font-semibold leading-5 text-[var(--ink-primary)]">{item.title}</div>
                                <div className="mt-1 text-xs text-[var(--ink-secondary)]">{item.office}</div>
                                <div className="mt-1 flex items-center gap-1 text-xs text-[var(--ink-secondary)]"><FileText size={11} /> {item.document}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Committee reference</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">{legislativeCommittees.map((committee) => <span key={committee} className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:bg-[var(--surface-card)] dark:text-[var(--ink-secondary)]">{committee}</span>)}</div>
                </div>
            </div>
        </details>
    );
}
