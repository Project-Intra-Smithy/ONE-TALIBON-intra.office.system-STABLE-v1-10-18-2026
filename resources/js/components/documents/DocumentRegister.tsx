import { Link } from '@inertiajs/react';
import { BriefcaseBusiness, FileText, Mail } from 'lucide-react';
import StatusBadge from '../portal/StatusBadge';
import DocumentMetadataPanel from './DocumentMetadataPanel';
import { displayLabel, formatRecordDate, recordDateLabel, recordFamily, recordStatusTone, type DocumentRow } from './documentCenterPresentation';
type Props = { records: DocumentRow[]; total: number; selectedUrl: string | null; onSelect: (record: DocumentRow | null) => void };
export default function DocumentRegister({ records, total, selectedUrl, onSelect }: Props) {
    return <section className="dc-register" aria-label="Document register"><header className="dc-register-caption"><h2>Documents</h2><span>{total} authorized records</span></header>
        <div className="dc-register-head"><span>Title / Reference</span><span>Date</span><span>Type / Office</span><span>Status</span><span>Action</span></div>
        <div className="dc-register-body" tabIndex={0} aria-label="Document records">{records.map((record) => {
            const selected = selectedUrl === record.detailUrl;
            const Icon = record.recordType === 'correspondence' ? Mail : record.recordType === 'transaction' ? BriefcaseBusiness : FileText;
            return <article key={record.detailUrl} className={`dc-record ${selected ? 'dc-record-selected' : ''}`}>
                <div className="dc-record-grid"><div className="dc-record-title"><button type="button" onClick={() => onSelect(selected ? null : record)} aria-pressed={selected}><Icon size={15} aria-hidden="true" /><span>{record.title}<small>{record.reference || recordFamily(record.recordType)}</small></span></button></div>
                    <div className="dc-record-date"><span className="dc-mobile-label">{recordDateLabel(record.recordType)}: </span>{record.recordDate ? <time dateTime={record.recordDate} title={recordDateLabel(record.recordType)}>{formatRecordDate(record.recordDate)}</time> : <span>Not supplied</span>}</div>
                    <div className="dc-record-type"><span>{recordFamily(record.recordType)}</span>{record.currentOffice && <small>{record.currentOffice.shortName || record.currentOffice.name}</small>}</div>
                    <div className="dc-record-status"><StatusBadge label={displayLabel(record.state)} tone={recordStatusTone(record)} /></div>
                    <div className="dc-record-actions"><button type="button" className="dc-mobile-preview" aria-expanded={selected} onClick={() => onSelect(selected ? null : record)}>{selected ? 'Close preview' : 'Preview'}</button><Link href={record.detailUrl} className="dc-open" aria-label={`Open record: ${record.title}`}>Open</Link></div>
                </div>
                {selected && <div className="dc-inline-metadata"><DocumentMetadataPanel record={record} onClose={() => onSelect(null)} /></div>}
            </article>;
        })}{!records.length && <div className="dc-empty">No authorized records match these filters. Try adjusting your search or filters.</div>}</div>
    </section>;
}
