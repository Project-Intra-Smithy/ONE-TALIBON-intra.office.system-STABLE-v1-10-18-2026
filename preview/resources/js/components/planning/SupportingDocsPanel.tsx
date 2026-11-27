import DocumentUploadStudio from '../../../../../resources/js/components/planning/DocumentUploadStudio';
import SupportingDocumentCard from '../../../../../resources/js/components/planning/SupportingDocumentCard';
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
                <DocumentUploadStudio title={title} category={category} visibility={visibility} controlRef={controlRef}
                    onTitleChange={setTitle} onCategoryChange={value=>setCategory(value as PlanningAttachmentCategory)} onVisibilityChange={value=>setVisibility(value as AttachmentVisibility)} onControlRefChange={setControlRef}
                    onFileChange={file=>handleFileSelect(file??undefined)} onSubmit={handleUploadSubmit} onCancel={()=>setUploadOpen(false)}
                    categories={CATEGORIES.map(value=>({value,label:ATTACHMENT_CATEGORY_META[value].label}))}
                    visibilities={VISIBILITIES.map(value=>({value,label:ATTACHMENT_VISIBILITY_META[value].label}))}
                    accept={ACCEPTED_ATTACHMENT_EXTENSIONS} fileLabel="Select file (PDF, XLSX, DOCX, PNG/JPG)"
                    selectedFileLabel={selectedFile ? `${selectedFile.name} (${formatFileBytes(selectedFile.sizeBytes)})` : undefined} />
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
                            <SupportingDocumentCard key={doc.id} title={doc.title} icon={formatIcon(doc)} badges={<><StatusBadge tone={catMeta.tone}>{catMeta.shortLabel}</StatusBadge><span className="font-mono text-xs font-bold">{doc.formatLabel}</span>{doc.visibility !== 'all_lgu' && <StatusBadge tone="warn">{visMeta.shortLabel}</StatusBadge>}</>} metadata={<><span className="font-mono font-semibold">{doc.controlRef}</span> · {doc.sizeLabel} · Uploaded {formatDatePH(doc.uploadedAt)} by {doc.uploadedBy}</>} actions={<>
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
</>} />
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
