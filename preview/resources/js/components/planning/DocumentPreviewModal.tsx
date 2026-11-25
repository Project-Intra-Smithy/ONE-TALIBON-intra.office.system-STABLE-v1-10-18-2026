import { Download, FileSpreadsheet, FileText, Image as ImageIcon, Lock, Printer, ShieldCheck, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';
import {
    ATTACHMENT_CATEGORY_META,
    ATTACHMENT_VISIBILITY_META,
    type PlanningAttachment,
} from '../../data/municipal/planningGovernance';
import { formatDatePH } from '../../lib/format';
import { Button, Dialog, StatusBadge } from '../ui';

type Props = {
    attachment: PlanningAttachment | null;
    onClose: () => void;
};

const ZOOM_STEPS = [100, 130, 165, 210] as const;

export function triggerAttachmentDownload(doc: PlanningAttachment) {
    if (typeof window === 'undefined') return;
    if (doc.previewImageUrl) {
        const link = document.createElement('a');
        link.href = doc.previewImageUrl;
        link.download = doc.filename;
        link.click();
        return;
    }

    const lines = [
        'REPUBLIC OF THE PHILIPPINES',
        'PROVINCE OF BOHOL · MUNICIPALITY OF TALIBON',
        'ONE TALIBON · LOCAL DEVELOPMENT PLANNING SUITE',
        '============================================================',
        `Document Title   : ${doc.title}`,
        `Control Ref      : ${doc.controlRef}`,
        `Category         : ${ATTACHMENT_CATEGORY_META[doc.category].label}`,
        `Format / Size    : ${doc.formatLabel} (${doc.sizeLabel})`,
        `Visibility Tier  : ${ATTACHMENT_VISIBILITY_META[doc.visibility].label}`,
        `Uploaded         : ${doc.uploadedAt} by ${doc.uploadedBy}`,
        '',
        'SUMMARY / EXCERPT:',
        doc.previewExcerpt || 'Official municipal planning supporting document on file.',
        '',
        ...(doc.previewFields?.map(([k, v]) => `${k}: ${v}`) ?? []),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.filename.endsWith('.txt') ? doc.filename : `${doc.controlRef || doc.id}_reference.txt`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function DocumentPreviewModal({ attachment, onClose }: Props) {
    const [surfaceView, setSurfaceView] = useState<'night' | 'paper'>('night');
    const [zoomIndex, setZoomIndex] = useState(0);

    if (!attachment) return null;

    const categoryMeta = ATTACHMENT_CATEGORY_META[attachment.category];
    const visibilityMeta = ATTACHMENT_VISIBILITY_META[attachment.visibility];
    const isImage = Boolean(attachment.previewImageUrl);
    const zoom = ZOOM_STEPS[zoomIndex];

    return (
        <Dialog
            open={Boolean(attachment)}
            onClose={() => {
                setZoomIndex(0);
                onClose();
            }}
            size="xl"
            title={attachment.title}
            description={`${attachment.controlRef} · ${attachment.formatLabel} · ${attachment.sizeLabel}`}
            footer={
                <div className="flex w-full flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                        {isImage ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
                                    disabled={zoomIndex === 0}
                                    aria-label="Zoom out exhibit"
                                    className="municipal-secondary-button px-3 disabled:opacity-50"
                                >
                                    <ZoomOut size={15} aria-hidden="true" />
                                </button>
                                <span className="min-w-12 text-center font-mono text-xs font-bold text-[var(--ink-primary)]">
                                    {zoom}%
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
                                    disabled={zoomIndex === ZOOM_STEPS.length - 1}
                                    aria-label="Zoom in exhibit"
                                    className="municipal-secondary-button px-3 disabled:opacity-50"
                                >
                                    <ZoomIn size={15} aria-hidden="true" />
                                </button>
                            </>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-secondary)]">
                                <ShieldCheck size={14} aria-hidden="true" className="text-[var(--brand-ink)]" />
                                <span>Authorized LGU document preview</span>
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => window.print()}>
                            <Printer size={14} aria-hidden="true" />
                            <span>Print</span>
                        </Button>
                        <Button size="sm" onClick={() => triggerAttachmentDownload(attachment)}>
                            <Download size={14} aria-hidden="true" />
                            <span>Download {attachment.formatLabel}</span>
                        </Button>
                        <Button variant="secondary" size="sm" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone={categoryMeta.tone}>{categoryMeta.label}</StatusBadge>
                        <StatusBadge tone="neutral">{attachment.formatLabel}</StatusBadge>
                        <StatusBadge tone={attachment.visibility === 'all_lgu' ? 'ok' : 'warn'}>
                            {attachment.visibility !== 'all_lgu' && <Lock size={11} aria-hidden="true" className="mr-1 inline" />}
                            {visibilityMeta.shortLabel}
                        </StatusBadge>
                    </div>

                    <div
                        role="group"
                        aria-label="Preview reading surface"
                        className="hidden items-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] p-0.5 dark:inline-flex"
                    >
                        <button
                            type="button"
                            aria-pressed={surfaceView === 'night'}
                            onClick={() => setSurfaceView('night')}
                            className={`min-h-8 rounded-md px-2.5 text-xs font-semibold transition-colors ${
                                surfaceView === 'night'
                                    ? 'bg-[var(--brand-primary)] text-white'
                                    : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                            }`}
                        >
                            Night Mat
                        </button>
                        <button
                            type="button"
                            aria-pressed={surfaceView === 'paper'}
                            onClick={() => setSurfaceView('paper')}
                            className={`min-h-8 rounded-md px-2.5 text-xs font-semibold transition-colors ${
                                surfaceView === 'paper'
                                    ? 'bg-[var(--brand-primary)] text-white'
                                    : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                            }`}
                        >
                            Paper Print
                        </button>
                    </div>
                </div>

                {isImage ? (
                    <div
                        tabIndex={0}
                        role="region"
                        aria-label={`Image preview for ${attachment.title}`}
                        className={`max-h-[56dvh] overflow-auto rounded-xl border border-[var(--border-default)] p-3 ${
                            surfaceView === 'paper' ? 'tcds-paper-surface' : 'bg-[var(--surface-recessed)]'
                        }`}
                    >
                        <img
                            src={attachment.previewImageUrl}
                            alt={attachment.title}
                            style={{ width: `${zoom}%`, maxWidth: 'none' }}
                            className={`mx-auto block rounded-lg transition-[width,filter] duration-150 ${
                                surfaceView === 'paper' ? 'bg-white' : 'tcds-plate-thumb'
                            }`}
                        />
                    </div>
                ) : (
                    <article
                        className={`rounded-xl border border-[var(--border-default)] p-5 sm:p-6 ${
                            surfaceView === 'paper'
                                ? 'tcds-paper-surface text-[#111c17]'
                                : 'bg-[var(--surface-recessed)] text-[var(--ink-primary)]'
                        }`}
                    >
                        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-default)] pb-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand-ink)]">
                                    {attachment.formatLabel === 'XLSX' || attachment.formatLabel === 'CSV' ? (
                                        <FileSpreadsheet size={19} aria-hidden="true" />
                                    ) : attachment.formatLabel === 'PNG' || attachment.formatLabel === 'JPG' || attachment.formatLabel === 'WEBP' ? (
                                        <ImageIcon size={19} aria-hidden="true" />
                                    ) : (
                                        <FileText size={19} aria-hidden="true" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                                        Municipality of Talibon · Province of Bohol
                                    </p>
                                    <h3 className="mt-0.5 text-base font-extrabold leading-snug">{attachment.title}</h3>
                                    <p className="mt-1 font-mono text-xs opacity-75">
                                        {attachment.filename} · Control Ref: {attachment.controlRef}
                                    </p>
                                </div>
                            </div>
                        </header>

                        {attachment.previewExcerpt && (
                            <p className="mt-4 text-sm leading-6 opacity-90">{attachment.previewExcerpt}</p>
                        )}

                        {attachment.previewFields && attachment.previewFields.length > 0 && (
                            <dl className="mt-4 grid gap-3 border-t border-[var(--border-default)] pt-4 text-xs sm:grid-cols-2">
                                {attachment.previewFields.map(([label, value]) => (
                                    <div
                                        key={label}
                                        className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)]/60 p-3"
                                    >
                                        <dt className="font-bold uppercase tracking-wide opacity-70">{label}</dt>
                                        <dd className="mt-1 font-semibold leading-5">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        )}

                        <footer className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-default)] pt-3 text-xs opacity-75">
                            <span>Uploaded {formatDatePH(attachment.uploadedAt)} by {attachment.uploadedBy}</span>
                            <span>{visibilityMeta.label}</span>
                        </footer>
                    </article>
                )}
            </div>
        </Dialog>
    );
}
