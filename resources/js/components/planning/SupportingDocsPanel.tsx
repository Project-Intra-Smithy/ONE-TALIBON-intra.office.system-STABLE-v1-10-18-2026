import { router } from '@inertiajs/react';
import { Eye, FileText, Trash2, Upload } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import Button from '../ui/Button';

export type ServerPlanningAttachment = {
    publicId: string;
    parentType: 'plan' | 'ppa' | 'map';
    parentCode: string;
    title: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    category: string;
    visibility: string;
    previewUrl: string;
    downloadUrl: string;
    createdAt?: string | null;
};

type Props = {
    parentType: 'plan' | 'ppa' | 'map';
    parentCode: string;
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

    const matching = attachments.filter(
        (item) => item.parentType === parentType && item.parentCode === parentCode,
    );

    const handleUpload = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!file || !title.trim() || busy) return;

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
                <form
                    onSubmit={handleUpload}
                    className="mt-3 space-y-2.5 rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-3 text-xs"
                >
                    <div className="grid gap-2 sm:grid-cols-2">
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            Document Title
                            <input
                                type="text"
                                required
                                maxLength={255}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Technical Narrative / POW"
                                className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                            />
                        </label>
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            Category
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                            >
                                {Object.entries(categoryLabels).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            Visibility Scope
                            <select
                                value={visibility}
                                onChange={(e) => setVisibility(e.target.value)}
                                className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                            >
                                <option value="lgu_internal">LGU Internal</option>
                                <option value="office_restricted">Office Restricted</option>
                                <option value="public_portal">Public Reference</option>
                                {canManageExecutive && (
                                    <option value="mpdc_executive">MPDC / Executive Only</option>
                                )}
                            </select>
                        </label>
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            File (PDF, PNG, JPG, CSV · max 10 MB)
                            <input
                                type="file"
                                required
                                accept=".pdf,.png,.jpg,.jpeg,.csv,.txt"
                                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                className="mt-1 block min-h-9 w-full text-xs text-[var(--municipal-text)]"
                            />
                        </label>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" variant="primary" size="sm" loading={busy}>
                            Upload to Private Storage
                        </Button>
                    </div>
                </form>
            )}

            {matching.length === 0 ? (
                <p className="mt-2.5 text-xs text-[var(--municipal-muted)]">
                    No authorized supporting documents attached for {parentCode}.
                </p>
            ) : (
                <ul className="mt-2.5 space-y-2">
                    {matching.map((doc) => (
                        <li
                            key={doc.publicId}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-3 py-2 text-xs"
                        >
                            <div className="min-w-0">
                                <p className="flex items-center gap-1.5 font-semibold text-[var(--municipal-text)]">
                                    <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--municipal-brand)]" />
                                    <span className="truncate">{doc.title}</span>
                                </p>
                                <p className="mt-0.5 text-[11px] text-[var(--municipal-muted)]">
                                    {doc.fileName} · {categoryLabels[doc.category] ?? doc.category} ·{' '}
                                    {visibilityLabels[doc.visibility] ?? doc.visibility}
                                </p>
                            </div>
                            <div className="flex items-center flex-wrap gap-2">
                                <a
                                    href={doc.previewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex min-h-11 items-center gap-1 rounded border border-[var(--municipal-border-strong)] px-2.5 text-xs font-semibold text-[var(--municipal-brand)] hover:bg-[var(--municipal-hover)]"
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
                                {canDelete && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(doc.publicId)}
                                        className="inline-flex min-h-11 items-center gap-1 rounded border border-red-300 px-2 text-[11px] font-semibold text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300"
                                        aria-label={`Remove ${doc.title}`}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

        </section>
    );
}
