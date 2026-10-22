import { Link, router } from '@inertiajs/react';
import {
    ArrowUpRight,
    Download,
    FileArchive,
    FileText,
    Inbox,
    Search,
    Send,
    UploadCloud,
    X,
} from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { fileCatalogQuery, fileSizeLabel, safeDownloadHref, safeInternalHref } from './documentCenterNavigation';

type Office = { id: number; code: string; name: string; shortName?: string | null };

export type ArchiveItem = {
    publicId: string;
    name: string;
    title: string;
    documentType: string;
    documentTypeValue: string;
    classification: string;
    classificationValue: string;
    sizeBytes?: number | null;
    ownerOffice?: Office | null;
    uploadedBy?: string | null;
    uploadedByMe: boolean;
    uploadedAt?: string | null;
    relationship: string;
    relationshipValue?: string | null;
    direction: 'sent' | 'received' | 'upload' | 'visible';
    relatedType?: string | null;
    relatedReference?: string | null;
    relatedTitle?: string | null;
    relatedUrl?: string | null;
    originOffice?: Office | null;
    currentOffice?: Office | null;
    downloadUrl: string;
};

export type ArchiveWorkspace = {
    records: {
        data: ArchiveItem[];
        total: number;
        current_page: number;
        last_page: number;
        per_page: number;
        from?: number | null;
        to?: number | null;
    };
    selected?: ArchiveItem | null;
    counts: {
        all: number;
        my_sent: number;
        my_received: number;
        my_uploads: number;
    };
    filters: {
        archive_scope: string;
        archive_search: string;
        document_type: string;
        classification: string;
        archive_office_id?: number | null;
        archive_year: string;
        document?: string | null;
    };
    filterOptions: {
        documentTypes: string[];
        classifications: string[];
        years: string[];
        offices: Office[];
    };
};

const scopeCards = [
    { key: 'all', label: 'All Files', icon: FileArchive, tone: 'bg-[#eef8f1] text-[#17633f]' },
    { key: 'my_sent', label: 'My Sent Files', icon: Send, tone: 'bg-[#f5f0ff] text-[#7150a8]' },
    { key: 'my_received', label: 'My Received Files', icon: Inbox, tone: 'bg-[#eef9f8] text-[#247874]' },
    { key: 'my_uploads', label: 'My Uploads', icon: UploadCloud, tone: 'bg-[#eef5ff] text-[#265fa8]' },
] as const;

