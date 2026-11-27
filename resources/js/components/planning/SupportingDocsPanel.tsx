import DocumentUploadStudio from './DocumentUploadStudio';
import SupportingDocumentCard from './SupportingDocumentCard';
import DocumentPreviewPresentation from './DocumentPreviewPresentation';
import { router } from '@inertiajs/react';
import { Eye, FileText, Trash2, Upload } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import Button from '../ui/Button';

export type ServerPlanningAttachment = {
    publicId: string;
    attachmentId?: number;
    parentType: 'plan' | 'ppa' | 'map';
    parentCode: string;
    parentRecordId?: number | null;
    title: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    category: string;
    visibility: string;
    previewUrl: string;
    downloadUrl: string;
    canArchive?: boolean;
    createdAt?: string | null;
};

type Props = {
    parentType: 'plan' | 'ppa' | 'map';
    parentCode: string;
    parentRecordId?: number | null;
    attachments: ServerPlanningAttachment[];
    canUpload: boolean;
    canManageExecutive: boolean;
    canDelete: boolean;
};

const categoryLabels: Record<string, string> = {
    ordinance_resolution: 'Ordinance / Resolution',
    technical_narrative: 'Technical Narrative',
    aip_schedule: 'AIP / Schedule',
    site_photo: 'Site Photo / Plate',
    cartographic_plate: 'Cartographic Plate',
    working_draft: 'Working Draft',
};

const visibilityLabels: Record<string, string> = {
    public_portal: 'Public Reference',
    lgu_internal: 'LGU Internal',
    office_restricted: 'Office Restricted',
    mpdc_executive: 'MPDC / Executive Only',
};

