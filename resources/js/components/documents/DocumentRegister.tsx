import { Link } from '@inertiajs/react';
import { BriefcaseBusiness, FileText, Mail } from 'lucide-react';
import StatusBadge from '../portal/StatusBadge';
import DocumentMetadataPanel from './DocumentMetadataPanel';
import { displayLabel, formatRecordDate, recordDateLabel, recordFamily, recordStatusTone, type DocumentRow } from './documentCenterPresentation';
type Props = { records: DocumentRow[]; total: number; selectedUrl: string | null; onSelect: (record: DocumentRow | null) => void };
export default function DocumentRegister({ records, total, selectedUrl, onSelect }: Props) {
    return <section className="municipal-panel min-w-0 overflow-hidden" aria-label="Authorized document register"><header className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-[var(--municipal-border)] px-3 py-2"><h2 className="text-sm font-semibold">Authorized records</h2><span className="municipal-metadata">{total} records</span></header>
        <div className="municipal-register-heading hidden grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_88px_44px] gap-3 xl:grid"><span>Document / Reference</span><span>Office / Status</span><span>Date</span><span>Action</span></div>
        <div>{records.map((record) => {
            const selected = selectedUrl === record.detailUrl;
            const Icon = record.recordType === 'correspondence' ? Mail : record.recordType === 'transaction' ? BriefcaseBusiness : FileText;
            return <article key={record.detailUrl} className={`border-b border-[var(--municipal-border)] last:border-b-0 ${selected ? 'municipal-selected border-l-2 border-l-[var(--municipal-selected-border)]' : 'hover:bg-[var(--municipal-hover)]'}`}>
                <div className="grid min-w-0 gap-2 px-3 py-2 xl:min-h-16 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_88px_44px] xl:items-start xl:gap-3"><div className="min-w-0"><button type="button" onClick={() => onSelect(selected ? null : record)} aria-pressed={selected} className="flex min-h-11 w-full items-start gap-2 text-left xl:min-h-0"><Icon size={15} className="mt-0.5 shrink-0 text-[var(--municipal-brand)]" aria-hidden="true" /><span className="break-words text-sm font-semibold leading-5">{record.title}</span></button><div className="mt-1 break-words text-xs leading-4 text-[var(--municipal-muted)]">{record.reference && <span>{record.reference} / </span>}{recordFamily(record.recordType)}</div></div>
                    <div className="flex min-w-0 flex-wrap items-center gap-2 xl:block"><p className="break-words text-xs leading-4 text-[var(--municipal-muted)]">{record.currentOffice?.shortName || record.currentOffice?.name || 'Office not supplied'}</p><div className="xl:mt-1"><StatusBadge label={displayLabel(record.state)} tone={recordStatusTone(record)} /></div></div>
                    <div className="text-xs leading-4 text-[var(--municipal-muted)]"><span className="xl:sr-only">{recordDateLabel(record.recordType)}: </span>{record.recordDate ? <time dateTime={record.recordDate} title={recordDateLabel(record.recordType)}>{formatRecordDate(record.recordDate)}</time> : <span>Not supplied</span>}</div>
                    <div className="flex flex-wrap items-center justify-between gap-2"><button type="button" className="municipal-action municipal-action--quiet xl:hidden" aria-expanded={selected} onClick={() => onSelect(selected ? null : record)}>{selected ? 'Close preview' : 'Preview'}</button><Link href={record.detailUrl} className="inline-flex min-h-11 items-center text-xs font-semibold text-[var(--municipal-brand)]" aria-label={`Open source record: ${record.title}`}>Open</Link></div>
                </div>
                {selected && <div className="p-3 pt-0 xl:hidden"><DocumentMetadataPanel record={record} onClose={() => onSelect(null)} /></div>}
            </article>;
        })}</div>
        {!records.length && <div className="municipal-empty-state"><div><p>No authorized records match these filters.</p><p className="mt-1 text-xs">Try adjusting your search or filters.</p></div></div>}
    </section>;
}