const formatDate = (value?: string | null) => {
    if (!value) return 'Not supplied';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const directionLabel = (item: ArchiveItem) => {
    if (item.direction === 'sent') {
        return item.currentOffice ? `Sent / current: ${item.currentOffice.shortName || item.currentOffice.name}` : 'Sent file';
    }
    if (item.direction === 'received') {
        return item.originOffice ? `Received from: ${item.originOffice.shortName || item.originOffice.name}` : 'Received file';
    }
    if (item.uploadedByMe) return 'Uploaded by you';
    return 'Authorized file';
};

export default function DocumentArchive({ archive }: { archive: ArchiveWorkspace }) {
    const [search, setSearch] = useState(archive.filters.archive_search);
    const [documentType, setDocumentType] = useState(archive.filters.document_type);
    const [classification, setClassification] = useState(archive.filters.classification);
    const [officeId, setOfficeId] = useState(archive.filters.archive_office_id ? String(archive.filters.archive_office_id) : '');
    const [year, setYear] = useState(archive.filters.archive_year);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setSearch(archive.filters.archive_search);
        setDocumentType(archive.filters.document_type);
        setClassification(archive.filters.classification);
        setOfficeId(archive.filters.archive_office_id ? String(archive.filters.archive_office_id) : '');
        setYear(archive.filters.archive_year);
    }, [archive.filters]);

    type Navigation = { archive_scope?: string; page?: number; document?: string | null };
    type Draft = { search: string; documentType: string; classification: string; officeId: string; year: string };
    const navigate = (overrides: Navigation = {}, nextDraft?: Draft) => {
        const values = nextDraft ?? { search, documentType, classification, officeId, year };
        const scoped = { ...archive.filters, archive_scope: overrides.archive_scope ?? archive.filters.archive_scope };
        const page = overrides.page ?? archive.records.current_page;
        const document = overrides.document === undefined ? archive.filters.document : overrides.document;
        setError(null);
        router.get('/documents', fileCatalogQuery(scoped, values, page, document), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onStart: () => setLoading(true),
            onError: () => setError('The file catalog could not be loaded. Current results have been retained.'),
            onFinish: () => setLoading(false),
        });
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!loading) navigate({ page: 1, document: null });
    };

    const clear = () => {
        const cleared = { search: '', documentType: '', classification: '', officeId: '', year: '' };
        setSearch('');
        setDocumentType('');
        setClassification('');
        setOfficeId('');
        setYear('');
        navigate({ page: 1, document: null }, cleared);
    };

    const activeFilters = [search, documentType, classification, officeId, year].filter(Boolean).length;
    const selected = archive.selected;
    const relatedHref = safeInternalHref(selected?.relatedUrl);
    const downloadHref = safeDownloadHref(selected?.downloadUrl);

    return (
        <div className="space-y-3" aria-busy={loading}>
            <section aria-labelledby="archive-scope-heading">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                    <h2 id="archive-scope-heading" className="text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">File catalog scopes</h2>
                    <span className="text-[9px] text-[var(--municipal-muted)]">{archive.counts.all} authorized file{archive.counts.all === 1 ? '' : 's'}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {scopeCards.map((scope) => {
                        const Icon = scope.icon;
                        const active = archive.filters.archive_scope === scope.key || (!archive.filters.archive_scope && scope.key === 'all');
                        const count = archive.counts[scope.key];

                        return (
                            <button
                                key={scope.key}
                                type="button"
                                onClick={() => navigate({ archive_scope: scope.key, page: 1, document: null })}
                                aria-pressed={active}
                                disabled={loading}
                                className={`min-h-[70px] rounded-lg border p-2.5 text-left transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)] ${scope.tone} ${active ? 'ring-2 ring-inset ring-current/25' : 'border-[var(--municipal-border)]'}`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <Icon size={16} aria-hidden="true" />
                                    <strong className="text-lg leading-none">{count}</strong>
                                </div>
                                <div className="mt-1.5 text-[11px] font-bold">{scope.label}</div>
                            </button>
                        );
                    })}
                </div>
            </section>

            <form onSubmit={submit} className="municipal-panel p-2.5" aria-label="Archive filters">
                <div className="grid gap-2 lg:grid-cols-[minmax(260px,2fr)_repeat(4,minmax(120px,1fr))_auto] lg:items-end">
                    <label className="block min-w-0">
                        <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Search files</span>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--municipal-muted)]" size={14} aria-hidden="true" />
                            <input value={search} maxLength={160} onChange={(event) => setSearch(event.target.value)} placeholder="Filename, record, office..." className="min-h-10 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] pl-9 pr-3 text-xs outline-none focus:border-[var(--municipal-focus)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20" />
                        </div>
                    </label>

                    <label className="block min-w-0">
                        <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Type</span>
                        <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="min-h-10 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2 text-xs">
                            <option value="">All types</option>
                            {archive.filterOptions.documentTypes.map((value) => <option key={value} value={value}>{value}</option>)}
                        </select>
                    </label>

                    <label className="block min-w-0">
                        <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Classification</span>
                        <select value={classification} onChange={(event) => setClassification(event.target.value)} className="min-h-10 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2 text-xs">
                            <option value="">All classes</option>
                            {archive.filterOptions.classifications.map((value) => <option key={value} value={value}>{value}</option>)}
                        </select>
                    </label>

                    <label className="block min-w-0">
                        <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Owner office</span>
                        <select value={officeId} onChange={(event) => setOfficeId(event.target.value)} className="min-h-10 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2 text-xs">
                            <option value="">All offices</option>
                            {archive.filterOptions.offices.map((office) => <option key={office.id} value={office.id}>{office.shortName || office.name}</option>)}
                        </select>
                    </label>

                    <label className="block min-w-0">
                        <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Year</span>
                        <select value={year} onChange={(event) => setYear(event.target.value)} className="min-h-10 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2 text-xs">
                            <option value="">All years</option>
                            {archive.filterOptions.years.map((value) => <option key={value}>{value}</option>)}
                        </select>
                    </label>

                    <div className="flex gap-1.5">
                        <button disabled={loading} className="min-h-10 rounded-md bg-[var(--municipal-brand-deep)] px-3 text-xs font-bold text-white">Apply{activeFilters ? ` · ${activeFilters}` : ''}</button>
                        <button type="button" onClick={clear} disabled={loading} aria-label="Clear file filters" className="flex min-h-10 min-w-10 items-center justify-center rounded-md border border-[var(--municipal-border)] text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)]"><X size={14} /></button>
                    </div>
                </div>
            </form>

            <p className="text-[11px] leading-relaxed text-[var(--municipal-muted)]">This is an authorized file catalog. A linked file is not evidence of formal records archival, transfer or custody acceptance.</p>
            <div role="status" aria-live="polite" className="text-xs text-[var(--municipal-muted)]">{loading ? 'Loading authorized files…' : archive.records.total + ' file' + (archive.records.total === 1 ? '' : 's') + ' found'}</div>
            {error && <div role="alert" className="rounded-md border border-[var(--municipal-border)] p-3 text-xs">{error}<button type="button" onClick={() => navigate()} className="ml-2 font-bold text-[var(--municipal-brand)]">Retry</button></div>}

            <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.65fr)]">
                <section className="municipal-panel overflow-hidden" aria-label="Document archive">
                    <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2">
                        <div>
                            <h2 className="text-xs font-bold text-[var(--municipal-text)]">Files</h2>
                            <p className="text-[9px] text-[var(--municipal-muted)]">Protected documents linked to authorized municipal work</p>
                        </div>
                        <span className="text-[10px] text-[var(--municipal-muted)]">{archive.records.total} file{archive.records.total === 1 ? '' : 's'}</span>
                    </header>

                    <div className="hidden grid-cols-[minmax(0,2fr)_minmax(120px,.8fr)_minmax(120px,1fr)_90px] gap-3 border-b border-[var(--municipal-border)] px-3 py-2 text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)] lg:grid">
                        <span>File / related record</span><span>Direction</span><span>File metadata</span><span>Action</span>
                    </div>

                    <div className="divide-y divide-[var(--municipal-border)]">
                        {archive.records.data.map((item) => {
                            const active = selected?.publicId === item.publicId;
                            return (
                                <article key={item.publicId} className={`grid min-w-0 gap-2 px-3 py-2.5 lg:grid-cols-[minmax(0,2fr)_minmax(120px,.8fr)_minmax(120px,1fr)_90px] lg:items-center ${active ? 'bg-[var(--municipal-selected-bg)]' : 'hover:bg-[var(--municipal-hover)]'}`}>
                                    <button type="button" onClick={() => navigate({ document: item.publicId })} disabled={loading} aria-pressed={active} aria-label={'Inspect file: ' + item.name} className="min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)]">
                                        <div className="flex min-w-0 items-start gap-2">
                                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--municipal-brand-soft)] text-[var(--municipal-brand)]"><FileText size={14} aria-hidden="true" /></div>
                                            <div className="min-w-0">
                                                <div className="truncate text-[11px] font-bold text-[var(--municipal-text)]">{item.name}</div>
                                                <div className="mt-0.5 truncate text-[9px] text-[var(--municipal-muted)]">{item.relatedReference || item.relatedTitle || item.title}</div>
                                            </div>
                                        </div>
                                    </button>
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-semibold text-[var(--municipal-text)]">{directionLabel(item)}</div>
                                        <div className="mt-0.5 truncate text-[9px] text-[var(--municipal-muted)]">{item.relationship}</div>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="truncate text-[10px] font-semibold text-[var(--municipal-text)]">{item.documentType}</div>
                                        <div className="mt-0.5 truncate text-[9px] text-[var(--municipal-muted)]">{item.classification} · {formatDate(item.uploadedAt)}</div>
                                    </div>
                                    <div className="flex items-center justify-end gap-1">
                                        <button type="button" onClick={() => navigate({ document: item.publicId })} disabled={loading} className="inline-flex min-h-9 items-center px-2 text-[10px] font-bold text-[var(--municipal-brand)]">Details</button>
                                    </div>
                                </article>
                            );
                        })}

                        {!archive.records.data.length ? (
                            <div className="px-4 py-8 text-center">
                                <FileArchive className="mx-auto text-[var(--municipal-muted)]" size={24} aria-hidden="true" />
                                <div className="mt-2 text-xs font-bold text-[var(--municipal-text)]">No authorized files match this view</div>
                                <div className="mt-1 text-[10px] text-[var(--municipal-muted)]">Change the scope or archive filters.</div>
                            </div>
                        ) : null}
                    </div>

                    {archive.records.last_page > 1 ? (
                        <nav className="flex items-center justify-between gap-3 border-t border-[var(--municipal-border)] px-3 py-2 text-[10px]" aria-label="Archive pages">
                            <button type="button" disabled={loading || archive.records.current_page <= 1} onClick={() => navigate({ page: archive.records.current_page - 1, document: null })} className="min-h-9 px-2 font-semibold text-[var(--municipal-brand)] disabled:opacity-40">Previous</button>
                            <span className="text-[var(--municipal-muted)]">Page {archive.records.current_page} of {archive.records.last_page}</span>
                            <button type="button" disabled={loading || archive.records.current_page >= archive.records.last_page} onClick={() => navigate({ page: archive.records.current_page + 1, document: null })} className="min-h-9 px-2 font-semibold text-[var(--municipal-brand)] disabled:opacity-40">Next</button>
                        </nav>
                    ) : null}
                </section>

                <aside className="municipal-panel self-start overflow-hidden xl:sticky xl:top-20" aria-label="File metadata">
                    <header className="border-b border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2">
                        <h2 className="text-xs font-bold">File metadata</h2>
                        <p className="text-[9px] text-[var(--municipal-muted)]">Access-controlled file details and linked work</p>
                    </header>

                    {selected ? (
                        <div className="p-3">
                            <div className="flex items-start gap-2">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--municipal-brand-soft)] text-[var(--municipal-brand)]"><FileText size={16} aria-hidden="true" /></div>
                                <div className="min-w-0">
                                    <div className="break-words text-[12px] font-bold text-[var(--municipal-text)]">{selected.name}</div>
                                    <div className="mt-0.5 text-[9px] text-[var(--municipal-muted)]">{selected.documentType} · {selected.classification}</div>
                                </div>
                            </div>

                            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
                                <div><dt className="text-[9px] uppercase tracking-wide text-[var(--municipal-muted)]">Owner office</dt><dd className="mt-0.5 text-[10px] font-semibold">{selected.ownerOffice?.shortName || selected.ownerOffice?.name || 'Not supplied'}</dd></div>
                                <div><dt className="text-[9px] uppercase tracking-wide text-[var(--municipal-muted)]">Uploaded by</dt><dd className="mt-0.5 text-[10px] font-semibold">{selected.uploadedBy || 'Not supplied'}</dd></div>
                                <div><dt className="text-[9px] uppercase tracking-wide text-[var(--municipal-muted)]">Uploaded</dt><dd className="mt-0.5 text-[10px] font-semibold">{formatDate(selected.uploadedAt)}</dd></div>
                                <div><dt className="text-[9px] uppercase tracking-wide text-[var(--municipal-muted)]">Size</dt><dd className="mt-0.5 text-[10px] font-semibold">{fileSizeLabel(selected.sizeBytes)}</dd></div>
                                <div><dt className="text-[9px] uppercase tracking-wide text-[var(--municipal-muted)]">Relationship</dt><dd className="mt-0.5 text-[10px] font-semibold">{selected.relationship}</dd></div>
                                <div><dt className="text-[9px] uppercase tracking-wide text-[var(--municipal-muted)]">File context</dt><dd className="mt-0.5 text-[10px] font-semibold">{directionLabel(selected)}</dd></div>
                            </dl>

                            {selected.relatedTitle || selected.relatedReference ? (
                                <div className="mt-3 border-t border-[var(--municipal-border)] pt-3">
                                    <div className="text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Related municipal record</div>
                                    <div className="mt-1 text-[11px] font-bold text-[var(--municipal-text)]">{selected.relatedTitle || selected.relatedReference}</div>
                                    {selected.relatedReference ? <div className="mt-0.5 text-[9px] text-[var(--municipal-muted)]">{selected.relatedReference}</div> : null}
                                </div>
                            ) : null}

                            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                                {relatedHref ? (
                                    <Link href={relatedHref} className="inline-flex min-h-10 items-center justify-between rounded-md border border-[var(--municipal-border)] px-3 text-[10px] font-bold text-[var(--municipal-brand)] hover:bg-[var(--municipal-hover)]">
                                        Open record <ArrowUpRight size={13} aria-hidden="true" />
                                    </Link>
                                ) : null}
                                {downloadHref ? <a href={downloadHref} className="inline-flex min-h-10 items-center justify-between rounded-md bg-[var(--municipal-brand-deep)] px-3 text-[10px] font-bold text-white">
                                    Download file <Download size={13} aria-hidden="true" />
                                </a> : <span className="text-[10px] text-[var(--municipal-muted)]">No authorized download link supplied.</span>}
                            </div>
                        </div>
                    ) : (
                        <div className="px-4 py-8 text-center">
                            <FileText className="mx-auto text-[var(--municipal-muted)]" size={22} aria-hidden="true" />
                            <p className="mt-2 text-[10px] text-[var(--municipal-muted)]">Select a file to inspect its metadata and related record.</p>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