export default function SupportingDocsPanel({
    parentType,
    parentCode,
    parentRecordId,
    attachments,
    canUpload,
    canManageExecutive,
    canDelete,
}: Props) {
    const [showUpload, setShowUpload] = useState(false);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('technical_narrative');
    const [visibility, setVisibility] = useState('lgu_internal');
    const [file, setFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);
    const [submissionError,setSubmissionError]=useState('');
    const [inspectingId,setInspectingId]=useState<string|null>(null);

    const matching = attachments.filter(
        (item) => item.parentType === parentType && item.parentRecordId != null && item.parentRecordId === parentRecordId,
    );
    const historical = attachments.filter(item => item.parentType === parentType && item.parentRecordId == null);
    const inspecting=matching.find(attachment=>attachment.publicId===inspectingId)??null;

    const handleUpload = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!file || !title.trim() || busy) return;

        setSubmissionError('');
        setBusy(true);
        const formData = new FormData();
        formData.append('parent_type', parentType);
        formData.append('parent_code', parentCode);
        formData.append('title', title.trim());
        formData.append('category', category);
        formData.append('visibility', visibility);
        formData.append('file', file);

        router.post('/planning/attachments', formData, {
            preserveScroll: true,
            onSuccess: () => {
                setTitle('');
                setFile(null);
                setShowUpload(false);
            },
            onError: errors=>setSubmissionError(Object.values(errors).join(' ')),
            onFinish: () => setBusy(false),
        });
    };

    const handleRemove = (publicId: string) => {
        if (busy) return;
        setBusy(true);
        router.delete(`/planning/attachments/${publicId}`, {
            preserveScroll: true,
            onFinish: () => setBusy(false),
        });
    };

    return (
        <section
            aria-label="Supporting documents"
            className="mt-4 rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface-muted)] p-3"
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.06em] text-[var(--municipal-text)]">
                        Supporting Documents ({matching.length})
                    </h3>
                    <p className="text-[11px] text-[var(--municipal-muted)]">
                        Server-stored private planning files with role and office visibility boundaries.
                    </p>
                </div>
                {canUpload && (
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon={<Upload className="h-3.5 w-3.5" />}
                        onClick={() => setShowUpload((prev) => !prev)}
                    >
                        {showUpload ? 'Cancel Upload' : 'Attach File'}
                    </Button>
                )}
            </div>

            {showUpload && canUpload && (
                <DocumentUploadStudio error={submissionError} title={title} category={category} visibility={visibility}
                    onTitleChange={setTitle} onCategoryChange={setCategory} onVisibilityChange={setVisibility}
                    onFileChange={setFile} onSubmit={handleUpload} onCancel={()=>setShowUpload(false)} busy={busy}
                    categories={Object.entries(categoryLabels).map(([value,label])=>({value,label}))}
                    visibilities={Object.entries(visibilityLabels).filter(([value])=>value!=='mpdc_executive'||canManageExecutive).map(([value,label])=>({value,label}))}
                    accept=".pdf,.png,.jpg,.jpeg,.csv,.txt" fileLabel="File (PDF, PNG, JPG, CSV, TXT · max 10 MB)"
                    selectedFileLabel={file?.name} submitLabel="Upload to Private Storage" />
            )}

            {matching.length === 0 ? (
                <p className="mt-2.5 text-xs text-[var(--municipal-muted)]">
                    No verified supporting documents attached for {parentCode}.
                </p>
            ) : (
                <ul className="mt-2.5 space-y-2">
                    {matching.map((doc) => (
                        <SupportingDocumentCard key={doc.publicId} title={doc.title} badges={<><span className="rounded-full border border-[var(--border-control)] px-2 py-1 text-xs font-bold">{categoryLabels[doc.category] ?? doc.category}</span><span className="text-xs font-semibold">{visibilityLabels[doc.visibility] ?? doc.visibility}</span></>} metadata={<>{doc.fileName} · {new Intl.NumberFormat('en-PH').format(doc.sizeBytes)} bytes</>} actions={<>
                                <button type="button" onClick={()=>setInspectingId(doc.publicId)} className="municipal-secondary-button">Inspect metadata</button>
                                <a
                                    href={doc.previewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex min-h-11 items-center gap-1 rounded border border-[var(--municipal-border-strong)] px-2.5 text-xs font-semibold text-[var(--brand-ink)] hover:bg-[var(--municipal-hover)]"
                                >
                                    <Eye className="h-3 w-3" aria-hidden="true" /> Preview
                                    <span className="sr-only"> {doc.title} (opens in a new tab)</span>
                                </a>

<a
                                    href={doc.downloadUrl}
                                    className="inline-flex min-h-11 items-center rounded border border-[var(--municipal-border-strong)] px-2.5 text-[11px] font-semibold text-[var(--municipal-text)] hover:bg-[var(--municipal-hover)]"
                                >
                                    Download
                                </a>

{(doc.canArchive ?? canDelete) && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(doc.publicId)}
                                        className="inline-flex min-h-11 items-center gap-1 rounded border border-red-300 px-2 text-[11px] font-semibold text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300"
                                        aria-label={`Remove ${doc.title}`}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                )}
</>} />
                    ))}
                </ul>
            )}

            {historical.length > 0 && <section aria-label="Historical documents requiring reconciliation"><a className="municipal-secondary-button" href="/planning/attachment-custody">Planning document custody</a><h4>Historical documents — parent association requires reconciliation</h4>{historical.map(doc => <p key={doc.publicId}>{doc.title} ({doc.parentCode}) <a href={doc.previewUrl} target="_blank" rel="noopener noreferrer">Preview</a> <a href={doc.downloadUrl}>Download</a></p>)}</section>}
            {inspecting && <DocumentPreviewPresentation key={inspecting.publicId} metadataOnly attachment={{title:inspecting.title,controlRef:inspecting.publicId,filename:inspecting.fileName,formatLabel:inspecting.fileName.split('.').pop()?.toUpperCase()??inspecting.mimeType,sizeLabel:`${new Intl.NumberFormat('en-PH').format(inspecting.sizeBytes)} bytes`,visibility:inspecting.visibility,uploadedAt:inspecting.createdAt??'',uploadedBy:'Not supplied by current record',previewFields:[['Parent reference',inspecting.parentCode],['MIME type',inspecting.mimeType],['Category',categoryLabels[inspecting.category]??inspecting.category]]}} onClose={()=>setInspectingId(null)} categoryMeta={{label:categoryLabels[inspecting.category]??inspecting.category,tone:'info'}} visibilityMeta={{label:visibilityLabels[inspecting.visibility]??inspecting.visibility,shortLabel:visibilityLabels[inspecting.visibility]??inspecting.visibility}} nativePreviewUrl={inspecting.previewUrl} onDownload={()=>window.location.assign(inspecting.downloadUrl)} />}
        </section>
    );
}
