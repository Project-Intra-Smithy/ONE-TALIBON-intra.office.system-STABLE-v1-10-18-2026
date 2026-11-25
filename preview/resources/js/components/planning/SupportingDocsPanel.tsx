import { Download, Eye, FileSpreadsheet, FileText, Image as ImageIcon, Lock, Paperclip, Plus, Trash2, Upload } from 'lucide-react';
import { type FormEvent, useId, useState } from 'react';
import {
    ACCEPTED_ATTACHMENT_EXTENSIONS,
    ATTACHMENT_CATEGORY_META,
    ATTACHMENT_VISIBILITY_META,
    detectAttachmentFormat,
    formatFileBytes,
    type AttachmentVisibility,
    type PlanningAttachment,
    type PlanningAttachmentCategory,
    type PlanningSuitePermissions,
} from '../../data/municipal/planningGovernance';
import { formatDatePH } from '../../lib/format';
import { Button, ConfirmDialog, FormField, StatusBadge } from '../ui';
import DocumentPreviewModal, { triggerAttachmentDownload } from './DocumentPreviewModal';

type Props = {
    parentType: 'plan' | 'ppa' | 'map';
    parentId: string;
    recordOffice?: string;
    actorName: string;
    attachments: PlanningAttachment[];
    permissions: PlanningSuitePermissions;
    onAddAttachment: (attachment: PlanningAttachment) => void;
    onRemoveAttachment: (id: string) => void;
};

const CATEGORIES = Object.keys(ATTACHMENT_CATEGORY_META) as PlanningAttachmentCategory[];
const VISIBILITIES = Object.keys(ATTACHMENT_VISIBILITY_META) as AttachmentVisibility[];

