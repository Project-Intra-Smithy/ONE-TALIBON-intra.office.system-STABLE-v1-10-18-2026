import { ChevronRight, FolderKanban } from 'lucide-react';
import type { PPARecord } from '../../data/municipal/ppas.types';

const statusClass: Record<PPARecord['status'], string> = {
    Planned: 'bg-[var(--municipal-status-slate-bg)] text-[var(--municipal-status-slate-text)]',
    'For Procurement': 'bg-[var(--municipal-status-amber-bg)] text-[var(--municipal-status-amber-text)]',
    Ongoing: 'bg-[var(--municipal-status-blue-bg)] text-[var(--municipal-status-blue-text)]',
    Completed: 'bg-[var(--municipal-status-green-bg)] text-[var(--municipal-status-green-text)]',
    'On Hold': 'bg-[var(--municipal-status-rose-bg)] text-[var(--municipal-status-rose-text)]',
};

type Props = {
    records: PPARecord[];
    selectedId?: string;
    onSelect: (record: PPARecord | null) => void;
};

export default function PPARegister({ records, selectedId, onSelect }: Props) {
    if (!records.length) return <div className="municipal-panel border-dashed p-8 text-center"><FolderKanban className="mx-auto text-[var(--municipal-muted)]" aria-hidden="true" /><h2 className="mt-3 font-bold">No PPAs match the current filters</h2><p className="mt-1 text-sm text-[var(--municipal-muted)]">Adjust the search or filter criteria to return records.</p></div>;

    return <>
        <div className="space-y-2 lg:hidden" aria-label="PPA register">
            {records.map((record) => {
                const active = selectedId === record.id;
                return <article key={record.id} className={`municipal-panel p-3 ${active ? 'border-[var(--municipal-selected-border)] bg-[var(--municipal-selected-bg)]' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0"><div className="text-[11px] font-bold uppercase tracking-wide text-[var(--municipal-brand)]">{record.id} / {record.year}</div><h2 className="mt-0.5 text-sm font-semibold leading-5">{record.title}</h2><p className="mt-1 text-xs text-[var(--municipal-muted)]">{record.responsibleOffice}</p></div>
                        <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${statusClass[record.status]}`}>{record.status}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--municipal-muted)]"><span>{record.sector}</span><span>{record.relatedProjectCount} related projects</span><span>{record.priority} priority</span></div>
                    <button data-ppa-trigger={record.id} id={`ppa-select-mobile-${record.id}`} type="button" onClick={() => onSelect(active ? null : record)} className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-md border border-[var(--municipal-border)] px-3 text-xs font-bold text-[var(--municipal-brand)] hover:bg-[var(--municipal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)]" aria-expanded={active} aria-controls={active ? 'selected-ppa-detail' : undefined}>
                        {active ? 'Close details' : 'View details'} <ChevronRight size={14} aria-hidden="true" className={active ? 'rotate-90' : ''} />
                    </button>
                </article>;
            })}
        </div>

        <div className="municipal-panel hidden overflow-hidden lg:block">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] table-fixed text-left text-sm">
                    <thead className="bg-[var(--municipal-surface-subtle)] text-[11px] uppercase tracking-wide text-[var(--municipal-muted)]"><tr><th className="w-[42%] px-3 py-2">PPA</th><th className="w-[24%] px-3 py-2">Office</th><th className="w-[14%] px-3 py-2">Status</th><th className="w-[10%] px-3 py-2 text-right">Projects</th><th className="w-[10%] px-3 py-2"><span className="sr-only">Open</span></th></tr></thead>
                    <tbody className="divide-y divide-[var(--municipal-border)]">
                        {records.map((record) => <tr key={record.id} aria-selected={selectedId === record.id} className={selectedId === record.id ? 'bg-[var(--municipal-selected-bg)]' : 'hover:bg-[var(--municipal-hover)]'}>
                            <td className="px-3 py-2 align-top"><div className="font-semibold leading-5">{record.title}</div><div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-[var(--municipal-muted)]"><span>{record.id} / {record.year}</span><span>{record.sector}</span><span>{record.priority} priority</span></div></td>
                            <td className="px-3 py-2 align-top text-xs leading-5 text-[var(--municipal-muted)]">{record.responsibleOffice}</td>
                            <td className="px-3 py-2 align-top"><span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${statusClass[record.status]}`}>{record.status}</span></td>
                            <td className="px-3 py-2 text-right align-top font-bold">{record.relatedProjectCount}</td>
                            <td className="px-2 py-1 text-right align-top"><button data-ppa-trigger={record.id} id={`ppa-select-desktop-${record.id}`} type="button" onClick={() => onSelect(record)} aria-expanded={selectedId === record.id} aria-controls={selectedId === record.id ? 'selected-ppa-detail' : undefined} className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-xs font-bold text-[var(--municipal-brand)] hover:bg-[var(--municipal-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30">View <ChevronRight size={14} aria-hidden="true" /></button></td>
                        </tr>)}
                    </tbody>
                </table>
            </div>
        </div>
    </>;
}
