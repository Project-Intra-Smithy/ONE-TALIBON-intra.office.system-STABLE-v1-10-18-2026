import { useEffect, useRef } from 'react';
import { Building2, FileText, FolderKanban, Landmark, X } from 'lucide-react';
import type { PPARecord } from '../../data/municipal/ppas.types';

export default function PPADetailPanel({ record, onClose }: { record: PPARecord | null; onClose: () => void }) {
    const panelRef = useRef<HTMLElement>(null);
    useEffect(() => {
        if (!record) return;
        const frame = window.requestAnimationFrame(() => {
            panelRef.current?.focus();
            panelRef.current?.scrollIntoView({ block: 'nearest' });
        });
        return () => window.cancelAnimationFrame(frame);
    }, [record?.id]);
    if (!record) return null;
    const fields = [
        ['Responsible office', record.responsibleOffice, Building2],
        ['Development plan', record.relatedDevelopmentPlan, FileText],
        ['Funding source', record.fundingSource, Landmark],
        ['Related projects', String(record.relatedProjectCount), FolderKanban],
    ] as const;
    return <aside id="selected-ppa-detail" ref={panelRef} tabIndex={-1} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); onClose(); } }} className="municipal-panel ot-r6-ppa-detail min-w-0 p-3" aria-label="Selected PPA details">
        <div className="flex items-start justify-between gap-4"><div><div className="text-[11px] font-bold uppercase tracking-wide text-[var(--municipal-brand)]">{record.id} / {record.year}</div><h2 className="mt-0.5 text-base font-bold">{record.title}</h2><div className="mt-1 text-xs text-[var(--municipal-muted)]">{record.sector} / {record.status} / {record.priority} priority</div></div><button type="button" onClick={onClose} className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30" aria-label="Close details"><X size={17} /></button></div>
        <p className="mt-2 text-xs leading-5 text-[var(--municipal-muted)]">Reference record · Not verified live implementation progress</p>
        <p className="mt-2 text-sm leading-5 text-[var(--municipal-text)]">{record.implementationContext}</p>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">{fields.map(([label, value, Icon]) => <div key={label} className="rounded-[var(--municipal-radius-surface)] bg-[var(--municipal-surface-subtle)] p-2.5"><dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]"><Icon size={13} aria-hidden="true" />{label}</dt><dd className="mt-1 text-xs font-semibold leading-5">{value}</dd></div>)}</dl>
    </aside>;
}