export default function SupportingDocsPanel({
    parentType,
    parentId,
    recordOffice,
    actorName,
    attachments,
    permissions,
    onAddAttachment,
    onRemoveAttachment,
}: Props) {
    const fileInputId = useId();
    const titleInputId = useId();
    const refInputId = useId();
    const catSelectId = useId();
    const visSelectId = useId();

    const [uploadOpen, setUploadOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [controlRef, setControlRef] = useState('');
    const [category, setCategory] = useState<PlanningAttachmentCategory>(
        parentType === 'plan' ? 'sb_resolution' : 'pow_ded',
    );
    const [visibility, setVisibility] = useState<AttachmentVisibility>('all_lgu');
    const [selectedFile, setSelectedFile] = useState<{
        name: string;
        mimeType: string;
        sizeBytes: number;
        previewImageUrl?: string;
    } | null>(null);
    const [previewing, setPreviewing] = useState<PlanningAttachment | null>(null);
    const [deleting, setDeleting] = useState<PlanningAttachment | null>(null);

    const canManageDocs = permissions.canManageDocsFor(recordOffice);
    const visibleDocs = attachments.filter((doc) => permissions.canViewAttachment(doc.visibility, recordOffice));
    const restrictedCount = attachments.length - visibleDocs.length;

    const handleFileSelect = (file: File | undefined) => {
        if (!file) return;
        const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
        if (!title.trim()) setTitle(baseName);
        if (!controlRef.trim()) {
            setControlRef(`DOC-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 899))}`);
        }

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => {
                setSelectedFile({
                    name: file.name,
                    mimeType: file.type || 'image/jpeg',
                    sizeBytes: file.size,
                    previewImageUrl: typeof reader.result === 'string' ? reader.result : undefined,
                });
            };
            reader.readAsDataURL(file);
        } else {
            setSelectedFile({
                name: file.name,
                mimeType: file.type || 'application/pdf',
                sizeBytes: file.size,
            });
        }
    };

    const handleUploadSubmit = (event: FormEvent) => {
        event.preventDefault();
        if (!title.trim()) return;

        const filename = selectedFile?.name || `${title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')}.pdf`;
        const mimeType = selectedFile?.mimeType || 'application/pdf';
        const formatLabel = detectAttachmentFormat(filename, mimeType);
        const sizeLabel = selectedFile ? formatFileBytes(selectedFile.sizeBytes) : '240 KB';

        const created: PlanningAttachment = {
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            parentType,
            parentId,
            category,
            title: title.trim(),
            controlRef: controlRef.trim() || `REF-${new Date().getFullYear()}`,
            filename,
            mimeType,
            formatLabel,
            sizeLabel,
            visibility,
            uploadedAt: new Date().toISOString().slice(0, 10),
            uploadedBy: actorName,
            officeOwner: recordOffice,
            previewImageUrl: selectedFile?.previewImageUrl,
            previewExcerpt: `Supporting ${ATTACHMENT_CATEGORY_META[category].label.toLowerCase()} attached to ${parentId} via ONE TALIBON Planning Suite.`,
            previewFields: [
                ['Document Control Ref', controlRef.trim() || 'Recorded on upload'],
                ['Original File', filename],
                ['Responsible Office', recordOffice || 'Municipal Planning and Development Office'],
                ['Access Level', ATTACHMENT_VISIBILITY_META[visibility].label],
            ],
        };

        onAddAttachment(created);
        setTitle('');
        setControlRef('');
        setSelectedFile(null);
        setUploadOpen(false);
    };

    const formatIcon = (doc: PlanningAttachment) => {
        if (doc.formatLabel === 'XLSX' || doc.formatLabel === 'CSV') {
            return <FileSpreadsheet size={16} aria-hidden="true" />;
        }
        if (doc.formatLabel === 'PNG' || doc.formatLabel === 'JPG' || doc.formatLabel === 'WEBP') {
            return <ImageIcon size={16} aria-hidden="true" />;
        }
        return <FileText size={16} aria-hidden="true" />;
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
                        Attached Supporting Documents ({visibleDocs.length})
                    </h3>
                    <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                        Official resolutions, AIP spreadsheets, POW/DED packages, and site exhibits (PDF, XLSX, DOCX, PNG/JPG).
                    </p>
                </div>
                {canManageDocs && (
                    <Button
                        size="sm"
                        variant={uploadOpen ? 'secondary' : 'primary'}
                        onClick={() => setUploadOpen((prev) => !prev)}
                    >
                        <Plus size={14} aria-hidden="true" />
                        <span>{uploadOpen ? 'Cancel upload' : 'Attach document'}</span>
                    </Button>
                )}
            </div>

            {uploadOpen && canManageDocs && (
                <form
                    onSubmit={handleUploadSubmit}
                    className="space-y-3 rounded-xl border border-[var(--brand-soft-border)] bg-[var(--surface-recessed)] p-4"
                >
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                        <Upload size={14} aria-hidden="true" />
                        <span>Attach supporting file</span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <FormField label="Select file (PDF, XLSX, DOCX, PNG/JPG)" htmlFor={fileInputId} className="sm:col-span-2">
                            <input
                                id={fileInputId}
                                type="file"
                                accept={ACCEPTED_ATTACHMENT_EXTENSIONS}
                                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                                className="tcds-input py-2 text-xs"
                            />
                            {selectedFile && (
                                <p className="mt-1 text-xs font-medium text-[var(--brand-ink)]">
                                    Selected: {selectedFile.name} ({formatFileBytes(selectedFile.sizeBytes)})
                                </p>
                            )}
                        </FormField>

                        <FormField label="Document title" htmlFor={titleInputId} required className="sm:col-span-2">
                            <input
                                id={titleInputId}
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., SB Res. No. 2026-045 or Program of Works — Phase 1"
                                className="tcds-input"
                            />
                        </FormField>

                        <FormField label="Control / Resolution Ref." htmlFor={refInputId} optional>
                            <input
                                id={refInputId}
                                value={controlRef}
                                onChange={(e) => setControlRef(e.target.value)}
                                placeholder="e.g., MEO-POW-2027-019"
                                className="tcds-input font-mono"
                            />
                        </FormField>

                        <FormField label="Document category" htmlFor={catSelectId} required>
                            <select
                                id={catSelectId}
                                value={category}
                                onChange={(e) => setCategory(e.target.value as PlanningAttachmentCategory)}
                                className="tcds-input"
                            >
                                {CATEGORIES.map((key) => (
                                    <option key={key} value={key}>
                                        {ATTACHMENT_CATEGORY_META[key].label}
                                    </option>
                                ))}
                            </select>
                        </FormField>

                        <FormField label="Access visibility tier" htmlFor={visSelectId} required className="sm:col-span-2">
                            <select
                                id={visSelectId}
                                value={visibility}
                                onChange={(e) => setVisibility(e.target.value as AttachmentVisibility)}
                                className="tcds-input"
                            >
                                {VISIBILITIES.map((key) => (
                                    <option key={key} value={key}>
                                        {ATTACHMENT_VISIBILITY_META[key].label}
                                    </option>
                                ))}
                            </select>
                        </FormField>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                        <Button type="button" variant="secondary" size="sm" onClick={() => setUploadOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm">
                            Save attachment
                        </Button>
                    </div>
                </form>
            )}

            {visibleDocs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border-control)] bg-[var(--surface-recessed)] p-6 text-center">
                    <Paperclip size={20} aria-hidden="true" className="mx-auto text-[var(--ink-secondary)]" />
                    <p className="mt-2 text-sm font-semibold text-[var(--ink-primary)]">No supporting documents attached yet</p>
                    <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                        {canManageDocs
                            ? 'Attach official SB/MDC resolutions, AIP budget matrices, POW/DED packages, or site exhibits above.'
                            : 'Authorized MPDC or implementing office editors can upload official reference attachments here.'}
                    </p>
                </div>
            ) : (
                <ul className="space-y-2.5">
                    {visibleDocs.map((doc) => {
                        const catMeta = ATTACHMENT_CATEGORY_META[doc.category];
                        const visMeta = ATTACHMENT_VISIBILITY_META[doc.visibility];
                        return (
                            <li
                                key={doc.id}
                                className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5"
                            >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex min-w-0 flex-1 items-start gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--brand-ink)]">
                                            {formatIcon(doc)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <StatusBadge tone={catMeta.tone}>{catMeta.shortLabel}</StatusBadge>
                                                <span className="rounded border border-[var(--border-control)] bg-[var(--surface-card)] px-1.5 py-0.5 font-mono text-xs font-bold text-[var(--ink-primary)]">
                                                    {doc.formatLabel}
                                                </span>
                                                {doc.visibility !== 'all_lgu' && (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--status-warn-fg)]">
                                                        <Lock size={10} aria-hidden="true" />
                                                        <span>{visMeta.shortLabel}</span>
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1.5 text-sm font-bold leading-snug text-[var(--ink-primary)]">
                                                {doc.title}
                                            </p>
                                            <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                                                <span className="font-mono font-semibold">{doc.controlRef}</span> · {doc.sizeLabel} · Uploaded{' '}
                                                {formatDatePH(doc.uploadedAt)} by {doc.uploadedBy}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setPreviewing(doc)}
                                            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[var(--border-control)] bg-[var(--surface-card)] px-3 text-xs font-semibold text-[var(--ink-primary)] transition-colors hover:border-[var(--brand-primary)] hover:bg-[var(--brand-soft)]"
                                        >
                                            <Eye size={14} aria-hidden="true" />
                                            <span>Preview</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => triggerAttachmentDownload(doc)}
                                            aria-label={`Download ${doc.title}`}
                                            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[var(--border-control)] bg-[var(--surface-card)] px-2.5 text-xs font-semibold text-[var(--ink-primary)] transition-colors hover:bg-[var(--surface-hover)]"
                                        >
                                            <Download size={14} aria-hidden="true" />
                                            <span className="sr-only sm:not-sr-only">Download</span>
                                        </button>
                                        {canManageDocs && (
                                            <button
                                                type="button"
                                                onClick={() => setDeleting(doc)}
                                                aria-label={`Remove ${doc.title}`}
                                                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border-control)] bg-[var(--surface-card)] px-2.5 text-xs font-semibold text-[var(--status-danger-fg)] transition-colors hover:bg-[var(--status-danger-bg)]"
                                            >
                                                <Trash2 size={14} aria-hidden="true" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {restrictedCount > 0 && (
                <p className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] px-3 py-2 text-xs text-[var(--ink-secondary)]">
                    <Lock size={13} aria-hidden="true" className="shrink-0" />
                    <span>
                        {restrictedCount} additional internal working {restrictedCount === 1 ? 'document is' : 'documents are'} restricted to MPDC / Executive / Implementing Office personnel.
                    </span>
                </p>
            )}

            <DocumentPreviewModal attachment={previewing} onClose={() => setPreviewing(null)} />

            <ConfirmDialog
                open={Boolean(deleting)}
                title={deleting ? `Remove “${deleting.title}”?` : 'Remove attachment?'}
                message="This removes the supporting document from this record. You can attach a replacement document anytime."
                confirmLabel="Remove document"
                destructive
                onCancel={() => setDeleting(null)}
                onConfirm={() => {
                    if (deleting) onRemoveAttachment(deleting.id);
                    setDeleting(null);
                }}
            />
        </div>
    );
}
