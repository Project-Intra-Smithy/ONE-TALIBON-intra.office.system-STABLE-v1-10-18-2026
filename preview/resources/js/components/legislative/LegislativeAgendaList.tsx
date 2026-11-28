import type { LegislativeAgendaItem } from './types';
const pretty = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());

export default function LegislativeAgendaList({ items }: { items: LegislativeAgendaItem[] }) {
    if (items.length === 0) return <div className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-500 dark:bg-[var(--surface-card)] dark:text-[var(--ink-secondary)]">No agenda items are recorded for this session.</div>;

    return (
        <ol className="space-y-2">
            {items.map((item) => {
                const reference = item.transaction?.reference_no || item.legislative_record?.record_number || 'Internal agenda item';
                return <li key={item.id} className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm dark:bg-[var(--surface-card)]"><div className="font-medium text-[var(--ink-primary)]"><span className="mr-1 font-bold text-[var(--status-info-fg)]">{item.sequence_no}.</span>{item.title}</div><div className="mt-1 flex flex-wrap gap-x-2 text-xs text-[var(--ink-secondary)]"><span>{reference}</span><span>·</span><span>{pretty(item.status)}</span></div></li>;
            })}
        </ol>
    );
}
